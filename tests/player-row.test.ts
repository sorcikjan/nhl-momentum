import { describe, expect, it } from 'vitest';
import { goalieRow, pacePct, record, rookieRow, skaterRow } from '@/lib/player-row';
import { teamHeatByTeam } from '@/lib/team-heat';

const sk = (over: Record<string, unknown> = {}) => ({
  player_id: 8475913, momentum_ppm: 0.1, season_ppm: 0.08, momentum_goals: 5, momentum_assists: 3, momentum_games: 5,
  players: { first_name: 'Mark', last_name: 'Stone', position_code: 'R', headshot_url: null, teams: { abbrev: 'VGK' } },
  ...over,
});

describe('player rows', () => {
  it('skater: last-5 line, pace chip, Heat value', () => {
    const r = skaterRow(sk(), '2', 'rank');
    expect(r).toMatchObject({ name: 'Mark Stone', team: 'VGK', pos: 'RW', l5: 'L5 5G 3A', chip: { text: '+25%', tone: 'rise' }, mark: '2', markTone: null });
    expect(r.value).toBe(String(r.valueHeat));
    expect(r.href).toBe('/players/8475913/mark-stone');
  });
  it('cooling off: cold chip and the season Heat they fell from', () => {
    const r = skaterRow(sk({ momentum_ppm: 0, momentum_goals: 0, momentum_assists: 0 }), '↓', 'cool');
    expect(r.chip).toEqual({ text: '−100%', tone: 'cold' });
    expect(r.l5).toMatch(/^L5 0G 0A · season \d+$/);
    expect(r.valueHeat).toBe(0);
  });
  it('goalie: record, GAA chip, SV% as the number (not Heat)', () => {
    const r = goalieRow({ id: 1, first_name: 'Jake', last_name: 'Oettinger', teams: { abbrev: 'DAL' }, avgSavePct: 0.9462, avgGAA: 1.2, decisions: ['W', 'W', 'L', 'O', 'W'], gamesPlayed: 5 }, 1);
    expect(r).toMatchObject({ pos: 'G', l5: 'L5 3–1–1', chip: { text: '1.20 GAA', tone: 'muted' }, value: '.946', valueHeat: null });
  });
  it('rookie: no chip', () => {
    const r = rookieRow({ player_id: 2, momentum_ppm: 0.05, momentum_goals: 2, momentum_assists: 2, players: { first_name: 'Stephen', last_name: 'Halliday', position_code: 'C', teams: { abbrev: 'OTT' } } }, 1);
    expect(r).toMatchObject({ l5: 'L5 2G 2A', chip: null, pos: 'C', team: 'OTT' });
  });
  it('helpers', () => {
    expect(pacePct(0.12, 0.1)).toBe(20);
    expect(pacePct(0.1, 0)).toBeNull();
    expect(record(['O', 'W', 'O', 'W'])).toBe('2–0–2');
  });
});

describe('teamHeatByTeam', () => {
  it('averages the five hottest skaters per team', () => {
    const rows = [100, 100, 71, 67, 60, 10].map(heat => ({ team: 'FLA', heat })).concat([{ team: 'PIT', heat: 34 }, { team: '', heat: 99 }]);
    expect(teamHeatByTeam(rows)).toEqual({ FLA: 80, PIT: 34 });
  });
});
