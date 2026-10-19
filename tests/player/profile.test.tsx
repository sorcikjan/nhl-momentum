import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlayerHero, type HeroProps } from '@/components/player/PlayerHero';
import { ProfileBody, type ProfileView } from '@/components/player/ProfileBody';

const hero: HeroProps = {
  first: 'Connor', last: 'McDavid', team: 'EDM', number: 97, position: 'C', age: 29,
  shoots: 'L', height: "6'1\"", weight: '193 lb', birthPlace: 'Richmond Hill, ON', flag: '🇨🇦', drafted: '2015 · Rd 1 #1',
  seasonLine: '6G · 17A · 23 pts', photo: null, heat: 100, heatDelta: 4, rankLine: '#1 of 540', energy: 96, energyNote: 'Last game 1 day ago.',
  archetype: { name: 'Playmaker', blurb: null, tags: [] }, outBanner: null, bio: null,
};

const view: ProfileView = {
  hero,
  series: [{ date: '2026-10-10', heat: 80 }, { date: '2026-10-18', heat: 100 }],
  seasonAvgHeat: 90,
  chips: [{ label: 'Trend', value: 'Climbing', tone: 'rise' }],
  perfEval: null,
  last5: [{ label: 'G', value: '5' }],
  gameLog: [{ date: '2026-10-18', opponent: 'CGY', home: true, result: 'W', goals: 1, assists: 2, plusMinus: 2, toi: '22:10', heat: 95 }],
  seasonLabel: '2026–27', seasonGames: 8,
  seasonTiles: [{ label: 'POINTS', value: '23' }],
  radar: [{ label: 'SCORING', value: 0.9 }, { label: 'PLAYMAKING', value: 1 }, { label: 'SHOOTING', value: 0.8 }],
  vsRows: [{ label: 'Points per game', you: 2.88, league: 0.6, top: null, topLabel: null, unit: '' }],
};

describe('PlayerHero', () => {
  it('says "No games yet this season" instead of a zero or NaN heat', () => {
    const out = renderToStaticMarkup(<PlayerHero {...hero} heat={null} heatDelta={null} rankLine={null} />);
    expect(out).toContain('No games yet this season');
    expect(out).not.toContain('NaN');
  });
  it('shows the out banner', () => {
    const out = renderToStaticMarkup(<PlayerHero {...hero} outBanner={{ label: 'INJURED', note: 'Missed 6 straight games' }} />);
    expect(out).toContain('INJURED');
  });
  it('renders first and last name as the display headline', () => {
    expect(renderToStaticMarkup(<PlayerHero {...hero} />)).toMatch(/<h1[^>]*>[\s\S]*Connor[\s\S]*McDavid/);
  });
});

describe('ProfileBody', () => {
  it('orders the sections like the design', () => {
    const out = renderToStaticMarkup(<ProfileBody view={view} />);
    const kickers = ['FORM TRACKER', 'RECENT FORM · AI', 'LAST 5 STATS', 'LAST 5 GAME LOG', 'SEASON STATS · 2026–27', 'PERFORMANCE RADAR', 'VS LEAGUE'];
    const idx = kickers.map(k => out.indexOf(k));
    expect(idx.every(i => i >= 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
  });
  it('never prints the prototype season label', () => {
    expect(renderToStaticMarkup(<ProfileBody view={view} />)).not.toContain('2025–26');
  });
});
