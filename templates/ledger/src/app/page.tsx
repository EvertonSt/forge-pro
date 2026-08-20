'use client';
import { accounts, netWorthHistory, transactions } from '@/lib/data';

function NetWorthChart() {
  const values = netWorthHistory.map(h => h.value);
  const min = Math.min(...values) * 0.98;
  const max = Math.max(...values) * 1.02;
  const w = 600, h = 200, pad = 10;
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / (max - min)) * (h - pad * 2);
    return `${x},${y}`;
  });
  const areaPoints = [...points, `${w - pad},${h - pad}`, `${pad},${h - pad}`];
  const lastVal = values[values.length - 1];
  const prevVal = values[values.length - 2];
  const change = ((lastVal - prevVal) / prevVal * 100).toFixed(1);
  const isUp = lastVal >= prevVal;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 'var(--space-xs)' }}>Net Worth</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>${lastVal.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={`badge ${isUp ? 'badge-success' : 'badge-danger'}`}>
            {isUp ? '↑' : '↓'} {change}%
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 'var(--space-xs)' }}>vs last month</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints.join(' ')} fill="url(#chartGrad)" />
        <polyline points={points.join(' ')} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {netWorthHistory.map((entry, i) => {
          const x = pad + (i / (values.length - 1)) * (w - pad * 2);
          const yVal = pad + (1 - (entry.value - min) / (max - min)) * (h - pad * 2);
          return <text key={i} x={x} y={yVal - 8} textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-sans)">{entry.month}</text>;
        })}
      </svg>
    </div>
  );
}

function ProgressRing({ progress, size = 48 }: { progress: number; size?: number }) {
  const sw = 4, r = (size - sw) / 2, c = 2 * Math.PI * r;
  const color = progress > 100 ? 'var(--danger)' : 'var(--accent)';
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={c} strokeDashoffset={c - (Math.min(progress, 100) / 100) * c} strokeLinecap="round" />
    </svg>
  );
}

export default function Overview() {
  const netWorth = accounts.reduce((s, a) => s + a.balance, 0);
  const monthlyIncome = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.25rem' }}>Overview</h1>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <div className="card">
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 'var(--space-xs)' }}>Net Worth</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 'var(--space-xs)' }}>Monthly Income</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>+${monthlyIncome.toLocaleString()}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 'var(--space-xs)' }}>Monthly Expenses</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>-${monthlyExpenses.toLocaleString()}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 'var(--space-xs)' }}>Savings Rate</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{((1 - monthlyExpenses / monthlyIncome) * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* Chart */}
      <NetWorthChart />

      {/* Accounts */}
      <div style={{ marginTop: 'var(--space-lg)' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>Accounts</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-md)' }}>
          {accounts.map(acc => (
            <div key={acc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: acc.color, opacity: 0.15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: acc.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{acc.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{acc.bank}</div>
              </div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: acc.balance < 0 ? 'var(--danger)' : 'var(--text)' }}>
                ${Math.abs(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ marginTop: 'var(--space-lg)' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>Recent Transactions</h2>
        <div className="card table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Category</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
            </thead>
            <tbody>
              {transactions.slice(0, 8).map(t => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--text-secondary)' }}>{t.date}</td>
                  <td style={{ fontWeight: 500 }}>{t.description}</td>
                  <td><span className="badge" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>{t.category}</span></td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: t.amount < 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
