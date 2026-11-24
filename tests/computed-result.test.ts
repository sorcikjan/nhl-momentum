import { beforeEach, describe, expect, it, vi } from 'vitest';

const blobs = new Map<string, unknown>();
let reachable = true;
vi.mock('@netlify/blobs', () => ({
  getStore: () => ({
    get: async (k: string) => { if (!reachable) throw new Error('down'); return blobs.get(k) ?? null; },
    setJSON: async (k: string, v: unknown) => { if (!reachable) throw new Error('down'); blobs.set(k, v); },
  }),
}));
vi.mock('next/dist/server/app-render/work-async-storage.external', () => ({ workAsyncStorage: { getStore: () => undefined } }));
vi.mock('next/server', () => ({ after: () => { throw new Error('outside request'); } }));

const HOUR = 3_600_000;

describe('computedResult', () => {
  beforeEach(() => { vi.resetModules(); vi.useRealTimers(); blobs.clear(); reachable = true; });

  it('reads the saved result and never builds while it is fresh', async () => {
    const { saveComputed } = await import('@/lib/db-fallback');
    await saveComputed('r', { n: 1 });
    vi.resetModules(); // a new instance: nothing in memory
    const fresh = await import('@/lib/db-fallback');
    const build = vi.fn(async () => ({ n: 2 }));
    expect(await fresh.computedResult('r', HOUR, build)).toEqual({ n: 1 });
    expect(build).not.toHaveBeenCalled();
  });

  it('builds once when nothing is saved, saves it, and shares one build', async () => {
    const { computedResult } = await import('@/lib/db-fallback');
    const build = vi.fn(async () => ({ n: 3 }));
    const [a, b] = await Promise.all([computedResult('r', HOUR, build), computedResult('r', HOUR, build)]);
    expect(a).toEqual({ n: 3 }); expect(b).toEqual({ n: 3 });
    expect(build).toHaveBeenCalledTimes(1);
    expect((blobs.get('computed/r') as { value: unknown }).value).toEqual({ n: 3 });
  });

  it('rebuilds when the saved result is older than maxAge (writer failed)', async () => {
    blobs.set('computed/r', { at: Date.now() - 4 * HOUR, value: { n: 'old' } });
    const { computedResult } = await import('@/lib/db-fallback');
    expect(await computedResult('r', 3 * HOUR, async () => ({ n: 'new' }))).toEqual({ n: 'new' });
  });

  it('serves the old result when a rebuild fails', async () => {
    blobs.set('computed/r', { at: Date.now() - 4 * HOUR, value: { n: 'old' } });
    const { computedResult } = await import('@/lib/db-fallback');
    expect(await computedResult('r', 3 * HOUR, async () => { throw new Error('db'); })).toEqual({ n: 'old' });
  });

  it('keeps serving what it has when the store is unreachable, without building', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const { computedResult, saveComputed } = await import('@/lib/db-fallback');
    await saveComputed('r', { n: 5 });
    reachable = false;
    vi.setSystemTime(Date.now() + 10 * 60_000);
    const build = vi.fn(async () => ({ n: 6 }));
    expect(await computedResult('r', HOUR, build)).toEqual({ n: 5 });
    expect(build).not.toHaveBeenCalled();
  });
});
