import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireIngestAuth } from '@/lib/ingest-auth';
import {
  buildLayerMetrics,
  compositeLayer,
  calcBreakoutDelta,
  calcMomentumRankScore,
  rankSkaters,
  buildGoalieLayerMetrics,
} from '@/lib/metrics';
import { calcSOSCoefficient } from '@/lib/sos';

// GET /api/ingest/metrics
// Reads game_player_stats from DB, computes 3-layer metrics, writes snapshots

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const limit  = Math.min(500, Math.max(1, Number(req.nextUrl.searchParams.get('limit')  ?? '100')));
  const offset = Math.max(0, Number(req.nextUrl.searchParams.get('offset') ?? '0'));

  try {
    // Fetch active skaters with pagination
    const { data: players, error: pErr } = await supabaseAdmin
      .from('players')
      .select('id, position_code, team_id, injury_status')
      .eq('is_active', true)
      .order('id')
      .range(offset, offset + limit - 1);

    if (pErr) throw pErr;

    // Fetch league average defensive filter for SOS (use cached goalie snapshots)
    const { data: goalieSnapshots } = await supabaseAdmin
      .from('player_metric_snapshots')
      .select('momentum_ppm')
      .order('calculated_at', { ascending: false })
      .limit(100);

    const leagueAvgGoaliePPM = goalieSnapshots?.length
      ? goalieSnapshots.reduce((s, g) => s + (g.momentum_ppm ?? 0), 0) / goalieSnapshots.length
      : 1.0;

    // Bulk-fetch all game stats for skaters in this batch — 2 queries instead of N*2 sequential queries
    const skaterIds = (players ?? []).filter(p => p.position_code !== 'G').map(p => p.id);

    // Fetch full season stats — explicit limit of 100 games × player count so
    // fullSeason isn't truncated by Supabase's 1000-row default.
    const { data: allStats, error: statsErr } = await supabaseAdmin
      .from('game_player_stats')
      .select('player_id,goals,assists,shots_on_goal,toi_seconds,hits,blocked_shots,plus_minus,pim,pp_goals,pp_points,sh_goals,sh_points,sh_toi_seconds,game_winning_goals,ot_goals,game_id')
      .in('player_id', skaterIds)
      .order('game_id', { ascending: false })
      .limit(skaterIds.length * 100);

    if (statsErr) throw statsErr;

    // Group by player_id in memory (rows already sorted newest-first)
    const statsByPlayer = new Map<number, NonNullable<typeof allStats>>();
    for (const row of allStats ?? []) {
      if (!statsByPlayer.has(row.player_id)) statsByPlayer.set(row.player_id, []);
      statsByPlayer.get(row.player_id)!.push(row);
    }

    // Carry forward existing energy_bar — energy phase writes this separately;
    // inserting 100 here would overwrite a valid fatigue value.
    const { data: existingSnaps } = await supabaseAdmin
      .from('player_metric_snapshots')
      .select('player_id, energy_bar')
      .in('player_id', skaterIds)
      .order('calculated_at', { ascending: false })
      .limit(skaterIds.length * 3);
    const existingEnergyByPlayer = new Map<number, number>();
    for (const snap of existingSnaps ?? []) {
      if (!existingEnergyByPlayer.has(snap.player_id)) existingEnergyByPlayer.set(snap.player_id, snap.energy_bar ?? 100);
    }

    const snapshots = [];

    for (const player of players ?? []) {
      if (player.position_code === 'G') continue; // Goalies handled separately

      const playerStats = statsByPlayer.get(player.id);
      if (!playerStats?.length) continue;

      const last5      = playerStats.slice(0, 5); // newest-first, top 5 = momentum window
      const fullSeason = playerStats;              // all rows = full season

      const momentum = buildLayerMetrics(last5);
      const season   = buildLayerMetrics(fullSeason);
      // Career = season for now (we'll expand when we have multi-season data)
      const career   = season;
      const composite = compositeLayer(momentum, season, career);

      // SOS: use league avg as placeholder (will refine once we have opponent mapping)
      const sosCoefficient = calcSOSCoefficient([], leagueAvgGoaliePPM);
      const breakoutDelta  = calcBreakoutDelta(momentum.ppm, season.ppm);
      const rankScore      = calcMomentumRankScore(momentum.ppm, momentum.shootingPct, sosCoefficient);

      snapshots.push({
        player_id:                    player.id,
        // Momentum layer
        momentum_games:               momentum.gamesPlayed,
        momentum_goals:               momentum.goals,
        momentum_assists:             momentum.assists,
        momentum_points:              momentum.points,
        momentum_toi_sec:             momentum.toiSeconds,
        momentum_ppm:                 momentum.ppm,
        momentum_shooting_pct:        momentum.shootingPct,
        momentum_sh_toi_sec:          momentum.shorthandedToiSeconds,
        momentum_plus_minus:          momentum.plusMinus,
        momentum_pp_goals:            momentum.powerPlayGoals,
        momentum_pp_points:           momentum.powerPlayPoints,
        momentum_pim:                 momentum.pim,
        momentum_shots:               momentum.shotsOnGoal,
        momentum_hits:                momentum.hits,
        momentum_blocked_shots:       momentum.blockedShots,
        // Season layer
        season_games:                 season.gamesPlayed,
        season_goals:                 season.goals,
        season_assists:               season.assists,
        season_points:                season.points,
        season_toi_sec:               season.toiSeconds,
        season_ppm:                   season.ppm,
        season_shooting_pct:          season.shootingPct,
        season_plus_minus:            season.plusMinus,
        season_pp_goals:              season.powerPlayGoals,
        season_pp_points:             season.powerPlayPoints,
        season_sh_goals:              season.shorthandedGoals,
        season_sh_points:             season.shorthandedPoints,
        season_pim:                   season.pim,
        season_gw_goals:              season.gameWinningGoals,
        season_ot_goals:              season.otGoals,
        season_shots:                 season.shotsOnGoal,
        season_hits:                  season.hits,
        season_blocked_shots:         season.blockedShots,
        // Career / composite
        career_games:                 career.gamesPlayed,
        career_ppm:                   career.ppm,
        composite_ppm:                composite.ppm,
        sos_coefficient:              sosCoefficient,
        energy_bar:                   existingEnergyByPlayer.get(player.id) ?? 100,
        momentum_rank:                0,   // will be set after ranking
        breakout_delta:               breakoutDelta,
      });
    }

    // Rank by composite_ppm (weighted blend: 50% momentum + 35% season + 15% career)
    // This is stable and correct. The old calcMomentumRankScore was broken because
    // sosCoefficient=1.0 for everyone (adds a constant) and raw shootingPct (0-1)
    // dwarfs PPM (0.01-0.15), causing fluke small-sample shooting to dominate.
    const ranked = snapshots
      .sort((a, b) => b.composite_ppm - a.composite_ppm)
      .map((s, i) => ({ ...s, momentum_rank: i + 1 }));

    // Batch upsert snapshots
    const BATCH = 50;
    let inserted = 0;
    for (let i = 0; i < ranked.length; i += BATCH) {
      const { error } = await supabaseAdmin
        .from('player_metric_snapshots')
        .insert(ranked.slice(i, i + BATCH));
      if (error) throw error;
      inserted += Math.min(BATCH, ranked.length - i);
    }

    return NextResponse.json({
      data: { snapshotsInserted: inserted },
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: (err as Error).message },
      { status: 500 }
    );
  }
}
