# Forge Pro

An AI-native, **self-QA'd** marketplace for website templates and individual UI
components. The defining feature: every vendor-submitted item is automatically
quality-tested by a Playwright-based QA gate (visual regression, responsive
checks, broken-link scan, Lighthouse scoring) before it can go live. Passing
items earn a public **QA Verified** badge with the score attached.

Two-sided marketplace: buyers browse/buy/deploy; vendors submit and get
automated quality reports. Built by a solo QA engineer — the QA gate is the
product.

## Architecture

Astro storefront + Next.js app in one pnpm/Turborepo monorepo, with Sanity for
catalog metadata and Supabase for everything transactional (orders, licenses,
subscriptions, QA reports, AI conversations). Stripe for payments, Anthropic
Claude for the AI Concierge and (later) the post-purchase code assistant.

Full architecture, folder layout, and data model: [`docs/architecture.md`](docs/architecture.md).
Detailed Phase 2 QA-gate design (Playwright suites, Lighthouse thresholds, report format, CI wiring): [`docs/qa-gate.md`](docs/qa-gate.md).
Phase 2 vendor submission flow (state machine, forms, preview-URL proof, upload hashing, publish step): [`docs/vendor-portal.md`](docs/vendor-portal.md).
Supabase schema + RLS policy matrix (Session 4 migrations): [`supabase/`](supabase/README.md).

## Quickstart

```bash
pnpm install
pnpm dev:storefront   # http://localhost:4321
pnpm dev:app          # http://localhost:3000
pnpm dev:studio       # Sanity Studio (needs SANITY_PROJECT_ID)
```

Without any credentials the storefront runs on a mock catalog and the app's
env-gated integrations (Supabase, Stripe, Anthropic) are safely disabled.

## E2E + visual regression in the container

Contributing? See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the golden-change
review checklist (when to regenerate, how to read the drift report, when to
raise the threshold).

The browser e2e suite (vendor form, admin governance, and the visual golden
screenshots) runs inside a **pinned Docker image** (`Dockerfile.e2e`) so the
whole layer — Chromium, system deps, and crucially **fonts** — is identical
on any machine. The visual goldens are generated *inside* this image and
compared only inside it; regenerating them on a host OS will fail CI on font
metrics alone.

### Build and run locally

Root-level npm script aliases wrap the long `docker` invocations (they build
and run against your checkout with the workspace mounted at `/workspace`;
`--init` and `--ipc=host` are required for Chromium):

```bash
pnpm docker:build      # build the image (Playwright v1.62 noble base + pnpm + pinned font set)
pnpm docker:e2e        # run the full Playwright suite in the container
```

The equivalent raw commands, if you want them:

```bash
docker build -f Dockerfile.e2e -t forge-pro-e2e .
docker run --rm --init --ipc=host -v "$PWD":/workspace forge-pro-e2e \
  pnpm --filter @forge-pro/app exec playwright test
```

The first run installs and builds inside the container (a few minutes);
subsequent runs reuse the image. Install/build caches are persisted *in CI*
via the workflow's bind mount (see below) — for local runs, the fresh
container is expected to rebuild.

### Regenerate the visual goldens

Goldens must be regenerated in the same pinned image CI uses — never on the
host. Two options:

1. **CI (recommended):** run the `visual-update` workflow from the Actions
   tab. It regenerates in the container, enforces the **drift gate** (fails
   before committing if any golden changes more than the `max_drift_ratio`
   input, default 5% of pixels), and opens a PR with the new `-linux`
   goldens. Review the diff — a golden change with no UI change means a
   font/layout regression.
2. **Locally with Docker:** `pnpm docker:regenerate` — runs the platform
   self-check (goldens must be `*-linux.png`), then installs, builds,
   regenerates the goldens, and runs the drift gate in one shot:

   ```bash
   pnpm docker:regenerate
   ```

   If the drift gate fails, the change is large enough to deserve a
   deliberate decision before committing.

### First container run on a fresh fork

