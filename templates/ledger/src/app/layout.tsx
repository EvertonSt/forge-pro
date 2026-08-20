'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './globals.css';

const navItems = [
  { href: '/', label: 'Overview', icon: '📊' },
  { href: '/transactions', label: 'Transactions', icon: '💳' },
  { href: '/budgets', label: 'Budgets', icon: '🎯' },
  { href: '/goals', label: 'Goals', icon: '🏆' },
  { href: '/recurring', label: 'Recurring', icon: '🔄' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mobileNav, setMobileNav] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(stored === 'dark' || (!stored && prefersDark) ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Command palette keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
      if (e.key === 'Escape') setCmdOpen(false);
      // Quick navigation: 1-6 for pages (when not in input)
      if (!cmdOpen && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        const pageMap: Record<string, string> = { '1': '/', '2': '/transactions', '3': '/budgets', '4': '/goals', '5': '/recurring', '6': '/settings' };
        if (pageMap[e.key]) {
          window.location.href = pageMap[e.key];
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cmdOpen]);

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#2563eb" />
        <title>Ledger — Personal Finance Dashboard</title>
        <meta name="description" content="Take control of your finances with Ledger. Track spending, set budgets, and reach your savings goals." />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Ledger — Personal Finance Dashboard" />
        <meta property="og:description" content="Take control of your finances. Track spending, set budgets, and reach your savings goals." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Ledger — Personal Finance Dashboard" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Ledger', description: 'Personal finance dashboard for tracking spending and savings', applicationCategory: 'FinanceApplication' }) }} />
        {/* Forge Pro verify tag — INSERT YOUR TOKEN BELOW */}
        {/* <meta name="forge-pro:verify" content="YOUR_TOKEN_HERE" /> */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var s = localStorage.getItem('theme');
            if (s === 'dark' || (!s && window.matchMedia('(prefers-color-scheme: dark)').matches))
              document.documentElement.setAttribute('data-theme', 'dark');
          })();
        `}} />
      </head>
      <body>
        <a href="#main" className="sr-only">Skip to main content</a>

        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* Sidebar */}
          <aside className="sidebar" style={{ display: mobileNav ? 'flex' : undefined }}>
            <div className="sidebar-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="var(--accent)"/><path d="M6 12h12M12 6v12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              Ledger
            </div>
            <nav className="sidebar-nav">
              {navItems.map(item => (
                <Link key={item.href} href={item.href} className={`sidebar-link ${pathname === item.href ? 'active' : ''}`} onClick={() => setMobileNav(false)}>
                  <span>{item.icon}</span> {item.label}
                </Link>
              ))}
            </nav>
            <div style={{ padding: 'var(--space-md)', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="sidebar-link" style={{ width: '100%' }}>
                {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </aside>

          {/* Main */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Top bar */}
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--space-lg)', height: '3rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 50 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <button onClick={() => setMobileNav(!mobileNav)} className="mobile-toggle" aria-label="Toggle menu" style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>☰</button>
                <button onClick={() => setCmdOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: '0.4rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', minWidth: 200 }}>
                  <span>🔍</span> Search...
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', border: '1px solid var(--border)', borderRadius: 3, padding: '0 4px' }}>⌘K</span>
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>A</div>
              </div>
            </header>

            <main id="main" style={{ flex: 1, padding: 'var(--space-lg)' }}>
              {children}
            </main>
          </div>
        </div>

        {/* Command Palette */}
        {cmdOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }} onClick={() => setCmdOpen(false)}>
            <div style={{ width: '100%', maxWidth: 500, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
              <input type="search" placeholder="Type a command or search..." autoFocus style={{ width: '100%', padding: 'var(--space-md) var(--space-lg)', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: '1rem' }} />
              <div style={{ padding: 'var(--space-sm)' }}>
                {navItems.map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setCmdOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius)', color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span>{item.icon}</span> Go to {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <style>{`
          @media (max-width: 768px) {
            .sidebar { position: fixed; left: ${mobileNav ? '0' : '-240px'}; z-index: 200; transition: left 0.2s; }
            .mobile-toggle { display: block !important; }
          }
        `}</style>
        <script dangerouslySetInnerHTML={{ __html: "window.showToast = function(m, t, d) { d = d || 3000; t = t || 'info'; var c = document.querySelector('.toast-container'); if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); } var e = document.createElement('div'); e.className = 'toast toast-' + t; e.textContent = m; e.setAttribute('role', 'alert'); c.appendChild(e); requestAnimationFrame(function() { requestAnimationFrame(function() { e.classList.add('show'); }); }); setTimeout(function() { e.classList.remove('show'); setTimeout(function() { e.remove(); }, 300); }, d); };" }} />
    </body>
    </html>
  );
}
