// Pure view logic for the player profile (docs/design/redesign-2026/player-profile-final.js).
import { ppmToHeat } from '@/lib/heat';

export type Tone = 'heat' | 'rise' | 'gold' | 'red' | 'cold' | 'text';
export type Chip = { label: string; value: string; tone: Tone };
export type Tile = { label: string; value: string; tone?: Tone };

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

// "RECENT FORM · AI" side chips — derived from data, not generated text.
export function formChips(i: { heats: number[]; pointsByGame: number[]; energy: number | null; heat: number | null }): Chip[] {
  const recent = i.heats.slice(-5);
  let trend: Chip = { label: 'Trend', value: 'Not enough games', tone: 'text' };
  if (recent.length >= 2) {
    const d = recent[recent.length - 1] - recent[0];
    trend = d >= 8 ? { label: 'Trend', value: 'Climbing', tone: 'rise' }
      : d <= -8 ? { label: 'Trend', value: 'Cooling', tone: 'cold' }
      : { label: 'Trend', value: 'Steady', tone: 'text' };
  }
  let n = 0;
  for (const p of i.pointsByGame) { if (p > 0) n++; else break; }
  const streak: Chip = n >= 2 ? { label: 'Streak', value: `${n}-game point streak`, tone: 'heat' } : { label: 'Streak', value: 'No active streak', tone: 'text' };
  const e = i.energy;
  const risk: Chip = e == null ? { label: 'Risk', value: 'Unknown', tone: 'text' }
    : e >= 80 ? { label: 'Risk', value: 'Low fatigue', tone: 'rise' }
    : e >= 50 ? { label: 'Risk', value: 'Moderate fatigue', tone: 'gold' }
    : { label: 'Risk', value: 'High fatigue', tone: 'red' };
  const h = i.heat;
  const outlook: Chip = h == null ? { label: 'Outlook', value: 'No games yet', tone: 'text' }
    : h >= 85 ? { label: 'Outlook', value: 'Elite', tone: 'heat' }
    : h >= 70 ? { label: 'Outlook', value: 'Hot', tone: 'heat' }
    : h >= 55 ? { label: 'Outlook', value: 'Warm', tone: 'gold' }
    : h >= 40 ? { label: 'Outlook', value: 'Neutral', tone: 'text' }
    : { label: 'Outlook', value: 'Cold', tone: 'cold' };
  return [trend, streak, risk, outlook];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export type GameRow = { date: string; opponent: string; home: boolean; result: 'W' | 'L' | null; goals: number; assists: number; plusMinus: number; toi: string; heat: number };

// The trend chart's games, oldest first, this season only. Skater rows come
// from game_player_stats, goalie rows from game_goalie_stats (both with games joined).
export function trendGames(games: any[], teamId: number | null, kind: 'skater' | 'goalie', seasonStart: string): import('@/components/player/TrendChart').TrendGame[] {
  return games
    .filter(g => (g.games?.game_date ?? '') >= seasonStart)
    .map(g => {
      const gm = g.games ?? {};
      const opp = (gm.home_team_id === teamId ? gm.away_team?.abbrev : gm.home_team?.abbrev) ?? '';
      return kind === 'goalie'
        ? { date: gm.game_date, opp, svPct: g.save_pct != null ? Number(g.save_pct) : null, ga: g.goals_against ?? 0, sa: g.shots_against ?? 0 }
        : { date: gm.game_date, opp, g: g.goals ?? 0, a: g.assists ?? 0, pts: (g.goals ?? 0) + (g.assists ?? 0), sog: g.shots_on_goal ?? 0, toi: Math.round(Number(g.toi_seconds ?? 0) / 6) / 10, pm: g.plus_minus ?? 0 };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function gameLogRows(games: any[], teamId: number | null): GameRow[] {
  return games.map(g => {
    const gm = g.games ?? {};
    const home = gm.home_team_id === teamId;
    const ts = home ? gm.home_score : gm.away_score;
    const os = home ? gm.away_score : gm.home_score;
    const toi = Number(g.toi_seconds ?? 0);
    const pts = (g.goals ?? 0) + (g.assists ?? 0);
    return {
      date: gm.game_date ?? '',
      opponent: (home ? gm.away_team?.abbrev : gm.home_team?.abbrev) ?? '',
      home,
      result: ts == null || os == null ? null : ts > os ? 'W' : 'L',
      goals: g.goals ?? 0,
      assists: g.assists ?? 0,
      plusMinus: g.plus_minus ?? 0,
      toi: mmss(toi),
      heat: ppmToHeat(toi > 0 ? pts / (toi / 60) : 0),
    };
  });
}

export function last5Tiles(games: any[]): Tile[] {
  const l5 = games.slice(0, 5);
  const sum = (k: string) => l5.reduce((s, g) => s + Number(g[k] ?? 0), 0);
  const goals = sum('goals'), assists = sum('assists'), shots = sum('shots_on_goal'), pm = sum('plus_minus');
  const toi = l5.length ? sum('toi_seconds') / l5.length : 0;
  return [
    { label: 'G', value: String(goals), tone: 'heat' },
    { label: 'A', value: String(assists) },
    { label: 'PTS', value: String(goals + assists) },
    { label: '+/-', value: signed(pm), tone: pm >= 0 ? 'rise' : 'red' },
    { label: 'SOG', value: String(shots) },
    { label: 'SH%', value: shots ? `${((goals / shots) * 100).toFixed(1)}%` : '—', tone: 'heat' },
    { label: 'TOI', value: mmss(toi) },
    { label: 'HITS', value: String(sum('hits')) },
    { label: 'BLK', value: String(sum('blocked_shots')) },
  ];
}

export function seasonTiles(s: Record<string, any>): Tile[] {
  const gp = Math.max(1, Number(s.season_games ?? 0));
  const n = (k: string) => Number(s[k] ?? 0);
  return [
    { label: 'POINTS', value: String(n('season_points') || n('season_goals') + n('season_assists')) },
    { label: 'GOALS', value: String(n('season_goals')) },
    { label: 'ASSISTS', value: String(n('season_assists')) },
    { label: 'POINTS/GM', value: ((n('season_goals') + n('season_assists')) / gp).toFixed(2) },
    { label: 'PLUS-MINUS', value: signed(n('season_plus_minus')) },
    { label: 'SHOOTING %', value: `${(n('season_shooting_pct') * 100).toFixed(1)}%` },
    { label: 'TOI/GM', value: mmss(n('season_toi_sec') / gp) },
    { label: 'SHOTS', value: String(n('season_shots')) },
    { label: 'PP GOALS', value: String(n('season_pp_goals')) },
    { label: 'PP POINTS', value: String(n('season_pp_points')) },
    { label: 'GW GOALS', value: String(n('season_gw_goals')) },
    { label: 'SH POINTS', value: String(n('season_sh_points')) },
  ];
}

// One Heat point per day (latest snapshot that day), oldest first, last `days` days.
// Snapshots with no games in the momentum window carry no information (written
// during pipeline gaps) — they're skipped rather than plotted as Heat 0.
export function heatSeries(timeline: { calculated_at: string; momentum_ppm: number | null; momentum_games?: number | null }[], now: Date, days: number) {
  const cutoff = now.getTime() - days * 86_400_000;
  const byDay = new Map<string, { date: string; heat: number; ts: number }>();
  for (const t of timeline) {
    const ts = Date.parse(t.calculated_at);
    if (ts < cutoff || t.momentum_games === 0) continue;
    const day = t.calculated_at.slice(0, 10);
    const prev = byDay.get(day);
    if (!prev || ts > prev.ts) byDay.set(day, { date: day, heat: ppmToHeat(t.momentum_ppm), ts });
  }
  return [...byDay.values()].sort((a, b) => a.ts - b.ts).map(({ date, heat }) => ({ date, heat }));
}
/* eslint-enable @typescript-eslint/no-explicit-any */

type League = {
  goalsPerGame?: number; assistsPerGame?: number; shootingPct?: number;
  p95GoalsPerGame?: number; p95AssistsPerGame?: number; p95PlusMinusPerGame?: number; p5PlusMinusPerGame?: number;
} | null;

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

// Six-axis "shape of his game", 0..1 against the league's 95th percentile (or a
// fixed elite ceiling where we have no percentile: SH% 25%, PP 0.5/gm, TOI 25 min).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function radarStats(s: Record<string, any>, lg: League): { label: string; value: number }[] {
  if (!lg) return [];
  const gp = Math.max(1, Number(s.season_games ?? 0));
  const n = (k: string) => Number(s[k] ?? 0);
  const pmLo = lg.p5PlusMinusPerGame ?? -1, pmHi = lg.p95PlusMinusPerGame ?? 1;
  return [
    { label: 'SCORING', value: clamp01(n('season_goals') / gp / (lg.p95GoalsPerGame || 0.6)) },
    { label: 'PLAYMAKING', value: clamp01(n('season_assists') / gp / (lg.p95AssistsPerGame || 0.9)) },
    { label: 'SHOOTING', value: clamp01(n('season_shooting_pct') / 0.25) },
    { label: '+/-', value: clamp01((n('season_plus_minus') / gp - pmLo) / (pmHi - pmLo || 1)) },
    { label: 'POWER PLAY', value: clamp01(n('season_pp_points') / gp / 0.5) },
    { label: 'USAGE', value: clamp01(n('season_toi_sec') / gp / (25 * 60)) },
  ];
}

export type VsRow = { label: string; you: number; league: number; top: number | null; topLabel: string | null; unit: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function vsLeagueRows(s: Record<string, any>, lg: League): VsRow[] {
  if (!lg) return [];
  const gp = Math.max(1, Number(s.season_games ?? 0));
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const g = Number(s.season_goals ?? 0) / gp, a = Number(s.season_assists ?? 0) / gp;
  return [
    { label: 'Points per game', you: r2(g + a), league: r2((lg.goalsPerGame ?? 0) + (lg.assistsPerGame ?? 0)), top: null, topLabel: null, unit: '' },
    { label: 'Goals per game', you: r2(g), league: r2(lg.goalsPerGame ?? 0), top: lg.p95GoalsPerGame != null ? r2(lg.p95GoalsPerGame) : null, topLabel: 'Top 5%', unit: '' },
    { label: 'Assists per game', you: r2(a), league: r2(lg.assistsPerGame ?? 0), top: lg.p95AssistsPerGame != null ? r2(lg.p95AssistsPerGame) : null, topLabel: 'Top 5%', unit: '' },
    { label: 'Shooting %', you: r2(Number(s.season_shooting_pct ?? 0) * 100), league: r2((lg.shootingPct ?? 0) * 100), top: null, topLabel: null, unit: '%' },
  ];
}

// Rows from the season starting in `startYear`, regular season + playoffs only
// (game ids are YYYYTTNNNN; TT 01 = preseason).
export function currentSeasonRows<T extends { game_id: number }>(rows: T[], startYear: number): T[] {
  return rows.filter(r => {
    const id = String(r.game_id);
    return id.startsWith(String(startYear)) && id.slice(4, 6) !== '01';
  });
}
