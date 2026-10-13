import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireIngestAuth } from '@/lib/ingest-auth';

// Snapshot retention — see supabase/migrations/014_snapshot_retention.sql.
// Called daily by the daily worker ('prune' phase).
export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const { data, error } = await supabaseAdmin.rpc('prune_player_metric_snapshots', {
    keep_days: 7,
    // Steady state is ~2k rows/day; small batches keep this inside the 26s route
    // limit. The one-off backlog is cleared from the SQL editor (see migration 014).
    max_rows: 20_000,
  });
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  return NextResponse.json({ data: { deleted: data ?? 0 }, error: null });
}
