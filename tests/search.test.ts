import { describe, expect, it } from 'vitest';
import { buildSearchIndex, hotPlayers, normalize, searchIndex, type SearchIndex } from '@/lib/search';

const idx: SearchIndex = buildSearchIndex(
  [
    { id: 1, first_name: 'Connor', last_name: 'McDavid', position_code: 'C', headshot_url: 'mcd.png', teams: { abbrev: 'EDM' } },
    { id: 2, first_name: 'Ryan', last_name: 'McDonagh', position_code: 'D', headshot_url: null, teams: { abbrev: 'TBL' } },
    { id: 3, first_name: 'David', last_name: 'Pastrňák', position_code: 'R', headshot_url: null, teams: { abbrev: 'BOS' } },
    { id: 4, first_name: 'Tim', last_name: 'Stützle', position_code: 'C', headshot_url: null, teams: { abbrev: 'OTT' } },
    { id: 5, first_name: 'Leon', last_name: 'Draisaitl', position_code: 'C', headshot_url: null, teams: { abbrev: 'EDM' } },
    { id: 6, first_name: 'Stuart', last_name: 'Skinner', position_code: 'G', headshot_url: null, teams: { abbrev: 'EDM' } },
    { id: 7, first_name: 'Joel', last_name: 'Edmundson', position_code: 'D', headshot_url: null, teams: { abbrev: 'LAK' } },
    { id: 8, first_name: 'Victor', last_name: 'Hedman', position_code: 'D', headshot_url: null, teams: { abbrev: 'TBL' } },
  ],
  [{ player_id: 1, momentum_ppm: 0.12 }, { player_id: 2, momentum_ppm: 0.05 }, { player_id: 5, momentum_ppm: 0.09 }, { player_id: 6, momentum_ppm: 0.01 }],
  [{ id: 22, name: 'Edmonton Oilers', abbrev: 'EDM' }, { id: 8, name: 'Montréal Canadiens', abbrev: 'MTL' }],
);

describe('normalize', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalize('Pastrňák')).toBe('pastrnak');
    expect(normalize('Stützle')).toBe('stutzle');
  });
});

describe('buildSearchIndex', () => {
  it('shapes players with links, team, Heat (none for goalies)', () => {
    const p = idx.players.find(x => x.id === 1)!;
    expect(p).toMatchObject({ name: 'Connor McDavid', href: '/players/1/connor-mcdavid', team: 'EDM', pos: 'C', photo: 'mcd.png', heat: 100 });
    expect(idx.players.find(x => x.id === 6)!.heat).toBeNull();
    expect(idx.players.find(x => x.id === 3)!.heat).toBeNull();
  });
  it('shapes teams with links', () => {
    expect(idx.teams[0]).toMatchObject({ name: 'Edmonton Oilers', abbrev: 'EDM', href: '/teams/22/edmonton-oilers' });
  });
});

describe('searchIndex', () => {
  it('finds nothing for an empty query', () => {
    expect(searchIndex(idx, ' ')).toEqual({ players: [], teams: [] });
  });
  it('matches without diacritics', () => {
    expect(searchIndex(idx, 'pastrnak').players.map(p => p.id)).toEqual([3]);
    expect(searchIndex(idx, 'stutz').players.map(p => p.id)).toEqual([4]);
  });
  it('ranks prefix matches first, then by Heat', () => {
    expect(searchIndex(idx, 'mcd').players.map(p => p.id)).toEqual([1, 2]);
  });
  it('matches full names across first and last', () => {
    expect(searchIndex(idx, 'connor mcd').players.map(p => p.id)).toEqual([1]);
  });
  it('finds teams by name, city with accents, and abbreviation; abbreviation also lists its players', () => {
    expect(searchIndex(idx, 'montreal').teams.map(t => t.abbrev)).toEqual(['MTL']);
    const r = searchIndex(idx, 'edm');
    expect(r.teams.map(t => t.abbrev)).toEqual(['EDM']);
    expect(r.players.map(p => p.id).slice(0, 3)).toEqual([1, 5, 6]);
  });
  it('a query equal to a team abbreviation ranks that team\'s players above name prefixes and substrings', () => {
    expect(searchIndex(idx, 'edm').players.map(p => p.id)).toEqual([1, 5, 6, 7, 8]);
  });
  it('caps results', () => {
    const many = buildSearchIndex(Array.from({ length: 20 }, (_, i) => ({ id: i, first_name: 'Joe', last_name: `Smith${i}`, position_code: 'C', headshot_url: null, teams: { abbrev: 'EDM' } })), [], []);
    expect(searchIndex(many, 'smith').players).toHaveLength(8);
  });
});

describe('hotPlayers', () => {
  it('returns skaters by Heat, highest first', () => {
    expect(hotPlayers(idx, 2).map(p => p.id)).toEqual([1, 5]);
  });
});
