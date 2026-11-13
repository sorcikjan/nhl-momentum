import { describe, expect, it } from 'vitest';
import { gameLines, heatContext, ordinal, peersOf, type Peer } from '@/lib/profile-context';

const peer = (id: number, o: Partial<Peer> = {}): Peer => ({
  id, last: `P${id}`, team: 'TOR', group: 'F', gp: 10, g: 2, a: 3, pts: 5, sog: 15, ppp: 1, pm: 0, toiMin: 15, heat: 30, energy: 80, ...o,
});
// Twenty forwards with 0..19 points, two defensemen and an early-season call-up.
const field = [
  ...Array.from({ length: 20 }, (_, i) => peer(i + 1, { pts: i, g: Math.floor(i / 2), a: i - Math.floor(i / 2), heat: i * 5 })),
  peer(100, { group: 'D', pts: 50 }), peer(101, { group: 'D' }), peer(102, { gp: 1, pts: 3 }),
];

describe('peersOf', () => {
  it('compares within his position, players with a real share of the season, him included', () => {
    const me = peer(999, { gp: 2, pts: 1 });
    const ps = peersOf(me, field);
    expect(ps.some(p => p.group === 'D')).toBe(false);
    expect(ps.some(p => p.id === 102)).toBe(false);
    expect(ps.filter(p => p.id === 999)).toHaveLength(1);
    expect(ps).toHaveLength(21);
  });
});

describe('heatContext', () => {
  it('percentile is the share of his position below him', () => {
    const me = field[19]; // heat 95, the hottest
    expect(heatContext(me, peersOf(me, field))).toMatchObject({ heat: 95, pct: 95, avg: 48 });
  });
  it('never "hotter than 100%"', () => {
    const me = peer(500, { heat: 100 });
    const many = Array.from({ length: 300 }, (_, i) => peer(1000 + i, { heat: 20 }));
    expect(heatContext(me, peersOf(me, many)).pct).toBe(99);
  });
  it('ordinals', () => expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101, 111].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '101st', '111th']));
});

const row = (date: string, home: boolean, us: number, them: number, o: Record<string, number> = {}) => ({
  game_id: Number(date.replace(/-/g, '')), goals: 0, assists: 0, shots_on_goal: 2, plus_minus: 0, toi_seconds: 900, ...o,
  games: { game_date: date, home_team_id: home ? 1 : 2, home_score: home ? us : them, away_score: home ? them : us, home_team: { abbrev: home ? 'OTT' : 'BOS' }, away_team: { abbrev: home ? 'TOR' : 'OTT' } },
});

describe('gameLines', () => {
  it('this season, oldest first, with the result and the Heat after each game', () => {
    const rows = [row('2026-10-12', false, 2, 3), row('2026-10-10', true, 4, 1, { goals: 2 }), row('2026-04-01', true, 1, 0)];
    const daily = [{ date: '2026-10-09', heat: 10 }, { date: '2026-10-11', heat: 40 }, { date: '2026-10-13', heat: 35 }];
    expect(gameLines(rows, 1, '2026-09-01', daily).map(l => [l.date, l.opp, l.home, l.result, l.g, l.heat])).toEqual([
      ['2026-10-10', 'TOR', true, 'W', 2, 40],
      ['2026-10-12', 'BOS', false, 'L', 0, 35],
    ]);
  });
  it('the latest game with no snapshot after it yet takes today\'s Heat; a gap gives none', () => {
    const rows = [row('2026-10-10', true, 1, 0), row('2026-10-12', true, 1, 0), row('2026-10-14', true, 1, 0)];
    const daily = [{ date: '2026-10-13', heat: 50 }];
    expect(gameLines(rows, 1, '2026-09-01', daily).map(l => l.heat)).toEqual([null, 50, 50]);
  });
});


