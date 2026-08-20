# Contributing to Forge Pro

Thanks for contributing! This guide covers the contribution basics and, in
detail, the one workflow that trips people up: **changing visual goldens**.
For the full e2e/container setup (build, run, regenerate, workflow files),
see [README → "E2E + visual regression in the container"](README.md#e2e--visual-regression-in-the-container).

## Getting started

1. Install [pnpm](https://pnpm.io) (the version pinned in
   `packageManager` in `package.json`).
2. `pnpm install` at the repo root.
3. Make your change. Run the fast gates as you go:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test        # vitest — unit + handler-level suites
   ```
4. Run the browser e2e suite. Locally this needs the production build:
   ```bash
   pnpm --filter @forge-pro/app e2e   # next build && playwright test
   ```
   (On a host OS the **visual** spec will fail/be skipped — see below. The
   vendor-form and admin specs run anywhere.)

## Contribution checklist

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` are green.
- [ ] If you changed the dashboard or report views: the visual goldens are
      either unchanged, or regenerated **per the golden review checklist**
      below — never committed from a host OS.
- [ ] If you changed `Dockerfile.e2e`: bump the image tag in
      `build-e2e-image.yml`, `ci.yml`, and `visual-update.yml`, and note in
      the PR that the `build-e2e-image` workflow must run before the e2e job
      can use the new image.
- [ ] If you changed workflows, the YAML parses
      (`python -c "import yaml; yaml.safe_load(open('...'))"`).
- [ ] PR description says whether any golden files changed and why.

## The golden-change review checklist

The visual goldens (`apps/app/e2e/visual.spec.ts-snapshots/*-linux.png`) are
the pixel-level contract for the dashboard and report views. CI's e2e job
compares against them at a **1%** tolerance (`maxDiffPixelRatio: 0.01`), so
*any* meaningful change fails CI until the goldens are updated — and the
only sanctioned way to update them is through the container.

### 1. Do you need to regenerate at all?

Regenerate goldens **only** when the change intentionally alters what the
dashboard or report views render (layout, text, colors, spacing, added
content). If your change is behavior-only (routes, data, handlers) and the
views look the same, you should **not** need a golden change — if CI fails
on a visual spec anyway, something else changed the rendering; investigate
before regenerating.

### 2. Regenerate in the container — never on a host OS

Run the **`visual-update`** workflow from the Actions tab. It:
1. builds the pinned e2e image's environment (same fonts CI compares with);
2. regenerates the `-linux` goldens with `--update-snapshots`;
3. runs the **drift gate** (`apps/app/scripts/golden-drift-check.mjs`);
4. opens a PR with the new goldens.

Never regenerate locally on macOS/Windows/Linux and commit the result —
font metrics differ and the e2e job will fail. The drift gate now *enforces*
this: a host-OS run produces `-win32`/`-darwin.png` goldens, and the gate
refuses them with a "Non-container golden" error instead of silently
passing.

Local alternative (same pinned image, same drift gate):
`pnpm docker:regenerate` — installs, builds, regenerates the goldens, and
runs the drift check in one command. (See also `pnpm docker:build` and
`pnpm docker:e2e` for the build/run aliases.)

### 3. Read the drift report

The drift gate compares the **committed** goldens against the freshly
regenerated ones (pixelmatch — the same algorithm Playwright's comparison
uses) and prints a per-golden table:

```
Golden drift report (old vs freshly regenerated):
  dashboard.png                     1.83%
  report-rejected-detail.png        0.02%
  report-passed.png                 0.00%
Max drift: 1.83%  Threshold: 5.0%
```

- **Under the threshold (default 5%)** — the run proceeds and opens the PR.
  Small single-digit percentages are normal for a deliberate tweak.
- **Over the threshold** — the workflow **fails before committing anything**
  and prints `❌ N golden(s) drifted past the X% threshold`. The repo is
  untouched; the new goldens exist only in the discarded container.
- **A "size change" row** (reported as 100%) means the rendered page
  dimensions changed — that's a layout change, not a tweak, and it always
  blocks.

Interpretation:

| Drift | Meaning | Action |
|---|---|---|
| 0% on all | Nothing changed visually | Don't merge a golden PR — investigate why CI failed instead. |
| < 5% | Small intentional tweak (text, spacing, color) | Review the diff, merge the golden PR, done. |
| > 5%, same layout | Large visual change — unintended drift (font substitution, style bleed) or a major redesign | Inspect the run's diff image. If unintended: fix the UI, re-run. If deliberate: proceed consciously. |
| Size change / 100% | Layout collapsed or page dimensions changed | Almost always a regression. Block and fix. |

### 4. When (and how) to raise the threshold

The default `max_drift_ratio` (5%) exists to catch *unintended* drift while
letting *intentional* tweaks through. Raise it only in these cases:

- **A deliberate large redesign** that changes the whole view (e.g., a new
  dashboard layout). Pass the higher ratio as the workflow input
  (`max_drift_ratio: 0.3`), say so in the PR, and expect future drift checks
  against the *new* goldens to be small again.
- **Temporary debugging** — never raise it and leave it raised; reset to the
  default before merging.

If you find yourself needing to raise the threshold for a *small* change,
that's a sign the views drifted for an environmental reason — investigate
the font/image rendering instead.

### 5. The e2e CI job after merging

After the golden PR merges, the e2e job compares against the new goldens
and should pass. Two special cases:

- **First bootstrap** (no `-linux` goldens exist yet): the first e2e CI run
  is red on the visual spec until you run `visual-update` once. The drift
  gate passes on bootstrap (nothing to compare) and the golden PR fixes CI.
- **A golden diff with no UI change**: don't regenerate — a font/layout
  regression is changing the rendering. Investigate before anything else.

## Workflows at a glance

| File | Trigger | What it does |
|---|---|---|
| `ci.yml` | push / PR | `checks` (typecheck, lint, build, vitest) + `e2e` (full Playwright suite in the container, caches persisted). The regression gate. |
| `build-e2e-image.yml` | `Dockerfile.e2e` change on main / manual | Builds and publishes the pinned e2e image to GHCR. |
| `visual-update.yml` | manual | Regenerates goldens in the container, enforces the drift gate, opens a golden PR. Shares the e2e job's cache mount (warm install/build). |
| `demo-smoke.yml` | nightly + manual | Runs the admin spec against a deployed demo; files a deduplicated issue on failure, auto-closes when green. |
