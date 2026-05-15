const API_BASE = 'https://v1.hockey.api-sports.io';
export const WC_LEAGUE_ID = 111;
export const WC_SEASON = 2026;
// Tournament runs May 15–26. Grouped by venue (Stockholm = A, Herning = B).
const WC_START = '2026-05-15';

export const TEAM_FLAG: Record<string, string> = {
  Canada: '🇨🇦', USA: '🇺🇸', Sweden: '🇸🇪', Finland: '🇫🇮',
  Russia: '🇷🇺', 'Czech Republic': '🇨🇿', Slovakia: '🇸🇰', Germany: '🇩🇪',
  Austria: '🇦🇹', Switzerland: '🇨🇭', Norway: '🇳🇴', Denmark: '🇩🇰',
  Latvia: '🇱🇻', Belarus: '🇧🇾', Ukraine: '🇺🇦', France: '🇫🇷',
  Hungary: '🇭🇺', Slovenia: '🇸🇮', Kazakhstan: '🇰🇿', Poland: '🇵🇱',
  Italy: '🇮🇹', 'Great Britain': '🇬🇧',
};

// Known group assignments from venue (Stockholm = A, Herning = B)
// Populated as we confirm from game matchups
const GROUP_A_IDS = new Set([1321, 1332, 1324, 1325]); // Canada, Sweden, Finland, Germany
const GROUP_B_IDS = new Set([1334, 1333, 1322, 1323]); // USA, Switzerland, Czech Republic, Denmark

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
  // API returns null for unstarted games, object with total for finished
  scores: { home: { total: number } | null; away: { total: number } | null };
  periods: { overtime: number | null; penalties: number | null } | null;
  status: { long: string; short: string; elapsed: string | null };
  league: { id: number; season: number };
}

async function apiFetch<T>(path: string, revalidate = 300): Promise<T[]> {
  const key = process.env.API_SPORTS_KEY;
  if (!key) return [];
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'x-apisports-key': key },
      next: { revalidate },
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (json.errors && Object.keys(json.errors).length > 0) return [];
    return Array.isArray(json.response) ? (json.response as T[]) : [];
  } catch {
    return [];
  }
}

// Derive team group from known seed assignments, then infer from opponents
function inferGroup(teamId: number, opponentId: number): string {
  if (GROUP_A_IDS.has(teamId) || GROUP_A_IDS.has(opponentId)) return 'Group A';
  if (GROUP_B_IDS.has(teamId) || GROUP_B_IDS.has(opponentId)) return 'Group B';
  return 'Group A'; // fallback — will resolve as more games are seen
}

// Build standings from finished game results (free-tier compatible)
export function buildStandingsFromGames(games: WCGame[]): { groupA: WCStanding[]; groupB: WCStanding[] } {
  const finished = games.filter(g =>
    g.status.short === 'FT' || g.status.short === 'AOT' || g.status.short === 'AP'
  );

  const teams = new Map<number, WCTeam>();
  const groups = new Map<number, string>();
  const rec = new Map<number, { w: number; otw: number; otl: number; l: number; gf: number; ga: number; form: string[] }>();

  function ensure(team: WCTeam) {
    if (!teams.has(team.id)) teams.set(team.id, team);
    if (!rec.has(team.id)) rec.set(team.id, { w: 0, otw: 0, otl: 0, l: 0, gf: 0, ga: 0, form: [] });
  }

  for (const g of finished) {
    const homeScore = g.scores.home?.total ?? 0;
    const awayScore = g.scores.away?.total ?? 0;
    const isOT = !!(g.periods?.overtime);
    ensure(g.teams.home);
    ensure(g.teams.away);

    // Infer groups from matchup
    const grp = inferGroup(g.teams.home.id, g.teams.away.id);
    if (!groups.has(g.teams.home.id)) groups.set(g.teams.home.id, grp);
    if (!groups.has(g.teams.away.id)) groups.set(g.teams.away.id, grp);

    const h = rec.get(g.teams.home.id)!;
    const a = rec.get(g.teams.away.id)!;
    h.gf += homeScore; h.ga += awayScore;
    a.gf += awayScore; a.ga += homeScore;

    if (homeScore > awayScore) {
      if (isOT) { h.otw++; h.form.push('O'); a.otl++; a.form.push('O'); }
      else { h.w++; h.form.push('W'); a.l++; a.form.push('L'); }
    } else {
      if (isOT) { a.otw++; a.form.push('O'); h.otl++; h.form.push('O'); }
      else { a.w++; a.form.push('W'); h.l++; h.form.push('L'); }
    }
  }

  const toStanding = (teamId: number, position: number, group: string): WCStanding => {
    const team = teams.get(teamId)!;
    const r = rec.get(teamId)!;
    const gp = r.w + r.otw + r.otl + r.l;
    const pts = r.w * 3 + r.otw * 2 + r.otl * 1;
    return {
      position,
      group: { name: group },
      team,
      games: { played: gp, win: { total: r.w }, win_overtime: { total: r.otw }, lose: { total: r.l }, lose_overtime: { total: r.otl } },
      goals: { for: r.gf, against: r.ga },
      points: pts,
      form: r.form.join(''),
      description: null,
    };
  };

  const sorted = [...teams.keys()].sort((a, b) => {
    const ra = rec.get(a)!; const rb = rec.get(b)!;
    const ptsa = ra.w * 3 + ra.otw * 2 + ra.otl; const ptsb = rb.w * 3 + rb.otw * 2 + rb.otl;
    if (ptsa !== ptsb) return ptsb - ptsa;
    return (rb.gf - rb.ga) - (ra.gf - ra.ga);
  });

  const groupA: WCStanding[] = [];
  const groupB: WCStanding[] = [];
  let posA = 1, posB = 1;
  for (const id of sorted) {
    const grp = groups.get(id) ?? 'Group A';
    if (grp === 'Group A') groupA.push(toStanding(id, posA++, 'Group A'));
    else groupB.push(toStanding(id, posB++, 'Group B'));
  }

  return { groupA, groupB };
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
  const data = await apiFetch<WCStanding>(`/standings?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`, 1800);
  const groupA = data.filter(s => s.group?.name === 'Group A').sort((a, b) => a.position - b.position);
  const groupB = data.filter(s => s.group?.name === 'Group B').sort((a, b) => a.position - b.position);
  return { groupA, groupB };
}

// Fetch all WC games from tournament start through today.
// Past dates cached 24h (games won't change); today cached 30min.
export async function fetchWCGamesThrough(): Promise<WCGame[]> {
  const start = new Date(WC_START);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const dates: { date: string; isToday: boolean }[] = [];
  const d = new Date(start);
  while (d.toISOString().slice(0, 10) <= todayStr) {
    dates.push({ date: d.toISOString().slice(0, 10), isToday: d.toISOString().slice(0, 10) === todayStr });
    d.setDate(d.getDate() + 1);
  }

  const results = await Promise.all(
    dates.map(({ date, isToday }) =>
      apiFetch<WCGame>(`/games?date=${date}`, isToday ? 1800 : 86400)
    )
  );

  return results.flat().filter(g => g.league?.id === WC_LEAGUE_ID);
}

export async function fetchWCGamesToday(): Promise<WCGame[]> {
  const today = new Date().toISOString().slice(0, 10);
  const data = await apiFetch<WCGame>(`/games?date=${today}`, 1800);
  return data.filter(g => g.league?.id === WC_LEAGUE_ID);
}
