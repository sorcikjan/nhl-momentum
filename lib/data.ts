// Shared data-fetching functions used by both API routes and server components.
// Pages should call these directly — never fetch their own API over HTTP.

import { supabaseAdmin } from '@/lib/supabase';
import { getGamesByDate, getGameBoxscore, getStandings, getTeamSeasonStats } from '@/lib/nhl-api';

// NHL CDN logo URL — works for all 32 teams
export function teamLogoUrl(abbrev: string) {
  return `https://assets.nhle.com/logos/nhl/svg/${abbrev}_light.svg`;
}

// Returns the latest model version string (by created_at).
// Used to pin all UI prediction queries to the most recent model.
async function latestModelVersion(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('model_versions')
    .select('version')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data?.version ?? 'v1.3';
}

// ─── Rankings ─────────────────────────────────────────────────────────────────

export async function fetchRankings() {
  const { data, error } = await supabaseAdmin
    .from('player_metric_snapshots')
    .select(`
      *,
      players (
        id, first_name, last_name, position_code, team_id,
        headshot_url, injury_status,
        teams ( id, abbrev, name )
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

  // Rank globally by composite_ppm at query time — stored momentum_rank is only
  // valid within each ingest batch and cannot be trusted for cross-batch ordering.
  const sortedSkaters = [...skaters].sort((a, b) => (b.composite_ppm ?? 0) - (a.composite_ppm ?? 0));
  sortedSkaters.forEach((s, i) => { s.momentum_rank = i + 1; });

  const top100 = sortedSkaters.slice(0, 100);
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
  // NHL API and model version can run in parallel
  const [games, activeModel] = await Promise.all([
    getGamesByDate(date),
    latestModelVersion(),
  ]);
  const gameIds = (games as { id: number }[]).map(g => g.id);
  const { data: predictions } = await supabaseAdmin
    .from('predictions')
    .select('*, prediction_outcomes(*)')
    .in('game_id', gameIds)
    .eq('model_version', activeModel);
  return { games, predictions };
}

// ─── Player ───────────────────────────────────────────────────────────────────

export async function fetchPlayer(id: string) {
  // Player info, metric timeline, and recent game stats are all independent
  const [
    { data: player, error: pErr },
    { data: metricTimelineDesc },
    { data: rawGameStats },
  ] = await Promise.all([
    supabaseAdmin
      .from('players')
      .select('*, teams(id, abbrev, name, logo_url)')
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('player_metric_snapshots')
      .select('*')
      .eq('player_id', id)
      .order('calculated_at', { ascending: false })
      .limit(30),
    supabaseAdmin
      .from('game_player_stats')
      .select('*')
      .eq('player_id', id)
      .order('recorded_at', { ascending: false })
      .limit(10),
  ]);

  if (pErr) throw pErr;

  // Newest first → reverse for timeline chart
  const metricTimeline = (metricTimelineDesc ?? []).slice().reverse();

  // Enrich game stats with game metadata (depends on rawGameStats result)
  let recentGames = rawGameStats ?? [];
  if (recentGames.length > 0) {
    const gameIds = recentGames.map((g: { game_id: number }) => g.game_id);
    const { data: gameRows } = await supabaseAdmin
      .from('games')
      .select(`
        id, game_date, home_score, away_score, home_team_id, away_team_id,
        home_team:teams!games_home_team_id_fkey(abbrev),
        away_team:teams!games_away_team_id_fkey(abbrev)
      `)
      .in('id', gameIds);
    const gameMap = new Map((gameRows ?? []).map((g: { id: number }) => [g.id, g]));
    recentGames = recentGames.map((g: { game_id: number }) => ({ ...g, games: gameMap.get(g.game_id) ?? null }));
  }

  return { player, metricTimeline, recentGames };
}

// ─── Accuracy ─────────────────────────────────────────────────────────────────

export async function fetchAccuracy(modelVersion?: string) {
  const VERSIONS_TO_FETCH = modelVersion
    ? [modelVersion]
    : ['v1.0', 'v1.1', 'v1.2', 'v1.3', 'v1.4', 'v1.5', 'v1.6', 'v1.7'];

  // Fetch model versions metadata + all per-version prediction queries in parallel
  const [{ data: accuracy, error: accErr }, ...versionResults] = await Promise.all([
    supabaseAdmin
      .from('model_versions')
      .select('version, description, created_at, is_active'),
    ...VERSIONS_TO_FETCH.map(v =>
      supabaseAdmin
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
        .eq('model_version', v)
        .order('created_at', { ascending: false })
        .limit(500)
    ),
  ]);

  if (accErr) throw accErr;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predictions: any[] = versionResults.flatMap(r => r.data ?? []);

  const stats: Record<string, {
    total: number; withOutcome: number; correctWinner: number;
    totalHomeErr: number; totalAwayErr: number;
  }> = {};

  for (const p of predictions) {
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

// ─── Team ─────────────────────────────────────────────────────────────────────

export async function fetchTeam(id: string) {
  const { data: team, error } = await supabaseAdmin
    .from('teams')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  // Roster, games, and external API calls are all independent — run in parallel
  const [
    { data: players },
    { data: recentGames },
    { data: upcoming },
    seasonStatsResult,
    standingResult,
  ] = await Promise.all([
    supabaseAdmin
      .from('player_metric_snapshots')
      .select(`
        player_id, momentum_rank, composite_ppm, momentum_ppm, season_ppm, breakout_delta,
        energy_bar, momentum_goals, momentum_assists, momentum_points,
        players!inner ( id, first_name, last_name, position_code, headshot_url, injury_status, team_id )
      `)
      .eq('players.team_id', team.id)
      .order('calculated_at', { ascending: false })
      .limit(500),
    supabaseAdmin
      .from('games')
      .select(`
        id, game_date, home_score, away_score, game_state,
        home_team:teams!games_home_team_id_fkey ( id, abbrev ),
        away_team:teams!games_away_team_id_fkey ( id, abbrev )
      `)
      .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
      .in('game_state', ['FINAL', 'OFF'])
      .order('game_date', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('games')
      .select(`
        id, game_date, start_time_utc, game_state,
        home_team:teams!games_home_team_id_fkey ( id, abbrev ),
        away_team:teams!games_away_team_id_fkey ( id, abbrev )
      `)
      .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
      .in('game_state', ['FUT', 'PRE', 'LIVE', 'CRIT'])
      .order('game_date', { ascending: true })
      .limit(5),
    getTeamSeasonStats(team.abbrev).catch(() => null),
    getStandings(new Date().toISOString().slice(0, 10))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((s: any) => (s.standings as any[])?.find((st: any) => st.teamAbbrev?.default === team.abbrev) ?? null)
      .catch(() => null),
  ]);

  // Deduplicate roster — latest snapshot per player
  const seen = new Set<number>();
  const roster = (players ?? []).filter(p => {
    if (seen.has(p.player_id)) return false;
    seen.add(p.player_id);
    return true;
  }).sort((a, b) => (b.composite_ppm ?? 0) - (a.composite_ppm ?? 0));

  return { team, roster, recentGames, upcoming, seasonStats: seasonStatsResult, standing: standingResult };
}

// ─── Match ────────────────────────────────────────────────────────────────────

export async function fetchMatch(id: string) {
  // Game record, live NHL data, and model version can all start at once
  const [{ data: game }, liveData, activeModel] = await Promise.all([
    supabaseAdmin
      .from('games')
      .select(`
        *,
        home_team:teams!games_home_team_id_fkey ( id, abbrev, name ),
        away_team:teams!games_away_team_id_fkey ( id, abbrev, name )
      `)
      .eq('id', id)
      .single(),
    getGameBoxscore(Number(id)).catch(() => null),
    latestModelVersion(),
  ]);

  // All DB reads are now independent — run in parallel
  const [
    { data: predictions },
    { data: snapshots },
    { data: playerStats },
    { data: goalieStats },
  ] = await Promise.all([
    supabaseAdmin
      .from('predictions')
      .select('*, prediction_outcomes(*)')
      .eq('game_id', id)
      .eq('model_version', activeModel)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('game_team_snapshots')
      .select('*')
      .eq('game_id', id),
    supabaseAdmin
      .from('game_player_stats')
      .select('*, players(first_name, last_name, position_code, headshot_url)')
      .eq('game_id', id)
      .order('goals', { ascending: false }),
    supabaseAdmin
      .from('game_goalie_stats')
      .select('*, players(first_name, last_name)')
      .eq('game_id', id),
  ]);

  return { game, liveData, predictions, snapshots, playerStats, goalieStats };
}
