import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const SUPA_URL = 'https://ougiedvgkxhdgwopkftt.supabase.co';
const SUPA_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

const sinceDate = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
console.log('Querying since:', sinceDate);

const { data: players, error: pErr } = await supabase
  .from('players')
  .select('id, first_name, last_name, position_code, team_id, teams(id, abbrev)')
  .eq('is_active', true)
  .neq('position_code', 'G')
  .not('team_id', 'is', null);

if (pErr) { console.error('players error:', pErr); process.exit(1); }
console.log('Active skaters:', players.length);

const playerIds = players.map(p => p.id);

const { data: recentGames } = await supabase
  .from('games')
  .select('id, game_date, home_team_id, away_team_id')
  .in('game_state', ['FINAL', 'OFF'])
  .gte('game_date', sinceDate)
  .order('id', { ascending: false })
  .limit(1000);

console.log('Recent completed games:', recentGames.length);

const teamGameIds = new Map();
const gameIdToDate = new Map();
for (const g of recentGames) {
  gameIdToDate.set(g.id, g.game_date);
  for (const tid of [g.home_team_id, g.away_team_id]) {
    if (!teamGameIds.has(tid)) teamGameIds.set(tid, []);
    teamGameIds.get(tid).push(g.id);
  }
}

const lastGameIdByPlayer = new Map();
const CHUNK = 100;
for (let i = 0; i < playerIds.length; i += CHUNK) {
  const chunk = playerIds.slice(i, i + CHUNK);
  const { data: stats } = await supabase
    .from('game_player_stats')
    .select('player_id, game_id')
    .in('player_id', chunk)
    .order('game_id', { ascending: false })
    .limit(chunk.length * 5);
  for (const row of stats ?? []) {
    if (!lastGameIdByPlayer.has(row.player_id)) lastGameIdByPlayer.set(row.player_id, row.game_id);
  }
  process.stdout.write('\rChunk ' + (Math.floor(i/CHUNK)+1) + '/' + Math.ceil(playerIds.length/CHUNK) + '...');
}
console.log('\nStats fetched.');

const scratched = [];
for (const p of players) {
  const teamGids = teamGameIds.get(p.team_id) ?? [];
  if (teamGids.length === 0) continue;
  const lastGid = lastGameIdByPlayer.get(p.id) ?? 0;
  const missedGids = lastGid ? teamGids.filter(gid => gid > lastGid) : teamGids;
  if (missedGids.length >= 1) {
    const lastDate = lastGid ? (gameIdToDate.get(lastGid) ?? null) : null;
    const missedDates = [...new Set(missedGids.map(gid => gameIdToDate.get(gid)).filter(Boolean))].sort();
    scratched.push({
      player_id: p.id,
      name: p.first_name + ' ' + p.last_name,
      team_id: p.team_id,
      team_abbrev: p.teams?.abbrev ?? '?',
      last_game_id: lastGid || null,
      last_game_date: lastDate,
      consecutive_missed: missedGids.length,
      missed_game_dates: missedDates,
    });
  }
}

scratched.sort((a, b) => b.consecutive_missed - a.consecutive_missed);

const affectedTeams = new Map();
for (const p of scratched) {
  if (!affectedTeams.has(p.team_id)) {
    affectedTeams.set(p.team_id, { team_id: p.team_id, team_abbrev: p.team_abbrev, player_count: 0, missed_game_dates: new Set() });
  }
  const t = affectedTeams.get(p.team_id);
  t.player_count++;
  for (const d of p.missed_game_dates) t.missed_game_dates.add(d);
}

const affectedTeamsArr = [...affectedTeams.values()].map(t => ({
  ...t, missed_game_dates: [...t.missed_game_dates].sort()
})).sort((a, b) => b.player_count - a.player_count);

const allMissedDates = scratched.flatMap(p => p.missed_game_dates).sort();
const earliestMissedDate = allMissedDates[0] ?? null;

writeFileSync('/tmp/scratched_players.json', JSON.stringify({ scratched, affected_teams: affectedTeamsArr, earliest_missed_date: earliestMissedDate }, null, 2));

console.log('\n=== SUMMARY ===');
console.log('Scratched players:', scratched.length);
console.log('Affected teams:', affectedTeamsArr.length);
console.log('Earliest missed date:', earliestMissedDate);
console.log('\nTop 30 scratched:');
for (const p of scratched.slice(0, 30)) {
  console.log('  ' + p.name.padEnd(25) + p.team_abbrev.padEnd(5) + ' missed=' + p.consecutive_missed + ' last=' + (p.last_game_date ?? 'never') + ' dates=' + p.missed_game_dates.join(','));
}
console.log('\nAffected teams:');
for (const t of affectedTeamsArr) {
  console.log('  ' + t.team_abbrev.padEnd(5) + ' ' + t.player_count + ' players  dates: ' + t.missed_game_dates.join(', '));
}
