import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getSupabase } from '@forge-pro/db';
import { CatalogItemKindSchema } from '@forge-pro/shared-types';
import { z } from 'zod';
import { requireVendor, AuthError } from '@/lib/vendor/auth';
import { createDemoDraft } from '@/lib/vendor/demo-store';
import { isDemoMode } from '@/lib/vendor/portal-data';

export const runtime = 'nodejs';

const BodySchema = z.object({ itemType: CatalogItemKindSchema });

/**
 * POST /api/vendor/submissions — create a draft submission
 * (docs/vendor-portal.md §5). A draft is just id/vendorId/itemType/status;
 * upload, ownership proof, and submit fill the rest in.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireVendor(request);
    const body = BodySchema.parse(await request.json().catch(() => ({})));

    if (isDemoMode()) {
      const draft = createDemoDraft(body.itemType);
      return NextResponse.json({ ok: true, ...draft, demo: true });
    }

    const db = getSupabase();
    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database is not configured (SUPABASE_URL missing).' },
        { status: 503 },
      );
    }

    const id = randomUUID();
    const verificationToken = randomUUID().replace(/-/g, '').slice(0, 16);
    const { error } = await db.from('submissions').insert({
      id,
      vendor_id: user.userId,
      item_type: body.itemType,
      status: 'draft',
      verification_token: verificationToken,
      created_at: new Date().toISOString(),
    });
    if (error) {
      throw new Error(`submissions insert failed: ${error.message}`);
    }
    return NextResponse.json({ ok: true, id, verificationToken });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? 'Invalid body.' }, { status: 400 });
    }
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error('[submissions/create] unexpected error', error);
    return NextResponse.json({ ok: false, error: 'Internal error.' }, { status: 500 });
  }
}
