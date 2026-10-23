import { beforeEach, describe, expect, it, vi } from 'vitest';

const results: { error: unknown }[] = [];
let calls = 0;
let saved = false;
vi.mock('@netlify/blobs', () => ({ getStore: () => ({ get: async () => (saved ? '2026-10-23' : null) }) }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({ select: () => ({ limit: () => ({ setHeader: () => ({ abortSignal: async () => { calls++; return results.shift() ?? { error: null }; } }) }) }) }),
  }),
}));

describe('assertDatabaseUp', () => {
  beforeEach(() => {
    vi.resetModules();
    calls = 0;
    saved = false;
    results.length = 0;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'k';
  });
  it('rides out a transient timeout (one slow probe must not fail a build)', async () => {
    results.push({ error: { message: 'TimeoutError' } });
    const { assertDatabaseUp } = await import('@/lib/supabase');
    await expect(assertDatabaseUp()).resolves.toBeUndefined();
    expect(calls).toBe(2);
  });
  it('still fails when the database is really down', async () => {
    for (let i = 0; i < 5; i++) results.push({ error: { message: 'TimeoutError' } });
    const { assertDatabaseUp } = await import('@/lib/supabase');
    await expect(assertDatabaseUp()).rejects.toThrow(/Database unavailable/);
    expect(calls).toBe(3);
  });
  it('lets the page render from saved answers when the database is down', async () => {
    for (let i = 0; i < 5; i++) results.push({ error: { message: 'TimeoutError' } });
    saved = true;
    const { assertDatabaseUp, databaseDown } = await import('@/lib/supabase');
    await expect(assertDatabaseUp()).resolves.toBeUndefined();
    expect(databaseDown()).toBe(true);
    // Within the down window: no more probes against a dead database.
    await assertDatabaseUp();
    expect(calls).toBe(3);
  });
});
