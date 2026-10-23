import { describe, expect, it } from 'vitest';
import { leaderRows, standingRows } from '@/lib/nhl-stats';

describe('standingRows', () => {
  it('keeps the official record and adds our Heat and team link', () => {
    const [r] = standingRows([{
      teamAbbrev: { default: 'FLA' }, teamCommonName: { default: 'Panthers' }, conferenceName: 'Eastern', divisionName: 'Atlantic',
      gamesPlayed: 11, wins: 5, losses: 4, otLosses: 2, points: 12, goalDifferential: -3, l10Wins: 4, l10Losses: 4, l10OtLosses: 2, streakCode: 'L', streakCount: 2,
    }], { FLA: 79 }, { FLA: { id: 13, name: 'Florida Panthers' } });
    expect(r).toMatchObject({ abbrev: 'FLA', name: 'Panthers', pts: 12, l10: '4-4-2', streak: 'L2', heat: 79, href: '/teams/13/florida-panthers' });
  });
});

describe('leaderRows', () => {
  it('formats each category the way fans read it', () => {
    const p = (value: number) => [{ id: 1, firstName: { default: 'Linus' }, lastName: { default: 'Ullmark' }, teamAbbrev: 'OTT', position: 'G', value }];
    expect(leaderRows('savePctg', p(0.945055))[0].value).toBe('.945');
    expect(leaderRows('goalsAgainstAverage', p(1.23313))[0].value).toBe('1.23');
    expect(leaderRows('plusMinus', p(9))[0].value).toBe('+9');
    expect(leaderRows('points', p(31), { 1: 100 })[0]).toMatchObject({ value: '31', heat: 100, href: '/players/1/linus-ullmark' });
  });
});
