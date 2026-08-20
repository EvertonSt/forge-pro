import { nextStatus } from './src/lib/vendor/submission-machine.ts';
import { slugify } from './src/lib/vendor/publish.ts';
import { mapReportToQaReportRow } from './src/lib/vendor/qa-complete.ts';
import { QaRunReportSchema } from '@forge-pro/shared-types';

let failures = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}
const t = (from, event, expect) =>
  check(
    `machine: ${from} --${event.type}${event.verdict ? `:${event.verdict}` : ''}--> ${expect}`,
    nextStatus(from, event) === expect,
    `got ${nextStatus(from, event)}`,
  );

t('draft', { type: 'submit' }, 'submitted');
t('submitted', { type: 'qa_completed', verdict: 'passed' }, 'qa_passed');
t('submitted', { type: 'qa_completed', verdict: 'rejected' }, 'qa_rejected');
t('submitted', { type: 'qa_completed', verdict: 'error' }, 'submitted');
t('qa_rejected', { type: 'resubmit' }, 'submitted');
t('draft', { type: 'withdraw' }, 'withdrawn');
t('submitted', { type: 'withdraw' }, 'withdrawn');
t('qa_rejected', { type: 'withdraw' }, 'withdrawn');
t('qa_passed', { type: 'withdraw' }, 'qa_passed');
t('published', { type: 'resubmit' }, 'published');
t('qa_passed', { type: 'publish' }, 'published');
t('qa_rejected', { type: 'publish' }, 'qa_rejected');
t('qa_passed', { type: 'submit' }, 'qa_passed');
t('withdrawn', { type: 'qa_completed', verdict: 'passed' }, 'withdrawn');

check('slugify basic', slugify('Launchpad — SaaS landing!') === 'launchpad-saas-landing');
check('slugify accents', slugify('Crème Brûlée') === 'creme-brulee');
check('slugify collapse', slugify('  Spaces   &  Tabs  ') === 'spaces-tabs');
check('slugify cap 96', slugify('a'.repeat(200)).length <= 96);

const report = QaRunReportSchema.parse({
  submissionId: null,
  jobId: 'j1',
  artifactSha256: null,
  runnerVersion: '0.1.0',
  startedAt: '2026-01-01T00:00:00Z',
  finishedAt: '2026-01-01T00:00:01Z',
  verdict: 'passed',
  compositeScore: 90,
  scores: { performance: 80, seo: 90, accessibility: 95, bestPractices: 95 },
  thresholds: { schemaVersion: 1 },
  suites: { smoke: { status: 'passed', checks: [], consoleErrors: [] } },
  artifacts: { htmlReport: 'https://example.com/report.html', screenshots: ['a.png', 'b.png'] },
});
const row = mapReportToQaReportRow(report, 'sub1', 'j1', 'r1');
check('row verdict', row.status === 'passed');
check('row composite', row.composite_score === 90);
check('row link scan defaults', JSON.stringify(row.link_scan) === '{"broken":[],"total":0}');
check('row threshold snapshot', row.threshold_snapshot.schemaVersion === 1);
check('row report url', row.report_html_url === 'https://example.com/report.html');
check('row screenshots', JSON.stringify(row.screenshots) === '["a.png","b.png"]');
check('row baseline default', row.is_baseline === false);

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
