import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * @forge-pro/db — Supabase access layer.
 *
 * Env-gated: returns null when credentials are absent so the app runs (and
 * builds) without a database. SQL migrations and generated types land with the
 * auth milestone (Session 4) once the schema in docs/architecture.md §3.1 is
 * exercised for real.
 */

export interface DbEnv {
  url?: string;
  /** Prefer the service role key on the server; anon key for browser use. */
  anonKey?: string;
  serviceRoleKey?: string;
}

export function getDbEnv(): DbEnv {
  return {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

let cached: SupabaseClient | null = null;

/** Create a Supabase client from env. Returns null when SUPABASE_URL is unset. */
export function getSupabase(env: DbEnv = getDbEnv()): SupabaseClient | null {
  if (!env.url) {
    return null;
  }
  if (!cached) {
    const key = env.serviceRoleKey ?? env.anonKey;
    if (!key) {
      return null;
    }
    cached = createClient(env.url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

/**
 * Typed row shapes for the tables in docs/architecture.md §3.1. These are
 * hand-written today; once Supabase CLI generates Database types, they replace
 * this file's inline types.
 */
export interface Database {
  public: {
    Tables: Record<string, never>;
  };
}
