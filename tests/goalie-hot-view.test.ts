import { describe, expect, it } from 'vitest';
import { goalieHotView, svPctText, type GoalieStatRow } from '@/lib/goalie-hot-view';

const game = (playerId: number, date: string, sa: number, ga: number, o: Partial<GoalieStatRow> = {}): GoalieStatRow => ({
  playerId, goalieFullName: o.goalieFullName ?? `Goalie ${playerId}`, lastName: o.lastName ?? `${playerId}`,
  teamAbbrev: 'BOS', gameDate: date, gameId: Number(date.replace(/-/g, '')), gamesStarted: 1,
  saves: sa - ga, shotsAgainst: sa, goalsAgainst: ga, timeOnIce: 3600, wins: ga < 3 ? 1 : 0, losses: ga >= 3 ? 1 : 0, otLosses: 0, ...o,
});
const season = (playerId: number, saves: number, sa: number): GoalieStatRow => ({
  playerId, goalieFullName: `Goalie ${playerId}`, lastName: `${playerId}`, teamAbbrevs: 'BOS',
  gamesPlayed: 15, saves, shotsAgainst: sa, goalsAgainst: sa - saves,
});

describe('goalieHotView', () => {
  it('ranks by save % over the last five starts, against season and league', () => {
    const v = goalieHotView(
      [season(1, 900, 1000), season(2, 880, 1000)],
      [
        ...['2026-11-01', '2026-11-03', '2026-11-05', '2026-11-07', '2026-11-09', '2026-11-11'].map((d, i) => game(1, d, 30, i === 0 ? 10 : 1)),
        ...['2026-11-02', '2026-11-04', '2026-11-06'].map(d => game(2, d, 30, 3)),
      ],
    );
    expect(v.leagueSvPct).toBeCloseTo(0.89);
    expect(v.rows.map(r => r.playerId)).toEqual([1, 2]);
    const top = v.rows[0];
    // The oldest start (10 goals) falls outside the last five.
    expect(top.starts).toBe(5);
    expect(svPctText(top.svPct)).toBe('.967');
    expect(top.vsSeason).toBe(67);
    expect(top.vsLeague).toBe(77);
    expect(top.record).toBe('5–0–0');
    expect(top.gaa).toBeCloseTo(1);
  });

  it('leaves out goalies with too few starts and relief appearances', () => {
    const v = goalieHotView([season(1, 900, 1000)], [
      game(1, '2026-11-01', 30, 0), game(1, '2026-11-02', 30, 0),
      game(1, '2026-11-03', 10, 0, { gamesStarted: 0 }),
    ]);
    expect(v.rows).toEqual([]);
  });

  it('builds the profile link from the name', () => {
    const v = goalieHotView([season(8478048, 900, 1000)], ['2026-11-01', '2026-11-02', '2026-11-03'].map(d =>
      game(8478048, d, 30, 2, { goalieFullName: 'Igor Shesterkin', lastName: 'Shesterkin' })));
    expect(v.rows[0].href).toBe('/players/8478048/igor-shesterkin');
  });

  it('is empty without a season table', () => {
    expect(goalieHotView([], [game(1, '2026-11-01', 30, 0)])).toEqual({ rows: [], leagueSvPct: null });
  });
});
