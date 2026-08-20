import { loadThresholdConfig } from './config.js';
import { claimJob, completeJob } from './queue.js';
import { buildReport, summarize, writeReport, RUNNER_VERSION } from './report/build.js';
import { runSmokeSuite } from './suites/smoke.js';
import { getCompletionConfig, postCompletion } from './callback.js';

export interface RunOptions {
  configPath?: string;
  outDir: string;
}

/**
 * Fixture mode (--url): no database. Runs the suites against a URL and writes
 * report.json locally. This is how the loop is proven before CI wiring (M4).
 */
export async function runFixture(url: string, opts: RunOptions): Promise<number> {
  const config = loadThresholdConfig(opts.configPath);
  const startedAt = new Date();
  const smoke = await runSmokeSuite(url, config);
  const report = buildReport({
    submissionId: null,
    jobId: null,
    artifactSha256: null,
    config,
    startedAt,
    finishedAt: new Date(),
    smoke,
  });

  const path = writeReport(report, opts.outDir);
  console.log(`forge-qa: fixture ${url} → ${summarize(report)}`);
  console.log(`forge-qa: report written to ${path}`);
  return exitCodeFor(report.verdict);
}

/**
 * Job mode (--job): claim a queued qa_job from Supabase, run the suites
 * against its submission's preview URL, deliver the report to the app, write
 * report.json. Returns 0 when the job was already claimed (idempotent retry).
 *
 * Completion is the app's job: the runner POSTs the report to
 * /api/qa/complete (docs/qa-gate.md §11) and the app advances the submission,
 * records the report, marks the job done, and auto-publishes. Without
 * APP_BASE_URL/APP_INTERNAL_SECRET (local dev) it falls back to the direct
 * queue write so the loop still closes. A failed callback leaves the job
 * 'running' for the app's lazy reaper (qa-gate.md §10) and exits 2.
 */
export async function runJob(jobId: string, opts: RunOptions): Promise<number> {
  // Runner id = CI run_id + attempt (docs/qa-gate.md §10); recorded on the
  // claim so logs map to the run. Null outside CI (fixture/local dev).
  const claimed = await claimJob(jobId, process.env.RUNNER_ID);
  if (!claimed) {
    console.log(`forge-qa: job ${jobId} not claimable (already claimed, missing, or queue unconfigured)`);
    return 0;
  }

  const config = loadThresholdConfig(opts.configPath);
  const startedAt = new Date();
  console.log(`forge-qa: claimed job ${jobId} (submission ${claimed.submissionId})`);
  console.log(`forge-qa: testing ${claimed.previewUrl}`);

  const smoke = await runSmokeSuite(claimed.previewUrl, config);
  const report = buildReport({
    submissionId: claimed.submissionId,
    jobId,
    artifactSha256: claimed.artifactSha256,
    config,
    startedAt,
    finishedAt: new Date(),
    smoke,
  });

  const path = writeReport(report, opts.outDir);
  const callback = getCompletionConfig();
  if (callback) {
    const result = await postCompletion(jobId, report, callback);
    if (result.ok) {
      console.log(`forge-qa: ${summarize(report)}`);
      console.log(`forge-qa: completion delivered to the app (${JSON.stringify(result.outcome)})`);
      console.log(`forge-qa: report written to ${path}`);
      return exitCodeFor(report.verdict);
    }
    console.error(
      `forge-qa: completion callback failed after retries (${result.lastStatus}: ${result.lastError}) — job ${jobId} left for the app's reaper`,
    );
    return 2;
  }

  // Dev fallback: no app configured — close the job locally as before.
  console.warn('forge-qa: APP_BASE_URL/APP_INTERNAL_SECRET not set — completing the job directly (dev only)');
  await completeJob(jobId, report.verdict);
  console.log(`forge-qa: ${summarize(report)}`);
  console.log(`forge-qa: report written to ${path}`);
  return exitCodeFor(report.verdict);
}

function exitCodeFor(verdict: 'passed' | 'rejected' | 'error'): number {
  // 0 = passed, 1 = rejected (CI exit is informational — the DB is authoritative),
  // 2 = runner error.
  return verdict === 'passed' ? 0 : verdict === 'rejected' ? 1 : 2;
}

export { RUNNER_VERSION };
