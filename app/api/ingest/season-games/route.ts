import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSchedule } from '@/lib/nhl-api';
import { requireIngestAuth } from '@/lib/ingest-auth';

// ─── Full Season Games Download ────────────────────────────────────────────────
// Downloads every regular season (gameType 2) AND playoff (gameType 3) game for
// a season from the NHL schedule API and upserts into the games table, including
// final scores for completed games.
//
// Steps through the season in 7-day increments — each /schedule/{date} call
// returns the full gameWeek (7 days) so ~35 calls covers Oct → Jun.
//
// GET /api/ingest/season-games              ← defaults to the season currently
//                                              starting/active (Oct-year rollover)
// GET /api/ingest/season-games?startYear=2026 ← explicit override, e.g. to backfill
//                                                 a specific season on demand
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const now = new Date();
  // Default start year mirrors currentSeason()'s Oct rollover, but this route is
  // for bulk-loading a season's schedule ahead of/at its start, so also flip over
  // starting September (preseason) rather than waiting for Oct 1.
  const defaultStartYear = now.getUTCMonth() + 1 >= 9 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  const startYear = Number(req.nextUrl.searchParams.get('startYear') ?? defaultStartYear);
  const seasonStr = `${startYear}${startYear + 1}`;

  const SEASON_START = `${startYear}-10-01`;
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
          // Regular season (gameType 2) + playoffs (gameType 3) only — skip preseason/all-star
          if (g.gameType !== 2 && g.gameType !== 3) continue;

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
            season:        seasonStr,
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
