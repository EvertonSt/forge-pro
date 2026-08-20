# Forge Pro — Vendor Submission Flow (Phase 2)

Design for the two-sided marketplace side of Phase 2: how a vendor gets a
template or component from "upload" to "live, QA-verified listing" — and what
happens when they fix and resubmit. It wraps the automated QA gate
(`docs/qa-gate.md`) and consumes the v0.2 data model (`docs/architecture.md`
§3.1: `submissions`, `qa_jobs`, `qa_reports`, `current_qa_report_id`,
`artifact_sha256`).

## 1. Goals & principles

1. **The gate is the review.** A passing QA run publishes the listing
   automatically — no human review step in the happy path. This is the
   product's differentiator ("a store that proves its own quality"), so the
   flow must treat pass → live as a first-class, reliable transition, not an
   afterthought. Admins can unpublish at any time.
2. **The report is the conversation.** Every rejection is a report with the
   failing checks, screenshots, and (M5) AI narrative + fixes. Resubmission is
   "fix the code, re-upload, see the new report" — never a black box.
3. **Integrity over convenience.** The artifact a buyer downloads should be
   the artifact the gate approved. We can't fully prove zip ≡ preview in v1
   (the gate tests the vendor-deployed preview URL), so we pin what we can —
   `artifact_sha256` on every submission/job/report — and close the gap later
   by building the zip in CI (§12).
4. **Ownership is proven, not asserted.** A vendor must demonstrate control
   of their preview URL before the gate spends CI minutes on it.

## 2. Actors & roles

| Actor | Capability | RLS / gate |
|---|---|---|
| **Vendor** | Create/edit own submissions, upload zips, view own reports, resubmit, withdraw | `submissions` read/write own; `qa_reports` read own (via submission) |
| **Admin** (owner) | Approve vendor applications, view all submissions/reports, unpublish, revoke vendors | full |
| **Buyer** | Sees only published items (Sanity) | none on transactional tables |
| **QA runner** (CI) | Claims jobs, writes reports + artifacts, pings `/api/qa/complete` | service role + internal secret |

Vendor onboarding (Phase 2): vendor applies via portal → `vendor_profiles`
row with `approved_at` null → admin approves → role becomes `vendor` and the
profile becomes public. No Stripe Connect in v1 — payouts manual (§ architecture
"Resolved").

## 3. Submission lifecycle (state machine)

One submission = one attempt to get **one version** of an item live (or
updated). A rejected submission is resubmitted as new *jobs* on the same row;
updating an already-live item starts a *new* submission linked to it.

```
        ┌───────────┐  submit (validated)   ┌────────────┐  job created    ┌───────────┐
        │   draft   │ ────────────────────▶ │  submitted │ ──────────────▶ │ (in queue │
        └───────────┘                       └────────────┘                 │  / runner)│
              │ ▲                                  │                       └───────────┘
         edit  │ │ withdraw                       │ runner completes            │
              ▼ │                                  ▼                             │
        ┌────────────┐   admin unpublish    ┌───────────────┐                   │
        │ withdrawn  │ ◀──────────────────▶ │  qa_passed    │ ◀──────────────────┘ passed
        └────────────┘                      └───────────────┘                   │
              ▲                                   │  publish (auto)             │
              │                                   ▼                             │
              │                            ┌───────────────┐                    │
              │      resubmit (new job)    │  published    │                    │
              │ ◀──────────────────────────│  (+ item in   │                    │
              └────────────────────────────│   Sanity)     │                    │
              withdrawn                    └───────────────┘                    │
        ┌────────────┐  fix + re-upload       ┌───────────────┐                   │
        │ qa_rejected│ ─────────────────────▶ │  submitted    │                   │
        └────────────┘  (new job on same row) └───────────────┘                   │
```

**Transitions (with guards):**

