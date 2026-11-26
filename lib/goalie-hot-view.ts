// The hottest NHL goalies (/hot/goalies): every goalie with enough recent
// starts, by save % over his last five starts, next to his own season and the
// league average, so the hot number sits beside the ones it beats.
// Built from the NHL stats API only (two reports, see fetchGoalieHot): no
// database reads.
// Bing showed people searching "hottest goalie right now" (Nov 2026).
import { playerUrl } from '@/lib/urls';

// One row of the NHL stats API goalie summary: a season (isGame=false) or a
// single game (isGame=true, with gameId and gameDate).
export type GoalieStatRow = {
  playerId: number; goalieFullName: string; lastName: string;
  teamAbbrev?: string; teamAbbrevs?: string;
  gameId?: number; gameDate?: string;
  gamesPlayed?: number; gamesStarted?: number;
  saves: number; shotsAgainst: number; goalsAgainst: number; timeOnIce?: number;
  wins?: number; losses?: number; otLosses?: number;
};

export type GoalieHotRow = {
  rank: number; playerId: number; name: string; team: string; href: string;
  starts: number; svPct: number; gaa: number | null; record: string;
  seasonSvPct: number | null; seasonGames: number;
  // Last-5 save % minus his season save %, in thousandths (.012 → 12).
  vsSeason: number | null;
  // Last-5 save % minus the league average, in thousandths.
  vsLeague: number;
};
export type GoalieHotView = { rows: GoalieHotRow[]; leagueSvPct: number | null };

export const RECENT_STARTS = 5;
// Fewer recent starts than this and the number is one hot night: left out.
export const MIN_STARTS = 3;

const thousandths = (a: number, b: number) => Math.round((a - b) * 1000);

export function goalieHotView(season: GoalieStatRow[], games: GoalieStatRow[]): GoalieHotView {
  const shots = season.reduce((s, g) => s + g.shotsAgainst, 0);
  const leagueSvPct = shots > 0 ? season.reduce((s, g) => s + g.saves, 0) / shots : null;
  if (leagueSvPct == null) return { rows: [], leagueSvPct: null };
  const seasonBy = new Map(season.map(g => [g.playerId, g]));

  const startsBy = new Map<number, GoalieStatRow[]>();
  for (const g of games) {
    if (!g.gamesStarted) continue;
    const list = startsBy.get(g.playerId) ?? [];
    list.push(g);
    startsBy.set(g.playerId, list);
  }

  const rows = [...startsBy.entries()].flatMap(([playerId, list]) => {
    const starts = list.sort((a, b) => (b.gameDate ?? '').localeCompare(a.gameDate ?? '') || (b.gameId ?? 0) - (a.gameId ?? 0)).slice(0, RECENT_STARTS);
    const sa = starts.reduce((s, g) => s + g.shotsAgainst, 0);
    if (starts.length < MIN_STARTS || sa === 0) return [];
    const ga = starts.reduce((s, g) => s + g.goalsAgainst, 0);
    const secs = starts.reduce((s, g) => s + (g.timeOnIce ?? 0), 0);
    const count = (k: 'wins' | 'losses' | 'otLosses') => starts.reduce((s, g) => s + (g[k] ?? 0), 0);
    const svPct = (sa - ga) / sa;
    const s = seasonBy.get(playerId);
    const seasonSvPct = s && s.shotsAgainst > 0 ? s.saves / s.shotsAgainst : null;
    const latest = starts[0];
    const first = latest.goalieFullName.endsWith(latest.lastName)
      ? latest.goalieFullName.slice(0, -latest.lastName.length).trim()
      : latest.goalieFullName;
    return [{
      rank: 0, playerId, name: latest.goalieFullName,
      team: latest.teamAbbrev ?? s?.teamAbbrevs?.split(',').pop() ?? '',
      href: playerUrl(playerId, first, latest.lastName),
      starts: starts.length, svPct,
      gaa: secs > 0 ? (ga * 3600) / secs : null,
      record: `${count('wins')}–${count('losses')}–${count('otLosses')}`,
      seasonSvPct, seasonGames: s?.gamesPlayed ?? starts.length,
      vsSeason: seasonSvPct == null ? null : thousandths(svPct, seasonSvPct),
      vsLeague: thousandths(svPct, leagueSvPct),
    }];
  });

  rows.sort((a, b) => b.svPct - a.svPct || b.starts - a.starts || a.name.localeCompare(b.name));
  rows.forEach((r, i) => { r.rank = i + 1; });
  return { rows, leagueSvPct };
}

// .915 style, as save % is written in hockey.
export const svPctText = (v: number) => v.toFixed(3).replace(/^0/, '');
