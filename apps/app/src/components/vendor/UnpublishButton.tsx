'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function UnpublishButton({ id }: { id: string }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${id}/unpublish`, { method: 'POST' });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        // Clear working even though the row usually unmounts this button — a
        // preserved client instance (router.refresh) must not stay disabled.
        setWorking(false);
        router.refresh();
      } else {
        setError(body.error ?? 'Unpublish failed.');
        setWorking(false);
      }
    } catch {
      setError('Unpublish failed.');
      setWorking(false);
    }
  }

  return (
    <span>
      {confirming ? (
        <span className="vp-inline-confirm">
          <button
            type="button"
            className="vp-btn vp-btn--danger vp-btn--sm"
            disabled={working}
            onClick={onClick}
          >
            {working ? 'Unpublishing…' : 'Confirm'}
          </button>
          <button
            type="button"
            className="vp-btn vp-btn--ghost vp-btn--sm"
            disabled={working}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          type="button"
          className="vp-btn vp-btn--danger vp-btn--sm"
          disabled={working}
          onClick={() => setConfirming(true)}
        >
          Unpublish
        </button>
      )}
      {error ? (
        <span className="vp-field-error" style={{ display: 'block', marginTop: 4 }}>
          {error}
        </span>
      ) : null}
    </span>
  );
}
