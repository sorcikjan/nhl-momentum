import { describe, expect, it, vi } from 'vitest';

vi.mock('@netlify/blobs', () => ({ getStore: () => { throw new Error('not on Netlify'); } }));
vi.mock('next/dist/server/app-render/work-async-storage.external', () => ({ workAsyncStorage: { getStore: () => undefined } }));
vi.mock('next/server', () => ({ after: () => {} }));

import { parseMetrics, snapshotDelta, type Snapshot } from '@/lib/load-log';

describe('load log', () => {
  it('reads the metrics it keeps and sums them over devices', () => {
    const m = parseMetrics([
      '# HELP node_disk_read_bytes_total x',
      'node_disk_read_bytes_total{device="a"} 100',
      'node_disk_read_bytes_total{device="b"} 50',
      'node_memory_MemAvailable_bytes{service_type="db"} 2.1622784e+08',
      'go_gc_duration_seconds 3',
    ].join('\n'));
    expect(m).toEqual({ node_disk_read_bytes_total: 150, node_memory_MemAvailable_bytes: 216227840 });
  });

  it('turns two snapshots into what the hour added', () => {
    const MB = 1024 * 1024;
    const prev: Snapshot = { at: 0, errors: [], metrics: { node_disk_read_bytes_total: 10 * MB, node_vmstat_pswpin: 0 },
      queries: [{ query: 'q1', calls: 10, total_ms: 5000, disk_blocks_read: 0, cache_blocks_hit: 0 }] };
    const cur: Snapshot = { at: 1, errors: [], metrics: { node_disk_read_bytes_total: 110 * MB, node_vmstat_pswpin: 512 },
      queries: [{ query: 'q1', calls: 30, total_ms: 9000, disk_blocks_read: 0, cache_blocks_hit: 0 },
                { query: 'q2', calls: 3, total_ms: 1000, disk_blocks_read: 0, cache_blocks_hit: 0 }] };
    const d = snapshotDelta(prev, cur);
    expect(d.db.diskReadMB).toBe(100);
    expect(d.db.swapInMB).toBe(2);
    expect(d.queries).toEqual([
      { query: 'q1', calls: 20, totalSec: 4, sinceReset: false },
      { query: 'q2', calls: 3, totalSec: 1, sinceReset: true },
    ]);
  });
});
