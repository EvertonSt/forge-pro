import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@forge-pro/db';
import { SubmitSubmissionSchema, type Submission } from '@forge-pro/shared-types';
import { z } from 'zod';
import { requireVendor, assertOwnsSubmission, AuthError } from '@/lib/vendor/auth';
import { SUBMISSION_SELECT } from '@/lib/vendor/queries';
import { canTransition } from '@/lib/vendor/submission-machine';
import { createJobAndDispatch } from '@/lib/vendor/dispatch';
import { getDemoDraft, setZip, submitDemoDraft } from '@/lib/vendor/demo-store';
import { isDemoMode } from '@/lib/vendor/portal-data';

export const runtime = 'nodejs';

/**
 * The client's form runs its own client-side zip checks, but in demo mode
 * there is no storage/upload route, so the client reports file metadata for
 * the demo store. In real mode the zip field is ignored — the authoritative
 * artifact hash comes from the server-side upload route (zip-stream.ts).
 */
const BodySchema = SubmitSubmissionSchema.extend({
  zip: z
    .object({
      name: z.string().min(1),
      sizeBytes: z.number().int().positive(),
      clientSha256: z.string().nullable().default(null),
    })
    .optional(),
});

/**
 * POST /api/vendor/submissions/[id]/submit
 * (docs/vendor-portal.md §5–§8) — the authoritative submit boundary. The
 * client's 3-step form validates per step, but this route re-validates the
 * complete payload with SubmitSubmissionSchema and enforces the server-side
 * state checks: draft-only, zip uploaded (artifact hash present), preview URL
 * ownership proven. On success a queued qa_jobs row is created and dispatched.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireVendor(request);
    const { id } = await params;
    const body = BodySchema.parse(await request.json().catch(() => ({})));
    const { zip: zipMeta, ...payload } = body;

    if (isDemoMode()) {
      const draft = getDemoDraft(id);
      if (!draft) {
        return NextResponse.json({ ok: false, error: 'Submission not found.' }, { status: 404 });
      }
      assertOwnsSubmission(user, draft.submission.vendorId);
      if (!canTransition(draft.submission.status, { type: 'submit' })) {
        return NextResponse.json(
          { ok: false, error: `Cannot submit a submission that is ${draft.submission.status}.` },
          { status: 409 },
        );
      }
      if (zipMeta) {
        setZip(id, zipMeta);
      }
      if (!getDemoDraft(id)?.zip) {
        return NextResponse.json({ ok: false, error: 'Upload the template zip before submitting.' }, { status: 409 });
      }
      if (!getDemoDraft(id)?.verifiedPreviewUrl) {
        return NextResponse.json(
          { ok: false, error: 'Verify the preview URL before submitting.' },
          { status: 409 },
        );
      }
      const submission = submitDemoDraft(id, payload);
      if (!submission) {
        return NextResponse.json({ ok: false, error: 'Submission is not a draft.' }, { status: 409 });
      }
      return NextResponse.json({ ok: true, id, status: 'submitted', demo: true });
    }

    const db = getSupabase();
    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database is not configured (SUPABASE_URL missing).' },
        { status: 503 },
      );
    }

    const { data: row } = await db.from('submissions').select(SUBMISSION_SELECT).eq('id', id).single();
    const submission = row as Submission | undefined;
    if (!submission) {
      return NextResponse.json({ ok: false, error: 'Submission not found.' }, { status: 404 });
    }
    assertOwnsSubmission(user, submission.vendorId);

    if (!canTransition(submission.status, { type: 'submit' })) {
      return NextResponse.json(
        { ok: false, error: `Cannot submit a submission that is ${submission.status}.` },
        { status: 409 },
      );
    }
    if (!submission.artifactSha256) {
      return NextResponse.json({ ok: false, error: 'Upload the template zip before submitting.' }, { status: 409 });
    }
    if (!submission.verificationToken || !submission.previewUrl) {
      return NextResponse.json({ ok: false, error: 'Verify the preview URL before submitting.' }, { status: 409 });
    }

    await db
      .from('submissions')
      .update({
        item_type: payload.itemType,
        title: payload.title,
        description: payload.description,
        preview_url: payload.previewUrl,
        framework: payload.framework,
        stack: payload.stack,
        category: payload.category,
        component_type: payload.componentType,
        price_cents: payload.priceCents,
        currency: payload.currency,
        screenshots: payload.screenshots,
        submitted_version: payload.submittedVersion,
        status: 'submitted',
      })
      .eq('id', id);

    const jobId = await createJobAndDispatch(db, submission.id, submission.artifactSha256);
    return NextResponse.json({ ok: true, id, jobId, status: 'submitted' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Validation failed.',
          issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        },
        { status: 400 },
      );
    }
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error('[submit] unexpected error', error);
    return NextResponse.json({ ok: false, error: 'Internal error.' }, { status: 500 });
  }
}
