import type { QaRunReport, Check } from '@forge-pro/shared-types';
import { ScoreBar } from './ScoreBar';

interface ReportViewProps {
  report: QaRunReport;
  /** Context shown next to the verdict, e.g. the item's title. */
  context?: string;
}

function shortHash(hash: string | null): string {
  if (!hash) return '—';
  return hash.length > 12 ? `${hash.slice(0, 12)}…` : hash;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const VERDICT_META: Record<QaRunReport['verdict'], { title: string; tone: string }> = {
  passed: { title: 'QA passed', tone: 'vp-verdict--passed' },
  rejected: { title: 'QA rejected', tone: 'vp-verdict--rejected' },
  error: { title: 'Run error', tone: 'vp-verdict--error' },
};

function CheckRow({ check }: { check: Check }) {
  const failed = check.status === 'failed';
  return (
    <div className="vp-check">
      <span className={`vp-check-dot vp-check-dot--${failed ? 'failed' : 'passed'}`} />
      <span className="vp-check-id">{check.id}</span>
      {failed ? <span className="vp-check-fail">failed</span> : null}
      {check.detail ? <span className="vp-check-detail">{check.detail}</span> : null}
    </div>
  );
}

function SuiteShell({
  name,
  status,
  meta,
  children,
  defaultOpen,
}: {
  name: string;
  status: 'passed' | 'failed' | 'error';
  meta: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="vp-suite" open={defaultOpen ?? status !== 'passed'}>
      <summary className="vp-suite-head">
        <span className="vp-suite-name">
          {name}
          <span className={`vp-chip vp-chip--${status === 'passed' ? 'success' : 'danger'}`} style={{ marginLeft: 8 }}>
            {status}
          </span>
        </span>
        <span className="vp-suite-meta">{meta}</span>
      </summary>
      <div className="vp-suite-body">{children}</div>
    </details>
  );
}

export function ReportView({ report, context }: ReportViewProps) {
  const t = report.thresholds;
  const suites = report.suites;
  const verdict = VERDICT_META[report.verdict];

  const failedChecks = (suites.smoke?.checks ?? []).filter((c) => c.status === 'failed');
  const brokenLinks = suites.links?.broken ?? [];
  const failCount = failedChecks.length + brokenLinks.length;

  const mins = t.lighthouse.minScores;

  return (
    <div>
      {/* Verdict banner */}
      <div className={`vp-verdict ${verdict.tone}`}>
        <div className="vp-verdict-score">
          {report.compositeScore !== null ? Math.round(report.compositeScore) : '—'}
        </div>
        <div className="vp-verdict-body">
          <div className="vp-verdict-title">
            {verdict.title}
            {report.compositeScore !== null ? (
              <span className="vp-muted" style={{ fontWeight: 500, fontSize: 'var(--fp-text-sm)' }}>
                {' '}
                · composite {report.compositeScore} (min {t.lighthouse.minComposite})
              </span>
            ) : null}
          </div>
          <div className="vp-verdict-sub">
            {context ? `${context} · ` : ''}run by forge-qa {report.runnerVersion} ·{' '}
            {formatDateTime(report.startedAt)} → {formatDateTime(report.finishedAt)}
            {report.verdict === 'rejected' && failCount > 0
              ? ` · ${failCount} failed check${failCount === 1 ? '' : 's'}`
              : ''}
          </div>
        </div>
      </div>

      {/* Lighthouse scores */}
      <div className="vp-card" style={{ marginBottom: 'var(--fp-space-6)' }}>
        <div className="vp-card-head">
          <h3 className="vp-card-title">Lighthouse scores</h3>
          <span className="vp-small vp-muted">
            {t.lighthouse.formFactor} · {t.lighthouse.runs} run{t.lighthouse.runs > 1 ? 's' : ''}
          </span>
        </div>
        <div className="vp-card-body">
          <div className="vp-scores">
            <ScoreBar label="Accessibility" value={report.scores.accessibility} min={mins.accessibility} weight={t.lighthouse.weights.accessibility} />
            <ScoreBar label="Performance" value={report.scores.performance} min={mins.performance} weight={t.lighthouse.weights.performance} />
            <ScoreBar label="SEO" value={report.scores.seo} min={mins.seo} weight={t.lighthouse.weights.seo} />
            <ScoreBar label="Best practices" value={report.scores.bestPractices} min={mins.bestPractices} weight={t.lighthouse.weights.bestPractices} />
          </div>
          {suites.lighthouse ? (
            <div className="vp-kv" style={{ marginTop: 14 }}>
              <dt>Composite</dt>
              <dd>{suites.lighthouse.composite ?? '—'}</dd>
              <dt>LCP</dt>
              <dd>{suites.lighthouse.lcp !== null ? `${suites.lighthouse.lcp}s` : '—'}</dd>
              <dt>CLS</dt>
              <dd>{suites.lighthouse.cls !== null ? suites.lighthouse.cls : '—'}</dd>
              <dt>TBT</dt>
              <dd>{suites.lighthouse.tbt !== null ? `${suites.lighthouse.tbt} ms` : '—'}</dd>
            </div>
          ) : null}
        </div>
      </div>

      {/* Suites */}
      <div className="vp-card" style={{ marginBottom: 'var(--fp-space-6)' }}>
        <div className="vp-card-head">
          <h3 className="vp-card-title">Suites</h3>
          <span className="vp-small vp-muted">failed checks listed first</span>
        </div>
        <div className="vp-card-body" style={{ paddingTop: 12 }}>
          {suites.smoke ? (
            <SuiteShell name="Smoke & responsive" status={suites.smoke.status} meta={`${suites.smoke.checks.length} checks · ${t.responsive.breakpoints.join(' / ')}px`}>
              {(suites.smoke.checks ?? []).map((c) => (
                <CheckRow key={c.id} check={c} />
              ))}
              {suites.smoke.consoleErrors.length > 0 ? (
                <div style={{ marginTop: 8 }}>
                  <div className="vp-suite-meta" style={{ marginBottom: 4, fontWeight: 600 }}>
                    Console errors ({suites.smoke.consoleErrors.length}, budget {t.responsive.maxConsoleErrors})
                  </div>
                  {suites.smoke.consoleErrors.map((e) => (
                    <div key={e} className="vp-console-error">
                      {e}
                    </div>
                  ))}
                </div>
              ) : null}
            </SuiteShell>
          ) : null}

          {suites.links ? (
            <SuiteShell
              name="Broken-link scan"
              status={suites.links.status}
              meta={`${suites.links.total} URLs crawled · depth ${t.links.maxDepth}`}
            >
              {suites.links.broken.length > 0 ? (
                <div className="vp-broken-list">
                  {suites.links.broken.map((url) => (
                    <div key={url} className="vp-broken-item">
                      {url}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="vp-small vp-muted" style={{ padding: '6px 0' }}>
                  No broken links found.
                </div>
              )}
            </SuiteShell>
          ) : null}

          {suites.visual ? (
            <SuiteShell
              name="Visual regression"
              status={suites.visual.status}
              meta={`${suites.visual.isBaseline ? 'baseline run · ' : ''}tolerance ${t.visual.diffTolerancePct}%`}
            >
              <div className="vp-kv" style={{ padding: '6px 0' }}>
                <dt>Pixel diff</dt>
                <dd>
                  {suites.visual.diffPct !== null ? `${suites.visual.diffPct}%` : 'first run — captured as baseline'}
                </dd>
                <dt>Breakpoints</dt>
                <dd>{t.visual.breakpoints.join(' / ')} px</dd>
              </div>
            </SuiteShell>
          ) : null}

          {suites.lighthouse ? (
            <SuiteShell
              name="Lighthouse"
              status={suites.lighthouse.status}
              meta={`${suites.lighthouse.composite !== null ? `composite ${suites.lighthouse.composite} · ` : ''}min ${t.lighthouse.minComposite}`}
            >
              <div className="vp-kv" style={{ padding: '6px 0' }}>
                <dt>Composite</dt>
                <dd>{suites.lighthouse.composite ?? '—'}</dd>
                <dt>LCP</dt>
                <dd>{suites.lighthouse.lcp !== null ? `${suites.lighthouse.lcp}s` : '—'}</dd>
                <dt>CLS</dt>
                <dd>{suites.lighthouse.cls !== null ? suites.lighthouse.cls : '—'}</dd>
                <dt>TBT</dt>
                <dd>{suites.lighthouse.tbt !== null ? `${suites.lighthouse.tbt} ms` : '—'}</dd>
              </div>
            </SuiteShell>
          ) : null}

          {!suites.smoke && !suites.links && !suites.visual && !suites.lighthouse ? (
            <div className="vp-empty">No suite results in this report.</div>
          ) : null}
        </div>
      </div>

      {/* AI narrative (M5) */}
      {report.aiNarrative && typeof report.aiNarrative === 'object' && report.aiNarrative !== null ? (
        <div className="vp-card" style={{ marginBottom: 'var(--fp-space-6)' }}>
          <div className="vp-card-head">
            <h3 className="vp-card-title">AI triage</h3>
            <span className="vp-small vp-muted">explanatory only — the verdict is deterministic</span>
          </div>
          <div className="vp-card-body">
            <p className="vp-small" style={{ color: 'var(--fp-color-neutral-600)', lineHeight: 1.6 }}>
              {String((report.aiNarrative as { summary?: string }).summary ?? '')}
            </p>
            {Array.isArray((report.aiNarrative as { issues?: unknown[] }).issues) ? (
              <div style={{ marginTop: 12 }}>
                {(report.aiNarrative as { issues: Array<{ severity?: string; title?: string; detail?: string; suggestedFix?: string }> }).issues.map(
                  (issue, i) => (
                    <div key={i} className="vp-issue">
                      <div className="vp-issue-head">
                        <span className={`vp-sev vp-sev--${issue.severity ?? 'low'}`}>{issue.severity ?? 'low'}</span>
                        {issue.title}
                      </div>
                      {issue.detail ? <div className="vp-issue-detail">{issue.detail}</div> : null}
                      {issue.suggestedFix ? (
                        <div className="vp-issue-fix">
                          <div className="vp-issue-fix-label">Suggested fix</div>
                          {issue.suggestedFix}
                        </div>
                      ) : null}
                    </div>
                  ),
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Artifacts */}
      {Object.keys(report.artifacts).length > 0 ? (
        <div className="vp-card" style={{ marginBottom: 'var(--fp-space-6)' }}>
          <div className="vp-card-head">
            <h3 className="vp-card-title">Artifacts</h3>
            <span className="vp-small vp-muted">stored with the run</span>
          </div>
          <div className="vp-card-body">
            <div className="vp-artifacts">
              {Object.entries(report.artifacts).map(([key, value]) => {
                if (key === 'screenshots' && Array.isArray(value)) {
                  return (
                    <div key={key} style={{ marginBottom: 8 }}>
                      <div className="vp-suite-meta" style={{ fontWeight: 600, marginBottom: 6 }}>
                        screenshots
                      </div>
                      <div className="vp-screenshot-grid">
                        {value.map((src) => (
                          <div key={String(src)} className="vp-screenshot">
                            <div className="vp-screenshot-cap">{String(src)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={key} style={{ padding: '2px 0' }}>
                    <span className="vp-muted">{key}: </span>
                    {typeof value === 'string' ? value : JSON.stringify(value)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Thresholds + metadata */}
      <div className="vp-card">
        <div className="vp-card-head">
          <h3 className="vp-card-title">Run details</h3>
          <span className="vp-small vp-muted">schema v{report.schemaVersion}</span>
        </div>
        <div className="vp-card-body">
          <dl className="vp-kv">
            <dt>Job</dt>
            <dd>{report.jobId ?? 'fixture mode (—url)'}</dd>
            <dt>Submission</dt>
            <dd>{report.submissionId ?? '—'}</dd>
            <dt>Artifact sha256</dt>
            <dd title={report.artifactSha256 ?? undefined}>{shortHash(report.artifactSha256)}</dd>
            <dt>Runner</dt>
            <dd>forge-qa {report.runnerVersion}</dd>
            <dt>Started</dt>
            <dd>{formatDateTime(report.startedAt)}</dd>
            <dt>Finished</dt>
            <dd>{formatDateTime(report.finishedAt)}</dd>
          </dl>
          <details className="vp-details" style={{ marginTop: 14 }}>
            <summary>Threshold snapshot (as executed)</summary>
            <pre>{JSON.stringify(report.thresholds, null, 2)}</pre>
          </details>
        </div>
      </div>
    </div>
  );
}
