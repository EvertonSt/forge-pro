'use client';
import { goals } from '@/lib/data';

export default function Goals() {
  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.25rem' }}>Savings Goals</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
        {goals.map(g => {
          const pct = Math.round((g.current / g.target) * 100);
          const remaining = g.target - g.current;
          return (
            <div key={g.name} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <h3 style={{ fontSize: '1rem' }}>{g.name}</h3>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)' }}>{pct}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                <span style={{ fontFamily: 'var(--font-mono)' }}>${g.current.toLocaleString()}</span>
                <span>of ${g.target.toLocaleString()}</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden', marginBottom: 'var(--space-md)' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: g.color, borderRadius: 4, transition: 'width 0.5s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>${remaining.toLocaleString()} remaining</span>
                <span>~{Math.ceil(remaining / 500)} months at $500/mo</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
