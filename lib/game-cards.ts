// Server-side assembly of GameCards for one or more game days — shared by the
// schedule (/games) and the dated predictions pages (/predictions/[date]).
import { fetchGamesRange, fetchPlayerPhotos, fetchRankings, fetchRecap, fetchStatLines } from '@/lib/data';
import { cardPlayers, markGameOfTheNight, withTeamHeat, type GameCardData } from '@/lib/game-card';
import { gameView } from '@/lib/game-state';
import { ppmToHeat } from '@/lib/heat';
import type { KeyPlayer } from '@/lib/key-players';
import { teamColor } from '@/lib/team-colors';
import { gameUrl, recapUrl } from '@/lib/urls';
import { calcWatchability } from '@/lib/watchability';

export type GameDay = { date: string; cards: GameCardData[] };

export async function fetchDayCards(dates: string[]): Promise<GameDay[]> {
  const empty = { games: [], predictions: [], odds: [], topHeatByGameTeam: new Map<string, number>(), keyPlayersByGameTeam: new Map<string, KeyPlayer[]>() };
  const { games, predictions, topHeatByGameTeam, keyPlayersByGameTeam } = await fetchGamesRange(dates).catch(() => empty);

  // Key players on every card; goals/assists once a game has started; photos in one query.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = games as any[];
  const startedIds = all.filter(g => gameView(g.gameState) !== 'upcoming').map(g => g.id as number);
  const keyIds = [...new Set([...keyPlayersByGameTeam.values()].flat().map(p => p.playerId))];
  const [statsBy, photos, rankings] = await Promise.all([
    fetchStatLines(startedIds).catch(() => new Map<number, Map<number, { goals: number; assists: number }>>()),
    keyIds.length ? fetchPlayerPhotos(keyIds).catch(() => new Map<number, string>()) : Promise.resolve(new Map<number, string>()),
    fetchRankings().catch(() => null),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predBy = new Map<number, any>((predictions ?? []).map((p: { game_id: number }) => [p.game_id, p]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byDate = new Map<string, any[]>();
  for (const g of all) {
    if (!byDate.has(g.gameDate)) byDate.set(g.gameDate, []);
    byDate.get(g.gameDate)!.push(g);
  }
  const finalDates = [...byDate.entries()].filter(([, gs]) => gs.some(g => gameView(g.gameState) === 'final')).map(([d]) => d);
  const recapBy = new Map(await Promise.all(finalDates.map(async d => [d, await fetchRecap(d).catch(() => null)] as const)));

  return [...byDate.entries()].map(([date, gs]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cards: GameCardData[] = gs.map((g: any) => {
      const p = predBy.get(g.id);
      const view = gameView(g.gameState);
      const homeProb: number | null = p?.home_win_probability ?? null;
      const homePct = homeProb == null ? null : Math.round(homeProb * 100);
      const outcome = p?.prediction_outcomes?.[0]?.correct_winner;
      const recap = recapBy.get(date);
      // A started game without box-score rows yet shows Heat only (not "DNP" for everyone).
      const stats = statsBy.get(g.id)?.size ? statsBy.get(g.id)! : null;
      return {
        id: g.id,
        href: gameUrl(g.id, g.awayTeam.abbrev, g.homeTeam.abbrev, date),
        state: g.gameState,
        startTimeUTC: g.startTimeUTC ?? null,
        away: { abbrev: g.awayTeam.abbrev, name: teamColor(g.awayTeam.abbrev).name, score: g.awayTeam.score ?? null, pct: homePct == null ? null : 100 - homePct,
          players: cardPlayers(keyPlayersByGameTeam.get(`${g.id}-false`), photos, stats) },
        home: { abbrev: g.homeTeam.abbrev, name: teamColor(g.homeTeam.abbrev).name, score: g.homeTeam.score ?? null, pct: homePct,
          players: cardPlayers(keyPlayersByGameTeam.get(`${g.id}-true`), photos, stats) },
        pick: homePct == null ? null : homePct >= 50
          ? { abbrev: g.homeTeam.abbrev, pct: homePct }
          : { abbrev: g.awayTeam.abbrev, pct: 100 - homePct },
        pickResult: view !== 'final' || outcome == null ? null : outcome ? 'hit' : 'miss',
        watchability: view === 'final' ? null : calcWatchability({
          topHomeHeat: ppmToHeat(topHeatByGameTeam.get(`${g.id}-true`) ?? 0),
          topAwayHeat: ppmToHeat(topHeatByGameTeam.get(`${g.id}-false`) ?? 0),
          homeWinProbability: homeProb,
          isPlayoff: false,
        }),
        recapHref: view === 'final' && recap ? recapUrl(date, recap.title) : null,
        marquee: false,
      };
    });
    markGameOfTheNight(cards);
    withTeamHeat(cards, rankings?.teamHeat);
    return { date, cards };
  });
}
