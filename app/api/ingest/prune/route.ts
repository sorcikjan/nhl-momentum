import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireIngestAuth } from '@/lib/ingest-auth';
import { pageAll } from '@/lib/data';
import { doomedSnapshots, pruneWindow, type SnapshotKey } from '@/lib/snapshot-retention';

// Snapshot retention (lib/snapshot-retention.ts). Called daily by the daily
// worker ('prune' phase). Each run only reads the days that just left the
// 7-day window (?days=N widens it to catch up), through the calculated_at index.
// The SQL function it replaces (migration 014) re-ranked the whole history,
// ~190k rows, on every call: 17s each, sorts spilling to disk — a large share
// of the free tier's Disk IO budget, whose exhaustion took the site down on
// 2026-10-23.
export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const days = Math.min(400, Math.max(1, Number(req.nextUrl.searchParams.get('days')) || 3));
  const { from, to } = pruneWindow(new Date(), days);
  try {
    const rows = await pageAll<SnapshotKey>((f, t) => supabaseAdmin
      .from('player_metric_snapshots')
      .select('id, player_id, calculated_at')
      .gte('calculated_at', from).lt('calculated_at', to)
      .order('calculated_at').order('id')
      .range(f, t));
    const doomed = doomedSnapshots(rows);
    let deleted = 0;
    for (let i = 0; i < doomed.length; i += 500) {
      const chunk = doomed.slice(i, i + 500);
      const { error } = await supabaseAdmin.from('player_metric_snapshots').delete().in('id', chunk);
      if (error) throw error;
      deleted += chunk.length;
    }
    return NextResponse.json({ data: { deleted, scanned: rows.length, from, to }, error: null });
  } catch (err) {
    const message = (err as { message?: string })?.message ?? String(err);
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
