import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HOME_SECTIONS, HomeBody } from '@/components/home/HomeBody';
import type { HomeData } from '@/lib/home';
import type { PlayerRowData } from '@/lib/player-row';

const row = (id: number, name: string, value: string, extra: Partial<PlayerRowData> = {}): PlayerRowData => ({
  playerId: id, href: `/players/${id}/x`, name, photo: null, team: 'EDM', mark: String(id), markTone: null,
  pos: 'C', l5: 'L5 3G 4A', chip: null, value, valueHeat: Number(value), ...extra,
});

const base: HomeData = {
  today: '2026-10-22',
  tonight: [{
    id: 1, href: '/games/1/car-at-edm-1022', startTimeUTC: '2026-10-23T01:00:00Z', state: 'FUT', marquee: true,
    away: { abbrev: 'CAR', name: 'Carolina', score: null, pct: 50, players: [], teamHeat: 52 },
    home: { abbrev: 'EDM', name: 'Edmonton', score: null, pct: 50, teamHeat: 60,
      players: [{ playerId: 9, name: 'Connor McDavid', href: '/players/9/x', photo: null, heat: 100, stat: null }] },
    pick: { abbrev: 'EDM', pct: 50 }, pickResult: null,
  }],
  nextGameDate: null,
  resultsDate: '2026-10-21',
  results: [{
    id: 2, href: '/games/2/fla-at-ott-1021', state: 'OFF', startTimeUTC: null,
    away: { abbrev: 'FLA', name: 'Florida', score: 1, pct: null, players: [] }, home: { abbrev: 'OTT', name: 'Ottawa', score: 5, pct: null, players: [] },
    pick: { abbrev: 'FLA', pct: 53 }, pickResult: 'miss',
  }],
  night: { href: '/recaps/x', kicker: 'THE NIGHT · WEDNESDAY · OCTOBER 21', title: 'Senators Explode for Five', dek: 'd', image: null, watchLabel: null, watchHref: null,
    scores: [{ away: 'FLA', awayScore: 1, home: 'OTT', homeScore: 5, href: '/games/2/fla-at-ott-1021' }] },
  gameStories: [],
  leader: {
    playerId: 9, href: '/players/9/connor-mcdavid', first: 'Connor', last: 'McDavid', photo: null, team: 'EDM', teamName: 'Edmonton Oilers',
    pos: 'C', heat: 100, pace: -2, goals: 3, assists: 11, games: 5,
    tonight: { href: '/games/1/car-at-edm-1022', opponent: 'Carolina', time: '2026-10-23T01:00:00Z' },
  },
  leaders: [row(2, 'Mark Stone', '79')],
  heatingUp: [row(3, 'Matvei Michkov', '66', { mark: '↑', markTone: 'rise', chip: { text: '+80%', tone: 'rise' } })],
  coolingOff: [row(4, 'Jaden Schwartz', '0', { mark: '↓', markTone: 'cold', l5: 'L5 0G 0A · season 36' })],
  goalies: [row(5, 'Jake Oettinger', '.946', { valueHeat: null, pos: 'G', l5: 'L5 3–1–1', chip: { text: '1.20 GAA', tone: 'muted' } })],
  rookies: [row(6, 'Stephen Halliday', '48')],
  standings: [
    { abbrev: 'FLA', name: 'Panthers', href: '/teams/13/florida-panthers', conference: 'Eastern', division: 'Atlantic', gp: 11, w: 5, l: 4, otl: 2, pts: 12, gd: -3, l10: '4-4-2', streak: 'L2', heat: 79 },
    { abbrev: 'EDM', name: 'Oilers', href: '/teams/22/edmonton-oilers', conference: 'Western', division: 'Pacific', gp: 10, w: 8, l: 1, otl: 1, pts: 17, gd: 15, l10: '8-1-1', streak: 'W3', heat: 60 },
  ],
  statLeaders: [{ key: 'points', title: 'Points', unit: 'PTS', rows: [
    { id: 8478402, name: 'Connor McDavid', team: 'EDM', pos: 'C', photo: null, href: '/players/8478402/connor-mcdavid', value: '31', heat: 100 },
  ] }],
};

