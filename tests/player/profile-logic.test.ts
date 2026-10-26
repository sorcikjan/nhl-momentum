import { describe, expect, it } from 'vitest';
import { gameLogRows, heatSeries } from '@/lib/player-profile';

const g = (o: Partial<Record<string, number>>, game: Record<string, unknown>) => ({
  goals: 0, assists: 0, plus_minus: 0, shots_on_goal: 0, toi_seconds: 1200, hits: 0, blocked_shots: 0, ...o, games: game,
});
const home = (date: string, hs: number, as: number) => ({ game_date: date, home_team_id: 22, home_score: hs, away_score: as, home_team: { abbrev: 'EDM' }, away_team: { abbrev: 'CGY' } });

describe('gameLogRows', () => {
  it('derives result and opponent from the player team', () => {
    const rows = gameLogRows([g({ goals: 1, assists: 1 }, home('2026-10-18', 4, 2))], 22);
    expect(rows[0]).toMatchObject({ result: 'W', opponent: 'CGY', home: true, goals: 1, assists: 1 });
  });
  it('marks a loss on the road', () => {
    expect(gameLogRows([g({}, home('2026-10-17', 4, 2))], 99)[0]).toMatchObject({ result: 'L', opponent: 'EDM', home: false });
    expect(gameLogRows([g({}, home('2026-10-17', 2, 4))], 22)[0].result).toBe('L');
  });
});

describe('heatSeries', () => {
  it('keeps one point per day, oldest first, within the window', () => {
    const s = heatSeries([
      { calculated_at: '2026-10-01T05:00:00Z', momentum_ppm: 0.06 },
      { calculated_at: '2026-10-01T11:00:00Z', momentum_ppm: 0.072 },
      { calculated_at: '2026-10-18T05:00:00Z', momentum_ppm: 0.12 },
    ], new Date('2026-10-19T00:00:00Z'), 42);
    expect(s.map(p => p.heat)).toEqual([60, 100]);
  });
});


describe('heatSeries — empty windows', () => {
  it('skips snapshots with no games in the momentum window (no data is not Heat 0)', () => {
    const s = heatSeries([
      { calculated_at: '2026-10-10T05:00:00Z', momentum_ppm: 0.1, momentum_games: 5 },
      { calculated_at: '2026-10-13T05:00:00Z', momentum_ppm: 0, momentum_games: 0 },
      { calculated_at: '2026-10-18T05:00:00Z', momentum_ppm: 0.12, momentum_games: 5 },
    ], new Date('2026-10-19T00:00:00Z'), 42);
    expect(s.map(p => p.heat)).toEqual([83, 100]);
  });
});

import { currentSeasonRows } from '@/lib/player-profile';

describe('currentSeasonRows', () => {
  it('keeps only this season’s regular-season and playoff games', () => {
    const rows = [{ game_id: 2026020050 }, { game_id: 2026010003 }, { game_id: 2025030411 }, { game_id: 2025020800 }];
    expect(currentSeasonRows(rows, 2026).map(r => r.game_id)).toEqual([2026020050]);
  });
});
