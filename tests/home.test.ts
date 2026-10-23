import { describe, expect, it } from 'vitest';
import { toResultCard, todayET } from '@/lib/home';

const game = (homeScore: number, awayScore: number, threeStars: unknown = null) => ({
  id: 2026020136,
  game_date: '2026-10-18',
  home_score: homeScore,
  away_score: awayScore,
  three_stars: threeStars,
  home_team: { abbrev: 'CGY', name: 'Calgary Flames' },
  away_team: { abbrev: 'CAR', name: 'Carolina Hurricanes' },
});

describe('toResultCard', () => {
  it('marks a hit when the favored side won', () => {
    expect(toResultCard(game(3, 2), { home_win_probability: 0.6 }).pickResult).toBe('hit');
  });
  it('marks a miss when the favored side lost', () => {
    const r = toResultCard(game(3, 2), { home_win_probability: 0.4 });
    expect(r.pickResult).toBe('miss');
    expect(r.pick).toEqual({ abbrev: 'CAR', pct: 60 });
  });
  it('has no pick without a prediction', () => {
    expect(toResultCard(game(3, 2), null).pick).toBeNull();
    expect(toResultCard(game(3, 2), null).pickResult).toBeNull();
  });
  it('prefers the recorded outcome when present', () => {
    expect(toResultCard(game(3, 2), { home_win_probability: 0.6, prediction_outcomes: [{ correct_winner: false }] }).pickResult).toBe('miss');
  });
});



describe('todayET', () => {
  it('uses the Eastern date during late games (02:30 UTC is still the previous day in ET)', () => {
    expect(todayET(new Date('2026-10-20T02:30:00Z'))).toBe('2026-10-19');
  });
});
