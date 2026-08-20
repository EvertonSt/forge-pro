# Forge Pro QA Gate — Detailed Design (Phase 2)

The QA gate is the product's differentiator: every vendor submission runs
through an automated quality pipeline before it can go live, and passing
submissions earn a public **QA Verified** badge with scores attached. This
document specifies it tightly enough to build in one session at a time. It
extends `docs/architecture.md` §1.2 and consumes the v0.2 model changes
(`submissions.artifact_sha256`, `qa_reports.is_baseline` / `baseline_of`,
`qa_jobs.artifact_sha256`).

## 1. Goals & non-goals

**Goals**

1. A verdict a buyer can trust, and a vendor can act on. The report is the product.
2. Deterministic enough to re-run: same artifact + same config → same verdict.
3. Cheap to operate: GitHub Actions free tier, no persistent infra.
4. Forgiving for good code, brutal for broken code — thresholds that mean something.

**Non-goals (v1 of the gate)**

- No AI judgment in the *verdict*. Claude writes the report narrative (and can
  triage failures into actionable fixes) but never decides pass/fail — the
  threshold engine does, deterministically. This is a deliberate line: an AI
  that passes/fails is a different (worse) product story than an AI that
  *explains* a deterministic result.
- No building vendor zips. Vendors deploy their own preview URL (decided in
  Session 2); the gate tests that URL.
- No cross-browser matrix. Chromium only in v1 (Playwright). Firefox/WebKit
  can be added as a config flag later; note it in the report if skipped.
- No performance regression *trending* yet (compare against previous run's
  Lighthouse, but no dashboard). The data model supports it (qa_jobs history).

## 2. End-to-end flow

```
vendor submits (preview URL + zip)          [app]
  → submissions.status = submitted
  → qa_jobs.status = queued (artifact_sha256 copied from submission)
  → app POSTs repository_dispatch to the forge-pro repo  [app]
  → GitHub Actions workflow starts, builds qa-runner     [CI]
  → forge-qa run --job <id>                              [CI]
       claim job (atomic UPDATE … WHERE status='queued')
       → qa_jobs.status = running
       fetch submission (preview_url, artifact_sha256)   [runner]
       run suites against preview_url
       ├─ smoke (responsive + render + console)          [Playwright]
       ├─ links (bounded crawl)                          [Playwright]
       ├─ visual (baseline capture or diff)              [Playwright + pixelmatch]
       └─ lighthouse (scores + composite)                [lighthouse]
       build report.json + report.html + screenshots
       upload artifacts → Supabase Storage bucket qa-artifacts
       insert qa_reports row (verdict, scores, thresholds snapshot, artifact URLs)
       complete job → qa_jobs.status = passed | rejected | error
       POST /api/qa/complete (internal secret)           [runner → app]
  → app verifies secret, marks submission qa_passed/qa_rejected,   [app]
    sets submissions.current_qa_report_id, and on pass patches the
    Sanity qaBadge (status=verified, scores, lastRunAt, reportUrl)
  → vendor sees the report in the portal; fixes and resubmits → new job
```

The app is the only component that writes Sanity. The runner never touches
Sanity — it writes Supabase (job + report + artifacts) and pings the app's
internal endpoint. If the internal callback fails, the app falls back to
reconciling on next vendor-portal read (idempotent by `current_qa_report_id`).

## 3. Runner anatomy (`apps/qa-runner`)

Standalone CLI, TypeScript, zero web-framework deps. It imports
`@forge-pro/shared-types` (types) and `@forge-pro/db` (queue claim).
Completion is delivered to the app via HTTP (§11) — the runner never writes
job/report rows itself except the dev fallback.

