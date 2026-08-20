import { getCurrentAdmin } from '@/lib/vendor/auth';
import { listVendorApplications } from '@/lib/vendor/admin-data';
import { AdminVendorActionButtons } from '@/components/vendor/AdminVendorActionButtons';

export const dynamic = 'force-dynamic';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export default async function AdminVendorsPage() {
  await getCurrentAdmin();
  const applications = await listVendorApplications();

  return (
    <div>
      <div className="vp-page-head">
        <div>
          <h1 className="vp-page-title">Vendor applications</h1>
          <p className="vp-page-sub">
            Approving flips the applicant&apos;s role to vendor and marks their profile public. Revoking reverts
            it — listings stay visible to admins, and the vendor can re-apply.
          </p>
        </div>
      </div>

      <div className="vp-card">
        {applications.length === 0 ? (
          <div className="vp-empty">No vendor applications yet.</div>
        ) : (
          <table className="vp-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Website</th>
                <th>Applied</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const approved = app.approvedAt !== null && app.role === 'vendor';
                return (
                  <tr key={app.id}>
                    <td>
                      <div className="vp-item-title">{app.displayName ?? app.email}</div>
                      <div className="vp-item-sub">{app.email}</div>
                      {app.bio ? <div className="vp-item-sub">{app.bio}</div> : null}
                    </td>
                    <td>
                      {app.website ? (
                        <a href={app.website} target="_blank" rel="noreferrer" className="vp-link vp-small">
                          {app.website}
                        </a>
                      ) : (
                        <span className="vp-muted">—</span>
                      )}
                    </td>
                    <td className="vp-muted">{formatDate(app.createdAt)}</td>
                    <td>
                      {approved ? (
                        <span className="vp-chip vp-chip--success">Approved</span>
                      ) : (
                        <span className="vp-chip vp-chip--neutral">Pending</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <AdminVendorActionButtons id={app.id} approved={approved} />
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
