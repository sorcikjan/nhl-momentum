import type { Config } from '@netlify/functions';

// Game-finished poller — fires every 15 minutes during game hours.
// Compares NHL API game states for today+yesterday against what's stored in our DB.
// When newly-finished games are detected (FINAL/OFF in API but not yet in DB),
// triggers the targeted game-finish-worker-background for only those teams.
//
// This makes the pipeline event-driven: instead of running every player on a fixed
// schedule, we process exactly the ~40–50 players on teams that just finished a game.
// Load reduction: ~80–90% fewer NHL API calls on typical game days.
//
// Runs during NHL game hours only (UTC 22–08) to avoid wasting invocations midday.
// The schedule: "*/15 22-23,0-8 * * *" — every 15 min from 10 PM to 8 AM UTC.
// Covers earliest puck drop (22:00 UTC = 6 PM ET) through latest game end (~07:00 UTC).

export default async function handler() {
  const base = process.env.URL ?? 'https://nhl-momentum.netlify.app';
  const ingestKey = process.env.INGEST_API_KEY ?? '';

  // Fetch today's and yesterday's games from NHL API (no-cache — we need live states)
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  const fetchSchedule = async (date: string) => {
    try {
      const res = await fetch(`https://api-web.nhle.com/v1/schedule/${date}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return [];
      const json = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (json.gameWeek ?? []).flatMap((w: any) => w.games ?? []);
    } catch {
      return [];
    }
  };

  const [todayGames, yesterdayGames] = await Promise.all([
    fetchSchedule(today),
    fetchSchedule(yesterday),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allGames: any[] = [...todayGames, ...yesterdayGames];

  // Only interested in games the NHL API considers finished
  const finishedInApi = allGames.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (g: any) => g.gameState === 'FINAL' || g.gameState === 'OFF'
  );

  if (finishedInApi.length === 0) {
    console.log('[game-finished-poller] no finished games in NHL API — nothing to do');
    return;
  }

  // Check which of these are already marked FINAL/OFF in our DB
  const finishedGameIds = finishedInApi.map((g: { id: number }) => g.id);

  const dbRes = await fetch(
    `${base}/api/ingest/game-states?ids=${finishedGameIds.join(',')}`,
    {
      headers: { 'x-api-key': ingestKey },
      signal: AbortSignal.timeout(8_000),
    }
  );

  let alreadyFinalInDb = new Set<number>();
  if (dbRes.ok) {
    const dbJson = await dbRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    alreadyFinalInDb = new Set((dbJson.games ?? []).map((g: any) => g.id));
  }

  // Newly finished = FINAL in API but NOT already FINAL in our DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newlyFinished = finishedInApi.filter((g: any) => !alreadyFinalInDb.has(g.id));

  if (newlyFinished.length === 0) {
    console.log('[game-finished-poller] all finished games already processed in DB — skipping');
    return;
  }

  // Collect unique team IDs and full game records from newly-finished games.
  // Pass scores directly from the NHL API response so the worker can write them
  // to the games table before running outcomes-backfill (which reads from that table).
  const teamIds = new Set<number>();
  const gameIds: number[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameRecords: Array<{
    id: number; game_date: string; start_time_utc: string | null;
    home_team_id: number; away_team_id: number;
    home_score: number | null; away_score: number | null;
    game_state: string; venue: string | null; season: string;
  }> = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const g of newlyFinished) {
    gameIds.push(g.id);
    const homeId = g.homeTeam?.id;
    const awayId = g.awayTeam?.id;
    if (homeId) teamIds.add(homeId);
    if (awayId) teamIds.add(awayId);
    gameRecords.push({
      id: g.id,
      game_date: g.gameDate ?? today,
      start_time_utc: g.startTimeUTC ?? null,
      home_team_id: homeId,
      away_team_id: awayId,
      home_score: g.homeTeam?.score ?? null,
      away_score: g.awayTeam?.score ?? null,
      game_state: g.gameState,
      venue: g.venue?.default ?? null,
      season: '20252026',
    });
  }

  console.log(
    `[game-finished-poller] ${newlyFinished.length} newly-finished game(s): ${gameIds.join(',')} — teams: ${[...teamIds].join(',')}`
  );

  // Trigger targeted background worker for these specific games/teams
  const res = await fetch(`${base}/.netlify/functions/game-finish-worker-background`, {
    method: 'POST',
    headers: { 'x-api-key': ingestKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameIds, teamIds: [...teamIds], gameRecords }),
  });

  console.log('[game-finished-poller] triggered game-finish-worker, status:', res.status);
}

export const config: Config = {
  // Every 15 min during NHL game hours: 10 PM–8 AM UTC (covers 6 PM ET kickoff through ~3 AM ET)
  schedule: '*/15 22-23,0-8 * * *',
};