The e2e layer depends on two things that don't exist until you create them:
the published image (`ghcr.io/<owner>/forge-pro-e2e:v1.62`) and the
`-linux` goldens (which can only be born inside that image). Until then, the
e2e CI job is red. **Shortcut:** `pnpm bootstrap:e2e` (needs the `gh` CLI,
authenticated) runs steps 1 and 3 back-to-back — it dispatches the image
build, waits for it to publish, then dispatches the golden regeneration.
The manual sequence:

1. **Publish the image once** — Actions → `build-e2e-image` → Run workflow.
   (It also re-runs automatically whenever `Dockerfile.e2e` changes on
   `main`.) Without this step the e2e job fails pulling the container.
2. **Expect the first e2e CI run to be red** on the visual spec — the
   `-linux` goldens don't exist yet, and CI cannot generate them (only the
   container can). The `checks` job and the vendor-form/admin specs still
   pass.
3. **Run `visual-update`** — it regenerates the goldens inside the
   container; the drift gate passes on bootstrap (nothing to compare), and
   it opens a golden PR with the fresh `-linux` files. (`pnpm
   bootstrap:e2e` does steps 1 and 3 for you.)4. **Merge the golden PR** — the e2e job now compares against the committed
   goldens and goes green.
5. **Done.** From here on, only intentional UI changes need another
   `visual-update` run (see CONTRIBUTING.md for the review checklist).

**Deployed demo:** the nightly smoke (`demo-smoke.yml`) targets a deployed
demo via the `DEMO_URL` repository variable —
`gh variable set DEMO_URL --body https://your-demo.example`. A fresh fork
without one is why the smoke skips gracefully instead of failing; deploy the
demo by running the app in demo mode (`ALLOW_DEMO_MODE=1`, no Supabase) and
point the variable at it. Full detail: vendor-portal.md §8.


### Workflow files

| File | Purpose |
|---|---|
| `Dockerfile.e2e` | The pinned e2e image: Playwright noble base, pnpm, deterministic font set, `gh` for the golden PR. |
| `.github/workflows/ci.yml` | Per push/PR: `checks` (typecheck/lint/build/vitest) + `e2e` (the whole Playwright suite **in the container**, with pnpm-store and turbo caches persisted via a bind mount). This is the repo's regression gate — a golden diff fails it. The e2e job summary includes a per-run cache-effectiveness and spec-timing breakdown. |
| `.github/workflows/build-e2e-image.yml` | Builds `Dockerfile.e2e` and publishes `ghcr.io/<owner>/forge-pro-e2e:v1.62` on Dockerfile changes to main (or manual). Run once on a fresh fork so the e2e job's container reference resolves. |
| `.github/workflows/visual-update.yml` | Manual: platform self-check, regenerates goldens in the container, enforces the drift gate, opens a golden PR with the per-golden drift report embedded in the body. Shares the e2e job's cache mount, so install/build are warm. |
| `.github/workflows/demo-smoke.yml` | Nightly (02:17 UTC) + manual: runs the admin spec against a deployed demo via `E2E_BASE_URL`; files a deduplicated issue on failure and auto-closes it when green again. |

## Remote turbo cache (Vercel OIDC)

Turbo task outputs are cached in **Vercel Remote Cache**, shared across the
`checks` job, the `e2e` job, the `visual-update` workflow, and any
contributor's machine — replacing the per-container local turbo cache (the
pnpm store still persists via the CI bind mount, since remote caching only
covers turbo task outputs, not dependency storage).

**One-time setup** (two steps, both outside this repo):

1. **Vercel dashboard** — on your team, go to *Settings → Build and
   Deployment → OIDC Policies for CLI Access*, click *Add* next to
   "Turborepo CLI Policies", and create a policy for this GitHub account and
   repository (optionally restricted to a workflow or branch).
