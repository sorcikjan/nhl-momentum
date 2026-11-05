import { supabaseAdmin } from './supabase';

// Each player's latest player_metric_snapshots row, for the energy updates.
//
// One newest-first query for every player ran into PostgREST's 1,000-row cap:
// players with several recent rows filled it, the rest looked snapshot-less and
// got an energy-only row inserted — 800–1,200 a day by Nov 2026. That blank row
// became their latest, so an injured or scratched player's page read "no games
// yet this season".
//
// Every active player gets a full snapshot daily, so a 3-day window in chunks of
// 100 (a few rows each) stays far under the cap. Anyone not found there is
// looked up on their own.
const WINDOW_MS = 3 * 86_400_000;
const CHUNK = 100;

export type LatestSnapshot = { id: string; energy_bar: number | null };

export async function latestSnapshots(playerIds: number[]): Promise<Map<number, LatestSnapshot>> {
  const latest = new Map<number, LatestSnapshot>();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  for (let i = 0; i < playerIds.length; i += CHUNK) {
    const { data, error } = await supabaseAdmin
      .from('player_metric_snapshots')
      .select('id, player_id, energy_bar')
      .in('player_id', playerIds.slice(i, i + CHUNK))
      .gte('calculated_at', since)
      .order('calculated_at', { ascending: false })
      .limit(1000);
    if (error) throw error;
    for (const s of data ?? []) {
      if (!latest.has(s.player_id)) latest.set(s.player_id, { id: s.id, energy_bar: s.energy_bar });
    }
  }
  const missing = playerIds.filter(id => !latest.has(id));
  for (let i = 0; i < missing.length; i += 10) {
    await Promise.all(missing.slice(i, i + 10).map(async pid => {
      const { data, error } = await supabaseAdmin
        .from('player_metric_snapshots')
        .select('id, energy_bar')
        .eq('player_id', pid)
        .order('calculated_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      if (data?.[0]) latest.set(pid, { id: data[0].id, energy_bar: data[0].energy_bar });
    }));
  }
  return latest;
}
