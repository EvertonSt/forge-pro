import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { getSupabase } from '@forge-pro/db';
import {
  createZipValidator,
  isAcceptedZipContentType,
  ZipValidationError,
} from './zip-stream';

/**
 * Streamed zip upload (docs/vendor-portal.md §7).
 *
 * The request body (raw binary, Content-Type: application/zip) is piped
 * through the validation transform and spooled to a temp file — memory stays
 * bounded. Only after every check passes is anything written to storage, so a
 * rejected file never touches the bucket. The server computes SHA-256; the
 * client never dictates the hash.
 */

export class UploadError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'UploadError';
    this.status = status;
  }
}

/** Upload is only valid while the submission is still being prepared. */
const ALLOWED_UPLOAD_STATUSES = new Set(['draft', 'qa_rejected']);

export interface ZipUploadResult {
  artifactSha256: string;
  sizeBytes: number;
  /** Storage object key in the vendor-uploads bucket. */
  zipUrl: string;
}

export async function handleZipUpload(
  body: ReadableStream<Uint8Array>,
  contentType: string | null,
  submissionId: string,
): Promise<ZipUploadResult> {
  const db = getSupabase();
  if (!db) {
    throw new UploadError(503, 'Storage is not configured (SUPABASE_URL missing).');
  }
  if (!isAcceptedZipContentType(contentType)) {
    throw new UploadError(415, 'Content-Type must be application/zip (or octet-stream).');
  }

  const { data: submission, error: fetchError } = await db
    .from('submissions')
    .select('id, status')
    .eq('id', submissionId)
    .single();
  if (fetchError || !submission) {
    throw new UploadError(404, 'Submission not found.');
  }
  if (!ALLOWED_UPLOAD_STATUSES.has(submission.status)) {
    throw new UploadError(
      409,
      `Cannot upload while the submission is ${submission.status}. Re-uploads are allowed for drafts and rejected submissions.`,
    );
  }

  const dir = await mkdtemp(join(tmpdir(), 'forge-upload-'));
  const tmpPath = join(dir, 'source.zip');
  try {
    // 1. Stream the body through validation into a temp file (memory-bounded).
    // node:stream's ReadableStream and the DOM ReadableStream are distinct
    // types — bridge them at the boundary with an explicit cast.
    const validator = createZipValidator();
    const nodeStream = Readable.fromWeb(body as unknown as Parameters<typeof Readable.fromWeb>[0]);
    await pipeline(nodeStream, validator.transform, createWriteStream(tmpPath));
    const { artifactSha256, sizeBytes } = validator.result();

    // 2. Immutable key: the hash suffix preserves previous uploads.
    const key = `vendor-uploads/${submissionId}/source-${artifactSha256.slice(0, 12)}.zip`;
    const { error: uploadError } = await db.storage.from('vendor-uploads').upload(
      key,
      createReadStream(tmpPath),
      { contentType: 'application/zip', cacheControl: '3600', upsert: true },
    );
    if (uploadError) {
      throw new UploadError(502, `Storage upload failed: ${uploadError.message}`);
    }

    // 3. Record the artifact — the hash pins every future job/report.
    const { error: rowError } = await db
      .from('submissions')
      .update({ zip_url: key, artifact_sha256: artifactSha256 })
      .eq('id', submissionId);
    if (rowError) {
      throw new UploadError(502, `Failed to record upload: ${rowError.message}`);
    }

    return { artifactSha256, sizeBytes, zipUrl: key };
  } catch (error) {
    if (error instanceof ZipValidationError) throw error;
    if (error instanceof UploadError) throw error;
    throw new UploadError(500, `Upload failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
