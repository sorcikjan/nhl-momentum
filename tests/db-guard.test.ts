import { beforeEach, describe, expect, it, vi } from 'vitest';

const results: { error: unknown }[] = [];
let calls = 0;
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({ select: () => ({ limit: () => ({ abortSignal: async () => { calls++; return results.shift() ?? { error: null }; } }) }) }),
  }),
}));

describe('assertDatabaseUp', () => {
  beforeEach(() => {
    vi.resetModules();
    calls = 0;
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
});
