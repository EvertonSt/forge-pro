/**
 * The verdict engine (docs/qa-gate.md §8) — pure, deterministic pass/fail
 * math. The suites produce facts; this module decides the verdict from them
 * against the run's ThresholdConfig snapshot. No I/O, no AI — deliberately:
 * the doc draws the line that an AI may *explain* a verdict but never decide
 * one.
 *
 * M1 runs the smoke suite only, so buildReport's verdict comes from smoke
 * alone; this engine is wired in when the links/visual/lighthouse suites
 * land (M2). It lives here now so the math is testable and shared.
 */
import type { ThresholdConfig, Verdict } from '@forge-pro/shared-types';

export interface LighthouseScores {
  performance: number | null;
  seo: number | null;
  accessibility: number | null;
  bestPractices: number | null;
}

export interface SuiteSummary {
  status: 'passed' | 'failed' | 'error';
  /** links suite: count of broken URLs (0 = clean). */
  broken?: number;
  /** visual suite: pixel diff percentage. */
  diffPct?: number | null;
  /** visual suite: true when this run captured the baseline (diff irrelevant). */
  isBaseline?: boolean;
  /** lighthouse suite: category scores. */
  scores?: LighthouseScores;
}

export type SuiteSet = {
  smoke: SuiteSummary;
  links?: SuiteSummary;
  visual?: SuiteSummary;
  lighthouse?: SuiteSummary;
};

/**
 * Weighted Lighthouse composite, rounded to 1 decimal. Returns null when any
 * category score is missing — a partial run has no composite.
 */
export function computeComposite(
  scores: LighthouseScores,
  weights: ThresholdConfig['lighthouse']['weights'],
): number | null {
  if (
    scores.performance === null ||
    scores.seo === null ||
    scores.accessibility === null ||
    scores.bestPractices === null
  ) {
    return null;
  }
  const weighted =
    scores.performance * weights.performance +
    scores.seo * weights.seo +
    scores.accessibility * weights.accessibility +
    scores.bestPractices * weights.bestPractices;
  return Math.round(weighted * 10) / 10;
}

/**
 * Lighthouse gate (verdict rule §4): every category ≥ its min AND the
 * composite ≥ minComposite. Null scores fail the gate (never a pass).
 */
export function lighthousePasses(
  scores: LighthouseScores,
  lighthouse: ThresholdConfig['lighthouse'],
): boolean {
  const composite = computeComposite(scores, lighthouse.weights);
  if (composite === null) return false;
  return (
    scores.performance !== null &&
    scores.performance >= lighthouse.minScores.performance &&
    scores.seo !== null &&
    scores.seo >= lighthouse.minScores.seo &&
    scores.accessibility !== null &&
    scores.accessibility >= lighthouse.minScores.accessibility &&
    scores.bestPractices !== null &&
    scores.bestPractices >= lighthouse.minScores.bestPractices &&
    composite >= lighthouse.minComposite
  );
}

/**
 * The full verdict rule (docs/qa-gate.md §8):
 *   1. smoke: all checks pass;
 *   2. links: zero broken;
 *   3. visual: diff ≤ tolerance, or the baseline was captured this run;
 *   4. lighthouse: every category ≥ min AND composite ≥ minComposite.
 * Anything else → 'rejected'. Any suite in 'error' → 'error' (a retryable
 * run failure, never a quality verdict). Suites not yet run (absent from the
 * set) do not gate the verdict — that keeps M1's smoke-only run honest.
 */
export function decideVerdict(suites: SuiteSet, config: ThresholdConfig): Verdict {
  for (const suite of [suites.smoke, suites.links, suites.visual, suites.lighthouse]) {
    if (suite?.status === 'error') return 'error';
  }

  const smokePass = suites.smoke.status === 'passed';
  const linksPass =
    suites.links === undefined
      ? true
      : suites.links.status === 'passed' && (suites.links.broken ?? 0) === 0;
  const visualPass =
    suites.visual === undefined
      ? true
      : suites.visual.status === 'passed' &&
        (suites.visual.isBaseline === true ||
          (suites.visual.diffPct ?? Infinity) <= config.visual.diffTolerancePct);
  const lighthousePass =
    suites.lighthouse === undefined
      ? true
      : suites.lighthouse.status === 'passed' &&
        suites.lighthouse.scores !== undefined &&
        lighthousePasses(suites.lighthouse.scores, config.lighthouse);

  return smokePass && linksPass && visualPass && lighthousePass ? 'passed' : 'rejected';
}
