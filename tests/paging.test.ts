import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: {} }));
import { pageAll, aggregateOutcomes } from '@/lib/data';

describe('pageAll', () => {
  it('keeps fetching 1,000-row pages until a short page (PostgREST caps responses at 1,000)', async () => {
    const sizes = [1000, 1000, 437];
    const calls: [number, number][] = [];
    const rows = await pageAll(async (from, to) => {
      calls.push([from, to]);
      return { data: Array.from({ length: sizes.shift() ?? 0 }, (_, i) => from + i), error: null };
    });
    expect(rows).toHaveLength(2437);
    expect(calls).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
  });
  it('throws on a query error instead of returning partial data', async () => {
    await expect(pageAll(async () => ({ data: null, error: { message: 'boom' } }))).rejects.toBeTruthy();
  });
});

describe('aggregateOutcomes', () => {
  it('computes winner accuracy and average errors per version', () => {
    const r = aggregateOutcomes([
      { correct_winner: true, home_score_error: 1, away_score_error: 0, predictions: { model_version: 'v1.9' } },
      { correct_winner: false, home_score_error: 2, away_score_error: 2, predictions: { model_version: 'v1.9' } },
      { correct_winner: true, home_score_error: 0, away_score_error: 1, predictions: { model_version: 'v1.8' } },
    ]);
    expect(r.get('v1.9')).toEqual({ withOutcome: 2, correctWinner: 1, totalHomeErr: 3, totalAwayErr: 2 });
    expect(r.get('v1.8')?.correctWinner).toBe(1);
  });
});
