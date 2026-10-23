// Box score per team: every skater and goalie who played, from the official
// NHL boxscore (live and final), with our stored stats as the fallback when the
// NHL API is unreachable. Names come from our players table when we have them
// (the NHL boxscore only has "S. Pinto").
import { toiToSeconds } from '@/lib/nhl-api';

export type BoxSkater = {
  id: number; number: number | null; name: string; pos: string;
  g: number; a: number; pts: number; pm: number; sog: number; hits: number; blk: number; pim: number;
  ppg: number; toi: number; foPct: number | null; gwg: boolean;
};
export type BoxGoalie = {
  id: number; number: number | null; name: string;
  sa: number; ga: number; svPct: number | null; toi: number; decision: string | null;
};
export type BoxTeam = { forwards: BoxSkater[]; defense: BoxSkater[]; goalies: BoxGoalie[] };

type Names = Map<number, string>;

// Points, then goals, then ice time: the night's performers on top, then the
// players the coach leaned on.
const bySkater = (x: BoxSkater, y: BoxSkater) => y.pts - x.pts || y.g - x.g || y.toi - x.toi;
// The goalie who played most first.
const byGoalie = (x: BoxGoalie, y: BoxGoalie) => y.toi - x.toi;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function boxFromNhl(team: any, names: Names, gwgIds: Set<number> = new Set()): BoxTeam | null {
  if (!team || !(team.forwards?.length || team.defense?.length)) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skater = (p: any): BoxSkater => ({
    id: p.playerId, number: p.sweaterNumber ?? null, name: names.get(p.playerId) ?? p.name?.default ?? '', pos: p.position ?? '',
    g: p.goals ?? 0, a: p.assists ?? 0, pts: p.points ?? (p.goals ?? 0) + (p.assists ?? 0), pm: p.plusMinus ?? 0,
    sog: p.sog ?? 0, hits: p.hits ?? 0, blk: p.blockedShots ?? 0, pim: p.pim ?? 0, ppg: p.powerPlayGoals ?? 0,
    toi: p.toi ? toiToSeconds(p.toi) : 0,
    // Centres only. The API also reports 0 for a centre who took no faceoffs, so
    // 0 can't be told from 0-for-N: shown as no value rather than a wrong one.
    foPct: p.position === 'C' && typeof p.faceoffWinningPctg === 'number' && p.faceoffWinningPctg > 0 ? p.faceoffWinningPctg : null,
    gwg: gwgIds.has(p.playerId),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goalie = (p: any): BoxGoalie => ({
    id: p.playerId, number: p.sweaterNumber ?? null, name: names.get(p.playerId) ?? p.name?.default ?? '',
    sa: p.shotsAgainst ?? 0, ga: p.goalsAgainst ?? 0,
    svPct: (p.shotsAgainst ?? 0) > 0 ? (p.saves ?? p.shotsAgainst - p.goalsAgainst) / p.shotsAgainst : null,
    toi: p.toi ? toiToSeconds(p.toi) : 0, decision: p.decision ?? null,
  });
  return {
    forwards: (team.forwards ?? []).map(skater).sort(bySkater),
    defense: (team.defense ?? []).map(skater).sort(bySkater),
    // Only goalies who actually played (the backup is listed with 00:00).
    goalies: (team.goalies ?? []).map(goalie).filter((g: BoxGoalie) => g.toi > 0).sort(byGoalie),
  };
}

// Our stored box score (game_player_stats / game_goalie_stats rows with players joined).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function boxFromDb(skaters: any[], goalies: any[]): BoxTeam | null {
  if (!skaters.length) return null;
  const name = (p: { first_name?: string; last_name?: string } | null) => `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: BoxSkater[] = skaters.map((r: any) => ({
    id: r.player_id, number: null, name: name(r.players), pos: r.players?.position_code ?? '',
    g: r.goals ?? 0, a: r.assists ?? 0, pts: (r.goals ?? 0) + (r.assists ?? 0), pm: r.plus_minus ?? 0,
    sog: r.shots_on_goal ?? 0, hits: r.hits ?? 0, blk: r.blocked_shots ?? 0, pim: r.pim ?? 0, ppg: r.pp_goals ?? 0,
    toi: r.toi_seconds ?? 0, foPct: null, gwg: (r.game_winning_goals ?? 0) > 0,
  }));
  return {
    forwards: rows.filter(r => r.pos !== 'D').sort(bySkater),
    defense: rows.filter(r => r.pos === 'D').sort(bySkater),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    goalies: goalies.filter((g: any) => (g.toi_seconds ?? 0) > 0).map((g: any): BoxGoalie => ({
      id: g.player_id, number: null, name: name(g.players), sa: g.shots_against ?? 0, ga: g.goals_against ?? 0,
      svPct: g.save_pct != null ? Number(g.save_pct) : null, toi: g.toi_seconds ?? 0, decision: g.decision ?? null,
    })).sort(byGoalie),
  };
}

export function teamTotals(t: BoxTeam) {
  const all = [...t.forwards, ...t.defense];
  const sum = (k: 'sog' | 'hits' | 'blk' | 'pim' | 'ppg') => all.reduce((s, p) => s + p[k], 0);
  return { sog: sum('sog'), hits: sum('hits'), blk: sum('blk'), pim: sum('pim'), ppg: sum('ppg') };
}

export const fmtToi = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
