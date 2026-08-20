'use client';
import { useEffect, useState } from 'react';
import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mobileNav, setMobileNav] = useState(false);
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

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/courses', label: 'Courses' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/instructor', label: 'Instructor' },
  ];

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#6366f1" />
        <title>Sage — Online Learning Platform</title>
        <meta name="description" content="Master new skills with expert-led courses. Sage is a modern online learning platform." />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Sage — Online Learning Platform" />
        <meta property="og:description" content="Master new skills with expert-led courses." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sage — Online Learning Platform" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Course', name: 'Sage Online Learning Platform', description: 'Master new skills with expert-led courses', provider: { '@type': 'Organization', name: 'Sage' } }) }} />
        {/* Forge Pro verify tag — INSERT YOUR TOKEN BELOW */}
        {/* <meta name="forge-pro:verify" content="YOUR_TOKEN_HERE" /> */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var stored = localStorage.getItem('theme');
            if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.setAttribute('data-theme', 'dark');
            }
          })();
        `}} />
      </head>
      <body>
        <a href="#main" className="sr-only">Skip to main content</a>

        {/* Header */}
        <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'color-mix(in srgb, var(--bg) 85%, transparent)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 'var(--max-w)', marginInline: 'auto', paddingInline: 'clamp(1rem, 3vw, 2rem)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '3.5rem' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.15rem', color: 'var(--text)', textDecoration: 'none' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="6" fill="var(--accent)"/><path d="M8 14 L12 10 L16 14 L12 18Z" fill="#fff"/><path d="M14 10 L18 14 L14 18" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Sage
            </Link>
            <nav style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center' }} className="desktop-nav">
              {navItems.map(item => (
                <Link key={item.href} href={item.href} style={{ color: pathname === item.href ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 500, textDecoration: 'none', fontSize: '0.9rem' }}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
              <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.35rem 0.5rem', cursor: 'pointer', fontSize: '1rem' }}>
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button className="mobile-menu-btn" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle menu" style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>
                {mobileNav ? '✕' : '☰'}
              </button>
            </div>
          </div>
          {mobileNav && (
            <nav style={{ padding: 'var(--space-md)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {navItems.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMobileNav(false)} style={{ color: pathname === item.href ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 500, padding: 'var(--space-sm) 0', textDecoration: 'none' }}>
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </header>

        <main id="main">{children}</main>

        <footer style={{ borderTop: '1px solid var(--border)', paddingBlock: 'var(--space-xl)', marginTop: 'var(--space-2xl)' }}>
          <div style={{ maxWidth: 'var(--max-w)', marginInline: 'auto', paddingInline: 'clamp(1rem, 3vw, 2rem)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 'var(--space-xl)' }} className="footer-grid">
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 'var(--space-sm)' }}>Sage</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '30ch' }}>Empowering lifelong learners with world-class courses from expert instructors.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Platform</h4>
              <Link href="/courses" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Browse Courses</Link>
              <Link href="/pricing" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Pricing</Link>
              <Link href="/instructor" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Become an Instructor</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Resources</h4>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Blog</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Help Center</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Community</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Legal</h4>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Privacy</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Terms</span>
            </div>
          </div>
          <div style={{ maxWidth: 'var(--max-w)', marginInline: 'auto', paddingInline: 'clamp(1rem, 3vw, 2rem)', marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} Sage. All rights reserved.
          </div>
        </footer>

        <style>{`
          @media (max-width: 768px) {
            .desktop-nav { display: none !important; }
            .mobile-menu-btn { display: block !important; }
            .footer-grid { grid-template-columns: 1fr 1fr !important; }
          }
        `}</style>
        <script dangerouslySetInnerHTML={{ __html: "window.showToast = function(m, t, d) { d = d || 3000; t = t || 'info'; var c = document.querySelector('.toast-container'); if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); } var e = document.createElement('div'); e.className = 'toast toast-' + t; e.textContent = m; e.setAttribute('role', 'alert'); c.appendChild(e); requestAnimationFrame(function() { requestAnimationFrame(function() { e.classList.add('show'); }); }); setTimeout(function() { e.classList.remove('show'); setTimeout(function() { e.remove(); }, 300); }, d); };" }} />
    </body>
    </html>
  );
}
