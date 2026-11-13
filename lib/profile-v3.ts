// The player profile's facts, each with its comparison: the character radar,
// team role, season ranks, career columns, the path he took, his country and
// the one objective sentence. Pure functions over league tables
// (lib/league-stats.ts) and the NHL.com landing — the page fetches, this file
// decides. See docs/superpowers/specs/2026-11-13-player-profile-v3-design.md.
import type { GoalieRow, SkaterRow } from '@/lib/league-stats';
import { ordinal, percentile } from '@/lib/profile-context';

export type Axis = { key: string; label: string; season: number; recent: number | null };
export type Character = { axes: Axis[]; unused: string[] };

const MIN_GP = 5; // Heat, SV%, radar and ranks start at 5 NHL games
const MIN_RECENT_GP = 4;
const per60 = (v: number, toiSec: number) => (toiSec > 0 ? (v * 3600) / toiSec : 0);
const pg = (v: number, gp: number) => (gp > 0 ? v / gp : 0);

// ── Character radar ─────────────────────────────────────────────────────────
type SkaterAxisDef = { key: string; label: string; of: (r: SkaterRow) => number };
const F_AXES: SkaterAxisDef[] = [
  { key: 'g', label: 'Goals', of: r => per60(r.g, r.toiSec) },
  { key: 'sog', label: 'Shots', of: r => per60(r.sog, r.toiSec) },
  { key: 'a', label: 'Assists', of: r => per60(r.a, r.toiSec) },
  { key: 'pp', label: 'Power play', of: r => pg(r.ppToiSec, r.gp) },
  { key: 'toi', label: 'Ice time', of: r => pg(r.toiSec, r.gp) },
  { key: 'sat', label: 'Team shots on ice', of: r => r.satRel },
  { key: 'tk', label: 'Takeaways', of: r => per60(r.takeaways - r.giveaways, r.toiSec) },
  { key: 'phys', label: 'Hits + blocks', of: r => per60(r.hits + r.blocks, r.toiSec) },
  { key: 'pen', label: 'Penalties drawn', of: r => per60(r.penDrawn - r.penTaken, r.toiSec) },
];
const D_AXES: SkaterAxisDef[] = [
  { key: 'pts', label: 'Points', of: r => per60(r.g + r.a, r.toiSec) },
  F_AXES[1], F_AXES[4], F_AXES[3],
  { key: 'pk', label: 'Penalty kill', of: r => pg(r.shToiSec, r.gp) },
  F_AXES[5], F_AXES[6], F_AXES[7], F_AXES[8],
];

// Percentiles against his position (5+ games). The recent curve places his
// last-3-weeks rate in the same season distribution.
export function characterAxes(me: SkaterRow, recent: SkaterRow | null, field: SkaterRow[]): Character {
  const pool = field.filter(r => r.pos === me.pos && r.gp >= MIN_GP);
  const unused: string[] = [];
  if (me.pos === 'F' && pg(me.shToiSec, me.gp) < 30) unused.push('Penalty kill');
  if (me.pos === 'F' && pg(me.faceoffs, me.gp) < 2) unused.push('Faceoffs');
  if (me.gp < MIN_GP || !pool.length) return { axes: [], unused };
  const useRecent = recent && recent.gp >= MIN_RECENT_GP ? recent : null;
  const axes = (me.pos === 'D' ? D_AXES : F_AXES).map(d => {
    const xs = pool.map(d.of);
    return { key: d.key, label: d.label, season: percentile(xs, d.of(me)), recent: useRecent ? percentile(xs, d.of(useRecent)) : null };
  });
  return { axes, unused };
}

const gaa = (r: GoalieRow) => (r.toiSec > 0 ? (r.ga * 3600) / r.toiSec : 0);
const svPct = (r: GoalieRow) => (r.shots > 0 ? r.saves / r.shots : 0);

