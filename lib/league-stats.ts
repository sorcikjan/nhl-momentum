// Whole-league stat tables from the NHL stats API (api.nhle.com/stats/rest):
// every skater and goalie in one row each, for a season or a date window.
// The profile compares a player with these — no database involved. Each
// table is cached by Next's fetch cache and shared across instances.
import { sharedResult } from '@/lib/db-fallback';

export type SkaterRow = {
  id: number; last: string; pos: 'F' | 'D'; team: string; // team = last of teamAbbrevs ("PHI,ANA" → "ANA")
  gp: number; toiSec: number; g: number; a: number; pts: number; sog: number;
  ppToiSec: number; shToiSec: number; hits: number; blocks: number; takeaways: number; giveaways: number;
  penDrawn: number; penTaken: number; satRel: number; faceoffs: number;
};

export type GoalieRow = {
  id: number; last: string; team: string; gp: number; gs: number; saves: number; shots: number; ga: number; toiSec: number;
  evSavePct: number | null; shSavePct: number | null; // shSavePct: facing a power play (his team shorthanded)
  qsPct: number | null; wins: number;
};

const BASE = 'https://api.nhle.com/stats/rest/en';
const HOUR = 3_600_000;

/* eslint-disable @typescript-eslint/no-explicit-any */
async function report(kind: 'skater' | 'goalie', name: string, query: string, revalidate: number): Promise<any[]> {
  try {
    const res = await fetch(`${BASE}/${kind}/${name}?limit=-1&${query}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (hockeymomentum.com)' },
      next: { revalidate },
      signal: AbortSignal.timeout(8_000),
    });
    return res.ok ? ((await res.json()) as { data?: any[] }).data ?? [] : [];
  } catch {
    return [];
  }
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const byId = (rows: any[]) => new Map(rows.map(r => [r.playerId as number, r]));
const lastTeam = (t: unknown) => String(t ?? '').split(',').pop()!.trim();

export function mergeSkaters(summary: any[], realtime: any[], toi: any[], penalties: any[], percentages: any[], faceoffs: any[]): SkaterRow[] {
  const [rt, ti, pe, pc, fo] = [realtime, toi, penalties, percentages, faceoffs].map(byId);
  return summary.map(s => {
    const id = s.playerId as number, gp = num(s.gamesPlayed);
    const t = ti.get(id), r = rt.get(id), p = pe.get(id);
    return {
      id, last: s.lastName ?? '', pos: s.positionCode === 'D' ? 'D' : 'F', team: lastTeam(s.teamAbbrevs),
      gp, toiSec: t ? num(t.timeOnIce) : num(s.timeOnIcePerGame) * gp,
      g: num(s.goals), a: num(s.assists), pts: num(s.points), sog: num(s.shots),
      ppToiSec: num(t?.ppTimeOnIce), shToiSec: num(t?.shTimeOnIce),
      hits: num(r?.hits), blocks: num(r?.blockedShots), takeaways: num(r?.takeaways), giveaways: num(r?.giveaways),
      penDrawn: num(p?.penaltiesDrawn), penTaken: num(p?.penalties),
      satRel: num(pc.get(id)?.satRelative), faceoffs: num(fo.get(id)?.totalFaceoffs),
    };
  });
}

export function mergeGoalies(summary: any[], advanced: any[], byStrength: any[]): GoalieRow[] {
  const [ad, bs] = [advanced, byStrength].map(byId);
  const orNull = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  return summary.map(s => {
    const id = s.playerId as number;
    return {
      id, last: s.lastName ?? '', team: lastTeam(s.teamAbbrevs),
      gp: num(s.gamesPlayed), gs: num(s.gamesStarted), saves: num(s.saves), shots: num(s.shotsAgainst), ga: num(s.goalsAgainst),
      toiSec: num(s.timeOnIce), wins: num(s.wins),
      evSavePct: orNull(bs.get(id)?.evSavePct), shSavePct: orNull(bs.get(id)?.ppSavePct), qsPct: orNull(ad.get(id)?.qualityStartsPct),
    };
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function leagueSavePct(rows: GoalieRow[]): number | null {
  const shots = rows.reduce((s, r) => s + r.shots, 0);
  return shots ? rows.reduce((s, r) => s + r.saves, 0) / shots : null;
}

const seasonQuery = (season: string) => `cayenneExp=${encodeURIComponent(`seasonId=${season} and gameTypeId=2`)}`;
const windowQuery = (from: string, to: string) =>
  `isAggregate=true&isGame=true&sort=playerId&cayenneExp=${encodeURIComponent(`gameDate>="${from}" and gameDate<="${to}" and gameTypeId=2`)}`;

async function skaters(query: string, revalidate: number): Promise<SkaterRow[]> {
  const names = ['summary', 'realtime', 'timeonice', 'penalties', 'percentages', 'faceoffwins'];
  const [summary, ...rest] = await Promise.all(names.map(n => report('skater', n, query, revalidate)));
  return summary.length ? mergeSkaters(summary, rest[0], rest[1], rest[2], rest[3], rest[4]) : [];
}

// A finished season never changes; the current one changes nightly.
const isPast = (season: string) => Number(season.slice(4)) < new Date().getFullYear() || (Number(season.slice(4)) === new Date().getFullYear() && new Date().getMonth() >= 7);

// An empty table is not shared, so a failed build is retried by the next render.
async function shared<T>(key: string, ttl: number, build: () => Promise<T[]>): Promise<T[]> {
  try {
    return await sharedResult(key, ttl, async () => {
      const rows = await build();
      if (!rows.length) throw new Error('empty');
      return rows;
    });
  } catch {
    return [];
  }
}

export function skaterTable(season: string): Promise<SkaterRow[]> {
  const past = isPast(season);
  return shared(`league/skaters/${season}`, past ? 7 * 24 * HOUR : 6 * HOUR, () => skaters(seasonQuery(season), past ? 604_800 : 21_600));
}

export function skaterWindow(from: string, to: string): Promise<SkaterRow[]> {
  return shared(`league/skaters/${from}_${to}`, 6 * HOUR, () => skaters(windowQuery(from, to), 21_600));
}

export function goalieTable(season: string): Promise<GoalieRow[]> {
  const past = isPast(season);
  const ttl = past ? 604_800 : 21_600;
  return shared(`league/goalies/${season}`, ttl * 1000, async () => {
    const q = seasonQuery(season);
    const [summary, advanced, byStrength] = await Promise.all(['summary', 'advanced', 'savesByStrength'].map(n => report('goalie', n, q, ttl)));
    return summary.length ? mergeGoalies(summary, advanced, byStrength) : [];
  });
}
