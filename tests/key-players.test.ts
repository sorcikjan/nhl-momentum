import { describe, expect, it } from 'vitest';
import { postgameKeyPlayers, pregameKeyPlayers, statLine, whyWatch } from '@/lib/key-players';

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

const st = (id: number, g: number, a: number, sog: number, pm: number) => ({
  player_id: id, goals: g, assists: a, shots_on_goal: sog, plus_minus: pm,
  players: { first_name: 'P', last_name: `${id}`, position_code: 'C', headshot_url: `${id}.png` },
});

describe('postgameKeyPlayers', () => {
  it('ranks by points, then goals, then shots, then plus/minus', () => {
    const r = postgameKeyPlayers([st(1, 0, 1, 2, 0), st(2, 1, 1, 3, 1), st(3, 2, 0, 4, 1), st(4, 0, 2, 1, 2)], null, 'EDM', new Map([[3, 12]]));
    expect(r.map(p => p.playerId)).toEqual([3, 2, 4]);
    expect(r[0]).toMatchObject({ line: '2G · 4 SOG · +1', photo: '3.png', delta: 12 });
  });
  it('lets an outstanding goalie take the third spot', () => {
    const g = { player_id: 9, shots_against: 36, goals_against: 1, save_pct: 0.972, players: { first_name: 'G', last_name: 'Nine' } };
    const r = postgameKeyPlayers([st(1, 1, 0, 2, 0), st(2, 1, 0, 1, 0), st(3, 0, 1, 1, 0)], g, 'EDM', new Map());
    expect(r.map(p => p.playerId)).toEqual([1, 2, 9]);
    expect(r[2]).toMatchObject({ pos: 'G', line: '35 saves · .972' });
  });
  it('a shutout is outstanding', () => {
    const g = { player_id: 9, shots_against: 22, goals_against: 0, save_pct: 1, players: { first_name: 'G', last_name: 'Nine' } };
    expect(postgameKeyPlayers([st(1, 1, 0, 2, 0)], g, 'EDM', new Map())[1].line).toBe('Shutout · 22 saves');
  });
  it('an ordinary goalie night does not', () => {
    const g = { player_id: 9, shots_against: 25, goals_against: 3, save_pct: 0.88, players: { first_name: 'G', last_name: 'Nine' } };
    expect(postgameKeyPlayers([st(1, 1, 0, 2, 0)], g, 'EDM', new Map()).map(p => p.playerId)).toEqual([1]);
  });
});

describe('statLine', () => {
  it('shows only what happened', () => {
    expect(statLine({ goals: 1, assists: 2, shots_on_goal: 0, plus_minus: 0 })).toBe('1G 2A');
    expect(statLine({ goals: 0, assists: 0, shots_on_goal: 5, plus_minus: -1 })).toBe('5 SOG · -1');
  });
});
