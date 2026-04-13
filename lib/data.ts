// Shared data-fetching functions used by both API routes and server components.
// Pages should call these directly — never fetch their own API over HTTP.

import { supabaseAdmin } from '@/lib/supabase';
import { getGamesByDate, getGameBoxscore, getStandings, getTeamSeasonStats } from '@/lib/nhl-api';
export { deriveOutStatus, daysAgo } from '@/lib/player-status';
import { daysAgo } from '@/lib/player-status';

// NHL CDN logo URL — works for all 32 teams
export function teamLogoUrl(abbrev: string) {
  return `https://assets.nhle.com/logos/nhl/svg/${abbrev}_light.svg`;
}

// Returns the active model version string.
// Used to pin all UI prediction queries to the current active model.
async function latestModelVersion(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('model_versions')
    .select('version')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data?.version ?? 'v1.7';
}

// ─── League Averages ──────────────────────────────────────────────────────────

export async function fetchLeagueAverages() {
  // Latest snapshot per active skater — limit 1500 covers all ~650 non-goalie players
  const { data } = await supabaseAdmin
    .from('player_metric_snapshots')
    .select(`
      player_id, season_ppm, momentum_ppm,
      season_goals, season_games, season_assists, season_shooting_pct,
      energy_bar,
      players!inner(position_code)
    `)
    .eq('players.is_active', true)
    .neq('players.position_code', 'G')
    .order('calculated_at', { ascending: false })
    .limit(1500);

  // Deduplicate to latest per player
  const seen = new Set<number>();
  const latest = (data ?? []).filter(r => {
    if (seen.has(r.player_id)) return false;
    seen.add(r.player_id);
    return true;
  });

  const n = latest.length || 1;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avg = (fn: (r: any) => number) => latest.reduce((s, r) => s + fn(r), 0) / n;

  return {
    seasonPpm:      avg(r => r.season_ppm ?? 0),
    momentumPpm:    avg(r => r.momentum_ppm ?? 0),
    goalsPerGame:   avg(r => (r.season_goals ?? 0) / Math.max(1, r.season_games ?? 1)),
    assistsPerGame: avg(r => (r.season_assists ?? 0) / Math.max(1, r.season_games ?? 1)),
    shootingPct:    avg(r => r.season_shooting_pct ?? 0),
    energyBar:      avg(r => r.energy_bar ?? 100),
    playerCount:    n,
  };
}

// ─── Out Status ───────────────────────────────────────────────────────────────

/** Returns Map<playerId, lastGameDate> for the given player IDs. */
async function getLastPlayedDates(playerIds: number[]): Promise<Map<number, string>> {
  if (!playerIds.length) return new Map();
  // Fetch recent stats sorted by game_id desc — newest first, dedup per player in JS
  const { data: stats } = await supabaseAdmin
    .from('game_player_stats')
    .select('player_id, game_id')
    .in('player_id', playerIds)
    .order('game_id', { ascending: false })
    .limit(playerIds.length * 4);

  const lastGameId = new Map<number, number>();
  for (const row of stats ?? []) {
    if (!lastGameId.has(row.player_id)) lastGameId.set(row.player_id, row.game_id);
  }

  const gameIds = [...new Set(lastGameId.values())];
  if (!gameIds.length) return new Map();

  const { data: games } = await supabaseAdmin
    .from('games')
    .select('id, game_date')
    .in('id', gameIds);

  const dateById = new Map((games ?? []).map(g => [g.id, g.game_date as string]));
  const result = new Map<number, string>();
  for (const [pid, gid] of lastGameId) {
    const date = dateById.get(gid);
    if (date) result.set(pid, date);
  }
  return result;
}


// ─── Rankings ─────────────────────────────────────────────────────────────────

