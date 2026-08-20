#!/usr/bin/env bash
#
# One-command fresh-fork bootstrap for the e2e container layer.
#
# Collapses the first two manual Actions dispatches from the README's "First
# container run on a fresh fork" checklist into a single command:
#
#   1. dispatch build-e2e-image  (publishes ghcr.io/<owner>/forge-pro-e2e)
#   2. WAIT for it to finish      (visual-update runs in that image, so it
#                                  must exist first)
#   3. dispatch visual-update     (regenerates the -linux goldens in the
#                                  container and opens the golden PR)
#
# The golden PR still needs a human to merge it (that is the point of the
# drift gate) — this script just removes the two manual dispatches.
#
# Requirements:
#   - the gh CLI, authenticated to the repo (https://cli.github.com)
#
# Usage:
#   pnpm bootstrap:e2e            # from the repo root
#   bash scripts/bootstrap-e2e.sh --dry-run   # show what would run, do nothing
#   bash scripts/bootstrap-e2e.sh --help

set -euo pipefail

DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --help | -h)
      # Print the header comment only — up to the first non-comment line.
      sed -n '2,/^[^#]/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "unknown argument: $arg (try --help)" >&2
      exit 2
      ;;
  esac
done

step() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
die() { printf '\033[31m%s\033[0m\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------
step "Preflight"

if [ "$DRY_RUN" -eq 1 ]; then
  # Best-effort in dry-run: show the plan even without gh/auth, so the mode
  # is usable as a pure "what would this do" preview.
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1 && \
     REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null); then
    DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name 2>/dev/null) || DEFAULT_BRANCH=main
    echo "repo:     $REPO (dry-run)"
    echo "branch:   $DEFAULT_BRANCH"
  else
    DEFAULT_BRANCH=main
    echo "note:     gh/auth unavailable — showing the plan with branch=main"
  fi
else
  command -v gh >/dev/null 2>&1 || die "The gh CLI is required (https://cli.github.com)."
  gh auth status >/dev/null 2>&1 || die "gh is not authenticated — run 'gh auth login' first."
  REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner) ||
    die "Could not read the repository — are you in a git checkout with a remote?"
  DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)
  echo "repo:     $REPO"
  echo "branch:   $DEFAULT_BRANCH"

  # Informational: remote turbo cache is a separate, optional setup.
  if ! gh variable list --json name --jq '.[].name' 2>/dev/null | grep -qx 'TURBO_TEAM'; then
    echo "note:     TURBO_TEAM is not set — Vercel Remote Cache is off (fine; see README → Remote turbo cache)"
  fi
fi

# ---------------------------------------------------------------------------
# dispatch <workflow> [extra gh args…]
# Dispatch the workflow on the repo's default branch, wait for the new run to
# appear, and echo "id<TAB>url" for it. gh's createdAt is ISO-8601 UTC, so a
# lexicographic >= against the pre-dispatch timestamp picks the run we just
# created (not a stale one).
# ---------------------------------------------------------------------------
dispatch() {
  local workflow="$1"
  shift
  local before run
  before=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  gh workflow run "$workflow" --ref "$DEFAULT_BRANCH" "$@" || die "failed to dispatch $workflow"

  echo "waiting for $workflow to start…"
  for _ in $(seq 1 30); do
    run=$(gh run list --workflow="$workflow" --limit 5 --json databaseId,createdAt,url \
      --jq "map(select(.createdAt >= \"$before\")) | sort_by(.createdAt) | reverse | .[0] // empty | \"\\(.databaseId)\t\\(.url)\"")
    [ -n "$run" ] && break
    sleep 2
  done
  [ -n "$run" ] || die "could not find the dispatched $workflow run (check the Actions tab)."
  printf '%s\n' "$run"
}

# ---------------------------------------------------------------------------
# Step 1 — publish the e2e image, wait for it
# ---------------------------------------------------------------------------
step "1/2 — Publish the e2e image"
if [ "$DRY_RUN" -eq 1 ]; then
  echo "[dry-run] would dispatch: gh workflow run build-e2e-image.yml --ref $DEFAULT_BRANCH"
  echo "[dry-run] would wait for it to finish"
else
  run=$(dispatch build-e2e-image.yml)
  id=${run%%$'\t'*}
  url=${run#*$'\t'}
  echo "run:      $url"
  echo "watching (this blocks until the image is published)…"
  gh run watch "$id" --exit-status ||
    die "build-e2e-image failed — fix it before regenerating goldens (the golden PR would be built from a broken image)."
  echo "finished: image published"
fi

# ---------------------------------------------------------------------------
# Step 2 — regenerate the goldens in that image, on the repo's default branch
# ---------------------------------------------------------------------------
step "2/2 — Regenerate the visual goldens (opens a golden PR)"
if [ "$DRY_RUN" -eq 1 ]; then
  echo "[dry-run] would dispatch: gh workflow run visual-update.yml --ref $DEFAULT_BRANCH -f base_branch=$DEFAULT_BRANCH"
  echo "[dry-run] done — nothing was dispatched."
  exit 0
fi

run=$(dispatch visual-update.yml -f "base_branch=$DEFAULT_BRANCH")
url=${run#*$'\t'}

cat <<EOF

Bootstrap dispatched:
  image published, golden regeneration running — follow it here:
    $url

Next steps (from the README checklist):
  • the regeneration opens a PR titled "Update visual regression goldens"
  • review the golden diff (a change with no UI change means a regression)
  • merge it — the e2e CI job then compares against the committed goldens
    and turns green
  • after that, only intentional UI changes need another visual-update run
EOF
