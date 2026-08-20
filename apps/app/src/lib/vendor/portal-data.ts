/**
 * Vendor portal data layer — the single seam the portal pages read through.
 *
 * Demo mode (no Supabase configured): serves the static DEMO_* fixtures plus
 * anything the in-memory demo store has created, so the whole portal is
 * viewable and exercisable in dev. Real mode: queries Supabase through the
 * same aliased SELECT used by the API routes, so the UI renders exactly what
 * the mutations wrote. The two paths share DTO shapes (Submission + DemoJob)
 * — the UI never branches on where its data came from.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { QaRunReportSchema, ThresholdConfigSchema, type QaRunReport, type Submission } from '@forge-pro/shared-types';
import { getSupabase } from '@forge-pro/db';
import { SUBMISSION_SELECT, parseSubmission } from './queries';
import {
  DEMO_JOBS,
  DEMO_REPORTS_BY_JOB,
  DEMO_SCORE_BY_SUBMISSION,
  DEMO_SUBMISSIONS,
  type DemoJob,
} from './demo-data';
import { listDemoStoreSubmissions, demoJobForSubmission, findDemoReport } from './demo-store';

export interface SubmissionWithJob {
  submission: Submission;
  /** Latest job for the submission (null for drafts/withdrawn with no run). */
  job: DemoJob | null;
}

export function isDemoMode(): boolean {
  return getSupabase() === null;
}

// ---------------------------------------------------------------------------
// Real-mode helpers
// ---------------------------------------------------------------------------

function toDemoJob(row: Record<string, unknown>): DemoJob {
  return {
    id: String(row.id),
    submissionId: String(row.submission_id),
    status: (row.status as DemoJob['status']) ?? 'queued',
    attempts: Number(row.attempts ?? 0),
    createdAt: String(row.created_at),
    finishedAt: (row.finished_at as string | null) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Portal queries
// ---------------------------------------------------------------------------

/** Dashboard list: submissions for the vendor, with the latest job per row. */
export async function listVendorSubmissions(vendorId: string): Promise<SubmissionWithJob[]> {
  if (isDemoMode()) {
    const demo = DEMO_SUBMISSIONS.filter((s) => s.vendorId === vendorId);
    const storeSubs = listDemoStoreSubmissions();
    const all = [...storeSubs, ...demo];
    return all.map((submission) => {
      const storeJob = demoJobForSubmission(submission.id);
      if (storeJob) return { submission, job: storeJob };
      const jobs = DEMO_JOBS.filter((j) => j.submissionId === submission.id);
      const latest = jobs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0] ?? null;
      return { submission, job: latest };
    });
  }

  const db = getSupabase();
  if (!db) return [];
  return loadSubmissionsWithJobs(db, vendorId);
}

/**
 * Real-mode loader shared by the vendor dashboard (own rows) and the admin
 * submissions view (all rows): submissions + latest job per row.
 */
export async function loadSubmissionsWithJobs(
  db: SupabaseClient,
  vendorId?: string,
): Promise<SubmissionWithJob[]> {
  let query = db.from('submissions').select(SUBMISSION_SELECT).order('created_at', { ascending: false });
  if (vendorId) query = query.eq('vendor_id', vendorId);
  const { data: rows } = await query;
  if (!rows) return [];

  const submissions = rows.map(parseSubmission);
  const ids = submissions.map((s) => s.id);
  const { data: jobRows } = await db
    .from('qa_jobs')
    .select('id, submission_id, status, attempts, created_at, finished_at')
    .in('submission_id', ids)
    .order('created_at', { ascending: false });
  const latestBySubmission = new Map<string, DemoJob>();
  for (const row of jobRows ?? []) {
    const job = toDemoJob(row);
    if (!latestBySubmission.has(job.submissionId)) latestBySubmission.set(job.submissionId, job);
  }
  return submissions.map((submission) => ({
    submission,
    job: latestBySubmission.get(submission.id) ?? null,
  }));
}

export async function getSubmissionDetail(id: string): Promise<SubmissionWithJob | null> {
  if (isDemoMode()) {
    // All demo fixtures + store drafts, regardless of vendor id.
    const demo = DEMO_SUBMISSIONS.map((submission) => {
      const jobs = DEMO_JOBS.filter((j) => j.submissionId === submission.id).sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1,
      );
      return { submission, job: jobs[0] ?? null };
    });
    const storeSubs = listDemoStoreSubmissions().map((submission) => ({
      submission,
      job: demoJobForSubmission(submission.id),
    }));
    return [...storeSubs, ...demo].find((r) => r.submission.id === id) ?? null;
  }

  const db = getSupabase();
  if (!db) return null;
  const { data: row } = await db.from('submissions').select(SUBMISSION_SELECT).eq('id', id).single();
  if (!row) return null;
  const submission = parseSubmission(row);
  const { data: jobRows } = await db
    .from('qa_jobs')
    .select('id, submission_id, status, attempts, created_at, finished_at')
    .eq('submission_id', id)
    .order('created_at', { ascending: false });
  const jobs = (jobRows ?? []).map(toDemoJob);
  return { submission, job: jobs[0] ?? null };
}