| From | To | Trigger | Guard |
|---|---|---|---|
| draft | submitted | vendor submits form | all form validation passes (§5); preview URL ownership proven (§6); zip uploaded + hash stored (§7) |
| submitted | (in queue) | app creates `qa_jobs` row + dispatches GH Action | no other job running for this submission; ≤ in-flight cap |
| (in queue) | qa_passed | runner reports `passed` via `/api/qa/complete` | job belongs to this submission; callback secret valid; submission still `submitted` |
| (in queue) | qa_rejected | runner reports `rejected` | same |
| (in queue) | submitted | runner reports `error` | job retryable; submission returns to submitted so the vendor can re-trigger or the app re-dispatches (max 2 attempts, then a visible error banner) |
| qa_passed | published | **auto** — app creates/publishes the Sanity doc + badge + moves the zip | idempotent publish step (§9); on failure the submission stays qa_passed with a "retry publish" action |
| qa_rejected | submitted | vendor resubmits (fix + re-upload) | new zip present; optionally new version; creates a new job; visual diff runs vs. previous baseline (§10) |
| qa_rejected / submitted | withdrawn | vendor withdraws | in-flight job, if any, is *not* canceled — it completes and is recorded but must not update a withdrawn submission (guard: completion only updates `submitted`) |
| published | (unpublished) | admin | reverts Sanity `published=false`; submission stays `published`-history; badge stays in report history |

`submissions.status` stays coarse (the five values above + `withdrawn`); the
in-queue state is **derived** from the latest `qa_jobs` row, so the job queue
remains the single source of truth for what the runner is doing.

## 4. Portal pages & routes (Next.js app)

All under `/vendor` (role-gated: `vendor` or `admin`):

| Route | Purpose |
|---|---|
| `/vendor` | Dashboard: submission list with status chips, latest composite score, report link, resubmit/withdraw actions |
| `/vendor/new` | New-submission form (§5) |
| `/vendor/submissions/[id]` | Detail: status timeline, latest report (score bars, failed checks, screenshot gallery, broken-link table, narrative), zip re-upload + version field for resubmit, withdraw button |
| `/vendor/submissions/[id]/report/[jobId]` | Full historical report for any job (artifact view) |
| `/admin/vendors` | Vendor applications + approve/revoke |
| `/admin/submissions` | All submissions; unpublish |

Admin routes are role-gated (`requireAdmin`: role `admin` only; the dev stub
uses `DEMO_ADMIN_ID` when Supabase is not configured). Approve flips the
applicant's role to `vendor` and sets `approved_at`; revoke reverts it — the
vendor's listings stay visible to admins and the vendor can re-apply. Unpublish
reverts the Sanity `published` flag; the submission row stays `published`
(history) and both dashboards mark the row with an `Unpublished` tag. In demo
mode the unpublish guard mirrors the real one: only `published` rows pass.

API (all server-side, env-gated):
- `POST /api/vendor/submissions` — create draft (server action)
- `POST /api/vendor/submissions/[id]/upload` — streamed zip upload (§7)
- `POST /api/vendor/submissions/[id]/submit` — validate + submit (§5–§6)
- `POST /api/vendor/submissions/[id]/resubmit` — new job after rejection
- `POST /api/vendor/submissions/[id]/withdraw`
- `POST /api/qa/complete` — **internal**, runner callback (§8), shared secret
- `POST /api/admin/vendors/[id]/approve`
- `POST /api/admin/vendors/[id]/revoke`
- `POST /api/admin/submissions/[id]/unpublish`

## 5. Form design (new submission)

One form, three logical steps (single page, client-side step indicator;
server-side validation is authoritative on submit).

**Step 1 — Identity & catalog metadata** (needed at publish, captured now):
- `itemType` — template | component
- `title` (3–120 chars), `description` (40–2000 chars)
- `framework` (enum from Sanity schema), `stack` (tags, ≤ 8)
- `category` (reference), `price_cents` (> 0, ≤ 50000), `currency` (default USD)
- `screenshots` — ≤ 6 images, ≤ 5 MB each (uploaded to the submission's
  uploads folder; referenced at publish)
- `componentType` — required when itemType = component

**Step 2 — Preview URL + ownership proof** (§6):
- `previewUrl` — validated http(s), public, reachable
- `verificationToken` — displayed by the app; vendor pastes it into the
  preview page as `<meta name="forge-pro:verify" content="<token>">`, then
  clicks "verify" (app fetches the URL and checks for the token)

**Step 3 — Artifact + version** (§7):
- `zip` — the template source, ≤ 50 MB, must be a real zip (magic bytes `PK`)
- `submittedVersion` — semver (`^\d+\.\d+\.\d+$`), must not duplicate an
  already-published version of the item

Validation failure blocks submit with field-level messages. All server-side
validation is zod (shared schemas in `@forge-pro/shared-types`).

## 6. Preview-URL validation & ownership proof

