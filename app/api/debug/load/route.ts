import { NextResponse } from 'next/server';
import { loadReport, takeLoadSnapshot } from '@/lib/load-log';

export const dynamic = 'force-dynamic';

// Database load, hour by hour (lib/load-log.ts). Protected by INGEST_API_KEY.
// GET ?hours=24: the report. POST: take this hour's snapshot (the hourly
// load-snapshot function calls it).
function authorized(req: Request) {
  const expected = process.env.INGEST_API_KEY ?? '';
  const given = req.headers.get('x-api-key') ?? new URL(req.url).searchParams.get('key') ?? '';
  return !!expected && given === expected;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const hours = Math.min(168, Math.max(1, Number(new URL(req.url).searchParams.get('hours')) || 24));
  return NextResponse.json(await loadReport(hours));
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const snap = await takeLoadSnapshot();
  return NextResponse.json({ at: new Date(snap.at).toISOString(), metrics: !!snap.metrics, queries: snap.queries?.length ?? 0, errors: snap.errors });
}
