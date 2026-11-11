import { describe, expect, it, vi } from 'vitest';

// Player 1's team played last night; player 2's team last played three days ago,
// so the metrics run (which only writes changed numbers) has no newer row for him.
const newest = '2026-11-11T08:00:00.000Z';
const rows = [
  { player_id: 1, calculated_at: newest },
  { player_id: 2, calculated_at: '2026-11-08T04:00:00.000Z' },
  { player_id: 3, calculated_at: '2026-10-20T04:00:00.000Z' }, // long gone
];

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: () => {
      let since = '';
      let one = false;
      const q = {
        select: () => q,
        order: () => q,
        limit: () => { one = true; return q; },
        gte: (_: string, v: string) => { since = v; return q; },
        range: () => q,
        then: (r: (v: unknown) => void) => r({
          data: one ? [{ calculated_at: newest }] : rows.filter(x => x.calculated_at >= since),
          error: null,
        }),
      };
      return q;
    },
  },
}));

describe('latestSnapshotRows', () => {
  it("keeps players whose team hasn't played for a few days", async () => {
    const { latestSnapshotRows } = await import('@/lib/data');
    const got = await latestSnapshotRows<{ player_id: number }>('player_id, calculated_at');
    expect(got.map(r => r.player_id)).toEqual([1, 2]);
  });
});