```
apps/qa-runner/
  src/
    cli.ts            # forge-qa run --job <id> | --help
    config.ts         # load ThresholdConfig (file or defaults)
    queue.ts          # claim qa_jobs against Supabase (atomic)
    callback.ts       # POST report to /api/qa/complete (env-gated, retry)
    run.ts            # orchestrates suites, aggregates results, decides verdict
    suites/
      smoke.ts        # §4
      links.ts        # §5
      visual.ts       # §6
      lighthouse.ts   # §7
    report/
      composite.ts    # verdict engine: weighted composite + the §8 rule (pure)
      html.ts         # self-contained HTML report builder
      artifacts.ts    # upload to Supabase Storage

ThresholdConfig and the report.json schema (the contract) live in
`@forge-pro/shared-types/src/qa.ts`; the runner and the app import them from
there and can never drift.

**Runner tests** (`pnpm test`, vitest — `tests/`): `config.test.ts` pins
config loading (defaults, file override/merge, ZodError + missing-file
failures); `composite.test.ts` pins the weighted-composite math and the full
§8 verdict rule (smoke/links/visual/lighthouse gates, error-is-never-a-
verdict, absent suites don't gate); `callback.test.ts` pins the env contract,
contract pre-validation (no fetch on a malformed payload), and the retry
policy (4xx fail-fast with no retry, network/5xx retry with 0s/2s/5s backoff,
give-up after 3 attempts).
    ai/
      narrative.ts    # Anthropic report narrative + issue triage (M5)
  tests/              # vitest: config validation, composite math, callback retry/backoff
```

Exit codes: `0` passed or job already claimed (no-op), `1` rejected (verdict
recorded — CI exit code is informational, the DB is authoritative), `2` runner
error (job marked `error`, retryable).

## 4. Suite 1 — Smoke & responsive (`suites/smoke.ts`)

**Purpose:** the site renders at every breakpoint with no layout breakage, no
console errors, and the expected key elements present.

**Procedure** — for each breakpoint in `responsive.breakpoints` (default
`[320, 768, 1280, 1920]`):

1. New context per breakpoint: `viewport { width, height: 900 }`,
   `deviceScaleFactor: 1`, `reducedMotion: 'reduce'`, `locale: 'en-US'`.
2. Navigate to the preview root. Wait `networkidle` (timeout 30s).
3. Assert `document.documentElement.scrollWidth <= window.innerWidth`
   (no horizontal overflow) — measured after a 500 ms settle.
4. Assert the probes from `responsive.probes` are visible: default
   `main`, `nav`/`header`, `footer` (configurable per submission type).
5. Collect `page.on('console')` error-level messages and `page.on('pageerror')`.
6. Capture a viewport screenshot (used by the visual suite too, if enabled).

**Pass criteria:** no overflow at any breakpoint, all probes visible, console
errors ≤ `responsive.maxConsoleErrors` (default 0, but benign noise — favicon
404s, source-maps — can be allowlisted per vendor in the config).

**Checks are recorded individually** so the report shows exactly which
breakpoint/assertion failed:

```json
{ "id": "overflow@320", "status": "failed", "detail": "scrollWidth 1408 > innerWidth 320" }
```

## 5. Suite 2 — Broken-link scan (`suites/links.ts`)

**Purpose:** nothing on the site 404s, and no dead anchors survive.

**Procedure:**

1. Bounded same-origin BFS from the preview root. Limits: `links.maxDepth`
   (default 3), `links.maxUrls` (default 50), visited set.
2. On each page, extract `a[href]`, resolve against origin, drop
   `mailto:`/`tel:`/`javascript:`, dedupe.
3. Register a request-interception handler that records every response with
   `status >= 400` (links, images, scripts, stylesheets) with its URL.
