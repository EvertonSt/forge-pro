'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Demo-only control: simulates the QA runner completing the queued job.
 * Posts the same verdict shape the real runner would deliver, so the
 * completion path (store report → machine advance) is exercised for real.
 */
export function DemoSimulateButtons({ id }: { id: string }) {
  const router = useRouter();
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function simulate(verdict: 'passed' | 'rejected') {
    setWorking(verdict);
    setError(null);
    try {
      const res = await fetch(`/api/vendor/submissions/${id}/simulate-qa`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ verdict }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        router.refresh();
      } else {
        setError(body.error ?? 'Simulation failed.');
        setWorking(null);
      }
    } catch {
      setError('Simulation failed.');
      setWorking(null);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          className="vp-btn vp-btn--primary vp-btn--sm"
          disabled={working !== null}
          onClick={() => simulate('passed')}
        >
          {working === 'passed' ? 'Running…' : 'Simulate pass'}
        </button>
        <button
          type="button"
          className="vp-btn vp-btn--danger vp-btn--sm"
          disabled={working !== null}
          onClick={() => simulate('rejected')}
        >
          {working === 'rejected' ? 'Running…' : 'Simulate reject'}
        </button>
      </div>
      {error ? (
        <div className="vp-field-error" style={{ marginTop: 8 }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}
