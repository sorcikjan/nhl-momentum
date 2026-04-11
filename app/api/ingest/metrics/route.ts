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
// Reads game_player_stats from DB, computes 3-layer metrics, writes snapshots.
//
// Supabase has a max_rows cap (default 1000) that silently truncates large queries.
// With 100 skaters × 82 games = 8200 rows needed, a single query would be cut to
// 1000 rows (~12 games per player). Fix: chunk skaterIds into groups of 10 so each
// chunk requires at most 10 × 82 = 820 rows — safely under the 1000-row cap.

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const limit  = Math.min(500, Math.max(1, Number(req.nextUrl.searchParams.get('limit')  ?? '100')));
  const offset = Math.max(0, Number(req.nextUrl.searchParams.get('offset') ?? '0'));

  try {
    // Fetch active players with pagination
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

    const skaterIds = (players ?? []).filter(p => p.position_code !== 'G').map(p => p.id);

    // Fetch all game stats chunked to stay under Supabase max_rows (default 1000).
    // Each chunk of 10 skaters × 82 games = 820 rows — safely under the cap.
    // Ordered game_id DESC so newest rows come first (momentum window = slice(0,5)).
    const CHUNK = 10;
    const statsByPlayer = new Map<number, {
      player_id: number; goals: number; assists: number; shots_on_goal: number;
      toi_seconds: number; hits: number; blocked_shots: number; plus_minus: number;
      pim: number; pp_goals: number; pp_points: number; sh_goals: number;
      sh_points: number; sh_toi_seconds: number; game_winning_goals: number;
      ot_goals: number; game_id: number;
    }[]>();

    for (let ci = 0; ci < skaterIds.length; ci += CHUNK) {
      const chunk = skaterIds.slice(ci, ci + CHUNK);
      const { data: chunkStats, error: chunkErr } = await supabaseAdmin
        .from('game_player_stats')
        .select('player_id,goals,assists,shots_on_goal,toi_seconds,hits,blocked_shots,plus_minus,pim,pp_goals,pp_points,sh_goals,sh_points,sh_toi_seconds,game_winning_goals,ot_goals,game_id')
        .in('player_id', chunk)
        .order('game_id', { ascending: false })
        .limit(chunk.length * 100);
      if (chunkErr) throw chunkErr;
      for (const row of chunkStats ?? []) {
        if (!statsByPlayer.has(row.player_id)) statsByPlayer.set(row.player_id, []);
        statsByPlayer.get(row.player_id)!.push(row);
      }
    }

    // Carry forward existing energy_bar — energy phase writes this separately
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
      if (player.position_code === 'G') continue;

      const playerStats = statsByPlayer.get(player.id);
      if (!playerStats?.length) continue;

      const last5      = playerStats.slice(0, 5); // newest-first → top 5 = momentum
      const fullSeason = playerStats;              // all rows = full season

      const momentum  = buildLayerMetrics(last5);
      const season    = buildLayerMetrics(fullSeason);
      const career    = season;
      const composite = compositeLayer(momentum, season, career);

      const sosCoefficient = calcSOSCoefficient([], leagueAvgGoaliePPM);
      const breakoutDelta  = calcBreakoutDelta(momentum.ppm, season.ppm);
      const rankScore      = calcMomentumRankScore(momentum.ppm, momentum.shootingPct, sosCoefficient);

      snapshots.push({
        player_id:                    player.id,
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
        career_games:                 career.gamesPlayed,
        career_ppm:                   career.ppm,
        composite_ppm:                composite.ppm,
        sos_coefficient:              sosCoefficient,
        energy_bar:                   existingEnergyByPlayer.get(player.id) ?? 100,
        momentum_rank:                0,
        breakout_delta:               breakoutDelta,
      });
    }

    // Rank by composite_ppm
    const ranked = snapshots
      .sort((a, b) => b.composite_ppm - a.composite_ppm)
      .map((s, i) => ({ ...s, momentum_rank: i + 1 }));

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
