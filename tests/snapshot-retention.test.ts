import { describe, expect, it } from 'vitest';
import { doomedSnapshots, pruneWindow } from '@/lib/snapshot-retention';

describe('doomedSnapshots', () => {
  it('keeps only the latest snapshot per player per UTC day', () => {
    const rows = [
      { id: 1, player_id: 10, calculated_at: '2026-10-10T02:00:00+00:00' },
      { id: 2, player_id: 10, calculated_at: '2026-10-10T20:00:00+00:00' },
      { id: 3, player_id: 10, calculated_at: '2026-10-11T01:00:00+00:00' },
      { id: 4, player_id: 11, calculated_at: '2026-10-10T05:00:00+00:00' },
      { id: 5, player_id: 11, calculated_at: '2026-10-10T05:00:00+00:00' },
    ];
    expect(doomedSnapshots(rows).sort()).toEqual([1, 4]);
  });
  it('nothing to delete when each day has one snapshot', () => {
    expect(doomedSnapshots([{ id: 1, player_id: 1, calculated_at: '2026-10-10T02:00:00Z' }])).toEqual([]);
  });
});

describe('pruneWindow', () => {
  it('covers the days just before the 7-day window', () => {
    expect(pruneWindow(new Date('2026-10-23T08:00:00Z'), 3)).toEqual({
      from: '2026-10-13T08:00:00.000Z', to: '2026-10-16T08:00:00.000Z',
    });
  });
});
