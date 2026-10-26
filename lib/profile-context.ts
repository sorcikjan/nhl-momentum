// Context for every number on the player profile: compared with his position
// (forwards or defensemen), with his own season and with the league leader.
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
const percentile = (xs: number[], v: number) => (xs.length ? Math.min(99, Math.round((100 * xs.filter(x => x < v).length) / xs.length)) : 0);
const rankOf = (xs: number[], v: number) => 1 + xs.filter(x => x > v).length;
const p95 = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * 0.95))] : 0; };

export type HeatContext = { heat: number; pct: number; avg: number; top: number };
export function heatContext(me: Peer, peers: Peer[]): HeatContext {
  const xs = peers.map(p => p.heat);
  return { heat: me.heat, pct: percentile(xs, me.heat), avg: Math.round(mean(xs)), top: Math.round(p95(xs)) };
}

export const energyAverage = (peers: Peer[]) => Math.round(mean(peers.map(p => p.energy)));

// ── Where he stands: season totals with the average and the leader ──────────
export type StandKey = 'pts' | 'g' | 'a' | 'sog' | 'ppp' | 'pm' | 'toiMin';
export type Standing = {
  key: StandKey; label: string; me: number; avg: number; rank: number; n: number;
  leader: { name: string; team: string; value: number; isMe: boolean };
};
const STANDS: { key: StandKey; label: string }[] = [
  { key: 'pts', label: 'Points' }, { key: 'g', label: 'Goals' }, { key: 'a', label: 'Assists' }, { key: 'sog', label: 'Shots' },
  { key: 'ppp', label: 'Power-play points' }, { key: 'pm', label: 'Plus/minus' }, { key: 'toiMin', label: 'Ice time a game' },
];

export function standings(me: Peer, peers: Peer[]): Standing[] {
  return STANDS.map(({ key, label }) => {
    const xs = peers.map(p => p[key]);
    // Ties for the lead go to him, so a shared lead reads "leads".
    const lead = peers.reduce((b, p) => (p[key] > b[key] || (p[key] === b[key] && p.id === me.id) ? p : b), peers[0] ?? me);
    return {
      key, label, me: me[key], avg: mean(xs), rank: rankOf(xs, me[key]), n: peers.length,
      leader: { name: lead.last, team: lead.team, value: lead[key], isMe: lead.id === me.id },
    };
  });
}

// ── Radar: per-game rates as percentiles of his position ────────────────────
export type RadarAxis = { label: string; word: string; pct: number };
export function radarAxes(me: Peer, peers: Peer[]): RadarAxis[] {
  const per = (f: (p: Peer) => number) => percentile(peers.map(p => (p.gp ? f(p) / p.gp : 0)), me.gp ? f(me) / me.gp : 0);
  return [
    { label: 'Goals', word: 'goals', pct: per(p => p.g) },
    { label: 'Assists', word: 'assists', pct: per(p => p.a) },
    { label: 'Shots', word: 'shots', pct: per(p => p.sog) },
    { label: 'PP points', word: 'power-play points', pct: per(p => p.ppp) },
    { label: 'Ice time', word: 'ice time', pct: percentile(peers.map(p => p.toiMin), me.toiMin) },
    { label: '+/-', word: 'plus/minus', pct: per(p => p.pm) },
  ];
}

