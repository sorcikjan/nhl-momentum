import { describe, expect, it } from 'vitest';
import { calcWatchability } from '@/lib/watchability';

describe('calcWatchability (regular season)', () => {
  it('rewards star power and a close game', () => {
    expect(calcWatchability({ topHomeHeat: 90, topAwayHeat: 70, homeWinProbability: 0.5, isPlayoff: false })).toBe(86);
  });
  it('drops for a lopsided matchup', () => {
    expect(calcWatchability({ topHomeHeat: 90, topAwayHeat: 70, homeWinProbability: 1, isPlayoff: false })).toBe(56);
  });
  it('stays in range with no data', () => {
    expect(calcWatchability({ topHomeHeat: 0, topAwayHeat: 0, homeWinProbability: null, isPlayoff: false })).toBe(26);
  });
});
