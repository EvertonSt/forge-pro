import { z } from 'zod';

/**
 * The QA gate contract — docs/qa-gate.md §8–§9.
 *
 * Everything here is shared verbatim between the qa-runner (which produces
 * verdicts) and the app (which renders thresholds in the vendor portal and
 * reads report data). Thresholds and the report shape must never drift between
 * the two, so they live in this one package.
 */

// ---------------------------------------------------------------------------
// ThresholdConfig — the gate's single source of truth for pass/fail rules.
// The full config is snapshotted into every report (report.thresholds) so a
// historical verdict is never reinterpreted after thresholds change.
// ---------------------------------------------------------------------------

export const ThresholdConfigSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  lighthouse: z
    .object({
      formFactor: z.enum(['mobile', 'desktop']).default('mobile'),
      /** 1 run for cost; 3 runs (median composite) to damp CI variance. */
      runs: z.union([z.literal(1), z.literal(3)]).default(1),
      minScores: z
        .object({
          performance: z.number(),
          seo: z.number(),
          accessibility: z.number(),
          bestPractices: z.number(),
        })
        .default({ performance: 55, seo: 85, accessibility: 85, bestPractices: 80 }),
      minComposite: z.number().default(75),
      weights: z
        .object({
          performance: z.number(),
          seo: z.number(),
          accessibility: z.number(),
          bestPractices: z.number(),
        })
        .default({ performance: 0.3, seo: 0.2, accessibility: 0.35, bestPractices: 0.15 }),
    })
    .default({
      formFactor: 'mobile',
      runs: 1,
      minScores: { performance: 55, seo: 85, accessibility: 85, bestPractices: 80 },
      minComposite: 75,
      weights: { performance: 0.3, seo: 0.2, accessibility: 0.35, bestPractices: 0.15 },
    }),
  responsive: z
    .object({
      breakpoints: z.array(z.number()).default([320, 768, 1280, 1920]),
      /** Max error-level console messages + pageerrors across the whole run. */
      maxConsoleErrors: z.number().default(0),
      /** CSS selectors that must be visible at every breakpoint. */
      probes: z.array(z.string()).default(['main', 'header', 'footer']),
      navigationTimeoutMs: z.number().default(30_000),
    })
    .default({
      breakpoints: [320, 768, 1280, 1920],
      maxConsoleErrors: 0,
      probes: ['main', 'header', 'footer'],
      navigationTimeoutMs: 30_000,
    }),
  links: z
    .object({
      maxDepth: z.number().default(3),
      maxUrls: z.number().default(50),
      allowlist: z.array(z.string()).default([]),
      checkExternal: z.boolean().default(true),
      failOnExternal: z.boolean().default(false),
    })
    .default({ maxDepth: 3, maxUrls: 50, allowlist: [], checkExternal: true, failOnExternal: false }),
  visual: z
    .object({
      breakpoints: z.array(z.number()).default([320, 768, 1280]),
      /** Max % of pixels allowed to differ vs. the baseline. */
      diffTolerancePct: z.number().default(0.1),
    })
    .default({ breakpoints: [320, 768, 1280], diffTolerancePct: 0.1 }),
  retry: z
    .object({
      maxAttempts: z.number().default(2),
      backoffSeconds: z.number().default(30),
    })
    .default({ maxAttempts: 2, backoffSeconds: 30 }),
});
export type ThresholdConfig = z.infer<typeof ThresholdConfigSchema>;

// ---------------------------------------------------------------------------
// report.json artifact contract. Mirrors QaReportSchema (the DB row) but is
// the full artifact — the row is a projection of it. Schema v1; bump
// schemaVersion on breaking changes.
// ---------------------------------------------------------------------------

export const VerdictSchema = z.enum(['passed', 'rejected', 'error']);
export type Verdict = z.infer<typeof VerdictSchema>;

export const SuiteStatusSchema = z.enum(['passed', 'failed', 'error']);
export type SuiteStatus = z.infer<typeof SuiteStatusSchema>;

export const CheckSchema = z.object({
  id: z.string(),
  status: z.enum(['passed', 'failed']),
  detail: z.string().optional(),
});
export type Check = z.infer<typeof CheckSchema>;

export const LighthouseScoresSchema = z.object({
  performance: z.number().nullable(),
  seo: z.number().nullable(),
  accessibility: z.number().nullable(),
  bestPractices: z.number().nullable(),
});
export type LighthouseScores = z.infer<typeof LighthouseScoresSchema>;

export const QaRunReportSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  /** Null in fixture mode (--url). */
  submissionId: z.string().nullable(),
  jobId: z.string().nullable(),
  artifactSha256: z.string().nullable(),
  runnerVersion: z.string(),
  startedAt: z.string(),
  finishedAt: z.string(),
  /** Full config snapshot — verdicts are facts about (artifact, config, time). */
  thresholds: ThresholdConfigSchema,
  verdict: VerdictSchema,
  /** Null until the Lighthouse suite lands (M3). */
  compositeScore: z.number().nullable(),
  scores: LighthouseScoresSchema,
  suites: z
    .object({
      smoke: z
        .object({
          status: SuiteStatusSchema,
          checks: z.array(CheckSchema),
          consoleErrors: z.array(z.string()),
        })
        .optional(),
      /** M2 — broken-link crawl (docs/qa-gate.md §5). */
      links: z
        .object({
          status: SuiteStatusSchema,
          /** URLs that returned 4xx/5xx or failed to resolve (same-origin). */
          broken: z.array(z.string()),
          total: z.number().int().nonnegative(),
        })
        .optional(),
      /** M2 — visual regression vs. the baseline (docs/qa-gate.md §6). */
      visual: z
        .object({
          status: SuiteStatusSchema,
          /** % of pixels differing vs. the previous baseline; null on first run. */
          diffPct: z.number().min(0).max(100).nullable(),
          /** First passing run for an item becomes the new baseline. */
          isBaseline: z.boolean(),
        })
        .optional(),
      /** M3 — Lighthouse (docs/qa-gate.md §7). */
      lighthouse: z
        .object({
          status: SuiteStatusSchema,
          composite: z.number().min(0).max(100).nullable(),
          /** Largest Contentful Paint (s). */
          lcp: z.number().nullable(),
          /** Cumulative Layout Shift. */
          cls: z.number().nullable(),
          /** Total Blocking Time (ms). */
          tbt: z.number().nullable(),
        })
        .optional(),
    })
    .default({}),
  artifacts: z.record(z.string(), z.unknown()).default({}),
  aiNarrative: z.unknown().nullable().default(null),
});
export type QaRunReport = z.infer<typeof QaRunReportSchema>;

/**
 * The runner → app completion callback payload (docs/vendor-portal.md §8).
 * The app is the only component that advances submissions and writes Sanity;
 * the runner delivers the full report and the app decides what it means.
 * Error verdicts are retryable run failures and carry no quality verdict.
 */
export const QaCompletePayloadSchema = z.object({
  jobId: z.string(),
  report: QaRunReportSchema,
});
export type QaCompletePayload = z.infer<typeof QaCompletePayloadSchema>;
