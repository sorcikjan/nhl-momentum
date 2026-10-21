import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/data', () => ({
  fetchSearchIndex: vi.fn(async () => ({ players: [{ id: 1 }], teams: [] })),
}));

describe('/api/search-index', () => {
  it('serves the index from the CDN for an hour', async () => {
    const { GET } = await import('@/app/api/search-index/route');
    const res = await GET();
    expect(await res.json()).toEqual({ players: [{ id: 1 }], teams: [] });
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=3600');
  });
});
