import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GameGrid, splitResults, splitTonight } from '@/components/home/GameGrid';
import { ArticleGrid } from '@/components/home/ArticleGrid';
import type { GameCardData } from '@/lib/game-card';
import type { GameStoryCard, NightStory } from '@/lib/stories';

const card = (id: number, a: number | null, h: number | null, extra: Partial<GameCardData> = {}): GameCardData => ({
  id, href: `/games/${id}/x`, state: a == null ? 'FUT' : 'OFF', startTimeUTC: null,
  away: { abbrev: 'AAA', name: 'Away', score: a, pct: null, players: [] }, home: { abbrev: 'HHH', name: 'Home', score: h, pct: null, players: [] },
  pick: null, pickResult: null, ...extra,
});

describe('GameGrid', () => {
  it('results: the most interesting three in view, the rest behind a click', () => {
    const games = [card(1, 1, 4), card(2, 3, 4), card(3, 2, 1, { pickResult: 'miss' }), card(4, 0, 2), card(5, 5, 4)];
    const { top, rest } = splitResults(games);
    expect(top.map(g => g.id)).toEqual([3, 5, 2]);
    expect(rest.map(g => g.id)).toEqual([1, 4]);
    const html = renderToStaticMarkup(<GameGrid top={top} rest={rest} />);
    expect(html).toContain('<details');
    expect(html.replace(/<!-- -->/g, '')).toContain('Show all 5 games');
  });
  it('tonight: game of the night and the most watchable first, the rest in schedule order', () => {
    const games = [card(1, null, null, { watchability: 50 }), card(2, null, null, { watchability: 90 }), card(3, null, null, { watchability: 70, marquee: true }), card(4, null, null, { watchability: 80 }), card(5, null, null, { watchability: 10 })];
    const { top, rest } = splitTonight(games);
    expect(top.map(g => g.id)).toEqual([3, 2, 4]);
    expect(rest.map(g => g.id)).toEqual([1, 5]);
  });
  it('no expander when everything fits', () => {
    expect(renderToStaticMarkup(<GameGrid top={[card(1, 1, 2)]} rest={[]} />)).not.toContain('<details');
  });
});

describe('ArticleGrid layout', () => {
  const night: NightStory = { href: '/recaps/x', kicker: 'THE NIGHT', title: 'T', dek: 'd', image: null, watchLabel: null,
    scores: Array.from({ length: 12 }, (_, i) => ({ away: 'AAA', awayScore: 1, home: 'HHH', homeScore: i, href: `/games/${i}/x` })) };
  const story = (id: number): GameStoryCard => ({ id, href: `/games/${id}/x`, image: null, score: 'A 1 – 2 H', watchLabel: 'w', kicker: 'GAME STORY', title: `S${id}`, dek: 'd', hasStory: true, goals: 3, star: null });
  it('one game card shares the night\'s row instead of sitting alone under it', () => {
    expect(renderToStaticMarkup(<ArticleGrid night={night} games={[story(1)]} />)).toContain('lg:col-span-2');
  });
  it('a big night shows six scores and a link for the rest', () => {
    const html = renderToStaticMarkup(<ArticleGrid night={night} games={[story(1), story(2), story(3)]} />);
    expect(html.match(/href="\/games\/\d+\/x"/g)!.length).toBe(6 + 3 * 2); // six score chips + two links per story card
    expect(html.replace(/<!-- -->/g, '')).toContain('+6 more');
  });
});
