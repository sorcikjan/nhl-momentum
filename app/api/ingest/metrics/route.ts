import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
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
  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '200');

  try {
    // Fetch all active skaters with their stats
    const { data: players, error: pErr } = await supabaseAdmin
      .from('players')
      .select('id, position_code, team_id, injury_status')
      .eq('is_active', true)
      .limit(limit);

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

    const snapshots = [];

    for (const player of players ?? []) {
      if (player.position_code === 'G') continue; // Goalies handled separately

      // Fetch last 5 games (Momentum layer)
      const { data: last5 } = await supabaseAdmin
        .from('game_player_stats')
        .select('goals,assists,shots_on_goal,toi_seconds,hits,blocked_shots,plus_minus,pp_points,sh_toi_seconds,game_id')
        .eq('player_id', player.id)
        .order('game_id', { ascending: false })
        .limit(5);

      // Fetch full season (Season layer)
      const { data: fullSeason } = await supabaseAdmin
        .from('game_player_stats')
        .select('goals,assists,shots_on_goal,toi_seconds,hits,blocked_shots,plus_minus,pp_points,sh_toi_seconds')
        .eq('player_id', player.id);

      if (!last5?.length || !fullSeason?.length) continue;

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
        player_id:            player.id,
        momentum_games:       momentum.gamesPlayed,
        momentum_goals:       momentum.goals,
        momentum_assists:     momentum.assists,
        momentum_points:      momentum.points,
        momentum_toi_sec:     momentum.toiSeconds,
        momentum_ppm:         momentum.ppm,
        momentum_shooting_pct: momentum.shootingPct,
        momentum_sh_toi_sec:  momentum.shorthandedToiSeconds,
        season_games:         season.gamesPlayed,
        season_goals:         season.goals,
        season_assists:       season.assists,
        season_points:        season.points,
        season_toi_sec:       season.toiSeconds,
        season_ppm:           season.ppm,
        season_shooting_pct:  season.shootingPct,
        career_games:         career.gamesPlayed,
        career_ppm:           career.ppm,
        composite_ppm:        composite.ppm,
        sos_coefficient:      sosCoefficient,
        energy_bar:           100, // placeholder until energy route populates this
        momentum_rank:        0,   // will be set after ranking
        breakout_delta:       breakoutDelta,
      });
    }

    // Rank all players by momentum rank score
    const ranked = snapshots
      .sort((a, b) =>
        calcMomentumRankScore(b.momentum_ppm, b.momentum_shooting_pct, b.sos_coefficient) -
        calcMomentumRankScore(a.momentum_ppm, a.momentum_shooting_pct, a.sos_coefficient)
      )
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
