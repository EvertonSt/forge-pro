# Supabase — Session 4 migrations

The schema (docs/architecture.md §3.1, v0.3) and the RLS policy matrix land
here. Everything is applied via the Supabase CLI so migrations are versioned
and replayable.

## Files

| File | Contents |
|---|---|
| `migrations/20260815000000_schema.sql` | Enums, all 13 tables, FKs, indexes, constraints, profile/updated_at triggers |
| `migrations/20260815000001_rls.sql` | `is_admin()`/`is_vendor()` helpers, RLS enabled everywhere, the per-role policy matrix |

## Apply

Local:

```bash
supabase init          # if config.toml is missing
supabase start         # boots Postgres + Auth + Storage, applies migrations
```

Hosted project:

```bash
supabase link --project-ref <ref>
supabase db push
```

Then copy the project's `anon` key, `service_role` key, URL, and **JWT
secret** into `apps/app/.env` (see `apps/app/.env.example`):
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_JWT_SECRET`.

## Notes

- `submissions.vendor_id` references `profiles(id)` — "vendor" is a role on
  the profile, so the portal's ownership checks compare user ids directly.
  `vendor_profiles` is the public identity/payout extension (`user_id`
  unique). This is a deliberate, documented deviation from the draft
  relationship "vendor_profiles 1—N submissions".
- Every write goes through the Next.js API with the service-role key; RLS
  protects reads (own rows only) and is defense-in-depth on writes.
- `ai_conversations`/`ai_messages` have no policies — server-only, never
  browser-exposed.
- Profiles are created by the `handle_new_user` trigger on `auth.users`;
  `profiles.role` defaults to `buyer`, and changing it to `vendor`/`admin`
  is a service-role write (vendors cannot self-approve).
