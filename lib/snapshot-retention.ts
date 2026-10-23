// Snapshot retention: every snapshot from the last KEEP_DAYS days; before that,
// only each player's latest snapshot per UTC day (the profile's Heat chart is daily).

export const KEEP_DAYS = 7;

export type SnapshotKey = { id: number; player_id: number; calculated_at: string };

// Ids to delete: all but the latest snapshot per player per UTC day.
export function doomedSnapshots(rows: SnapshotKey[]): number[] {
  const keep = new Map<string, SnapshotKey>();
  for (const r of rows) {
    const k = `${r.player_id}|${new Date(r.calculated_at).toISOString().slice(0, 10)}`;
    const cur = keep.get(k);
    const newer = !cur || Date.parse(r.calculated_at) > Date.parse(cur.calculated_at)
      || (r.calculated_at === cur.calculated_at && r.id > cur.id);
    if (newer) keep.set(k, r);
  }
  const kept = new Set([...keep.values()].map(r => r.id));
  return rows.filter(r => !kept.has(r.id)).map(r => r.id);
}

// The days a run looks at: the `scanDays` that most recently left the window.
export function pruneWindow(now: Date, scanDays: number): { from: string; to: string } {
  const to = now.getTime() - KEEP_DAYS * 86_400_000;
  return { from: new Date(to - scanDays * 86_400_000).toISOString(), to: new Date(to).toISOString() };
}
