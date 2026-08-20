import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@forge-pro/db';
import type { Submission } from '@forge-pro/shared-types';
import { requireVendor, assertOwnsSubmission, AuthError } from '@/lib/vendor/auth';
import { SUBMISSION_SELECT } from '@/lib/vendor/queries';
import { canTransition } from '@/lib/vendor/submission-machine';
import { getDemoDraft, withdrawDemoDraft } from '@/lib/vendor/demo-store';
import { isDemoMode } from '@/lib/vendor/portal-data';

export const runtime = 'nodejs';

/**
 * POST /api/vendor/submissions/[id]/withdraw
 *
 * Valid from draft / submitted / qa_rejected. An in-flight job is not
 * canceled — it completes and is recorded, but completion only advances
 * 'submitted' submissions, so a withdrawn submission is never clobbered
 * (docs/vendor-portal.md §3).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireVendor(request);
    const { id } = await params;

    if (isDemoMode()) {
      const draft = getDemoDraft(id);
      if (!draft) {
        return NextResponse.json({ ok: false, error: 'Submission not found.' }, { status: 404 });
      }
      assertOwnsSubmission(user, draft.submission.vendorId);
      const submission = withdrawDemoDraft(id);
      if (!submission) {
        return NextResponse.json(
          { ok: false, error: `Cannot withdraw a submission that is ${draft.submission.status}.` },
          { status: 409 },
        );
      }
      return NextResponse.json({ ok: true, status: 'withdrawn', demo: true });
    }

    const db = getSupabase();
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Database is not configured.' }, { status: 503 });
    }

    const { data: row } = await db.from('submissions').select(SUBMISSION_SELECT).eq('id', id).single();
    const submission = row as Submission | undefined;
    if (!submission) {
      return NextResponse.json({ ok: false, error: 'Submission not found.' }, { status: 404 });
    }
    assertOwnsSubmission(user, submission.vendorId);

    if (!canTransition(submission.status, { type: 'withdraw' })) {
      return NextResponse.json(
        { ok: false, error: `Cannot withdraw a submission that is ${submission.status}.` },
        { status: 409 },
      );
    }

    await db
      .from('submissions')
      .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ ok: true, status: 'withdrawn' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error('[withdraw] unexpected error', error);
    return NextResponse.json({ ok: false, error: 'Internal error.' }, { status: 500 });
  }
}
