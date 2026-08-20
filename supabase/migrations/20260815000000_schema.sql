-- Forge Pro — Session 4 schema (docs/architecture.md §3.1, v0.3).
--
-- One deliberate deviation from the doc, noted here so code and schema stay
-- aligned: `submissions.vendor_id` references `profiles(id)` — the user who
-- owns the submission ("vendor" is a role on the profile). `vendor_profiles`
-- remains the public identity/payout extension, keyed by `user_id` (unique).
-- The portal's ownership checks compare user ids, which this makes direct.

begin;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.fp_user_role as enum ('buyer', 'vendor', 'admin');
create type public.fp_catalog_item_kind as enum ('template', 'component');
create type public.fp_order_status as enum ('pending', 'paid', 'refunded');
create type public.fp_license_status as enum ('active', 'revoked', 'expired');
create type public.fp_entitlement_source as enum ('purchase', 'subscription');
create type public.fp_entitlement_status as enum ('active', 'expired', 'revoked');
create type public.fp_submission_status as enum (
  'draft', 'submitted', 'qa_passed', 'qa_rejected', 'published', 'withdrawn'
);
create type public.fp_qa_job_status as enum ('queued', 'running', 'passed', 'rejected', 'error');
-- Error verdicts never create a report row (they are retryable run failures).
create type public.fp_qa_report_status as enum ('passed', 'rejected');
create type public.fp_ai_role as enum ('user', 'assistant', 'system');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.fp_user_role not null default 'buyer',
  -- Back-reference to the vendor profile; FK added after vendor_profiles
  -- exists (mutual dependency). Null for buyers.
  vendor_id uuid,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  display_name text,
  bio text,
  website text,
  -- Null until an admin approves the vendor application.
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_vendor_id_fkey
  foreign key (vendor_id) references public.vendor_profiles (id)
  on delete set null deferrable initially deferred;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  -- Created by the Stripe webhook, never by the client.
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  status public.fp_order_status not null default 'pending',
  total_cents integer not null check (total_cents >= 0),
  currency char(3) not null default 'USD',
  paid_at timestamptz,
  refunded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  item_type public.fp_catalog_item_kind not null,
  -- Sanity document _id — the stable key, never re-keyed.
  sanity_id text not null,
  -- Display copies only; slugs are editable in Sanity, so never keys.
  slug text not null,
  title text not null,
  -- Purchased-version snapshot — downloads and license scope resolve to this.
  version text not null,
  price_cents integer not null check (price_cents >= 0),
  currency char(3) not null default 'USD',
  -- Vendor + revenue share snapshotted at purchase for P2 payout math.
  vendor_id uuid references public.profiles (id) on delete set null,
  revenue_share_pct smallint not null default 0 check (revenue_share_pct between 0 and 100),
  -- Stable key: one line per (order, kind, item). Slug/title never part of it.
  unique (order_id, item_type, sanity_id)
);

create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key like 'forge\_%'),
  order_item_id uuid not null unique references public.order_items (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  status public.fp_license_status not null default 'active',
  max_registrations integer not null default 1 check (max_registrations > 0),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.license_registrations (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.licenses (id) on delete cascade,
  domain text not null,
  project_name text,
  registered_by_user uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (license_id, domain)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stripe_subscription_id text not null unique,
  tier text not null default 'pro',
  -- Stripe mirror; kept as text+check so future Stripe statuses don't need
  -- an enum migration.
  status text not null check (
    status in ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused')
  ),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_type public.fp_catalog_item_kind not null,
  sanity_id text not null,
  source public.fp_entitlement_source not null,
  license_id uuid references public.licenses (id) on delete restrict,
  subscription_id uuid references public.subscriptions (id) on delete restrict,
  status public.fp_entitlement_status not null default 'active',
  granted_at timestamptz not null default now(),
  -- Null = perpetual (one-time purchase).
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, item_type, sanity_id, source),
  check (
    (source = 'purchase' and license_id is not null and subscription_id is null) or
    (source = 'subscription' and subscription_id is not null and license_id is null)
  )
);

