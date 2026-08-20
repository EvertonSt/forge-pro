import type { ReactNode } from 'react';
import '../vendor/vendor.css';
import { isDemoMode } from '@/lib/vendor/portal-data';

export const metadata = {
  title: 'Forge Pro — Admin',
  description: 'Vendor applications and submission oversight.',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="vp-shell">
      <aside className="vp-sidebar">
        <a href="/admin/vendors" className="vp-brand" style={{ textDecoration: 'none', color: '#fff' }}>
          <span className="vp-brand-mark">A</span> Forge Admin
        </a>
        <nav className="vp-nav">
          <a href="/admin/vendors" className="vp-nav-link">
            Vendor applications
          </a>
          <a href="/admin/submissions" className="vp-nav-link">
            Submissions
          </a>
          <a href="/vendor" className="vp-nav-link">
            ← Back to portal
          </a>
        </nav>
        <div className="vp-sidebar-foot">
          Admin · Phase 2
          <br />
          approvals, oversight, unpublish
        </div>
      </aside>
      <main className="vp-main">
        <div className="vp-page">
          {isDemoMode() ? (
            <div className="vp-banner vp-banner--demo">
              <div>
                <div className="vp-banner-title">Demo mode — Supabase not configured</div>
                Vendor applications and unpublish state are simulated. Approve/revoke and unpublish here
                work against the in-memory demo store.
              </div>
            </div>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
