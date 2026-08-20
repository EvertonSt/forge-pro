import Link from 'next/link';
import { getCurrentVendor } from '@/lib/vendor/auth';
import { isDemoMode, listVendorSubmissions, scoresForSubmissions } from '@/lib/vendor/portal-data';
import { isDemoUnpublished } from '@/lib/vendor/demo-store';
import { deriveChip } from '@/lib/vendor/status';
import { StatusChip } from '@/components/vendor/StatusChip';
import { WithdrawButton } from '@/components/vendor/WithdrawButton';

export const dynamic = 'force-dynamic';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function canWithdraw(status: string): boolean {
  return status === 'draft' || status === 'submitted' || status === 'qa_rejected';
}

export default async function VendorDashboardPage() {
  const user = await getCurrentVendor();
  const rows = await listVendorSubmissions(user.userId);
  const scores = await scoresForSubmissions(rows.map((r) => r.submission));
  // Unpublished state lives in Sanity in real mode; in demo mode the store tracks it.
  const isDemo = isDemoMode();
  const isUnpublished = (id: string) => isDemo && isDemoUnpublished(id);

  const counts = {
    live: rows.filter((r) => r.submission.status === 'published' && !isUnpublished(r.submission.id)).length,
    inQa: rows.filter((r) => r.submission.status === 'submitted' || r.submission.status === 'qa_passed').length,
    rejected: rows.filter((r) => r.submission.status === 'qa_rejected').length,
    drafts: rows.filter((r) => r.submission.status === 'draft').length,
  };

  return (
    <div>
      <div className="vp-page-head">
        <div>
          <h1 className="vp-page-title">Vendor dashboard</h1>
          <p className="vp-page-sub">
            Every submission runs the automated QA gate before it goes live — pass and publish, or fix and
            resubmit.
          </p>
        </div>
        <div className="vp-head-actions">
          <Link href="/vendor/new" className="vp-btn vp-btn--primary">
            New submission
          </Link>
        </div>
      </div>

      <div className="vp-stats">
        <div className="vp-stat">
          <div className="vp-stat-value">{counts.live}</div>
          <div className="vp-stat-label">Live listings</div>
        </div>
        <div className="vp-stat">
          <div className="vp-stat-value">{counts.inQa}</div>
          <div className="vp-stat-label">In QA</div>
        </div>
        <div className="vp-stat">
          <div className="vp-stat-value">{counts.rejected}</div>
          <div className="vp-stat-label">Needs fixes</div>
        </div>
        <div className="vp-stat">
          <div className="vp-stat-value">{counts.drafts}</div>
          <div className="vp-stat-label">Drafts</div>
        </div>
      </div>

      <div className="vp-card">
        {rows.length === 0 ? (
          <div className="vp-empty">
            No submissions yet.{' '}
            <Link href="/vendor/new" className="vp-link">
              Create your first one
            </Link>
            .
          </div>
        ) : (
          <table className="vp-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Status</th>
                <th>QA score</th>
                <th>Version</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ submission, job }) => {
                const chip = deriveChip(submission.status, job);
                const score = scores.get(submission.id) ?? null;
                const title = submission.title ?? 'Untitled draft';
                const unpublished = isUnpublished(submission.id);
                return (
                  <tr key={submission.id}>
                    <td>
                      <Link href={`/vendor/submissions/${submission.id}`} className="vp-item-title vp-link">
                        {title}
                      </Link>
                      <div className="vp-item-sub">
                        <span className="vp-tag vp-tag--brand">{submission.itemType}</span>
                        {submission.framework ? (
                          <span style={{ marginLeft: 6 }}>{submission.framework}</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <StatusChip spec={chip} />
                      {unpublished ? (
                        <span className="vp-chip vp-chip--neutral" style={{ marginLeft: 6 }}>
                          Unpublished
                        </span>
                      ) : null}
                      {submission.status === 'submitted' && job?.status === 'error' ? (
                        <div className="vp-small vp-muted" style={{ marginTop: 3 }}>
                          max attempts reached
                        </div>
                      ) : null}
                    </td>
                    <td>
                      {score !== null ? (
                        <span
                          className={score >= 75 ? 'vp-score-value--pass' : 'vp-score-value--fail'}
                          style={{ fontWeight: 700 }}
                        >
                          {Math.round(score)}
                        </span>
                      ) : (
                        <span className="vp-muted">—</span>
                      )}
                    </td>
                    <td className="vp-mono">{submission.submittedVersion ?? '—'}</td>
                    <td className="vp-muted">{formatDate(submission.createdAt)}</td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          gap: 6,
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                        }}
                      >
                        <Link href={`/vendor/submissions/${submission.id}`} className="vp-btn vp-btn--ghost vp-btn--sm">
                          View
                        </Link>
                        {submission.status === 'qa_rejected' ? (
                          <Link
                            href={`/vendor/submissions/${submission.id}#fix`}
                            className="vp-btn vp-btn--sm"
                            style={{ background: 'var(--fp-color-brand-50)', color: 'var(--fp-color-brand-700)' }}
                          >
                            Fix &amp; resubmit
                          </Link>
                        ) : null}
                        {canWithdraw(submission.status) ? <WithdrawButton id={submission.id} small /> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
