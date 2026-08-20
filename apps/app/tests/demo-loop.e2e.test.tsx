/**
 * Demo-mode e2e — the complete vendor QA cycle, driven over the real HTTP
 * route handlers (docs/vendor-portal.md §5–§8).
 *
 * What this covers, in order:
 *   1. create   — POST /api/vendor/submissions → draft + verification token
 *   2. verify   — POST .../verify-preview against a REAL local HTTP server
 *                 (loopback carve-out) — positive, token-mismatch, SSRF block
 *   3. submit   — POST .../submit: guard order (zip, ownership) + the happy path
 *   4. simulate — POST .../simulate-qa → rejected (and passed) verdicts through
 *                 the same completion semantics as /api/qa/complete
 *   5. render   — the report resolved the way the detail page resolves it
 *                 (getReportForJob) and rendered by ReportView
 *
 * No dev server, no Supabase, no network beyond 127.0.0.1: the store is
 * pointed at a throwaway temp dir via DEMO_STORE_DIR, and the auth stub pins
 * the demo vendor (NODE_ENV=test, no Supabase env).
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextRequest, NextResponse } from 'next/server';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { POST as createDraft } from '@/app/api/vendor/submissions/route';
import { POST as verifyPreview } from '@/app/api/vendor/submissions/[id]/verify-preview/route';
import { POST as submit } from '@/app/api/vendor/submissions/[id]/submit/route';
import { POST as simulateQa } from '@/app/api/vendor/submissions/[id]/simulate-qa/route';
import { POST as approveVendor } from '@/app/api/admin/vendors/[id]/approve/route';
import { POST as revokeVendor } from '@/app/api/admin/vendors/[id]/revoke/route';
import { POST as unpublish } from '@/app/api/admin/submissions/[id]/unpublish/route';
import { POST as qaComplete } from '@/app/api/qa/complete/route';
import VendorDashboardPage from '@/app/vendor/page';
import { ReportView } from '@/components/vendor/ReportView';
import { listAllSubmissions, listVendorApplications } from '@/lib/vendor/admin-data';
import { buildDemoReport } from '@/lib/vendor/demo-report';
import { DEMO_VENDOR_ID } from '@/lib/vendor/demo-data';
import {
  demoJobIdFor,
  getDemoDraft,
  isDemoUnpublished,
  listDemoApplications,
} from '@/lib/vendor/demo-store';
import {
  getReportForJob,
  getSubmissionDetail,
  listVendorSubmissions,
  scoresForSubmissions,
} from '@/lib/vendor/portal-data';

// The dashboard page (rendered below) uses next/link and useRouter, which
// need the App Router provider in a real Next server. Stub them so the page
// can be rendered to static markup here.
vi.mock('next/link', () => ({
  default: (props: { href: string; className?: string; children?: ReactNode }) => (
    <a href={props.href} className={props.className}>
      {props.children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {}, replace: () => {} }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function post(path: string, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function params(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

async function json(res: NextResponse): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>;
}

/** A valid submit payload (mirrors what the 3-step form sends). */
function payload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    itemType: 'template',
    title: 'Northwind Theme',
    description:
      'A marketing-site template with hero, feature grid, pricing and contact sections. Responsive at 320px, semantic markup, and zero-dependency motion.',
    previewUrl: 'https://northwind-demo.forge.pro',
    framework: 'Astro',
    stack: ['Tailwind', 'TypeScript'],
    category: 'marketing',
    componentType: null,
    priceCents: 14_900,
    currency: 'USD',
    screenshots: ['vendor-uploads/northwind/screens/hero.png'],
    submittedVersion: '1.0.0',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Fixture HTTP server — serves the preview pages the verify step fetches
// ---------------------------------------------------------------------------

let server: Server;
let port = 0;
let liveToken: string | null = null;

/** Serves /with-token with the live verification meta tag, others without. */
function serveTokenPage(): void {
  server = createServer((req, res) => {
    res.setHeader('content-type', 'text/html');
    if (req.url?.startsWith('/with-token') && liveToken) {
      res.end(
        `<!doctype html><html><head><meta name="forge-pro:verify" content="${liveToken}"></head><body>preview page</body></html>`,
      );
      return;
    }
    res.end('<!doctype html><html><head><title>no token</title></head><body>preview page</body></html>');
  });
}

let storeDir: string;

