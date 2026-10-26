import { describe, expect, it } from 'vitest';
import { gameLines, heatContext, last5, last5Line, ordinal, paceLine, peersOf, radarAxes, seasonRows, standings, strengthsLine, trendLine, type GameLine, type Peer } from '@/lib/profile-context';

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

describe('standings', () => {
  it('ranks, averages and names the leader', () => {
    const me = field[14]; // 14 points
    const pts = standings(me, peersOf(me, field)).find(s => s.key === 'pts')!;
    expect(pts).toMatchObject({ me: 14, rank: 6, n: 20, leader: { name: 'P20', value: 19, isMe: false } });
    expect(pts.avg).toBeCloseTo(9.5);
  });
  it('a shared lead is his', () => {
    const me = peer(50, { pts: 19 });
    expect(standings(me, peersOf(me, field)).find(s => s.key === 'pts')!.leader.isMe).toBe(true);
  });
});

describe('heatContext and radar', () => {
  it('percentile is the share of his position below him', () => {
    const me = field[19]; // heat 95, the hottest
    expect(heatContext(me, peersOf(me, field))).toMatchObject({ heat: 95, pct: 95, avg: 48 });
  });
  it('names strengths from the top quarter and weaknesses below the middle', () => {
    const me = field[19];
    const axes = radarAxes(me, peersOf(me, field));
    expect(axes.find(a => a.label === 'Goals')!.pct).toBeGreaterThanOrEqual(90);
    const { strong } = strengthsLine(axes);
    expect(strong[0]).toMatch(/^(goals|assists) \(9\dth\)$/);
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

const line = (o: Partial<GameLine>): GameLine => ({ id: 1, date: '2026-10-10', opp: 'TOR', home: true, result: 'W', g: 0, a: 0, sog: 2, pm: 0, toi: 900, heat: null, ...o });

describe('last5', () => {
  const me = peer(7, { gp: 10, g: 4, a: 6, pts: 10, sog: 40, pm: -2, toiMin: 16 });
  const games = [line({ g: 2, sog: 4 }), line({ g: 1, a: 1, sog: 3 }), line({ g: 2, sog: 4 }), line({ a: 1, sog: 1, pm: 2 }), line({ g: 1, sog: 3, pm: 1 })];
  const t = last5(games, me, peersOf(me, field))!;
  it('his stretch against his own per-5 pace and the average forward', () => {
    const r = Object.fromEntries(t.rows.map(x => [x.key, x]));
    expect(r.g).toMatchObject({ l5: 6, own: 2, verdict: { text: '▲ 3.0× his usual', tone: 'rise' } });
    expect(r.pts.own).toBe(5);
    expect(r.pm.verdict).toEqual({ text: '+4 vs his usual', tone: 'rise' });
    expect(r.shPct.l5).toBeCloseTo(6 / 15);
    expect(r.toi.l5).toBe(15);
  });
  it('one sentence with both comparisons and the shooting reason', () => {
    const s = last5Line(t, 'F');
    expect(s).toMatch(/^8 points and 6 goals in 5 games — 1\.6× his usual pace, and .*× what an average forward scores in 5 games\./);
    expect(s).toContain("He's shooting 40% in this stretch against 10% on the season.");
  });
  it('needs at least three games', () => expect(last5(games.slice(0, 2), me, [me])).toBeNull());
});

describe('trendLine', () => {
  const h = { heat: 90, pct: 97, avg: 30, top: 80 };
  it('a climb', () => {
    const games = [0, 0, 10, 40, 70, 90].map((v, i) => line({ id: i, heat: v }));
    expect(trendLine(games, h, 'F')).toBe('Up from 0 to 90 in his last 5 games — top 5% of forwards, against an average forward at 30.');
  });
  it('cooling from a peak', () => {
    const games = [50, 80, 60, 45].map((v, i) => line({ id: i, opp: ['A', 'MTL', 'B', 'C'][i], heat: v }));
    expect(trendLine(games, { ...h, heat: 45, pct: 70 }, 'D')).toBe('Cooling: 80 after the game against MTL, 45 now — still hotter than 70% of defensemen (average defenseman 30).');
  });
});

describe('seasonRows and paceLine', () => {
  const landing = { seasonTotals: [
    { season: 20252026, gameTypeId: 2, leagueAbbrev: 'NHL', teamCommonName: { default: 'Senators' }, teamName: { default: 'Ottawa Senators' }, gamesPlayed: 60, goals: 22, assists: 37, points: 59, plusMinus: 4 },
    { season: 20252026, gameTypeId: 3, leagueAbbrev: 'NHL', teamCommonName: { default: 'Senators' }, gamesPlayed: 6, goals: 2, assists: 1, points: 3 },
    { season: 20242025, gameTypeId: 2, leagueAbbrev: 'AHL', teamCommonName: { default: 'Senators' }, gamesPlayed: 6 },
    { season: 20262027, gameTypeId: 2, leagueAbbrev: 'NHL', teamCommonName: { default: 'Senators' }, teamName: { default: 'Ottawa Senators' }, gamesPlayed: 11, goals: 7, assists: 4, points: 11, plusMinus: -2 },
  ] };
  const rows = seasonRows(landing);
  it('NHL regular seasons only, oldest first, with the team abbreviation', () => {
    expect(rows.map(r => [r.season, r.team, r.pts])).toEqual([['2025–26', 'OTT', 59], ['2026–27', 'OTT', 11]]);
  });
  it('projects the season against his best', () => {
    expect(paceLine(rows, '2026–27')).toBe('On pace for 82 points over 82 games, which would beat his best season so far: 59 in 2025–26.');
    expect(paceLine(rows, '2027–28')).toBeNull();
  });
});
