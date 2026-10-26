import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlayerHero, type HeroProps } from '@/components/player/PlayerHero';
import { ProfileBody, type ProfileView } from '@/components/player/ProfileBody';

const hero: HeroProps = {
  first: 'Connor', last: 'McDavid', team: 'EDM', teamName: 'Edmonton Oilers', number: 97, position: 'C', age: 29,
  shoots: 'L', height: "6'1\"", weight: '193 lb', birthPlace: 'Richmond Hill, ON', flag: '🇨🇦', drafted: '2015 · Rd 1 #1', photo: null,
  archetype: { name: 'Playmaker', basis: '74% of points are assists' },
  headline: '23 points in 8 games',
  heat: { value: 100, delta: 4, pct: 99, avg: 31, one: 'forward', many: 'forwards' },
  energy: { value: 96, avg: 84, one: 'forward', note: 'last game yesterday' },
  outBanner: null,
};

const words = { one: 'forward', many: 'forwards' };
const view: ProfileView = {
  hero, last: 'McDavid', peers: words,
  scouting: { bio: 'Who he is.', now: 'Right now.' },
  trend: { kind: 'skater', heatAvg: 31, heatTop: 78, peers: words, games: [
    { date: '2026-10-10', opp: 'TOR', res: 'W', heat: 80, g: 1, a: 0, pts: 1, sog: 3, toi: 18.5, pm: 1 },
    { date: '2026-10-18', opp: 'BOS', res: 'L', heat: 100, g: 0, a: 2, pts: 2, sog: 2, toi: 20.1, pm: 0 },
  ] },
  trendLine: 'Steady around 100 lately.',
  last5: {
    table: { n: 3, rows: [{ key: 'pts', label: 'Points', l5: 6, own: 8.6, pos: 1.5, verdict: { text: '▼ 0.7× his usual', tone: 'red' } }] },
    line: '6 points in 3 games.',
    games: [{ id: 1, date: '2026-10-18', opp: 'CGY', home: true, result: 'W', g: 1, a: 2, sog: 4, pm: 2, toi: 1330, heat: 95 }],
  },
  goalieLast5: [], goalieSeason: [],
  seasonLabel: '2026–27', seasonGames: 8,
  stands: [{ key: 'pts', label: 'Points', me: 23, avg: 5.1, rank: 1, n: 346, leader: { name: 'McDavid', team: 'EDM', value: 23, isMe: true } }],
  radar: { axes: [{ label: 'Goals', word: 'goals', pct: 99 }, { label: 'Assists', word: 'assists', pct: 100 }, { label: 'Shots', word: 'shots', pct: 40 }], strong: ['assists (100th)'], weak: ['shots (40th)'] },
  seasons: { rows: [{ season: '2026–27', team: 'EDM', teamName: 'Edmonton Oilers', gp: 8, g: 6, a: 17, pts: 23, pm: 19 }], current: '2026–27', pace: 'On pace for 236 points.', goalie: false },
};

describe('PlayerHero', () => {
  it('says "No games yet this season" instead of a zero or NaN heat', () => {
    const out = renderToStaticMarkup(<PlayerHero {...hero} heat={null} />);
    expect(out).toContain('No games yet this season');
    expect(out).not.toContain('NaN');
  });
  it('Heat and Energy each against the average at his position', () => {
    const out = renderToStaticMarkup(<PlayerHero {...hero} />).replace(/<!-- -->/g, '');
    expect(out).toContain('hotter than <b>99%</b> of forwards · average forward 31');
    expect(out).toContain('average forward 84 · last game yesterday');
    expect(out).toContain('PLAYMAKER');
  });
  it('shows the out banner', () => {
    expect(renderToStaticMarkup(<PlayerHero {...hero} outBanner={{ label: 'INJURED', note: 'Missed 6 straight games' }} />)).toContain('INJURED');
  });
  it('renders first and last name as the headline', () => {
    expect(renderToStaticMarkup(<PlayerHero {...hero} />)).toMatch(/<h1[^>]*>[\s\S]*Connor[\s\S]*McDavid/);
  });
});

describe('ProfileBody', () => {
  it('orders the sections like the design', () => {
    const out = renderToStaticMarkup(<ProfileBody view={view} />);
    const kickers = ['SCOUTING REPORT', 'FORM OVER TIME', 'LAST 3 GAMES', 'THIS SEASON · 2026–27 · AMONG 346 FORWARDS', 'PERFORMANCE RADAR', 'CAREER · NHL REGULAR SEASON'];
    const idx = kickers.map(k => out.indexOf(k));
    expect(idx.every(i => i >= 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
  });
  it('every number with its comparison', () => {
    const out = renderToStaticMarkup(<ProfileBody view={view} />).replace(/<!-- -->/g, '');
    expect(out).toContain('AVERAGE FORWARD');
    expect(out).toContain('▼ 0.7× his usual');
    expect(out).toContain('1st of 346 forwards');
    expect(out).toContain('leads the league');
    expect(out).toContain('Separates in:</b> assists (100th)');
  });
  it('goalies: no position comparisons, their own tiles', () => {
    const out = renderToStaticMarkup(<ProfileBody view={{ ...view, peers: null, stands: [], radar: null, last5: { table: null, line: null, games: [] }, goalieLast5: [{ label: 'SV%', value: '.920' }], goalieSeason: [{ label: 'GAA', value: '2.10' }] }} />);
    expect(out).not.toContain('PERFORMANCE RADAR');
    expect(out).toContain('.920');
    expect(out).toContain('SEASON STATS · 2026–27');
  });
});
