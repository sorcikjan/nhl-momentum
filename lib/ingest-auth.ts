import { NextRequest, NextResponse } from 'next/server';

/**
 * Verifies the x-api-key header against INGEST_API_KEY env var.
 * Returns a 401/503 NextResponse if unauthorized, null if authorized.
 *
 * Usage:
 *   const authError = requireIngestAuth(req);
 *   if (authError) return authError;
 */
export function requireIngestAuth(req: NextRequest): NextResponse | null {
  const apiKey = process.env.INGEST_API_KEY;
  if (!apiKey) {
    console.error('[ingest-auth] INGEST_API_KEY is not configured');
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
  if (req.headers.get('x-api-key') !== apiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
