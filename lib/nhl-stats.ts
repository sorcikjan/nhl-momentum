// Official NHL standings and stat leaders (api-web.nhle.com), shaped for our
// tables — the record next to our Heat, so the numbers we invent sit beside
// the ones everybody knows.
import { teamUrl, playerUrl } from '@/lib/urls';

const BASE = 'https://api-web.nhle.com/v1';
// NHL data changes after each game: Next's data cache keeps a copy for 10 min
// (a no-store fetch would make every page that shows it dynamic).
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 600 }, signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`NHL API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export type StandingRow = {
  abbrev: string; name: string; href: string | null; conference: string; division: string;
  gp: number; w: number; l: number; otl: number; pts: number; gd: number; l10: string; streak: string;
  heat: number | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function standingRows(raw: any[], teamHeat: Record<string, number> = {}, teams: Record<string, { id: number; name: string }> = {}): StandingRow[] {
  return raw.map(t => {
    const abbrev = t.teamAbbrev?.default ?? '';
    const team = teams[abbrev];
    return {
      abbrev, name: t.teamCommonName?.default ?? t.teamName?.default ?? abbrev,
      href: team ? teamUrl(team.id, team.name) : null,
      conference: t.conferenceName ?? '', division: t.divisionName ?? '',
      gp: t.gamesPlayed ?? 0, w: t.wins ?? 0, l: t.losses ?? 0, otl: t.otLosses ?? 0, pts: t.points ?? 0,
      gd: t.goalDifferential ?? 0, l10: `${t.l10Wins ?? 0}-${t.l10Losses ?? 0}-${t.l10OtLosses ?? 0}`,
      streak: t.streakCode ? `${t.streakCode}${t.streakCount ?? ''}` : '',
      heat: teamHeat[abbrev] ?? null,
    };
  });
}

// League order (the API sorts by points, then its tiebreakers).
export async function fetchStandings(teamHeat?: Record<string, number>, teams?: Record<string, { id: number; name: string }>): Promise<StandingRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await get<{ standings: any[] }>('/standings/now');
  return standingRows(data.standings ?? [], teamHeat, teams);
}

export type LeaderRow = { id: number; name: string; team: string; pos: string; photo: string | null; href: string; value: string; heat: number | null };
export type LeaderBoard = { key: string; title: string; unit: string; rows: LeaderRow[] };

export const SKATER_BOARDS = [
  { key: 'points', title: 'Points', unit: 'PTS' },
  { key: 'goals', title: 'Goals', unit: 'G' },
  { key: 'assists', title: 'Assists', unit: 'A' },
  { key: 'plusMinus', title: 'Plus/minus', unit: '+/-' },
  { key: 'goalsPp', title: 'Power-play goals', unit: 'PPG' },
] as const;
export const GOALIE_BOARDS = [
  { key: 'savePctg', title: 'Save percentage', unit: 'SV%' },
  { key: 'goalsAgainstAverage', title: 'Goals against average', unit: 'GAA' },
  { key: 'wins', title: 'Wins', unit: 'W' },
  { key: 'shutouts', title: 'Shutouts', unit: 'SO' },
] as const;

const fmt = (key: string, v: number) =>
  key === 'savePctg' ? v.toFixed(3).replace(/^0/, '') : key === 'goalsAgainstAverage' ? v.toFixed(2) : key === 'plusMinus' && v > 0 ? `+${v}` : String(v);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function leaderRows(key: string, raw: any[], heatByPlayer: Record<number, number> = {}): LeaderRow[] {
  return raw.map(p => {
    const first = p.firstName?.default ?? '', last = p.lastName?.default ?? '';
    return {
      id: p.id, name: `${first} ${last}`.trim(), team: p.teamAbbrev ?? '', pos: p.position ?? '',
      photo: p.headshot ?? null, href: playerUrl(p.id, first, last),
      value: fmt(key, Number(p.value ?? 0)), heat: heatByPlayer[p.id] ?? null,
    };
  });
}

export async function fetchLeaders(
  boards: readonly { key: string; title: string; unit: string }[],
  kind: 'skater' | 'goalie',
  limit: number,
  heatByPlayer?: Record<number, number>,
): Promise<LeaderBoard[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await get<Record<string, any[]>>(`/${kind}-stats-leaders/current?categories=${boards.map(b => b.key).join(',')}&limit=${limit}`);
  return boards.map(b => ({ ...b, rows: leaderRows(b.key, data[b.key] ?? [], heatByPlayer) })).filter(b => b.rows.length);
}
