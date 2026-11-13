import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NowTab } from '@/components/player/v3/NowTab';
import { GamesTab } from '@/components/player/v3/GamesTab';
import { PlayerTab } from '@/components/player/v3/PlayerTab';
import { CareerTab } from '@/components/player/v3/CareerTab';
import { MiniHeader } from '@/components/player/v3/MiniHeader';
import type { ProfileV3View } from '@/components/player/v3/types';

const skater: ProfileV3View = {
  goalie: false,
  hero: { first: 'Cutter', last: 'Gauthier', number: 61, position: 'Left wing', team: 'ANA', teamName: 'Anaheim Ducks', photo: null },
  mini: { photo: null, name: 'Cutter Gauthier', line: '#61 · LW · Anaheim', team: 'ANA', status: null, next: 'Sat vs NYI', metric: { value: '95', label: 'HEAT' } },
  bio: [{ value: '🇺🇸 USA', sub: 'born in Sweden' }, { value: '22', sub: 'years old' }, { value: '4th', sub: 'NHL season' }, { value: '#5', sub: 'pick 2022' }],
  verdict: 'The hottest forward in the NHL, and his points a game have gone up every season.',
  status: null, next: 'Sat vs NYI', energy: { value: 71, note: '2 days rest' },
  metric: { label: 'HEAT', current: 95, delta: -5, deltaNote: 'after Nov 11', series: [60, 84, 50, 95], lo: 0, hi: 100, avg: 26, have: 18, need: 5, firstLabel: 'Oct 2' },
  last5: [{ top: '3G', opp: '@VAN', result: 'W' }, { top: '1G', opp: 'NSH', result: 'L' }],
  role: { kind: 'ladder', teamName: 'Ducks forwards', ladder: { bars: [{ id: 1, toiPerGame: 1236, me: false }, { id: 2, toiPerGame: 1104, me: true }], myRank: 2, max: 1236, min: 1104 } },
  character: { axes: [{ key: 'g', label: 'Goals', season: 99, recent: 99 }, { key: 'a', label: 'Assists', season: 64, recent: 38 }, { key: 's', label: 'Shots', season: 99, recent: 96 }], unused: ['Faceoffs'] },
  axisLabels: [], emptyNote: null,
  career: {
    columns: [{ season: '2026–27', team: 'ANA', teamName: 'Anaheim Ducks', league: 'NHL', value: 1.28, pct: 97, top: 3, gp: 18, thin: false }],
    timeline: [{ title: 'Boston College', detail: 'NCAA · 2022–24', now: false }, { title: 'Anaheim Ducks', detail: '2024–27', now: true }],
    events: [{ name: 'World Juniors', years: [2023, 2024] }], country: { code: 'USA', flag: '🇺🇸', name: 'USA', born: 'Sweden' },
  },
  games: {
    totals: [{ label: 'GAMES', value: '18', rank: null }, { label: 'GOALS', value: '16', rank: '#3' }],
    note: 'rank among NHL forwards',
    columns: ['G', 'A', 'SOG', 'HEAT'],
    rows: [{ date: '2026-11-11', opp: 'NSH', result: 'L', cells: ['1', '0', '7'], strong: [true, false, false], heat: 95 }],
  },
};

const goalie: ProfileV3View = {
  ...skater,
  goalie: true,
  hero: { first: 'Michal', last: 'Postava', number: 35, position: 'Goalie', team: 'DET', teamName: 'Detroit Red Wings', photo: null },
  mini: { photo: null, name: 'Michal Postava', line: '#35 · G', team: 'DET', status: { text: 'In the AHL · Grand Rapids', tone: 'amber' }, next: null, metric: { value: '–', label: 'SAVE %' } },
  bio: [{ value: '🇨🇿 Czechia', sub: 'nationality' }, { value: '24', sub: 'years old' }, { value: '1st', sub: 'NHL season' }, { value: 'Undrafted', sub: 'draft' }],
  verdict: '2 NHL games this season, now in the AHL.',
  status: { text: 'In the AHL', sub: 'Grand Rapids Griffins', tone: 'amber' }, next: null, energy: null,
  metric: { label: 'SAVE %', current: null, delta: null, deltaNote: null, series: [0.875, 0.889], lo: 0.85, hi: 0.95, avg: 0.891, have: 2, need: 5, firstLabel: 'Oct 22' },
  last5: [{ top: '7/8', opp: '@VAN', result: 'W' }, { top: '24/27', opp: '@EDM', result: 'W' }],
  role: { kind: 'starts', rows: [{ name: 'Gibson', starts: 13, me: false }, { name: 'Postava', starts: 1, me: true }] },
  character: { axes: [], unused: [] }, axisLabels: ['Save %', 'Even strength', 'Shorthanded'], emptyNote: { have: 2, need: 5 },
  career: { columns: [], timeline: [{ title: 'Grand Rapids Griffins', detail: 'AHL · 2025–27 · 2 NHL games this season', now: true }], events: [], country: { code: 'CZE', flag: '🇨🇿', name: 'Czechia', born: null } },
  games: { totals: [{ label: 'GAMES', value: '2', rank: null }], note: 'too few games to rank', columns: ['SAVES', 'SV%', 'DEC'], rows: [] },
};

const all = (v: ProfileV3View) => [<NowTab key="n" v={v} />, <GamesTab key="g" v={v} />, <PlayerTab key="p" v={v} />, <CareerTab key="c" v={v} />, <MiniHeader key="m" {...v.mini} />]
  .map(el => renderToStaticMarkup(el)).join('\n');

const SECTIONS = ["How he&#x27;s doing", 'His role', 'Where he&#x27;s heading', 'Every game', 'What kind of', 'Season by season', 'How he got here', 'For his country'];

describe('profile v3 panels', () => {
  it('skater: every section renders', () => {
    const out = all(skater);
    for (const s of SECTIONS) expect(out).toContain(s);
    expect(out).toContain('Sat vs NYI');
    expect(out).toContain('top 3%');
  });
  it('goalie in the minors with 2 games: the same sections, empty states, honest status', () => {
    const out = all(goalie);
    for (const s of SECTIONS) expect(out).toContain(s);
    expect(out).toContain('2 of 5');
    expect(out.match(/In the AHL/g)!.length).toBeGreaterThanOrEqual(2);
    expect(out).not.toMatch(/injured/i);
    expect(out).not.toContain('NaN');
  });
  it('no AI text and no archetype labels', () => {
    for (const v of [skater, goalie]) expect(all(v)).not.toMatch(/Scouting report|Elite|Playmaker|Sniper/i);
  });
});
