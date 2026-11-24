import { describe, expect, it } from 'vitest';
import { radarReadout } from '@/lib/profile-v3';

const ax = (label: string, season: number, recent: number | null) => ({ key: label, label, season, recent });

describe('radarReadout', () => {
  it('picks the top, the bottom and what moved most (Gauthier, Nov 20)', () => {
    const r = radarReadout([
      ax('Goals', 99, 99), ax('Shots', 99, 99), ax('Assists', 60, 45), ax('Power play', 96, 99), ax('Ice time', 86, 91),
      ax('Team shots on ice', 58, 89), ax('Takeaways', 29, 13), ax('Hits + blocks', 23, 14), ax('Penalties drawn', 35, 93),
    ]);
    expect(r.recent).toBe(true);
    expect(r.top.map(t => t.label)).toEqual(['Goals', 'Shots', 'Power play']);
    expect(r.bottom).toEqual([{ label: 'Takeaways', pct: 13 }, { label: 'Hits + blocks', pct: 14 }]);
    expect(r.moved.map(m => [m.label, m.from, m.to])).toEqual([['Penalties drawn', 35, 93], ['Team shots on ice', 58, 89], ['Takeaways', 29, 13]]);
  });

  it('uses the season and shows no movement when there are no recent games', () => {
    const r = radarReadout([ax('Goals', 90, null), ax('Hits + blocks', 10, null), ax('Assists', 50, null)]);
    expect(r.recent).toBe(false);
    expect(r.top).toEqual([{ label: 'Goals', pct: 90 }]);
    expect(r.bottom).toEqual([{ label: 'Hits + blocks', pct: 10 }]);
    expect(r.moved).toEqual([]);
  });

  it('leaves every group empty for a player who stands out nowhere', () => {
    const r = radarReadout([ax('Goals', 50, 55), ax('Assists', 60, 52)]);
    expect([r.top, r.bottom, r.moved]).toEqual([[], [], []]);
  });
});
