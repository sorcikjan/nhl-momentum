import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { rankingRows } from '@/lib/rankings-view';
import { RankingsTable } from '@/components/rankings/RankingsTable';

const sk = (id: number, pos: string, g: number, a: number, ppm: number, sea: number, last = 'Smith') => ({
  player_id: id, momentum_ppm: ppm, season_ppm: sea, season_goals: g, season_assists: a, season_points: g + a,
  players: { first_name: 'Joe', last_name: last, position_code: pos, teams: { abbrev: 'EDM' } },
});
const data = [sk(1, 'C', 5, 10, 0.12, 0.1), sk(2, 'D', 1, 9, 0.06, 0.05), sk(3, 'L', 9, 1, 0.09, 0.1), sk(4, 'R', 3, 3, 0.03, 0.04)];

describe('rankingRows', () => {
  it('sorts by Heat by default and ranks 1..n', () => {
    const r = rankingRows(data, { pos: 'ALL', sort: 'heat' }, []);
    expect(r.map(x => x.playerId)).toEqual([1, 3, 2, 4]);
    expect(r.map(x => x.rank)).toEqual([1, 2, 3, 4]);
  });
  it('filters by position', () => {
    expect(rankingRows(data, { pos: 'D', sort: 'heat' }, []).map(x => x.playerId)).toEqual([2]);
  });
  it('sorts by goals', () => {
    expect(rankingRows(data, { pos: 'ALL', sort: 'goals' }, []).map(x => x.playerId)).toEqual([3, 1, 4, 2]);
  });
  it('computes change vs season average', () => {
    expect(rankingRows(data, { pos: 'ALL', sort: 'heat' }, [])[0].delta).toBe('+20%');
  });
});

describe('RankingsTable', () => {
  it('truncates long names so rows never widen the page', () => {
    const rows = rankingRows([sk(9, 'C', 1, 1, 0.05, 0.05, 'Ekman-Larsson-Andersson-Bergqvist')], { pos: 'ALL', sort: 'heat' }, []);
    expect(renderToStaticMarkup(<RankingsTable rows={rows} />)).toContain('truncate');
  });
});
