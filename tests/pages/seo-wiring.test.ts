import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const game = readFileSync('app/games/[id]/[slug]/page.tsx', 'utf8');
const player = readFileSync('app/players/[id]/[slug]/page.tsx', 'utf8');

describe('game page', () => {
  it('fetches the match once per render (metadata and page share a cached call)', () => {
    expect(game).toMatch(/const cachedFetchMatch = cache\(/);
    expect(game.match(/cachedFetchMatch\(id\)/g)).toHaveLength(2);
  });
  it('a finished game reads the database from the pipeline-tagged cache', () => {
    expect(game).toMatch(/tags: \['pipeline'\]/);
    expect(readFileSync('app/api/revalidate/route.ts', 'utf8')).toContain("revalidateTag('pipeline'");
  });
  it('uses the search title and SportsEvent structured data', () => {
    expect(game).toContain('gameTitle(');
    expect(game).toContain('sportsEventLd(');
  });
});

describe('player page', () => {
  it('uses the search title and Person structured data', () => {
    expect(player).toContain('playerTitle(');
    expect(player).toContain('personLd(');
    expect(player).toContain('<ShareButton');
    expect(player).toContain('playerShareText(');
  });
});
