import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchNhl, inMinors } from '@/lib/player-assignment';

const S = 20262027;
const nhl = { season: S, leagueAbbrev: 'NHL', gameTypeId: 2, gamesPlayed: 2 };
const ahl = { season: S, leagueAbbrev: 'AHL', gameTypeId: 2, gamesPlayed: 6 };

describe('inMinors', () => {
  it('off the NHL roster with AHL games → minors (Postava)', () => expect(inMinors(false, [nhl, ahl], S)).toBe(true));
  it('on the NHL roster → not minors even with AHL games (recalled)', () => expect(inMinors(true, [nhl, ahl], S)).toBe(false));
  it('off the roster with no minor-league games → not minors (injured / unsigned)', () => expect(inMinors(false, [nhl], S)).toBe(false));
  it("last season's AHL games do not count", () => expect(inMinors(false, [{ ...ahl, season: 20252026 }], S)).toBe(false));
  it('playoff rows do not count', () => expect(inMinors(false, [{ ...ahl, gameTypeId: 3 }], S)).toBe(false));
  it('a loan to a European league counts', () => expect(inMinors(false, [{ ...ahl, leagueAbbrev: 'Czechia' }], S)).toBe(true));
});

describe('fetchNhl', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('waits and retries a rate-limited call, so a team is not skipped on one 429', async () => {
    const replies = [new Response('', { status: 429 }), new Response(JSON.stringify({ goalies: [] }))];
    const fetch = vi.fn(() => Promise.resolve(replies.shift()!));
    vi.stubGlobal('fetch', fetch);
    await expect(fetchNhl('/roster/DET/20262027', 0)).resolves.toEqual({ goalies: [] });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('gives up after three tries and on other errors', async () => {
    const fetch = vi.fn(() => Promise.resolve(new Response('', { status: 429 })));
    vi.stubGlobal('fetch', fetch);
    await expect(fetchNhl('/x', 0)).resolves.toBeNull();
    expect(fetch).toHaveBeenCalledTimes(3);
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('', { status: 404 })));
    await expect(fetchNhl('/x', 0)).resolves.toBeNull();
  });
});
