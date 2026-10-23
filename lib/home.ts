// Homepage data (regular season) — shapes the existing fetchers into what the
// design's sections show (docs/design/redesign-2026/homepage-final.js).
import {
  fetchGameStoriesByDate, fetchGamesRange, fetchGoalieRankings, fetchNewcomerWatch, fetchRankings,
  fetchPlayerPhotos, fetchPregameKeyPlayers, fetchRecentCompletedGames, fetchRecentRecaps, fetchStatLines,
} from '@/lib/data';
import { cardPlayers, markGameOfTheNight, withTeamHeat, type GameCardData } from '@/lib/game-card';
import { goalieRow, pacePct, posLabel, rookieRow, skaterRow, type PlayerRowData } from '@/lib/player-row';
import { calcWatchability } from '@/lib/watchability';
import { gameView } from '@/lib/game-state';
import { ppmToHeat } from '@/lib/heat';
import type { KeyPlayer } from '@/lib/key-players';
import { teamColor } from '@/lib/team-colors';
import { nightStories, type FinishedGame as StoryGame, type GameStoryCard, type NightStory } from '@/lib/stories';
import { gameUrl, playerUrl, teamUrl } from '@/lib/urls';

export type TeamSide = { abbrev: string; name: string };
// #1 on the Heat list: the hero card.
export type HeatLeader = {
  playerId: number; href: string; first: string; last: string; photo: string | null; team: string; teamName: string; pos: string;
  heat: number; pace: number | null; goals: number; assists: number; games: number;
  tonight: { href: string; opponent: string; time: string | null } | null;
};
export type TeamHeatRow = { abbrev: string; name: string; heat: number; href: string | null };
export type HomeData = {
  today: string;
  tonight: GameCardData[]; nextGameDate: string | null;
  resultsDate: string | null; results: GameCardData[];
  night: NightStory | null; gameStories: GameStoryCard[];
  leader: HeatLeader | null; leaders: PlayerRowData[];
  heatingUp: PlayerRowData[]; coolingOff: PlayerRowData[];
  goalies: PlayerRowData[]; rookies: PlayerRowData[];
  teams: TeamHeatRow[];
};

const side = (abbrev: string): TeamSide => ({ abbrev, name: teamColor(abbrev).name });

type Pred = { home_win_probability?: number | null; prediction_outcomes?: { correct_winner?: boolean | null }[] | null } | null;
type FinishedGame = {
  id: number; game_date: string; home_score: number | null; away_score: number | null; three_stars?: unknown;
  home_team: { abbrev: string; name?: string } | null; away_team: { abbrev: string; name?: string } | null;
};

// Our pick from the home win probability: the favored side and its %.
function pickFrom(p: number | null | undefined, home: string, away: string): GameCardData['pick'] {
  if (p == null) return null;
  return p >= 0.5 ? { abbrev: home, pct: Math.round(p * 100) } : { abbrev: away, pct: Math.round((1 - p) * 100) };
}

export function toResultCard(g: FinishedGame, pred: Pred): GameCardData {
  const home = g.home_team?.abbrev ?? '?';
  const away = g.away_team?.abbrev ?? '?';
  const hs = g.home_score ?? 0;
  const as = g.away_score ?? 0;
  const pick = pickFrom(pred?.home_win_probability, home, away);
  const recorded = pred?.prediction_outcomes?.[0]?.correct_winner;
  const pickResult: GameCardData['pickResult'] = !pick ? null : (recorded ?? (pick.abbrev === home) === hs > as) ? 'hit' : 'miss';
  return {
    id: g.id, href: gameUrl(g.id, away, home, g.game_date), state: 'OFF', startTimeUTC: null,
    away: { ...side(away), score: as, pct: null, players: [] },
    home: { ...side(home), score: hs, pct: null, players: [] },
    pick, pickResult,
  };
}


async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try { return await p; } catch (err) { console.error('[home]', err); return fallback; }
}

const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

