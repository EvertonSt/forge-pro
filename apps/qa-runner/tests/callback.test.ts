/**
 * Runner → app completion (src/callback.ts, docs/qa-gate.md §11): env
 * contract, contract pre-validation (fail fast on payload drift), and the
 * retry policy — transient failures (network / 5xx) retry with exponential
 * backoff, 4xx fails fast (permanent), and delivery gives up after 3
 * attempts. `fetch` is stubbed; the backoff test advances fake timers.
 */
import { ThresholdConfigSchema, type QaRunReport } from '@forge-pro/shared-types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import { getCompletionConfig, postCompletion } from '../src/callback.js';

const config = { baseUrl: 'https://app.forge-pro.example.com/', secret: 's3cret' };

const report: QaRunReport = {
  schemaVersion: 1,
  submissionId: 'sub-1',
  jobId: 'job-1',
  artifactSha256: null,
  runnerVersion: '0.0.0-test',
  startedAt: '2026-01-01T00:00:00.000Z',
  finishedAt: '2026-01-01T00:01:00.000Z',
  thresholds: ThresholdConfigSchema.parse({}),
  verdict: 'passed',
  compositeScore: 80.6,
  scores: { performance: 62, seo: 91, accessibility: 89, bestPractices: 84 },
  suites: { smoke: { status: 'passed', checks: [], consoleErrors: [] } },
  artifacts: {},
  aiNarrative: null,
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  delete process.env.APP_BASE_URL;
  delete process.env.APP_INTERNAL_SECRET;
});

describe('getCompletionConfig', () => {
  it('returns null when either env var is missing', () => {
    expect(getCompletionConfig()).toBeNull();
    process.env.APP_BASE_URL = 'https://app.test';
    expect(getCompletionConfig()).toBeNull();
    delete process.env.APP_BASE_URL;
    process.env.APP_INTERNAL_SECRET = 'x';
    expect(getCompletionConfig()).toBeNull();
  });

  it('reads the pair from env', () => {
    process.env.APP_BASE_URL = 'https://app.forge-pro.example.com/';
    process.env.APP_INTERNAL_SECRET = 's3cret';
    expect(getCompletionConfig()).toEqual(config);
  });
});

describe('postCompletion', () => {
  it('posts the payload to {base}/api/qa/complete with the secret header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true, processed: true }, 200));
    vi.stubGlobal('fetch', fetchMock);

    const result = await postCompletion('job-1', report, config);
    expect(result).toEqual({ ok: true, outcome: { ok: true, processed: true } });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    // Trailing slash stripped, secret header sent, payload serialized.
    expect(url).toBe('https://app.forge-pro.example.com/api/qa/complete');
    expect(init.headers).toMatchObject({ 'x-forge-internal-secret': 's3cret' });
    expect(JSON.parse(String(init.body))).toMatchObject({ jobId: 'job-1', report: { verdict: 'passed' } });
  });

  it('fails fast on a 4xx — permanent, no retry', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'Unauthorized.' }, 401))
      .mockResolvedValueOnce(jsonResponse({ ok: true }, 200));
    vi.stubGlobal('fetch', fetchMock);

    const result = await postCompletion('job-1', report, config);
    expect(result).toEqual({ ok: false, lastStatus: 401, lastError: '{"error":"Unauthorized."}' });
    // The second (200) mock is never consumed — a 4xx is permanent.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries transient failures with backoff and succeeds', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed')) // attempt 0 — network error
      .mockResolvedValueOnce(jsonResponse({ ok: false }, 500)) // attempt 1 — transient 5xx
      .mockResolvedValueOnce(jsonResponse({ ok: true, processed: true }, 200)); // attempt 2
    vi.stubGlobal('fetch', fetchMock);

    const promise = postCompletion('job-1', report, config);
    await vi.advanceTimersByTimeAsync(0); // attempt 0 (immediate)
    await vi.advanceTimersByTimeAsync(2_000); // backoff → attempt 1
    await vi.advanceTimersByTimeAsync(5_000); // backoff → attempt 2
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ ok: true, outcome: { ok: true, processed: true } });
  });

  it('gives up after 3 attempts when every delivery fails', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('ECONNREFUSED'));
    vi.stubGlobal('fetch', fetchMock);

    const promise = postCompletion('job-1', report, config);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(2_000);
    await vi.advanceTimersByTimeAsync(5_000);
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ ok: false, lastStatus: null, lastError: 'ECONNREFUSED' });
  });

  it('validates the payload against the shared contract before sending', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const malformed = { ...report, verdict: 'bogus' } as unknown as QaRunReport;

    await expect(postCompletion('job-1', malformed, config)).rejects.toBeInstanceOf(ZodError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