2. **Repository variable** — set `TURBO_TEAM` to your Vercel team slug or ID
   (from the team's *General* settings):

   ```bash
   gh variable set TURBO_TEAM --body "your-team-slug"
   ```

**Already wired** — no workflow edits needed once the variable exists: the
`ci.yml` (`checks` + `e2e`) and `visual-update` jobs declare
`id-token: write` and run the OIDC exchange step before any turbo command.

**Behavior without the variable:** the OIDC step is skipped, turbo logs no
remote caching, and builds run on the ephemeral per-run cache — jobs still
pass, they just don't share cache. A fresh fork is fully functional before
the Vercel setup.

**Local contributors** can opt in with `pnpm dlx turbo login`, which links
their machine to the same team and shares the cache with CI.

**Verification:** a configured run's build log prints `Remote caching
enabled`, and the e2e job's summary shows the turbo row as
`remote (OIDC)` plus turbo's `Cached: N cached` line.

## Desktop app (Windows)

`apps/desktop` is an **Electron shell** that runs the portal's production build
in **demo mode** inside a native window — a real, installable desktop app of
the vendor portal, no Node, Supabase, or network needed at runtime.

How it works:

- The app's `next.config.mjs` emits **standalone output**; `pnpm desktop:prepare`
  builds the workspace, stages `.next/standalone` + `.next/static` into
  `apps/desktop/runtime/app` (relinking pnpm's store and healing trace gaps —
  the runtime is fully relocatable), and `electron-builder` mounts that
  directory as the app's `resources/app`.
- The Electron main process (`apps/desktop/src/main.js`) spawns the staged
  `server.js` using Electron's bundled Node (`ELECTRON_RUN_AS_NODE=1` — no
  Node installation on the user's machine), waits for the portal to answer,
  and opens it at `http://127.0.0.1:4310/vendor`. `ALLOW_DEMO_MODE=1` pins the
  demo vendor/admin identities; the file-backed demo store persists under the
  OS user-data dir, so portal state survives restarts.

```bash
pnpm desktop:prepare   # build + stage the runtime (after any app change)
pnpm desktop:dev       # stage + launch the shell from the repo
pnpm desktop:package   # stage + build the Windows installer (NSIS, x64)
```

The installer lands at `apps/desktop/release/Forge Pro-Setup-0.1.0.exe`
(≈90 MB). First `desktop:package` run downloads Electron + NSIS tooling.

A **PDF user guide** ships alongside the app: `apps/desktop/Forge-Pro-Desktop-Guide.pdf`
— installation, a step-by-step submission walkthrough with real screenshots of
the app, reading QA reports, fix-and-resubmit, admin governance, and end-to-end
example journeys from deployment to sale. The source is `apps/desktop/guide/`
(`guide.html` + screenshots in `img/`); `pnpm desktop:guide` restages the
runtime, re-captures the screenshots from the live portal, and regenerates the
PDF. The installer bundles the PDF, and the app's <b>File → Open user guide</b>
menu (F1) opens it.

## Seed the Sanity catalog

```bash
# 1. Copy apps/studio/.env.example → apps/studio/.env and fill in
#    SANITY_PROJECT_ID (+ SANITY_TOKEN to write)
pnpm seed
```

## Phase status

| Phase | Scope | Status |
|---|---|---|
| 1 (MVP) | Storefront, Stripe checkout, Supabase auth + dashboard, manual uploads, AI Concierge | Scaffold done (Session 2); browsing UI, checkout, auth, concierge pending |
| 2 | Vendor portal, **automated QA gate**, component listings, license tracking, subscriptions | QA gate M1–M2 done (smoke suite + composite/verdict engine, fully tested) and M4 runner workflow written — links/visual/Lighthouse suites not yet implemented (M2–M3 suites). Vendor portal built and demo-tested end to end (submission state machine, admin governance, report views, file-backed demo store; three test layers: vitest, production-build Playwright, container visual goldens). Real-mode wiring (live Supabase, published e2e image, goldens, remote cache) exists but awaits its first live run. Component listings, license tracking, subscriptions pending |
| 3 (stretch) | AI customization preview, code assistant, one-click deploy, affiliates, multi-framework export | Not started |
