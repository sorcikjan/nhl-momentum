import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HOME_SECTIONS, HomeBody } from '@/components/home/HomeBody';
import type { HomeData } from '@/lib/home';

const base: HomeData = {
  today: '2026-10-19',
  tonight: [{
    id: 1, href: '/games/1/ana-at-nyr-1019', startTimeUTC: '2026-10-19T23:00:00Z', state: 'FUT', awayScore: null, homeScore: null,
    away: { abbrev: 'ANA', name: 'Anaheim' }, home: { abbrev: 'NYR', name: 'NY Rangers' },
    pickSide: 'away', pickPct: 55, watch: { name: 'Mikael Granlund', heat: 57, photo: null, team: 'ANA' },
  }],
  nextGameDate: null,
  resultsDate: '2026-10-18',
  results: [{
    id: 2, href: '/games/2/car-at-cgy-1018',
    away: { abbrev: 'CAR', name: 'Carolina', score: 2 }, home: { abbrev: 'CGY', name: 'Calgary', score: 3 },
    pick: 'miss', pickTeam: 'CAR', pickPct: 63, star: { playerId: 3, name: 'D. Cooley', team: 'CGY', goalie: true, photo: null }, starHeat: null,
  }],
  stories: [{ href: '/recaps/x', kicker: 'LAST NIGHT · BIG STORY', title: 'Flames Extinguish Reigning Champs', dek: 'd', team: null, lead: true }],
  hottest: [{ playerId: 4, href: '/players/4/x', name: 'Connor McDavid', team: 'EDM', heat: 100, sub: 'Forward', photo: null }],
  goalies: [],
  rookies: [],
  pickAccuracyPct: 58.4,
  rankedCount: 540,
  heroImageUrl: null,
};

const html = (d: HomeData) => renderToStaticMarkup(<HomeBody data={d} />);
const order = (out: string) => [...out.matchAll(/data-section="([a-z-]+)"/g)].map(m => m[1]);

describe('homepage', () => {
  it('renders the design sections in order', () => {
    expect(order(html(base))).toEqual([...HOME_SECTIONS]);
    expect(HOME_SECTIONS).toEqual(['value-prop', 'tonight', 'results', 'stories', 'rankings', 'explore']);
  });

  it('shows real accuracy and never the prototype number', () => {
    const out = html(base);
    expect(out).toContain('58% pick accuracy');
    expect(out).not.toContain('67%');
  });

  it('points to the next game day when there are no games today', () => {
    const out = html({ ...base, tonight: [], nextGameDate: '2026-10-21' });
    expect(out).toContain('data-section="tonight"');
    expect(out).toMatch(/Oct 21/);
  });

  it('omits the stories section when there is no recap', () => {
    expect(order(html({ ...base, stories: [] }))).not.toContain('stories');
  });

  it('shows the real ranked count, not the prototype one', () => {
    const out = html(base);
    expect(out).toContain('540');
    expect(out).not.toContain('312');
  });

  it('constrains every mobile grid to the viewport (no horizontal scroll at 390px)', () => {
    const out = html(base);
    const grids = [...out.matchAll(/class="([^"]*\bgrid\b[^"]*)"/g)].map(m => m[1]);
    expect(grids.length).toBeGreaterThan(0);
    for (const c of grids) expect(c).toMatch(/\bgrid-cols-(1|2)\b/);
  });
});
