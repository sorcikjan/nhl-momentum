import { afterEach, describe, expect, it, vi } from 'vitest';
import { statsRows } from '@/lib/nhl-stats-api';

// A fake stats API: `total` rows, at most 100 per answer, like the real one.
function fakeApi(total: number, failStart?: number) {
  const urls: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    urls.push(url);
    const q = new URL(url).searchParams;
    const start = Number(q.get('start'));
    if (start === failStart) return new Response('err', { status: 500 });
    const n = Math.max(0, Math.min(100, total - start));
    const data = Array.from({ length: n }, (_, i) => ({ playerId: start + i }));
    return Response.json({ data, total });
  }));
  return urls;
}

afterEach(() => vi.unstubAllGlobals());

describe('statsRows', () => {
  it('reads every page of a report larger than 100 rows', async () => {
    const urls = fakeApi(784);
    const rows = await statsRows<{ playerId: number }>('https://x/skater/summary?limit=-1&cayenneExp=a', { revalidate: 60 });
    expect(rows).toHaveLength(784);
    expect(new Set(rows.map(r => r.playerId)).size).toBe(784);
    expect(urls).toHaveLength(8);
    // the old limit is dropped; pages are sorted so they don't overlap
    expect(urls.every(u => !u.includes('limit=-1') && u.includes('sort=playerId') && u.includes('limit=100'))).toBe(true);
  });

  it('makes one request when everything fits on a page', async () => {
    const urls = fakeApi(77);
    expect(await statsRows('https://x/goalie/summary?cayenneExp=a', { revalidate: 60 })).toHaveLength(77);
    expect(urls).toHaveLength(1);
  });

  it('keeps a sort the caller already chose', async () => {
    const urls = fakeApi(150);
    await statsRows('https://x/skater/summary?sort=playerId&cayenneExp=a', { revalidate: 60 });
    expect(urls.every(u => u.match(/sort=/g)!.length === 1)).toBe(true);
  });

  it('returns no table when any page fails, never a partial one', async () => {
    fakeApi(784, 300);
    expect(await statsRows('https://x/skater/summary?cayenneExp=a', { revalidate: 60 })).toEqual([]);
  });
});
