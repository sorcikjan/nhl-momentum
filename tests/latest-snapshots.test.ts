import { describe, expect, it, vi } from 'vitest';

// Rows newest first; the fake caps every answer at 1,000 rows like PostgREST.
type Row = { id: string; player_id: number; energy_bar: number; calculated_at: string };
const rows: Row[] = [];
const now = Date.now();
for (let p = 1; p <= 700; p++) {
  for (let k = 0; k < 4; k++) rows.push({ id: `${p}-${k}`, player_id: p, energy_bar: 90, calculated_at: new Date(now - k * 6 * 3_600_000).toISOString() });
}
rows.push({ id: 'old', player_id: 701, energy_bar: 40, calculated_at: new Date(now - 30 * 86_400_000).toISOString() });
rows.sort((a, b) => b.calculated_at.localeCompare(a.calculated_at));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: () => {
      let ids: number[] = [];
      let since = '';
      let cap = 1000;
      const q = {
        select: () => q,
        in: (_: string, v: number[]) => { ids = v; return q; },
        eq: (_: string, v: number) => { ids = [v]; return q; },
        gte: (_: string, v: string) => { since = v; return q; },
        order: () => q,
        limit: (n: number) => { cap = Math.min(n, 1000); return q; },
        then: (r: (v: unknown) => void) => r({ data: rows.filter(x => ids.includes(x.player_id) && x.calculated_at >= since).slice(0, cap), error: null }),
      };
      return q;
    },
  },
}));

describe('latestSnapshots', () => {
  it('finds every player, past the 1,000-row cap and outside the window', async () => {
    const { latestSnapshots } = await import('@/lib/latest-snapshots');
    const ids = Array.from({ length: 702 }, (_, i) => i + 1);
    const latest = await latestSnapshots(ids);
    expect(latest.size).toBe(701);
    expect(latest.get(1)?.id).toBe('1-0');
    expect(latest.get(700)?.id).toBe('700-0');
    expect(latest.get(701)?.id).toBe('old');
    expect(latest.has(702)).toBe(false);
  });
});
