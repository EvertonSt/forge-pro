import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@forge-pro/db';
import { requireAdmin, AuthError } from '@/lib/vendor/auth';
import { approveDemoApplication } from '@/lib/vendor/demo-store';
import { isDemoMode } from '@/lib/vendor/portal-data';

export const runtime = 'nodejs';

/**
 * POST /api/admin/vendors/[id]/approve (docs/vendor-portal.md §2, §4).
 * Idempotent: approving an already-approved application just refreshes the
 * timestamp and re-asserts the role.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    if (isDemoMode()) {
      const app = approveDemoApplication(id);
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
    const now = new Date().toISOString();
    await db.from('vendor_profiles').update({ approved_at: now }).eq('id', id);
    await db.from('profiles').update({ role: 'vendor' }).eq('id', row.user_id);
    return NextResponse.json({ ok: true, approvedAt: now });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error('[admin/approve] unexpected error', error);
    return NextResponse.json({ ok: false, error: 'Internal error.' }, { status: 500 });
  }
}
