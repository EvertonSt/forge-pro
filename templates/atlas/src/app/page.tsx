'use client';

import { useState, useEffect, useCallback } from 'react';

/* ============================================================
   Atlas Dashboard — Main Analytics Page
   ============================================================ */

const sidebarLinks: Array<{ section: string; links: Array<{ label: string; href: string; icon: string; active?: boolean; badge?: string }> }> = [
  { section: 'Overview', links: [
    { label: 'Dashboard', href: '/', icon: 'grid', active: true },
    { label: 'Analytics', href: '/analytics', icon: 'chart' },
    { label: 'Reports', href: '/reports', icon: 'file' },
  ]},
  { section: 'Management', links: [
    { label: 'Customers', href: '/customers', icon: 'users', badge: '12' },
    { label: 'Products', href: '/products', icon: 'box' },
    { label: 'Orders', href: '/orders', icon: 'cart', badge: '3' },
  ]},
  { section: 'Settings', links: [
    { label: 'General', href: '/settings', icon: 'gear' },
    { label: 'Billing', href: '/billing', icon: 'credit' },
    { label: 'Team', href: '/team', icon: 'team' },
  ]},
];

const navIcons: Record<string, React.ReactNode> = {
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  chart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  file: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  box: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  cart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  gear: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  credit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  team: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
};

const stats = [
  { label: 'Total Revenue', value: '$48,294', change: '+12.5%', up: true },
  { label: 'Active Users', value: '2,847', change: '+8.2%', up: true },
  { label: 'Conversion Rate', value: '3.24%', change: '-0.4%', up: false },
  { label: 'Avg. Order Value', value: '$126.50', change: '+5.1%', up: true },
];

const chartData = [65, 78, 52, 91, 43, 87, 69, 94, 58, 72, 85, 96];

const orders = [
  { id: 'ORD-7291', customer: 'Sarah Chen', product: 'Pro Plan', amount: '$299.00', status: 'completed', date: '2026-01-15' },
  { id: 'ORD-7290', customer: 'Marcus Williams', product: 'Enterprise', amount: '$899.00', status: 'processing', date: '2026-01-15' },
  { id: 'ORD-7289', customer: 'Aisha Patel', product: 'Starter Plan', amount: '$49.00', status: 'completed', date: '2026-01-14' },
  { id: 'ORD-7288', customer: 'James Rodriguez', product: 'Pro Plan', amount: '$299.00', status: 'pending', date: '2026-01-14' },
  { id: 'ORD-7287', customer: 'Elena Kowalski', product: 'Enterprise', amount: '$899.00', status: 'completed', date: '2026-01-13' },
  { id: 'ORD-7286', customer: 'David Kim', product: 'Starter Plan', amount: '$49.00', status: 'failed', date: '2026-01-13' },
  { id: 'ORD-7285', customer: 'Lisa Wang', product: 'Pro Plan', amount: '$299.00', status: 'completed', date: '2026-01-12' },
  { id: 'ORD-7284', customer: 'Tom Brown', product: 'Enterprise', amount: '$899.00', status: 'completed', date: '2026-01-12' },
];