export function goalieAxes(me: GoalieRow, field: GoalieRow[]): Character {
  const pool = field.filter(r => r.gp >= MIN_GP);
  if (me.gp < MIN_GP || !pool.length) return { axes: [], unused: [] };
  const teamStarts = (t: string) => field.filter(r => r.team === t).reduce((s, r) => s + r.gs, 0);
  const defs: { key: string; label: string; of: (r: GoalieRow) => number | null }[] = [
    { key: 'sv', label: 'Save %', of: svPct },
    { key: 'ev', label: 'Even strength', of: r => r.evSavePct },
    { key: 'sh', label: 'Shorthanded', of: r => r.shSavePct },
    { key: 'gaa', label: 'Goals against', of: r => -gaa(r) },
    { key: 'qs', label: 'Quality starts', of: r => r.qsPct },
    { key: 'load', label: 'Workload', of: r => { const t = teamStarts(r.team); return t ? r.gs / t : 0; } },
  ];
  const axes = defs.map(d => {
    const xs = pool.map(d.of).filter((v): v is number => v != null);
    const v = d.of(me);
    return { key: d.key, label: d.label, season: v == null ? 0 : percentile(xs, v), recent: null };
  });
  return { axes, unused: [] };
}

// ── Role in his team ────────────────────────────────────────────────────────
export type Ladder = { bars: { id: number; toiPerGame: number; me: boolean }[]; myRank: number | null; max: number; min: number };
export function teamLadder(rows: SkaterRow[], meId: number, team: string): Ladder {
  const me = rows.find(r => r.id === meId);
  const bars = rows
    .filter(r => r.team === team && r.pos === (me?.pos ?? 'F') && r.gp >= 3)
    .map(r => ({ id: r.id, toiPerGame: pg(r.toiSec, r.gp), me: r.id === meId }))
    .sort((a, b) => b.toiPerGame - a.toiPerGame);
  const idx = bars.findIndex(b => b.me);
  return { bars, myRank: idx >= 0 ? idx + 1 : null, max: bars[0]?.toiPerGame ?? 0, min: bars.at(-1)?.toiPerGame ?? 0 };
}

export function goalieStarts(rows: GoalieRow[], meId: number, team: string): { name: string; starts: number; me: boolean }[] {
  return rows
    .filter(r => r.team === team && r.gp > 0)
    .sort((a, b) => b.gs - a.gs)
    .map(r => ({ name: r.last, starts: r.gs, me: r.id === meId }));
}

// ── Season ranks and totals ─────────────────────────────────────────────────
export type Rank = { pct: number; top: number };
const topShare = (rank: number, n: number) => Math.max(1, Math.round((100 * rank) / n));

export function seasonRank(table: SkaterRow[], id: number, pos: 'F' | 'D', minGp: number): Rank | null {
  const pool = table.filter(r => r.pos === pos && r.gp >= minGp);
  const me = pool.find(r => r.id === id);
  if (!me) return null;
  const xs = pool.map(r => pg(r.pts, r.gp)), v = pg(me.pts, me.gp);
  return { pct: percentile(xs, v), top: topShare(1 + xs.filter(x => x > v).length, pool.length) };
}

export type Total = { label: string; value: string; rank: string | null };
const rankText = (rank: number, n: number) => (rank <= 25 ? `#${rank}` : `top ${topShare(rank, n)}%`);
const fmtSv = (v: number) => v.toFixed(3).replace(/^0/, '');

