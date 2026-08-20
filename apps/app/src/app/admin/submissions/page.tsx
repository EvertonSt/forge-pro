import Link from 'next/link';
import { getCurrentAdmin } from '@/lib/vendor/auth';
import { listAllSubmissions } from '@/lib/vendor/admin-data';
import { deriveChip } from '@/lib/vendor/status';
import { StatusChip } from '@/components/vendor/StatusChip';
import { UnpublishButton } from '@/components/vendor/UnpublishButton';

export const dynamic = 'force-dynamic';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export default async function AdminSubmissionsPage() {
  await getCurrentAdmin();
  const rows = await listAllSubmissions();

  return (
    <div>
      <div className="vp-page-head">
        <div>
          <h1 className="vp-page-title">All submissions</h1>
          <p className="vp-page-sub">
            Every submission across vendors. Unpublish removes a listing from the storefront without touching
            its history or QA records.
          </p>
        </div>
      </div>

      <div className="vp-card">
        {rows.length === 0 ? (
          <div className="vp-empty">No submissions yet.</div>
        ) : (
          <table className="vp-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>QA score</th>
                <th>Version</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ submission, job, vendorName, unpublished, score }) => {
                const chip = deriveChip(submission.status, job);
                const title = submission.title ?? 'Untitled draft';
                const isPublished = submission.status === 'published' && !unpublished;
                return (
                  <tr key={submission.id}>
                    <td>
                      <Link href={`/vendor/submissions/${submission.id}`} className="vp-item-title vp-link">
                        {title}
                      </Link>
                      <div className="vp-item-sub">
                        <span className="vp-tag vp-tag--brand">{submission.itemType}</span>
                      </div>
                    </td>
                    <td className="vp-muted">{vendorName}</td>
                    <td>
                      <StatusChip spec={chip} />
                      {unpublished ? (
                        <span className="vp-chip vp-chip--neutral" style={{ marginLeft: 6 }}>
                          Unpublished
                        </span>
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
                        {isPublished ? <UnpublishButton id={submission.id} /> : null}
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
