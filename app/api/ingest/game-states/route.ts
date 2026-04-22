import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireIngestAuth } from '@/lib/ingest-auth';

// GET /api/ingest/game-states?ids=2024020001,2024020002
//
// Returns the game_state for the given game IDs from our DB.
// Used by game-finished-poller to determine which games are already
// marked FINAL/OFF in our DB vs newly-finished in the NHL API.

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const idsParam = req.nextUrl.searchParams.get('ids');
  if (!idsParam) {
    return NextResponse.json({ games: [] });
  }

  const ids = idsParam
    .split(',')
    .map(s => Number(s.trim()))
    .filter(n => n > 0);

  if (ids.length === 0) {
    return NextResponse.json({ games: [] });
  }

  const { data, error } = await supabaseAdmin
    .from('games')
    .select('id, game_state')
    .in('id', ids)
    .in('game_state', ['FINAL', 'OFF']);

  if (error) {
    return NextResponse.json({ games: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ games: data ?? [] });
}
