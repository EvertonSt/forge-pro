import { NextRequest, NextResponse } from 'next/server';
import { requireVendor, AuthError } from '@/lib/vendor/auth';
import { handleZipUpload, UploadError } from '@/lib/vendor/upload';
import { ZipValidationError } from '@/lib/vendor/zip-stream';

export const runtime = 'nodejs';

/**
 * POST /api/vendor/submissions/[id]/upload
 *
 * Raw binary body (Content-Type: application/zip). Streamed through the
 * validation pipeline — server-computed SHA-256, PK magic check, 50 MB cap —
 * then stored in Supabase Storage and recorded on the submission
 * (docs/vendor-portal.md §7).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireVendor(request);
    const { id } = await params;
    if (!request.body) {
      return NextResponse.json({ ok: false, error: 'Missing request body.' }, { status: 400 });
    }
    const result = await handleZipUpload(
      request.body,
      request.headers.get('content-type'),
      id,
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ZipValidationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    if (error instanceof UploadError || error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error('[upload] unexpected error', error);
    return NextResponse.json({ ok: false, error: 'Internal error.' }, { status: 500 });
  }
}
