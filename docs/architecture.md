# Forge Pro — Architecture & Data Model (v0.1)

> Planning artifact for Session 1. No implementation code yet. Decisions marked **[DECISION NEEDED]** are the ones that are expensive to reverse — see §6.

---

## 1. High-level architecture

### 1.1 Two surfaces, one domain

| Surface | Framework | Why | Owns |
|---|---|---|---|
| **Storefront** — `apps/storefront` | Astro | Read-heavy. Ships full server-rendered HTML by default (SEO, crawlers, AI answer engines), JavaScript only as islands. | Marketing pages, catalog browse/search/filter, product pages (with public QA badge), public vendor pages, AI Concierge chat island |
| **App** — `apps/app` | Next.js (App Router) | Genuinely stateful: auth, payments, async work, webhooks. Server Components/Server Actions/Route Handlers. | Checkout, Stripe webhooks, buyer dashboard (orders/downloads/licenses), vendor submission portal, AI API endpoints, QA webhook ingress, (later) deploy API |

The two surfaces share packages — types, design tokens, clients — so they can never drift apart. This split is the same judgment call the original Forge made, and it still holds: it's the honest answer to "what does each page actually do?" rather than a single-framework default.

### 1.2 The QA gate — a first-class async job pipeline (the differentiator)

The hard constraints: the gate needs a real browser + network access, and a run takes minutes. That rules out doing it inline in a request or a serverless function. So it's an **async job pipeline**, designed as a standalone runner so it can move between execution environments:

```
vendor submits (preview URL + zip)
  → submissions row (status: submitted)
  → qa_jobs row (queued)
  → runner picks up job (GitHub Actions at first; a small worker later)
       runs against the submission's PREVIEW URL
       ├─ Responsive/smoke: 4 breakpoints (320/768/1280/1920), no horizontal
       │  overflow, key elements visible, console errors captured
       ├─ Broken-link scan: bounded crawl via request interception, fail on
       │  4xx/5xx / dead anchors
       ├─ Lighthouse: performance / SEO / accessibility / best-practices,
       │  weighted composite score
       └─ Visual regression: baseline screenshots on approved items; version
          resubmits diff against baseline (threshold on % pixels changed)
  → qa_reports row + artifacts (HTML report, JSON, screenshots → Supabase Storage)
  → verdict:
       PASS  → item approved, QA badge patched into Sanity (public: composite
               score, per-category scores, "QA Verified", last-run date)
       REJECT → vendor sees the generated report in the portal, fixes,
                resubmits as a new version → re-run (with baseline diff)
```

Design notes:

- **The report is the product.** Thresholds are configurable and snapshotted into each report so a historical verdict is never reinterpreted after thresholds change.
- **First-time submissions have no baseline**, so "visual regression" for them means screenshot capture + layout/render assertions (no broken layout, no overflow, no console errors). Baseline diffing kicks in on version resubmits — that's where visual regression earns its keep.
- **Runner = standalone CLI package** (`apps/qa-runner`), invoked by a GitHub Actions workflow triggered via repository_dispatch from the app. Running it in CI is free; if turnaround becomes a problem, the same CLI runs on a Fly.io machine / VPS without a rewrite.
- **Argus reuse:** the user's existing Argus project (Playwright + Anthropic QA tooling) is directly portable here — runner scaffolding, prompt templates for report narrative, threshold logic. Reuse rather than redesign in Phase 2.

### 1.3 Data ownership — two sources of truth, one boundary rule

- **Sanity** = editorial truth for *catalog display*: templates, components, public vendor profiles, changelogs, categories. Fast CDN reads; the storefront reads catalog exclusively from Sanity.
- **Supabase** = transactional truth: users/roles, orders, licenses, subscriptions, QA jobs/reports, AI conversations, downloads.
- **Boundary rule:** transactional tables never reference live catalog state. Order items snapshot `(item_type, sanity_id, slug, title, price_cents, currency)` at purchase time — order history and license records survive catalog edits.
- **The one crossing:** the QA verdict is transactional (Supabase), but must appear on the public catalog page. On approval the app patches a `qaBadge` object into the Sanity document via a single callback, so the storefront stays Sanity-only.

