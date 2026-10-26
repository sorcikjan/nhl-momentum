// NHL official API client
// Base: https://api-web.nhle.com/v1

const BASE = 'https://api-web.nhle.com/v1';

async function get<T>(path: string, revalidate = 300): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate }, // Next.js data cache, 5 min unless the caller says otherwise
  });
  if (!res.ok) throw new Error(`NHL API ${res.status}: ${path}`);
  return res.json();
}

// ─── Schedules ────────────────────────────────────────────────────────────────

export async function getSchedule(date: string) {
  // date: YYYY-MM-DD
  return get<{ gameWeek: { date: string; games: unknown[] }[] }>(
    `/schedule/${date}`
  );
}

export async function getGamesByDate(date: string) {
  const data = await getSchedule(date);
  return data.gameWeek?.find(d => d.date === date)?.games ?? [];
}

// One night's scores with every goal (scorer, clip, game state at the goal).
export async function getScore(date: string, revalidate = 1800) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return get<{ games?: any[] }>(`/score/${date}`, revalidate);
}

export async function getSeasonDates(date: string) {
  // Same /schedule/{date} response also carries season-level fields alongside
  // the gameWeek — separate typed accessor so callers don't need `as` casts.
  return get<{ preSeasonStartDate?: string; regularSeasonStartDate?: string; regularSeasonEndDate?: string; playoffEndDate?: string }>(
    `/schedule/${date}`
  );
}

// ─── Player Game Logs ─────────────────────────────────────────────────────────

export async function getSkaterGameLog(playerId: number, season: string) {
  // season: "20252026"
  return get<{ gameLog: unknown[] }>(
    `/player/${playerId}/game-log/${season}/2` // 2 = regular season
  );
}

export async function getGoalieGameLog(playerId: number, season: string) {
  return get<{ gameLog: unknown[] }>(
    `/player/${playerId}/game-log/${season}/2`
  );
}

// ─── Player Info ──────────────────────────────────────────────────────────────

export async function getPlayerLanding(playerId: number, revalidate = 300) {
  return get<Record<string, unknown>>(`/player/${playerId}/landing`, revalidate);
}

// ─── Team Roster ──────────────────────────────────────────────────────────────

export async function getTeamRoster(teamAbbrev: string, season: string) {
  return get<{ forwards: unknown[]; defensemen: unknown[]; goalies: unknown[] }>(
    `/roster/${teamAbbrev}/${season}`
  );
}

// ─── Standings ────────────────────────────────────────────────────────────────

export async function getStandings(date: string) {
  return get<{ standings: unknown[] }>(`/standings/${date}`);
}

// ─── Score / Live Feed ────────────────────────────────────────────────────────

export async function getGameBoxscore(gameId: number) {
  return get<Record<string, unknown>>(`/gamecenter/${gameId}/boxscore`);
}

export async function getGameLanding(gameId: number) {
  return get<Record<string, unknown>>(`/gamecenter/${gameId}/landing`);
}

export async function getGameRightRail(gameId: number) {
  return get<Record<string, unknown>>(`/gamecenter/${gameId}/right-rail`);
}

export async function getGamePlayByPlay(gameId: number) {
  return get<Record<string, unknown>>(`/gamecenter/${gameId}/play-by-play`);
}

// ─── Team Info ────────────────────────────────────────────────────────────────

export async function getTeamSeasonStats(teamAbbrev: string) {
  return get<Record<string, unknown>>(`/club-stats/${teamAbbrev}/now`);
}

export async function getTeamScheduleNow(teamAbbrev: string) {
  return get<Record<string, unknown>>(`/club-schedule-season/${teamAbbrev}/now`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert "MM:SS" string to total seconds */
export function toiToSeconds(toi: string): number {
  if (!toi) return 0;
  const [m, s] = toi.split(':').map(Number);
  return (m || 0) * 60 + (s || 0);
}

/** Get current NHL season string (e.g. "20252026") */
export function currentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // New season from September: training camp + preseason, and the regular season
  // itself has opened in late September (2026-27 did). The prior season always ends by June.
  const startYear = month >= 9 ? year : year - 1;
  return `${startYear}${startYear + 1}`;
}

/** Season string for a "YYYY-MM-DD" date (same September cutover as currentSeason) */
export function seasonForDate(date: string): string {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const startYear = month >= 9 ? year : year - 1;
  return `${startYear}${startYear + 1}`;
}

/** Season string from an NHL game id — ids are YYYYTTNNNN (e.g. 2026020001 → "20262027") */
export function seasonFromGameId(gameId: number): string {
  const startYear = Math.floor(gameId / 1_000_000);
  return `${startYear}${startYear + 1}`;
}

/** Lowest regular-season game id for a season — use with .gte('id', …) to exclude preseason (type 01) */
export function firstRegularSeasonGameId(season: string): number {
  return Number(season.slice(0, 4)) * 1_000_000 + 20_000;
}
