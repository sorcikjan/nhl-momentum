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

let _modelVersionCache: { version: string; ts: number } | null = null;
let _playoffTeamsCache: { teams: Set<number>; ts: number } | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _leagueAveragesCache: { data: any; ts: number } | null = null;

// Returns the active model version string.
// Module-level cache avoids a DB round trip on every request that touches predictions.
async function latestModelVersion(): Promise<string> {
  const now = Date.now();
  if (_modelVersionCache && now - _modelVersionCache.ts < 5 * 60_000) {
    return _modelVersionCache.version;
  }
  const { data } = await supabaseAdmin
    .from('model_versions')
    .select('version')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  const version = data?.version ?? 'v1.7';
  _modelVersionCache = { version, ts: now };
  return version;
}

// ─── League Averages ──────────────────────────────────────────────────────────

export async function fetchLeagueAverages() {
  const now = Date.now();
  if (_leagueAveragesCache && now - _leagueAveragesCache.ts < 30 * 60_000) {
    return _leagueAveragesCache.data;
  }
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

  const result = {
    seasonPpm:      avg(r => r.season_ppm ?? 0),
    momentumPpm:    avg(r => r.momentum_ppm ?? 0),
    goalsPerGame:   avg(r => (r.season_goals ?? 0) / Math.max(1, r.season_games ?? 1)),
    assistsPerGame: avg(r => (r.season_assists ?? 0) / Math.max(1, r.season_games ?? 1)),
    shootingPct:    avg(r => r.season_shooting_pct ?? 0),
    energyBar:      avg(r => r.energy_bar ?? 100),
    playerCount:    n,
  };
  _leagueAveragesCache = { data: result, ts: now };
  return result;
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
        headshot_url, injury_status, sweater_number, in_minors, birth_country,
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

  // During playoffs, only show players whose team is still active.
  const playoffTeams = await fetchPlayoffActiveTeams();
  const isPlayoffs = playoffTeams.size > 0;

  // Layer 1 stability: require at least 10 season games so all derived lists
  // are built from players with a meaningful seasonal baseline.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skaters = latest.filter((r: any) =>
    r.players?.position_code !== 'G' &&
    (r.season_games ?? 0) >= 10 &&
    (!isPlayoffs || playoffTeams.has(r.players?.team_id))
  );

  // Rank globally by composite_ppm at query time — stored momentum_rank is only
  // valid within each ingest batch and cannot be trusted for cross-batch ordering.
  const sortedSkaters = [...skaters].sort((a, b) => (b.composite_ppm ?? 0) - (a.composite_ppm ?? 0));
  sortedSkaters.forEach((s, i) => { s.momentum_rank = i + 1; });

  const top100 = sortedSkaters.slice(0, 100);
  const breakoutWatch = [...skaters]
    .sort((a, b) => (b.breakout_delta ?? 0) - (a.breakout_delta ?? 0))
    .slice(0, 10);
  // Layer 2: momentum window floor — at least 3 of last 5 games played.
  const momentumLeaderSkaters = [...skaters]
    .filter((r: any) => (r.momentum_games ?? 0) >= 3)
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

  // Step 1: last game_id per player.
  // Chunked into groups of 50 × limit 250 = safely under Supabase's 1000-row cap.
  // All chunks fire in parallel alongside the recentTeamGames query (step 2).
  const lastGameIdByPlayer = new Map<number, number>();
  const STAT_CHUNK = 50;
  const sinceDate = new Date(Date.now() - 45 * 86_400_000).toISOString().slice(0, 10);

  const chunkPromises = [];
  for (let ci = 0; ci < allSkaterIds.length; ci += STAT_CHUNK) {
    const chunk = allSkaterIds.slice(ci, ci + STAT_CHUNK);
    chunkPromises.push(
      (async () => {
        const { data } = await supabaseAdmin
          .from('game_player_stats')
          .select('player_id, game_id')
          .in('player_id', chunk)
          .order('game_id', { ascending: false })
          .limit(chunk.length * 5);
        return data ?? [];
      })()
    );
  }

  // Step 2: recent completed games for all teams — run in parallel with step 1 chunks.
  // NOTE: the games table PK is `id`, not `game_id`.
  const [allChunkData, { data: recentTeamGames }] = await Promise.all([
    Promise.all(chunkPromises),
    supabaseAdmin
      .from('games')
      .select('id, game_date, home_team_id, away_team_id')
      .in('game_state', ['FINAL', 'OFF'])
      .gte('game_date', sinceDate)
      .order('id', { ascending: false })
      .limit(700),
  ]);

  for (const chunkStats of allChunkData) {
    for (const row of chunkStats) {
      if (!lastGameIdByPlayer.has(row.player_id)) lastGameIdByPlayer.set(row.player_id, row.game_id);
    }
  }

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