beforeAll(async () => {
  storeDir = await mkdtemp(join(tmpdir(), 'forge-demo-e2e-'));
  process.env.DEMO_STORE_DIR = storeDir;
  serveTokenPage();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Fixture server did not bind a port.');
  port = address.port;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  delete process.env.DEMO_STORE_DIR;
  await rm(storeDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// The loop
// ---------------------------------------------------------------------------

describe('demo QA loop (create → verify → submit → simulate → render)', () => {
  let id: string;
  let verificationToken: string;
  let jobId: string;

  it('1. creates a draft with a verification token', async () => {
    const res = await createDraft(post('/api/vendor/submissions', { itemType: 'template' }));
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.ok).toBe(true);
    expect(body.demo).toBe(true);
    id = String(body.id);
    verificationToken = String(body.verificationToken);
    expect(id).toBeTruthy();
    expect(verificationToken).toHaveLength(16);

    const draft = getDemoDraft(id);
    expect(draft?.submission.status).toBe('draft');
    expect(draft?.submission.vendorId).toBe(DEMO_VENDOR_ID);
  });

  it('2a. verifies ownership against a real page carrying the token', async () => {
    liveToken = verificationToken;
    const res = await verifyPreview(
      post(`/api/vendor/submissions/${id}/verify-preview`, {
        previewUrl: `http://127.0.0.1:${port}/with-token`,
      }),
      params(id),
    );
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.ok).toBe(true);
    expect(body.reason).toBe('verified');
    expect(getDemoDraft(id)?.verifiedPreviewUrl).toBe(`http://127.0.0.1:${port}/with-token`);
  });

  it('2b. rejects a page without the token (token-mismatch)', async () => {
    const res = await verifyPreview(
      post(`/api/vendor/submissions/${id}/verify-preview`, {
        previewUrl: `http://127.0.0.1:${port}/no-token`,
      }),
      params(id),
    );
    const body = await json(res);
    expect(body.ok).toBe(false);
    expect(body.reason).toBe('token-mismatch');
  });

  it('2c. blocks private hosts via the SSRF guard', async () => {
    const res = await verifyPreview(
      post(`/api/vendor/submissions/${id}/verify-preview`, { previewUrl: 'http://10.0.0.1/' }),
      params(id),
    );
    const body = await json(res);
    expect(body.ok).toBe(false);
    expect(body.reason).toBe('blocked-host');
  });

  it('3a. submit refuses without the zip (guard order)', async () => {
    const res = await submit(post(`/api/vendor/submissions/${id}/submit`, payload()), params(id));
    expect(res.status).toBe(409);
    const body = await json(res);
    expect(body.error).toContain('Upload the template zip');
  });

  it('3b. submit refuses with a zip but no verified preview', async () => {
    // Fresh draft: zip present, never verified.
    const draftRes = await createDraft(post('/api/vendor/submissions', { itemType: 'component' }));
    const draftBody = await json(draftRes);
    const otherId = String(draftBody.id);
    const res = await submit(
      post(`/api/vendor/submissions/${otherId}/submit`, {
        ...payload({ itemType: 'component', componentType: 'form' }),
        zip: { name: 'northwind.zip', sizeBytes: 2048, clientSha256: 'a'.repeat(64) },
      }),
      params(otherId),
    );
    expect(res.status).toBe(409);
    const body = await json(res);
    expect(body.error).toContain('Verify the preview URL');
  });

  it('4. submits with zip metadata and enters the queue', async () => {
    const res = await submit(
      post(`/api/vendor/submissions/${id}/submit`, {
        ...payload(),
        zip: { name: 'northwind.zip', sizeBytes: 4096, clientSha256: 'b'.repeat(64) },
      }),
      params(id),
    );
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.status).toBe('submitted');

    const draft = getDemoDraft(id);
    expect(draft?.submission.status).toBe('submitted');
    expect(draft?.job?.status).toBe('queued');
    expect(draft?.submission.artifactSha256).toContain('demo:');

    // The dashboard sees it with a queued job.
    const rows = await listVendorSubmissions(DEMO_VENDOR_ID);
    const row = rows.find((r) => r.submission.id === id);
    expect(row?.submission.status).toBe('submitted');
    expect(row?.job?.status).toBe('queued');
  });

  it('5. simulates a rejected run and renders its report', async () => {
    const res = await simulateQa(
      post(`/api/vendor/submissions/${id}/simulate-qa`, { verdict: 'rejected' }),
      params(id),
    );
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.status).toBe('qa_rejected');

    jobId = String(getDemoDraft(id)?.submission.currentQaReportId);
    expect(jobId).toBe(`job_demo_${id}`);
    expect(getDemoDraft(id)?.job?.status).toBe('rejected');

    // Detail page resolution + the report the runner produced.
    const detail = await getSubmissionDetail(id);
    expect(detail?.submission.status).toBe('qa_rejected');
    expect(detail?.job?.status).toBe('rejected');

    const report = await getReportForJob(jobId);
    expect(report).not.toBeNull();
    expect(report?.verdict).toBe('rejected');

    // Report rendering — the component the detail page renders, server-side.
    const html = renderToStaticMarkup(<ReportView report={report!} context="Northwind Theme" />);
    expect(html).toContain('QA rejected');
    expect(html).toContain('composite 57.3 (min 75)');
    expect(html).toContain('failed check'); // banner failure count
    // Score bars with min markers.
    expect(html).toContain('Accessibility');
    expect(html).toContain('Performance');
    expect(html).toContain('SEO');
    expect(html).toContain('Best practices');
    // Failed checks with details.
    expect(html).toContain('overflow@320');
    expect(html).toContain('scrollWidth 496px exceeds viewport width 320px');
    expect(html).toContain('probe:footer@1280');
    // Console errors + broken links.
    expect(html).toContain('Console errors (2, budget');
    expect(html).toContain("TypeError: Cannot read properties of undefined");
    expect(html).toContain('/missing.html');
    // AI triage.
    expect(html).toContain('Horizontal overflow at 320px');
    expect(html).toContain('minmax(0, 1fr)');
    // Artifacts.
    expect(html).toContain('qa-artifacts/');
    expect(html).toContain('schema v1');
    // The dashboard score column reflects the composite.
    const scores = await scoresForSubmissions(detail ? [detail.submission] : []);
    expect(scores.get(id)).toBe(57.3);
  });

  it('6. completion is guarded — a second simulate is refused', async () => {
    const res = await simulateQa(
      post(`/api/vendor/submissions/${id}/simulate-qa`, { verdict: 'passed' }),
      params(id),
    );
    expect(res.status).toBe(409);
    const body = await json(res);
    expect(String(body.error)).toContain('Cannot simulate completion');
  });

  it('7. the passed path renders a green verdict with no failed checks', async () => {
    // Second draft: full loop to a passed verdict.
    const draftRes = await createDraft(post('/api/vendor/submissions', { itemType: 'template' }));
    const draftBody = await json(draftRes);
    const passedId = String(draftBody.id);
    liveToken = String(draftBody.verificationToken);

    const verify = await verifyPreview(
      post(`/api/vendor/submissions/${passedId}/verify-preview`, {
        previewUrl: `http://127.0.0.1:${port}/with-token`,
      }),
      params(passedId),
    );
    expect((await json(verify)).ok).toBe(true);

    const sub = await submit(
      post(`/api/vendor/submissions/${passedId}/submit`, {
        ...payload({ title: 'Halo Landing Kit', submittedVersion: '2.1.0' }),
        zip: { name: 'halo.zip', sizeBytes: 8192, clientSha256: 'c'.repeat(64) },
      }),
      params(passedId),
    );
    expect((await json(sub)).status).toBe('submitted');

    const sim = await simulateQa(
      post(`/api/vendor/submissions/${passedId}/simulate-qa`, { verdict: 'passed' }),
      params(passedId),
    );
    expect((await json(sim)).status).toBe('qa_passed');

    const passedReport = await getReportForJob(`job_demo_${passedId}`);
    expect(passedReport?.verdict).toBe('passed');
    const html = renderToStaticMarkup(<ReportView report={passedReport!} />);
    expect(html).toContain('QA passed');
    expect(html).toContain('composite 84.2 (min 75)');
    expect(html).toContain('No broken links found.');
    // No failed checks rendered (the suites header's "failed checks listed
    // first" hint is always present, so assert on the failure markers).
    expect(html).not.toContain('vp-check-fail');
    expect(html).not.toContain('vp-verdict--rejected');
    expect(html).not.toContain('vp-sev--high');
  });
});

