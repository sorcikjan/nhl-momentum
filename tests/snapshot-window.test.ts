import { describe, expect, it, vi } from 'vitest';

// Player 1's team played last night; player 2's team last played three days ago,
// so the metrics run (which only writes changed numbers) has no newer row for him.
const newest = '2026-11-11T08:00:00.000Z';
const rows = [
  { id: 'a', player_id: 1, calculated_at: newest },
  { id: 'b', player_id: 1, calculated_at: '2026-11-09T04:00:00.000Z' },
  { id: 'c', player_id: 2, calculated_at: '2026-11-08T04:00:00.000Z' },
  { id: 'd', player_id: 3, calculated_at: '2026-10-20T04:00:00.000Z' }, // long gone
];
const selects: string[] = [];

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: () => {
      let since = '';
      let one = false;
      let ids: string[] | null = null;
      const q = {
        select: (s: string) => { selects.push(s); return q; },
        order: () => q,
        limit: () => { one = true; return q; },
        gte: (_: string, v: string) => { since = v; return q; },
        in: (_: string, v: string[]) => { ids = v; return q; },
        range: () => q,
        then: (r: (v: unknown) => void) => r({
          data: one ? [{ calculated_at: newest }] : ids ? rows.filter(x => ids!.includes(x.id)) : rows.filter(x => x.calculated_at >= since),
          error: null,
        }),
      };
      return q;
    },
  },
}));

describe('latestSnapshotRows', () => {
  it("returns each player's newest row, including teams that haven't played for a few days", async () => {
    const { latestSnapshotRows } = await import('@/lib/data');
    const got = await latestSnapshotRows<{ id: string }>('id, player_id, calculated_at');
    expect(got.map(r => r.id)).toEqual(['a', 'c']);
  });
  it('reads the 8-day window narrow (ids only); full rows only for the newest per player', () => {
    expect(selects).toContain('id, player_id');
  });
});
