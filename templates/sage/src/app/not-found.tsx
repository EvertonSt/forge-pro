'use client';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'var(--space-2xl)' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(6rem, 4rem + 8vw, 12rem)', fontWeight: 700, color: 'var(--accent)', opacity: 0.2, lineHeight: 1, marginBottom: 'var(--space-md)' }}>404</div>
        <h1 style={{ marginBottom: 'var(--space-sm)' }}>Page Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>The page you&apos;re looking for doesn&apos;t exist.</p>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
          <Link href="/" className="btn btn-primary">Go to Dashboard</Link>
          <Link href="/courses" className="btn btn-outline">Browse Courses</Link>
        </div>
      </div>
    </div>
  );
}
