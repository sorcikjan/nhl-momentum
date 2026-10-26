// Pure view logic for the player profile (docs/design/redesign-2026/player-profile-final.js).
import { ppmToHeat } from '@/lib/heat';

export type Tone = 'heat' | 'rise' | 'gold' | 'red' | 'cold' | 'text';
export type Tile = { label: string; value: string; tone?: Tone };

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;

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

// Rows from the season starting in `startYear`, regular season + playoffs only
// (game ids are YYYYTTNNNN; TT 01 = preseason).
export function currentSeasonRows<T extends { game_id: number }>(rows: T[], startYear: number): T[] {
  return rows.filter(r => {
    const id = String(r.game_id);
    return id.startsWith(String(startYear)) && id.slice(4, 6) !== '01';
  });
}
