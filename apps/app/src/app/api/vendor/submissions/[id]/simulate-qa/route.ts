import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireVendor, assertOwnsSubmission, AuthError } from '@/lib/vendor/auth';
import { getDemoDraft, completeDemoJob } from '@/lib/vendor/demo-store';
import { buildDemoReport } from '@/lib/vendor/demo-report';
import { isDemoMode } from '@/lib/vendor/portal-data';

export const runtime = 'nodejs';

const BodySchema = z.object({ verdict: z.enum(['passed', 'rejected']) });

/**
 * POST /api/vendor/submissions/[id]/simulate-qa — DEMO MODE ONLY.
 *
 * Stands in for the real runner: builds a simulated report for the queued
 * demo job and runs it through the same completion semantics the real
 * `/api/qa/complete` uses (store report → advance via the state machine).
 * Refuses in real mode — real completions come from the runner.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isDemoMode()) {
      return NextResponse.json(
        { ok: false, error: 'simulate-qa is a demo-mode-only endpoint.' },
        { status: 404 },
      );
    }
    const user = await requireVendor(request);
    const { id } = await params;
    const { verdict } = BodySchema.parse(await request.json().catch(() => ({})));

    const draft = getDemoDraft(id);
    if (!draft) {
      return NextResponse.json({ ok: false, error: 'Submission not found.' }, { status: 404 });
    }
    assertOwnsSubmission(user, draft.submission.vendorId);

    if (draft.submission.status !== 'submitted' || draft.job?.status !== 'queued') {
      return NextResponse.json(
        {
          ok: false,
          error: `Cannot simulate completion — submission is ${draft.submission.status} with job ${draft.job?.status ?? 'none'}.`,
        },
        { status: 409 },
      );
    }

    const report = buildDemoReport(draft.submission, verdict);
    const result = completeDemoJob(id, report);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 409 });
    }
    // Re-read: completion wrote a fresh store object.
    const after = getDemoDraft(id);
    return NextResponse.json({ ok: true, status: after?.submission.status, demo: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? 'Invalid body.' }, { status: 400 });
    }
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error('[simulate-qa] unexpected error', error);
    return NextResponse.json({ ok: false, error: 'Internal error.' }, { status: 500 });
  }
}
