import { describe, expect, it } from 'vitest';
import { heatSeries } from '@/lib/player-profile';

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
