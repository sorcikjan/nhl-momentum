import { describe, expect, it } from 'vitest';
import { gameStoryCard, nightStories, type FinishedGame } from '@/lib/stories';

const g = (id: number, away: string, as: number, home: string, hs: number, yt: string | null, stars: FinishedGame['three_stars'] = []): FinishedGame => ({
  id, game_date: '2026-10-20', away_score: as, home_score: hs, youtube_highlight_id: yt, three_stars: stars,
  away_team: { abbrev: away }, home_team: { abbrev: home },
});
const games = [
  g(1, 'SJS', 4, 'MTL', 3, 'BYC_zpYERJQ', [{ star: 1, name: { default: 'M. Celebrini' }, teamAbbrev: 'SJS', position: 'C', goals: 2, assists: 1 }]),
  g(2, 'BOS', 2, 'DAL', 3, 'ausc6FCt_K8', [{ star: 2, name: { default: 'J. Oettinger' }, teamAbbrev: 'DAL', position: 'G' }, { star: 1, name: { default: 'M. Rantanen' }, teamAbbrev: 'DAL', position: 'R', goals: 3, assists: 0 }]),
  g(3, 'WPG', 1, 'STL', 2, null),
  g(4, 'CAR', 6, 'VAN', 3, 'phBU8TCq_QE'),
  g(5, 'ANA', 2, 'NYI', 3, 'BQ__TjNyGlc'),
];
const recap = { date: '2026-10-20', title: 'Celebrini drives a Sharks comeback', summary: 's', hero_image_url: 'https://img.youtube.com/vi/BYC_zpYERJQ/maxresdefault.jpg' };

describe('nightStories', () => {
  it('leads with the recap, every score of the night, and leaves its featured game out of the cards', () => {
    const { night, games: cards } = nightStories(recap, games, new Map(), new Set());
    expect(night?.scores).toHaveLength(5);
    expect(night?.watchLabel).toBe('Highlights · SJS 4–3 MTL');
    expect(cards.map(c => c.id)).not.toContain(1);
    expect(cards).toHaveLength(3);
  });
  it('prefers games with a written story, then the striking ones (a hat trick)', () => {
    const { games: cards } = nightStories(recap, games, new Map([[3, { headline: 'Blues edge Jets', dek: 'd' }]]), new Set());
    expect(cards[0].id).toBe(3);
    expect(cards[1].id).toBe(2);
    expect(cards[1].kicker).toBe('GAME STORY · HAT TRICK');
  });
  it('shows nothing without a recap', () => {
    expect(nightStories(null, games, new Map(), new Set())).toEqual({ night: null, games: [] });
  });
});

describe('gameStoryCard', () => {
  it('uses the story when there is one, a box-score line until then', () => {
    const withStory = gameStoryCard(games[1], { headline: 'Rantanen scores all three', dek: 'Dallas won 3–2.' }, false);
    expect(withStory.title).toBe('Rantanen scores all three');
    const plain = gameStoryCard(games[1], undefined, false);
    expect(plain.title).toBe('Dallas beats Boston 3–2');
    expect(plain.dek).toBe('M. Rantanen led the way with 3G.');
    expect(plain.star?.name).toBe('M. Rantanen'); // first star, not the first listed
    expect(plain.image).toBe('https://i.ytimg.com/vi/ausc6FCt_K8/mqdefault.jpg');
  });
  it('tags an upset when our pick missed', () => {
    expect(gameStoryCard(games[4], undefined, true).kicker).toBe('GAME STORY · UPSET');
  });
});
