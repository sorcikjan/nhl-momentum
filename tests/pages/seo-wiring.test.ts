import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const game = readFileSync('app/games/[id]/[slug]/page.tsx', 'utf8');
const player = readFileSync('app/players/[id]/[slug]/page.tsx', 'utf8');

describe('game page', () => {
  it('fetches the match once per render (metadata and page share a cached call)', () => {
    expect(game).toMatch(/cache\(\(id: string\) => fetchMatch\(id\)/);
    expect(game.match(/fetchMatch\(/g)).toHaveLength(1);
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
  });
});