/** All jobs for a submission, newest first (drives the timeline + job table). */
export async function listJobsForSubmission(submissionId: string): Promise<DemoJob[]> {
  if (isDemoMode()) {
    const fromFixture = DEMO_JOBS.filter((j) => j.submissionId === submissionId).sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
    const storeJob = demoJobForSubmission(submissionId);
    if (storeJob) {
      return [storeJob, ...fromFixture];
    }
    return fromFixture;
  }
  const db = getSupabase();
  if (!db) return [];
  const { data: rows } = await db
    .from('qa_jobs')
    .select('id, submission_id, status, attempts, created_at, finished_at')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: false });
  return (rows ?? []).map(toDemoJob);
}

/** The qa_reports row as PostgREST returns it (numeric columns come back as strings). */
interface QaReportRow {
  id: string;
  submission_id: string;
  job_id: string;
  status: 'passed' | 'rejected';
  composite_score: string | number | null;
  scores: Record<string, number | null>;
  visual_diff_pct: string | number | null;
  link_scan: { broken?: string[]; total?: number };
  threshold_snapshot: Record<string, unknown>;
  is_baseline: boolean;
  baseline_of: string | null;
  report_html_url: string | null;
  screenshots: string[];
  created_at: string;
  qa_jobs?: {
    started_at: string | null;
    finished_at: string | null;
    artifact_sha256: string | null;
    runner_id: string | null;
  };
}

/**
 * Map a qa_reports row to the report shape the portal renders. The full
 * artifact (smoke checks, narrative) lives in storage (docs/qa-gate.md §9);
 * this is the row-derived view — scores, verdict, links/visual/lighthouse
 * suites — so the portal works against live rows without a storage client.
 * Pure, so it's unit-testable.
 */
export function mapQaReportRowToView(row: QaReportRow): QaRunReport {
  const job = row.qa_jobs;
  const linkScan = row.link_scan ?? {};
  const suiteStatus = row.status === 'passed' ? ('passed' as const) : ('failed' as const);
  const composite = row.composite_score != null ? Number(row.composite_score) : null;
  const diffPct = row.visual_diff_pct != null ? Number(row.visual_diff_pct) : null;

  return QaRunReportSchema.parse({
    schemaVersion: 1,
    submissionId: row.submission_id,
    jobId: row.job_id,
    artifactSha256: job?.artifact_sha256 ?? null,
    runnerVersion: job?.runner_id ?? 'n/a',
    startedAt: job?.started_at ?? row.created_at,
    finishedAt: job?.finished_at ?? row.created_at,
    thresholds: ThresholdConfigSchema.parse(row.threshold_snapshot ?? {}),
    verdict: row.status,
    compositeScore: composite,
    scores: { performance: null, seo: null, accessibility: null, bestPractices: null, ...(row.scores ?? {}) },
    suites: {
      links: { status: suiteStatus, broken: linkScan.broken ?? [], total: linkScan.total ?? 0 },
      visual: { status: suiteStatus, diffPct, isBaseline: row.is_baseline },
      lighthouse: {
        status: suiteStatus,
        composite,
        lcp: null,
        cls: null,
        tbt: null,
      },
    },
    artifacts: {
      ...(row.report_html_url ? { htmlReport: row.report_html_url } : {}),
      ...(row.screenshots?.length ? { screenshots: row.screenshots } : {}),
    },
    aiNarrative: null,
  });
}

/**
 * The report view for a job. Demo mode resolves fixtures/store reports; real
 * mode builds the view from the qa_reports row (the full artifact still
 * needs the storage integration of qa-gate.md §9).
 */
export async function getReportForJob(jobId: string): Promise<QaRunReport | null> {
  if (isDemoMode()) {
    return findDemoReport(jobId) ?? DEMO_REPORTS_BY_JOB[jobId] ?? null;
  }
  const db = getSupabase();
  if (!db) return null;
  const { data: row } = await db
    .from('qa_reports')
    .select('*, qa_jobs(started_at, finished_at, artifact_sha256, runner_id)')
    .eq('job_id', jobId)
    .maybeSingle();
  if (!row) return null;
  return mapQaReportRowToView(row as unknown as QaReportRow);
}

/**
 * Dashboard score column, batched: composite per submission from the current
 * report, resolved in one query (real) or from fixtures/store (demo).
 */
export async function scoresForSubmissions(submissions: Submission[]): Promise<Map<string, number>> {
  if (isDemoMode()) {
    const map = new Map<string, number>();
    for (const submission of submissions) {
      const fromFixture = DEMO_SCORE_BY_SUBMISSION[submission.id];
      if (fromFixture !== undefined && fromFixture !== null) {
        map.set(submission.id, fromFixture);
        continue;
      }
      const report = submission.currentQaReportId ? findDemoReport(submission.currentQaReportId) : null;
      const score = report?.compositeScore ?? null;
      if (score != null) map.set(submission.id, score);
    }
    return map;
  }
  const db = getSupabase();
  if (!db) return new Map();
  const ids = submissions
    .map((s) => s.currentQaReportId)
    .filter((id): id is string => id !== null);
  if (ids.length === 0) return new Map();
  const { data: rows } = await db.from('qa_reports').select('id, composite_score').in('id', ids);
  const map = new Map<string, number>();
  for (const row of rows ?? []) {
    if (row.composite_score != null) map.set(String(row.id), Number(row.composite_score));
  }
  return map;
}

/** Format cents as a display price, e.g. $129.00. */
export function formatPrice(cents: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
