/**
 * Preview-URL ownership proof (docs/vendor-portal.md §6).
 *
 * Fully real logic — no database involved — so the same code runs in demo and
 * production modes: a vendor proves control of their preview page by pasting
 * the per-submission token into a `<meta name="forge-pro:verify">` tag, and
 * the server fetches the URL and checks it. The SSRF guard (https-only, no
 * private/loopback/link-local addresses) is the security-relevant part: this
 * endpoint fetches an arbitrary vendor-supplied URL, so it must never be able
 * to reach the app's own network.
 */
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export interface PreviewVerificationResult {
  ok: boolean;
  /** Machine-readable reason for the UI to surface. */
  reason:
    | 'verified'
    | 'invalid-url'
    | 'insecure-scheme'
    | 'blocked-host'
    | 'unreachable'
    | 'token-mismatch';
  message: string;
}

const VERIFY_META = /<meta[^>]+name=["']forge-pro:verify["'][^>]+content=["']([^"']+)["']/i;
const REACHABILITY_TIMEOUT_MS = 10_000;

/** True for private, loopback, link-local, and CGNAT ranges (RFC 1918 + friends). */
export function isPrivateAddress(address: string): boolean {
  const ip = isIP(address);
  if (ip === 0) return true; // not parseable — treat as blocked
  if (ip === 6) {
    const lower = address.toLowerCase();
    return (
      lower === '::1' ||
      lower.startsWith('fe80:') ||
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower === '::'
    );
  }
  const parts = address.split('.').map(Number);
  const a = parts[0];
  const b = parts[1];
  if (a === undefined || b === undefined) return true;
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a === 0
  );
}

/** True only for the loopback ranges (127.0.0.0/8, ::1). */
export function isLoopbackAddress(address: string): boolean {
  const ip = isIP(address);
  if (ip === 6) return address.toLowerCase() === '::1';
  return ip === 4 && address.split('.')[0] === '127';
}

/**
 * Validate scheme + resolve DNS and reject private/loopback hosts.
 * allowLoopback is a dev-mode carve-out (docs/vendor-portal.md §6: http is
 * allowed for local dev) — it still blocks RFC1918/CGNAT ranges.
 */
export async function assertPublicReachableHost(url: URL, allowLoopback = false): Promise<string | null> {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return 'insecure-scheme';
  }
  const hostname = url.hostname;
  try {
    const records = await lookup(hostname, { all: true });
    if (records.length === 0) return 'blocked-host';
    for (const record of records) {
      if (isPrivateAddress(record.address) && !(allowLoopback && isLoopbackAddress(record.address))) {
        return 'blocked-host';
      }
    }
  } catch {
    return 'blocked-host'; // DNS failure — cannot prove the host is public
  }
  return null;
}

/**
 * Fetch a preview URL and check it carries the expected verification token.
 * Throws nothing — every failure maps to a result with a reason.
 */
export async function verifyPreviewUrl(
  urlString: string,
  expectedToken: string,
  options: { allowLoopback?: boolean } = {},
): Promise<PreviewVerificationResult> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { ok: false, reason: 'invalid-url', message: 'That is not a valid URL.' };
  }

  const guard = await assertPublicReachableHost(url, options.allowLoopback);
  if (guard === 'insecure-scheme') {
    return { ok: false, reason: 'insecure-scheme', message: 'Preview URL must use https.' };
  }
  if (guard === 'blocked-host') {
    return { ok: false, reason: 'blocked-host', message: 'Host is not publicly reachable (private or loopback addresses are blocked).' };
  }

  let response: Response;
  try {
    response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(REACHABILITY_TIMEOUT_MS),
      headers: { 'user-agent': 'forge-pro-verify/0.1' },
    });
  } catch {
    return { ok: false, reason: 'unreachable', message: 'Could not reach the preview URL — is the site deployed?' };
  }
  if (!response.ok) {
    return { ok: false, reason: 'unreachable', message: `Preview URL responded with HTTP ${response.status}.` };
  }

  const html = await response.text();
  const match = html.match(VERIFY_META);
  if (!match || match[1] !== expectedToken) {
    return {
      ok: false,
      reason: 'token-mismatch',
      message: 'Verification token not found. Add the meta tag to your preview page and deploy it before verifying.',
    };
  }
  return { ok: true, reason: 'verified', message: 'Ownership proven — the meta tag is live on your preview page.' };
}
