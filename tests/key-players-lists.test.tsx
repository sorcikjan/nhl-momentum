import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AvatarStack } from '@/components/ds';
import { TonightSlate } from '@/components/home/TonightSlate';
import { ScheduleRow, type ScheduleRowData } from '@/components/schedule/ScheduleRow';
import type { SlateGame } from '@/lib/home';

const three = (t: string) => [1, 2, 3].map(i => ({ name: `${t} Player ${i}`, photo: `https://x/${t}${i}.png`, team: t }));

describe('AvatarStack', () => {
  it('shows overlapping photos with the names on hover', () => {
    const out = renderToStaticMarkup(<AvatarStack team="EDM" players={three('EDM')} />);
    expect(out.match(/<img/g)!.length).toBeGreaterThanOrEqual(3);
    expect(out).toContain('title="EDM Player 1, EDM Player 2, EDM Player 3"');
  });
  it('renders nothing without players', () => {
    expect(renderToStaticMarkup(<AvatarStack team="EDM" players={[]} />)).toBe('');
  });
});

describe('key players in game lists (desktop)', () => {
  it('Tonight slate rows show both teams\' key players', () => {
    const g = {
      id: 1, href: '/g', startTimeUTC: '2026-10-19T23:00:00Z', state: 'FUT', awayScore: null, homeScore: null,
      away: { abbrev: 'ANA', name: 'Anaheim' }, home: { abbrev: 'NYR', name: 'NY Rangers' },
      pickSide: 'home', pickPct: 55, watch: null, keyAway: three('ANA'), keyHome: three('NYR'),
    } as SlateGame;
    const out = renderToStaticMarkup(<TonightSlate games={[g]} nextGameDate={null} />);
    expect(out).toContain('https://x/ANA1.png');
    expect(out).toContain('https://x/NYR3.png');
  });
  it('schedule rows show them for upcoming games', () => {
    const r: ScheduleRowData = {
      href: '/g', state: 'FUT', startTimeUTC: null, away: 'ANA', home: 'NYR', awayScore: null, homeScore: null,
      pick: null, pickResult: null, watch: null, watchability: 50, recapHref: null, marquee: false,
      keyAway: three('ANA'), keyHome: three('NYR'),
    };
    expect(renderToStaticMarkup(<ScheduleRow g={r} />)).toContain('https://x/NYR1.png');
  });
});