const cmdItems = [
  { label: 'Dashboard', shortcut: '⌘D', section: 'Navigation' },
  { label: 'Analytics', shortcut: '⌘A', section: 'Navigation' },
  { label: 'Customers', shortcut: '⌘C', section: 'Navigation' },
  { label: 'Settings', shortcut: '⌘,', section: 'Navigation' },
  { label: 'Toggle Theme', shortcut: '⌘⇧T', section: 'Actions' },
  { label: 'Export Data', shortcut: '⌘E', section: 'Actions' },
  { label: 'Invite Team Member', shortcut: '', section: 'Actions' },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'success', processing: 'info', pending: 'warning', failed: 'danger',
  };
  return (
    <span className={`badge badge--${map[status] || 'info'}`}>
      <span className="badge__dot" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [selectedCmd, setSelectedCmd] = useState(0);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 5;

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('atlas-theme', next);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
      if (e.key === 'Escape') setCmdOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        toggleTheme();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleTheme]);

  // Command palette keyboard nav
  useEffect(() => {
    if (!cmdOpen) return;
    const filtered = cmdItems.filter(i => i.label.toLowerCase().includes(cmdQuery.toLowerCase()));
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedCmd(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedCmd(s => Math.max(s - 1, 0)); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cmdOpen, cmdQuery]);

  // Table sort
  const sortedOrders = [...orders].sort((a, b) => {
    if (!sortCol) return 0;
    const val = (o: typeof a) => {
      if (sortCol === 'amount') return parseFloat(o.amount.replace('$', ''));
      return (o as Record<string, string>)[sortCol] || '';
    };
    const cmp = String(val(a)).localeCompare(String(val(b)), undefined, { numeric: true });
    return sortAsc ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sortedOrders.length / perPage);
  const pagedOrders = sortedOrders.slice((page - 1) * perPage, page * perPage);

  const filteredCmd = cmdItems.filter(i => i.label.toLowerCase().includes(cmdQuery.toLowerCase()));

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortAsc(a => !a);
    else { setSortCol(col); setSortAsc(true); }
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar__logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#6366f1" />
            <path d="M7 18l4-8 4 5 3-3 3 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Atlas
        </div>
        {sidebarLinks.map(section => (
          <div className="sidebar__section" key={section.section}>
            <div className="sidebar__section-title">{section.section}</div>
            {section.links.map(link => (
              <a key={link.label} href={link.href} className={`sidebar__link ${link.active ? 'active' : ''}`}>
                {navIcons[link.icon]}
                {link.label}
                {link.badge && <span className="sidebar__badge">{link.badge}</span>}
              </a>
            ))}
          </div>
        ))}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">JD</div>
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">Jane Doe</div>
              <div className="sidebar__user-role">Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        {/* Topbar */}
        <header className="topbar">
          <button className="topbar__toggle" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <button className="topbar__search" onClick={() => setCmdOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Search commands...
            <kbd>⌘K</kbd>
          </button>
          <div className="topbar__actions">
            <button className="topbar__btn" onClick={toggleTheme} aria-label="Toggle theme">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            </button>
            <button className="topbar__btn" aria-label="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span className="topbar__btn-badge" />
            </button>
            <div className="topbar__divider" />
            <div className="topbar__avatar">JD</div>
          </div>
        </header>

        {/* Content */}
        <div className="content">
          <div className="content__header">
            <div>
              <h1 className="content__title">Dashboard</h1>
              <p className="content__subtitle">Welcome back, Jane. Here&apos;s what&apos;s happening today.</p>
            </div>
            <button className="btn btn--primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Export Report
            </button>
          </div>

          {/* Stats */}
          <div className="stat-grid">
            {stats.map(s => (
              <div className="stat-card animate-in" key={s.label}>
                <div className="stat-card__label">{s.label}</div>
                <div className="stat-card__value">{s.value}</div>
                <div className={`stat-card__change stat-card__change--${s.up ? 'up' : 'down'}`}>
                  {s.up ? '↑' : '↓'} {s.change}
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card">
              <div className="card__title">
                Revenue Overview
                <button className="btn btn--ghost btn--sm">This Year</button>
              </div>
              <div className="chart-area">
                <div className="chart-bars">
                  {chartData.map((h, i) => (
                    <div key={i} className="chart-bar" style={{ height: `${h}%`, background: i === chartData.length - 1 ? 'var(--accent)' : 'var(--brand-200)' }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card__title">Top Products</div>
              {[
                { name: 'Pro Plan', pct: 42, color: 'var(--accent)' },
                { name: 'Enterprise', pct: 31, color: '#ec4899' },
                { name: 'Starter', pct: 18, color: '#f59e0b' },
                { name: 'Add-ons', pct: 9, color: '#22c55e' },
              ].map(p => (
                <div key={p.name} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                    <span>{p.name}</span><span style={{ color: 'var(--text-secondary)' }}>{p.pct}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${p.pct}%`, background: p.color, borderRadius: '3px', transition: 'width 0.6s var(--ease)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Orders table */}
          <div className="card">
            <div className="card__title">
              Recent Orders
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="input" placeholder="Filter orders..." style={{ width: '10rem' }} />
                <button className="btn btn--secondary btn--sm">Export</button>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    {[
                      { key: 'id', label: 'Order ID' },
                      { key: 'customer', label: 'Customer' },
                      { key: 'product', label: 'Product' },
                      { key: 'amount', label: 'Amount' },
                      { key: 'status', label: 'Status' },
                      { key: 'date', label: 'Date' },
                    ].map(col => (
                      <th key={col.key} onClick={() => toggleSort(col.key)}>
                        {col.label} {sortCol === col.key ? (sortAsc ? '↑' : '↓') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedOrders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{o.id}</td>
                      <td>{o.customer}</td>
                      <td>{o.product}</td>
                      <td style={{ fontWeight: 600 }}>{o.amount}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{o.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, sortedOrders.length)} of {sortedOrders.length}</span>
              <div className="pagination__btns">
                <button className="pagination__btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} className={`pagination__btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
                ))}
                <button className="pagination__btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Command Palette */}
      <div className={`cmd-overlay ${cmdOpen ? 'open' : ''}`} onClick={() => setCmdOpen(false)}>
        <div className="cmd" onClick={e => e.stopPropagation()}>
          <input
            className="cmd__input"
            placeholder="Type a command..."
            value={cmdQuery}
            onChange={e => { setCmdQuery(e.target.value); setSelectedCmd(0); }}
            autoFocus={cmdOpen}
          />
          <div className="cmd__list">
            {filteredCmd.map((item, i) => (
              <div key={item.label} className={`cmd__item ${i === selectedCmd ? 'selected' : ''}`}>
                <span className="cmd__item-label">{item.label}</span>
                {item.shortcut && <span className="cmd__item-shortcut">{item.shortcut}</span>}
              </div>
            ))}
            {filteredCmd.length === 0 && (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No results found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
