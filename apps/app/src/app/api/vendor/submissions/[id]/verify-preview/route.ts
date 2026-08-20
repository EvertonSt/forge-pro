import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@forge-pro/db';
import { z } from 'zod';
import { requireVendor, assertOwnsSubmission, AuthError } from '@/lib/vendor/auth';
import { SUBMISSION_SELECT } from '@/lib/vendor/queries';
import { verifyPreviewUrl } from '@/lib/vendor/preview-verify';
import { getDemoDraft, setVerified } from '@/lib/vendor/demo-store';
import { isDemoMode } from '@/lib/vendor/portal-data';

export const runtime = 'nodejs';

const BodySchema = z.object({ previewUrl: z.string().url() });

/**
 * POST /api/vendor/submissions/[id]/verify-preview
 * (docs/vendor-portal.md §6) — prove control of the preview URL by checking
 * for the per-submission meta-tag token. The fetch + SSRF guard are fully
 * real in both modes; only the persistence differs (demo store vs. row).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireVendor(request);
    const { id } = await params;
    const { previewUrl } = BodySchema.parse(await request.json().catch(() => ({})));

    if (isDemoMode()) {
      const draft = getDemoDraft(id);
      if (!draft) {
        return NextResponse.json({ ok: false, error: 'Submission not found.' }, { status: 404 });
      }
      assertOwnsSubmission(user, draft.submission.vendorId);
      const result = await verifyPreviewUrl(previewUrl, draft.submission.verificationToken ?? '', {
        allowLoopback: true,
      });
      if (result.ok) {
        setVerified(id, previewUrl);
      }
      return NextResponse.json({ ok: result.ok, reason: result.reason, message: result.message });
    }

    const db = getSupabase();
    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database is not configured (SUPABASE_URL missing).' },
        { status: 503 },
      );
    }
    const { data: row } = await db.from('submissions').select(SUBMISSION_SELECT).eq('id', id).single();
    if (!row) {
      return NextResponse.json({ ok: false, error: 'Submission not found.' }, { status: 404 });
    }
    assertOwnsSubmission(user, String(row.vendorId));
    const token = String(row.verificationToken ?? '');
    const result = await verifyPreviewUrl(previewUrl, token, { allowLoopback: isDemoMode() });
    if (result.ok) {
      await db.from('submissions').update({ preview_url: previewUrl }).eq('id', id);
    }
    return NextResponse.json({ ok: result.ok, reason: result.reason, message: result.message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? 'Invalid body.' }, { status: 400 });
    }
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error('[verify-preview] unexpected error', error);
    return NextResponse.json({ ok: false, error: 'Internal error.' }, { status: 500 });
  }
}
