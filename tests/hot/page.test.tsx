import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { hotView } from '@/lib/hot-view';
import { HotBody } from '@/components/hot/HotBody';

const sk = (id: number, ppm: number, sea: number) => ({
  player_id: id, momentum_ppm: ppm, season_ppm: sea, momentum_goals: 3, momentum_assists: 4, momentum_games: 5, season_points: 20,
  players: { first_name: 'Joe', last_name: `Player${id}`, position_code: 'C', teams: { abbrev: 'EDM' } },
});

describe('hotView', () => {
  it('takes #1, then up to 8 more, then breakouts and cooling', () => {
    const leaders = Array.from({ length: 10 }, (_, i) => sk(i + 1, 0.12 - i * 0.01, 0.06));
    const v = hotView({ momentumLeaders: { skaters: leaders }, breakoutWatch: [sk(20, 0.1, 0.04)], coolingWatch: [sk(30, 0.02, 0.08)] });
    expect(v.top?.playerId).toBe(1);
    expect(v.rest.map(r => r.playerId)).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    expect(v.breakouts[0].sub).toBe('+150% vs season pace');
    expect(v.cooling[0]).toMatchObject({ heat: 17, prev: 67 });
  });
  it('renders with fewer than nine players', () => {
    const v = hotView({ momentumLeaders: { skaters: [sk(1, 0.1, 0.05), sk(2, 0.09, 0.05)] }, breakoutWatch: [], coolingWatch: [] });
    expect(v.rest).toHaveLength(1);
  });
});

describe('HotBody', () => {
  it('orders sections like the design and never claims hourly updates', () => {
    const v = hotView({ momentumLeaders: { skaters: [sk(1, 0.1, 0.05), sk(2, 0.09, 0.05)] }, breakoutWatch: [sk(3, 0.1, 0.04)], coolingWatch: [sk(4, 0.02, 0.08)] });
    const out = renderToStaticMarkup(<HotBody view={v} />);
    const idx = ['#1 · HOTTEST RIGHT NOW', 'RANKED 2–', 'BREAKOUT WATCH', 'COOLING OFF'].map(k => out.indexOf(k));
    expect(idx.every(i => i >= 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
    expect(out).not.toContain('Updated every hour');
  });
});

describe('hot copy', () => {
  it('pluralizes the story line', () => {
    const one = { ...{ player_id: 1, momentum_ppm: 0.1, season_ppm: 0.05, momentum_goals: 1, momentum_assists: 1, momentum_games: 1 }, players: { first_name: 'A', last_name: 'B', position_code: 'C', teams: { abbrev: 'EDM' } } };
    expect(hotView({ momentumLeaders: { skaters: [one] } }).top?.story).toMatch(/^1 goal and 1 assist in his last game/);
  });
});
