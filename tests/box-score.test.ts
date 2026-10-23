import { describe, expect, it } from 'vitest';
import { boxFromDb, boxFromNhl, fmtToi, teamTotals } from '@/lib/box-score';
import { shortNames } from '@/lib/game-card';

const sk = (id: number, pos: string, g: number, a: number, toi: string, extra = {}) => ({
  playerId: id, sweaterNumber: id % 100, name: { default: `X. P${id}` }, position: pos, goals: g, assists: a, points: g + a,
  plusMinus: 0, pim: 0, hits: 1, powerPlayGoals: 0, sog: 2, faceoffWinningPctg: pos === 'C' ? 0.5 : 0, toi, blockedShots: 0, ...extra,
});

describe('boxFromNhl', () => {
  const team = {
    forwards: [sk(1, 'C', 0, 0, '18:00'), sk(2, 'L', 1, 1, '15:00'), sk(3, 'R', 0, 0, '20:00')],
    defense: [sk(4, 'D', 0, 2, '22:00'), sk(5, 'D', 0, 0, '25:00')],
    goalies: [
      { playerId: 30, sweaterNumber: 30, name: { default: 'S. Ersson' }, shotsAgainst: 1, goalsAgainst: 0, saves: 1, toi: '16:25' },
      { playerId: 35, sweaterNumber: 35, name: { default: 'L. Ullmark' }, shotsAgainst: 18, goalsAgainst: 1, saves: 17, toi: '43:35', decision: 'W' },
      { playerId: 31, sweaterNumber: 31, name: { default: 'C. Black' }, shotsAgainst: 0, goalsAgainst: 0, saves: 0, toi: '00:00' },
    ],
  };
  const box = boxFromNhl(team, new Map([[2, 'Brady Tkachuk']]), new Set([2]))!;
  it('lists everyone who played: scorers first, then ice time', () => {
    expect(box.forwards.map(p => p.id)).toEqual([2, 3, 1]);
    expect(box.defense.map(p => p.id)).toEqual([4, 5]);
    expect(box.forwards[0]).toMatchObject({ name: 'Brady Tkachuk', gwg: true, toi: 900 });
  });
  it('faceoff % only for centres', () => {
    expect(box.forwards.find(p => p.id === 1)!.foPct).toBe(0.5);
    expect(box.forwards.find(p => p.id === 3)!.foPct).toBeNull();
  });
  it('both goalies who played (2026-10-21: Ullmark then Ersson), not the backup who sat', () => {
    expect(box.goalies.map(g => [g.name, g.decision])).toEqual([['L. Ullmark', 'W'], ['S. Ersson', null]]);
    expect(box.goalies[0].svPct).toBeCloseTo(17 / 18);
  });
  it('team totals', () => {
    expect(teamTotals(box)).toMatchObject({ sog: 10, hits: 5 });
  });
});

describe('boxFromDb', () => {
  it('splits forwards and defense and keeps every row', () => {
    const rows = Array.from({ length: 18 }, (_, i) => ({ player_id: i, goals: i === 3 ? 1 : 0, assists: 0, plus_minus: 0, toi_seconds: 600 + i, players: { first_name: 'A', last_name: `B${i}`, position_code: i < 6 ? 'D' : 'C' } }));
    const box = boxFromDb(rows, [])!;
    expect(box.forwards.length + box.defense.length).toBe(18);
    expect(box.defense[0].id).toBe(3);
  });
});

describe('fmtToi / shortNames', () => {
  it('formats ice time', () => { expect(fmtToi(1231)).toBe('20:31'); });
  it('adds an initial only where two players share a last name', () => {
    expect(shortNames(['Brady Tkachuk', 'Matthew Tkachuk', 'Sam Reinhart'])).toEqual(['B. Tkachuk', 'M. Tkachuk', 'Reinhart']);
  });
});
