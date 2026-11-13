// Context for the player profile: his position's field, Heat against it, and
// one line per game with Heat after it.
// Pure functions over plain rows — the page fetches, this file compares.
import { ppmToHeat } from '@/lib/heat';

export type Group = 'F' | 'D';
export const groupOf = (position: string | null | undefined): Group => (position === 'D' ? 'D' : 'F');
export const groupWords = (g: Group) => (g === 'D' ? { one: 'defenseman', many: 'defensemen' } : { one: 'forward', many: 'forwards' });

// One skater's season, from his latest metrics snapshot.
export type Peer = {
  id: number; last: string; team: string; group: Group;
  gp: number; g: number; a: number; pts: number; sog: number; ppp: number; pm: number;
  toiMin: number; heat: number; energy: number;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function peerFromSnapshot(r: any): Peer {
  const gp = Number(r.season_games ?? 0);
  const g = Number(r.season_goals ?? 0), a = Number(r.season_assists ?? 0);
  return {
    id: r.player_id, last: r.players?.last_name ?? '', team: r.players?.teams?.abbrev ?? '', group: groupOf(r.players?.position_code),
    gp, g, a, pts: Number(r.season_points ?? 0) || g + a, sog: Number(r.season_shots ?? 0), ppp: Number(r.season_pp_points ?? 0),
    pm: Number(r.season_plus_minus ?? 0), toiMin: gp ? Number(r.season_toi_sec ?? 0) / gp / 60 : 0,
    heat: ppmToHeat(r.momentum_ppm), energy: r.energy_bar != null ? Number(r.energy_bar) : 100,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// Who he's compared with: his position, players with a real share of the
// season (early on, everyone with a game). He is always in his own field.
export function peersOf(me: Peer, all: Peer[]): Peer[] {
  const same = all.filter(p => p.group === me.group && p.gp > 0);
  const maxGp = Math.max(0, ...same.map(p => p.gp));
  const min = Math.min(4, Math.ceil(maxGp / 2));
  const field = same.filter(p => p.gp >= min && p.id !== me.id);
  return [...field, me];
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0);
// Share of the field strictly below him, 0–99 (he is in the field, so never
// "hotter than 100%").
export const percentile = (xs: number[], v: number) => (xs.length ? Math.min(99, Math.round((100 * xs.filter(x => x < v).length) / xs.length)) : 0);
const p95 = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * 0.95))] : 0; };

export type HeatContext = { heat: number; pct: number; avg: number; top: number };
export function heatContext(me: Peer, peers: Peer[]): HeatContext {
  const xs = peers.map(p => p.heat);
  return { heat: me.heat, pct: percentile(xs, me.heat), avg: Math.round(mean(xs)), top: Math.round(p95(xs)) };
}


export const ordinal = (n: number) => {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${s}`;
};


// ── Games: one line per game this season, with Heat after it ────────────────
export type GameLine = {
  id: number; date: string; opp: string; home: boolean; result: 'W' | 'L' | null;
  g: number; a: number; sog: number; pm: number; toi: number; // toi in seconds
  heat: number | null; // Heat in the first snapshot after the game
};

/* eslint-disable @typescript-eslint/no-explicit-any */
// `rows` are game_player_stats rows with `games` joined (newest first or any
// order); `daily` is one Heat point per day, oldest first.
export function gameLines(rows: any[], teamId: number | null, seasonStart: string, daily: { date: string; heat: number }[]): GameLine[] {
  const lines = rows
    .filter(r => (r.games?.game_date ?? '') >= seasonStart)
    .map(r => {
      const gm = r.games ?? {};
      const home = gm.home_team_id === teamId;
      const us = home ? gm.home_score : gm.away_score, them = home ? gm.away_score : gm.home_score;
      return {
        id: Number(r.game_id ?? gm.id ?? 0), date: gm.game_date as string, opp: (home ? gm.away_team?.abbrev : gm.home_team?.abbrev) ?? '', home,
        result: us == null || them == null ? null : us > them ? 'W' as const : 'L' as const,
        g: r.goals ?? 0, a: r.assists ?? 0, sog: r.shots_on_goal ?? 0, pm: r.plus_minus ?? 0, toi: Number(r.toi_seconds ?? 0),
        heat: null as number | null,
      };
    })
    .sort((x, y) => x.date.localeCompare(y.date) || x.id - y.id);
  // The snapshot that first counts a game is the one dated after it; the
  // latest game may not have one yet, and then today's Heat is that game's.
  lines.forEach((l, i) => {
    const after = daily.find(d => d.date > l.date);
    l.heat = after && (i === lines.length - 1 || after.date <= lines[i + 1].date) ? after.heat
      : i === lines.length - 1 && daily.length ? daily[daily.length - 1].heat : null;
  });
  return lines;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
