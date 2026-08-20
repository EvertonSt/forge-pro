import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { QaRunReportSchema, type QaRunReport, type ThresholdConfig, type Verdict } from '@forge-pro/shared-types';
import type { SmokeResult } from '../suites/smoke.js';
import { computeComposite, decideVerdict, type LighthouseScores, type SuiteSet } from './composite.js';

export const RUNNER_VERSION = '0.2.0';

/** Links suite result (docs/qa-gate.md §5). */
export interface LinksSuiteResult {
  status: 'passed' | 'failed' | 'error';
  /** URLs that returned 4xx/5xx or failed to resolve (same-origin). */
  broken: string[];
  total: number;
}

/** Visual suite result (docs/qa-gate.md §6). */
export interface VisualSuiteResult {
  status: 'passed' | 'failed' | 'error';
  /** % of pixels differing vs. the previous baseline; null on first run. */
  diffPct: number | null;
  /** First passing run for an item becomes the new baseline. */
  isBaseline: boolean;
}

/** Lighthouse suite result (docs/qa-gate.md §7). */
export interface LighthouseSuiteResult {
  status: 'passed' | 'failed' | 'error';
  scores: LighthouseScores;
  lcp: number | null;
  cls: number | null;
  tbt: number | null;
}

export interface BuildReportInput {
  submissionId: string | null;
  jobId: string | null;
  artifactSha256: string | null;
  config: ThresholdConfig;
  startedAt: Date;
  finishedAt: Date;
  smoke: SmokeResult;
  /** M2+ — absent suites do not gate the verdict (smoke-only runs stay honest). */
  links?: LinksSuiteResult;
  visual?: VisualSuiteResult;
  lighthouse?: LighthouseSuiteResult;
}

/**
 * Assemble a report from suite results. The verdict is decided by the pure
 * engine (docs/qa-gate.md §8): absent suites do not gate, error verdicts are
 * retryable run failures, and only quality verdicts (passed/rejected) are
 * delivered to the app as judgments.
 */
export function buildReport(input: BuildReportInput): QaRunReport {
  const suites: SuiteSet = {
    smoke: { status: input.smoke.status },
    links: input.links
      ? { status: input.links.status, broken: input.links.broken.length }
      : undefined,
    visual: input.visual
      ? { status: input.visual.status, diffPct: input.visual.diffPct, isBaseline: input.visual.isBaseline }
      : undefined,
    lighthouse: input.lighthouse
      ? { status: input.lighthouse.status, scores: input.lighthouse.scores }
      : undefined,
  };

  const verdict: Verdict = decideVerdict(suites, input.config);
  const composite =
    input.lighthouse === undefined
      ? null
      : computeComposite(input.lighthouse.scores, input.config.lighthouse.weights);
  const scores: LighthouseScores =
    input.lighthouse === undefined
      ? { performance: null, seo: null, accessibility: null, bestPractices: null }
      : input.lighthouse.scores;

  return QaRunReportSchema.parse({
    schemaVersion: 1,
    submissionId: input.submissionId,
    jobId: input.jobId,
    artifactSha256: input.artifactSha256,
    runnerVersion: RUNNER_VERSION,
    startedAt: input.startedAt.toISOString(),
    finishedAt: input.finishedAt.toISOString(),
    thresholds: input.config,
    verdict,
    compositeScore: composite,
    scores,
    suites: {
      smoke: {
        status: input.smoke.status,
        checks: input.smoke.checks,
        consoleErrors: input.smoke.consoleErrors,
      },
      ...(input.links && {
        links: {
          status: input.links.status,
          broken: input.links.broken,
          total: input.links.total,
        },
      }),
      ...(input.visual && {
        visual: {
          status: input.visual.status,
          diffPct: input.visual.diffPct,
          isBaseline: input.visual.isBaseline,
        },
      }),
      ...(input.lighthouse && {
        lighthouse: {
          status: input.lighthouse.status,
          composite,
          lcp: input.lighthouse.lcp,
          cls: input.lighthouse.cls,
          tbt: input.lighthouse.tbt,
        },
      }),
    },
    artifacts: {},
    aiNarrative: null,
  });
}

/** Write report.json (pretty-printed) to <outDir>/report.json. */
export function writeReport(report: QaRunReport, outDir: string): string {
  mkdirSync(outDir, { recursive: true });
  const path = join(outDir, 'report.json');
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return path;
}

/** One-line human summary for the CLI. */
export function summarize(report: QaRunReport): string {
  const smoke = report.suites.smoke;
  const failed = smoke?.checks.filter((c) => c.status === 'failed').length ?? 0;
  const parts = [
    `verdict=${report.verdict}`,
    `smoke=${smoke?.status ?? 'n/a'} (${failed} failed of ${smoke?.checks.length ?? 0})`,
  ];
  if (report.suites.links) {
    parts.push(
      `links=${report.suites.links.status} (${report.suites.links.broken.length} broken of ${report.suites.links.total})`,
    );
  }
  if (report.suites.visual) {
    parts.push(
      `visual=${report.suites.visual.status} (diff ${report.suites.visual.diffPct ?? 'n/a'}%)`,
    );
  }
  if (report.suites.lighthouse) {
    parts.push(
      `lighthouse=${report.suites.lighthouse.status} (composite ${report.suites.lighthouse.composite ?? 'n/a'})`,
    );
  }
  return parts.join(' ');
}
