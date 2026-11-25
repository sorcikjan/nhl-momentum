import { describe, expect, it } from 'vitest';
import { externalCache, liveTtl, LIVE_TTL } from '@/lib/cache-policy';

const NOW = Date.parse('2026-11-25T20:00:00Z');

describe('liveTtl', () => {
  it('a finished game has no live lifetime', () => {
    expect(liveTtl({ game_state: 'FINAL', start_time_utc: '2026-11-25T00:00:00Z' }, NOW)).toBeNull();
    expect(liveTtl({ game_state: 'OFF', start_time_utc: null }, NOW)).toBeNull();
    expect(liveTtl(null, NOW)).toBeNull();
  });

  it('before puck drop the page lives until puck drop', () => {
    expect(liveTtl({ game_state: 'FUT', start_time_utc: '2026-11-26T00:00:00Z' }, NOW)).toBe(4 * 3600);
  });

  it('a game days away waits at most a day', () => {
    expect(liveTtl({ game_state: 'FUT', start_time_utc: '2026-12-05T00:00:00Z' }, NOW)).toBe(86_400);
  });

  it('a game under way, about to start, or without a start time follows the score', () => {
    expect(liveTtl({ game_state: 'LIVE', start_time_utc: '2026-11-25T19:00:00Z' }, NOW)).toBe(LIVE_TTL);
    expect(liveTtl({ game_state: 'FUT', start_time_utc: '2026-11-25T20:01:00Z' }, NOW)).toBe(LIVE_TTL);
    expect(liveTtl({ game_state: 'FUT', start_time_utc: null }, NOW)).toBe(LIVE_TTL);
  });
});

describe('externalCache', () => {
  it('outside a page render (the pipeline) keeps exactly what the caller asked', () => {
    expect(externalCache(300)).toEqual({ revalidate: 300 });
    expect(externalCache(300, { live: true })).toEqual({ revalidate: 300 });
  });
});
