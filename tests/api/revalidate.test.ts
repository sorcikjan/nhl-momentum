import { beforeEach, describe, expect, it, vi } from 'vitest';

const paths: string[] = [];
const tags: string[] = [];
vi.mock('next/cache', () => ({
  revalidatePath: (p: string, type?: string) => { paths.push(type ? `${p} (${type})` : p); },
  revalidateTag: (t: string) => { tags.push(t); },
}));
const bump = vi.fn(async () => {});
vi.mock('@/lib/db-fallback', () => ({ bumpGeneration: () => bump() }));

const rows: Record<string, unknown[]> = {
  teams: [{ id: 6, name: 'Boston Bruins', abbrev: 'BOS' }, { id: 10, name: 'Toronto Maple Leafs', abbrev: 'TOR' }],
  players: [{ id: 8477956, first_name: 'David', last_name: 'Pastrňák' }],
  games: [{ id: 2026020150, game_date: '2026-11-03', home_team_id: 10, away_team_id: 6 }],
};
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (table: string) => {
      const q = { select: () => q, in: () => q, limit: () => q, then: (r: (v: unknown) => void) => r({ data: rows[table] }) };
      return q;
    },
  },
}));

const post = (body?: unknown) => new Request('https://x/api/revalidate', {
  method: 'POST', headers: { 'x-api-key': 'k' }, body: body === undefined ? undefined : JSON.stringify(body),
});

describe('/api/revalidate', () => {
  beforeEach(() => { paths.length = 0; tags.length = 0; bump.mockClear(); process.env.INGEST_API_KEY = 'k'; });

  it('no body: every page and the shared pipeline tag', async () => {
    const { POST } = await import('@/app/api/revalidate/route');
    await POST(post());
    expect(bump).toHaveBeenCalledOnce();
    expect(paths).toContain('/players/[id]/[slug] (page)');
    expect(paths).toContain('/games/[id]/[slug] (page)');
    expect(tags).toEqual(['pipeline']);
  });

  it('after a game: summary pages plus only that game, its teams and players', async () => {
    const { POST } = await import('@/app/api/revalidate/route');
    const res = await POST(post({ gameIds: [2026020150], teamIds: [6, 10] }));
    expect(bump).toHaveBeenCalledOnce();
    expect(paths).toEqual(expect.arrayContaining([
      '/', '/hot', '/cesi-v-nhl',
      '/teams/6/boston-bruins', '/players/8477956/david-pastrnak', '/games/2026020150/bos-at-tor-1103',
    ]));
    expect(paths).not.toContain('/players/[id]/[slug] (page)');
    expect(tags).toEqual(['game:2026020150']);
    expect((await res.json()).targeted).toBe(4);
  });
});
