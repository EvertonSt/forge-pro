/**
 * Builds the report a simulated QA run would produce for a submission
 * (demo-only). The shape is the real QaRunReport contract — the same one the
 * runner POSTs and the portal renders — so the demo completion exercises the
 * exact code path a real completion does, just with fabricated numbers.
 */
import type { QaRunReport, Submission } from '@forge-pro/shared-types';
import { REP_REJECTED, REP_PUBLISHED } from './demo-data';
import { demoJobIdFor } from './demo-store';

const PASSED_CHECKS = REP_PUBLISHED.suites.smoke?.checks ?? [];
const FAILED_CHECKS = REP_REJECTED.suites.smoke?.checks ?? [];

export function buildDemoReport(submission: Submission, verdict: 'passed' | 'rejected'): QaRunReport {
  const jobId = demoJobIdFor(submission.id);
  const now = new Date().toISOString();
  const suiteStatus = verdict === 'passed' ? ('passed' as const) : ('failed' as const);
  const base: QaRunReport = {
    schemaVersion: 1,
    submissionId: submission.id,
    jobId,
    artifactSha256: submission.artifactSha256,
    runnerVersion: '0.1.0 (demo)',
    startedAt: now,
    finishedAt: now,
    thresholds: REP_PUBLISHED.thresholds,
    verdict,
    compositeScore: verdict === 'passed' ? 84.2 : 57.3,
    scores:
      verdict === 'passed'
        ? { performance: 62, seo: 91, accessibility: 89, bestPractices: 84 }
        : { performance: 41, seo: 78, accessibility: 64, bestPractices: 58 },
    suites: {
      smoke: {
        status: suiteStatus,
        checks: verdict === 'passed' ? PASSED_CHECKS : FAILED_CHECKS,
        consoleErrors:
          verdict === 'passed'
            ? []
            : [
                "TypeError: Cannot read properties of undefined (reading 'map') — main.bundle.js:141",
                'Failed to load resource: 404 (Not Found) — /assets/img/logo.png',
              ],
      },
      links: {
        status: suiteStatus,
        broken: verdict === 'passed' ? [] : ['/missing.html', '/assets/img/logo.png'],
        total: verdict === 'passed' ? 31 : 39,
      },
      visual: {
        status: suiteStatus,
        diffPct: verdict === 'passed' ? 0.02 : 4.2,
        isBaseline: verdict === 'passed',
      },
      lighthouse: {
        status: suiteStatus,
        composite: verdict === 'passed' ? 84.2 : 57.3,
        lcp: verdict === 'passed' ? 1.9 : 4.8,
        cls: verdict === 'passed' ? 0.02 : 0.34,
        tbt: verdict === 'passed' ? 120 : 480,
      },
    },
    artifacts: {
      htmlReport: `qa-artifacts/${submission.id}/${jobId}/report.html`,
      screenshots: [
        `qa-artifacts/${submission.id}/${jobId}/visual/1280-current.png`,
        `qa-artifacts/${submission.id}/${jobId}/visual/1280-diff.png`,
      ],
    },
    aiNarrative:
      verdict === 'passed'
        ? null
        : {
            summary:
              'The template fails responsive checks at 320px (horizontal overflow) and throws a client-side error that prevents the main grid from rendering. Lighthouse accessibility is below the 85 threshold.',
            issues: [
              {
                severity: 'high',
                category: 'template_defect',
                title: 'Horizontal overflow at 320px',
                detail:
                  'A fixed min-width on the content grid forces the page to scroll sideways at mobile width.',
                suggestedFix:
                  'Replace the fixed min-width with `minmax(0, 1fr)` grid columns, or add `overflow-x: clip` on the section.',
              },
              {
                severity: 'high',
                category: 'template_defect',
                title: 'Runtime error on first render',
                detail:
                  '`items.map` is called before the data has loaded, so the initial render throws and the grid never paints.',
                suggestedFix: 'Guard the map with an early return while the data is undefined.',
              },
            ],
          },
  };
  return base;
}
