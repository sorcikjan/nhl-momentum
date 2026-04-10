import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireIngestAuth } from '@/lib/ingest-auth';

// GET /api/ingest/backfill-games?start=YYYY-MM-DD&end=YYYY-MM-DD
// Iterates every day in the range, fetches games from the NHL API,
// and upserts them into the games table.
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

  let gamesUpserted = 0;
  let daysProcessed = 0;
  const errors: string[] = [];

  const cursor = new Date(start + 'T12:00:00Z');
  const endDate = new Date(end + 'T12:00:00Z');

  // NHL schedule API returns up to 7 days — step by 7 to minimise API calls
  while (cursor <= endDate) {
    const dateStr = cursor.toISOString().slice(0, 10);
    try {
      const res = await fetch(`https://api-web.nhle.com/v1/schedule/${dateStr}`, { cache: 'no-store' });
      if (!res.ok) { errors.push(`${dateStr}: HTTP ${res.status}`); cursor.setUTCDate(cursor.getUTCDate() + 7); continue; }

      const json = await res.json();
      const week: { date: string; games: { id: number; gameDate: string; startTimeUTC: string; gameState: string; homeTeam: { id: number; score?: number }; awayTeam: { id: number; score?: number }; venue?: { default: string } }[] }[] = json.gameWeek ?? [];

      for (const day of week) {
        if (day.date < start || day.date > end) continue;
        for (const g of day.games ?? []) {
          const { error } = await supabaseAdmin
            .from('games')
            .upsert({
              id: g.id,
              game_date: g.gameDate ?? day.date,
              start_time_utc: g.startTimeUTC ?? null,
              home_team_id: g.homeTeam.id,
              away_team_id: g.awayTeam.id,
              home_score: g.homeTeam.score ?? null,
              away_score: g.awayTeam.score ?? null,
              game_state: g.gameState,
              venue: g.venue?.default ?? null,
              season: '20252026',
            }, { onConflict: 'id' });
          if (error) errors.push(`game ${g.id}: ${error.message}`);
          else gamesUpserted++;
        }
        daysProcessed++;
      }
    } catch (err) {
      errors.push(`${dateStr}: ${(err as Error).message}`);
    }

    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  return NextResponse.json({
    data: { gamesUpserted, daysProcessed, errors: errors.slice(0, 20) },
    error: errors.length > 0 ? `${errors.length} errors` : null,
  });
}