**Why proof matters:** the gate spends real CI minutes and a public badge on a
URL the vendor controls. A meta-tag token proves control cheaply and blocks
the cheapest abuse (badge-farming someone else's site).

**V1 mechanism — meta-tag token:**
1. App generates a per-submission `verificationToken` (crypto-random, 16 bytes).
2. Vendor adds `<meta name="forge-pro:verify" content="<token>">` to the
   preview page and clicks Verify.
3. App fetches the URL (server-side, 10 s timeout), parses `<meta>` tags,
   compares the token. Match → token recorded on the submission → submit
   allowed. Mismatch → clear message ("token not found — add the meta tag to
   your preview page and deploy").

**URL rules (enforced at submit, mirrored in the runner's fetch helper — §13
of qa-gate.md):**
- scheme must be `https` (http only for local dev, and the runner blocks
  loopback/private ranges anyway)
- host must not resolve to a private/loopback/link-local address (DNS check)
- must respond 2xx to a HEAD/GET probe from the app (10 s timeout) — this
  catches dead URLs before they burn a CI run

**Config flag:** `REQUIRE_VERIFICATION_TOKEN=true` is the default; setting it
false degrades to reachability-only (documented as a trust downgrade).

**Known v1 gap (stated, not hidden):** the gate tests the preview URL, buyers
download the zip. The meta-tag binds the *URL* to the vendor; the *zip* is
bound by hash but not rebuilt by the gate. §12 closes this later by having the
gate build the zip in CI and test the built artifact.

## 7. Zip upload & artifact_sha256

**Flow (server-authoritative hash — the client never dictates the hash):**
1. Vendor picks a file in the portal → `POST /api/vendor/submissions/[id]/upload`
   with a **raw binary body** (`Content-Type: application/zip`). Raw binary was
   chosen over multipart: same requirements, no multipart parsing machinery
   (no boundary bugs, no extra dependency).
2. The route pipes the body through a validation transform (SHA-256 computed
   server-side while streaming; PK magic bytes checked on the first four;
   size cap 50 MB; content-type must be zip/octet-stream) and spools to a
   temp file — memory stays bounded, and validation completes **before**
   anything touches storage, so a rejected file never reaches the bucket.
3. On success the temp file uploads to Supabase Storage
   (`vendor-uploads/{submissionId}/source-{sha12}.zip`, private bucket) — the
   hash suffix makes old uploads immutable and preserved.
4. On success: `submissions.zip_url` set + `submissions.artifact_sha256` = the
   server-computed hash. The hash then flows into every `qa_jobs` and
   `qa_reports` row (§8) — the verdict is pinned to this exact artifact.
5. Re-upload recomputes the hash; old objects stay in the bucket under their
   hash-suffixed keys so a report always points at the artifact it actually
   tested.

**Publish move:** on `published`, the zip is copied to the downloads layout
(`template-files/{kind}s/{slug}/v{version}/template.zip` per architecture
§1.6). The uploads bucket stays private; the template-files bucket serves
signed URLs gated by entitlements.

## 8. Queue dispatch & completion callback

Dispatch (app side, mirrors qa-gate.md §11):
1. On submit/resubmit: insert `qa_jobs` (`status=queued`,
   `artifact_sha256=submissions.artifact_sha256`) → `POST repository_dispatch`
   to the forge-pro repo with `{ jobId }`.
2. On `error` completion: if `qa_jobs` attempts < 2, reset to `queued` and
   re-dispatch; else leave `error` and surface a banner in the portal.

Completion (`POST /api/qa/complete`, internal secret):
1. Verify shared secret; parse the runner's payload (`jobId` + the full
   `report.json`, zod-validated by `QaCompletePayloadSchema`).
2. Load the job; load its submission.
3. **Idempotency guard:** a `qa_reports` row already existing for the job
   means this completion was processed → 200 no-op. (Reports are 1:1 with
   quality runs — **error verdicts create no report row**, they are retryable
   run failures, never quality verdicts.)
4. Insert the `qa_reports` row; mark the `qa_jobs` row passed/rejected
   (completion is the app's job — the runner delivers the report and moves
   on); set `submissions.current_qa_report_id`; advance the state machine
   (§3):
   - passed → qa_passed (then the publish step, §9)
   - rejected → qa_rejected (vendor sees the report + resubmit action)
   - error → retry: if `qa_jobs.attempts < retry.maxAttempts`, reset the job
     to `queued` and re-dispatch; else leave it `error` (banner in portal)
5. On `passed`, the publish step runs. If publish fails, submission stays
   `qa_passed` and the portal shows "publish failed — retry" (the publish step
   is idempotent, so retrying is safe).

`qa_jobs` gains an `attempts` column (int, default 0) to drive the error retry.

**Demo-mode regression test** — `apps/app/tests/demo-loop.e2e.test.tsx`
(vitest) drives the real route handlers through the whole cycle — create →
verify (against a real local HTTP server, plus token-mismatch and SSRF-guard
negatives) → submit (guard order included) → simulate completion (rejected +
passed) → report rendering via `ReportView` — plus the admin flows
(approve/revoke with idempotency + 404s, unpublish with the published-only
guard), a render of the real `/vendor` page asserting the `Unpublished` tag
and the Live-listings stat, and the runner callback contract: POSTs
runner-style payloads to `/api/qa/complete` and asserts the state-machine
advancement (passed/rejected/error), the idempotency guard on replay, and
the unknown-job 404 / malformed-payload 400. The store is isolated in a
throwaway `DEMO_STORE_DIR` per block. Run with `pnpm test` from the repo
root; it needs `pnpm build` first (turbo's `test` task depends on `^build`).

**Browser-level e2e** — `apps/app/e2e/` (Playwright) runs the **production
build** (`next start`, port 4190) against an isolated demo store (`.e2e-demo`)
with `ALLOW_DEMO_MODE=1`, in real Chromium. `vendor-form.spec.ts` clicks the
whole vendor cycle: dashboard → 3-step form (catalog → ownership proof
against a real local preview page → zip) → submit → simulate the runner →
rejected report renders, then the dashboard row shows the score.
`admin.spec.ts` clicks the admin UI: approve/revoke vendor applications and
unpublish a live submission (inline confirm), then asserts the vendor
dashboard shows the `Unpublished` tag with Live listings at 0.`visual.spec.ts` adds golden screenshots (`toHaveScreenshot`) for the
  dashboard, the rejected report detail, and the passed report page. Goldens
  are deterministic because the webServer pins `DEMO_FIXED_NOW` (fixture
  dates) and `TZ=UTC` (locale rendering), the visual spec resets the demo
  store so it renders regardless of earlier specs, and **fonts are pinned by
  running inside the e2e image** (`Dockerfile.e2e`, built from the pinned
  `mcr.microsoft.com/playwright:v1.62.0-noble` base + a fixed font set). The
  CI e2e job and the golden regeneration both run in that image, so the
  committed goldens always match what CI compares — no OS pinning needed.
  Regenerate after intentional UI changes via the **visual-update** workflow
  (it regenerates in the container and opens a PR); never regenerate on a
  host OS. **Drift gate:** regeneration compares the committed goldens
  against the fresh ones (pixelmatch, same algorithm Playwright uses) and
  fails *before committing* if any golden drifts past the `max_drift_ratio`
  input (default 5% of pixels) — an unintended large drift (font
  substitution, layout collapse) blocks instead of silently updating the
  baseline, with a per-golden report in the run log. Run with
  `pnpm --filter @forge-pro/app e2e` (builds first) or `pnpm e2e` at the
  root. The full container workflow — build/run aliases, golden
  regeneration, and what each workflow file does — lives in the root
  [README → "E2E + visual regression in the container"](../README.md#e2e--visual-regression-in-the-container);
  the golden-change review checklist (when to regenerate, how to read the
  drift report, when to raise the threshold) is in
  [CONTRIBUTING.md](../CONTRIBUTING.md#the-golden-change-review-checklist).

**Targeting (env overrides):** `E2E_PORT` (default 4190) and `E2E_DEMO_DIR`
(default `.e2e-demo`) tune the local server; `E2E_TOKEN_PORT` (default 4191)
tunes the spec's local preview server. Setting `E2E_BASE_URL` targets a
**deployed demo instance** instead — no local server is started and the
suite hits that URL directly; the vendor-form spec (loopback ownership
proof) and the visual goldens (clock/TZ pinning) skip themselves in this
mode, and remote runs assume the demo matches the fixture seed. Example:
`E2E_BASE_URL=https://demo.forge.pro pnpm --filter @forge-pro/app e2e`.
`ALLOW_DEMO_MODE=1` is what lets the auth stub's demo identity work under
`NODE_ENV=production` — it is also the escape hatch for deploying a demo.

**CI** (`.github/workflows/ci.yml`) runs both layers on every push/PR: a
`checks` job (typecheck → lint → build → vitest) and an `e2e` job that runs
**inside the pinned e2e image** (`ghcr.io/…/forge-pro-e2e:v1.62` — built
from `Dockerfile.e2e` by `build-e2e-image.yml`, which also gives the font
pin for the visual goldens), builds the app + workspace deps, and runs the
Playwright spec against `next start`. **Caching:** the container bind-mounts
the runner's temp dir at `/cache`; `actions/cache` restore/save steps
persist the **pnpm store** (`PNPM_STORE_DIR=/cache/pnpm-store`, keyed on the
lockfile — installs run `--prefer-offline`) across runs, and turbo task
outputs use **Vercel Remote Cache** (OIDC, shared across jobs and
contributors — see README → Remote turbo cache for the one-time setup; the
OIDC step is skipped cleanly when `TURBO_TEAM` is unset). Every run's job
summary shows a **cache breakdown** — the pnpm store's hit/miss, the turbo
remote-cache status, and turbo's `Cached: N cached` line — so cache
effectiveness (and regressions in it) is visible per run. This is the repo's
own regression gate
— distinct from the `qa-gate` runner workflow (docs/qa-gate.md §11), which
stays repository_dispatch-only and lands with the runner integration.
First-time setup for a fresh fork: run the `build-e2e-image` workflow once
so the container reference resolves. **Golden bootstrap:** because the
`-linux` goldens are generated inside the container, the first e2e CI run
after switching to this setup is red on the visual spec until you run the
`visual-update` workflow once — it regenerates the goldens in the container
and opens a PR; merge it and CI goes green. After that, only intentional UI
changes need a `visual-update` run.

**Production smoke** (`.github/workflows/demo-smoke.yml`) runs the admin
spec against a **deployed demo** via `E2E_BASE_URL` — no build, no local
server. Trigger it manually with the `demo_url` input, or set the
`DEMO_URL` repository variable and let the **nightly schedule** (02:17 UTC)
smoke it automatically. A missing target (no input, no variable) skips
gracefully instead of failing — so the nightly stays green until a demo
actually exists. A failed run files one `[demo-smoke]` issue (deduplicated
on the stable title, so repeated nightly failures don't spam the tracker)
and a later passing run auto-closes it. The target must be in demo mode
(`ALLOW_DEMO_MODE=1`, no Supabase) and seeded from the fixtures, since the
admin spec asserts on the fixture rows.

## 9. Publish step (auto, idempotent)

Runs on every `passed` completion, safe to re-run:

1. **Slug** — slugify(title); if the slug already exists in Sanity for this
   `_type`, append `-2`, `-3`, … (deterministic, so retries converge).
2. **Sanity doc** — `createOrReplace` a template/component document at
   `_id = {kind}.{slug}` with the submission's metadata, `published: true`,
   `vendor` reference, `versions[]` seeded from `submittedVersion`, and the
   `qaBadge` object built from the winning report (status=verified,
   compositeScore, scores, lastRunAt, reportUrl).
3. **Zip move** — copy `vendor-uploads/{id}/source.zip` →
   `template-files/{kind}s/{slug}/v{version}/template.zip`.
4. **Link** — `submissions.item_sanity_id = {kind}.{slug}`,
   `submissions.status = published`, `published_at` set.
5. **Rollback note** — steps 1–4 are individually idempotent; on failure the
   whole step re-runs from the top on retry. Nothing is half-visible to
   buyers: `published: false` until every step has succeeded.

Buyers see the listing immediately (storefront is Sanity-only); the badge
carries the gate's real scores and a `reportUrl` into the report.

## 10. Resubmission & version updates (baseline interplay)

**Rejected → resubmit:** vendor re-uploads the zip (same submission, new job;
optionally bumps `submittedVersion` for a patch). The gate runs the full
suite again. Visual regression diffs against the previous *baseline*:

- Baseline target resolution:
  - submission never published → diff against the previous passing job of
    this submission (`qa_reports.is_baseline` on the same submission);
  - submission is an *update* to a published item (`item_sanity_id` set) →
    diff against the item's latest passing baseline (across submissions) —
    this is what makes the version-update flow meaningful.
- Baseline rotation follows qa-gate.md §6: a passing resubmit becomes the new
  baseline; a rejected one keeps the old.

**Update to a live item:** vendor edits the published item (from the item's
dashboard) → creates a *new* submission with `item_sanity_id` set to the
item's Sanity id, `submittedVersion` bumped. On pass, the publish step patches
the existing Sanity doc instead of creating one (append `versions[]`, refresh
`qaBadge`). This is the changelog/update-notification hook for later phases.

## 11. Data model deltas (v0.2 → v0.3)

`submissions` gains (schema landed in `@forge-pro/shared-types` as
`SubmissionSchema` v0.3 + the strict `SubmitSubmissionSchema` for the submit
boundary):

- `framework`, `stack` (text[]), `category`, `component_type` (nullable),
  `price_cents`, `currency` — catalog metadata captured at submit
- `screenshots` (text[] of storage paths)
- `verification_token` (nullable; set once ownership is proven)
- `zip_url`, `artifact_sha256` (moved up from "later"; already in v0.2)
- `item_sanity_id` (already in v0.2; now also the *update* link)
- `withdrawn_at` (nullable), `published_at` (nullable)
- status enum extended: `+ withdrawn`

No new tables. `qa_jobs`/`qa_reports` unchanged (§8 consumes them as-is).

## 12. Abuse & operational controls

- **Per-vendor limits (config):** ≤ 3 submissions/day, ≤ 5 in-flight; enforced
  app-side (checked on submit) and listed on the dashboard.
- **Upload caps:** zip ≤ 50 MB; screenshots ≤ 6 × 5 MB; hash + magic-byte
  checks server-side.
- **URL controls:** https-only, no private/loopback, ownership token
  (default on), reachability probe.
- **Callback security:** `/api/qa/complete` gated by a shared secret; the
  runner's Supabase key is scoped and ephemeral (qa-gate.md §13).
- **Admin audit:** every state transition is visible as `qa_jobs` +
  `qa_reports` history — no destructive deletes; withdraw/unpublish are
  additive.
- **Fraud note:** the gate proves *quality*, not *originality*. Copied/stolen
  code is a human judgment: buyers can report, admin unpublishes and revokes
  the vendor. Out of scope for automation.

## 13. Build order (Phase 2 milestones)

> **Status:** the portal UI is built and running in demo mode (no Supabase
> needed): dashboard with derived status chips, the 3-step new-submission form
> (create draft → verify preview URL → submit), submission detail with
> timeline + inline report, and the historical report view with score bars and
> failed-check lists. The full loop works against a file-backed demo store
> (`apps/app/.demo/`, gitignored), and **the QA cycle itself is exercisable**: a
> queued submission shows a "Demo: simulate the runner" card whose pass/reject
> buttons build a report and run it through the same completion path the real
> runner callback uses (`POST /api/qa/complete` in demo mode skips the secret
> + DB and advances the store via the state machine). Real auth/storage wiring
> is the remaining Session 4 work.

- **V1 — Model + skeleton.** `submissions` v0.3 schema + zod in shared-types;
  vendor-role gate; dashboard list with derived status. **UI landed:**
  `/vendor` dashboard, `/vendor/new` form, `/vendor/submissions/[id]`,
  `/vendor/submissions/[id]/report/[jobId]` — all demo-mode functional
  (`apps/app/src/lib/vendor/portal-data.ts` switches between Supabase and
  fixtures; `demo-store.ts` backs the form loop in memory). The preview-URL
  verification (`verifyPreviewUrl` in `preview-verify.ts`) is real in both
  modes: SSRF-safe fetch + meta-tag token check.
- **V2 — Upload + validation.** Streamed upload route with server-side hash;
  zip/size/type checks; form with field-level zod errors.
- **V3 — Preview proof + submit.** URL rules, meta-tag verification,
  reachability probe; submit → `qa_jobs` insert → repository_dispatch.
- **V4 — Completion + publish.** `/api/qa/complete` with idempotency guard;
  publish step (Sanity doc + badge + zip move); report view on the detail
  page.
- **V5 — Resubmit + withdraw + updates.** State-machine completion, baseline
  target resolution, version-update flow, admin unpublish.
- **V6 — Hardening.** Limits, error-banner UX, e2e test of the whole flow with
  a mock runner, Argus ports that remain.

## 14. What v1 deliberately does NOT do

- No Stripe Connect payouts (manual, per architecture §6 resolved).
- No gate-built zips (zip ≡ preview is §12 of qa-gate.md's future — the
  integrity upgrade).
- No email/webhook notifications (in-app only).
- No vendor self-service threshold tuning (platform-owned config).
- No marketplace search/recommendations for vendors (that's the storefront's
  Phase 1 work, unchanged).
