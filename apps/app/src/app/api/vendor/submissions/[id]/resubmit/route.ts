import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@forge-pro/db';
import { SemverSchema, type Submission } from '@forge-pro/shared-types';
import { z } from 'zod';
import { requireVendor, assertOwnsSubmission, AuthError } from '@/lib/vendor/auth';
import { SUBMISSION_SELECT } from '@/lib/vendor/queries';
import { createJobAndDispatch } from '@/lib/vendor/dispatch';
import { canTransition } from '@/lib/vendor/submission-machine';

export const runtime = 'nodejs';

const BodySchema = z.object({
  /** Optional patch-version bump for the resubmission. */
  submittedVersion: SemverSchema.optional(),
});

/**
 * POST /api/vendor/submissions/[id]/resubmit
 *
 * Only valid from qa_rejected: the vendor has re-uploaded a fixed zip and this
 * creates a fresh QA job (docs/vendor-portal.md §3, §10).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireVendor(request);
    const { id } = await params;

    const body = BodySchema.parse(await request.json().catch(() => ({})));

    const db = getSupabase();
    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database is not configured.' },
        { status: 503 },
      );
    }

    const { data: row } = await db.from('submissions').select(SUBMISSION_SELECT).eq('id', id).single();
    const submission = row as Submission | undefined;
    if (!submission) {
      return NextResponse.json({ ok: false, error: 'Submission not found.' }, { status: 404 });
    }
    assertOwnsSubmission(user, submission.vendorId);

    if (!canTransition(submission.status, { type: 'resubmit' })) {
      return NextResponse.json(
        { ok: false, error: `Cannot resubmit a submission that is ${submission.status}.` },
        { status: 409 },
      );
    }
    if (!submission.artifactSha256) {
      return NextResponse.json(
        { ok: false, error: 'Upload a fixed zip before resubmitting.' },
        { status: 409 },
      );
    }

    if (body.submittedVersion && body.submittedVersion !== submission.submittedVersion) {
      await db.from('submissions').update({ submitted_version: body.submittedVersion }).eq('id', id);
    }

    const jobId = await createJobAndDispatch(db, submission.id, submission.artifactSha256);
    await db.from('submissions').update({ status: 'submitted' }).eq('id', id);

    return NextResponse.json({ ok: true, jobId, status: 'submitted' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? 'Invalid body.' }, { status: 400 });
    }
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error('[resubmit] unexpected error', error);
    return NextResponse.json({ ok: false, error: 'Internal error.' }, { status: 500 });
  }
}
