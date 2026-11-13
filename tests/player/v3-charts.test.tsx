import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HeatLine } from '@/components/player/v3/HeatLine';
import { Radar } from '@/components/player/v3/Radar';
import { SeasonColumns } from '@/components/player/v3/SeasonColumns';
import { TeamLadder } from '@/components/player/v3/TeamLadder';
import { GoalieStarts } from '@/components/player/v3/GoalieStarts';
import { Timeline } from '@/components/player/v3/Timeline';
import type { Column } from '@/lib/profile-v3';

const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe('HeatLine', () => {
  it('draws placeholders for the games still missing', () => {
    const out = html(<HeatLine values={[0.875, 0.889]} lo={0.85} hi={0.95} avg={0.891} avgLabel="avg .891" format={v => v.toFixed(3).slice(1)} slots={5} firstLabel="Oct 22" />);
    expect(out.match(/data-slot="empty"/g)?.length).toBe(3);
    expect(out).toContain('avg .891');
  });
  it('survives no values', () => {
    expect(html(<HeatLine values={[]} lo={0} hi={100} avg={null} avgLabel="" format={String} firstLabel="" />)).not.toContain('NaN');
  });
});

describe('Radar', () => {
  const axes = [
    { key: 'g', label: 'Goals', season: 99, recent: 99 }, { key: 'a', label: 'Assists', season: 64, recent: 38 },
    { key: 's', label: 'Shots', season: 99, recent: 96 },
  ];
  it('two curves, the recent value on each label and a delta when it moved 5+', () => {
    const out = html(<Radar axes={axes} unused={['Faceoffs']} />);
    expect(out).toContain('Assists');
    expect(out).toContain('▼26');
    expect(out).not.toContain('▼3');
    expect(out).toContain('Faceoffs · not used');
  });
  it('empty state says how many games are still missing', () => {
    const out = html(<Radar axes={[]} unused={[]} emptyNote={{ have: 2, need: 5 }} labels={['Save %', 'Even strength', 'Shorthanded']} />);
    expect(out).toContain('2 of 5');
    expect(out).not.toContain('NaN');
  });
});

const col = (o: Partial<Column>): Column => ({ season: '2026–27', team: 'ANA', teamName: 'Anaheim Ducks', league: 'NHL', value: 1.28, pct: 97, top: 3, gp: 18, thin: false, ...o });

describe('SeasonColumns', () => {
  it('skaters: rank on each column with the team written out', () => {
    const out = html(<SeasonColumns columns={[col({ season: '2024–25', value: 0.54, pct: 63, top: 37 }), col({})]} goalie={false} />);
    expect(out).toContain('Anaheim');
    expect(out).toContain('top 3%');
    expect(out).toContain('1.28');
  });
  it('skaters: an unranked thin season is a visible hatched stub, not an empty slot', () => {
    const out = html(<SeasonColumns columns={[col({ season: '2023–24', value: 1, pct: null, top: null, gp: 1, thin: true })]} goalie={false} />);
    expect(out).toMatch(/data-thin="true"[^>]*height:12%/);
    expect(out).toContain('1 gp');
  });
  it('goalies: full club names, no codes, thin seasons hatched', () => {
    const out = html(<SeasonColumns goalie columns={[
      col({ team: null, teamName: 'HC Přerov', league: 'Chance liga', value: 0.943, pct: null, top: null, gp: 44 }),
      col({ team: 'DET', teamName: 'Detroit Red Wings', value: 0.886, pct: null, top: null, gp: 2, thin: true }),
    ]} />);
    expect(out).toContain('Přerov');
    expect(out).toContain('.943');
    expect(out).toContain('data-thin="true"');
    expect(out).not.toMatch(/>PRE<|>GRG</);
  });
});

describe('role and path', () => {
  it('ladder marks him with rank and ice time', () => {
    const out = html(<TeamLadder bars={[{ id: 1, toiPerGame: 1236, me: false }, { id: 2, toiPerGame: 1104, me: true }]} myRank={2} max={1236} min={1104} teamName="Ducks" />);
    expect(out).toContain('2nd · 18:24');
  });
  it('goalie starts list names and counts', () => {
    const out = html(<GoalieStarts rows={[{ name: 'Gibson', starts: 13, me: false }, { name: 'Postava', starts: 1, me: true }]} />);
    expect(out).toContain('Gibson');
    expect(out).toContain('13');
  });
  it('timeline marks the current step', () => {
    const out = html(<Timeline steps={[{ title: 'Boston College', detail: '2022–24', now: false }, { title: 'Anaheim Ducks', detail: '2024–27', now: true }]} />);
    expect(out).toContain('data-now="true"');
  });
});
