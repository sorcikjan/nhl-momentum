import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AvatarStack, KeyLine } from '@/components/ds';
import { TonightSlate } from '@/components/home/TonightSlate';
import { ResultsSection } from '@/components/home/ResultsSection';
import { ScheduleRow, type ScheduleRowData } from '@/components/schedule/ScheduleRow';
import type { ResultCard, SlateGame } from '@/lib/home';

const three = (t: string) => ['Jack Quinn', 'Zach Benson', 'Tage Van Thompson'].map((n, i) => ({ name: `${n}`, photo: `https://x/${t}${i + 1}.png`, team: t }));

describe('AvatarStack', () => {
  it('shows overlapping photos with the names on hover', () => {
    const out = renderToStaticMarkup(<AvatarStack team="EDM" players={three('EDM')} />);
    expect(out.match(/<img/g)!.length).toBeGreaterThanOrEqual(3);
    expect(out).toContain('title="Jack Quinn, Zach Benson, Tage Van Thompson"');
  });
  it('renders nothing without players', () => {
    expect(renderToStaticMarkup(<AvatarStack team="EDM" players={[]} />)).toBe('');
  });
});

describe('KeyLine', () => {
  it('shows logo, photos and the last names', () => {
    const out = renderToStaticMarkup(<KeyLine team="BUF" players={three('BUF')} />);
    expect(out).toContain('BUF_dark.svg');
    expect(out).toContain('https://x/BUF1.png');
    expect(out).toContain('Quinn · Benson · Van Thompson');
    expect(out).toContain('truncate');
  });
  it('renders nothing without players', () => {
    expect(renderToStaticMarkup(<KeyLine team="BUF" players={[]} />)).toBe('');
  });
});

const slate = {
  id: 1, href: '/g', startTimeUTC: '2026-10-19T23:00:00Z', state: 'FUT', awayScore: null, homeScore: null,
  away: { abbrev: 'PHI', name: 'Philadelphia' }, home: { abbrev: 'BUF', name: 'Buffalo' },
  pickSide: 'home', pickPct: 65, keyAway: three('PHI'), keyHome: three('BUF'),
} as SlateGame;

describe('Tonight slate', () => {
  it('shows both teams\' key players instead of a single "watch for"', () => {
    const out = renderToStaticMarkup(<TonightSlate games={[slate]} nextGameDate={null} />);
    expect(out).toContain('https://x/PHI1.png');
    expect(out).toContain('https://x/BUF3.png');
    expect(out).not.toContain('WATCH FOR');
  });
});

describe('Results', () => {
  it('each card shows three key players per team, not one star', () => {
    const r: ResultCard = {
      id: 1, href: '/g', away: { abbrev: 'TBL', name: 'Tampa Bay', score: 6 }, home: { abbrev: 'VGK', name: 'Vegas', score: 2 },
      pick: 'miss', pickTeam: 'VGK', pickPct: 60, keyAway: three('TBL'), keyHome: three('VGK'),
    };
    const out = renderToStaticMarkup(<ResultsSection date="2026-10-20" results={[r]} />);
    expect(out).toContain('https://x/TBL1.png');
    expect(out).toContain('https://x/VGK3.png');
    expect(out).not.toContain('★');
  });
});

describe('Schedule rows', () => {
  const base: ScheduleRowData = {
    href: '/g', state: 'FUT', startTimeUTC: null, away: 'PHI', home: 'BUF', awayScore: null, homeScore: null,
    pick: null, pickResult: null, watchability: 50, recapHref: null, marquee: false,
    keyAway: three('PHI'), keyHome: three('BUF'),
  };
  it('show key players for upcoming games, without "watch for"', () => {
    const out = renderToStaticMarkup(<ScheduleRow g={base} />);
    expect(out).toContain('https://x/BUF1.png');
    expect(out).not.toContain('WATCH FOR');
  });
  it('and for finished games', () => {
    expect(renderToStaticMarkup(<ScheduleRow g={{ ...base, state: 'OFF', awayScore: 2, homeScore: 3 }} />)).toContain('https://x/PHI2.png');
  });
});