// Recent completed games from the DB — used on the homepage "Last Night" section.
// Returns up to `limit` games from the past `days` days, newest first.
// Also returns one prediction per game (active model preferred).
export async function fetchRecentCompletedGames(days = 3, limit = 20) {
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const { data: games } = await supabaseAdmin
    .from('games')
    .select(`
      id, game_date, home_score, away_score, game_state,
      home_team:teams!games_home_team_id_fkey(id, abbrev, name),
      away_team:teams!games_away_team_id_fkey(id, abbrev, name)
    `)
    .gte('game_date', since)
    .in('game_state', ['FINAL', 'OFF'])
    .order('game_date', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  if (!games?.length) return { games: [], predMap: new Map() };

  const gameIds = games.map(g => g.id);
  const activeModel = await latestModelVersion();

  const { data: preds } = await supabaseAdmin
    .from('predictions')
    .select('game_id, home_win_probability, predicted_home_score, predicted_away_score, model_version, prediction_outcomes(correct_winner)')
    .in('game_id', gameIds)
    .order('created_at', { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predMap = new Map<number, any>();
  for (const p of (preds ?? [])) {
    const existing = predMap.get(p.game_id);
    if (!existing || p.model_version === activeModel) predMap.set(p.game_id, p);
  }

  return { games, predMap };
}

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

export type GoalieAgg = {
  gp: number; wins: number; losses: number; otl: number;
  shotsAgainst: number; goalsAgainst: number; savePct: number;
  toiSeconds: number; gaa: number;
};

export async function fetchPlayer(id: string) {
  // Fetch player info first — position_code determines which stats table to query
  const { data: player, error: pErr } = await supabaseAdmin
    .from('players')
    .select(`
      *, teams(id, abbrev, name, logo_url),
      birth_date, birth_city, birth_state_province, birth_country,
      height_inches, weight_pounds, shoots_catches,
      draft_year, draft_round, draft_pick, draft_team_abbrev,
      career_games, career_goals, career_assists, career_points, career_plus_minus
    `)
    .eq('id', id)
    .single();

  if (pErr) throw pErr;

  const isGoalie = player?.position_code === 'G';

  // Metric timeline and game stats are independent of each other
  const [{ data: metricTimelineDesc }, { data: rawGameStats }] = await Promise.all([
    supabaseAdmin
      .from('player_metric_snapshots')
      .select('*')
      .eq('player_id', id)
      .order('calculated_at', { ascending: false })
      .limit(30),
    isGoalie
      ? supabaseAdmin
          .from('game_goalie_stats')
          .select('game_id, save_pct, goals_against, shots_against, toi_seconds, decision')
          .eq('player_id', id)
          .order('game_id', { ascending: false })
          .limit(82) // full regular season + playoffs
      : supabaseAdmin
          .from('game_player_stats')
          .select('*')
          .eq('player_id', id)
          .order('game_id', { ascending: false })
          .limit(20),
  ]);

  // Newest first → reverse for timeline chart
  const metricTimeline = (metricTimelineDesc ?? []).slice().reverse();

  // Enrich game stats with game metadata, and fetch team recent games for scratch detection.
  // These are independent — teamId is known from the player record, game IDs from rawGameStats.
  let recentGames = rawGameStats ?? [];
  const teamId = player?.team_id ?? (player as { teams?: { id?: number } })?.teams?.id ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [gameRows, tgRows]: [any[], any[]] = await Promise.all([
    recentGames.length > 0
      ? (async () => {
          const { data } = await supabaseAdmin
            .from('games')
            .select(`
              id, game_date, home_score, away_score, home_team_id, away_team_id,
              home_team:teams!games_home_team_id_fkey(abbrev),
              away_team:teams!games_away_team_id_fkey(abbrev)
            `)
            .in('id', recentGames.map((g: { game_id: number }) => g.game_id));
          return data ?? [];
        })()
      : Promise.resolve([]),
    teamId
      ? (async () => {
          const { data } = await supabaseAdmin
            .from('games')
            .select('id, game_date')
            .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
            .in('game_state', ['FINAL', 'OFF'])
            .order('game_date', { ascending: false })
            .limit(15);
          return data ?? [];
        })()
      : Promise.resolve([]),
  ]);

  const gameMap = new Map(gameRows.map((g: { id: number }) => [g.id, g]));
  recentGames = recentGames.map((g: { game_id: number }) => ({ ...g, games: gameMap.get(g.game_id) ?? null }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamRecentGames: any[] = tgRows.length > 0 ? tgRows : gameRows;

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

  // Goalie season + recent aggregates (computed from all fetched game_goalie_stats rows)
  let goalieStats: { season: GoalieAgg; recent: GoalieAgg } | null = null;
  if (isGoalie && rawGameStats && rawGameStats.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agg = (rows: any[]): GoalieAgg => {
      const gp = rows.length;
      const wins = rows.filter(r => r.decision === 'W' || r.decision === 'SOW').length;
      const losses = rows.filter(r => r.decision === 'L').length;
      const otl = rows.filter(r => r.decision === 'O' || r.decision === 'OT' || r.decision === 'SOL').length;
      const shotsAgainst = rows.reduce((s: number, r: { shots_against?: number }) => s + (r.shots_against ?? 0), 0);
      const goalsAgainst = rows.reduce((s: number, r: { goals_against?: number }) => s + (r.goals_against ?? 0), 0);
      const savePct = gp > 0 ? rows.reduce((s: number, r: { save_pct?: number }) => s + (r.save_pct ?? 0), 0) / gp : 0;
      const toiSeconds = rows.reduce((s: number, r: { toi_seconds?: number }) => s + (r.toi_seconds ?? 0), 0);
      const gaa = toiSeconds > 0 ? goalsAgainst / (toiSeconds / 3600) : 0;
      return { gp, wins, losses, otl, shotsAgainst, goalsAgainst, savePct, toiSeconds, gaa };
    };
    goalieStats = {
      season: agg(rawGameStats),
      recent: agg(rawGameStats.slice(0, 5)),
    };
  }

  return { player, metricTimeline, recentGames, consecutiveGamesMissed, lastPlayedDate, goalieStats };
}

// ─── Nightly Story Data ───────────────────────────────────────────────────────

export async function fetchNightlyStoryData(date: string) {
  const { data: games } = await supabaseAdmin
    .from('games')
    .select(`
      id, game_date, home_score, away_score,
      home_team:teams!games_home_team_id_fkey(abbrev),
      away_team:teams!games_away_team_id_fkey(abbrev)
    `)
    .eq('game_date', date)
    .in('game_state', ['FINAL', 'OFF']);

  if (!games?.length) return null;

  const gameIds = games.map((g: { id: number }) => g.id);

  const { data: stats } = await supabaseAdmin
    .from('game_player_stats')
    .select(`
      player_id, game_id, goals, assists, plus_minus, toi_seconds,
      players(first_name, last_name, position_code),
      teams(abbrev)
    `)
    .in('game_id', gameIds)
    .neq('players.position_code', 'G');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sorted = (stats as any[] ?? [])
    .filter(s => s.players)
    .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))
    .slice(0, 10);

  return { games, topPerformers: sorted };
}

// ─── Playoff utilities ────────────────────────────────────────────────────────

function isPlayoffGameId(id: number): boolean {
  return Math.floor(id / 10000) % 100 === 3;
}

function parsePlayoffGameId(id: number): { round: number; series: number; gameInSeries: number } {
  const suffix = id % 10000;
  return { round: Math.floor(suffix / 100), series: Math.floor((suffix % 100) / 10), gameInSeries: suffix % 10 };
}

export interface SeriesInfo {
  round: number;
  seriesNum: number;
  awayTeam: { id: number; abbrev: string; name: string };
  homeTeam: { id: number; abbrev: string; name: string };
  awayWins: number;
  homeWins: number;
  totalPlayed: number;
  isComplete: boolean;
  nextGame: { id: number; game_date: string; start_time_utc: string | null } | null;
}

export async function fetchPlayoffActiveTeams(): Promise<Set<number>> {
  const now = Date.now();
  if (_playoffTeamsCache && now - _playoffTeamsCache.ts < 5 * 60_000) {
    return _playoffTeamsCache.teams;
  }
  const { data } = await supabaseAdmin
    .from('games').select('id, home_team_id, away_team_id').eq('game_state', 'FUT').limit(300);
  const active = new Set<number>();
  for (const g of data ?? []) {
    if (isPlayoffGameId(g.id)) { active.add(g.home_team_id); active.add(g.away_team_id); }
  }
  _playoffTeamsCache = { teams: active, ts: now };
  return active;
}

export async function fetchSeriesStandings(): Promise<Map<string, SeriesInfo>> {
  const now = new Date();
  const seasonYear = now.getMonth() < 8 ? now.getFullYear() - 1 : now.getFullYear();
  const idMin = seasonYear * 1000000 + 30000;
  const idMax = seasonYear * 1000000 + 39999;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await supabaseAdmin
    .from('games')
    .select(`id, home_score, away_score, game_state, game_date, start_time_utc,
      home_team:teams!games_home_team_id_fkey(id, abbrev, name),
      away_team:teams!games_away_team_id_fkey(id, abbrev, name)`)
    .gte('id', idMin).lte('id', idMax).order('id');

  const map = new Map<string, SeriesInfo>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const g of (data ?? []) as any[]) {
    const { round, series } = parsePlayoffGameId(g.id);
    const key = `${round}-${series}`;
    if (!map.has(key)) {
      map.set(key, { round, seriesNum: series, awayTeam: g.away_team, homeTeam: g.home_team,
        awayWins: 0, homeWins: 0, totalPlayed: 0, isComplete: false, nextGame: null });
    }
    const s = map.get(key)!;
    if (g.game_state === 'FINAL' || g.game_state === 'OFF') {
      s.totalPlayed++;
      if ((g.away_score ?? 0) > (g.home_score ?? 0)) s.awayWins++; else s.homeWins++;
      if (s.awayWins === 4 || s.homeWins === 4) s.isComplete = true;
    } else if (g.game_state === 'FUT' && !s.nextGame) {
      s.nextGame = { id: g.id, game_date: g.game_date, start_time_utc: g.start_time_utc ?? null };
    }
  }
  return map;
}

// ─── Daily Recap Data ─────────────────────────────────────────────────────────

export async function fetchRecapData(date: string) {
  const modelVersion = await latestModelVersion();

  // Step 1: games for the date
  const { data: games } = await supabaseAdmin
    .from('games')
    .select(`
      id, game_date, home_score, away_score, youtube_highlight_id,
      venue, start_time_utc, three_stars, team_game_stats,
      home_team:teams!games_home_team_id_fkey(id, abbrev, name, logo_url),
      away_team:teams!games_away_team_id_fkey(id, abbrev, name, logo_url)
    `)
    .eq('game_date', date)
    .in('game_state', ['FINAL', 'OFF']);

  if (!games?.length) return null;

  const gameIds = games.map((g: { id: number }) => g.id);

  // Step 2: all game-ID-dependent queries in parallel.
  // Predictions now filtered to this date's games only (was fetching the full season).
  const [
    { data: predictions },
    { data: stats },
    { data: goalieStats },
  ] = await Promise.all([
    supabaseAdmin
      .from('predictions')
      .select('game_id, home_win_probability, predicted_home_score, predicted_away_score, prediction_outcomes(correct_winner, actual_home_score, actual_away_score)')
      .eq('model_version', modelVersion)
      .in('game_id', gameIds),
    supabaseAdmin
      .from('game_player_stats')
      .select(`
        player_id, game_id, goals, assists, plus_minus, toi_seconds, shots_on_goal,
        players(first_name, last_name, position_code, headshot_url),
        teams(id, abbrev, name)
      `)
      .in('game_id', gameIds)
      .neq('players.position_code', 'G'),
    supabaseAdmin
      .from('game_goalie_stats')
      .select(`player_id, game_id, goals_against, saves: shots_against, toi_seconds, decision, players(first_name, last_name), teams(abbrev)`)
      .in('game_id', gameIds)
      .eq('goals_against', 0)
      .gt('toi_seconds', 3000), // at least 50 min — full game
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predMap = new Map<number, any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (predictions ?? []) as any[]) {
    predMap.set(p.game_id, p);
  }

  // Top skater performers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topPerformers = (stats as any[] ?? [])
    .filter(s => s.players)
    .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))
    .slice(0, 8);

  // Step 3: momentum snapshots for top performers
  const topIds = topPerformers.map((p: { player_id: number }) => p.player_id);
  const { data: snapshots } = topIds.length ? await supabaseAdmin
    .from('player_metric_snapshots')
    .select('player_id, momentum_ppm, season_ppm, momentum_rank')
    .in('player_id', topIds)
    .order('calculated_at', { ascending: false })
    .limit(topIds.length * 2) : { data: [] };

  const snapMap = new Map<number, { momentum_ppm: number; season_ppm: number; momentum_rank: number }>();
  for (const s of snapshots ?? []) {
    if (!snapMap.has(s.player_id)) snapMap.set(s.player_id, s);
  }

  // Step 4: series context — only for playoff games
  const seriesMap = new Map<number, string>(); // game_id → "Game N · X leads Y–Z" or "Game N · Tied Y–Y"
  if (games?.length && isPlayoffGameId((games as any[])[0]?.id)) {
    const allSeries = await fetchSeriesStandings();
    for (const g of (games as any[])) {
      const { round, series, gameInSeries } = parsePlayoffGameId(g.id);
      const s = allSeries.get(`${round}-${series}`);
      if (!s) continue;
      const awayW = s.awayWins - ((g.game_state === 'FINAL' || g.game_state === 'OFF') && (g.away_score ?? 0) > (g.home_score ?? 0) ? 1 : 0);
      const homeW = s.homeWins - ((g.game_state === 'FINAL' || g.game_state === 'OFF') && (g.home_score ?? 0) > (g.away_score ?? 0) ? 1 : 0);
      const label = awayW === homeW
        ? `Tied ${awayW}–${homeW}`
        : awayW > homeW
        ? `${s.awayTeam?.abbrev} leads ${awayW}–${homeW}`
        : `${s.homeTeam?.abbrev} leads ${homeW}–${awayW}`;
      seriesMap.set(g.id, `Game ${gameInSeries} · ${label}`);
    }
  }

  return {
    games,
    predMap,
    seriesMap,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    topPerformers: topPerformers.map((p: any) => ({
      ...p,
      snapshot: snapMap.get(p.player_id) ?? null,
    })),
    shutouts: goalieStats ?? [],
  };
}

export async function fetchRecentSoftSignals(withinHours = 48, limit = 15) {
  const since = new Date(Date.now() - withinHours * 3_600_000).toISOString();
  const { data } = await supabaseAdmin
    .from('soft_signals')
    .select('type, title, content, source, published_at')
    .gte('fetched_at', since)
    .order('published_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchNewsFeed(limit = 50) {
  const { data } = await supabaseAdmin
    .from('soft_signals')
    .select('id, type, title, content, url, source, published_at, fetched_at')
    .order('published_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchSignalById(id: number) {
  const { data } = await supabaseAdmin
    .from('soft_signals')
    .select('id, type, title, content, url, source, published_at, fetched_at')
    .eq('id', id)
    .single();
  return data ?? null;
}

export async function fetchRecentRecaps(limit = 30) {
  const { data } = await supabaseAdmin
    .from('daily_recaps')
    .select('date, title, summary, games_count, generated_at, hero_image_url')
    .order('date', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchRecap(date: string) {
  const { data } = await supabaseAdmin
    .from('daily_recaps')
    .select('*')
    .eq('date', date)
    .single();
  return data ?? null;
}

// ─── Accuracy ─────────────────────────────────────────────────────────────────

export async function fetchAccuracy() {
  const VERSIONS = ['v1.0', 'v1.1', 'v1.2', 'v1.3', 'v1.4', 'v1.5', 'v1.6', 'v1.7', 'v1.8'];

  // Three independent queries running in parallel:
  // 1. Model version metadata
  // 2. Total prediction counts per version (count-only — no row transfer, no limit issues)
  // 3. All outcome records joined to model_version (outcomes table is far smaller than
  //    predictions: ~1 row per completed game × 8 versions ≈ a few thousand rows max)
  // 4. Recent predictions for the per-game comparison table (most recent 100 games × 8 versions)
  const [
    { data: modelVersionsMeta, error: mvErr },
    predCounts,
    { data: outcomeRows },
    { data: recentPredRows },
  ] = await Promise.all([
    supabaseAdmin
      .from('model_versions')
      .select('version, description, created_at, is_active'),

    // Count total predictions per version without fetching rows
    Promise.all(
      VERSIONS.map(v =>
        supabaseAdmin
          .from('predictions')
          .select('*', { count: 'exact', head: true })
          .eq('model_version', v)
          .then(({ count }) => ({ version: v, total: count ?? 0 }))
      )
    ),

    // Fetch ALL outcome records with linked model_version — this is the authoritative
    // source for resolved predictions. With ~1 outcome per game per version,
    // limit 20000 covers 2500 completed games across all 8 versions with room to spare.
    supabaseAdmin
      .from('prediction_outcomes')
      .select(`
        correct_winner, home_score_error, away_score_error,
        predictions!inner ( model_version )
      `)
      .limit(20000),

    // Recent predictions for the comparison table — most recent 100 games only
    supabaseAdmin
      .from('predictions')
      .select(`
        id, game_id, model_version, predicted_home_score, predicted_away_score,
        home_win_probability, away_win_probability, created_at,
        prediction_outcomes (
          actual_home_score, actual_away_score,
          home_score_error, away_score_error, correct_winner
        ),
        games (
          game_date,
          home_team:teams!games_home_team_id_fkey ( abbrev ),
          away_team:teams!games_away_team_id_fkey ( abbrev )
        )
      `)
      .in('model_version', VERSIONS)
      .order('created_at', { ascending: false })
      .limit(900), // 100 games × 9 versions
  ]);

  if (mvErr) throw mvErr;

  // Build stats from outcome rows (accurate counts for the full season)
  const outcomeStats: Record<string, { withOutcome: number; correctWinner: number; totalHomeErr: number; totalAwayErr: number }> = {};
  for (const row of (outcomeRows ?? [])) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const version = (row.predictions as any)?.model_version;
    if (!version) continue;
    if (!outcomeStats[version]) outcomeStats[version] = { withOutcome: 0, correctWinner: 0, totalHomeErr: 0, totalAwayErr: 0 };
    outcomeStats[version].withOutcome++;
    if (row.correct_winner) outcomeStats[version].correctWinner++;
    outcomeStats[version].totalHomeErr += row.home_score_error ?? 0;
    outcomeStats[version].totalAwayErr += row.away_score_error ?? 0;
  }

  const modelStats = predCounts.map(({ version, total }) => {
    const o = outcomeStats[version] ?? { withOutcome: 0, correctWinner: 0, totalHomeErr: 0, totalAwayErr: 0 };
    return {
      version,
      totalPredictions: total,
      withOutcome: o.withOutcome,
      winnerAccuracyPct: o.withOutcome > 0
        ? Math.round((o.correctWinner / o.withOutcome) * 1000) / 10
        : null,
      avgHomeError: o.withOutcome > 0
        ? Math.round((o.totalHomeErr / o.withOutcome) * 100) / 100
        : null,
      avgAwayError: o.withOutcome > 0
        ? Math.round((o.totalAwayErr / o.withOutcome) * 100) / 100
        : null,
    };
  });

  return { modelVersions: modelVersionsMeta, predictions: recentPredRows ?? [], modelStats };
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
        players!inner ( id, first_name, last_name, position_code, headshot_url, injury_status, in_minors, team_id )
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

// ─── Pipeline Status ──────────────────────────────────────────────────────────
// Returns the most-recent timestamp for each pipeline stage — used on the
// homepage to let you quickly spot stale or broken sync jobs.

export async function fetchPipelineStatus() {
  const [gamelogs, metrics, predictions, outcomes, snapshots] = await Promise.all([
    supabaseAdmin.from('game_player_stats').select('recorded_at').order('recorded_at', { ascending: false }).limit(1).single(),
    supabaseAdmin.from('player_metric_snapshots').select('calculated_at').order('calculated_at', { ascending: false }).limit(1).single(),
    // Use input_snapshot->>'captured_at' — this is written on every upsert, unlike
    // created_at which Postgres never updates on a conflict-update.
    supabaseAdmin.from('predictions').select('input_snapshot').order('created_at', { ascending: false }).limit(1).single(),
    supabaseAdmin.from('prediction_outcomes').select('recorded_at').order('recorded_at', { ascending: false }).limit(1).single(),
    supabaseAdmin.from('game_team_snapshots').select('captured_at').order('captured_at', { ascending: false }).limit(1).single(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predTimestamp = (predictions.data?.input_snapshot as any)?.captured_at ?? null;

  return {
    gamelogs:    gamelogs.data?.recorded_at  ?? null,
    metrics:     metrics.data?.calculated_at ?? null,
    predictions: predTimestamp,
    outcomes:    outcomes.data?.recorded_at  ?? null,
    snapshots:   snapshots.data?.captured_at ?? null,
  };
}

// ─── Goalie Rankings ─────────────────────────────────────────────────────────

export async function fetchGoalieRankings() {
  const playoffTeams = await fetchPlayoffActiveTeams();
  const isPlayoffs = playoffTeams.size > 0;

  const { data: goalies } = await supabaseAdmin
    .from('players')
    .select('id, first_name, last_name, headshot_url, birth_country, team_id, teams(id, abbrev, name)')
    .eq('position_code', 'G')
    .eq('is_active', true);

  if (!goalies?.length) return [];

  const filteredGoalies = isPlayoffs
    ? goalies.filter(g => playoffTeams.has(g.team_id ?? 0))
    : goalies;

  const goalieIds = filteredGoalies.map(g => g.id);

  const { data: stats } = await supabaseAdmin
    .from('game_goalie_stats')
    .select('player_id, game_id, save_pct, goals_against, toi_seconds, decision, recorded_at')
    .in('player_id', goalieIds)
    .order('recorded_at', { ascending: false })
    .limit(goalieIds.length * 7);

  const statsByPlayer = new Map<number, typeof stats>();
  for (const s of stats ?? []) {
    const arr = statsByPlayer.get(s.player_id) ?? [];
    if (arr.length < 5) {
      arr.push(s);
      statsByPlayer.set(s.player_id, arr);
    }
  }

  return filteredGoalies
    .map(g => {
      const games = statsByPlayer.get(g.id) ?? [];
      if (games.length < 3) return null;
      const avgSavePct = games.reduce((sum, r) => sum + (r.save_pct ?? 0), 0) / games.length;
      const avgGAA     = games.reduce((sum, r) => sum + (r.goals_against ?? 0), 0) / games.length;
      const decisions  = games.map(r => r.decision as string | null).filter((d): d is string => !!d);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teams = (g as any).teams as { id: number; abbrev: string; name: string } | null;
      return {
        id: g.id,
        first_name: g.first_name,
        last_name: g.last_name,
        headshot_url: g.headshot_url,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        birth_country: (g as any).birth_country as string | null,
        team_id: g.team_id,
        teams,
        avgSavePct,
        avgGAA,
        decisions,
        gamesPlayed: games.length,
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null)
    .sort((a, b) => b.avgSavePct - a.avgSavePct)
    .slice(0, 10);
}

// ─── Newcomer Watch ───────────────────────────────────────────────────────────

export async function fetchNewcomerWatch() {
  const { data } = await supabaseAdmin
    .from('player_metric_snapshots')
    .select(`
      player_id, season_games, momentum_games,
      momentum_goals, momentum_assists,
      season_goals, season_assists,
      momentum_ppm, calculated_at,
      players!inner(
        first_name, last_name, headshot_url, position_code,
        career_games, draft_year, draft_round, draft_pick,
        in_minors, injury_status, birth_country,
        teams(id, abbrev)
      )
    `)
    .gte('season_games', 3)
    .order('calculated_at', { ascending: false })
    .limit(600);

  // Latest snapshot per player
  const seen = new Set<number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latest = (data ?? [] as any[]).filter((r: any) => {
    if (seen.has(r.player_id)) return false;
    seen.add(r.player_id);
    return true;
  });

  const playoffTeams = await fetchPlayoffActiveTeams();
  const isPlayoffs = playoffTeams.size > 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newcomers = latest.filter((r: any) => {
    const p = r.players;
    return p
      && (p.career_games ?? 999) <= 50
      && !p.in_minors
      && !p.injury_status
      && (!isPlayoffs || playoffTeams.has(p.teams?.id));
  });

  // Sort by pts/game this season — rewards sustained production over tiny samples
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newcomers.sort((a: any, b: any) => {
    const aRate = ((a.season_goals ?? 0) + (a.season_assists ?? 0)) / Math.max(1, a.season_games ?? 1);
    const bRate = ((b.season_goals ?? 0) + (b.season_assists ?? 0)) / Math.max(1, b.season_games ?? 1);
    return bRate - aRate;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return newcomers.slice(0, 15).map((r: any) => ({
    player_id: r.player_id as number,
    season_games:     (r.season_games     ?? 0) as number,
    momentum_games:   (r.momentum_games   ?? 0) as number,
    momentum_goals:   (r.momentum_goals   ?? 0) as number,
    momentum_assists: (r.momentum_assists  ?? 0) as number,
    season_goals:     (r.season_goals     ?? 0) as number,
    season_assists:   (r.season_assists   ?? 0) as number,
    players: {
      first_name:     r.players.first_name    as string,
      last_name:      r.players.last_name     as string,
      headshot_url:   r.players.headshot_url  as string | null,
      position_code:  r.players.position_code as string,
      career_games:   (r.players.career_games ?? 0) as number,
      draft_year:     r.players.draft_year    as number | null,
      draft_round:    r.players.draft_round   as number | null,
      draft_pick:     r.players.draft_pick    as number | null,
      birth_country:  r.players.birth_country as string | null,
      teams:          r.players.teams         as { id: number; abbrev: string } | null,
    },
  }));
}
