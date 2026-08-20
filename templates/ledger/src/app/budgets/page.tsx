'use client';
import { budgets } from '@/lib/data';

function ProgressRing({ progress, size = 64 }: { progress: number; size?: number }) {
  const sw = 5, r = (size - sw) / 2, c = 2 * Math.PI * r;
  const color = progress > 100 ? 'var(--danger)' : progress > 80 ? 'var(--warning)' : 'var(--accent)';
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={c} strokeDashoffset={c - (Math.min(progress, 100) / 100) * c} strokeLinecap="round" />
    </svg>
  );
}

export default function Budgets() {
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalBudget = budgets.reduce((s, b) => s + b.budget, 0);

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.25rem' }}>Budgets</h1>

      <div className="card" style={{ marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Total Spent This Month</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>${totalSpent.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Budget Remaining</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: totalBudget - totalSpent < 0 ? 'var(--danger)' : 'var(--success)' }}>
            ${Math.abs(totalBudget - totalSpent).toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
        {budgets.map(b => {
          const pct = Math.round((b.spent / b.budget) * 100);
          const over = b.spent > b.budget;
          return (
            <div key={b.category} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
              <ProgressRing progress={pct} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 'var(--space-xs)' }}>{b.category}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 'var(--space-xs)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>${b.spent}</span>
                  <span style={{ color: 'var(--text-muted)' }}>/ ${b.budget}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: over ? 'var(--danger)' : b.color, borderRadius: 2 }} />
                </div>
                {over && <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 'var(--space-xs)' }}>Over budget by ${(b.spent - b.budget).toFixed(2)}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
