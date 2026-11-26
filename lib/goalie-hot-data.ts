// Data for /hot/goalies: two NHL stats API reports, no database.
// - the season table (every goalie's season save %, and the league average),
// - every goalie game of the last 30 days (enough for five starts, or for
//   seeing that a goalie hasn't been starting).
// Both are read page by page (lib/nhl-stats-api.ts) and cached with the page.
import { goalieHotView, type GoalieHotView, type GoalieStatRow } from '@/lib/goalie-hot-view';
import { currentSeason } from '@/lib/nhl-api';
import { statsRows } from '@/lib/nhl-stats-api';

const REPORT = 'https://api.nhle.com/stats/rest/en/goalie/summary';
const WINDOW_DAYS = 30;
// A goalie can appear more than once in the game report: pages sorted by
// player and game so they neither overlap nor skip.
const BY_PLAYER_GAME = encodeURIComponent(JSON.stringify([
  { property: 'playerId', direction: 'ASC' }, { property: 'gameId', direction: 'ASC' },
]));

export async function fetchGoalieHot(now = new Date()): Promise<GoalieHotView> {
  const since = new Date(now.getTime() - WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
  const [season, games] = await Promise.all([
    statsRows<GoalieStatRow>(`${REPORT}?cayenneExp=seasonId=${currentSeason()}%20and%20gameTypeId=2`, { revalidate: 3600 }),
    statsRows<GoalieStatRow>(`${REPORT}?isAggregate=false&isGame=true&sort=${BY_PLAYER_GAME}&cayenneExp=gameDate%3E=%22${since}%22%20and%20gameTypeId=2`, { revalidate: 3600 }),
  ]);
  return goalieHotView(season, games);
}
