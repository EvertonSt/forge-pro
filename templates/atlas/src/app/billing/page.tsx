'use client';

import { useState } from 'react';

/* Billing page — plan cards, payment method, invoices */
const plans = [
  {
    name: 'Starter',
    price: 29,
    features: ['5 team members', '100 deploys/mo', 'Basic analytics', 'Email support'],
    current: false,
  },
  {
    name: 'Pro',
    price: 79,
    features: ['20 team members', 'Unlimited deploys', 'Advanced analytics', 'Priority support', 'Custom domains'],
    current: true,
  },
  {
    name: 'Enterprise',
    price: 199,
    features: ['Unlimited members', 'Everything in Pro', 'SSO & SAML', 'Dedicated support', 'SLA guarantee', 'Custom contracts'],
    current: false,
  },
];

const invoices = [
  { id: 'INV-2026-001', date: '2026-01-01', amount: '$79.00', status: 'paid' },
  { id: 'INV-2025-012', date: '2025-12-01', amount: '$79.00', status: 'paid' },
  { id: 'INV-2025-011', date: '2025-11-01', amount: '$79.00', status: 'paid' },
  { id: 'INV-2025-010', date: '2025-10-01', amount: '$29.00', status: 'paid' },
  { id: 'INV-2025-009', date: '2025-09-01', amount: '$29.00', status: 'overdue' },
];

export default function Billing() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div>
      <div className="content__header">
        <div>
          <h1 className="content__title">Billing</h1>
          <p className="content__subtitle">Manage your subscription and payment details.</p>
        </div>
      </div>

      {/* Current plan */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--accent-light)', borderColor: 'var(--accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Current Plan</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Pro — $79/month</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Your next billing date is February 1, 2026</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn--secondary btn--sm">View Invoices</button>
            <button className="btn btn--ghost btn--sm" style={{ color: 'var(--danger)' }}>Cancel Plan</button>
          </div>
        </div>
      </div>

      {/* Plan comparison */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Plans</h2>
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-tertiary)', padding: '3px', borderRadius: '999px' }}>
            <button onClick={() => setBillingPeriod('monthly')} style={{ padding: '0.375rem 1rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 600, background: billingPeriod === 'monthly' ? 'var(--bg)' : 'transparent', boxShadow: billingPeriod === 'monthly' ? 'var(--shadow-xs)' : 'none', transition: 'all 0.15s' }}>Monthly</button>
            <button onClick={() => setBillingPeriod('annual')} style={{ padding: '0.375rem 1rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 600, background: billingPeriod === 'annual' ? 'var(--bg)' : 'transparent', boxShadow: billingPeriod === 'annual' ? 'var(--shadow-xs)' : 'none', transition: 'all 0.15s' }}>
              Annual <span style={{ fontSize: '0.6875rem', color: 'var(--success)', fontWeight: 700 }}>-17%</span>
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {plans.map(plan => {
            const price = billingPeriod === 'annual' ? Math.round(plan.price * 0.83) : plan.price;
            return (
              <div key={plan.name} className="card" style={{ position: 'relative', borderColor: plan.current ? 'var(--accent)' : undefined }}>
                {plan.current && <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', fontSize: '0.6875rem', fontWeight: 700, padding: '2px 12px', borderRadius: '999px' }}>Current Plan</div>}
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{plan.name}</h3>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>
                  ${price}<span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/mo</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.25rem' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0', fontSize: '0.8125rem' }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round"><polyline points="3,8 7,12 13,4"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`btn ${plan.current ? 'btn--secondary' : 'btn--primary'}`} style={{ width: '100%' }} disabled={plan.current}>
                  {plan.current ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment method */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Payment Method</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '32px', background: 'linear-gradient(135deg, #1a1f71, #b21f1f)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.625rem', fontWeight: 700 }}>VISA</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Visa ending in 4242</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Expires 12/2028</div>
            </div>
          </div>
          <button className="btn btn--ghost btn--sm">Edit</button>
        </div>
      </div>

      {/* Invoice history */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Invoice History</h3>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{inv.id}</td>
                  <td>{inv.date}</td>
                  <td style={{ fontWeight: 600 }}>{inv.amount}</td>
                  <td>
                    <span className={`badge badge--${inv.status === 'paid' ? 'success' : 'danger'}`}>
                      <span className="badge__dot" />
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </td>
                  <td><button className="btn btn--ghost btn--sm">Download</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
