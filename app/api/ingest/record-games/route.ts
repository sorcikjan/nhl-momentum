import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireIngestAuth } from '@/lib/ingest-auth';

// POST /api/ingest/record-games
// Body: { games: GameRecord[] }
//
// Upserts final game results (scores + state) into the games table.
// Called by game-finish-worker-background as step 0, before outcomes-backfill,
// so that the DB has FINAL-state records that outcomes-backfill can act on.
//
// The NHL API schedule response (passed by the poller) contains final scores —
// this avoids making another NHL API call with cache issues.

interface GameRecord {
  id: number;
  game_date: string;
  start_time_utc: string | null;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
  game_state: string;
  venue: string | null;
  season: string;
}

export async function POST(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  let body: { games?: GameRecord[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body' }, { status: 400 });
  }

  const games = body.games ?? [];
  if (games.length === 0) {
    return NextResponse.json({ data: { upserted: 0 }, error: null });
  }

  const { error } = await supabaseAdmin
    .from('games')
    .upsert(games, { onConflict: 'id' });

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { upserted: games.length }, error: null });
}
