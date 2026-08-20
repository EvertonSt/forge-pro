/**
 * buildReport wiring (M2) — the report assembles suite results into the
 * shared QaRunReport contract and delegates the verdict to the pure engine
 * (src/report/composite.ts, docs/qa-gate.md §8). These tests pin the
 * verdict/composite wiring end to end: absent suites don't gate, any suite
 * error → 'error', and only quality verdicts carry scores.
 */
import { QaRunReportSchema, ThresholdConfigSchema, type ThresholdConfig } from '@forge-pro/shared-types';
import { describe, expect, it } from 'vitest';
import {
  buildReport,
  summarize,
  type BuildReportInput,
  type LinksSuiteResult,
  type LighthouseSuiteResult,
  type VisualSuiteResult,
} from '../src/report/build.js';
import type { SmokeResult } from '../src/suites/smoke.js';

const config: ThresholdConfig = ThresholdConfigSchema.parse({});

const smokePass: SmokeResult = {
  status: 'passed',
  checks: [
    { id: 'overflow@1280', status: 'passed' },
    { id: 'probe:header@1280', status: 'passed' },
  ],
  consoleErrors: [],
};

const smokeFail: SmokeResult = {
  status: 'failed',
  checks: [
    { id: 'overflow@320', status: 'passed' },
    { id: 'probe:footer@320', status: 'failed', detail: 'No visible element matching footer' },
  ],
  consoleErrors: [],
};

function base(overrides: Partial<BuildReportInput> = {}): BuildReportInput {
  return {
    submissionId: 'sub_demo',
    jobId: 'job_demo',
    artifactSha256: 'abc123',
    config,
    startedAt: new Date('2026-01-01T00:00:00Z'),
    finishedAt: new Date('2026-01-01T00:01:00Z'),
    smoke: smokePass,
    ...overrides,
  };
}

function makeLighthouse(
  status: LighthouseSuiteResult['status'] = 'passed',
  scores = { performance: 60, seo: 90, accessibility: 90, bestPractices: 85 },
): LighthouseSuiteResult {
  return { status, scores, lcp: 2.1, cls: 0.01, tbt: 120 };
}

describe('buildReport — smoke only (M1 behavior preserved)', () => {
  it('passes a clean smoke run with null scores and no later suites', () => {
    const report = buildReport(base());
    expect(report.verdict).toBe('passed');
    expect(report.compositeScore).toBeNull();
    expect(report.scores).toEqual({
      performance: null,
      seo: null,
      accessibility: null,
      bestPractices: null,
    });
    expect(report.suites.links).toBeUndefined();
    expect(report.suites.visual).toBeUndefined();
    expect(report.suites.lighthouse).toBeUndefined();
    expect(QaRunReportSchema.safeParse(report).success).toBe(true);
  });

  it('rejects on a failed smoke check', () => {
    expect(buildReport(base({ smoke: smokeFail })).verdict).toBe('rejected');
  });

  it('returns error (never a quality verdict) when smoke errored', () => {
    const report = buildReport(base({ smoke: { status: 'error', checks: [], consoleErrors: [] } }));
    expect(report.verdict).toBe('error');
  });
});

describe('buildReport — links suite', () => {
  const linksResult = (broken: string[], status: LinksSuiteResult['status'] = 'failed'): LinksSuiteResult => ({
    status,
    broken,
    total: 12,
  });

  it('rejects on broken links and records them in the report', () => {
    const report = buildReport(base({ links: linksResult(['/missing', '/oops']) }));
    expect(report.verdict).toBe('rejected');
    expect(report.suites.links).toEqual({
      status: 'failed',
      broken: ['/missing', '/oops'],
      total: 12,
    });
  });

  it('passes with zero broken links', () => {
    const report = buildReport(base({ links: linksResult([], 'passed') }));
    expect(report.verdict).toBe('passed');
  });

  it('returns error when the links crawl itself failed (retryable)', () => {
    const report = buildReport(base({ links: { status: 'error', broken: [], total: 0 } }));
    expect(report.verdict).toBe('error');
  });
});

describe('buildReport — visual suite', () => {
  const visualResult = (diffPct: number | null, isBaseline = false): VisualSuiteResult => ({
    status: 'passed',
    diffPct,
    isBaseline,
  });

  it('rejects a diff over tolerance and records diffPct', () => {
    const report = buildReport(base({ visual: visualResult(4.2) }));
    expect(report.verdict).toBe('rejected');
    expect(report.suites.visual).toEqual({ status: 'passed', diffPct: 4.2, isBaseline: false });
  });

  it('passes a diff within tolerance', () => {
    expect(buildReport(base({ visual: visualResult(0.02) })).verdict).toBe('passed');
  });

  it('passes a baseline capture regardless of diff (first run)', () => {
    expect(buildReport(base({ visual: visualResult(4.2, true) })).verdict).toBe('passed');
  });
});

describe('buildReport — lighthouse suite', () => {
  it('computes the composite and carries scores/metrics through', () => {
    const report = buildReport(base({ lighthouse: makeLighthouse() }));
    // 60×0.30 + 90×0.20 + 90×0.35 + 85×0.15 = 80.25 → 80.3
    expect(report.verdict).toBe('passed');
    expect(report.compositeScore).toBe(80.3);
    expect(report.scores).toEqual({ performance: 60, seo: 90, accessibility: 90, bestPractices: 85 });
    expect(report.suites.lighthouse).toEqual({
      status: 'passed',
      composite: 80.3,
      lcp: 2.1,
      cls: 0.01,
      tbt: 120,
    });
  });

  it('rejects when the lighthouse gate fails (composite below min)', () => {
    const low = makeLighthouse('passed', { performance: 40, seo: 100, accessibility: 100, bestPractices: 100 });
    const report = buildReport(base({ lighthouse: low }));
    expect(report.verdict).toBe('rejected');
    expect(report.compositeScore).toBe(82);
  });

  it('returns error when lighthouse errored, even with smoke clean', () => {
    const report = buildReport(base({ lighthouse: makeLighthouse('error') }));
    expect(report.verdict).toBe('error');
  });
});

describe('summarize', () => {
  it('covers every present suite in one line', () => {
    const report = buildReport(
      base({
        links: { status: 'passed', broken: [], total: 12 },
        visual: { status: 'passed', diffPct: 0.02, isBaseline: false },
        lighthouse: makeLighthouse(),
      }),
    );
    const line = summarize(report);
    expect(line).toContain('verdict=passed');
    expect(line).toContain('smoke=passed (0 failed of 2)');
    expect(line).toContain('links=passed (0 broken of 12)');
    expect(line).toContain('visual=passed (diff 0.02%)');
    expect(line).toContain('lighthouse=passed (composite 80.3)');
  });
});
