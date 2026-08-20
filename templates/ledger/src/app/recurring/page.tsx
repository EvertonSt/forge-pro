'use client';
import { recurring } from '@/lib/data';

export default function Recurring() {
  const totalMonthly = recurring.filter(r => r.frequency === 'Monthly').reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.25rem' }}>Recurring Payments</h1>

      <div className="card" style={{ marginBottom: 'var(--space-lg)', display: 'flex', gap: 'var(--space-xl)' }}>
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Monthly Total</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>${totalMonthly.toFixed(2)}/mo</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Annual Estimate</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>${(totalMonthly * 12).toFixed(2)}/yr</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Active Subscriptions</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{recurring.length}</div>
        </div>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Service</th><th>Category</th><th>Amount</th><th>Frequency</th><th>Next Date</th></tr>
          </thead>
          <tbody>
            {recurring.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{r.name}</td>
                <td><span className="badge" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>{r.category}</span></td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${r.amount.toFixed(2)}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{r.frequency}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{r.nextDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