export function seasonTotals(me: SkaterRow | GoalieRow, field: (SkaterRow | GoalieRow)[], goalie: boolean): Total[] {
  const ranked = me.gp >= MIN_GP;
  const rankBy = <T>(pool: T[], f: (r: T) => number, v: number, asc = false) =>
    ranked ? rankText(1 + pool.filter(r => (asc ? f(r) < v : f(r) > v)).length, pool.length) : null;
  if (goalie) {
    const g = me as GoalieRow;
    const pool = (field as GoalieRow[]).filter(r => r.gp >= MIN_GP);
    return [
      { label: 'GAMES', value: String(g.gp), rank: null },
      { label: 'WINS', value: String(g.wins), rank: rankBy(pool, r => r.wins, g.wins) },
      { label: 'SAVE %', value: g.shots ? fmtSv(svPct(g)) : '–', rank: rankBy(pool, svPct, svPct(g)) },
      { label: 'GAA', value: g.toiSec ? gaa(g).toFixed(2) : '–', rank: rankBy(pool, gaa, gaa(g), true) },
    ];
  }
  const s = me as SkaterRow;
  const pool = (field as SkaterRow[]).filter(r => r.pos === s.pos && r.gp >= MIN_GP);
  return [
    { label: 'GAMES', value: String(s.gp), rank: null },
    { label: 'GOALS', value: String(s.g), rank: rankBy(pool, r => r.g, s.g) },
    { label: 'ASSISTS', value: String(s.a), rank: rankBy(pool, r => r.a, s.a) },
    { label: 'POINTS', value: String(s.pts), rank: rankBy(pool, r => r.pts, s.pts) },
  ];
}

// ── Landing (NHL.com career) ────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = {
  season: number; leagueAbbrev: string; gameTypeId: number; gamesPlayed: number; sequence?: number;
  goals?: number; assists?: number; points?: number; savePctg?: number; teamName?: { default?: string };
};
const rows = (landing: any): Row[] => (Array.isArray(landing?.seasonTotals) ? landing.seasonTotals : []);
const regular = (landing: any) => rows(landing).filter(r => r.gameTypeId === 2);
const seasonLabel = (s: number) => `${String(s).slice(0, 4)}–${String(s).slice(6, 8)}`;
const startYear = (s: number) => Number(String(s).slice(0, 4));
const teamOf = (r: Row) => r.teamName?.default ?? '';

const INTL = new Set(['WJC-20', 'WJC-18', 'WC', 'OG', 'International', 'WCup', 'YOG', 'WHC-17', 'Hlinka']);
const EVENTS: Record<string, string> = { 'WJC-20': 'World Juniors', WC: 'World Championship', OG: 'Olympics', WCup: 'World Cup', International: 'International' };
const YOUTH = /\bU\d{2}\b|\b\d{2}U\b/i;

export const NHL_TEAMS: Record<string, string> = {
  ANA: 'Anaheim Ducks', BOS: 'Boston Bruins', BUF: 'Buffalo Sabres', CAR: 'Carolina Hurricanes', CBJ: 'Columbus Blue Jackets',
  CGY: 'Calgary Flames', CHI: 'Chicago Blackhawks', COL: 'Colorado Avalanche', DAL: 'Dallas Stars', DET: 'Detroit Red Wings',
  EDM: 'Edmonton Oilers', FLA: 'Florida Panthers', LAK: 'Los Angeles Kings', MIN: 'Minnesota Wild', MTL: 'Montréal Canadiens',
  NJD: 'New Jersey Devils', NSH: 'Nashville Predators', NYI: 'New York Islanders', NYR: 'New York Rangers', OTT: 'Ottawa Senators',
  PHI: 'Philadelphia Flyers', PIT: 'Pittsburgh Penguins', SEA: 'Seattle Kraken', SJS: 'San Jose Sharks', STL: 'St. Louis Blues',
  TBL: 'Tampa Bay Lightning', TOR: 'Toronto Maple Leafs', UTA: 'Utah Mammoth', VAN: 'Vancouver Canucks', VGK: 'Vegas Golden Knights',
  WPG: 'Winnipeg Jets', WSH: 'Washington Capitals', ARI: 'Arizona Coyotes',
};
const ALIASES: Record<string, string> = { 'Montreal Canadiens': 'MTL', 'Utah Hockey Club': 'UTA', 'Utah HC': 'UTA' };
export const nhlAbbrev = (name: string): string | null =>
  ALIASES[name] ?? Object.entries(NHL_TEAMS).find(([, n]) => n === name)?.[0] ?? null;

const LEAGUES: Record<string, string> = { Czechia: 'Extraliga', Czechia2: 'Chance liga', Czechia3: '2. liga', Slovakia: 'Tipos extraliga', NL: 'National League' };
export const leagueName = (abbrev: string) => LEAGUES[abbrev] ?? abbrev;

