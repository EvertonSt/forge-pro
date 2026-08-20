import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SubmissionSchema, type QaRunReport } from '@forge-pro/shared-types';
import { SUBMISSION_SELECT } from './queries';
import { dispatchQaJob, getGateMaxAttempts } from './dispatch';
import { publishSubmission } from './publish';

/**
 * The app's half of a QA run — docs/vendor-portal.md §8.
 *
 * Called by the runner via POST /api/qa/complete. The runner delivers the
 * full report; the app is the only component that advances the submission,
 * inserts the quality report row, and writes Sanity.
 *
 * Idempotency: a qa_reports row already existing for the job means this
 * completion was already processed → no-op. Error verdicts are retryable run
 * failures, never quality verdicts, so they produce no report row.
 */

export interface QaCompleteOutcome {
  processed: boolean;
  skipped?: string;
  published?: boolean;
  publishError?: string;
}

export async function handleQaComplete(
  db: SupabaseClient,
  jobId: string,
  report: QaRunReport,
): Promise<QaCompleteOutcome> {
  const { data: job, error: jobError } = await db
    .from('qa_jobs')
    .select('id, submission_id, attempts')
    .eq('id', jobId)
    .single();
  if (jobError || !job) {
    throw new Error(`qa_jobs: ${jobError?.message ?? 'job not found'}`);
  }

  // Idempotency guard — a report for this job means it was already handled.
  const { data: existingReport } = await db
    .from('qa_reports')
    .select('id')
    .eq('job_id', jobId)
    .maybeSingle();
  if (existingReport) {
    return { processed: false, skipped: 'report already processed' };
  }

  const { data: row } = await db
    .from('submissions')
    .select(SUBMISSION_SELECT)
    .eq('id', job.submission_id)
    .single();
  if (!row) {
    throw new Error(`Submission ${job.submission_id} not found.`);
  }
  const submission = SubmissionSchema.parse(row);

  // Guard: completions only advance a submission that is actually in review.
  if (submission.status !== 'submitted') {
    return { processed: false, skipped: `submission is ${submission.status}, not submitted` };
  }

  // Error verdict — retryable run failure, no quality report.
  if (report.verdict === 'error') {
    const attempts = (job.attempts ?? 0) + 1;
    if (attempts < getGateMaxAttempts()) {
      await db
        .from('qa_jobs')
        .update({ status: 'queued', attempts, started_at: null, finished_at: null, error_message: null })
        .eq('id', jobId);
      await dispatchQaJob(jobId);
      return { processed: true };
    }
    await db.from('qa_jobs').update({ status: 'error', attempts }).eq('id', jobId);
    return { processed: true };
  }

  // Quality verdict: record the report and advance the submission.
  const reportId = randomUUID();
  const { error: insertError } = await db
    .from('qa_reports')
    .insert(mapReportToQaReportRow(report, job.submission_id, jobId, reportId));
  if (insertError) {
    throw new Error(`qa_reports insert failed: ${insertError.message}`);
  }

  const next = report.verdict === 'passed' ? 'qa_passed' : 'qa_rejected';
  const { error: updateError } = await db
    .from('submissions')
    .update({ status: next, current_qa_report_id: reportId })
    .eq('id', submission.id);
  if (updateError) {
    throw new Error(`submission update failed: ${updateError.message}`);
  }

  // Mark the job done — the runner delivers the report and moves on; the app
  // is the only component that completes jobs (docs/qa-gate.md §11).
  await db
    .from('qa_jobs')
    .update({ status: report.verdict, finished_at: new Date().toISOString() })
    .eq('id', jobId);

  if (report.verdict === 'passed') {
    // Auto-publish (idempotent; a failure leaves the submission qa_passed
    // with the portal offering "retry publish").
    const result = await publishSubmission(db, submission.id, report);
    return { processed: true, published: result.published, publishError: result.error };
  }
  return { processed: true };
}

/** Map the full report artifact to the qa_reports row (pure, testable). */
export function mapReportToQaReportRow(
  report: QaRunReport,
  submissionId: string,
  jobId: string,
  reportId: string,
): Record<string, unknown> {
  // links/visual/lighthouse suites land in M2/M3 — read tolerantly.
  const visual = (report.suites as { visual?: { diffPct?: number | null; isBaseline?: boolean } }).visual;
  const links = (report.suites as { links?: { broken?: string[]; total?: number } }).links;
  return {
    id: reportId,
    submission_id: submissionId,
    job_id: jobId,
    status: report.verdict,
    composite_score: report.compositeScore,
    scores: report.scores,
    visual_diff_pct: visual?.diffPct ?? null,
    link_scan: { broken: links?.broken ?? [], total: links?.total ?? 0 },
    threshold_snapshot: report.thresholds,
    is_baseline: visual?.isBaseline ?? false,
    report_html_url: (report.artifacts['htmlReport'] as string | undefined) ?? null,
    screenshots: (report.artifacts['screenshots'] as string[] | undefined) ?? [],
    created_at: new Date().toISOString(),
  };
}
