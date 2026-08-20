import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** Reports service health and which env-gated integrations are live. */
export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'forge-pro-app',
    integrations: {
      supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      sanity: Boolean(process.env.SANITY_PROJECT_ID),
    },
    timestamp: new Date().toISOString(),
  });
}
