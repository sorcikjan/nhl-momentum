import { describe, expect, it } from 'vitest';
import { formatAccuracy, recapToStories, toResultCard, todayET } from '@/lib/home';

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
    expect(toResultCard(game(3, 2), { home_win_probability: 0.6 }).pick).toBe('hit');
  });
  it('marks a miss when the favored side lost', () => {
    const r = toResultCard(game(3, 2), { home_win_probability: 0.4 });
    expect(r.pick).toBe('miss');
    expect(r.pickTeam).toBe('CAR');
    expect(r.pickPct).toBe(60);
  });
  it('has no pick without a prediction', () => {
    expect(toResultCard(game(3, 2), null).pick).toBeNull();
  });
  it('prefers the recorded outcome when present', () => {
    expect(toResultCard(game(3, 2), { home_win_probability: 0.6, prediction_outcomes: [{ correct_winner: false }] }).pick).toBe('miss');
  });
  it('takes the first star from three_stars', () => {
    const stars = [{ star: 1, playerId: 8482445, name: { default: 'D. Cooley' }, teamAbbrev: 'CGY', position: 'G' }];
    expect(toResultCard(game(3, 2, stars), null).star).toEqual({ playerId: 8482445, name: 'D. Cooley', team: 'CGY', goalie: true, photo: null });
  });
  it('carries the first star headshot from the NHL three stars', () => {
    const stars = [{ star: 1, playerId: 1, name: { default: 'K. Kaprizov' }, teamAbbrev: 'MIN', position: 'L', headshot: 'https://assets.nhle.com/mugs/x.png' }];
    expect(toResultCard(game(3, 2, stars), null).star?.photo).toBe('https://assets.nhle.com/mugs/x.png');
  });
});

describe('formatAccuracy', () => {
  it('rounds the season pick accuracy', () => {
    expect(formatAccuracy(66.6)).toBe('67% pick accuracy · YTD');
  });
  it('never invents a number', () => {
    expect(formatAccuracy(null)).not.toContain('%');
  });
});

describe('recapToStories', () => {
  const recap = {
    date: '2026-10-18',
    title: 'Flames Extinguish Reigning Champs',
    summary: 'Calgary beat Carolina 3-2.',
    content: 'Lede.\n\n### CAR 2 @ CGY 3\n\nDustin Wolf stopped 30. More.\n\n### CBJ 1 @ MIN 2\n\nKaprizov scored late.\n\n### Momentum Watch\n\nx\n\n### Looking Ahead\n\ny',
  };
  it('leads with the recap and follows with its game sections only', () => {
    const s = recapToStories(recap, 'flames-extinguish-reigning-champs');
    expect(s[0].title).toBe('Flames Extinguish Reigning Champs');
    expect(s.map(x => x.title)).toEqual(['Flames Extinguish Reigning Champs', 'CAR 2 @ CGY 3', 'CBJ 1 @ MIN 2']);
    expect(s[1].dek).toBe('Dustin Wolf stopped 30.');
    expect(s[1].team).toBe('CGY');
  });
  it('returns nothing without a recap', () => {
    expect(recapToStories(null, '')).toEqual([]);
  });
});

describe('todayET', () => {
  it('uses the Eastern date during late games (02:30 UTC is still the previous day in ET)', () => {
    expect(todayET(new Date('2026-10-20T02:30:00Z'))).toBe('2026-10-19');
  });
});
