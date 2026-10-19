import { describe, expect, it } from 'vitest';
import { formChips, gameLogRows, heatSeries, last5Tiles, seasonTiles } from '@/lib/player-profile';

const g = (o: Partial<Record<string, number>>, game: Record<string, unknown>) => ({
  goals: 0, assists: 0, plus_minus: 0, shots_on_goal: 0, toi_seconds: 1200, hits: 0, blocked_shots: 0, ...o, games: game,
});
const home = (date: string, hs: number, as: number) => ({ game_date: date, home_team_id: 22, home_score: hs, away_score: as, home_team: { abbrev: 'EDM' }, away_team: { abbrev: 'CGY' } });

describe('formChips', () => {
  it('reads a climbing, streaking, fresh, elite player', () => {
    const chips = formChips({ heats: [60, 70, 80, 90], pointsByGame: [2, 1, 1, 0], energy: 92, heat: 90 });
    expect(chips.map(c => [c.label, c.value])).toEqual([
      ['Trend', 'Climbing'], ['Streak', '3-game point streak'], ['Risk', 'Low fatigue'], ['Outlook', 'Elite'],
    ]);
  });
  it('reads a cooling, pointless, tired, cold player', () => {
    const chips = formChips({ heats: [70, 50, 40], pointsByGame: [0, 1], energy: 30, heat: 20 });
    expect(chips.map(c => c.value)).toEqual(['Cooling', 'No active streak', 'High fatigue', 'Cold']);
  });
  it('does not claim a trend without enough history', () => {
    expect(formChips({ heats: [70], pointsByGame: [], energy: null, heat: null })[0].value).toBe('Not enough games');
  });
});

describe('gameLogRows', () => {
  it('derives result and opponent from the player team', () => {
    const rows = gameLogRows([g({ goals: 1, assists: 1 }, home('2026-10-18', 4, 2))], 22);
    expect(rows[0]).toMatchObject({ result: 'W', opponent: 'CGY', home: true, goals: 1, assists: 1 });
  });
  it('marks a loss on the road', () => {
    expect(gameLogRows([g({}, home('2026-10-17', 4, 2))], 99)[0]).toMatchObject({ result: 'L', opponent: 'EDM', home: false });
    expect(gameLogRows([g({}, home('2026-10-17', 2, 4))], 22)[0].result).toBe('L');
  });
});

describe('last5Tiles', () => {
  it('totals the last five games', () => {
    const games = Array.from({ length: 6 }, () => g({ goals: 1, assists: 1, shots_on_goal: 4, plus_minus: 1, hits: 2, blocked_shots: 1, toi_seconds: 1260 }, home('2026-10-18', 3, 1)));
    const t = Object.fromEntries(last5Tiles(games).map(x => [x.label, x.value]));
    expect(t).toMatchObject({ G: '5', A: '5', PTS: '10', '+/-': '+5', SOG: '20', 'SH%': '25.0%', TOI: '21:00', HITS: '10', BLK: '5' });
  });
});

describe('seasonTiles', () => {
  it('builds the season grid from the snapshot', () => {
    const t = Object.fromEntries(seasonTiles({ season_games: 8, season_goals: 6, season_assists: 17, season_points: 23, season_plus_minus: 19, season_shooting_pct: 0.3333, season_toi_sec: 11227, season_pp_goals: 0, season_pp_points: 5, season_gw_goals: 0, season_sh_points: 1, season_shots: 18 }).map(x => [x.label, x.value]));
    expect(t).toMatchObject({ POINTS: '23', GOALS: '6', ASSISTS: '17', 'POINTS/GM': '2.88', 'PLUS-MINUS': '+19', 'SHOOTING %': '33.3%', 'TOI/GM': '23:23' });
  });
});

describe('heatSeries', () => {
  it('keeps one point per day, oldest first, within the window', () => {
    const s = heatSeries([
      { calculated_at: '2026-10-01T05:00:00Z', momentum_ppm: 0.06 },
      { calculated_at: '2026-10-01T11:00:00Z', momentum_ppm: 0.072 },
      { calculated_at: '2026-10-18T05:00:00Z', momentum_ppm: 0.12 },
    ], new Date('2026-10-19T00:00:00Z'), 42);
    expect(s.map(p => p.heat)).toEqual([60, 100]);
  });
});

import { radarStats, vsLeagueRows } from '@/lib/player-profile';

describe('radarStats', () => {
  const lg = { goalsPerGame: 0.25, assistsPerGame: 0.35, shootingPct: 0.1, p95GoalsPerGame: 0.6, p95AssistsPerGame: 0.9, p95PlusMinusPerGame: 0.8, p5PlusMinusPerGame: -0.8 };
  it('normalizes against the league 95th percentile and clamps to 0..1', () => {
    const s = radarStats({ season_games: 10, season_goals: 9, season_assists: 4, season_shooting_pct: 0.2, season_plus_minus: 0, season_pp_points: 3, season_toi_sec: 12000 }, lg);
    const v = Object.fromEntries(s.map(x => [x.label, x.value]));
    expect(v.SCORING).toBe(1);
    expect(v.PLAYMAKING).toBeCloseTo(0.444, 2);
    expect(v['+/-']).toBeCloseTo(0.5, 2);
    for (const x of s) { expect(x.value).toBeGreaterThanOrEqual(0); expect(x.value).toBeLessThanOrEqual(1); }
  });
  it('returns nothing without league data', () => {
    expect(radarStats({ season_games: 10 }, null)).toEqual([]);
  });
});

describe('vsLeagueRows', () => {
  it('compares per-game rates with the league average', () => {
    const rows = vsLeagueRows({ season_games: 10, season_goals: 5, season_assists: 10, season_shooting_pct: 0.2 }, { goalsPerGame: 0.25, assistsPerGame: 0.35, shootingPct: 0.1, p95GoalsPerGame: 0.6, p95AssistsPerGame: 0.9 });
    expect(rows[0]).toMatchObject({ label: 'Points per game', you: 1.5, league: 0.6 });
    expect(rows.find(r => r.label === 'Goals per game')).toMatchObject({ you: 0.5, top: 0.6, topLabel: 'Top 5%' });
  });
});

describe('heatSeries — empty windows', () => {
  it('skips snapshots with no games in the momentum window (no data is not Heat 0)', () => {
    const s = heatSeries([
      { calculated_at: '2026-10-10T05:00:00Z', momentum_ppm: 0.1, momentum_games: 5 },
      { calculated_at: '2026-10-13T05:00:00Z', momentum_ppm: 0, momentum_games: 0 },
      { calculated_at: '2026-10-18T05:00:00Z', momentum_ppm: 0.12, momentum_games: 5 },
    ], new Date('2026-10-19T00:00:00Z'), 42);
    expect(s.map(p => p.heat)).toEqual([83, 100]);
  });
});

import { currentSeasonRows } from '@/lib/player-profile';

describe('currentSeasonRows', () => {
  it('keeps only this season’s regular-season and playoff games', () => {
    const rows = [{ game_id: 2026020050 }, { game_id: 2026010003 }, { game_id: 2025030411 }, { game_id: 2025020800 }];
    expect(currentSeasonRows(rows, 2026).map(r => r.game_id)).toEqual([2026020050]);
  });
});
