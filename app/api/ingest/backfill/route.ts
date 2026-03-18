import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getGamesByDate } from '@/lib/nhl-api';
import type { NHLScheduledGame } from '@/types';

// GET /api/ingest/backfill?days=30
// Fetches completed games from the past N days from the NHL schedule API
// and upserts them into the games table.
//
// Safe to re-run — uses upsert with onConflict: 'id'.
// Stays well within Netlify 26s timeout: 30 days × ~300ms/call ≈ 9s.

export async function GET(req: NextRequest) {
  const days = Math.min(60, Number(req.nextUrl.searchParams.get('days') ?? '30'));

  const log: string[] = [];
  let gamesUpserted = 0;
  let daysProcessed = 0;

  // Build list of dates to fetch (today and past N-1 days)
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86400000);
    dates.push(d.toISOString().slice(0, 10));
  }

  for (const date of dates) {
    try {
      const games = (await getGamesByDate(date)) as NHLScheduledGame[];
      const completed = games.filter(
        g => g.gameState === 'FINAL' || g.gameState === 'OFF'
      );

      if (completed.length === 0) continue;

      const rows = completed.map(g => ({
        id: g.id,
        game_date: g.gameDate ?? date,
        start_time_utc: g.startTimeUTC,
        home_team_id: g.homeTeam.id,
        away_team_id: g.awayTeam.id,
        home_score: g.homeTeam.score ?? null,
        away_score: g.awayTeam.score ?? null,
        game_state: g.gameState,
        venue: g.venue?.default ?? null,
        season: '20252026',
      }));

      const { error } = await supabaseAdmin
        .from('games')
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        log.push(`${date}: error — ${error.message}`);
      } else {
        gamesUpserted += rows.length;
        daysProcessed++;
        log.push(`${date}: ${rows.length} games`);
      }
    } catch (err) {
      log.push(`${date}: fetch error — ${(err as Error).message}`);
    }
  }

  return NextResponse.json({
    data: { days_requested: days, days_processed: daysProcessed, games_upserted: gamesUpserted, log },
    error: null,
  });
}
