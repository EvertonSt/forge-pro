'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SemverSchema } from '@forge-pro/shared-types';

export function ResubmitForm({ id, currentVersion }: { id: string; currentVersion: string | null }) {
  const router = useRouter();
  const [version, setVersion] = useState(currentVersion ?? '1.0.1');
  const [versionError, setVersionError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    const parsed = SemverSchema.safeParse(version);
    if (!parsed.success) {
      setVersionError('Version must be x.y.z');
      return;
    }
    setVersionError(null);
    setWorking(true);
    setError(null);
    try {
      const res = await fetch(`/api/vendor/submissions/${id}/resubmit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ submittedVersion: version }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        router.refresh();
      } else {
        setError(body.error ?? 'Resubmit failed.');
        setWorking(false);
      }
    } catch {
      setError('Resubmit failed.');
      setWorking(false);
    }
  }

  return (
    <div className="vp-form">
      <div className="vp-field">
        <label className="vp-label">Version bump (optional)</label>
        <input
          className={`vp-input${versionError ? ' vp-input--error' : ''}`}
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          style={{ width: 180 }}
        />
        <span className="vp-hint">
          Bump the patch version for this fix. The re-uploaded zip is submitted through the upload route (Session
          4), then this starts a fresh QA run against the same baseline.
        </span>
        {versionError ? <span className="vp-field-error">{versionError}</span> : null}
      </div>
      <div>
        <button type="button" className="vp-btn vp-btn--primary" onClick={onSubmit} disabled={working}>
          {working ? 'Resubmitting…' : 'Resubmit for QA'}
        </button>
        {error ? <div className="vp-field-error" style={{ marginTop: 8 }}>{error}</div> : null}
      </div>
    </div>
  );
}
