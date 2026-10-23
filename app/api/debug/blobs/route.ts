import { NextResponse } from 'next/server';
import { blobsHealth } from '@/lib/db-fallback';

export const dynamic = 'force-dynamic';

// Is the database fallback store (Netlify Blobs) reachable, and how fast?
// Protected by INGEST_API_KEY: GET /api/debug/blobs with header x-api-key.
export async function GET(req: Request) {
  const expected = process.env.INGEST_API_KEY ?? '';
  const given = req.headers.get('x-api-key') ?? new URL(req.url).searchParams.get('key') ?? '';
  if (!expected || given !== expected) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json(await blobsHealth());
}
