/**
 * Session 4 verification (run: pnpm dlx tsx verify-session4.mts)
 *
 * Proves the two pure seams of the real-mode swap without a live Supabase:
 *   1. Session auth — jose JWT verification against SUPABASE_JWT_SECRET,
 *      cookie/header extraction, error taxonomy.
 *   2. The qa_reports row → portal report view mapper (numeric-as-string rows).
 */
import { SignJWT } from 'jose';
import { accessTokenFromCookies, extractAccessToken, verifySessionToken } from './src/lib/vendor/auth.ts';
import { mapQaReportRowToView } from './src/lib/vendor/portal-data.ts';

const SECRET = 'test-secret-0123456789';
process.env.SUPABASE_JWT_SECRET = SECRET;

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    pass++;
    console.log(`PASS ${name}`);
  } else {
    fail++;
    console.log(`FAIL ${name} ${detail ?? ''}`);
  }
}

async function sign(sub: string, opts: { expiresIn?: string; secret?: string } = {}): Promise<string> {
  const secret = opts.secret ?? SECRET;
  const jwt = new SignJWT({ role: 'authenticated' }).setProtectedHeader({ alg: 'HS256' }).setSubject(sub);
  if (opts.expiresIn) jwt.setExpirationTime(opts.expiresIn);
  return jwt.sign(new TextEncoder().encode(secret));
}

// ---------------------------------------------------------------------------
// verifySessionToken
// ---------------------------------------------------------------------------

const ok = await verifySessionToken(await sign('user-123'));
check('valid token → userId', ok.userId === 'user-123', JSON.stringify(ok));

try {
  await verifySessionToken(await sign('user-123', { expiresIn: '-1s' }));
  check('expired token rejected', false);
} catch (e) {
  check('expired token rejected', (e as { status?: number }).status === 401);
}

try {
  await verifySessionToken(await sign('user-123', { secret: 'wrong-secret' }));
  check('wrong secret rejected', false);
} catch (e) {
  check('wrong secret rejected', (e as { status?: number }).status === 401);
}

const noSub = new SignJWT({ role: 'authenticated' }).setProtectedHeader({ alg: 'HS256' }).sign(new TextEncoder().encode(SECRET));
try {
  await verifySessionToken(await noSub);
  check('token without subject rejected', false);
} catch (e) {
  check('token without subject rejected', (e as { status?: number }).status === 401);
}

// ---------------------------------------------------------------------------
// Token extraction
// ---------------------------------------------------------------------------

const raw = await sign('user-1');
check('cookie: raw JWT', accessTokenFromCookies([{ name: 'sb-abcde-auth-token', value: encodeURIComponent(raw) }]) === raw);
check(
  'cookie: PKCE JSON blob',
  accessTokenFromCookies([{ name: 'sb-abcde-auth-token', value: encodeURIComponent(JSON.stringify({ access_token: raw, refresh_token: 'x' })) }]) === raw,
);
check('cookie: unrelated cookie ignored', accessTokenFromCookies([{ name: 'session', value: raw }]) === null);

const req = new Request('http://localhost/api/x', {
  headers: { authorization: `Bearer ${raw}` },
});
check('header: bearer token', extractAccessToken(req) === raw);

const req2 = new Request('http://localhost/api/x', {
  headers: { cookie: `foo=1; sb-proj-auth-token=${encodeURIComponent(raw)}` },
});
check('header: cookie fallback', extractAccessToken(req2) === raw);

// ---------------------------------------------------------------------------
// Row mapper — numeric columns come back from PostgREST as strings
// ---------------------------------------------------------------------------

const view = mapQaReportRowToView({
  id: 'rep-1',
  submission_id: 'sub-1',
  job_id: 'job-1',
  status: 'rejected',
  composite_score: '57.30',
  scores: { performance: 41, seo: 78, accessibility: 64, bestPractices: 58 },
  visual_diff_pct: '4.20',
  link_scan: { broken: ['/missing.html', '/assets/img/logo.png'], total: 41 },
  threshold_snapshot: {},
  is_baseline: false,
  baseline_of: null,
  report_html_url: 'qa-artifacts/sub-1/job-1/report.html',
  screenshots: ['qa-artifacts/sub-1/job-1/visual/1280.png'],
  created_at: '2026-08-15T00:00:00Z',
  qa_jobs: { started_at: '2026-08-15T00:00:00Z', finished_at: '2026-08-15T00:06:00Z', artifact_sha256: 'abc123', runner_id: 'runner-1' },
});

check('row → view: verdict', view.verdict === 'rejected');
check('row → view: composite (string numeric)', view.compositeScore === 57.3, String(view.compositeScore));
check('row → view: visual diff (string numeric)', view.suites.visual?.diffPct === 4.2);
check('row → view: broken links', (view.suites.links?.broken ?? []).length === 2 && view.suites.links?.total === 41);
check('row → view: suite statuses', view.suites.links?.status === 'failed' && view.suites.visual?.status === 'failed');
check('row → view: threshold defaults parsed', view.thresholds.lighthouse.minComposite === 75);
check('row → view: job metadata', view.artifactSha256 === 'abc123' && view.runnerVersion === 'runner-1');
check('row → view: screenshots', (view.artifacts['screenshots'] as string[]).length === 1);

// Passed row with null composite + no job embed.
const passed = mapQaReportRowToView({
  id: 'rep-2',
  submission_id: 'sub-2',
  job_id: 'job-2',
  status: 'passed',
  composite_score: null,
  scores: { performance: null, seo: null, accessibility: null, bestPractices: null },
  visual_diff_pct: null,
  link_scan: { broken: [], total: 12 },
  threshold_snapshot: {},
  is_baseline: true,
  baseline_of: 'sub-2',
  report_html_url: null,
  screenshots: [],
  created_at: '2026-08-15T00:00:00Z',
});
check('row → view: passed/null-safe', passed.verdict === 'passed' && passed.compositeScore === null && passed.suites.links?.status === 'passed');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
