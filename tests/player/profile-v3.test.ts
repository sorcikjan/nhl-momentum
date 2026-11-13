import { describe, expect, it } from 'vitest';
import gauthier from '../fixtures/landing-gauthier.json';
import postava from '../fixtures/landing-postava.json';
import type { GoalieRow, SkaterRow } from '@/lib/league-stats';
import {
  characterAxes, countryEvents, goalieAxes, goalieStarts, nationality, nhlSeasonOrdinal, seasonColumns, seasonRank,
  seasonTotals, teamLadder, timeline, verdict,
} from '@/lib/profile-v3';

const sk = (o: Partial<SkaterRow> & { id: number }): SkaterRow => ({
  last: `P${o.id}`, pos: 'F', team: 'ANA', gp: 18, toiSec: 18 * 900, g: 2, a: 3, pts: 5, sog: 30, ppToiSec: 18 * 60, shToiSec: 18 * 60,
  hits: 20, blocks: 10, takeaways: 8, giveaways: 8, penDrawn: 3, penTaken: 3, satRel: 0, faceoffs: 0, ...o,
});
// 100 forwards spread evenly, plus Gauthier on top in scoring.
const field = Array.from({ length: 100 }, (_, i) => sk({ id: 1000 + i, team: i < 12 ? 'ANA' : 'BOS', toiSec: 18 * (600 + i * 6), g: Math.round(i / 10), a: Math.round(i / 8), sog: 10 + i, satRel: (i - 50) / 1000 }));
const me = sk({ id: 8483445, last: 'Gauthier', toiSec: 18 * 1104, g: 16, a: 7, pts: 23, sog: 79, ppToiSec: 18 * 200, shToiSec: 0, hits: 4, blocks: 2, takeaways: 4, giveaways: 12, penDrawn: 1, penTaken: 5, faceoffs: 4 });

describe('characterAxes', () => {
  const c = characterAxes(me, null, [...field, me]);
  it('nine forward axes in a fixed order', () => {
    expect(c.axes.map(a => a.label)).toEqual(['Goals', 'Shots', 'Assists', 'Power play', 'Ice time', 'Team shots on ice', 'Takeaways', 'Hits + blocks', 'Penalties drawn']);
  });
  it('per minute, a top scorer ranks high and a light defender ranks low', () => {
    const v = Object.fromEntries(c.axes.map(a => [a.label, a.season]));
    expect(v.Goals).toBeGreaterThanOrEqual(95);
    expect(v['Hits + blocks']).toBeLessThan(10);
  });
  it('situations he is not used in are listed, not drawn as zero', () => {
    expect(c.unused).toEqual(['Penalty kill', 'Faceoffs']);
    expect(c.axes.some(a => a.label === 'Penalty kill')).toBe(false);
  });
  it('the last-3-weeks curve is placed in the season distribution; null under 4 games', () => {
    const recent = sk({ id: me.id, gp: 6, toiSec: 6 * 1100, g: 8, a: 0, sog: 30 });
    const r = characterAxes(me, recent, [...field, me]);
    expect(r.axes.find(a => a.label === 'Assists')!.recent).toBe(0);
    expect(characterAxes(me, { ...recent, gp: 3 }, [...field, me]).axes.every(a => a.recent === null)).toBe(true);
  });
  it('a player under 5 games gets no axes and no NaN', () => {
    const rookie = sk({ id: 1, gp: 2, toiSec: 0, g: 0, a: 0, sog: 0 });
    expect(characterAxes(rookie, null, [...field, rookie]).axes).toEqual([]);
  });
  it('defensemen get points and penalty kill instead of goals/assists', () => {
    const d = sk({ id: 5, pos: 'D' });
    const ds = Array.from({ length: 20 }, (_, i) => sk({ id: 2000 + i, pos: 'D', a: i }));
    expect(characterAxes(d, null, [...ds, d]).axes.map(a => a.label)).toEqual(['Points', 'Shots', 'Ice time', 'Power play', 'Penalty kill', 'Team shots on ice', 'Takeaways', 'Hits + blocks', 'Penalties drawn']);
  });
});

