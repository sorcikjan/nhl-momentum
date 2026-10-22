import { describe, expect, it } from 'vitest';
import { gameTitle, playerTitle, predictionsTitle, predictionSentence, sportsEventLd, personLd, itemListLd, parsePredictionDate } from '@/lib/seo';
import type { GameCardData } from '@/lib/game-card';

describe('titles people actually search', () => {
  it('upcoming game: prediction + key players + date', () => {
    expect(gameTitle({ awayName: 'Philadelphia Flyers', homeName: 'Buffalo Sabres', date: '2026-10-22', state: 'FUT', awayScore: null, homeScore: null }))
      .toBe('Philadelphia Flyers vs Buffalo Sabres Prediction & Key Players — Oct 22, 2026');
  });
  it('final game: recap with the score', () => {
    expect(gameTitle({ awayName: 'Philadelphia Flyers', homeName: 'Buffalo Sabres', date: '2026-10-21', state: 'OFF', awayScore: 2, homeScore: 4 }))
      .toBe('Philadelphia Flyers vs Buffalo Sabres Recap: 2–4 — Oct 21, 2026');
  });
  it('player: stats, Heat and form for the season', () => {
    expect(playerTitle('Jack Quinn', '2026–27')).toBe('Jack Quinn Stats, Heat & Form 2026–27');
  });
  it('predictions page says "Tonight" only for today', () => {
    expect(predictionsTitle('2026-10-22', '2026-10-22')).toBe('NHL Predictions Tonight — Thu, Oct 22, 2026');
    expect(predictionsTitle('2026-10-21', '2026-10-22')).toBe('NHL Predictions — Wed, Oct 21, 2026');
  });
});

const card = (over: Partial<GameCardData> = {}): GameCardData => ({
  id: 1, href: '/g', state: 'FUT', startTimeUTC: '2026-10-22T23:30:00Z',
  away: { abbrev: 'PHI', name: 'Philadelphia', score: null, pct: 35, players: [{ playerId: 1, name: 'Matvei Michkov', href: '/p', photo: null, heat: 59, stat: null }] },
  home: { abbrev: 'BUF', name: 'Buffalo', score: null, pct: 65, players: [{ playerId: 2, name: 'Jack Quinn', href: '/p', photo: null, heat: 60, stat: null }] },
  pick: { abbrev: 'BUF', pct: 65 }, pickResult: null, ...over,
});

describe('predictionSentence (factual text for search engines)', () => {
  it('home favourite, hottest player in the game', () => {
    expect(predictionSentence(card())).toBe('Buffalo are 65% favourites at home against Philadelphia; watch Jack Quinn (Heat 60).');
  });
  it('road favourite', () => {
    expect(predictionSentence(card({ pick: { abbrev: 'PHI', pct: 58 } }))).toBe('Philadelphia are 58% favourites on the road at Buffalo; watch Jack Quinn (Heat 60).');
  });
  it('final: result and whether the pick held', () => {
    expect(predictionSentence(card({ state: 'OFF', away: { ...card().away, score: 2 }, home: { ...card().home, score: 4 }, pickResult: 'hit' })))
      .toBe('Buffalo beat Philadelphia 4–2 — our pick (Buffalo, 65%) was right.');
  });
  it('no prediction yet', () => {
    expect(predictionSentence(card({ pick: null }))).toBe('Philadelphia at Buffalo — prediction coming before puck drop; watch Jack Quinn (Heat 60).');
  });
});

describe('structured data', () => {
  it('SportsEvent for a game', () => {
    const ld = sportsEventLd({ name: 'Philadelphia Flyers vs Buffalo Sabres', url: 'https://x/g', startDate: '2026-10-22T23:30:00Z', venue: 'KeyBank Center', home: 'Buffalo Sabres', away: 'Philadelphia Flyers', state: 'FUT' });
    expect(ld).toMatchObject({ '@context': 'https://schema.org', '@type': 'SportsEvent', sport: 'Ice Hockey', eventStatus: 'https://schema.org/EventScheduled',
      homeTeam: { '@type': 'SportsTeam', name: 'Buffalo Sabres' }, location: { '@type': 'Place', name: 'KeyBank Center' } });
  });
  it('Person for a player', () => {
    expect(personLd({ name: 'Jack Quinn', url: 'https://x/p', image: 'q.png', team: 'Buffalo Sabres' }))
      .toMatchObject({ '@type': 'Person', name: 'Jack Quinn', affiliation: { '@type': 'SportsTeam', name: 'Buffalo Sabres' } });
  });
  it('ItemList for the predictions page', () => {
    expect(itemListLd([{ name: 'A vs B', url: 'https://x/1' }]).itemListElement).toEqual([{ '@type': 'ListItem', position: 1, name: 'A vs B', url: 'https://x/1' }]);
  });
});

describe('parsePredictionDate', () => {
  it('accepts a real date within a season window, rejects junk', () => {
    expect(parsePredictionDate('2026-10-22')).toBe('2026-10-22');
    expect(parsePredictionDate('2026-13-40')).toBeNull();
    expect(parsePredictionDate('yesterday')).toBeNull();
    expect(parsePredictionDate('1999-10-22')).toBeNull();
  });
});

import { predictionSitemapDates } from '@/lib/seo';
describe('predictionSitemapDates', () => {
  it('lists the last 7 and next 7 days around today', () => {
    const d = predictionSitemapDates('2026-10-22');
    expect(d).toHaveLength(15);
    expect(d[0]).toBe('2026-10-15');
    expect(d[7]).toBe('2026-10-22');
    expect(d[14]).toBe('2026-10-29');
  });
});
