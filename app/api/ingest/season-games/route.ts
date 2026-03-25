import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSchedule } from '@/lib/nhl-api';

// ─── Full Season Games Download ────────────────────────────────────────────────
// Downloads every 2025-26 regular season game from the NHL schedule API and
// upserts into the games table, including final scores for completed games.
//
// Steps through the season in 7-day increments — each /schedule/{date} call
// returns the full gameWeek (7 days) so 25 calls covers Oct → Mar.
//
// GET /api/ingest/season-games
// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  const SEASON_START = '2025-10-01';
  const today = new Date().toISOString().slice(0, 10);

  // Build list of weekly anchor dates from season start to today
  const dates: string[] = [];
  const cursor = new Date(SEASON_START + 'T12:00:00Z');
  const end    = new Date(today + 'T12:00:00Z');
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  let upserted = 0;
  let weeks    = 0;
  const errors: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type NHLGame = any;

  for (const weekAnchor of dates) {
    try {
      const schedule = await getSchedule(weekAnchor);
      const allDays  = schedule.gameWeek ?? [];

      const rows: object[] = [];
      for (const day of allDays) {
        const dayDate = (day as { date: string }).date;
        for (const g of ((day as { games: NHLGame[] }).games ?? [])) {
          // Only regular season games (gameType 2)
          if (g.gameType !== 2) continue;

          rows.push({
            id:            g.id,
            game_date:     dayDate,
            start_time_utc: g.startTimeUTC ?? null,
            home_team_id:  g.homeTeam?.id ?? null,
            away_team_id:  g.awayTeam?.id ?? null,
            home_score:    g.homeTeam?.score ?? null,
            away_score:    g.awayTeam?.score ?? null,
            game_state:    g.gameState ?? 'FUT',
            venue:         g.venue?.default ?? null,
            season:        '20252026',
          });
        }
      }

      if (rows.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabaseAdmin
          .from('games')
          .upsert(rows as any[], { onConflict: 'id' });
        if (error) errors.push(`week ${weekAnchor}: ${error.message}`);
        else upserted += rows.length;
      }

      weeks++;
    } catch (err) {
      errors.push(`week ${weekAnchor}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json({
    data: { weeks_processed: weeks, games_upserted: upserted, errors },
    error: errors.length > 0 ? `${errors.length} week errors` : null,
  });
}
