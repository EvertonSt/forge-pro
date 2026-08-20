-- Forge Pro — RLS policy matrix (docs/architecture.md §3.1).
--
-- Access architecture: the browser only ever READS the buyer's/vendor's own
-- rows (anon key + user JWT). Every write goes through the Next.js API with
-- the service-role key, so RLS protects reads and is defense-in-depth on the
-- money path. The runner also writes via service role.
--
-- ai_conversations / ai_messages get NO policies — they are server-only and
-- never browser-exposed; the service role is the only reader.

begin;

-- ---------------------------------------------------------------------------
-- Helpers (security definer, explicit search_path, no recursion)
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_vendor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('vendor', 'admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on every table
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.vendor_profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.licenses enable row level security;
alter table public.license_registrations enable row level security;
alter table public.entitlements enable row level security;
alter table public.subscriptions enable row level security;
alter table public.downloads enable row level security;
alter table public.submissions enable row level security;
alter table public.qa_jobs enable row level security;
alter table public.qa_reports enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

-- ---------------------------------------------------------------------------
-- profiles — read own, update own non-role fields, insert self, admin all
-- ---------------------------------------------------------------------------

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_insert_self"
  on public.profiles for insert
  with check (id = auth.uid());

-- Own updates may not change the role column (admin approval is service-role).
create policy "profiles_update_own_nonrole_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (
    public.is_admin() or (
      id = auth.uid()
      and role = (select p.role from public.profiles p where p.id = auth.uid())
    )
  );

create policy "profiles_delete_admin"
  on public.profiles for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- vendor_profiles — own read/write, admin all
-- ---------------------------------------------------------------------------

create policy "vendor_profiles_select_own_or_admin"
  on public.vendor_profiles for select
  using (user_id = auth.uid() or public.is_admin());

create policy "vendor_profiles_insert_own_or_admin"
  on public.vendor_profiles for insert
  with check (user_id = auth.uid() or public.is_admin());

create policy "vendor_profiles_update_own_or_admin"
  on public.vendor_profiles for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "vendor_profiles_delete_admin"
  on public.vendor_profiles for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Money path — read own only (inserts/updates via service role / webhook)
-- ---------------------------------------------------------------------------

create policy "orders_select_own_or_admin"
  on public.orders for select
  using (user_id = auth.uid() or public.is_admin());

create policy "order_items_select_own_or_admin"
  on public.order_items for select
  using (
    public.is_admin() or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "licenses_select_own_or_admin"
  on public.licenses for select
  using (user_id = auth.uid() or public.is_admin());

create policy "license_registrations_select_own_or_admin"
  on public.license_registrations for select
  using (registered_by_user = auth.uid() or public.is_admin());

create policy "license_registrations_insert_own_or_admin"
  on public.license_registrations for insert
  with check (registered_by_user = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Entitlements & subscriptions — read own (status writes are webhook-only)
-- ---------------------------------------------------------------------------

create policy "entitlements_select_own_or_admin"
  on public.entitlements for select
  using (user_id = auth.uid() or public.is_admin());

create policy "subscriptions_select_own_or_admin"
  on public.subscriptions for select
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Downloads — read own; insert own (service role issues the signed URLs)
-- ---------------------------------------------------------------------------

create policy "downloads_select_own_or_admin"
  on public.downloads for select
  using (user_id = auth.uid() or public.is_admin());

create policy "downloads_insert_own_or_admin"
  on public.downloads for insert
  with check (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Submissions — vendor read/write own, admin all. No vendor delete: the
-- design is additive (withdraw/unpublish), never destructive.
-- ---------------------------------------------------------------------------

create policy "submissions_select_own_or_admin"
  on public.submissions for select
  using (vendor_id = auth.uid() or public.is_admin());

create policy "submissions_insert_own_or_admin"
  on public.submissions for insert
  with check (vendor_id = auth.uid() or public.is_admin());

create policy "submissions_update_own_or_admin"
  on public.submissions for update
  using (vendor_id = auth.uid() or public.is_admin())
  with check (vendor_id = auth.uid() or public.is_admin());

create policy "submissions_delete_admin"
  on public.submissions for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- QA gate — vendor reads own submission's jobs/reports; runner writes via
-- service role (RLS is defense-in-depth here).
-- ---------------------------------------------------------------------------

create policy "qa_jobs_select_own_submission_or_admin"
  on public.qa_jobs for select
  using (
    public.is_admin() or exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.vendor_id = auth.uid()
    )
  );

create policy "qa_reports_select_own_submission_or_admin"
  on public.qa_reports for select
  using (
    public.is_admin() or exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.vendor_id = auth.uid()
    )
  );

commit;