const gk = (o: Partial<GoalieRow> & { id: number }): GoalieRow => ({
  last: `G${o.id}`, team: 'DET', gp: 10, gs: 10, saves: 270, shots: 300, ga: 30, toiSec: 36000, evSavePct: 0.9, shSavePct: 0.85, qsPct: 0.5, wins: 5, ...o,
});

describe('goalies', () => {
  const gibson = gk({ id: 1, last: 'Gibson', gp: 13, gs: 13 });
  const tarasov = gk({ id: 2, last: 'Tarasov', gp: 8, gs: 6 });
  const post = gk({ id: 8485545, last: 'Postava', gp: 2, gs: 1, saves: 31, shots: 35 });
  it('starts among his team\'s goalies, most first', () => {
    expect(goalieStarts([post, tarasov, gibson, gk({ id: 9, team: 'BOS' })], post.id, 'DET')).toEqual([
      { name: 'Gibson', starts: 13, me: false }, { name: 'Tarasov', starts: 6, me: false }, { name: 'Postava', starts: 1, me: true },
    ]);
  });
  it('goalie radar: six axes for 5+ games, none below', () => {
    const fieldG = Array.from({ length: 30 }, (_, i) => gk({ id: 100 + i, team: `T${i}`, saves: 260 + i }));
    expect(goalieAxes(gibson, [...fieldG, gibson]).axes.map(a => a.label)).toEqual(['Save %', 'Even strength', 'Shorthanded', 'Goals against', 'Quality starts', 'Workload']);
    expect(goalieAxes(post, [...fieldG, post]).axes).toEqual([]);
  });
});

describe('teamLadder', () => {
  it('his current team only, by ice time; a traded player counts for his new team', () => {
    const l = teamLadder([...field, me], me.id, 'ANA');
    expect(l.bars.length).toBe(13);
    expect(l.bars[0].me).toBe(true);
    expect(l.myRank).toBe(1);
  });
});

describe('seasonRank and seasonColumns', () => {
  const table = Array.from({ length: 100 }, (_, i) => sk({ id: i + 1, gp: 40, pts: i }));
  it('percentile of points a game among his position with enough games', () => {
    expect(seasonRank([...table, sk({ id: 777, gp: 40, pts: 60 })], 777, 'F', 20)).toMatchObject({ pct: 59, top: 40 });
    expect(seasonRank(table, 999, 'F', 20)).toBeNull();
  });
  it('Gauthier: one column per NHL season, last 6, ranks attached', () => {
    const cols = seasonColumns(gauthier, { '20242025': { pct: 63, top: 37 }, '20252026': { pct: 90, top: 10 }, '20262027': { pct: 97, top: 3 } }, false);
    expect(cols.map(c => c.season)).toEqual(['2023–24', '2024–25', '2025–26', '2026–27']);
    expect(cols[3]).toMatchObject({ team: 'ANA', teamName: 'Anaheim Ducks', league: 'NHL', pct: 97, top: 3, gp: 18 });
    expect(cols[3].value).toBeCloseTo(23 / 18, 3);
    expect(cols[0].thin).toBe(true);
  });
  it('Postava: every league, full names, the 2-game NHL stint thin', () => {
    const cols = seasonColumns(postava, {}, true);
    expect(cols.length).toBe(6);
    expect(cols.map(c => c.teamName)).toEqual(['HC Přerov', 'HC Přerov', 'HC Kometa Brno', 'Grand Rapids Griffins', 'Detroit Red Wings', 'Grand Rapids Griffins']);
    expect(cols.find(c => c.league === 'NHL')).toMatchObject({ thin: true, pct: null });
  });
  it('a veteran shows his last 6 seasons', () => {
    const rows = Array.from({ length: 18 }, (_, i) => ({ season: 20082009 + i * 10001, leagueAbbrev: 'NHL', gameTypeId: 2, gamesPlayed: 80, points: 50, teamName: { default: 'Boston Bruins' } }));
    expect(seasonColumns({ seasonTotals: rows }, {}, false).length).toBe(6);
  });
});