// NHL game dates are Eastern; a UTC date would roll to tomorrow during evening games.
export function todayET(now = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

export async function fetchHomeData(today: string): Promise<HomeData> {
  const emptyRange = { games: [], predictions: [], odds: [], topHeatByGameTeam: new Map(), keyPlayersByGameTeam: new Map<string, KeyPlayer[]>() };
  const [range, recent, rankings, goalies, rookies, recaps] = await Promise.all([
    safe(fetchGamesRange([today]), emptyRange),
    safe(fetchRecentCompletedGames(4, 20), { games: [], predMap: new Map() }),
    safe(fetchRankings(), null),
    safe(fetchGoalieRankings(), []),
    safe(fetchNewcomerWatch(), []),
    safe(fetchRecentRecaps(1), []),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const games = range.games as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predBy = new Map<number, any>(range.predictions.map((p: any) => [p.game_id, p]));
  const dateOf = (g: { gameDate?: string; startTimeUTC?: string }) => g.gameDate ?? g.startTimeUTC?.slice(0, 10) ?? '';
  const tonight: GameCardData[] = games.filter(g => dateOf(g) === today).map(g => {
    const pred = predBy.get(g.id);
    const p: number | null = pred?.home_win_probability ?? null;
    const pick = pickFrom(p, g.homeTeam.abbrev, g.awayTeam.abbrev);
    const outcome = pred?.prediction_outcomes?.[0]?.correct_winner;
    const homePct = p == null ? null : Math.round(p * 100);
    return {
      id: g.id, href: gameUrl(g.id, g.awayTeam.abbrev, g.homeTeam.abbrev, today),
      state: g.gameState ?? 'FUT', startTimeUTC: g.startTimeUTC ?? null,
      away: { ...side(g.awayTeam.abbrev), score: g.awayTeam.score ?? null, pct: homePct == null ? null : 100 - homePct, players: [] },
      home: { ...side(g.homeTeam.abbrev), score: g.homeTeam.score ?? null, pct: homePct, players: [] },
      pick, pickResult: gameView(g.gameState) === 'final' && outcome != null && pick ? (outcome ? 'hit' : 'miss') : null,
      watchability: gameView(g.gameState) === 'final' ? null : calcWatchability({
        topHomeHeat: ppmToHeat(range.topHeatByGameTeam.get(`${g.id}-true`) ?? 0),
        topAwayHeat: ppmToHeat(range.topHeatByGameTeam.get(`${g.id}-false`) ?? 0),
        homeWinProbability: p,
        isPlayoff: false,
      }),
    };
  });
  // Off-day only: look a week ahead for the next game date (each extra day costs an NHL call + DB reads).
  let nextGameDate: string | null = null;
  if (!tonight.length) {
    const ahead = await safe(fetchGamesRange(Array.from({ length: 7 }, (_, i) => addDays(today, i + 1))), emptyRange);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nextGameDate = (ahead.games as any[]).map(dateOf).filter(d => d > today).sort()[0] ?? null;
  }

  // Results: the most recent completed game day only.
  const resultsDate = recent.games[0]?.game_date ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = (recent.games as any[]).filter(g => g.game_date === resultsDate).map(g => toResultCard(g, recent.predMap.get(g.id) ?? null));
  // Key players on every card: top pre-game Heat per team, plus goals/assists
  // once a game has started — then photos for all of them in one query.
  const resultKeys = await safe(fetchPregameKeyPlayers(results.map(r => ({ id: r.id, home: r.home.abbrev, away: r.away.abbrev }))), new Map<string, KeyPlayer[]>());
  const keyOf = (id: number, isHome: boolean) => range.keyPlayersByGameTeam.get(`${id}-${isHome}`) ?? resultKeys.get(`${id}-${isHome}`) ?? [];
  const cards = [...tonight, ...results];
  const started = cards.filter(c => gameView(c.state) !== 'upcoming').map(c => c.id);
  const statsBy = await safe(fetchStatLines(started), new Map<number, Map<number, { goals: number; assists: number }>>());
  const ids = [...new Set(cards.flatMap(c => [...keyOf(c.id, false), ...keyOf(c.id, true)].map(k => k.playerId)))];
  const photos = ids.length ? await safe(fetchPlayerPhotos(ids), new Map<number, string>()) : new Map<number, string>();
  for (const c of cards) {
    // A started game without box-score rows yet shows Heat only (not "DNP" for everyone).
    const stats = statsBy.get(c.id)?.size ? statsBy.get(c.id)! : null;
    c.away.players = cardPlayers(keyOf(c.id, false), photos, stats);
    c.home.players = cardPlayers(keyOf(c.id, true), photos, stats);
  }

  // Stories: the latest night with a recap, its games as story cards.
  const latest = recaps[0] ?? null;
  const storyTexts = latest ? await safe(fetchGameStoriesByDate(latest.date), new Map()) : new Map();
  const missedPicks = new Set((recent.games as StoryGame[])
    .filter(g => recent.predMap.get(g.id)?.prediction_outcomes?.[0]?.correct_winner === false).map(g => g.id));
  const { night, games: gameStories } = nightStories(latest, recent.games as StoryGame[], storyTexts, missedPicks);
  if (night && latest?.date === resultsDate) for (const r of results) r.recapHref = night.href;

  // Tonight: the game of the night first; every card shows each team's Heat.
  markGameOfTheNight(tonight);
  tonight.sort((a, b) => Number(!!b.marquee) - Number(!!a.marquee));
  withTeamHeat(cards, rankings?.teamHeat);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skaters = (rankings?.momentumLeaders?.skaters ?? []) as any[];
  const top = skaters[0];
  const topTonight = top ? tonight.find(c => c.away.abbrev === top.players?.teams?.abbrev || c.home.abbrev === top.players?.teams?.abbrev) : undefined;
  const leader: HeatLeader | null = top ? {
    playerId: top.player_id,
    href: playerUrl(top.player_id, top.players?.first_name ?? '', top.players?.last_name ?? ''),
    first: top.players?.first_name ?? '', last: top.players?.last_name ?? '',
    photo: top.players?.headshot_url ?? null,
    team: top.players?.teams?.abbrev ?? '', teamName: top.players?.teams?.name ?? '',
    pos: posLabel(top.players?.position_code),
    heat: ppmToHeat(top.momentum_ppm), pace: pacePct(top.momentum_ppm, top.season_ppm),
    goals: top.momentum_goals ?? 0, assists: top.momentum_assists ?? 0, games: top.momentum_games ?? 0,
    tonight: topTonight && gameView(topTonight.state) === 'upcoming' ? {
      href: topTonight.href,
      opponent: topTonight.away.abbrev === top.players?.teams?.abbrev ? topTonight.home.name : topTonight.away.name,
      time: topTonight.startTimeUTC,
    } : null,
  } : null;
  const leaders = skaters.slice(1, 9).map((r, i) => skaterRow(r, String(i + 2), 'rank'));
  // Not the players already on the Heat list right above — new names only.
  const shown = new Set(skaters.slice(0, 9).map(r => r.player_id));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatingUp = ((rankings?.breakoutWatch ?? []) as any[])
    .filter(r => !shown.has(r.player_id) && (pacePct(r.momentum_ppm, r.season_ppm) ?? 0) > 0).slice(0, 5).map(r => skaterRow(r, '↑', 'up'));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coolingOff = ((rankings?.coolingWatch ?? []) as any[]).slice(0, 5).map(r => skaterRow(r, '↓', 'cool'));
  const teams: TeamHeatRow[] = Object.entries(rankings?.teamHeat ?? {})
    .map(([abbrev, heat]) => {
      const t = rankings?.teams?.[abbrev];
      return { abbrev, name: t?.name ?? teamColor(abbrev).name, heat, href: t ? teamUrl(t.id, t.name) : null };
    })
    .sort((a, b) => b.heat - a.heat);

  return {
    today, tonight, nextGameDate, resultsDate, results, night, gameStories,
    leader, leaders, heatingUp, coolingOff,
    goalies: goalies.slice(0, 10).map((g, i) => goalieRow(g, i + 1)),
    rookies: rookies.slice(0, 10).map((r, i) => rookieRow(r, i + 1)),
    teams,
  };
}
