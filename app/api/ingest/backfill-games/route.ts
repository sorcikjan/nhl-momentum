import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireIngestAuth } from '@/lib/ingest-auth';

// GET /api/ingest/backfill-games?start=YYYY-MM-DD&end=YYYY-MM-DD
// Iterates every week in the range, fetches games from the NHL schedule API,
// and bulk-upserts them into the games table.
// Required before running gamelogs backfill — game_player_stats has a FK on game_id.

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const start = req.nextUrl.searchParams.get('start') ?? '2025-10-08';
  const end   = req.nextUrl.searchParams.get('end')   ?? new Date().toISOString().slice(0, 10);

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (!DATE_RE.test(start) || !DATE_RE.test(end)) {
    return NextResponse.json({ data: null, error: 'Invalid date format' }, { status: 400 });
  }

  const allGames: {
    id: number; game_date: string; start_time_utc: string | null;
    home_team_id: number; away_team_id: number;
    home_score: number | null; away_score: number | null;
    game_state: string; venue: string | null; season: string;
  }[] = [];

  const errors: string[] = [];
  const cursor = new Date(start + 'T12:00:00Z');
  const endDate = new Date(end + 'T12:00:00Z');

  // NHL schedule API returns 7 days per call — step by 7 to minimise round trips
  while (cursor <= endDate) {
    const dateStr = cursor.toISOString().slice(0, 10);
    try {
      const res = await fetch(`https://api-web.nhle.com/v1/schedule/${dateStr}`, { cache: 'no-store' });
      if (!res.ok) { errors.push(`${dateStr}: HTTP ${res.status}`); }
      else {
        const json = await res.json();
        for (const day of json.gameWeek ?? []) {
          if (day.date < start || day.date > end) continue;
          for (const g of day.games ?? []) {
            allGames.push({
              id:             g.id,
              game_date:      g.gameDate ?? day.date,
              start_time_utc: g.startTimeUTC ?? null,
              home_team_id:   g.homeTeam.id,
              away_team_id:   g.awayTeam.id,
              home_score:     g.homeTeam.score ?? null,
              away_score:     g.awayTeam.score ?? null,
              game_state:     g.gameState,
              venue:          g.venue?.default ?? null,
              season:         '20252026',
            });
          }
        }
      }
    } catch (err) {
      errors.push(`${dateStr}: ${(err as Error).message}`);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  // Filter to only games whose team IDs exist in our teams table (excludes All-Star etc.)
  const { data: knownTeams } = await supabaseAdmin.from('teams').select('id');
  const knownTeamIds = new Set((knownTeams ?? []).map(t => t.id));
  const validGames = allGames.filter(g => knownTeamIds.has(g.home_team_id) && knownTeamIds.has(g.away_team_id));

  // Bulk upsert in batches of 200 to stay within PostgREST limits
  let gamesUpserted = 0;
  const BATCH = 200;
  for (let i = 0; i < validGames.length; i += BATCH) {
    const { error } = await supabaseAdmin
      .from('games')
      .upsert(validGames.slice(i, i + BATCH), { onConflict: 'id' });
    if (error) errors.push(`upsert batch ${i}: ${error.message}`);
    else gamesUpserted += Math.min(BATCH, validGames.length - i);
  }

  return NextResponse.json({
    data: { gamesUpserted, totalFound: allGames.length, validGames: validGames.length, skipped: allGames.length - validGames.length, errors: errors.slice(0, 20) },
    error: errors.length > 0 ? `${errors.length} errors` : null,
  });
}
