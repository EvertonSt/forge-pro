'use client';
import { useState } from 'react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const tabs = ['profile', 'security', 'appearance'];

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.25rem' }}>Settings</h1>

      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-sm)' }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.5rem 1rem', background: activeTab === tab ? 'var(--accent)' : 'transparent', color: activeTab === tab ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, textTransform: 'capitalize', fontSize: '0.85rem' }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="card" style={{ maxWidth: 500 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-lg)' }}>Profile Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: 'var(--space-xs)' }}>Full Name</label>
              <input type="text" defaultValue="Alex Morgan" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: 'var(--space-xs)' }}>Email</label>
              <input type="email" defaultValue="alex@example.com" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: 'var(--space-xs)' }}>Currency</label>
              <select style={{ width: '100%' }}>
                <option>USD ($)</option><option>EUR (€)</option><option>GBP (£)</option>
              </select>
            </div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Save Changes</button>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="card" style={{ maxWidth: 500 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-lg)' }}>Security</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontWeight: 500 }}>Two-Factor Authentication</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Add an extra layer of security</div></div>
              <div style={{ width: 44, height: 24, borderRadius: 12, background: 'var(--success)', cursor: 'pointer', position: 'relative' }}><div style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff' }} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontWeight: 500 }}>Login Notifications</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Get alerted on new sign-ins</div></div>
              <div style={{ width: 44, height: 24, borderRadius: 12, background: 'var(--accent)', cursor: 'pointer', position: 'relative' }}><div style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff' }} /></div>
            </div>
            <button className="btn btn-outline" style={{ alignSelf: 'flex-start' }}>Change Password</button>
          </div>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="card" style={{ maxWidth: 500 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-lg)' }}>Appearance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontWeight: 500 }}>Dark Mode</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Switch between light and dark themes</div></div>
              <div style={{ width: 44, height: 24, borderRadius: 12, background: document.documentElement.getAttribute('data-theme') === 'dark' ? 'var(--accent)' : 'var(--border)', cursor: 'pointer', position: 'relative' }} onClick={() => { const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', next); localStorage.setItem('theme', next); }}><div style={{ position: 'absolute', top: 2, left: document.documentElement.getAttribute('data-theme') === 'dark' ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