// ---------------------------------------------------------------------------
// Admin demo flows (docs/vendor-portal.md §4)
// ---------------------------------------------------------------------------

describe('admin demo flows (approve → revoke → unpublish → dashboard tag)', () => {
  let adminStoreDir: string;

  // Isolate from the loop tests above: a fresh store means the dashboard
  // fixture counts are deterministic (only Aurora is live for the demo vendor).
  beforeAll(async () => {
    adminStoreDir = await mkdtemp(join(tmpdir(), 'forge-admin-e2e-'));
    process.env.DEMO_STORE_DIR = adminStoreDir;
  });

  afterAll(async () => {
    await rm(adminStoreDir, { recursive: true, force: true });
  });

  it('approves a pending application (role → vendor)', async () => {
    const res = await approveVendor(
      post('/api/admin/vendors/vendorapp_pending_maya/approve'),
      params('vendorapp_pending_maya'),
    );
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.ok).toBe(true);
    expect(body.demo).toBe(true);
    expect(typeof body.approvedAt).toBe('string');

    // Store level: the application row flips to vendor.
    const app = listDemoApplications().find((a) => a.id === 'vendorapp_pending_maya');
    expect(app?.role).toBe('vendor');
    expect(app?.approvedAt).toBeTruthy();

    // The /admin/vendors data layer the page reads reflects it.
    const rows = await listVendorApplications();
    const row = rows.find((r) => r.id === 'vendorapp_pending_maya');
    expect(row?.role).toBe('vendor');
    expect(row?.approvedAt).not.toBeNull();
  });

  it('approve is idempotent and 404s on an unknown application', async () => {
    const again = await approveVendor(
      post('/api/admin/vendors/vendorapp_pending_maya/approve'),
      params('vendorapp_pending_maya'),
    );
    expect(again.status).toBe(200);

    const missing = await approveVendor(
      post('/api/admin/vendors/vendorapp_does-not-exist/approve'),
      params('vendorapp_does-not-exist'),
    );
    expect(missing.status).toBe(404);
    expect((await json(missing)).error).toBe('Application not found.');
  });

  it('revokes an approved vendor (role → buyer, listing history kept)', async () => {
    const res = await revokeVendor(
      post('/api/admin/vendors/vendorapp_approved_diego/revoke'),
      params('vendorapp_approved_diego'),
    );
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.ok).toBe(true);
    expect(body.approvedAt).toBeNull();

    const app = listDemoApplications().find((a) => a.id === 'vendorapp_approved_diego');
    expect(app?.role).toBe('buyer');
    expect(app?.approvedAt).toBeNull();

    const missing = await revokeVendor(
      post('/api/admin/vendors/vendorapp_does-not-exist/revoke'),
      params('vendorapp_does-not-exist'),
    );
    expect(missing.status).toBe(404);
  });

  it('unpublishes a published submission, keeping history; refuses others', async () => {
    const res = await unpublish(
      post('/api/admin/submissions/sub_published/unpublish'),
      params('sub_published'),
    );
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.ok).toBe(true);
    expect(body.unpublished).toBe(true);

    expect(isDemoUnpublished('sub_published')).toBe(true);

    // The /admin/submissions data layer flags it while history stays intact.
    const all = await listAllSubmissions();
    const row = all.find((r) => r.submission.id === 'sub_published');
    expect(row?.unpublished).toBe(true);
    expect(row?.submission.status).toBe('published');

    // Guard: only published submissions can be unpublished.
    const rejected = await unpublish(
      post('/api/admin/submissions/sub_rejected/unpublish'),
      params('sub_rejected'),
    );
    expect(rejected.status).toBe(409);
    expect((await json(rejected)).error).toBe('Only published submissions can be unpublished.');
  });

  it('renders the real /vendor page with the Unpublished tag and Live count excluding it', async () => {
    const element = await VendorDashboardPage();
    const html = renderToStaticMarkup(element);

    // Aurora is still listed (history kept)…
    expect(html).toContain('Aurora Landing Page');
    // …with exactly one Unpublished tag (the only published demo-vendor row).
    expect((html.match(/Unpublished/g) ?? []).length).toBe(1);
    // …and the Live listings stat excludes it: 0 live for the demo vendor
    // after unpublish.
    const liveStat = html.match(
      /vp-stat-value">(\d+)<\/div><div class="vp-stat-label">Live listings/,
    );
    expect(liveStat?.[1]).toBe('0');
  });
});

