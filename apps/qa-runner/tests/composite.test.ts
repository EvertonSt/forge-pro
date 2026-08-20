/**
 * The verdict engine (src/report/composite.ts) — the deterministic math from
 * docs/qa-gate.md §8. These tests pin the weighted-composite formula, the
 * lighthouse gate, and the full verdict rule (smoke + links + visual +
 * lighthouse) against the shared default thresholds.
 */
import { ThresholdConfigSchema, type ThresholdConfig } from '@forge-pro/shared-types';
import { describe, expect, it } from 'vitest';
import {
  computeComposite,
  decideVerdict,
  lighthousePasses,
  type LighthouseScores,
  type SuiteSet,
} from '../src/report/composite.js';

const config: ThresholdConfig = ThresholdConfigSchema.parse({});

const okScores: LighthouseScores = { performance: 60, seo: 90, accessibility: 90, bestPractices: 85 };

const smoke = { status: 'passed' as const };

describe('computeComposite', () => {
  it('computes the weighted sum (default weights) rounded to 1 decimal', () => {
    // 60×0.30 + 90×0.20 + 90×0.35 + 85×0.15 = 80.25 → 80.3
    expect(computeComposite(okScores, config.lighthouse.weights)).toBe(80.3);
  });

  it('returns null when any category is missing (partial run)', () => {
    const partial: LighthouseScores = { performance: 62, seo: 91, accessibility: null, bestPractices: 84 };
    expect(computeComposite(partial, config.lighthouse.weights)).toBeNull();
  });

  it('is exact at the boundary (no floating-point surprises)', () => {
    // 75×0.30 + 75×0.20 + 75×0.35 + 75×0.15 = 75.0
    const flat: LighthouseScores = { performance: 75, seo: 75, accessibility: 75, bestPractices: 75 };
    expect(computeComposite(flat, config.lighthouse.weights)).toBe(75);
  });
});

describe('lighthousePasses', () => {
  it('passes when every category ≥ min and composite ≥ minComposite', () => {
    expect(lighthousePasses(okScores, config.lighthouse)).toBe(true);
  });

  it('fails when one category is below its min even if the composite is fine', () => {
    const lowPerf: LighthouseScores = { performance: 40, seo: 100, accessibility: 100, bestPractices: 100 };
    // composite = 82.0 ≥ 75, but performance 40 < 55.
    expect(computeComposite(lowPerf, config.lighthouse.weights)).toBe(82);
    expect(lighthousePasses(lowPerf, config.lighthouse)).toBe(false);
  });

  it('fails when the composite is below minComposite even if categories pass', () => {
    // With the default weights the category-mins already sum to 75.25, so the
    // "composite below min while every category passes" case needs weights
    // that skew away from the strict categories: {0.5, 0.2, 0.2, 0.1}.
    const skewed = ThresholdConfigSchema.parse({ lighthouse: { weights: { performance: 0.5, seo: 0.2, accessibility: 0.2, bestPractices: 0.1 } } });
    const atMins: LighthouseScores = { performance: 55, seo: 85, accessibility: 85, bestPractices: 80 };
    // 55×0.5 + 85×0.2 + 85×0.2 + 80×0.1 = 69.5 < 75 — every category is at
    // its min, yet the composite misses the gate.
    expect(computeComposite(atMins, skewed.lighthouse.weights)).toBe(69.5);
    expect(lighthousePasses(atMins, skewed.lighthouse)).toBe(false);
  });

  it('treats the boundary as passing (≥, not >)', () => {
    const boundary: LighthouseScores = { performance: 60, seo: 85, accessibility: 85, bestPractices: 85 };
    // composite = 60×0.3 + 85×0.2 + 85×0.35 + 85×0.15 = 77.5 ≥ 75.
    expect(lighthousePasses(boundary, config.lighthouse)).toBe(true);
  });

  it('fails when a score is null', () => {
    const missing: LighthouseScores = { performance: null, seo: 91, accessibility: 89, bestPractices: 84 };
    expect(lighthousePasses(missing, config.lighthouse)).toBe(false);
  });
});

describe('decideVerdict', () => {
  it('passes a clean smoke run when the later suites are not wired yet', () => {
    expect(decideVerdict({ smoke }, config)).toBe('passed');
  });

  it('rejects when any smoke check fails', () => {
    expect(decideVerdict({ smoke: { status: 'failed' } }, config)).toBe('rejected');
  });

  it('rejects on broken links', () => {
    const suites: SuiteSet = { smoke, links: { status: 'failed', broken: 2 } };
    expect(decideVerdict(suites, config)).toBe('rejected');
  });

  it('passes a links suite with zero broken URLs', () => {
    const suites: SuiteSet = { smoke, links: { status: 'passed', broken: 0 } };
    expect(decideVerdict(suites, config)).toBe('passed');
  });

  it('rejects a visual diff over tolerance', () => {
    const suites: SuiteSet = { smoke, visual: { status: 'passed', diffPct: 4.2, isBaseline: false } };
    expect(decideVerdict(suites, config)).toBe('rejected');
  });

  it('passes a visual run when the baseline was captured (diff irrelevant)', () => {
    const suites: SuiteSet = { smoke, visual: { status: 'passed', diffPct: 4.2, isBaseline: true } };
    expect(decideVerdict(suites, config)).toBe('passed');
  });

  it('passes only when every suite and the lighthouse gate hold', () => {
    const suites: SuiteSet = {
      smoke,
      links: { status: 'passed', broken: 0 },
      visual: { status: 'passed', diffPct: 0.02, isBaseline: false },
      lighthouse: { status: 'passed', scores: okScores },
    };
    expect(decideVerdict(suites, config)).toBe('passed');
  });

  it('rejects when the lighthouse gate fails', () => {
    const suites: SuiteSet = {
      smoke,
      links: { status: 'passed', broken: 0 },
      visual: { status: 'passed', diffPct: 0.02, isBaseline: false },
      lighthouse: { status: 'passed', scores: { performance: 40, seo: 100, accessibility: 100, bestPractices: 100 } },
    };
    expect(decideVerdict(suites, config)).toBe('rejected');
  });

  it('returns error when any suite errored — never a quality verdict', () => {
    const suites: SuiteSet = { smoke: { status: 'error' } };
    expect(decideVerdict(suites, config)).toBe('error');
    const lighthouseError: SuiteSet = {
      smoke,
      lighthouse: { status: 'error' },
    };
    expect(decideVerdict(lighthouseError, config)).toBe('error');
  });
});
