'use client';
import { useState } from 'react';

const plans = [
  {
    name: 'Free',
    price: 0,
    period: '',
    description: 'Get started with limited access',
    features: ['5 free courses', 'Community forums', 'Basic progress tracking', 'Email support'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: 29,
    period: '/month',
    description: 'Unlimited access to everything',
    features: ['Unlimited courses', 'Downloadable resources', 'Certificates of completion', 'Priority support', 'Offline access', 'Advanced analytics'],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Team',
    price: 79,
    period: '/month',
    description: 'For organizations and teams',
    features: ['Everything in Pro', 'Up to 25 seats', 'Team dashboard', 'Admin controls', 'SSO integration', 'Custom learning paths', 'Dedicated account manager'],
    cta: 'Contact Sales',
    popular: false,
  },
];

const faqs = [
  { q: 'Can I switch plans anytime?', a: 'Yes. Upgrade, downgrade, or cancel at any time. No long-term contracts.' },
  { q: 'Is there a free trial?', a: 'Pro includes a 14-day free trial. No credit card required to start.' },
  { q: 'Do I get certificates?', a: 'Pro and Team plans include certificates of completion for every course.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and wire transfers for Team plans.' },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ maxWidth: 'var(--max-w)', marginInline: 'auto', paddingInline: 'clamp(1rem, 3vw, 2rem)', paddingBlock: 'var(--space-2xl)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
        <h1 style={{ marginBottom: 'var(--space-sm)' }}>Simple, transparent pricing</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: 'var(--space-lg)' }}>Start free. Upgrade when you&apos;re ready.</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)' }}>
          <span style={{ color: !annual ? 'var(--text)' : 'var(--text-secondary)', fontSize: '0.9rem' }}>Monthly</span>
          <button onClick={() => setAnnual(!annual)} style={{ width: 48, height: 26, borderRadius: 13, background: annual ? 'var(--accent)' : 'var(--border)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }} aria-label="Toggle annual billing">
            <span style={{ position: 'absolute', top: 3, left: annual ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </button>
          <span style={{ color: annual ? 'var(--text)' : 'var(--text-secondary)', fontSize: '0.9rem' }}>Annual <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.8rem' }}>-20%</span></span>
        </div>
      </div>

      {/* Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
        {plans.map(plan => (
          <div key={plan.name} className="card" style={{ position: 'relative', border: plan.popular ? '2px solid var(--accent)' : undefined }}>
            {plan.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', padding: '0.2rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>Most Popular</div>}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <h3 style={{ marginBottom: 'var(--space-xs)' }}>{plan.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 'var(--space-md)' }}>{plan.description}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15em' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>${annual && plan.price > 0 ? Math.round(plan.price * 0.8) : plan.price}</span>
                {plan.period && <span style={{ color: 'var(--text-secondary)' }}>{plan.period}</span>}
              </div>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
              {plan.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--success)' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'center' }}>{plan.cta}</button>
          </div>
        ))}
      </div>

      {/* FAQs */}
      <section style={{ maxWidth: 680, marginInline: 'auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {faqs.map((faq, i) => (
            <div key={i} className="card" style={{ padding: 0 }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md) var(--space-lg)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem', textAlign: 'left' }}>
                {faq.q}
                <span style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>▼</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 var(--space-lg) var(--space-lg)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
