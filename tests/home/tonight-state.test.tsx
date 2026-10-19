import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TonightSlate } from '@/components/home/TonightSlate';
import type { SlateGame } from '@/lib/home';

const g = (state: string, awayScore: number | null, homeScore: number | null): SlateGame => ({
  id: 1, href: '/games/1/x', startTimeUTC: '2026-10-19T23:00:00Z', state, awayScore, homeScore,
  away: { abbrev: 'EDM', name: 'Oilers' }, home: { abbrev: 'COL', name: 'Avalanche' },
  pickSide: 'home', pickPct: 60, watch: null,
} as SlateGame);

describe('TonightSlate game state', () => {
  it('shows LIVE with the score for a game in progress', () => {
    const out = renderToStaticMarkup(<TonightSlate games={[g('LIVE', 2, 1)]} nextGameDate={null} />);
    expect(out).toContain('LIVE');
    expect(out).toMatch(/2\s*–\s*1/);
    expect(out).not.toContain('PM ET');
  });
  it('shows FINAL with the score for a finished game', () => {
    const out = renderToStaticMarkup(<TonightSlate games={[g('OFF', 3, 4)]} nextGameDate={null} />);
    expect(out).toContain('FINAL');
    expect(out).toMatch(/3\s*–\s*4/);
  });
  it('shows the start time for an upcoming game', () => {
    expect(renderToStaticMarkup(<TonightSlate games={[g('FUT', null, null)]} nextGameDate={null} />)).toContain('ET');
  });
});
