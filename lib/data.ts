// Shared data-fetching functions used by both API routes and server components.
// Pages should call these directly — never fetch their own API over HTTP.

import { supabaseAdmin } from '@/lib/supabase';
import { getGamesByDate } from '@/lib/nhl-api';

// ─── Rankings ─────────────────────────────────────────────────────────────────

export async function fetchRankings() {
  const { data, error } = await supabaseAdmin
    .from('player_metric_snapshots')
    .select(`
      *,
      players (
        id, first_name, last_name, position_code, team_id,
        headshot_url, injury_status,
        teams ( abbrev, name )
      )
    `)
    .order('calculated_at', { ascending: false })
    .limit(1000);

  if (error) throw error;

  const seen = new Set<number>();
  const latest = (data ?? []).filter(row => {
    if (seen.has(row.player_id)) return false;
    seen.add(row.player_id);
    return true;
  });

  const skaters = latest.filter(r => r.players?.position_code !== 'G');
  const top100 = skaters
    .sort((a, b) => (a.momentum_rank ?? 999) - (b.momentum_rank ?? 999))
    .slice(0, 100);
  const breakoutWatch = [...skaters]
    .sort((a, b) => (b.breakout_delta ?? 0) - (a.breakout_delta ?? 0))
    .slice(0, 10);
  const momentumLeaderSkaters = [...skaters]
    .sort((a, b) => (b.momentum_ppm ?? 0) - (a.momentum_ppm ?? 0))
    .slice(0, 5);
  const goalies = latest.filter(r => r.players?.position_code === 'G');
  const momentumLeaderGoalies = [...goalies]
    .sort((a, b) => (b.momentum_ppm ?? 0) - (a.momentum_ppm ?? 0))
    .slice(0, 5);

  return {
    top100,
    breakoutWatch,
    momentumLeaders: { skaters: momentumLeaderSkaters, goalies: momentumLeaderGoalies },
  };
}

// ─── Games ────────────────────────────────────────────────────────────────────

export async function fetchGames(date: string) {
  const games = await getGamesByDate(date);
  const gameIds = (games as { id: number }[]).map(g => g.id);
  const { data: predictions } = await supabaseAdmin
    .from('predictions')
    .select('*, prediction_outcomes(*)')
    .in('game_id', gameIds);
  return { games, predictions };
}

// ─── Player ───────────────────────────────────────────────────────────────────

export async function fetchPlayer(id: string) {
  const { data: player, error: pErr } = await supabaseAdmin
    .from('players')
    .select('*, teams(abbrev, name, logo_url)')
    .eq('id', id)
    .single();

  if (pErr) throw pErr;

  const { data: metricTimeline } = await supabaseAdmin
    .from('player_metric_snapshots')
    .select('*')
    .eq('player_id', id)
    .order('calculated_at', { ascending: true })
    .limit(30);

  const { data: recentGames } = await supabaseAdmin
    .from('game_player_stats')
    .select('*, games(game_date)')
    .eq('player_id', id)
    .order('recorded_at', { ascending: false })
    .limit(10);

  return { player, metricTimeline, recentGames };
}

// ─── Accuracy ─────────────────────────────────────────────────────────────────

export async function fetchAccuracy() {
  const { data: accuracy, error: accErr } = await supabaseAdmin
    .from('model_versions')
    .select('version, description, created_at, is_active');

  if (accErr) throw accErr;

  const { data: predictions, error: predErr } = await supabaseAdmin
    .from('predictions')
    .select(`
      id, game_id, model_version, predicted_home_score, predicted_away_score,
      home_win_probability, away_win_probability, ot_probability,
      home_energy_bar, away_energy_bar, created_at,
      prediction_outcomes (
        actual_home_score, actual_away_score,
        home_score_error, away_score_error, correct_winner, recorded_at
      ),
      games (
        game_date,
        home_team:teams!games_home_team_id_fkey ( abbrev ),
        away_team:teams!games_away_team_id_fkey ( abbrev )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (predErr) throw predErr;

  const stats: Record<string, {
    total: number; withOutcome: number; correctWinner: number;
    totalHomeErr: number; totalAwayErr: number;
  }> = {};

  for (const p of predictions ?? []) {
    const v = p.model_version;
    if (!stats[v]) stats[v] = { total: 0, withOutcome: 0, correctWinner: 0, totalHomeErr: 0, totalAwayErr: 0 };
    stats[v].total++;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outcome = (p.prediction_outcomes as any)?.[0];
    if (outcome) {
      stats[v].withOutcome++;
      if (outcome.correct_winner) stats[v].correctWinner++;
      stats[v].totalHomeErr += outcome.home_score_error ?? 0;
      stats[v].totalAwayErr += outcome.away_score_error ?? 0;
    }
  }

  const modelStats = Object.entries(stats).map(([version, s]) => ({
    version,
    totalPredictions: s.total,
    withOutcome: s.withOutcome,
    winnerAccuracyPct: s.withOutcome > 0
      ? Math.round((s.correctWinner / s.withOutcome) * 1000) / 10
      : null,
    avgHomeError: s.withOutcome > 0
      ? Math.round((s.totalHomeErr / s.withOutcome) * 100) / 100
      : null,
    avgAwayError: s.withOutcome > 0
      ? Math.round((s.totalAwayErr / s.withOutcome) * 100) / 100
      : null,
  }));

  return { modelVersions: accuracy, predictions, modelStats };
}
