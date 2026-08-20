import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/vendor/auth';
import { getAdminSubmission } from '@/lib/vendor/admin-data';
import { unpublishDemoSubmission } from '@/lib/vendor/demo-store';
import { isDemoMode } from '@/lib/vendor/portal-data';
import { createSanityClient } from '@forge-pro/cms/client';

export const runtime = 'nodejs';

/**
 * POST /api/admin/submissions/[id]/unpublish (docs/vendor-portal.md §3, §4).
 *
 * Per the state machine: reverts the Sanity document's `published` to false.
 * The submission row stays `published` (history) and the badge stays in the
 * report history — unpublish is additive, never destructive. Idempotent:
 * patching published=false again is harmless.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const submission = await getAdminSubmission(id);
    if (!submission) {
      return NextResponse.json({ ok: false, error: 'Submission not found.' }, { status: 404 });
    }

    if (isDemoMode()) {
      if (submission.status !== 'published') {
        return NextResponse.json(
          { ok: false, error: 'Only published submissions can be unpublished.' },
          { status: 409 },
        );
      }
      unpublishDemoSubmission(id);
      return NextResponse.json({ ok: true, unpublished: true, demo: true });
    }

    if (!submission.itemSanityId) {
      return NextResponse.json(
        { ok: false, error: 'Submission has no Sanity item — nothing to unpublish.' },
        { status: 409 },
      );
    }
    const sanity = createSanityClient();
    if (!sanity) {
      return NextResponse.json(
        { ok: false, error: 'Sanity is not configured (SANITY_PROJECT_ID missing).' },
        { status: 503 },
      );
    }
    await sanity.patch(submission.itemSanityId).set({ published: false }).commit();
    return NextResponse.json({ ok: true, unpublished: true, sanityId: submission.itemSanityId });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error('[admin/unpublish] unexpected error', error);
    return NextResponse.json({ ok: false, error: 'Internal error.' }, { status: 500 });
  }
}
