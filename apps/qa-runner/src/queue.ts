import { getSupabase } from '@forge-pro/db';

/**
 * Queue access — docs/qa-gate.md §10.
 *
 * Tables follow the docs/architecture.md §3.1 contract (landing with the
 * Session 4 migrations):
 *
 *   qa_jobs(id uuid pk, submission_id uuid fk, artifact_sha256 text,
 *           status 'queued'|'running'|'passed'|'rejected'|'error',
 *           runner_id text, started_at timestamptz, finished_at timestamptz,
 *           error_message text, created_at timestamptz)
 *   submissions(id uuid pk, preview_url text, artifact_sha256 text, ...)
 *
 * The claim is a single atomic UPDATE ... WHERE id = $1 AND status = 'queued'
 * (PostgREST expresses it as update + eq + eq + select().single()) so a
 * re-delivered dispatch finds no row and becomes a harmless no-op. The
 * runner_id (docs/qa-gate.md §10: the GH Actions run_id + attempt number) is
 * recorded on the claim so logs map back to the run that produced them.
 */

export interface QueueJob {
  id: string;
  submissionId: string;
  previewUrl: string;
  artifactSha256: string | null;
}

/** True when Supabase credentials are configured (job mode is usable). */
export function hasQueue(): boolean {
  return getSupabase() !== null;
}

/**
 * Atomically claim a queued job. Returns null when the job is already claimed,
 * missing, or the queue isn't configured.
 */
export async function claimJob(jobId: string, runnerId?: string | null): Promise<QueueJob | null> {
  const db = getSupabase();
  if (!db) return null;

  const patch: Record<string, unknown> = {
    status: 'running',
    started_at: new Date().toISOString(),
  };
  if (runnerId) patch.runner_id = runnerId;

  const { data: job, error } = await db
    .from('qa_jobs')
    .update(patch)
    .eq('id', jobId)
    .eq('status', 'queued')
    .select('id, submission_id, artifact_sha256')
    .single();

  if (error || !job) {
    return null;
  }

  const { data: submission } = await db
    .from('submissions')
    .select('id, preview_url, artifact_sha256')
    .eq('id', job.submission_id)
    .single();

  if (!submission?.preview_url) {
    await completeJob(jobId, 'error', 'Submission has no preview_url.');
    return null;
  }

  return {
    id: job.id,
    submissionId: job.submission_id,
    previewUrl: submission.preview_url,
    artifactSha256: submission.artifact_sha256 ?? job.artifact_sha256,
  };
}

export async function completeJob(
  jobId: string,
  status: 'passed' | 'rejected' | 'error',
  errorMessage?: string
): Promise<void> {
  const db = getSupabase();
  if (!db) return;
  await db.from('qa_jobs').update({ status, finished_at: new Date().toISOString(), error_message: errorMessage ?? null }).eq('id', jobId);
}
