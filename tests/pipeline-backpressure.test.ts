import { afterEach, describe, expect, it, vi } from 'vitest';
import { etDate, paginate, teamsThatPlayed, waitForDb } from '../netlify/lib/pipeline';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('etDate', () => {
  it('gives the ET calendar date, which is the NHL game date', () => {
    // 08:00 UTC on 27 Nov = 03:00 ET: last night's games are on 26 Nov.
    const now = Date.parse('2026-11-27T08:00:00Z');
    expect(etDate(0, now)).toBe('2026-11-27');
    expect(etDate(1, now)).toBe('2026-11-26');
  });
});

describe('paginate backpressure', () => {
  it('stops before a page when the database is slow', async () => {
    let calls = 0;
    const res = await paginate(
      async () => { calls++; return { data: { playersProcessed: 100 } }; },
      { pageSize: 100, maxOffset: 1000, done: r => r.data.playersProcessed < 100, beforePage: async () => calls < 2 },
    );
    expect(calls).toBe(2);
    expect(res.stoppedAt).toBe(200);
  });

  it('runs to the end when the database keeps up', async () => {
    const res = await paginate(
      async o => ({ data: { playersProcessed: o < 200 ? 100 : 40 } }),
      { pageSize: 100, maxOffset: 1000, done: r => r.data.playersProcessed < 100, beforePage: async () => true },
    );
    expect(res.pages).toHaveLength(3);
    expect(res.stoppedAt).toBeNull();
  });
});

describe('waitForDb', () => {
  it('is true when the database answers', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'k');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { status: 200 })));
    expect(await waitForDb({ maxWaitMs: 0 })).toBe(true);
  });

  it('is false when it does not answer within the wait', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'k');
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('timeout'); }));
    expect(await waitForDb({ maxWaitMs: 0 })).toBe(false);
  });
});

describe('teamsThatPlayed', () => {
  it('lists both teams of every game on that date, and nothing on an empty day', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ gameWeek: [
      { date: '2026-11-26', games: [] },
      { date: '2026-11-27', games: [{ homeTeam: { id: 1 }, awayTeam: { id: 2 } }, { homeTeam: { id: 3 }, awayTeam: { id: 4 } }] },
    ] }), { status: 200 })));
    expect(await teamsThatPlayed('2026-11-26')).toEqual([]);
    expect((await teamsThatPlayed('2026-11-27'))?.sort()).toEqual([1, 2, 3, 4]);
  });

  it('is null when the schedule cannot be read', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('no', { status: 503 })));
    expect(await teamsThatPlayed('2026-11-26')).toBeNull();
  });
});
