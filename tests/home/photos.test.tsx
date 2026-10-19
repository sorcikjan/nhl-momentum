import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TonightSlate } from '@/components/home/TonightSlate';
import { ResultsSection } from '@/components/home/ResultsSection';
import type { ResultCard, SlateGame } from '@/lib/home';

const PHOTO = 'https://assets.nhle.com/mugs/nhl/20262027/COL/8477492.png';

describe('homepage player photos', () => {
  it('Tonight "watch for" shows the player photo', () => {
    const g = {
      id: 1, href: '/g', startTimeUTC: '2026-10-19T23:00:00Z', state: 'FUT', awayScore: null, homeScore: null,
      away: { abbrev: 'COL', name: 'Colorado' }, home: { abbrev: 'PHI', name: 'Philadelphia' },
      pickSide: 'away', pickPct: 72, watch: { name: 'Nathan MacKinnon', heat: 81, photo: PHOTO, team: 'COL' },
    } as SlateGame;
    expect(renderToStaticMarkup(<TonightSlate games={[g]} nextGameDate={null} />)).toContain(PHOTO);
  });
  it('Results first star shows the player photo', () => {
    const r: ResultCard = {
      id: 1, href: '/g', away: { abbrev: 'CBJ', name: 'Columbus', score: 1 }, home: { abbrev: 'MIN', name: 'Minnesota', score: 2 },
      pick: 'hit', pickTeam: 'MIN', pickPct: 54, star: { playerId: 2, name: 'K. Kaprizov', team: 'MIN', goalie: false, photo: PHOTO }, starHeat: 87,
    };
    expect(renderToStaticMarkup(<ResultsSection date="2026-10-18" results={[r]} />)).toContain(PHOTO);
  });
});
