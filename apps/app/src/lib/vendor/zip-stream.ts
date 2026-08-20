import { createHash } from 'node:crypto';
import { Transform } from 'node:stream';

/**
 * Pure, testable zip validation pipeline (docs/vendor-portal.md §7).
 *
 * A Transform that, while bytes stream through it: computes SHA-256 over the
 * whole stream, verifies the PK zip magic bytes on the first 4 bytes, and
 * enforces the size cap. Intentionally has zero Supabase/Next imports so it
 * can be unit-tested standalone.
 */

export const MAX_ZIP_BYTES = 50 * 1024 * 1024; // 50 MB

const ACCEPTED_CONTENT_TYPES = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream',
]);

/** Zip local-file header signature. */
const ZIP_HEADER_OFFSETS = [0x03, 0x05, 0x07] as const; // local file / empty archive / spanned

/** True when the first 4 bytes look like a zip (PK\x03\x04, PK\x05\x06, PK\x07\x08). */
export function isZipMagic(header: Buffer): boolean {
  if (header.length < 4) return false;
  if (header[0] !== 0x50 || header[1] !== 0x4b) return false;
  return (ZIP_HEADER_OFFSETS as readonly number[]).includes(header[2] as number);
}

/** Loose Content-Type gate — browsers send octet-stream as often as application/zip. */
export function isAcceptedZipContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const base = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
  return ACCEPTED_CONTENT_TYPES.has(base);
}

export type ZipValidationErrorCode = 'zip-magic' | 'too-large' | 'empty';

export class ZipValidationError extends Error {
  readonly code: ZipValidationErrorCode;
  constructor(code: ZipValidationErrorCode, message: string) {
    super(message);
    this.name = 'ZipValidationError';
    this.code = code;
  }
}

export interface ZipValidationResult {
  artifactSha256: string;
  sizeBytes: number;
}

export interface ZipValidator {
  transform: Transform;
  /** Call after the stream ends. Throws ZipValidationError on invalid input. */
  result(): ZipValidationResult;
}

export function createZipValidator(): ZipValidator {
  const hash = createHash('sha256');
  let sizeBytes = 0;
  let header = Buffer.alloc(0);
  let rejected: ZipValidationError | null = null;

  const transform = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      try {
        if (rejected) {
          callback(rejected);
          return;
        }
        // Hash and count everything — including the magic bytes themselves.
        hash.update(chunk);
        sizeBytes += chunk.length;
        if (sizeBytes > MAX_ZIP_BYTES) {
          rejected = new ZipValidationError(
            'too-large',
            `Zip exceeds the ${MAX_ZIP_BYTES} byte cap.`,
          );
          callback(rejected);
          return;
        }
        if (header.length < 4) {
          const need = 4 - header.length;
          header = Buffer.concat([header, chunk.subarray(0, Math.min(need, chunk.length))]);
          if (header.length === 4 && !isZipMagic(header)) {
            rejected = new ZipValidationError('zip-magic', 'Not a zip file (bad magic bytes).');
            callback(rejected);
            return;
          }
        }
        callback(null, chunk);
      } catch (error) {
        callback(error as Error);
      }
    },
  });

  return {
    transform,
    result(): ZipValidationResult {
      if (rejected) throw rejected;
      if (sizeBytes < 4) {
        throw new ZipValidationError('empty', 'Zip is empty or too short to be a zip.');
      }
      return { artifactSha256: hash.digest('hex'), sizeBytes };
    },
  };
}
