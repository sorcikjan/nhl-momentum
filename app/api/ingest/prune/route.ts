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
    // Steady state is a few hundred rows/day now that unchanged snapshots aren't
    // written; small batches stay inside the 12s DB timeout (lib/supabase.ts).
    max_rows: 5_000,
  });
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  return NextResponse.json({ data: { deleted: data ?? 0 }, error: null });
}