describe('bio facts', () => {
  it('nationality from national teams, birth country only when different', () => {
    expect(nationality(gauthier, 'SWE')).toMatchObject({ code: 'USA', name: 'USA', flag: '🇺🇸', born: 'Sweden' });
    expect(nationality(postava, 'CZE')).toMatchObject({ code: 'CZE', name: 'Czechia', born: null });
  });
  it('counts NHL seasons with a game, the 1-game one included', () => {
    expect(nhlSeasonOrdinal(gauthier)).toBe(4);
    expect(nhlSeasonOrdinal(postava)).toBe(1);
  });
  it('national team events with years', () => {
    expect(countryEvents(gauthier)).toEqual([
      { name: 'World Juniors', years: [2023, 2024] }, { name: 'World Championship', years: [2023, 2025] }, { name: 'International', years: [2025] },
    ]);
    expect(countryEvents(postava)).toEqual([]);
  });
});

describe('timeline', () => {
  it('Gauthier: program, draft, college, NHL — most recent last and marked now', () => {
    const t = timeline(gauthier, { year: 2022, pick: 5, team: 'PHI' });
    expect(t.map(s => s.title)).toEqual(['USNTDP Juniors', 'Drafted #5 by Philadelphia Flyers', 'Boston College', 'Anaheim Ducks']);
    expect(t[2].detail).toContain('38 goals in 41 games');
    expect(t.at(-1)!.now).toBe(true);
  });
  it('Postava: a 2-game call-up does not split his Grand Rapids stint', () => {
    const t = timeline(postava, null);
    expect(t.map(s => s.title)).toEqual(['HC Přerov', 'HC Kometa Brno', 'Grand Rapids Griffins']);
    expect(t.at(-1)!.detail).toContain('2 NHL games this season');
  });
});

describe('seasonTotals', () => {
  it('skater totals carry rank among his position', () => {
    const t = seasonTotals(me, [...field, me], false);
    expect(t.map(x => x.label)).toEqual(['GAMES', 'GOALS', 'ASSISTS', 'POINTS']);
    expect(t[0].rank).toBeNull();
    expect(t[1].rank).toBe('#1');
  });
  it('under 5 games nothing is ranked', () => {
    const post = gk({ id: 8485545, gp: 2, gs: 1, saves: 31, shots: 35, ga: 4, toiSec: 4981, wins: 1 });
    const t = seasonTotals(post, [post], true);
    expect(t.map(x => x.value)).toEqual(['2', '1', '.886', '2.89']);
    expect(t.every(x => x.rank === null)).toBe(true);
  });
});

describe('verdict', () => {
  const base = { goalie: false, status: null, minorsLeague: null, nhlGp: 18, missed: 0, heatRank: 1, pointsRank: 22, svRank: null, rising: true, g: 16, a: 7, w: 0, one: 'forward', many: 'forwards' };
  it('the hottest forward with a rising career', () => expect(verdict(base)).toBe('The hottest forward in the NHL, and his points a game have gone up every season.'));
  it('a minor-leaguer', () => expect(verdict({ ...base, goalie: true, status: 'minors', minorsLeague: 'AHL', nhlGp: 2 })).toBe('2 NHL games this season, now in the AHL.'));
  it('out of the lineup', () => expect(verdict({ ...base, status: 'injured', missed: 7 })).toBe('Out of the lineup for 7 straight games.'));
  it('top 10 Heat', () => expect(verdict({ ...base, heatRank: 7 })).toBe('Among the 10 hottest forwards in the NHL.'));
  it('points rank', () => expect(verdict({ ...base, heatRank: 40, pointsRank: 3 })).toBe('3rd in points among NHL forwards.'));
  it('plain line', () => expect(verdict({ ...base, heatRank: 40, pointsRank: 90 })).toBe('16 goals and 7 assists in 18 games this season.'));
  it('under 5 games', () => expect(verdict({ ...base, nhlGp: 1 })).toBe('1 NHL game this season.'));
});
