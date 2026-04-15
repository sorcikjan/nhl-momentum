import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getGameLanding, getGameRightRail } from '@/lib/nhl-api';
import { requireIngestAuth } from '@/lib/ingest-auth';

// GET /api/ingest/game-extras?days=14&offset=0&limit=20
//
// Backfills three_stars + team_game_stats for completed games that are missing them.
// Safe to re-run — only updates games where columns are null.
// Use offset+limit to paginate through historical games.

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const days   = Math.min(60, Math.max(1, Number(req.nextUrl.searchParams.get('days')   ?? '14')));
  const offset = Math.max(0,  Number(req.nextUrl.searchParams.get('offset') ?? '0'));
  const limit  = Math.min(30, Math.max(1, Number(req.nextUrl.searchParams.get('limit')  ?? '20')));

  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  // Fetch completed games missing either column
  const { data: games, error: gErr } = await supabaseAdmin
    .from('games')
    .select('id, game_date')
    .in('game_state', ['FINAL', 'OFF'])
    .gte('game_date', since)
    .is('three_stars', null)
    .order('game_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (gErr) return NextResponse.json({ data: null, error: gErr.message }, { status: 500 });

  let updated = 0;
  const errors: string[] = [];

  await Promise.all((games ?? []).map(async game => {
    try {
      const [landing, rail] = await Promise.all([
        getGameLanding(game.id).catch(() => null),
        getGameRightRail(game.id).catch(() => null),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const threeStars    = (landing as any)?.summary?.threeStars    ?? null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teamGameStats = (rail    as any)?.teamGameStats ?? null;
      if (!threeStars && !teamGameStats) return;
      const { error } = await supabaseAdmin
        .from('games')
        .update({ three_stars: threeStars, team_game_stats: teamGameStats })
        .eq('id', game.id);
      if (error) errors.push(`game ${game.id}: ${error.message}`);
      else updated++;
    } catch (e) {
      errors.push(`game ${game.id}: ${(e as Error).message}`);
    }
  }));

  return NextResponse.json({
    data: { updated, processed: (games ?? []).length, offset, errors },
    error: errors.length > 0 ? `${errors.length} errors` : null,
  });
}
