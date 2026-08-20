/**
 * Demo store for the vendor portal — file-backed, dev-only.
 *
 * Why a file: in Turbopack dev each route/page gets its own module instance,
 * so module-level state created by an API handler is invisible to a page
 * render (and vice versa). Persisting to a JSON file under `.demo/` makes the
 * store shared across all entry points and survives dev-server restarts.
 * Delete `apps/app/.demo/` to reset the demo data.
 *
 * The file holds both the vendor drafts (create/verify/submit/simulate) and
 * the admin state (vendor applications + unpublished submissions). Nothing
 * here is a security boundary; it is a dev-only stand-in for database rows.
 */
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CatalogItemKind, QaRunReport, Submission, SubmitSubmission } from '@forge-pro/shared-types';
import {
  DEMO_VENDOR_ID,
  DEMO_VENDOR_APPLICATIONS,
  DEMO_VENDOR_NAMES,
  type DemoJob,
  type DemoVendorApplication,
} from './demo-data';

export type { DemoVendorApplication };

export interface DemoDraft {
  submission: Submission;
  /** Set once the vendor proves control of the preview URL. */
  verifiedPreviewUrl: string | null;
  /** Client-reported file metadata (demo only — real hashes are server-side). */
  zip: { name: string; sizeBytes: number; clientSha256: string | null } | null;
  /** The validated submit payload, if the draft has been submitted. */
  payload: SubmitSubmission | null;
  /** The simulated QA job for this submission (demo runner). */
  job: { status: 'queued' | 'running' | 'passed' | 'rejected' | 'error'; attempts: number } | null;
  /** Reports recorded by simulated completions, keyed by job id. */
  reports: Record<string, QaRunReport>;
}

/** Admin state — the demo stand-in for vendor_profiles + Sanity published flag. */
export interface DemoAdminState {
  /** Applications seeded from fixtures; approve/revoke mutate these. */
  applications: Record<string, DemoVendorApplication>;
  /** Submissions an admin has unpublished (fixture + store ids alike). */
  unpublishedSubmissionIds: string[];
}

interface DemoStoreFile {
  drafts: Record<string, DemoDraft>;
  admin: DemoAdminState;
}

/**
 * Where the store file lives. `DEMO_STORE_DIR` lets tests (vitest) point the
 * store at a throwaway directory so parallel runs never share state; without
 * it the store sits in `<cwd>/.demo` as before.
 */
function storeDir(): string {
  return process.env.DEMO_STORE_DIR || join(process.cwd(), '.demo');
}

function storeFile(): string {
  return join(storeDir(), 'demo-store.json');
}

/**
 * Load the store. Tolerates the pre-admin format (a bare drafts record) so
 * an older .demo file keeps working — demo data is disposable anyway.
 */
function loadStore(): DemoStoreFile {
  try {
    const file = storeFile();
    if (existsSync(file)) {
      const parsed = JSON.parse(readFileSync(file, 'utf8')) as
        | Partial<DemoStoreFile>
        | Record<string, DemoDraft>;
      if ('drafts' in parsed && parsed.drafts) {
        return {
          drafts: parsed.drafts as Record<string, DemoDraft>,
          admin: seedAdminState((parsed as Partial<DemoStoreFile>).admin),
        };
      }
      return { drafts: parsed as Record<string, DemoDraft>, admin: seedAdminState(undefined) };
    }
  } catch {
    // Corrupt or unreadable — start fresh rather than crash the portal.
  }
  return { drafts: {}, admin: seedAdminState(undefined) };
}

function seedAdminState(admin: Partial<DemoAdminState> | undefined): DemoAdminState {
  return {
    applications:
      admin?.applications && Object.keys(admin.applications).length > 0
        ? admin.applications
        : Object.fromEntries(DEMO_VENDOR_APPLICATIONS.map((a) => [a.id, { ...a }])),
    unpublishedSubmissionIds: admin?.unpublishedSubmissionIds ?? [],
  };
}

function saveStore(store: DemoStoreFile): void {
  mkdirSync(storeDir(), { recursive: true });
  writeFileSync(storeFile(), JSON.stringify(store, null, 2), 'utf8');
}

