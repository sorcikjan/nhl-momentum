import { beforeEach, describe, expect, it, vi } from 'vitest';

const blobs = new Map<string, unknown>();
vi.mock('@netlify/blobs', () => ({
  getStore: () => ({
    get: async (k: string) => blobs.get(k) ?? null,
    set: async (k: string, v: unknown) => { blobs.set(k, v); },
    setJSON: async (k: string, v: unknown) => { blobs.set(k, v); },
    delete: async (k: string) => { blobs.delete(k); },
  }),
}));
let route: string | undefined = '/players/[id]/[slug]';
vi.mock('next/dist/server/app-render/work-async-storage.external', () => ({
  workAsyncStorage: { getStore: () => (route ? { route } : undefined) },
}));
vi.mock('next/server', () => ({ after: () => { throw new Error('outside request'); } }));

const URL_ = 'https://x.supabase.co/rest/v1/players?select=id&limit=1';
const ok = (body: string) => new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
const flush = () => new Promise(r => setTimeout(r, 0));

describe('fetchWithFallback', () => {
  beforeEach(() => { vi.resetModules(); blobs.clear(); route = '/players/[id]/[slug]'; });

  it('saves a good answer and serves it when the database fails', async () => {
    const { fetchWithFallback, databaseDown } = await import('@/lib/db-fallback');
    await fetchWithFallback(URL_, {}, async () => ok('[{"id":1}]'));
    await flush();
    const res = await fetchWithFallback(URL_, {}, async () => { throw new Error('timeout'); });
    expect(await res.json()).toEqual([{ id: 1 }]);
    expect(res.headers.get('x-db-fallback')).toBe('1');
    expect(databaseDown()).toBe(true);
  });

  it('skips the database while it is down (no wait per query)', async () => {
    const { fetchWithFallback, markDatabaseDown } = await import('@/lib/db-fallback');
    markDatabaseDown();
    const doFetch = vi.fn(async () => ok('[]'));
    const res = await fetchWithFallback(URL_, {}, doFetch);
    expect(doFetch).not.toHaveBeenCalled();
    expect(res.status).toBe(503);
  });

  it('serves the saved answer on a 5xx from the gateway', async () => {
    const { fetchWithFallback } = await import('@/lib/db-fallback');
    await fetchWithFallback(URL_, {}, async () => ok('[{"id":2}]'));
    await flush();
    const res = await fetchWithFallback(URL_, {}, async () => new Response('', { status: 503 }));
    expect(await res.json()).toEqual([{ id: 2 }]);
  });

  it('never answers pipeline routes or writes from saved data', async () => {
    const { fetchWithFallback } = await import('@/lib/db-fallback');
    await fetchWithFallback(URL_, {}, async () => ok('[{"id":3}]'));
    await flush();
    const fail = async () => { throw new Error('timeout'); };
    route = '/api/ingest/metrics';
    await expect(fetchWithFallback(URL_, {}, fail)).rejects.toThrow('timeout');
    route = undefined; // background functions: outside Next.js
    await expect(fetchWithFallback(URL_, {}, fail)).rejects.toThrow('timeout');
    route = '/players/[id]/[slug]';
    await expect(fetchWithFallback(URL_, { method: 'POST' }, fail)).rejects.toThrow('timeout');
  });

  it('keys queries by shape: exact timestamps collapse, dates do not', async () => {
    const { fallbackKey } = await import('@/lib/db-fallback');
    const at = (t: string) => fallbackKey(`https://x.supabase.co/rest/v1/soft_signals?fetched_at=gte.${t}`);
    expect(at('2026-10-23T10:01:56.123Z')).toBe(at('2026-10-23T11:42:07.900Z'));
    expect(fallbackKey('https://x.supabase.co/rest/v1/games?game_date=eq.2026-10-22'))
      .not.toBe(fallbackKey('https://x.supabase.co/rest/v1/games?game_date=eq.2026-10-23'));
    expect(at('2026-10-23T10:01:56Z').startsWith('soft_signals/')).toBe(true);
  });
});

describe('fallback store safety', () => {
  beforeEach(() => { vi.resetModules(); blobs.clear(); route = '/players/[id]/[slug]'; });

  it('a single failing statement (HTTP 500) does not switch off the database', async () => {
    const { fetchWithFallback, databaseDown } = await import('@/lib/db-fallback');
    const res = await fetchWithFallback(URL_, {}, async () => new Response('{}', { status: 500 }));
    expect(res.status).toBe(500);
    expect(databaseDown()).toBe(false);
  });
});

describe('healing pages cached while the database was down', () => {
  beforeEach(() => { vi.resetModules(); blobs.clear(); route = '/players/[id]/[slug]'; process.env.INGEST_API_KEY = 'k'; });

  it('a fallback render leaves a mark; recovery revalidates once the mark is a minute old', async () => {
    const { fetchWithFallback, healDegradedPages, markDatabaseDown } = await import('@/lib/db-fallback');
    markDatabaseDown();
    await fetchWithFallback(URL_, {}, async () => ok('[]'));
    await flush();
    expect(blobs.has('meta/degraded')).toBe(true);

    blobs.set('meta/degraded', new Date(Date.now() - 120_000).toISOString());
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (u: string) => { calls.push(u); return new Response('{}'); });
    healDegradedPages();
    await new Promise(r => setTimeout(r, 10));
    expect(calls).toEqual([expect.stringMatching(/\/api\/revalidate$/)]);
    expect(blobs.has('meta/degraded')).toBe(false);
    vi.unstubAllGlobals();
  });
});