export async function fetchRankings() {
  const { data, error } = await supabaseAdmin
    .from('player_metric_snapshots')
    .select(`
      player_id, momentum_rank, composite_ppm, momentum_ppm, season_ppm,
      breakout_delta, energy_bar,
      momentum_games, momentum_goals, momentum_assists, momentum_points,
      momentum_shooting_pct, momentum_toi_sec,
      season_games, season_goals, season_assists, season_points,
      season_shooting_pct, season_toi_sec,
      sos_coefficient, calculated_at,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latest = (data as any[] ?? []).filter((row: any) => {
    if (seen.has(row.player_id)) return false;
    seen.add(row.player_id);
    return true;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skaters = latest.filter((r: any) => r.players?.position_code !== 'G');

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
    .slice(0, 10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goalies = latest.filter((r: any) => r.players?.position_code === 'G');
  const momentumLeaderGoalies = [...goalies]
    .sort((a, b) => (b.momentum_ppm ?? 0) - (a.momentum_ppm ?? 0))
    .slice(0, 5);

  // Compute last-played date AND consecutive games missed for all skaters.
  // Strategy: (1) get last game_id per player from game_player_stats,
  // (2) fetch recent completed games for all teams, (3) for each player
  // count team games with game_id > player's last game_id.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allSkaterIds = sortedSkaters.map((s: any) => s.player_id);

  // Step 1: last game_id per player (top 1000 rows covers ~25 most recent games)
  const { data: recentStats } = await supabaseAdmin
    .from('game_player_stats')
    .select('player_id, game_id')
    .in('player_id', allSkaterIds)
    .order('game_id', { ascending: false })
    .limit(1000);

  const lastGameIdByPlayer = new Map<number, number>();
  for (const row of recentStats ?? []) {
    if (!lastGameIdByPlayer.has(row.player_id)) lastGameIdByPlayer.set(row.player_id, row.game_id);
  }

  // Step 2: recent completed games for all teams (last ~45 days covers 15+ games per team)
  const sinceDate = new Date(Date.now() - 45 * 86_400_000).toISOString().slice(0, 10);
  const { data: recentTeamGames } = await supabaseAdmin
    .from('games')
    .select('id, game_date, home_team_id, away_team_id')
    .in('game_state', ['FINAL', 'OFF'])
    .gte('game_date', sinceDate)
    .order('game_id', { ascending: false })
    .limit(500);

  // Group games by team_id
  const teamGameIds = new Map<number, number[]>(); // team_id → sorted game_ids desc
  for (const g of recentTeamGames ?? []) {
    for (const tid of [g.home_team_id, g.away_team_id]) {
      if (!teamGameIds.has(tid)) teamGameIds.set(tid, []);
      teamGameIds.get(tid)!.push(g.id);
    }
  }

  // Fetch game dates for last-played date lookup
  const lastGameIds = [...new Set(lastGameIdByPlayer.values())];
  const { data: lastGameDates } = lastGameIds.length
    ? await supabaseAdmin.from('games').select('id, game_date').in('id', lastGameIds)
    : { data: [] };
  const gameDateById = new Map((lastGameDates ?? []).map(g => [g.id, g.game_date as string]));

  // Step 3: attach last_played_date + consecutive_games_missed to each skater
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const s of sortedSkaters as Array<{ player_id: number; last_played_date?: string | null; consecutive_games_missed?: number; players: { team_id: number | null } }>) {
    const lastGid = lastGameIdByPlayer.get(s.player_id);
    s.last_played_date = lastGid ? (gameDateById.get(lastGid) ?? null) : null;
    const teamGids = teamGameIds.get(s.players?.team_id ?? 0) ?? [];
    // Count team games that happened after (higher game_id than) player's last game
    s.consecutive_games_missed = lastGid
      ? teamGids.filter(gid => gid > lastGid).length
      : teamGids.length; // never played → all recent team games = missed
  }

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
  const [{ data: allPredictions }, { data: odds }] = await Promise.all([
    supabaseAdmin
      .from('predictions')
      .select('*, prediction_outcomes(*)')
      .in('game_id', gameIds)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('external_odds')
      .select('*')
      .in('game_id', gameIds)
      .order('fetched_at', { ascending: false }),
  ]);

  // Deduplicate: one prediction per game, prefer active model over older versions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predByGame = new Map<number, any>();
  for (const p of (allPredictions ?? [])) {
    const existing = predByGame.get(p.game_id);
    if (!existing || p.model_version === activeModel) {
      predByGame.set(p.game_id, p);
    }
  }
  const predictions = Array.from(predByGame.values());

  return { games, predictions, odds };
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
      .select(`
        *, teams(id, abbrev, name, logo_url),
        birth_date, birth_city, birth_state_province, birth_country,
        height_inches, weight_pounds, shoots_catches,
        draft_year, draft_round, draft_pick, draft_team_abbrev,
        career_games, career_goals, career_assists, career_points, career_plus_minus
      `)
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
      .order('game_id', { ascending: false })
      .limit(20),
  ]);

  if (pErr) throw pErr;

  // Newest first → reverse for timeline chart
  const metricTimeline = (metricTimelineDesc ?? []).slice().reverse();

  // Enrich game stats with game metadata (depends on rawGameStats result)
  let recentGames = rawGameStats ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let teamRecentGames: any[] = [];
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
    teamRecentGames = (gameRows ?? []);
  }

  // Fetch team's last 10 completed games to detect how many the player missed
  const teamId = player?.team_id ?? (player as { teams?: { id?: number } })?.teams?.id ?? null;
  if (teamId) {
    const { data: tgRows } = await supabaseAdmin
      .from('games')
      .select('id, game_date')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .in('game_state', ['FINAL', 'OFF'])
      .order('game_date', { ascending: false })
      .limit(15);
    teamRecentGames = tgRows ?? [];
  }

  const playerGameIds = new Set(recentGames.map((g: { game_id: number }) => g.game_id));
  const lastPlayedDate: string | null = recentGames.length > 0
    ? (recentGames[0]?.games?.game_date ?? null)
    : null;

  // Count consecutive games missed from the most recent team game backward
  const teamGamesSorted = [...teamRecentGames].sort(
    (a: { game_date: string }, b: { game_date: string }) => b.game_date.localeCompare(a.game_date)
  );
  let consecutiveGamesMissed = 0;
  for (const g of teamGamesSorted) {
    if (playerGameIds.has(g.id)) break;
    consecutiveGamesMissed++;
  }

  return { player, metricTimeline, recentGames, consecutiveGamesMissed, lastPlayedDate };
}

// ─── Accuracy ─────────────────────────────────────────────────────────────────

export async function fetchAccuracy(modelVersion?: string) {
  const VERSIONS_TO_FETCH = modelVersion
    ? [modelVersion]
    : ['v1.0', 'v1.1', 'v1.2', 'v1.3', 'v1.4', 'v1.5', 'v1.6', 'v1.7'];

  // Fetch model versions metadata + all predictions in a single query
  const [{ data: accuracy, error: accErr }, { data: rawPredictions }] = await Promise.all([
    supabaseAdmin
      .from('model_versions')
      .select('version, description, created_at, is_active'),
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
      .in('model_version', VERSIONS_TO_FETCH)
      .order('created_at', { ascending: false })
      .limit(4000),
  ]);

  if (accErr) throw accErr;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predictions: any[] = rawPredictions ?? [];

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

  // Compute consecutive games missed per player using team's recent game list
  const rosterPlayerIds = roster.map(p => p.player_id);
  const teamGameIds = (recentGames ?? []).map((g: { id: number }) => g.id);
  const { data: recentPlayerStats } = teamGameIds.length
    ? await supabaseAdmin
        .from('game_player_stats')
        .select('player_id, game_id')
        .in('player_id', rosterPlayerIds)
        .in('game_id', teamGameIds)
    : { data: [] };

  // Build set of game IDs each player appeared in
  const playerGameSets = new Map<number, Set<number>>();
  for (const row of recentPlayerStats ?? []) {
    if (!playerGameSets.has(row.player_id)) playerGameSets.set(row.player_id, new Set());
    playerGameSets.get(row.player_id)!.add(row.game_id);
  }

  // Team games sorted newest first for consecutive count
  const teamGamesSorted = [...(recentGames ?? [])].sort(
    (a: { game_date: string }, b: { game_date: string }) => b.game_date.localeCompare(a.game_date)
  );

  const rosterWithOutStatus = roster.map(p => {
    const appeared = playerGameSets.get(p.player_id) ?? new Set();
    let consecutive = 0;
    for (const g of teamGamesSorted) {
      if (appeared.has(g.id)) break;
      consecutive++;
    }
    return { ...p, consecutive_games_missed: consecutive };
  });

  return { team, roster: rosterWithOutStatus, recentGames, upcoming, seasonStats: seasonStatsResult, standing: standingResult };
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
    { data: allPredictions },
    { data: snapshots },
    { data: playerStats },
    { data: goalieStats },
    { data: externalOdds },
  ] = await Promise.all([
    supabaseAdmin
      .from('predictions')
      .select('*, prediction_outcomes(*)')
      .eq('game_id', id)
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
    supabaseAdmin
      .from('external_odds')
      .select('*')
      .eq('game_id', id)
      .order('fetched_at', { ascending: false }),
  ]);

  // Sort: active model version first, fall back to most recent if active model has no prediction
  const predictions = (allPredictions ?? []).sort((a, b) => {
    if (a.model_version === activeModel && b.model_version !== activeModel) return -1;
    if (b.model_version === activeModel && a.model_version !== activeModel) return 1;
    return 0;
  });

  return { game, liveData, predictions, snapshots, playerStats, goalieStats, externalOdds };
}