// ---------------------------------------------------------------------------
// Runner callback contract — POST /api/qa/complete (docs/vendor-portal.md §8)
// ---------------------------------------------------------------------------

describe('runner callback (POST /api/qa/complete, demo dispatch)', () => {
  let cbStoreDir: string;

  beforeAll(async () => {
    cbStoreDir = await mkdtemp(join(tmpdir(), 'forge-qa-complete-e2e-'));
    process.env.DEMO_STORE_DIR = cbStoreDir;
  });

  afterAll(async () => {
    await rm(cbStoreDir, { recursive: true, force: true });
  });

  /** Run the full loop to 'submitted' and return the id + demo job id. */
  async function submittedDraft(): Promise<{ id: string; jobId: string }> {
    const draftRes = await createDraft(post('/api/vendor/submissions', { itemType: 'template' }));
    const draftBody = await json(draftRes);
    const id = String(draftBody.id);
    liveToken = String(draftBody.verificationToken);
    const verify = await verifyPreview(
      post(`/api/vendor/submissions/${id}/verify-preview`, {
        previewUrl: `http://127.0.0.1:${port}/with-token`,
      }),
      params(id),
    );
    expect((await json(verify)).ok).toBe(true);
    const sub = await submit(
      post(`/api/vendor/submissions/${id}/submit`, {
        ...payload({ title: 'Callback Theme' }),
        zip: { name: 'callback.zip', sizeBytes: 4096, clientSha256: 'd'.repeat(64) },
      }),
      params(id),
    );
    expect((await json(sub)).status).toBe('submitted');
    return { id, jobId: demoJobIdFor(id) };
  }

  /** Runner-style request — always carries the internal secret header. */
  function runnerRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost/api/qa/complete', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forge-internal-secret': 'test-secret',
      },
      body: JSON.stringify(body),
    });
  }

  it('advances a passed completion and stores the report', async () => {
    const { id, jobId } = await submittedDraft();
    const report = buildDemoReport(getDemoDraft(id)!.submission, 'passed');

    const res = await qaComplete(runnerRequest({ jobId, report }));
    expect(res.status).toBe(200);
    expect(await json(res)).toEqual({ ok: true, processed: true, demo: true });

    // Submission advanced, job marked done, report resolvable by the portal.
    const draft = getDemoDraft(id);
    expect(draft?.submission.status).toBe('qa_passed');
    expect(draft?.job?.status).toBe('passed');
    expect(draft?.submission.currentQaReportId).toBe(jobId);
    const stored = await getReportForJob(jobId);
    expect(stored?.verdict).toBe('passed');
    expect(stored?.compositeScore).toBe(84.2);
  });

  it('idempotency guard: replaying the same job is refused, state untouched', async () => {
    const { id, jobId } = await submittedDraft();
    const report = buildDemoReport(getDemoDraft(id)!.submission, 'passed');

    const first = await qaComplete(runnerRequest({ jobId, report }));
    expect(first.status).toBe(200);

    const replay = await qaComplete(runnerRequest({ jobId, report }));
    expect(replay.status).toBe(409);
    const body = await json(replay);
    expect(body.ok).toBe(false);
    expect(String(body.error)).toContain('qa_passed, not submitted');

    // The replay did not double-advance or duplicate the report.
    const draft = getDemoDraft(id);
    expect(draft?.submission.status).toBe('qa_passed');
    expect(draft?.job?.status).toBe('passed');
    expect(Object.keys(draft?.reports ?? {}).length).toBe(1);
  });

  it('a rejected report lands qa_rejected with the report visible', async () => {
    const { id, jobId } = await submittedDraft();
    const report = buildDemoReport(getDemoDraft(id)!.submission, 'rejected');

    const res = await qaComplete(runnerRequest({ jobId, report }));
    expect(res.status).toBe(200);

    const draft = getDemoDraft(id);
    expect(draft?.submission.status).toBe('qa_rejected');
    expect(draft?.job?.status).toBe('rejected');
    const stored = await getReportForJob(jobId);
    expect(stored?.verdict).toBe('rejected');
    expect(stored?.compositeScore).toBe(57.3);
  });

  it('an error verdict leaves the submission submitted and creates no report', async () => {
    const { id, jobId } = await submittedDraft();
    const report = { ...buildDemoReport(getDemoDraft(id)!.submission, 'passed'), verdict: 'error' as const };

    const res = await qaComplete(runnerRequest({ jobId, report }));
    expect(res.status).toBe(200);

    const draft = getDemoDraft(id);
    expect(draft?.submission.status).toBe('submitted'); // retryable — not a quality verdict
    expect(draft?.job?.status).toBe('error');
    expect(Object.keys(draft?.reports ?? {}).length).toBe(0); // no quality report row
    expect(await getReportForJob(jobId)).toBeNull();
  });

  it('unknown job → 404; malformed payload → 400', async () => {
    const { id } = await submittedDraft();
    const report = buildDemoReport(getDemoDraft(id)!.submission, 'passed');

    const missing = await qaComplete(
      runnerRequest({ jobId: 'job_demo_no-such-draft', report }),
    );
    expect(missing.status).toBe(404);
    expect((await json(missing)).error).toBe('Unknown demo job.');

    // Contract boundary: a report that fails QaRunReportSchema is refused
    // before any state is touched (the runner validates the same schema
    // before sending — callback.ts).
    const malformed = await qaComplete(
      runnerRequest({ jobId: 'job_demo_x', report: { ...report, verdict: 'bogus' } }),
    );
    expect(malformed.status).toBe(400);
    expect((await json(malformed)).error).toBe('Invalid payload.');
  });
});