function randomToken(): string {
  return randomUUID().replace(/-/g, '').slice(0, 16);
}

// ---------------------------------------------------------------------------
// Vendor drafts
// ---------------------------------------------------------------------------

/** Create a draft. Returns the id + verification token the form needs. */
export function createDemoDraft(itemType: CatalogItemKind): { id: string; verificationToken: string } {
  const store = loadStore();
  const id = randomUUID();
  const verificationToken = randomToken();
  store.drafts[id] = {
    submission: {
      id,
      vendorId: DEMO_VENDOR_ID,
      itemType,
      status: 'draft',
      title: null,
      description: null,
      framework: null,
      stack: [],
      category: null,
      componentType: null,
      priceCents: null,
      currency: null,
      screenshots: [],
      previewUrl: null,
      verificationToken,
      zipUrl: null,
      artifactSha256: null,
      submittedVersion: null,
      itemSanityId: null,
      currentQaReportId: null,
      withdrawnAt: null,
      publishedAt: null,
      createdAt: new Date().toISOString(),
    },
    verifiedPreviewUrl: null,
    zip: null,
    payload: null,
    job: null,
    reports: {},
  };
  saveStore(store);
  return { id, verificationToken };
}

export function getDemoDraft(id: string): DemoDraft | undefined {
  return loadStore().drafts[id];
}

export function setVerified(id: string, previewUrl: string): boolean {
  const store = loadStore();
  const draft = store.drafts[id];
  if (!draft) return false;
  draft.verifiedPreviewUrl = previewUrl;
  saveStore(store);
  return true;
}

export function setZip(
  id: string,
  zip: { name: string; sizeBytes: number; clientSha256: string | null },
): boolean {
  const store = loadStore();
  const draft = store.drafts[id];
  if (!draft) return false;
  draft.zip = zip;
  saveStore(store);
  return true;
}

/**
 * Finalize a draft (machine: draft → submitted). The simulated QA job keeps
 * the dashboard's derived chip honest: "queued" until a runner is connected.
 */
export function submitDemoDraft(id: string, payload: SubmitSubmission): Submission | null {
  const store = loadStore();
  const draft = store.drafts[id];
  if (!draft || draft.submission.status !== 'draft') return null;
  draft.payload = payload;
  draft.submission = {
    ...draft.submission,
    itemType: payload.itemType,
    status: 'submitted',
    title: payload.title,
    description: payload.description,
    previewUrl: payload.previewUrl,
    framework: payload.framework,
    stack: payload.stack,
    category: payload.category,
    componentType: payload.componentType,
    priceCents: payload.priceCents,
    currency: payload.currency,
    screenshots: payload.screenshots,
    submittedVersion: payload.submittedVersion,
    artifactSha256: draft.zip ? `demo:${draft.zip.clientSha256 ?? draft.zip.name}` : 'demo:no-artifact',
  };
  draft.job = { status: 'queued', attempts: 0 };
  saveStore(store);
  return draft.submission;
}

/** The demo job id for a submission — single format used everywhere. */
export function demoJobIdFor(submissionId: string): string {
  return `job_demo_${submissionId}`;
}

/** The demo submission's job row, as the portal renders it. */
export function demoJobForSubmission(submissionId: string): DemoJob | null {
  const draft = loadStore().drafts[submissionId];
  if (!draft?.job) return null;
  return {
    id: demoJobIdFor(submissionId),
    submissionId,
    status: draft.job.status,
    attempts: draft.job.attempts,
    createdAt: draft.submission.createdAt,
    finishedAt: ['passed', 'rejected', 'error'].includes(draft.job.status)
      ? new Date().toISOString()
      : null,
  };
}

/**
 * Record a simulated runner completion (demo only): store the report, flip
 * the job, and advance the submission through the same machine the real
 * callback uses (docs/vendor-portal.md §8). Withdrawn/draft submissions are
 * never clobbered — completion only advances 'submitted'.
 */
