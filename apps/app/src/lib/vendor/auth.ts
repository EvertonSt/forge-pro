/**
 * Vendor auth guard for portal routes and pages.
 *
 * Real path (Supabase configured): verifies the session JWT — from the
 * `Authorization: Bearer` header (API routes) or the `sb-*-auth-token`
 * cookie (server components) — against SUPABASE_JWT_SECRET with jose, then
 * loads `profiles.role` via the service-role client and requires
 * vendor | admin. Role is never taken from the JWT itself; the DB row is
 * authoritative.
 *
 * Dev fallback (no Supabase env): the explicit stub below — demo mode pins
 * the demo vendor, otherwise DEV_USER_ID. Production without env refuses
 * rather than pretending to be secure — unless ALLOW_DEMO_MODE=1 is set
 * explicitly (the Playwright e2e runs `next start` against the demo store,
 * and a deployed demo is a legitimate use of the same path).
 */
import { jwtVerify } from 'jose';
import { getSupabase } from '@forge-pro/db';
import { DEMO_ADMIN_ID, DEMO_VENDOR_ID } from './demo-data';

export class AuthError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export interface SessionUser {
  userId: string;
  role: 'vendor' | 'admin';
}

const JWT_SECRET_ENV = 'SUPABASE_JWT_SECRET';

function getJwtSecret(): string | null {
  return process.env[JWT_SECRET_ENV] ?? null;
}

function parseCookieHeader(cookieHeader: string): Array<{ name: string; value: string }> {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const eq = part.indexOf('=');
      return eq === -1
        ? { name: part, value: '' }
        : { name: part.slice(0, eq).trim(), value: part.slice(eq + 1).trim() };
    });
}

/** Pull the access token out of the `sb-<ref>-auth-token` cookie (or a raw JWT). */
export function accessTokenFromCookies(cookies: Iterable<{ name: string; value: string }>): string | null {
  for (const cookie of cookies) {
    if (!cookie.name.startsWith('sb-') || !cookie.name.endsWith('-auth-token')) continue;
    try {
      const value = decodeURIComponent(cookie.value);
      // PKCE flow stores { access_token, refresh_token, ... }; legacy raw JWT.
      if (value.startsWith('{')) {
        const parsed = JSON.parse(value) as { access_token?: unknown };
        return typeof parsed.access_token === 'string' ? parsed.access_token : null;
      }
      return value || null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Extract the access token from a Request (Authorization header or cookie). */
export function extractAccessToken(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice('bearer '.length).trim();
  }
  return accessTokenFromCookies(parseCookieHeader(request.headers.get('cookie') ?? ''));
}

/**
 * Verify a Supabase access token and return its subject. Pure — no I/O — so
 * it's unit-testable with any HS256 JWT signed by the configured secret.
 */
export async function verifySessionToken(token: string): Promise<{ userId: string }> {
  const secret = getJwtSecret();
  if (!secret) {
    throw new AuthError(503, `${JWT_SECRET_ENV} is not configured.`);
  }
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    });
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new AuthError(401, 'Token has no subject.');
    }
    return { userId: payload.sub };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError(401, 'Session is invalid or expired.');
  }
}

/** Load the profile role for a user. Returns null if the profile is missing. */
export async function loadProfileRole(userId: string): Promise<'buyer' | 'vendor' | 'admin' | null> {
  const db = getSupabase();
  if (!db) return null;
  const { data } = await db.from('profiles').select('role').eq('id', userId).maybeSingle();
  const role = data?.role;
  return role === 'vendor' || role === 'admin' || role === 'buyer' ? role : null;
}

/** Resolve the session for an API request, requiring vendor or admin. */
export async function requireVendor(request: Request): Promise<SessionUser> {
  if (!getSupabase()) {
    return devVendor();
  }
  const token = extractAccessToken(request);
  if (!token) {
    return devVendor();
  }
  const { userId } = await verifySessionToken(token);
  const role = await loadProfileRole(userId);
  if (role !== 'vendor' && role !== 'admin') {
    throw new AuthError(403, 'Vendor access required.');
  }
  return { userId, role };
}

/**
 * For server components — no Request object exists there, so the session is
 * read from the Supabase auth cookie.
 */
export async function getCurrentVendor(): Promise<SessionUser> {
  if (!getSupabase()) {
    return devVendor();
  }
  const { cookies } = await import('next/headers');
  const store = await cookies();
  const token = accessTokenFromCookies(store.getAll());
  if (!token) {
    // No session — fall back to demo mode if allowed
    return devVendor();
  }
  const { userId } = await verifySessionToken(token);
  const role = await loadProfileRole(userId);
  if (role !== 'vendor' && role !== 'admin') {
    throw new AuthError(403, 'Vendor access required.');
  }
  return { userId, role };
}

function devVendor(): SessionUser {
  // No Supabase env means demo mode — pin the demo vendor so the portal's
  // fixtures and in-memory store are visible and the demo loop keeps working.
  return { userId: DEMO_VENDOR_ID, role: 'vendor' };
}

/** Resolve the session for an API request, requiring admin. */
export async function requireAdmin(request: Request): Promise<SessionUser> {
  if (!getSupabase()) {
    return devAdmin();
  }
  const token = extractAccessToken(request);
  if (!token) {
    return devAdmin();
  }
  const { userId } = await verifySessionToken(token);
  const role = await loadProfileRole(userId);
  if (role !== 'admin') {
    throw new AuthError(403, 'Admin access required.');
  }
  return { userId, role };
}

/** For server components — the /admin pages read the session from cookies. */
export async function getCurrentAdmin(): Promise<SessionUser> {
  if (!getSupabase()) {
    return devAdmin();
  }
  const { cookies } = await import('next/headers');
  const store = await cookies();
  const token = accessTokenFromCookies(store.getAll());
  if (!token) {
    return devAdmin();
  }
  const { userId } = await verifySessionToken(token);
  const role = await loadProfileRole(userId);
  if (role !== 'admin') {
    throw new AuthError(403, 'Admin access required.');
  }
  return { userId, role };
}

function devAdmin(): SessionUser {
  // Demo mode pins a distinct admin identity so ownership semantics hold.
  return { userId: DEMO_ADMIN_ID, role: 'admin' };
}

/** Owners can act on their own submissions; admins on any. */
export function assertOwnsSubmission(user: SessionUser, vendorId: string): void {
  if (user.role !== 'admin' && user.userId !== vendorId) {
    throw new AuthError(403, 'You do not own this submission.');
  }
}
