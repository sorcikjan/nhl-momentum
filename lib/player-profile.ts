// Heat over time for the player profile.
import { ppmToHeat } from '@/lib/heat';


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

// Rows from the season starting in `startYear`, regular season + playoffs only
// (game ids are YYYYTTNNNN; TT 01 = preseason).
export function currentSeasonRows<T extends { game_id: number }>(rows: T[], startYear: number): T[] {
  return rows.filter(r => {
    const id = String(r.game_id);
    return id.startsWith(String(startYear)) && id.slice(4, 6) !== '01';
  });
}
