// Data for the morning share cards: the Heat board, who's rising and falling,
// and last night's scores and best goals. Each part fails on its own.
import { fetchRankings, fetchRecentCompletedGames } from '@/lib/data';
import { hotView } from '@/lib/hot-view';
import { todayET } from '@/lib/home';
import { bestGoals } from '@/lib/moments';
import { getScore } from '@/lib/nhl-api';
import type { NightGame, ShareData } from '@/lib/share-cards';

const label = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).toUpperCase();

export async function fetchShareData(): Promise<ShareData> {
  const [rankings, recent] = await Promise.all([
    fetchRankings().catch(() => null),
    fetchRecentCompletedGames(3, 20).catch(() => ({ games: [] as unknown[] })),
  ]);
  const hv = hotView(rankings);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finished = recent.games as any[];
  const date: string | null = finished[0]?.game_date ?? null;
  const games: NightGame[] = date ? finished.filter(g => g.game_date === date).map(g => ({
    away: g.away_team?.abbrev ?? '', awayScore: g.away_score ?? 0, home: g.home_team?.abbrev ?? '', homeScore: g.home_score ?? 0,
  })) : [];
  const goals = date ? bestGoals(await getScore(date).catch(() => ({})), rankings?.heatByPlayer) : [];
  return {
    dateLabel: label(todayET()),
    leader: hv.leader, top: hv.top.slice(0, 4), heatingUp: hv.heatingUp.slice(0, 5), coolingOff: hv.coolingOff.slice(0, 5),
    night: date ? { date, dateLabel: label(date), games, goals } : null,
  };
}
