import type { ReactNode } from 'react';
import './vendor.css';
import { isDemoMode } from '@/lib/vendor/portal-data';
import { getCurrentVendor } from '@/lib/vendor/auth';

export const metadata = {
  title: 'Forge Pro — Vendor Portal',
  description: 'Submit, track, and publish templates and components.',
};

export default async function VendorLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentVendor().catch(() => null);
  // Admins see the admin panel link; demo mode serves admin views too.
  const showAdmin = user?.role === 'admin' || isDemoMode();
  return (
    <div className="vp-shell">
      <aside className="vp-sidebar">
        <a href="/vendor" className="vp-brand" style={{ textDecoration: 'none', color: '#fff' }}>
          <span className="vp-brand-mark">F</span> Forge Pro
        </a>
        <nav className="vp-nav">
          <a href="/vendor" className="vp-nav-link">
            Dashboard
          </a>
          <a href="/vendor/new" className="vp-nav-link">
            New submission
          </a>
          {showAdmin ? (
            <a href="/admin/vendors" className="vp-nav-link">
              Admin panel
            </a>
          ) : null}
          <a href="/" className="vp-nav-link">
            ← Back to app
          </a>
        </nav>
        <div className="vp-sidebar-foot">
          Vendor portal · Phase 2
          <br />
          QA gate: automated review on every submission
        </div>
      </aside>
      <main className="vp-main">
        <div className="vp-page">
          {isDemoMode() ? (
            <div className="vp-banner vp-banner--demo">
              <div>
                <div className="vp-banner-title">Demo mode — Supabase not configured</div>
                Data is simulated and the full submit loop works in memory. Real auth, storage, and
                the QA runner connect in Session 4.
              </div>
            </div>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