### 1.4 Payments (Stripe)

- **One-time (Phase 1):** product page → app route creates a Checkout Session (line item priced from the catalog's stored price) → Stripe redirect → `checkout.session.completed` webhook → create order + order_items + issue license + grant download access → buyer lands on `/dashboard/orders/[id]` with download + receipt.
- **Subscriptions (Phase 2):** Stripe Customer Portal for management; `invoice.paid` extends access. Customer IDs live on `profiles`.
- **Vendor payouts (Phase 2):** depends on the revenue-share decision — see §6. If automatic splits are wanted, that's a Stripe Connect (Express) integration with platform fees and vendor onboarding; if payouts can be manual for a while, Connect can wait.

### 1.5 Auth & roles (Supabase)

Email/password + OAuth (Google/GitHub). `profiles.role` = `buyer | vendor | admin`. Row Level Security on every table; policies by owner + role. Phase 1: the owner is the only vendor (seeded as admin/vendor); the public vendor-approval flow is Phase 2.

### 1.6 Files & downloads

Supabase Storage, private bucket `template-files`, keys `templates/{slug}/v{major}.{minor}/template.zip`. Downloads are signed URLs (short TTL) issued by an app route that checks the caller's license/subscription first. Version bumps add new objects; changelogs live in Sanity; buyers can re-download the latest version (Phase 2).

### 1.7 AI Concierge

Astro chat island → `POST /api/ai/concierge` on the app (SSE streaming). Claude is grounded in the *real* catalog via a `search_catalog` tool (function calling against Sanity) instead of stuffing every document into context. Conversation history in Supabase (`ai_conversations` + `ai_messages`). Anonymous users allowed with a message cap. The Anthropic key exists only in the app's server env.

### 1.8 Hosting & deploys

- Both web apps: **Vercel** (default — one platform, preview deploys per PR, the QA gate's preview URLs can come from here).
- QA runner: **GitHub Actions** initially (free, zero infra).
- The "one-click deploy to the buyer's own Vercel/Netlify account" is Phase 3 and needs OAuth to the target platform — noted, not designed yet.

---

## 2. Monorepo structure

Tooling: **pnpm workspaces + Turborepo** (matches the author's existing setup — proven, zero new tooling to learn), TypeScript strict everywhere, shared ESLint/Prettier/tsconfig via the config package.

```
forge-pro/
├─ apps/
│  ├─ storefront/        # Astro — marketing, catalog browse/search/filter,
│  │                     #   product pages + QA badge, vendor pages, concierge island
│  ├─ app/               # Next.js — checkout, webhooks, buyer dashboard,
│  │                     #   vendor portal, license dashboard, AI API,
│  │                     #   QA webhook ingress, (P3) deploy API
│  ├─ studio/            # Sanity Studio — catalog metadata, vendor profiles, changelogs
│  └─ qa-runner/         # Standalone CLI: Playwright + Lighthouse QA gate
│                        #   (runs in CI today, on a worker later)
├─ packages/
│  ├─ shared-types/      # Domain entities + Zod schemas — single source of truth
│  │                     #   for every cross-boundary DTO
│  ├─ design-system/     # Design tokens (CSS variables) + UI primitives,
│  │                     #   usable from both Astro and React
│  ├─ db/                # Supabase client, SQL migrations, generated types
│  ├─ cms/               # Sanity schemas, client, generated types
│  ├─ ai/                # Anthropic client wrapper + prompt templates
│  │                     #   (concierge now; code assistant later)
│  ├─ payments/          # Stripe helpers, webhook typings, price constants
│  └─ config/            # tsconfig / eslint / prettier presets
├─ docs/                 # this doc, setup.md (env keys), phase runbooks
├─ package.json
├─ pnpm-workspace.yaml
└─ turbo.json
```

Deliberate boundaries:

- `qa-runner` is an **app**, not a package — it's a deployable unit, and it must *not* import from the web apps (only from `shared-types` and `db` for writing results).
- Web apps import downward into `packages/*` only; no cross-app imports.
- `shared-types` owns Zod schemas for every boundary: order creation, QA verdict payloads, webhook events, AI request/response.

---

## 3. Data model

### 3.1 Supabase (transactional) — *v0.3*

Changes since v0.1: unified `entitlements` as the single access-control path;
order_items now snapshot version + vendor revenue share; licenses become the
public key artifact only; RLS is a concrete policy matrix; QA artifacts are
hash-pinned and visual-regression baselines are explicit; indexes/constraints
are spelled out. v0.3 (vendor portal): `submissions` gains catalog metadata,
ownership token, withdraw/publish timestamps, and the `withdrawn` status —
spec in docs/vendor-portal.md §11. Items marked **[pre-S4]** must land with the
Session 4 schema; **[P2]** items wait for their phase.

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | `id` (uuid, = auth.users.id), `email`, `full_name`, `role` (buyer\|vendor\|admin), `vendor_id` FK, `stripe_customer_id`, timestamps | One row per auth user; role drives RLS |
| `vendor_profiles` | `id`, `user_id` FK unique, `display_name`, `bio`, `website`, `approved_at`, (P2) Stripe Connect fields | Identity + payout; public page content stays in Sanity |
| `orders` | `id`, `user_id` FK, `stripe_session_id` (unique), `stripe_payment_intent_id`, `status` (pending\|paid\|refunded), `total_cents`, `currency`, `paid_at`, `refunded_at` nullable, `metadata` jsonb | Created by webhook, not by the client. Refund webhook sets `refunded_at` and revokes entitlements **[pre-S4]** |
| `order_items` | `id`, `order_id` FK, `item_type`, `sanity_id`, `slug`, `title`, `version` (purchased-version snapshot), `price_cents`, `currency`, `vendor_id`, `revenue_share_pct` (snapshot) | **Snapshot** at purchase — never joins live catalog. Stable key `(order_id, item_type, sanity_id)`; slug/title are display copies **[pre-S4]** |
| `licenses` | `id`, `key` (unique, `forge_<uuid>`), `order_item_id` FK (unique), `user_id` FK, `status`, `max_registrations`, `revoked_at` nullable, `created_at` | The public, registerable key for one-time purchases. Access control lives on `entitlements`, not here **[pre-S4]** |
| `license_registrations` | `id`, `license_id` FK, `domain`, `project_name`, `registered_by_user`, `created_at`; **unique (license_id, domain)** | Powers the P2 dashboard; `max_registrations` enforced app-side on insert **[P2]** |
| `entitlements` | `id`, `user_id` FK, `item_type`, `sanity_id`, `source` (purchase\|subscription), `license_id` FK nullable, `subscription_id` FK nullable, `status` (active\|expired\|revoked), `granted_at`, `expires_at` nullable (null = perpetual), `updated_at` | **Single access-check path.** One row per (user, item, source); subscriber rows materialize lazily on first download. Access = one indexed query **[pre-S4]** |
| `subscriptions` | `id`, `user_id` FK, `stripe_subscription_id` (unique), `tier`, `status` (Stripe mirror), `current_period_start/end`, `cancel_at_period_end` | P2. Webhooks keep status/period fresh; grace window applied when computing access **[P2]** |
| `downloads` | `id`, `user_id` FK, `entitlement_id` FK, `item_type`, `sanity_id`, `version`, `file_url`, `downloaded_at` | Audit + analytics; `entitlement_id` is the audit trail **[pre-S4]** |
| `submissions` | `id`, `vendor_id` FK → `profiles(id)`, `item_type`, `status` (incl. `withdrawn`), `title`, `description`, `framework`, `stack` (text[]), `category`, `component_type` (nullable), `price_cents`, `currency`, `screenshots` (text[]), `preview_url`, `verification_token` (nullable), `zip_url`, `artifact_sha256`, `submitted_version`, `item_sanity_id`, `current_qa_report_id`, `withdrawn_at`, `published_at`, `created_at` | P2 vendor portal. Artifact hash pins the QA verdict to the exact code tested; `item_sanity_id` is also the version-update link; catalog metadata captured at submit feeds the auto-publish step **[P2]** |
| `qa_jobs` | `id`, `submission_id` FK, `artifact_sha256`, `status`, `attempts` (int, default 0), `runner_id`, `started_at`, `finished_at`, `error_message`, `created_at` | One per run; resubmits create new jobs; `attempts` counts error retries (max from the gate config) **[P2]** |
| `qa_reports` | `id`, `submission_id` FK, `job_id` FK, `status`, `composite_score`, `scores` jsonb, `visual_diff_pct`, `link_scan` jsonb, `threshold_snapshot` jsonb, `is_baseline` bool, `baseline_of` FK nullable, `report_html_url`, `screenshots` jsonb, `created_at` | First passing run becomes the visual-regression baseline; later runs diff against it **[P2]** |
| `ai_conversations` | `id`, `user_id` nullable, `session_token` (server-issued, httpOnly cookie), `title`, `created_at` | Anonymous allowed; conversations are server-read/write only, never browser-exposed **[pre-S4]** |
| `ai_messages` | `id`, `conversation_id` FK, `role`, `content`, `model`, `token_usage` jsonb, `created_at` | `model` recorded for cost tracking **[pre-S4]** |

**Relationships (core paths):**

- `users 1—N orders 1—N order_items 1—1 licenses 1—N license_registrations`
- `orders/items → entitlements` (source=purchase, via license) and `subscriptions → entitlements` (source=subscription)
- `users 1—N entitlements 1—N downloads`
- `profiles (role=vendor) 1—N submissions 1—N qa_jobs 1—1 qa_reports`
- `users 1—N ai_conversations 1—N ai_messages`

> **Session 4 landed:** the schema + RLS matrix above are implemented in
> `supabase/migrations/` (see `supabase/README.md`). One deviation adopted
> with the migrations: `submissions.vendor_id` references `profiles(id)`
> rather than `vendor_profiles(id)` — "vendor" is a role on the profile, so
> the portal's ownership checks compare user ids directly, and
> `vendor_profiles` stays the public identity/payout extension (`user_id`
> unique). The `qa_reports` row maps to the portal's report view via
> `mapQaReportRowToView` (smoke checks and the AI narrative live in the
> storage artifact, qa-gate.md §9).

**RLS:** enabled on every table. Access architecture: the browser only ever
*reads* the buyer's own rows via Supabase (anon key + user JWT); **every write
goes through the Next.js API with the service-role key**, so RLS protects reads
and is defense-in-depth on the money path.

| Table | Buyer | Vendor | Admin | Notes |
|---|---|---|---|---|
| `profiles` | read own | read own | all | write own non-role fields only |
| `orders` / `order_items` | read own | — | all | inserts via service role only |
| `licenses` | read own | — | all | `verify_license(key)` RPC for third parties **[P2]** |
| `license_registrations` | insert/read own | — | all | insert enforces `max_registrations` app-side |
| `entitlements` | read own | — | all | status writes via webhook/service role only |
| `subscriptions` | read own | — | all | |
| `downloads` | insert/read own | — | all | insert only via app (signed-URL issuance) |
| `submissions` | — | read/write own | all | |
| `qa_jobs` / `qa_reports` | — | read own | all | runner writes via service role |
| `ai_conversations` / `ai_messages` | — (server-only) | — | all | not exposed to the browser |

Helpers (security-definer functions, explicit `search_path`, no recursion):

- `is_admin()`, `is_vendor()` — read `profiles.role`.
- `verify_license(key)` — return registration status without exposing rows **[P2]**.

**Indexes & constraints (the non-negotiables):**

- unique: `licenses.key`, `orders.stripe_session_id`, `order_items (order_id, item_type, sanity_id)`, `entitlements (user_id, item_type, sanity_id, source)`, `license_registrations (license_id, domain)`
- index: `orders (user_id, created_at desc)`, `licenses (user_id)`, `license_registrations (license_id)`, `entitlements (user_id, status)`, `downloads (user_id, downloaded_at desc)`, `qa_jobs (submission_id, created_at desc)`, `ai_messages (conversation_id, created_at)`
- FK behavior: `order_items → orders` CASCADE; `licenses → order_items` RESTRICT; `entitlements → licenses/subscriptions` RESTRICT; `downloads → entitlements` RESTRICT (audit rows never orphan)

### 3.2 Sanity (editorial / catalog)

| Document | Key fields |
|---|---|
| `template` | slug, title, description, framework, stack tags, preview images, **preview URL**, price (cents), category, versions[] (changelog entries), `qaBadge` (patched by app: status, compositeScore, categoryScores, lastRunAt, reportUrl) |
| `component` | same shape as template (P2) |
| `vendorProfile` | slug, display name, bio, links, portfolio of items (public page content only) |
| `category` | slug, name, order, icon |
| `changelogEntry` | version, date, notes, linked template — or embedded in template.versions[] |

Sanity document IDs become the stable `sanity_id` referenced by order_items — never re-keyed.

---

## 4. Phase 1 build order (sessions, per the master doc)

1. Monorepo scaffolding — empty-but-running (pnpm + turbo + both apps + shared config). *Session 2.*
2. Sanity schemas + studio + seeded mock catalog. *Session 2.*
3. Storefront browse/search/filter over the seeded catalog. *Session 3.*
4. Supabase auth + Stripe checkout wired to one real template (orders, licenses, downloads). *Session 4.*
5. Rough AI Concierge chat. *Session 5.*
6. **Ship Phase 1 ugly.** Do not polish forever. *Session 6.*

Phase 2 (vendor portal, QA gate, components, license dashboard, subscriptions) only after Phase 1 has sat untouched for a few days.

---

## 5. What this deliberately does NOT do yet

- No vendor submissions or QA gate in Phase 1 (manual uploads only, owner as sole vendor — matching the roadmap).
- No public badges in Phase 1 (the `qaBadge` field exists in schema but stays empty until Phase 2).
- No subscriptions, license registration, or deploy integration until their phases.
- No multi-framework export, affiliates, or AI customization preview.

---

## 6. Questions needing your answer before Session 2

These are the expensive-to-reverse decisions; everything else above uses a stated default you can override cheaply.

1. **Repo location — [DECISION NEEDED]:** the workspace already contains the original `forge/` repo with the same Astro+Next+Sanity shape. My recommendation, consistent with "don't reuse old Forge context": create **`forge-pro/` as a fresh directory** (new git repo) and leave `forge/` untouched. OK?
2. **Vendor revenue share (Phase 2) — [DECISION NEEDED]:** what split (e.g., 80/20, 70/30)? And more importantly: **automatic Stripe Connect payouts**, or manual payouts to start? Connect is a real integration with vendor onboarding — worth deferring if manual is acceptable. (Default: defer Connect; pay out manually until volume justifies it.)
3. **Subscription scope (Phase 2):** what does the Pro tier actually unlock — all templates, one curated tier, or a subset? This changes licensing logic. (Default: all current + future templates/components.)
4. **QA preview mechanism (Phase 2):** vendors submit a **preview URL** they deploy themselves (Vercel/Netlify) vs. Forge building their zip in CI. (Default: preview URL — far simpler; building zips is a rabbit hole.)
5. **Hosting:** Vercel for both web apps + GitHub Actions for the QA runner. Any existing accounts/preferences that change this? (Default: Vercel + GH Actions, test-mode Stripe.)

If the answers are all "your defaults," say so and Session 2 can start on the scaffold immediately.

### Resolved (Session 2)

All five defaults were accepted. Status:

- **Repo:** `forge-pro/` created as a fresh git repo next to the original `forge/` (left untouched).
- **Payouts:** Stripe Connect deferred — manual payouts until volume justifies it.
- **Subscription scope:** Pro tier = all current + future templates/components (licensing logic to match).
- **QA preview:** vendors submit their own deployed preview URL.
- **Hosting:** Vercel + GitHub Actions + Stripe test mode.

Session 2 delivered the running scaffold: pnpm + Turborepo monorepo, Astro storefront
(mock-catalog fallback, QA badge UI), Next.js app (health endpoint reporting live
integrations), Sanity Studio with the full schema set + idempotent seed, and all seven
shared packages (shared-types, config, design-system, cms, db, payments, ai) plus the
qa-runner CLI placeholder. Build, typecheck, and lint are green; see `README.md`.
