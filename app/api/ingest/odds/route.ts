import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchNHLOdds } from '@/lib/odds-api';

// ─── Odds Ingest ──────────────────────────────────────────────────────────────
// Fetches NHL game odds from The Odds API and upserts them into external_odds.
// Run daily before games tip off (e.g. after phase=snapshots in the pipeline).
//
// GET /api/ingest/odds
//
// Requires ODDS_API_KEY env var (https://the-odds-api.com — free tier: 500 req/mo).
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ODDS_API_KEY not configured' }, { status: 500 });
  }

  const log: string[] = [];
  let matched = 0;
  let upserted = 0;

  try {
    // 1. Build team name → DB record map
    const { data: teams, error: teamsErr } = await supabaseAdmin
      .from('teams')
      .select('id, name, abbrev');
    if (teamsErr) throw teamsErr;

    // Known name differences between The Odds API and the NHL API
    const ALIASES: Record<string, string> = {
      'st louis blues': 'st. louis blues',
    };

    const teamMap = new Map<string, { id: number; abbrev: string }>();
    for (const t of teams ?? []) {
      teamMap.set(t.name.toLowerCase(), { id: t.id, abbrev: t.abbrev });
    }

    const resolveTeam = (name: string) => {
      const key = name.toLowerCase();
      return teamMap.get(ALIASES[key] ?? key);
    };

    // 2. Fetch odds from The Odds API
    const events = await fetchNHLOdds(apiKey);
    log.push(`Fetched ${events.length} events from Odds API`);

    if (events.length === 0) {
      return NextResponse.json({ ok: true, matched: 0, upserted: 0, log });
    }

    // 3. Collect all unique dates so we can query matching games in one shot
    const dates = [...new Set(events.map(ev => ev.commence_time.slice(0, 10)))];
    // Also include ±1 day to handle UTC/local timezone drift
    const expandedDates = new Set<string>();
    for (const d of dates) {
      const ts = new Date(d + 'T12:00:00Z').getTime();
      expandedDates.add(new Date(ts - 86400000).toISOString().slice(0, 10));
      expandedDates.add(d);
      expandedDates.add(new Date(ts + 86400000).toISOString().slice(0, 10));
    }

    const { data: games, error: gamesErr } = await supabaseAdmin
      .from('games')
      .select('id, game_date, home_team_id, away_team_id')
      .in('game_date', [...expandedDates]);
    if (gamesErr) throw gamesErr;

    log.push(`Loaded ${games?.length ?? 0} DB games across ${expandedDates.size} dates`);

    // 4. Match each event to a DB game and collect odds rows
    type OddsRow = {
      game_id: number;
      source: string;
      bookmaker: string;
      home_odds: number | null;
      away_odds: number | null;
      draw_odds: number | null;
      fetched_at: string;
    };

    const oddsRows: OddsRow[] = [];
    const now = new Date().toISOString();

    for (const ev of events) {
      const homeTeam = resolveTeam(ev.home_team);
      const awayTeam = resolveTeam(ev.away_team);

      if (!homeTeam || !awayTeam) {
        log.push(`Unknown team: "${ev.away_team}" @ "${ev.home_team}"`);
        continue;
      }

      const evDate = ev.commence_time.slice(0, 10);
      const prevDate = new Date(new Date(evDate + 'T12:00:00Z').getTime() - 86400000).toISOString().slice(0, 10);
      const nextDate = new Date(new Date(evDate + 'T12:00:00Z').getTime() + 86400000).toISOString().slice(0, 10);

      const game = (games ?? []).find(g =>
        (g.game_date === evDate || g.game_date === prevDate || g.game_date === nextDate) &&
        g.home_team_id === homeTeam.id &&
        g.away_team_id === awayTeam.id
      );

      if (!game) {
        log.push(`No DB game: ${awayTeam.abbrev} @ ${homeTeam.abbrev} on ${evDate}`);
        continue;
      }

      matched++;

      for (const bk of ev.bookmakers) {
        const h2h = bk.markets.find(m => m.key === 'h2h');
        if (!h2h) continue;

        const homeOutcome = h2h.outcomes.find(o => o.name === ev.home_team);
        const awayOutcome = h2h.outcomes.find(o => o.name === ev.away_team);
        // Third outcome (if any) is OT/draw in European 3-way markets
        const drawOutcome = h2h.outcomes.find(
          o => o.name !== ev.home_team && o.name !== ev.away_team
        );

        oddsRows.push({
          game_id: game.id,
          source: 'the-odds-api',
          bookmaker: bk.key,
          home_odds: homeOutcome?.price ?? null,
          away_odds: awayOutcome?.price ?? null,
          draw_odds: drawOutcome?.price ?? null,
          fetched_at: now,
        });
      }
    }

    // 5. Upsert — one row per game × bookmaker
    if (oddsRows.length > 0) {
      const { error: upsertErr } = await supabaseAdmin
        .from('external_odds')
        .upsert(oddsRows, { onConflict: 'game_id,bookmaker' });
      if (upsertErr) throw upsertErr;
      upserted = oddsRows.length;
    }

    log.push(`Matched ${matched}/${events.length} events · upserted ${upserted} odds rows`);

    return NextResponse.json({ ok: true, matched, upserted, log });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message, log }, { status: 500 });
  }
}
