'use client';

import { useState } from 'react';

/* Settings page — profile, notifications, security */
const tabs = ['Profile', 'Notifications', 'Security', 'API Keys'];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: '48rem' }}>
      <div className="content__header">
        <div>
          <h1 className="content__title">Settings</h1>
          <p className="content__subtitle">Manage your account preferences and configuration.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 1rem', fontSize: '0.8125rem', fontWeight: 600,
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all 0.15s var(--ease)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Profile' && (
        <div className="card animate-in">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Profile Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>First Name</label>
              <input className="input" defaultValue="Jane" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>Last Name</label>
              <input className="input" defaultValue="Doe" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>Email</label>
              <input className="input" type="email" defaultValue="jane@company.com" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>Company</label>
              <input className="input" defaultValue="Acme Inc." />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>Role</label>
              <select className="input">
                <option>Admin</option>
                <option>Editor</option>
                <option>Viewer</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn--secondary">Cancel</button>
            <button className="btn btn--primary" onClick={handleSave}>
              {saved ? '✓ Saved' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'Notifications' && (
        <div className="card animate-in">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Notification Preferences</h3>
          {[
            { label: 'Email notifications for new orders', default: true },
            { label: 'Weekly analytics digest', default: true },
            { label: 'Product updates and announcements', default: false },
            { label: 'Security alerts', default: true },
            { label: 'Team activity notifications', default: false },
          ].map(item => (
            <label key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem', cursor: 'pointer' }}>
              {item.label}
              <input type="checkbox" defaultChecked={item.default} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
            </label>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="btn btn--primary" onClick={handleSave}>{saved ? '✓ Saved' : 'Save Preferences'}</button>
          </div>
        </div>
      )}

      {activeTab === 'Security' && (
        <div className="card animate-in">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Security Settings</h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Change Password</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '24rem' }}>
              <input className="input" type="password" placeholder="Current password" />
              <input className="input" type="password" placeholder="New password" />
              <input className="input" type="password" placeholder="Confirm new password" />
            </div>
          </div>
          <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Two-Factor Authentication</h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Add an extra layer of security to your account.
            </p>
            <button className="btn btn--secondary">Enable 2FA</button>
          </div>
        </div>
      )}

      {activeTab === 'API Keys' && (
        <div className="card animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>API Keys</h3>
            <button className="btn btn--primary btn--sm">Generate New Key</button>
          </div>
          {[
            { name: 'Production Key', key: 'sk_live_...3f8a', created: '2026-01-01', lastUsed: '2 hours ago' },
            { name: 'Development Key', key: 'sk_test_...9b2c', created: '2025-12-15', lastUsed: '5 min ago' },
          ].map(k => (
            <div key={k.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{k.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{k.key}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <div>Created {k.created}</div>
                <div>Last used {k.lastUsed}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