export const ordinal = (n: number) => {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${s}`;
};

export function strengthsLine(axes: RadarAxis[]): { strong: string[]; weak: string[] } {
  const sorted = [...axes].sort((a, b) => b.pct - a.pct);
  return {
    strong: sorted.filter(a => a.pct >= 75).slice(0, 3).map(a => `${a.word} (${ordinal(a.pct)})`),
    weak: sorted.filter(a => a.pct < 50).reverse().slice(0, 2).map(a => `${a.word} (${ordinal(a.pct)})`),
  };
}

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

// ── Last 5: against his own season and the average at his position ──────────
export type L5Key = 'g' | 'a' | 'pts' | 'sog' | 'shPct' | 'pm' | 'toi';
export type L5Row = { key: L5Key; label: string; l5: number; own: number; pos: number; verdict: { text: string; tone: 'rise' | 'red' | 'muted' } };
export type L5 = { n: number; rows: L5Row[] };

export function last5(games: GameLine[], me: Peer, peers: Peer[]): L5 | null {
  const l5 = games.slice(-5);
  if (l5.length < 3 || !me.gp) return null;
  const k = l5.length; // per k games, so a 4-game stretch compares fairly
  const sum = (f: (x: GameLine) => number) => l5.reduce((s, x) => s + f(x), 0);
  const perK = (v: number, gp: number) => (gp ? (v / gp) * k : 0);
  const posPer = (f: (p: Peer) => number) => mean(peers.map(p => perK(f(p), p.gp)));
  const g = sum(x => x.g), a = sum(x => x.a), sog = sum(x => x.sog);
  const posShots = peers.reduce((s, p) => s + p.sog, 0);
  const rows: Omit<L5Row, 'verdict'>[] = [
    { key: 'g', label: 'Goals', l5: g, own: perK(me.g, me.gp), pos: posPer(p => p.g) },
    { key: 'a', label: 'Assists', l5: a, own: perK(me.a, me.gp), pos: posPer(p => p.a) },
    { key: 'pts', label: 'Points', l5: g + a, own: perK(me.g + me.a, me.gp), pos: posPer(p => p.g + p.a) },
    { key: 'sog', label: 'Shots', l5: sog, own: perK(me.sog, me.gp), pos: posPer(p => p.sog) },
    { key: 'shPct', label: 'Shooting %', l5: sog ? g / sog : 0, own: me.sog ? me.g / me.sog : 0, pos: posShots ? peers.reduce((s, p) => s + p.g, 0) / posShots : 0 },
    { key: 'pm', label: 'Plus/minus', l5: sum(x => x.pm), own: perK(me.pm, me.gp), pos: posPer(p => p.pm) },
    { key: 'toi', label: 'Ice time a game', l5: sum(x => x.toi) / k / 60, own: me.toiMin, pos: mean(peers.map(p => p.toiMin)) },
  ];
  return {
    n: k,
    rows: rows.map(r => {
      if (r.key === 'pm') {
        const d = Math.round(r.l5 - r.own);
        return { ...r, verdict: { text: d === 0 ? 'his usual' : `${d > 0 ? '+' : '−'}${Math.abs(d)} vs his usual`, tone: d > 0 ? 'rise' : d < 0 ? 'red' : 'muted' } };
      }
      if (!r.own) return { ...r, verdict: { text: r.l5 > 0 ? 'new this season' : '—', tone: r.l5 > 0 ? 'rise' : 'muted' } };
      const x = r.l5 / r.own;
      const tone = x >= 1.15 ? 'rise' : x <= 0.85 ? 'red' : 'muted';
      return { ...r, verdict: { text: `${tone === 'rise' ? '▲' : tone === 'red' ? '▼' : '≈'} ${x.toFixed(1)}× his usual`, tone } };
    }),
  };
}

const times = (x: number) => (x >= 10 ? `${Math.round(x)}×` : `${x.toFixed(1)}×`);

// One sentence on the stretch, from the table it sits above.
export function last5Line(t: L5, group: Group): string {
  const r = Object.fromEntries(t.rows.map(x => [x.key, x])) as Record<L5Key, L5Row>;
  const { one } = groupWords(group);
  const pts = r.pts, games = `${t.n} games`;
  const head = `${pts.l5} point${pts.l5 === 1 ? '' : 's'}${r.g.l5 ? ` and ${r.g.l5} goal${r.g.l5 === 1 ? '' : 's'}` : ''} in ${games}`;
  const vsPos = pts.pos > 0 && pts.l5 > 0 ? `${times(pts.l5 / pts.pos)} what an average ${one} scores in ${games}` : null;
  let s: string;
  if (!pts.own) s = `${head}.`;
  else if (pts.l5 >= pts.own * 1.15) s = `${head} — ${times(pts.l5 / pts.own)} his usual pace${vsPos ? `, and ${vsPos}` : ''}.`;
  else if (pts.l5 <= pts.own * 0.85) s = `${head} — below his own pace (${pts.own.toFixed(1)} per ${t.n})${vsPos && pts.l5 > pts.pos ? `, yet still ${vsPos}` : ''}.`;
  else s = `${head} — right on his usual pace${vsPos ? `, ${vsPos}` : ''}.`;
  // The likeliest reason a scoring run is (or isn't) real: his shooting luck.
  const sh = r.shPct;
  if (r.sog.l5 >= 8 && sh.own > 0 && Math.abs(sh.l5 - sh.own) >= 0.08) {
    s += ` He's shooting ${Math.round(sh.l5 * 100)}% in this stretch against ${Math.round(sh.own * 100)}% on the season.`;
  }
  return s;
}

