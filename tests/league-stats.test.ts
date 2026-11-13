import { afterEach, describe, expect, it, vi } from 'vitest';
import { leagueSavePct, mergeGoalies, mergeSkaters, skaterTable } from '@/lib/league-stats';

const summary = [
  { playerId: 1, lastName: 'Gauthier', positionCode: 'L', teamAbbrevs: 'PHI,ANA', gamesPlayed: 18, goals: 16, assists: 7, points: 23, shots: 79, timeOnIcePerGame: 1104 },
  { playerId: 2, lastName: 'Werenski', positionCode: 'D', teamAbbrevs: 'CBJ', gamesPlayed: 10, goals: 2, assists: 8, points: 10, shots: 30, timeOnIcePerGame: 1500 },
];
const realtime = [{ playerId: 1, hits: 10, blockedShots: 4, takeaways: 6, giveaways: 9 }];
const toi = [{ playerId: 1, timeOnIce: 19872, ppTimeOnIce: 3000, shTimeOnIce: 0 }];
const penalties = [{ playerId: 1, penaltiesDrawn: 3, penalties: 5 }];
const percentages = [{ playerId: 1, satRelative: 0.012 }];
const faceoffs = [{ playerId: 1, totalFaceoffs: 4 }];

describe('mergeSkaters', () => {
  const rows = mergeSkaters(summary, realtime, toi, penalties, percentages, faceoffs);
  const g = rows.find(r => r.id === 1)!;
  const d = rows.find(r => r.id === 2)!;
  it('a traded player belongs to his current (last) team', () => expect(g.team).toBe('ANA'));
  it('joins every report by player id', () => {
    expect(g).toMatchObject({ last: 'Gauthier', pos: 'F', gp: 18, g: 16, a: 7, pts: 23, sog: 79, toiSec: 19872, ppToiSec: 3000, hits: 10, blocks: 4, takeaways: 6, giveaways: 9, penDrawn: 3, penTaken: 5, satRel: 0.012, faceoffs: 4 });
  });
  it('a player missing from a report gets zeros, and TOI from the summary', () => {
    expect(d.pos).toBe('D');
    expect(d.toiSec).toBe(15000);
    expect(d.hits).toBe(0);
    expect(Object.values(d).some(v => typeof v === 'number' && Number.isNaN(v))).toBe(false);
  });
});

describe('goalies', () => {
  const rows = mergeGoalies(
    [{ playerId: 9, lastName: 'Postava', teamAbbrevs: 'DET', gamesPlayed: 2, gamesStarted: 1, saves: 31, shotsAgainst: 35, goalsAgainst: 4, timeOnIce: 4981, wins: 1 },
     { playerId: 8, lastName: 'Gibson', teamAbbrevs: 'DET', gamesPlayed: 13, gamesStarted: 13, saves: 300, shotsAgainst: 340, goalsAgainst: 40, timeOnIce: 46000, wins: 6 }],
    [{ playerId: 8, qualityStartsPct: 0.46 }],
    [{ playerId: 8, evSavePct: 0.88, ppSavePct: 0.83 }],
  );
  it('joins advanced and by-strength reports; missing ones are null', () => {
    expect(rows.find(r => r.id === 8)).toMatchObject({ last: 'Gibson', gs: 13, qsPct: 0.46, evSavePct: 0.88, shSavePct: 0.83 });
    expect(rows.find(r => r.id === 9)).toMatchObject({ last: 'Postava', gs: 1, qsPct: null, evSavePct: null });
  });
  it('league save % is saves over shots, not a mean of percentages', () => {
    expect(leagueSavePct(rows)).toBeCloseTo(331 / 375, 5);
    expect(leagueSavePct([])).toBeNull();
  });
});

describe('fetchers', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('an unreachable stats API gives an empty table, not an error', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('down')));
    await expect(skaterTable('20262027')).resolves.toEqual([]);
  });
});
