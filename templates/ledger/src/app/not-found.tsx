'use client';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(5rem, 3rem + 8vw, 10rem)', fontWeight: 700, color: 'var(--accent)', opacity: 0.2, lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-sm)' }}>Page Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>This page doesn&apos;t exist in your financial dashboard.</p>
        <Link href="/" className="btn btn-primary">Back to Overview</Link>
      </div>
    </div>
  );
}
