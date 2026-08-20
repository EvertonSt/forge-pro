'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminVendorActionButtons({ id, approved }: { id: string; approved: boolean }) {
  const router = useRouter();
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: 'approve' | 'revoke') {
    setWorking(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/vendors/${id}/${action}`, { method: 'POST' });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        // router.refresh() preserves this client instance (same position in
        // the tree, new props), so working must be cleared here or the
        // flipped button renders disabled forever.
        setWorking(null);
        router.refresh();
      } else {
        setError(body.error ?? 'Action failed.');
        setWorking(null);
      }
    } catch {
      setError('Action failed.');
      setWorking(null);
    }
  }

  return (
    <span>
      {approved ? (
        <button
          type="button"
          className="vp-btn vp-btn--danger vp-btn--sm"
          disabled={working !== null}
          onClick={() => act('revoke')}
        >
          {working === 'revoke' ? 'Revoking…' : 'Revoke'}
        </button>
      ) : (
        <button
          type="button"
          className="vp-btn vp-btn--primary vp-btn--sm"
          disabled={working !== null}
          onClick={() => act('approve')}
        >
          {working === 'approve' ? 'Approving…' : 'Approve'}
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