export function completeDemoJob(id: string, report: QaRunReport): { ok: boolean; error?: string } {
  const store = loadStore();
  const draft = store.drafts[id];
  if (!draft) return { ok: false, error: 'Submission not found.' };
  if (draft.submission.status !== 'submitted') {
    return { ok: false, error: `Submission is ${draft.submission.status}, not submitted.` };
  }
  if (!draft.job || draft.job.status !== 'queued') {
    return { ok: false, error: 'No queued demo job to complete.' };
  }
  // Error verdicts are retryable run failures, never quality verdicts — they
  // create no report row (mirrors qa-complete.ts / qa-gate.md §8).
  const isQuality = report.verdict === 'passed' || report.verdict === 'rejected';
  if (isQuality) {
    draft.reports[report.jobId ?? 'job_demo'] = report;
  }
  draft.job.status = report.verdict === 'passed' ? 'passed' : report.verdict === 'rejected' ? 'rejected' : 'error';
  draft.job.attempts = 1;
  const next = isQuality ? (report.verdict === 'passed' ? 'qa_passed' : 'qa_rejected') : 'submitted';
  draft.submission = {
    ...draft.submission,
    status: next,
    // Only quality verdicts produce a report row — error keeps the previous
    // currentQaReportId (mirrors handleQaComplete, which never touches it).
    currentQaReportId: isQuality ? report.jobId : draft.submission.currentQaReportId,
  };
  saveStore(store);
  return { ok: true };
}

export function withdrawDemoDraft(id: string): Submission | null {
  const store = loadStore();
  const draft = store.drafts[id];
  if (!draft) return null;
  const { status } = draft.submission;
  if (status !== 'draft' && status !== 'submitted' && status !== 'qa_rejected') return null;
  draft.submission = { ...draft.submission, status: 'withdrawn', withdrawnAt: new Date().toISOString() };
  saveStore(store);
  return draft.submission;
}

export function listDemoStoreSubmissions(): Submission[] {
  return Object.values(loadStore().drafts).map((d) => d.submission);
}

/** Find a simulated-completion report by job id across all drafts. */
export function findDemoReport(jobId: string): QaRunReport | null {
  const store = loadStore();
  for (const draft of Object.values(store.drafts)) {
    const report = draft.reports[jobId];
    if (report) return report;
  }
  return null;
}

/** Resolve a demo job id back to its submission id (demo runner callback). */
export function demoDraftIdForJob(jobId: string): string | null {
  const prefix = 'job_demo_';
  if (!jobId.startsWith(prefix)) return null;
  const subId = jobId.slice(prefix.length);
  const store = loadStore();
  return subId in store.drafts ? subId : null;
}

// ---------------------------------------------------------------------------
// Admin state — vendor applications + unpublished submissions
// ---------------------------------------------------------------------------

/** All vendor applications, with approve/revoke mutations applied. */
export function listDemoApplications(): DemoVendorApplication[] {
  return Object.values(loadStore().admin.applications).sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

export function approveDemoApplication(id: string): DemoVendorApplication | null {
  const store = loadStore();
  const app = store.admin.applications[id];
  if (!app) return null;
  app.approvedAt = new Date().toISOString();
  app.role = 'vendor';
  saveStore(store);
  return app;
}

export function revokeDemoApplication(id: string): DemoVendorApplication | null {
  const store = loadStore();
  const app = store.admin.applications[id];
  if (!app) return null;
  app.approvedAt = null;
  app.role = 'buyer';
  saveStore(store);
  return app;
}

export function unpublishDemoSubmission(id: string): boolean {
  const store = loadStore();
  if (store.admin.unpublishedSubmissionIds.includes(id)) return true;
  store.admin.unpublishedSubmissionIds.push(id);
  saveStore(store);
  return true;
}

export function isDemoUnpublished(id: string): boolean {
  return loadStore().admin.unpublishedSubmissionIds.includes(id);
}

/** Vendor display name for admin tables (demo): application name, else fallback map. */
export function demoVendorName(vendorId: string): string {
  const app = Object.values(loadStore().admin.applications).find((a) => a.userId === vendorId);
  return app?.displayName ?? DEMO_VENDOR_NAMES[vendorId] ?? vendorId;
}
