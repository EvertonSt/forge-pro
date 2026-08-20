import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ThresholdConfigSchema } from '@forge-pro/shared-types';

/**
 * Job creation + dispatch (docs/vendor-portal.md §8).
 *
 * Creates a queued qa_jobs row and asks GitHub Actions to run the QA gate on
 * it. Dispatch is env-gated: without GITHUB_REPO/GITHUB_TOKEN the job is left
 * queued with a warning (the queue claim makes a later dispatch harmless).
 */

const GATE_MAX_ATTEMPTS = ThresholdConfigSchema.parse({}).retry.maxAttempts;

export function getGateMaxAttempts(): number {
  return GATE_MAX_ATTEMPTS;
}

/** Create a queued job for a submission. Returns the job id. */
export async function createJobAndDispatch(
  db: SupabaseClient,
  submissionId: string,
  artifactSha256: string,
): Promise<string> {
  const jobId = randomUUID();
  const { error } = await db.from('qa_jobs').insert({
    id: jobId,
    submission_id: submissionId,
    artifact_sha256: artifactSha256,
    status: 'queued',
    attempts: 0,
  });
  if (error) {
    throw new Error(`Failed to create QA job: ${error.message}`);
  }
  await dispatchQaJob(jobId);
  return jobId;
}

/** Ask GitHub Actions to run the gate for a job. Returns whether a dispatch was sent. */
export async function dispatchQaJob(jobId: string): Promise<boolean> {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) {
    console.warn(`[dispatch] GITHUB_REPO/GITHUB_TOKEN not set — job ${jobId} left queued.`);
    return false;
  }
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': 'forge-pro-app',
      },
      body: JSON.stringify({ event_type: 'qa-run', client_payload: { jobId } }),
    });
    if (!response.ok) {
      console.error(`[dispatch] GitHub dispatch failed (${response.status}) for job ${jobId}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[dispatch] GitHub dispatch threw', error);
    return false;
  }
}