create table public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  entitlement_id uuid not null references public.entitlements (id) on delete restrict,
  item_type public.fp_catalog_item_kind not null,
  sanity_id text not null,
  version text not null,
  file_url text not null,
  downloaded_at timestamptz not null default now()
);

-- QA gate tables. current_qa_report_id on submissions references qa_reports,
-- so submissions is created first and the FK added after qa_reports exists.

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  -- The owning user; "vendor" is a role on the profile (see header note).
  vendor_id uuid not null references public.profiles (id) on delete cascade,
  item_type public.fp_catalog_item_kind not null,
  status public.fp_submission_status not null default 'draft',
  -- Catalog metadata captured at submit, consumed at publish.
  title text,
  description text,
  framework text,
  stack text[] not null default '{}'::text[],
  category text,
  component_type text,
  price_cents integer check (price_cents is null or price_cents > 0),
  currency char(3),
  screenshots text[] not null default '{}'::text[],
  -- Preview URL + ownership proof.
  preview_url text,
  verification_token text,
  -- Artifact; the hash pins every QA verdict to the exact code tested.
  zip_url text,
  artifact_sha256 text,
  submitted_version text,
  -- Sanity _id of the published item; also the version-update link.
  item_sanity_id text,
  current_qa_report_id uuid,
  withdrawn_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  check (title is null or char_length(title) between 3 and 120),
  check (description is null or char_length(description) between 40 and 2000)
);

create table public.qa_jobs (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  artifact_sha256 text not null,
  status public.fp_qa_job_status not null default 'queued',
  -- Counts error retries (max from the gate config); passed/rejected stay 0.
  attempts integer not null default 0 check (attempts >= 0),
  runner_id text,
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.qa_reports (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  -- 1:1 with the run; the job's report is its verdict.
  job_id uuid not null unique references public.qa_jobs (id) on delete cascade,
  status public.fp_qa_report_status not null,
  composite_score numeric(5, 2) check (composite_score is null or composite_score between 0 and 100),
  scores jsonb not null default '{}'::jsonb,
  visual_diff_pct numeric(5, 2) check (visual_diff_pct is null or visual_diff_pct between 0 and 100),
  link_scan jsonb not null default '{}'::jsonb,
  -- Full config snapshot — verdicts are facts about (artifact, config, time).
  threshold_snapshot jsonb not null default '{}'::jsonb,
  is_baseline boolean not null default false,
  -- When is_baseline, the submission lineage this baseline belongs to.
  baseline_of uuid references public.submissions (id) on delete set null,
  report_html_url text,
  screenshots jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.submissions
  add constraint submissions_current_qa_report_id_fkey
  foreign key (current_qa_report_id) references public.qa_reports (id)
  on delete set null;

-- AI conversations: anonymous allowed; server-read/write only, never
-- browser-exposed. Session token is server-issued (httpOnly cookie).
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  session_token text,
  title text,
  created_at timestamptz not null default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role public.fp_ai_role not null,
  content text not null,
  -- Recorded for cost tracking.
  model text,
  token_usage jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes (docs/architecture.md §3.1 — the non-negotiables)
-- ---------------------------------------------------------------------------

create index orders_user_created_idx on public.orders (user_id, created_at desc);
create index licenses_user_idx on public.licenses (user_id);
create index license_registrations_license_idx on public.license_registrations (license_id);
create index entitlements_user_status_idx on public.entitlements (user_id, status);
create index downloads_user_downloaded_idx on public.downloads (user_id, downloaded_at desc);
create index submissions_vendor_idx on public.submissions (vendor_id, created_at desc);
create index qa_jobs_submission_created_idx on public.qa_jobs (submission_id, created_at desc);
create index ai_messages_conversation_created_idx on public.ai_messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Standard: mirror auth.users into profiles on signup.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at maintenance.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger entitlements_set_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();

commit;
