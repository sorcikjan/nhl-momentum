import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { rankingRows, viewRows } from '@/lib/rankings-view';

const sk = (id: number, pos: string, g: number, a: number, ppm: number) => ({
  player_id: id, momentum_ppm: ppm, season_ppm: ppm, season_goals: g, season_assists: a, season_points: g + a,
  players: { first_name: 'Joe', last_name: 'Smith', position_code: pos, teams: { abbrev: 'EDM' } },
});
const base = rankingRows([sk(1, 'C', 5, 10, 0.12), sk(2, 'D', 1, 9, 0.06), sk(3, 'D', 9, 1, 0.03)], { pos: 'ALL', sort: 'heat' }, []);

describe('viewRows (client-side filter of the static rankings)', () => {
  it('filters by position and re-ranks from 1', () => {
    const r = viewRows(base, { pos: 'D', sort: 'goals' });
    expect(r.map(x => x.playerId)).toEqual([3, 2]);
    expect(r.map(x => x.rank)).toEqual([1, 2]);
  });
  it('defaults keep the Heat order', () => {
    expect(viewRows(base, { pos: 'ALL', sort: 'heat' }).map(x => x.playerId)).toEqual([1, 2, 3]);
  });
});

describe('/rankings page', () => {
  it('does not read searchParams (that would make it dynamic and drop ISR)', () => {
    expect(readFileSync('app/rankings/page.tsx', 'utf8')).not.toMatch(/searchParams/);
  });
});
