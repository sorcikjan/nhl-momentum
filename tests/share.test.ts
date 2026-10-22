import { describe, expect, it } from 'vitest';
import { shareLinks, gameShareText, playerShareText, hotShareText, predictionsShareText } from '@/lib/share';
import type { GameCardData } from '@/lib/game-card';

const card: GameCardData = {
  id: 1, href: '/g', state: 'FUT', startTimeUTC: null,
  away: { abbrev: 'PHI', name: 'Philadelphia', score: null, pct: 35, players: [{ playerId: 1, name: 'Matvei Michkov', href: '/p', photo: null, heat: 59, stat: null }] },
  home: { abbrev: 'BUF', name: 'Buffalo', score: null, pct: 65, players: [{ playerId: 2, name: 'Jack Quinn', href: '/p', photo: null, heat: 60, stat: null }] },
  pick: { abbrev: 'BUF', pct: 65 }, pickResult: null,
};

describe('shareLinks', () => {
  it('builds X and Reddit intents with the text and absolute URL encoded', () => {
    const l = shareLinks('https://nhl-momentum.netlify.app/games/1/x', 'Our pick: BUF 65%');
    expect(l.x).toBe('https://x.com/intent/post?text=Our%20pick%3A%20BUF%2065%25&url=https%3A%2F%2Fnhl-momentum.netlify.app%2Fgames%2F1%2Fx');
    expect(l.reddit).toBe('https://www.reddit.com/submit?url=https%3A%2F%2Fnhl-momentum.netlify.app%2Fgames%2F1%2Fx&title=Our%20pick%3A%20BUF%2065%25');
  });
});

describe('share texts', () => {
  it('upcoming game: pick and the hottest player', () => {
    expect(gameShareText(card)).toBe('PHI @ BUF — our pick: BUF 65% · hottest tonight: Jack Quinn (Heat 60)');
  });
  it('final game: score and whether the pick held', () => {
    expect(gameShareText({ ...card, state: 'OFF', away: { ...card.away, score: 2 }, home: { ...card.home, score: 4 }, pickResult: 'hit' }))
      .toBe('BUF 4–2 PHI — our pick (BUF 65%) ✓');
  });
  it('player', () => {
    expect(playerShareText('Jack Quinn', 60)).toBe('Jack Quinn is at 60 Heat right now');
    expect(playerShareText('Stuart Skinner', null)).toBe('Stuart Skinner — form and stats');
  });
  it('Heat leaders', () => {
    expect(hotShareText([{ name: 'Connor McDavid', heat: 100 }, { name: 'Matthew Tkachuk', heat: 99 }])).toBe('Hottest in the NHL right now: McDavid 100, Tkachuk 99');
  });
  it('predictions day', () => {
    expect(predictionsShareText(11, 'Oct 22')).toBe('Our picks for all 11 NHL games on Oct 22');
  });
});
