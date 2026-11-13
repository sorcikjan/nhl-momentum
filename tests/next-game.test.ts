import { describe, expect, it } from 'vitest';
import { nextGameFrom } from '@/lib/next-game';

const week = { games: [
  { gameDate: '2026-11-11', gameState: 'OFF', homeTeam: { abbrev: 'ANA' }, awayTeam: { abbrev: 'NSH' } },
  { gameDate: '2026-11-14', gameState: 'FUT', homeTeam: { abbrev: 'NYI' }, awayTeam: { abbrev: 'ANA' } },
  { gameDate: '2026-11-16', gameState: 'FUT', homeTeam: { abbrev: 'ANA' }, awayTeam: { abbrev: 'SJS' } },
] };

describe('nextGameFrom', () => {
  it('the first game not yet played, "@" when away', () => expect(nextGameFrom(week, 'ANA')).toEqual({ date: '2026-11-14', label: 'Sat @ NYI' }));
  it('"vs" at home; a live game counts as next', () => {
    expect(nextGameFrom({ games: [{ ...week.games[2], gameState: 'LIVE' }] }, 'ANA')).toEqual({ date: '2026-11-16', label: 'Mon vs SJS' });
  });
  it('nothing scheduled → null', () => expect(nextGameFrom({ games: [week.games[0]] }, 'ANA')).toBeNull());
});