export type Column = { season: string; team: string | null; teamName: string; league: string; value: number; pct: number | null; top: number | null; gp: number; thin: boolean };

// Skaters: NHL seasons, points a game with the league rank (key = season id).
// Goalies: every senior league, save %, no rank. Last 6 either way.
export function seasonColumns(landing: any, rankBySeason: Record<string, Rank | null>, goalie: boolean): Column[] {
  if (goalie) {
    return regular(landing)
      .filter(r => !INTL.has(r.leagueAbbrev) && !YOUTH.test(teamOf(r)) && r.gamesPlayed > 0 && r.savePctg != null)
      .slice(-6)
      .map(r => ({
        season: seasonLabel(r.season), team: r.leagueAbbrev === 'NHL' ? nhlAbbrev(teamOf(r)) : null, teamName: teamOf(r),
        league: leagueName(r.leagueAbbrev), value: r.savePctg!, pct: null, top: null, gp: r.gamesPlayed, thin: r.gamesPlayed < MIN_GP,
      }));
  }
  const bySeason = new Map<number, Row[]>();
  for (const r of regular(landing).filter(r => r.leagueAbbrev === 'NHL' && r.gamesPlayed > 0)) bySeason.set(r.season, [...(bySeason.get(r.season) ?? []), r]);
  return [...bySeason.entries()].sort(([a], [b]) => a - b).slice(-6).map(([season, rs]) => {
    const gp = rs.reduce((s, r) => s + r.gamesPlayed, 0), pts = rs.reduce((s, r) => s + (r.points ?? 0), 0);
    const last = rs.at(-1)!, rank = rankBySeason[String(season)] ?? null;
    return {
      season: seasonLabel(season), team: nhlAbbrev(teamOf(last)), teamName: teamOf(last), league: 'NHL',
      value: gp ? pts / gp : 0, pct: rank?.pct ?? null, top: rank?.top ?? null, gp, thin: gp < MIN_GP,
    };
  });
}

// NHL seasons with a game this season counted in ("4th NHL season").
export function nhlSeasonOrdinal(landing: any): number {
  return new Set(regular(landing).filter(r => r.leagueAbbrev === 'NHL' && r.gamesPlayed > 0).map(r => r.season)).size;
}

const COUNTRIES: Record<string, { name: string; flag: string; words: string[] }> = {
  USA: { name: 'USA', flag: '🇺🇸', words: ['USA', 'United States'] },
  CAN: { name: 'Canada', flag: '🇨🇦', words: ['Canada'] },
  SWE: { name: 'Sweden', flag: '🇸🇪', words: ['Sweden'] },
  FIN: { name: 'Finland', flag: '🇫🇮', words: ['Finland'] },
  CZE: { name: 'Czechia', flag: '🇨🇿', words: ['Czechia', 'Czech Republic', 'Czech'] },
  SVK: { name: 'Slovakia', flag: '🇸🇰', words: ['Slovakia'] },
  CHE: { name: 'Switzerland', flag: '🇨🇭', words: ['Switzerland'] },
  DEU: { name: 'Germany', flag: '🇩🇪', words: ['Germany'] },
  LVA: { name: 'Latvia', flag: '🇱🇻', words: ['Latvia'] },
  DNK: { name: 'Denmark', flag: '🇩🇰', words: ['Denmark'] },
  NOR: { name: 'Norway', flag: '🇳🇴', words: ['Norway'] },
  AUT: { name: 'Austria', flag: '🇦🇹', words: ['Austria'] },
  RUS: { name: 'Russia', flag: '🇷🇺', words: ['Russia'] },
  BLR: { name: 'Belarus', flag: '🇧🇾', words: ['Belarus'] },
  SVN: { name: 'Slovenia', flag: '🇸🇮', words: ['Slovenia'] },
  FRA: { name: 'France', flag: '🇫🇷', words: ['France'] },
  KAZ: { name: 'Kazakhstan', flag: '🇰🇿', words: ['Kazakhstan'] },
  HUN: { name: 'Hungary', flag: '🇭🇺', words: ['Hungary'] },
  GBR: { name: 'Great Britain', flag: '🇬🇧', words: ['Great Britain'] },
  AUS: { name: 'Australia', flag: '🇦🇺', words: ['Australia'] },
  NLD: { name: 'Netherlands', flag: '🇳🇱', words: ['Netherlands'] },
  UKR: { name: 'Ukraine', flag: '🇺🇦', words: ['Ukraine'] },
};
const GER_ALIAS: Record<string, string> = { GER: 'DEU', SUI: 'CHE', DEN: 'DNK', LAT: 'LVA', SLO: 'SVN' };

