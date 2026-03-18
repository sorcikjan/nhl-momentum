// NHL official API client
// Base: https://api-web.nhle.com/v1

const BASE = 'https://api-web.nhle.com/v1';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate: 300 }, // Next.js cache — 5 min
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

export async function getPlayerLanding(playerId: number) {
  return get<Record<string, unknown>>(`/player/${playerId}/landing`);
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
  // NHL season starts in October
  const startYear = month >= 10 ? year : year - 1;
  return `${startYear}${startYear + 1}`;
}
