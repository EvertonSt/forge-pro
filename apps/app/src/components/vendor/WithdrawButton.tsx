'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function WithdrawButton({ id, small }: { id: string; small?: boolean }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch(`/api/vendor/submissions/${id}/withdraw`, { method: 'POST' });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        // Same pattern as the admin buttons: a preserved client instance must
        // not stay disabled after router.refresh().
        setWorking(false);
        router.refresh();
      } else {
        setError(body.error ?? 'Withdraw failed.');
        setWorking(false);
      }
    } catch {
      setError('Withdraw failed.');
      setWorking(false);
    }
  }

  return (
    <span>
      <button
        type="button"
        className={`vp-btn vp-btn--danger${small ? ' vp-btn--sm' : ''}`}
        onClick={onClick}
        disabled={working}
      >
        {working ? 'Withdrawing…' : 'Withdraw'}
      </button>
      {error ? (
        <span className="vp-field-error" style={{ display: 'block', marginTop: 4 }}>
          {error}
        </span>
      ) : null}
    </span>
  );
}