export type Nationality = { code: string; flag: string; name: string; born: string | null };
export function nationality(landing: any, birthCountry: string | null): Nationality | null {
  const intl = regular(landing).filter(r => INTL.has(r.leagueAbbrev)).map(r => teamOf(r).replace(/^Team\s+/i, ''));
  const fromTeam = intl.map(t => Object.entries(COUNTRIES).find(([, c]) => c.words.some(w => t.startsWith(w)))?.[0]).find(Boolean);
  const bc = birthCountry ? GER_ALIAS[birthCountry] ?? birthCountry : null;
  const code = fromTeam ?? bc;
  if (!code) return null;
  const c = COUNTRIES[code] ?? { name: code, flag: '', words: [] };
  const born = bc && bc !== code ? COUNTRIES[bc]?.name ?? bc : null;
  return { code, flag: c.flag, name: c.name, born };
}

// Senior and junior national-team events, years = the calendar year played.
export function countryEvents(landing: any): { name: string; years: number[] }[] {
  const out = new Map<string, number[]>();
  for (const r of regular(landing)) {
    const name = EVENTS[r.leagueAbbrev];
    if (!name || r.gamesPlayed <= 0) continue;
    const y = startYear(r.season) + 1;
    const ys = out.get(name) ?? [];
    if (!ys.includes(y)) ys.push(y);
    out.set(name, ys);
  }
  return [...out.entries()].map(([name, years]) => ({ name, years }));
}

// ── The path he took ────────────────────────────────────────────────────────
export type Step = { title: string; detail: string; now: boolean };
type Stint = { team: string; league: string; rows: Row[] };

const years = (rs: Row[]) => {
  const a = startYear(rs[0].season), b = startYear(rs.at(-1)!.season) + 1;
  return `${a}–${String(b).slice(2)}`;
};
const bestLine = (rs: Row[], goalie: boolean) => {
  if (goalie) {
    const best = rs.filter(r => r.gamesPlayed >= 10 && r.savePctg != null).sort((x, y) => y.savePctg! - x.savePctg!)[0];
    return best ? `${fmtSv(best.savePctg!)} save %` : '';
  }
  const best = [...rs].sort((x, y) => (y.points ?? 0) - (x.points ?? 0))[0];
  if (!best) return '';
  const g = best.goals ?? 0, a = best.assists ?? 0;
  return g >= a ? `${g} goals in ${best.gamesPlayed} games` : `${g + a} points in ${best.gamesPlayed} games`;
};

