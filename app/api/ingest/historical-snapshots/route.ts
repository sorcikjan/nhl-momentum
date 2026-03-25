import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { buildLayerMetrics, compositeLayer, calcBreakoutDelta } from '@/lib/metrics';

// ─── Historical Metric Snapshot Backfill ──────────────────────────────────────
// Creates player_metric_snapshots at fortnightly intervals from the season
// start to today, so the PPM timeline spans the whole season rather than
// just the days since we started running the daily ingest.
//
// For each checkpoint date:
//   - momentum = last 5 game_player_stats rows with game_date <= checkpoint
//   - season   = all game_player_stats rows with game_date <= checkpoint
//
// Requires the games table to be fully populated first (run /api/ingest/season-games).
//
// GET /api/ingest/historical-snapshots?offset=0&limit=50
//   Run repeatedly with offset=0, 50, 100, ... until players=0
// ─────────────────────────────────────────────────────────────────────────────

const SEASON_START  = '2025-10-01';
// Fortnightly checkpoints — one snapshot every 14 days through the season
const CHECKPOINT_INTERVAL_DAYS = 14;

function buildCheckpoints(today: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(SEASON_START + 'T12:00:00Z');
  const end    = new Date(today + 'T12:00:00Z');
  while (cursor < end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + CHECKPOINT_INTERVAL_DAYS);
  }
  return dates;
}

export async function GET(req: NextRequest) {
  const limit  = Number(req.nextUrl.searchParams.get('limit')  ?? '50');
  const offset = Number(req.nextUrl.searchParams.get('offset') ?? '0');
  const today  = new Date().toISOString().slice(0, 10);

  try {
    // 1. Fetch active skaters (paginated)
    const { data: players, error: pErr } = await supabaseAdmin
      .from('players')
      .select('id, position_code, team_id')
      .eq('is_active', true)
      .neq('position_code', 'G')
      .order('id')
      .range(offset, offset + limit - 1);

    if (pErr) throw pErr;
    if (!players?.length) return NextResponse.json({ data: { players: 0, snapshots: 0 }, error: null });

    // 2. Build a game_id → game_date map from the games table
    //    Only need games up to today for the season
    const { data: allGames } = await supabaseAdmin
      .from('games')
      .select('id, game_date')
      .eq('season', '20252026')
      .order('game_date', { ascending: true });

    const gameIdToDate = new Map<number, string>();
    for (const g of allGames ?? []) gameIdToDate.set(g.id, g.game_date);

    const checkpoints = buildCheckpoints(today);
    const snapshots: object[] = [];

    for (const player of players) {
      // Fetch all game stats for this player this season
      const { data: allStats } = await supabaseAdmin
        .from('game_player_stats')
        .select('game_id,goals,assists,shots_on_goal,toi_seconds,hits,blocked_shots,plus_minus,pp_points,sh_toi_seconds')
        .eq('player_id', player.id)
        .order('game_id', { ascending: true });

      if (!allStats?.length) continue;

      // Annotate each stat row with its game_date
      const statsWithDates = allStats
        .map(s => ({ ...s, game_date: gameIdToDate.get(s.game_id) ?? '9999-99-99' }))
        .filter(s => s.game_date !== '9999-99-99')
        .sort((a, b) => a.game_date.localeCompare(b.game_date));

      for (const checkpoint of checkpoints) {
        const seasonGames = statsWithDates.filter(s => s.game_date <= checkpoint);
        if (seasonGames.length < 3) continue; // not enough data for a meaningful snapshot

        const momentumGames = seasonGames.slice(-5); // last 5 games before checkpoint
        const momentum  = buildLayerMetrics(momentumGames);
        const season    = buildLayerMetrics(seasonGames);
        const composite = compositeLayer(momentum, season, season); // career = season (no multi-season data)

        snapshots.push({
          player_id:              player.id,
          calculated_at:          checkpoint + 'T12:00:00Z',
          momentum_games:         momentum.gamesPlayed,
          momentum_goals:         momentum.goals,
          momentum_assists:       momentum.assists,
          momentum_points:        momentum.points,
          momentum_toi_sec:       momentum.toiSeconds,
          momentum_ppm:           momentum.ppm,
          momentum_shooting_pct:  momentum.shootingPct,
          momentum_sh_toi_sec:    momentum.shorthandedToiSeconds,
          season_games:           season.gamesPlayed,
          season_goals:           season.goals,
          season_assists:         season.assists,
          season_points:          season.points,
          season_toi_sec:         season.toiSeconds,
          season_ppm:             season.ppm,
          season_shooting_pct:    season.shootingPct,
          career_games:           season.gamesPlayed,
          career_ppm:             season.ppm, // TODO: replace with real multi-season data
          composite_ppm:          composite.ppm,
          sos_coefficient:        1.0,
          energy_bar:             100,
          momentum_rank:          0,
          breakout_delta:         calcBreakoutDelta(momentum.ppm, season.ppm),
        });
      }
    }

    // Batch insert historical snapshots.
    // player_metric_snapshots has no unique constraint on (player_id, calculated_at)
    // so we use insert. The endpoint is idempotent in practice because checkpoint
    // dates (fortnightly from Oct) don't overlap with daily ingest dates (Mar 18+).
    // Running it twice would create duplicates — the PPMTimeline deduplicates by date.
    const BATCH = 200;
    let inserted = 0;
    for (let i = 0; i < snapshots.length; i += BATCH) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabaseAdmin
        .from('player_metric_snapshots')
        .insert(snapshots.slice(i, i + BATCH) as any[]);
      if (!error) inserted += Math.min(BATCH, snapshots.length - i);
    }

    return NextResponse.json({
      data: {
        players: players.length,
        checkpoints: checkpoints.length,
        snapshots_inserted: inserted,
        offset,
      },
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: (err as Error).message },
      { status: 500 }
    );
  }
}