const html = (d: HomeData) => renderToStaticMarkup(<HomeBody data={d} />);
const order = (out: string) => [...out.matchAll(/<section data-section="([a-z-]+)"/g)].map(m => m[1]);

describe('homepage', () => {
  it('renders the agreed sections in order: results, Heat, tonight, rankings, stories, standings, leaders', () => {
    expect(HOME_SECTIONS).toEqual(['results', 'heat', 'tonight', 'rankings', 'stories', 'standings', 'leaders']);
    expect(order(html(base))).toEqual([...HOME_SECTIONS]);
  });

  it('has exactly one h1, the Heat question, at the same size as the other sections', () => {
    const out = html(base);
    expect(out.match(/<h1/g)).toHaveLength(1);
    expect(out).toMatch(/<h1[^>]*>Who&#x27;s hot in the NHL right now\.<\/h1>/);
    const size = (tag: string, text: string) => out.match(new RegExp(`<${tag}[^>]*font-size:([^;]+);[^>]*>${text}`))?.[1];
    expect(size('h1', 'Who')).toBe(size('h2', 'Last night'));
  });

  it('shows what the leader did in the last five games', () => {
    const out = html(base);
    expect(out).toContain('3 G');
    expect(out).toContain('11 A');
    expect(out).toContain('14 PTS');
    expect(out).toContain('Tonight vs Carolina');
  });

  it('states the pick record plainly, never a season accuracy claim', () => {
    const out = html(base);
    expect(out).toContain('Our picks went 0 for 1.');
    expect(out).not.toContain('pick accuracy');
  });

  it('names the game of the night and puts the team Heat on the cards', () => {
    const out = html(base);
    expect(out).toContain('★ Game of the night:');
    expect(out).toContain('Carolina at Edmonton');
    expect(out).toContain('HEAT 60');
    expect(out).not.toContain('WATCHABILITY');
  });

  it('every player list uses the same row', () => {
    const out = html(base);
    for (const n of ['Mark Stone', 'Matvei Michkov', 'Jaden Schwartz', 'Jake Oettinger', 'Stephen Halliday']) expect(out).toContain(n);
    expect(out.match(/L5 /g)!.length).toBeGreaterThanOrEqual(5);
    expect(out).toContain('L5 0G 0A · season 36');
    expect(out).toContain('.946');
  });

  it('points to the next game day when there are no games today', () => {
    const out = html({ ...base, tonight: [], nextGameDate: '2026-10-24' });
    expect(out).toContain('data-section="tonight"');
    expect(out).toMatch(/Oct 24/);
  });

  it('omits the stories section when there is no recap', () => {
    expect(order(html({ ...base, night: null }))).not.toContain('stories');
  });

  it('shows both conferences with each team linked and its Heat, and the leaders with theirs', () => {
    const out = html(base);
    expect(out).toContain('Eastern Conference');
    expect(out).toContain('Western Conference');
    expect(out).toContain('href="/teams/13/florida-panthers"');
    expect(out).toMatch(/Heat <!-- -->100|Heat 100/);
    expect(out).toContain('Source: NHL.com'.toUpperCase());
  });

  it('leaves the standings out when NHL.com is unreachable', () => {
    expect(order(html({ ...base, standings: [], statLeaders: [] }))).not.toContain('standings');
  });

  it('constrains every mobile grid to the viewport (no horizontal scroll at 390px)', () => {
    const out = html(base);
    const grids = [...out.matchAll(/class="([^"]*\bgrid\b[^"]*)"/g)].map(m => m[1]);
    expect(grids.length).toBeGreaterThan(0);
    // grid-cols-N is repeat(N, minmax(0, 1fr)): it never overflows; N ≤ 4 keeps cells tappable.
    for (const c of grids) expect(c).toMatch(/\bgrid-cols-[1-4]\b/);
  });
});
