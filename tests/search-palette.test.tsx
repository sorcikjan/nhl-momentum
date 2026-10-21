import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SearchList, flattenRows } from '@/components/search/SearchList';
import { buildSearchIndex, searchIndex } from '@/lib/search';

const idx = buildSearchIndex(
  [{ id: 1, first_name: 'Connor', last_name: 'McDavid', position_code: 'C', headshot_url: 'https://x/mcd.png', teams: { abbrev: 'EDM' } }],
  [{ player_id: 1, momentum_ppm: 0.12 }],
  [{ id: 22, name: 'Edmonton Oilers', abbrev: 'EDM' }],
);

describe('SearchList', () => {
  it('groups players and teams with photo, team logo and Heat', () => {
    const rows = flattenRows(searchIndex(idx, 'edm'));
    const out = renderToStaticMarkup(<SearchList sections={[{ title: 'PLAYERS', rows: rows.filter(r => r.kind === 'player') }, { title: 'TEAMS', rows: rows.filter(r => r.kind === 'team') }]} active={0} />);
    expect(out).toContain('PLAYERS');
    expect(out).toContain('TEAMS');
    expect(out).toContain('https://x/mcd.png');
    expect(out).toContain('EDM_dark.svg');
    expect(out).toContain('>100<');
    expect(out).toContain('href="/players/1/connor-mcdavid"');
    expect(out).toContain('href="/teams/22/edmonton-oilers"');
  });
  it('marks the keyboard-selected row', () => {
    const rows = flattenRows(searchIndex(idx, 'connor'));
    const out = renderToStaticMarkup(<SearchList sections={[{ title: 'PLAYERS', rows }]} active={0} />);
    expect(out).toContain('aria-selected="true"');
  });
  it('lists teams first (few, and the likeliest intent when matched), then players', () => {
    expect(flattenRows(searchIndex(idx, 'edm')).map(r => r.kind)).toEqual(['team', 'player']);
  });
});