4. `page.goto` each queued URL, ignore same-URL revisits, cap concurrent
   requests (Playwright's default parallel navigations in the same page).

**Pass criteria:** zero 4xx/5xx on crawl and zero dead anchors. External links
(off-origin) are *checked at HEAD level* via a quick fetch (no navigation) or
skipped if `links.checkExternal: false` (default true, failures non-fatal →
warned in report unless `links.failOnExternal`). Vendor-known-broken URLs go
in `links.allowlist`.

Output: `broken[]` (URL + status + referrer) written to report + `links/broken.json`.

## 6. Suite 3 — Visual regression & baselines (`suites/visual.ts`)

**Purpose:** prove a resubmission didn't silently break rendering — and give
first-time submissions a visual record.

**Baseline model** (v0.2 schema: `qa_reports.is_baseline`, `baseline_of`):

- **First submission:** no baseline exists. The suite captures full-page
  screenshots at each visual breakpoint and stores them as the *baseline* for
  the item's `(item_type, sanity_id)`; the report is marked `is_baseline: true`.
  Visual "checks" are the render assertions from §4 (no broken layout).
- **Version resubmission:** capture current screenshots, compare against the
  latest baseline with `pixelmatch` (per-breakpoint tolerance
  `visual.diffTolerancePct`, default 0.1% of pixels). Generate `-diff.png`
  artifacts (red-tinted changed pixels) for the report.
- **Baseline rotation:** a passing resubmit becomes the *new* baseline; a
  rejected one keeps the old baseline (the diff artifact is preserved). This
  keeps baselines honest — a deliberate layout change is "approved by QA",
  not silently tolerated.

**Details for determinism:** fixed viewport + `deviceScaleFactor: 1`; disable
animations (`reducedMotion: 'reduce'` + inject a style that stops
transitions/animations); wait for fonts (`document.fonts.ready`); fixed
screenshot `animations: 'disabled'` option.

Storage layout (bucket `qa-artifacts`):

```
qa-artifacts/{submissionId}/{jobId}/visual/
  {breakpoint}-baseline.png | {breakpoint}-current.png | {breakpoint}-diff.png
```

## 7. Suite 4 — Lighthouse (`suites/lighthouse.ts`)

**Purpose:** the public score. This is the badge number buyers see.

**How it runs:**

- `lighthouse` npm package, programmatic API, launching its own Chrome via
  `chrome-launcher` pointed at Playwright's pinned Chromium
  (`CHROME_PATH` resolved from Playwright's browser install).
- Default `lighthouse.formFactor: 'mobile'` (canonical, throttled, stricter —
  the credible number for a public badge). `desktop` is a per-submission
  override for vendors who explicitly target desktop-only.
- Categories scored: `performance`, `seo`, `accessibility`, `best-practices`
  (each 0–100). Key perf audits recorded for the narrative: LCP, CLS, TBT,
  speed-index, interactive.
- v1 runs once per submission. `lighthouse.runs: 3` (median composite) is a
  config option for flaky-CI mitigation; default off for cost.

**Composite score** (the badge number):

```
composite = 100 × Σ(weight_cat × score_cat) / Σ(weight_cat)
```

Default weights (justified, not arbitrary):

| Category | Weight | Why |
|---|---|---|
| accessibility | 0.35 | Non-negotiable for a quality product; cheapest signal of care |
| performance | 0.30 | Templates must ship fast; mobile-throttled score is honest |
| seo | 0.20 | The storefront sells SEO — listings should practice it |
| best-practices | 0.15 | Security/modernity hygiene |

## 8. Threshold configuration

Single zod-validated `ThresholdConfig` (schema + defaults in
`@forge-pro/shared-types/src/qa.ts`, loaded by `apps/qa-runner/src/config.ts`):

```ts
{
  schemaVersion: 1,
  lighthouse: {
    formFactor: 'mobile',                       // 'mobile' | 'desktop'
    runs: 1,                                    // 1 | 3 (median composite)
    minScores: { performance: 55, seo: 85, accessibility: 85, bestPractices: 80 },
    minComposite: 75,
    weights: { performance: 0.30, seo: 0.20, accessibility: 0.35, bestPractices: 0.15 },
  },
  responsive: { breakpoints: [320, 768, 1280, 1920], maxConsoleErrors: 0, probes: ['main', 'header', 'footer'] },
  links: { maxDepth: 3, maxUrls: 50, allowlist: [], checkExternal: true, failOnExternal: false },
  visual: { breakpoints: [320, 768, 1280], diffTolerancePct: 0.1 },
  retry: { maxAttempts: 2, backoffSeconds: 30 },
}
```

**Verdict rule** (all must hold → `passed`):

1. smoke: all checks pass;
2. links: zero broken same-origin URLs;
3. visual: diff ≤ tolerance (or baseline capture succeeded);
4. lighthouse: every category ≥ its min AND composite ≥ `minComposite`.

Anything else → `rejected` (with the failing checks listed); runner crash →
`error` (retryable, never shown as a quality verdict).

**Snapshot semantics:** the entire config is serialized into
`report.thresholds` at run time. A verdict is a fact about (artifact, config,
timestamp) — later config changes never reinterpret history.

## 9. Report artifact format

**Primary artifact: `report.json`** — the machine contract (mirrors
`QaReportSchema` in `@forge-pro/shared-types`):

```json
{
  "schemaVersion": 1,
  "submissionId": "…", "jobId": "…",
  "artifactSha256": "…",          // pins verdict to exact artifact
  "runnerVersion": "0.1.0",
  "startedAt": "…", "finishedAt": "…",
  "thresholds": { /* full ThresholdConfig snapshot */ },
  "verdict": "passed",
  "compositeScore": 84.2,
  "scores": { "performance": 62, "seo": 91, "accessibility": 89, "bestPractices": 84 },
  "suites": {
    "smoke":  { "status": "passed", "checks": [ { "id": "overflow@320", "status": "passed" } ] },
    "links":  { "status": "passed", "broken": [], "total": 37 },
    "visual": { "status": "passed", "diffPct": 0.02, "isBaseline": false },
    "lighthouse": { "status": "passed", "composite": 84.2, "lcp": 1.9, "cls": 0.02, "tbt": 120 }
  },
  "artifacts": {
    "htmlReport": "…/report.html",
    "screenshots": ["…/visual/1280-current.png", "…/visual/1280-diff.png"],
    "lighthouseHtml": "…/lighthouse/mobile-report.html",
    "brokenLinks": "…/links/broken.json"
  },
  "aiNarrative": { "summary": "…", "issues": [ { "severity": "high", "fix": "…" } ] }
}
```

**Storage layout** (bucket `qa-artifacts`, private; signed URLs issued to the
vendor portal and to the public badge's reportUrl):

```
qa-artifacts/{submissionId}/{jobId}/
  report.json
  report.html            # self-contained, inline CSS, printable
  summary.json           # one-screen summary for the portal (verdict, scores, top issues)
  visual/…               # §6
  lighthouse/{formFactor}-report.html + .json
  links/broken.json
```

**HTML report** is the showpiece: verdict header (composite + per-category
badges), suite-by-suite pass/fail with the individual checks, baseline-vs-
current screenshot gallery with diffs, broken-link table, Lighthouse audit
highlights, threshold snapshot footer, and runner metadata. It's what a vendor
reads, what a hiring manager looks at, and what links from the public badge.

**Supabase row mapping:** `qa_reports` gets verdict/compositeScore/scores/
visualDiffPct/linkScan/thresholdSnapshot/reportUrl (public), and the artifact
URLs live in the report itself + storage.

## 10. Queue & job lifecycle

`qa_jobs` states: `queued → running → passed | rejected | error`.

- **Claim (atomic, idempotent):**
  ```sql
  UPDATE qa_jobs SET status = 'running', started_at = now(), runner_id = $2
  WHERE id = $1 AND status = 'queued' RETURNING *;
  ```
  A re-delivered dispatch finds no `queued` row and exits 0 — retries are safe.
- **Lease/reaper:** jobs stuck in `running` > 30 min are reset to `queued` by
  the app's reconciler (or the next dispatch) and retried up to
  `retry.maxAttempts`; after that → `error` with a note. No cron needed: the
  app can reconcile lazily on portal reads, or a GitHub Actions `schedule`
  workflow (hourly) runs a 20-line sweep.
- **Runner id:** the GH Actions `run_id` + attempt number, so logs map to runs.

## 11. GitHub Actions wiring

`.github/workflows/qa-gate.yml` (in the forge-pro repo):

```yaml
name: qa-gate
on:
  repository_dispatch:
    types: [qa-run]

jobs:
  run:
    runs-on: ubuntu-latest
    concurrency: qa-gate-${{ github.event.client_payload.jobId }}
    timeout-minutes: 15
    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      APP_INTERNAL_SECRET: ${{ secrets.APP_INTERNAL_SECRET }}
      APP_BASE_URL: ${{ vars.APP_BASE_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @forge-pro/qa-runner build
      - run: pnpm --filter @forge-pro/qa-runner exec playwright install chromium --with-deps
        # browser pinned by the package.json version; cache it:
      - uses: actions/cache@v4
        with: { path: ~/.cache/ms-playwright, key: pw-${{ hashFiles('pnpm-lock.yaml') }} }
      - run: node apps/qa-runner/dist/cli.js run --job ${{ github.event.client_payload.jobId }}
```

- **Trigger:** the app holds a GitHub token (fine-grained PAT or GitHub App
  token, `repository_dispatch` scope) and dispatches on submission. Retry is a
  second dispatch; the atomic claim makes duplicates harmless.
- **Secrets:** Supabase service-role key is the only sensitive one; it exists
  in the runner's env for the job's lifetime. `APP_INTERNAL_SECRET` gates the
  completion callback. `ANTHROPIC_API_KEY` is only used for the M5 narrative —
  leave it unset until then.
- **Completion:** after the suites run, the runner POSTs the report to
  `{APP_BASE_URL}/api/qa/complete` (`x-forge-internal-secret` header) — the
  app advances the submission, records the report, marks the job
  passed/rejected, and auto-publishes. The runner retries transient failures
  with backoff and exits 2 if the callback ultimately fails (the job stays
  `running` for the app's lazy reaper, §10). Without `APP_BASE_URL` /
  `APP_INTERNAL_SECRET` the runner falls back to closing the job directly —
  a documented dev-only shortcut.
- **Cost/time budget:** one submission ≈ 5–7 min of runner time (smoke 60 s,
  links 90 s, visual 60 s, lighthouse 90 s, build 2 min). Free-tier minutes
  cover a solo marketplace for a long time; the design moves to a Fly.io
  worker unchanged because the runner is a plain CLI.

## 12. Determinism & integrity

- **Artifact pinning:** `artifact_sha256` is computed on the zip at upload
  (app) and copied into the job + report. A verdict is only meaningful for the
  exact artifact tested; the badge shows the run's `lastRunAt` and report.
- **Pinned toolchain:** Playwright version + browser revision and the
  `lighthouse` version are lockfile-pinned; the browser is cached in CI by
  lockfile hash. No "works on my machine" variance.
- **Rendering determinism:** fixed viewports, `deviceScaleFactor: 1`, reduced
  motion, animation freeze, `document.fonts.ready` wait, screenshot
  `animations: 'disabled'`.
- **Lighthouse variance:** accepted in v1 (scores can swing ±5 on a loaded
  runner); thresholds have headroom, and `runs: 3` (median) is the escape
  hatch. Baseline diffs use a tolerance instead of pixel-perfect equality for
  the same reason.

## 13. Security

- Preview URLs are vendor-supplied and fetched by the runner: reject
  non-`http(s)` schemes; block private/loopback ranges in CI runs (the runner
  shares a network with nothing sensitive, but keep the policy explicit and
  centralized in one fetch helper).
- The runner has exactly two credentials: the Supabase key (scoped usage: job
  claim/report/artifact writes) and the internal callback secret. No Sanity
  token, no Stripe, no app keys. The service-role key is a known risk of the
  Supabase model (no per-table keys); mitigate by keeping the bucket and RLS
  strict and rotating the key if the runner ever leaves CI.
- Vendor code never runs in the app's context — the gate is fully isolated
  from the storefront/checkout surfaces.
- Artifact bucket is private; report URLs are issued as short-TTL signed URLs
  (public badge included) rather than public-by-default.

## 14. Argus reuse points

Argus lives at `/c/Users/Everton/portfolio-projects/argus` (github.com/
EvertonSt/argus) — an autonomous AI QA agent: plans tests with Claude,
executes them with Playwright, triages its own failures, and files real bugs.
Its governing principle is exactly the gate's: **blue stages reason with an
LLM, green stages are deterministic, and that boundary is enforced** —
severity, dedupe, execution, and the CI gate contain no model calls. Status of
each port:

| Argus piece | Where it goes | Status |
|---|---|---|
| `src/shared/ai-client.ts` — retry w/ backoff on 429/5xx/network, fail-fast on 401/403, per-run call cap, mock mode | `@forge-pro/ai` (`src/client.ts`) | **ported** |
| `src/triage/prompt.ts` — category defs + judgement rules + strict JSON (confidence/reasoning/fix) | `apps/qa-runner/src/ai/narrative.ts` (M5) | **ported** |
| `src/shared/config.ts` — all tunables read once at startup, model name as config not literal | gate's `ThresholdConfig` loader + runner env | aligned (config schema already shared) |
| `src/cli/pipeline.ts` — staged orchestration, run dir + run id, cost transparency before AI spend | runner `run.ts` (M6 hardening) | noted |
| `src/bug-filer/severity.ts` — keyword severity rules for filed bugs | optional: severity field on `aiNarrative.failures[]` (M5) | noted |
| `src/planner/`, `src/ingestion/`, `src/codegen/` — test planning/generation | **not reused** — the gate tests, it doesn't author tests | — |
| `src/dashboard/` — static dashboard of run data | **not reused** — the gate's artifact is the self-contained HTML report | — |

Notable: Argus's `meetsThreshold` is severity-ranked (`SEVERITY_RANK`); the
gate's verdict is composite-score-ranked instead, so only the *pattern* (one
config + a pure, unit-testable function) transfers — which the gate already
has in `ThresholdConfig` + the §8 verdict rule. Argus runs on `tsx` + commander
+ vitest; the gate keeps its plain-CLI/no-framework runner (commander is a
possible later convenience, not a port).

## 15. What v1 of the gate deliberately does NOT do

- No Firefox/WebKit matrix (config flag later, noted in report).
- No Lighthouse trending dashboard (data exists; UI later).
- No mobile-only component gate — components run the same gate (fewer links,
  no crawl depth change needed).
- No AI verdicts — §1. Claude narrates and triages only.
- No vendor self-service config (thresholds are platform-owned; vendors can
  request exceptions, admin approves).

## 16. Build order (Phase 2 milestones)

- **M1 — Core CLI + smoke suite.** `forge-qa run` against a fixture URL:
  claim/complete job, ThresholdConfig load, smoke suite, `report.json` written
  locally. Run against `example.com` fixtures to prove the loop.

  **Status: implemented.** `forge-qa run --url|--job`, zod `ThresholdConfig`
  (defaults + `--config` file), atomic claim/complete in `queue.ts`, smoke
  suite (breakpoints, overflow, probes, global console-error budget), and
  `report.json` written locally. Verified: `fixtures/good` → passed (exit 0),
  `fixtures/broken` → rejected with the intended failures (overflow@320,
  missing footer probes, console errors); a custom config threshold flips the
  console-error check. Known tuning note: a page-level console.error counts
  once per breakpoint navigation (4×) — dedupe or per-breakpoint budgeting is
  an M6 hardening item.
- **M2 — Links + visual + baselines.** §5, §6, baseline storage, diff
  artifacts.

  **Status: engine wired, suites pending.** `buildReport` now takes optional
  links/visual/lighthouse results and delegates the verdict to the §8 engine
  (`src/report/composite.ts`) — absent suites don't gate, any suite `error`
  → retryable `error`, composite computed when Lighthouse is present
  (`tests/build.test.ts`, 13 cases). The §5/§6/§7 suites themselves are not
  yet implemented.
- **M3 — Lighthouse + verdict.** §7, composite, snapshot, verdict rule. The
  gate can now pass/reject for real.

  **Status: math done, runner pending.** Composite + gate + verdict rule are
  implemented and unit-tested; the Lighthouse suite that produces scores is
  not.
- **M4 — Report + CI.** HTML report, artifact upload, GH Actions workflow,
  internal callback, Sanity badge patch, vendor portal view.

  **Status: workflow written.** `.github/workflows/qa-gate.yml` listens for
  `repository_dispatch: [qa-run]` (matching `apps/app/src/lib/vendor/dispatch.ts`),
  claims the job with the runner id (`RUNNER_ID` = run_id + attempt, recorded
  on the claim per §10), runs the suites, uploads the report artifact, and
  treats exit 1 (rejected) as informational — only exit 2 fails the run. The
  internal callback and portal report view shipped earlier; the HTML report
  is M5.
- **M5 — AI narrative.** Anthropic summary + issue triage; polish the report.
- **M6 — Hardening.** Reaper/retries, observability (runner logs in storage),
  threshold tuning against real submissions, Argus ports.

Gate-keeping rule (from the master doc): Phase 2 starts only after Phase 1 has
shipped and sat untouched for a few days — but this design is the reference
for every M1–M6 decision when it does.
