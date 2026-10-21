import { describe, expect, it } from 'vitest';
import { pregameKeyPlayers, whyWatch } from '@/lib/key-players';

const sk = (id: number, mom: number, sea = mom, injury: string | null = null) => ({
  playerId: id, playerName: `Player ${id}`, position: 'C', compositePpm: mom, momentumPpm: mom, seasonPpm: sea, injuryStatus: injury,
});

describe('pregameKeyPlayers', () => {
  it('takes the three hottest healthy skaters with photo and reason', () => {
    const r = pregameKeyPlayers(
      [sk(1, 0.05), sk(2, 0.12), sk(3, 0.09, 0.09, 'IR'), sk(4, 0.08), sk(5, 0.07)],
      new Map([[2, { goals: 3, assists: 4, games: 5, photo: 'p2.png' }]]),
      'EDM',
    );
    expect(r.map(p => p.playerId)).toEqual([2, 4, 5]);
    expect(r[0]).toMatchObject({ name: 'Player 2', href: '/players/2/player-2', photo: 'p2.png', heat: 100, team: 'EDM', line: '7 pts in last 5' });
  });
  it('can return a deeper pool for picking who actually played', () => {
    expect(pregameKeyPlayers([1, 2, 3, 4, 5].map(i => sk(i, 0.01 * i)), new Map(), 'EDM', 8)).toHaveLength(5);
  });
  it('returns fewer than three when the roster is short, none when empty', () => {
    expect(pregameKeyPlayers([sk(1, 0.05)], new Map(), 'EDM')).toHaveLength(1);
    expect(pregameKeyPlayers([], new Map(), 'EDM')).toEqual([]);
  });
});

describe('whyWatch', () => {
  it('leads with a point-per-game streak', () => {
    expect(whyWatch({ goals: 2, assists: 3, games: 5 }, 0.1, 0.1, 1)).toBe('5 pts in last 5');
  });
  it('then a big jump over season pace', () => {
    expect(whyWatch({ goals: 1, assists: 1, games: 5 }, 0.1, 0.07, 1)).toBe('+43% vs season pace');
  });
  it('then goals', () => {
    expect(whyWatch({ goals: 3, assists: 0, games: 5 }, 0.05, 0.05, 1)).toBe('3 goals in last 5');
  });
  it('then any points', () => {
    expect(whyWatch({ goals: 0, assists: 2, games: 5 }, 0.05, 0.05, 1)).toBe('2 pts in last 5');
  });
  it('falls back to the team Heat rank, never inventing form', () => {
    expect(whyWatch(undefined, 0.05, 0.05, 2)).toBe('#2 Heat on his team');
    expect(whyWatch({ goals: 0, assists: 0, games: 5 }, 0.05, 0.05, 1)).toBe('#1 Heat on his team');
  });
});
