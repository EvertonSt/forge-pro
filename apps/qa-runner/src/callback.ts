import { QaCompletePayloadSchema, type QaRunReport } from '@forge-pro/shared-types';

/**
 * Runner → app completion callback (docs/qa-gate.md §11, vendor-portal.md §8).
 *
 * The app is the only component that advances submissions, writes the
 * qa_reports row, marks the job done, and auto-publishes — the runner's job
 * finishes by delivering the report, not by touching the DB itself.
 *
 * Env contract (mirrors the GitHub Actions workflow):
 *   APP_BASE_URL          — the Next.js app, e.g. https://forge-pro.example.com
 *   APP_INTERNAL_SECRET   — shared secret gating POST /api/qa/complete
 */

export interface CompletionConfig {
  baseUrl: string;
  secret: string;
}

/** Read the callback config from env. Null when either var is missing. */
export function getCompletionConfig(): CompletionConfig | null {
  const baseUrl = process.env.APP_BASE_URL;
  const secret = process.env.APP_INTERNAL_SECRET;
  if (!baseUrl || !secret) return null;
  return { baseUrl, secret };
}

export type CompletionResult =
  | { ok: true; outcome: unknown }
  | { ok: false; lastStatus: number | null; lastError: string };

const MAX_ATTEMPTS = 3;
/** Exponential backoff between attempts (seconds). First attempt is immediate. */
const BACKOFF_SECONDS = [0, 2, 5];
const REQUEST_TIMEOUT_MS = 15_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Deliver a completed run to the app. Retries transient failures (network /
 * 5xx) with backoff; fails fast on 4xx, which are permanent (auth, invalid
 * payload, or a guard like "submission is not submitted").
 */
export async function postCompletion(
  jobId: string,
  report: QaRunReport,
  config: CompletionConfig,
): Promise<CompletionResult> {
  // Fail fast if the payload drifts from the shared contract — the app would
  // reject it with 400 anyway, but validating here gives a clearer error.
  const payload = QaCompletePayloadSchema.parse({ jobId, report });
  const base = config.baseUrl.replace(/\/+$/, '');

  let last: { status: number | null; error: string } = { status: null, error: 'no attempt' };

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await sleep((BACKOFF_SECONDS[attempt] ?? BACKOFF_SECONDS.at(-1)!) * 1000);
    }
    try {
      const response = await fetch(`${base}/api/qa/complete`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forge-internal-secret': config.secret,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const body = (await response.json().catch(() => null)) as unknown;
      if (response.ok) {
        return { ok: true, outcome: body };
      }
      last = { status: response.status, error: JSON.stringify(body) ?? response.statusText };
      if (response.status >= 400 && response.status < 500) {
        break; // permanent — do not retry auth/validation/guard rejections
      }
    } catch (error) {
      last = { status: null, error: error instanceof Error ? error.message : String(error) };
    }
  }

  return { ok: false, lastStatus: last.status, lastError: last.error };
}
