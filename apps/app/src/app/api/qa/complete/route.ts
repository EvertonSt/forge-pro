import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@forge-pro/db';
import { QaCompletePayloadSchema } from '@forge-pro/shared-types';
import { handleQaComplete } from '@/lib/vendor/qa-complete';
import { demoDraftIdForJob, completeDemoJob } from '@/lib/vendor/demo-store';
import { isDemoMode } from '@/lib/vendor/portal-data';

export const runtime = 'nodejs';

/**
 * POST /api/qa/complete — the runner's completion callback
 * (docs/vendor-portal.md §8). Gated by a shared secret; the runner carries no
 * other app credentials.
 *
 * In demo mode the secret gate and database are skipped: the demo store
 * stands in for the runner's rows, so a simulated completion exercises the
 * same payload contract the real runner sends.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.APP_INTERNAL_SECRET;
  if (!isDemoMode()) {
    if (!secret) {
      return NextResponse.json(
        { ok: false, error: 'APP_INTERNAL_SECRET is not configured.' },
        { status: 503 },
      );
    }
    if (request.headers.get('x-forge-internal-secret') !== secret) {
      return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
    }
  }

  let payload;
  try {
    payload = QaCompletePayloadSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid payload.' }, { status: 400 });
  }

  if (isDemoMode()) {
    const submissionId = demoDraftIdForJob(payload.jobId);
    if (!submissionId) {
      return NextResponse.json({ ok: false, error: 'Unknown demo job.' }, { status: 404 });
    }
    const result = completeDemoJob(submissionId, payload.report);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 409 });
    }
    return NextResponse.json({ ok: true, processed: true, demo: true });
  }

  const db = getSupabase();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: 'Database is not configured (SUPABASE_URL missing).' },
      { status: 503 },
    );
  }

  try {
    const outcome = await handleQaComplete(db, payload.jobId, payload.report);
    return NextResponse.json({ ok: true, ...outcome });
  } catch (error) {
    console.error('[qa/complete] unexpected error', error);
    return NextResponse.json(
      { ok: false, error: 'Internal error.' },
      { status: 500 },
    );
  }
}