// One sentence on the Heat line: where it went and where that sits.
export function trendLine(games: GameLine[], h: HeatContext, group: Group): string | null {
  const hs = games.filter(g => g.heat != null) as (GameLine & { heat: number })[];
  if (hs.length < 3) return null;
  const { one, many } = groupWords(group);
  const now = hs[hs.length - 1].heat;
  const from = hs[Math.max(0, hs.length - 6)].heat;
  // The latest peak of the last ten games: a drop from it is the story even
  // when he's still above where he was five games ago.
  const peak = hs.slice(-10).reduce((b, g) => (g.heat >= b.heat ? g : b));
  const where = now >= h.top ? `top 5% of ${many}` : `hotter than ${h.pct}% of ${many}`;
  if (peak.heat - now >= 20) return `Cooling: ${peak.heat} after the game against ${peak.opp}, ${now} now — still ${where} (average ${one} ${h.avg}).`;
  if (now - from >= 20) return `Up from ${from} to ${now} in his last ${Math.min(5, hs.length - 1)} games — ${where}, against an average ${one} at ${h.avg}.`;
  return `Steady around ${now} lately — ${where}, against an average ${one} at ${h.avg}.`;
}

// ── Season by season (NHL regular season, from the NHL player landing) ─────
export type SeasonRow = {
  season: string; team: string; teamName: string; gp: number; g: number; a: number; pts: number; pm: number;
  w?: number; l?: number; svPct?: number | null; gaa?: number | null;
};

const BY_COMMON_NAME: Record<string, string> = {
  Ducks: 'ANA', Coyotes: 'ARI', Bruins: 'BOS', Sabres: 'BUF', Flames: 'CGY', Hurricanes: 'CAR', Blackhawks: 'CHI', Avalanche: 'COL',
  'Blue Jackets': 'CBJ', Stars: 'DAL', 'Red Wings': 'DET', Oilers: 'EDM', Panthers: 'FLA', Kings: 'LAK', Wild: 'MIN', Canadiens: 'MTL',
  Predators: 'NSH', Devils: 'NJD', Islanders: 'NYI', Rangers: 'NYR', Senators: 'OTT', Flyers: 'PHI', Penguins: 'PIT', Sharks: 'SJS',
  Kraken: 'SEA', Blues: 'STL', Lightning: 'TBL', 'Maple Leafs': 'TOR', Canucks: 'VAN', 'Golden Knights': 'VGK', Capitals: 'WSH', Jets: 'WPG',
  'Utah Hockey Club': 'UTA', Mammoth: 'UTA', 'Hockey Club': 'UTA',
};

const seasonLabel = (s: number) => { const y = String(s); return `${y.slice(0, 4)}–${y.slice(6, 8)}`; };

/* eslint-disable @typescript-eslint/no-explicit-any */
export function seasonRows(landing: any): SeasonRow[] {
  const totals: any[] = Array.isArray(landing?.seasonTotals) ? landing.seasonTotals : [];
  return totals
    .filter(t => t.leagueAbbrev === 'NHL' && t.gameTypeId === 2)
    .sort((x, y) => x.season - y.season || (x.sequence ?? 0) - (y.sequence ?? 0))
    .map(t => ({
      season: seasonLabel(t.season), team: BY_COMMON_NAME[t.teamCommonName?.default ?? ''] ?? '', teamName: t.teamName?.default ?? '',
      gp: t.gamesPlayed ?? 0, g: t.goals ?? 0, a: t.assists ?? 0, pts: t.points ?? (t.goals ?? 0) + (t.assists ?? 0), pm: t.plusMinus ?? 0,
      ...(t.wins != null || t.savePctg != null ? { w: t.wins ?? 0, l: t.losses ?? 0, svPct: t.savePctg ?? null, gaa: t.goalsAgainstAvg ?? null } : {}),
    }));
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// "On pace for N points" against his best full season — skaters, once the
// current season has enough games to project from.
export function paceLine(rows: SeasonRow[], current: string): string | null {
  const by = new Map<string, { gp: number; pts: number }>();
  for (const r of rows) { const s = by.get(r.season) ?? { gp: 0, pts: 0 }; by.set(r.season, { gp: s.gp + r.gp, pts: s.pts + r.pts }); }
  const now = by.get(current);
  if (!now || now.gp < 5) return null;
  const pace = Math.round((now.pts / now.gp) * 82);
  const past = [...by.entries()].filter(([s]) => s !== current);
  if (!past.length) return `On pace for ${pace} points over 82 games in his first NHL season.`;
  const [bestSeason, best] = past.reduce((b, e) => (e[1].pts > b[1].pts ? e : b));
  const cmp = pace > best.pts ? 'which would beat' : pace === best.pts ? 'level with' : 'against';
  return `On pace for ${pace} points over 82 games, ${cmp} his best season so far: ${best.pts} in ${bestSeason}.`;
}
