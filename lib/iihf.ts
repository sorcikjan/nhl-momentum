const API_BASE = 'https://v1.hockey.api-sports.io';
export const WC_LEAGUE_ID = 111;
export const WC_SEASON = 2026;

export const TEAM_FLAG: Record<string, string> = {
  Canada: '🇨🇦', USA: '🇺🇸', Sweden: '🇸🇪', Finland: '🇫🇮',
  Russia: '🇷🇺', 'Czech Republic': '🇨🇿', Slovakia: '🇸🇰', Germany: '🇩🇪',
  Austria: '🇦🇹', Switzerland: '🇨🇭', Norway: '🇳🇴', Denmark: '🇩🇰',
  Latvia: '🇱🇻', Belarus: '🇧🇾', Ukraine: '🇺🇦', France: '🇫🇷',
  Hungary: '🇭🇺', Slovenia: '🇸🇮', Kazakhstan: '🇰🇿', Poland: '🇵🇱',
  Italy: '🇮🇹', 'Great Britain': '🇬🇧',
};

export interface WCTeam {
  id: number;
  name: string;
  logo: string;
}

export interface WCStanding {
  position: number;
  group: { name: string };
  team: WCTeam;
  games: {
    played: number;
    win: { total: number };
    win_overtime: { total: number };
    lose: { total: number };
    lose_overtime: { total: number };
  };
  goals: { for: number; against: number };
  points: number;
  form: string;
  description: string | null;
}

export interface WCGame {
  id: number;
  date: string;
  teams: { home: WCTeam; away: WCTeam };
  scores: { home: { total: number | null }; away: { total: number | null } };
  status: { long: string; short: string; elapsed: string | null };
  league: { id: number; season: number };
}

async function apiFetch<T>(path: string): Promise<T[]> {
  const key = process.env.API_SPORTS_KEY;
  if (!key) return [];
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'x-apisports-key': key },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.response) ? (json.response as T[]) : [];
  } catch {
    return [];
  }
}

// Team Heat: 60% recent form (last 3 games) + 40% offense (GF/GP vs tournament peak)
export function computeTeamHeats(standings: WCStanding[]): Map<number, number> {
  const active = standings.filter(s => s.games.played > 0);
  const maxGpg = active.length > 0
    ? Math.max(...active.map(s => s.goals.for / s.games.played))
    : 1;

  const map = new Map<number, number>();
  for (const s of standings) {
    if (s.games.played === 0) { map.set(s.team.id, 50); continue; }
    const recent = (s.form ?? '').slice(-3).split('');
    const formScore = recent.length > 0
      ? (recent.reduce((acc, c) => acc + (c === 'W' ? 1 : c === 'L' ? 0 : 0.5), 0) / recent.length) * 100
      : 50;
    const offScore = (s.goals.for / s.games.played / maxGpg) * 100;
    const heat = Math.round(formScore * 0.6 + offScore * 0.4);
    map.set(s.team.id, Math.max(1, Math.min(99, heat)));
  }
  return map;
}

export async function fetchWCStandings(): Promise<{ groupA: WCStanding[]; groupB: WCStanding[] }> {
  const data = await apiFetch<WCStanding>(`/standings?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`);
  const groupA = data.filter(s => s.group?.name === 'Group A').sort((a, b) => a.position - b.position);
  const groupB = data.filter(s => s.group?.name === 'Group B').sort((a, b) => a.position - b.position);
  return { groupA, groupB };
}

export async function fetchWCGamesToday(): Promise<WCGame[]> {
  const today = new Date().toISOString().slice(0, 10);
  const data = await apiFetch<WCGame>(`/games?date=${today}`);
  return data.filter(g => g.league?.id === WC_LEAGUE_ID);
}

export async function fetchWCAllGames(): Promise<WCGame[]> {
  // Try league+season first; if empty fall back to fetching by known date range
  const data = await apiFetch<WCGame>(`/games?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`);
  return data;
}
