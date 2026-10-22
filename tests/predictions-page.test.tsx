import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PredictionsBody } from '@/components/predictions/PredictionsBody';
import type { GameCardData } from '@/lib/game-card';

const card: GameCardData = {
  id: 1, href: '/games/1/phi-at-buf-1022', state: 'FUT', startTimeUTC: '2026-10-22T23:30:00Z',
  away: { abbrev: 'PHI', name: 'Philadelphia', score: null, pct: 35, players: [{ playerId: 1, name: 'Matvei Michkov', href: '/p/1', photo: null, heat: 59, stat: null }] },
  home: { abbrev: 'BUF', name: 'Buffalo', score: null, pct: 65, players: [{ playerId: 2, name: 'Jack Quinn', href: '/p/2', photo: null, heat: 60, stat: null }] },
  pick: { abbrev: 'BUF', pct: 65 }, pickResult: null,
};

describe('PredictionsBody', () => {
  const out = renderToStaticMarkup(<PredictionsBody date="2026-10-22" today="2026-10-22" cards={[card]} accuracyPct={55} siteUrl="https://x" />);
  it('has the search title as the h1', () => {
    expect(out).toMatch(/<h1[^>]*>NHL Predictions Tonight — Thu, Oct 22, 2026<\/h1>/);
  });
  it('states the game count and our real season accuracy', () => {
    expect(out).toContain('1 game');
    expect(out).toContain('55%');
  });
  it('shows each game card with a factual sentence', () => {
    expect(out).toContain('data-card-player');
    expect(out).toContain('Buffalo are 65% favourites at home against Philadelphia; watch Jack Quinn (Heat 60).');
  });
  it('links to the previous and next day', () => {
    expect(out).toContain('href="/predictions/2026-10-21"');
    expect(out).toContain('href="/predictions/2026-10-23"');
  });
  it('carries an ItemList of the games for search engines', () => {
    expect(out).toContain('application/ld+json');
    expect(out).toContain('"@type":"ItemList"');
    expect(out).toContain('https://x/games/1/phi-at-buf-1022');
  });
  it('offers sharing the day', () => {
    expect(out).toContain('Share');
  });
  it('an empty day says so', () => {
    const e = renderToStaticMarkup(<PredictionsBody date="2026-07-01" today="2026-10-22" cards={[]} accuracyPct={null} siteUrl="https://x" />);
    expect(e).toContain('No NHL games');
  });
});
