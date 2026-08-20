# Setup

## Prereqs

- Node >= 22.12 (this repo is developed on Node 26)
- pnpm 11 (`corepack enable` will use the pinned version from root `package.json`)

## Install & run

```bash
pnpm install
pnpm build        # builds all shared packages first
pnpm dev:storefront   # Astro  — http://localhost:4321
pnpm dev:app          # Next   — http://localhost:3000
pnpm dev:studio       # Sanity — needs a project id (below)
```

`pnpm dev` runs all three via Turborepo (it builds packages first).

Everything runs with **zero credentials** — the storefront falls back to the
mock catalog, and the app's `/api/health` shows which integrations are live.

## Env files (all optional in the scaffold)

Each app reads its own `.env` (copy from `.env.example`).

### `apps/storefront/.env`
| Var | Needed for |
|---|---|
| `SANITY_PROJECT_ID` | Live catalog instead of mock data |
| `SANITY_DATASET` | Defaults to `production` |

### `apps/app/.env`
| Var | Needed for |
|---|---|
| `SANITY_PROJECT_ID` | Catalog reads (checkout item lookup) — Session 4 |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Auth + buyer dashboard — Session 4 |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side writes (orders, licenses) — Session 4 |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Checkout + webhooks — Session 4 |
| `ANTHROPIC_API_KEY` | AI Concierge — Session 5 |

### `apps/studio/.env`
| Var | Needed for |
|---|---|
| `SANITY_PROJECT_ID` | Studio + seeding |
| `SANITY_DATASET` | Defaults to `production` |
| `SANITY_TOKEN` | Only for `pnpm seed` (needs write access) |

## Seed the catalog into Sanity

```bash
# 1. Create a Sanity project at sanity.io and copy its id.
# 2. Create a token with write access (API → Tokens).
# 3. Fill apps/studio/.env
pnpm seed
```

The seed upserts deterministic documents (`category.*`, `template.*`,
`component.*`, `vendorProfile.forge-pro`) so it's safe to re-run.

## QA gate (Phase 2)

The `apps/qa-runner` package is a placeholder CLI. When the gate ships it runs
in GitHub Actions against each submission's preview URL and writes results to
Supabase (`qa_reports`) — see `docs/architecture.md` §1.2.
