import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@forge-pro/db';
import { requireAdmin, AuthError } from '@/lib/vendor/auth';
import { revokeDemoApplication } from '@/lib/vendor/demo-store';
import { isDemoMode } from '@/lib/vendor/portal-data';

export const runtime = 'nodejs';

/**
 * POST /api/admin/vendors/[id]/revoke (docs/vendor-portal.md §2, §4).
 * Reverts the role to buyer and clears approved_at — the vendor's listings
 * stay visible to admins, and the vendor can re-apply. Idempotent.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    if (isDemoMode()) {
      const app = revokeDemoApplication(id);
      if (!app) {
        return NextResponse.json({ ok: false, error: 'Application not found.' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, approvedAt: app.approvedAt, demo: true });
    }

    const db = getSupabase();
    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database is not configured (SUPABASE_URL missing).' },
        { status: 503 },
      );
    }
    const { data: row, error } = await db
      .from('vendor_profiles')
      .select('id, user_id')
      .eq('id', id)
      .single();
    if (error || !row) {
      return NextResponse.json({ ok: false, error: 'Application not found.' }, { status: 404 });
    }
    await db.from('vendor_profiles').update({ approved_at: null }).eq('id', id);
    await db.from('profiles').update({ role: 'buyer' }).eq('id', row.user_id);
    return NextResponse.json({ ok: true, approvedAt: null });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error('[admin/revoke] unexpected error', error);
    return NextResponse.json({ ok: false, error: 'Internal error.' }, { status: 500 });
  }
}