export function timeline(landing: any, draft: { year: number; pick: number; team: string } | null): Step[] {
  const all = regular(landing);
  const current = Math.max(0, ...all.map(r => r.season));
  const goalie = landing?.position === 'G';
  const kept = all.filter(r => !INTL.has(r.leagueAbbrev) && !YOUTH.test(teamOf(r)) && (r.gamesPlayed >= 10 || r.season === current) && r.gamesPlayed > 0);
  const stints: Stint[] = [];
  for (const r of kept) {
    const last = stints.at(-1);
    if (last && last.team === teamOf(r)) last.rows.push(r);
    else stints.push({ team: teamOf(r), league: r.leagueAbbrev, rows: [r] });
  }
  // A short call-up between two stints with the same club doesn't split them.
  for (let i = 1; i < stints.length - 1; i++) {
    const gp = stints[i].rows.reduce((s, r) => s + r.gamesPlayed, 0);
    if (gp < 10 && stints[i - 1].team === stints[i + 1].team) {
      stints[i - 1].rows.push(...stints[i + 1].rows);
      stints.splice(i, 2);
      i--;
    }
  }
  const steps: (Step & { from: number })[] = stints.map(s => ({
    title: s.team,
    detail: [s.league === 'NHL' ? '' : leagueName(s.league), years(s.rows), bestLine(s.rows, goalie)].filter(Boolean).join(' · '),
    now: false,
    from: startYear(s.rows[0].season),
  }));
  if (draft) {
    const at = steps.reduce((idx, s, i) => (s.from < draft.year ? i + 1 : idx), 0);
    steps.splice(at, 0, { title: `Drafted #${draft.pick} by ${NHL_TEAMS[draft.team] ?? draft.team}`, detail: String(draft.year), now: false, from: draft.year });
  }
  const out: Step[] = steps.slice(-6).map(s => ({ title: s.title, detail: s.detail, now: s.now }));
  if (out.length) {
    out[out.length - 1].now = true;
    const nhlNow = all.filter(r => r.season === current && r.leagueAbbrev === 'NHL').reduce((s, r) => s + r.gamesPlayed, 0);
    const lastStint = stints.at(-1);
    if (nhlNow > 0 && lastStint && lastStint.league !== 'NHL') {
      out[out.length - 1].detail += ` · ${nhlNow} NHL game${nhlNow === 1 ? '' : 's'} this season`;
    }
  }
  return out;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── The one sentence ────────────────────────────────────────────────────────
export type VerdictInput = {
  goalie: boolean; status: 'minors' | 'injured' | 'out' | 'scratch' | null; minorsLeague: string | null;
  nhlGp: number; missed: number; heatRank: number | null; pointsRank: number | null; svRank: number | null;
  rising: boolean; g: number; a: number; w: number; one: string; many: string;
};

export function verdict(v: VerdictInput): string {
  const games = (n: number) => `${n} NHL game${n === 1 ? '' : 's'}`;
  if (v.status === 'minors') return `${games(v.nhlGp)} this season, now in the ${v.minorsLeague ?? 'minors'}.`;
  if ((v.status === 'injured' || v.status === 'out') && v.missed > 0) return `Out of the lineup for ${v.missed} straight games.`;
  if (v.nhlGp < MIN_GP) return v.nhlGp ? `${games(v.nhlGp)} this season.` : 'No NHL games yet this season.';
  if (v.goalie) {
    if (v.svRank != null && v.svRank <= 5) return `${ordinal(v.svRank)} in save % among NHL goalies.`;
    return `${v.w} win${v.w === 1 ? '' : 's'} in ${v.nhlGp} games this season.`;
  }
  if (v.heatRank === 1) return `The hottest ${v.one} in the NHL${v.rising ? ', and his points a game have gone up every season' : ''}.`;
  if (v.heatRank != null && v.heatRank <= 10) return `Among the 10 hottest ${v.many} in the NHL.`;
  if (v.pointsRank != null && v.pointsRank <= 25) return `${ordinal(v.pointsRank)} in points among NHL ${v.many}.`;
  return `${v.g} goals and ${v.a} assists in ${v.nhlGp} games this season.`;
}

// Points a game strictly up over his last three NHL seasons (5+ games each).
export function rising(columns: Column[]): boolean {
  const vs = columns.filter(c => !c.thin).slice(-3).map(c => c.value);
  return vs.length === 3 && vs[0] < vs[1] && vs[1] < vs[2];
}

// Axis names, drawn greyed before a player has enough games.
export const AXIS_LABELS = {
  F: F_AXES.map(a => a.label),
  D: D_AXES.map(a => a.label),
  G: ['Save %', 'Even strength', 'Shorthanded', 'Goals against', 'Quality starts', 'Workload'],
} as const;
