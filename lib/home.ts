// Homepage data (regular season) — shapes the existing fetchers into what the
// design's sections show (docs/design/redesign-2026/homepage-final.js).
import {
  fetchGamesRange, fetchGoalieRankings, fetchNewcomerWatch, fetchRankings, fetchRecap,
  fetchPlayerPhotos, fetchPregameKeyPlayers, fetchRecentCompletedGames, fetchRecentRecaps, fetchSeasonPickAccuracy, fetchStatLines,
} from '@/lib/data';
import { cardPlayers, type GameCardData } from '@/lib/game-card';
import { gameView } from '@/lib/game-state';
import { ppmToHeat } from '@/lib/heat';
import type { KeyPlayer } from '@/lib/key-players';
import { teamColor } from '@/lib/team-colors';
import { gameUrl, playerUrl, recapUrl } from '@/lib/urls';

export type TeamSide = { abbrev: string; name: string };
export type StoryCard = { href: string; kicker: string; title: string; dek: string; team: string | null; lead: boolean };
export type RankRow = { playerId: number; href: string; name: string; photo: string | null; team: string; heat: number | null; sub: string };
export type HomeData = {
  today: string;
  tonight: GameCardData[]; nextGameDate: string | null;
  resultsDate: string | null; results: GameCardData[];
  stories: StoryCard[];
  hottest: RankRow[]; goalies: RankRow[]; rookies: RankRow[];
  pickAccuracyPct: number | null;
  rankedCount: number | null;
  heroImageUrl: string | null;
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

export function formatAccuracy(pct: number | null): string {
  return pct == null ? 'Pick accuracy tracking' : `${Math.round(pct)}% pick accuracy · YTD`;
}

type Recap = { date: string; title: string; summary: string | null; content: string | null } | null;

// Lead = the recap itself; then up to 3 of its per-game sections ("### CAR 2 @ CGY 3").
export function recapToStories(recap: Recap, slugTitle: string): StoryCard[] {
  if (!recap) return [];
  const href = recapUrl(recap.date, slugTitle || recap.title);
  const out: StoryCard[] = [{ href, kicker: 'LAST NIGHT · BIG STORY', title: recap.title, dek: recap.summary ?? '', team: null, lead: true }];
  const sections = (recap.content ?? '').split(/^### /m).slice(1);
  for (const sec of sections) {
    const [header, ...rest] = sec.split('\n');
    const m = header.trim().match(/^([A-Z]{2,3}) (\d+) @ ([A-Z]{2,3}) (\d+)$/);
    if (!m) continue;
    const body = rest.join(' ').trim();
    const firstSentence = body.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? body.slice(0, 140);
    const winner = Number(m[2]) > Number(m[4]) ? m[1] : m[3];
    out.push({ href, kicker: 'GAME STORY', title: header.trim(), dek: firstSentence, team: winner, lead: false });
    if (out.length === 4) break;
  }
  return out;
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
  const [range, recent, rankings, goalies, rookies, recaps, accuracy] = await Promise.all([
    safe(fetchGamesRange([today]), emptyRange),
    safe(fetchRecentCompletedGames(4, 20), { games: [], predMap: new Map() }),
    safe(fetchRankings(), null),
    safe(fetchGoalieRankings(), []),
    safe(fetchNewcomerWatch(), []),
    safe(fetchRecentRecaps(1), []),
    safe(fetchSeasonPickAccuracy(), null),
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

  const latest = recaps[0] ?? null;
  const recap = latest ? await safe(fetchRecap(latest.date), null) : null;
  const stories = recapToStories(recap ? { date: recap.date, title: recap.title, summary: recap.summary, content: recap.content } : null, recap?.title ?? '');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hottest: RankRow[] = ((rankings?.momentumLeaders?.skaters ?? []) as any[]).slice(0, 5).map(r => ({
    playerId: r.player_id,
    href: playerUrl(r.player_id, r.players?.first_name ?? '', r.players?.last_name ?? ''),
    name: `${r.players?.first_name ?? ''} ${r.players?.last_name ?? ''}`.trim(),
    photo: r.players?.headshot_url ?? null,
    team: r.players?.teams?.abbrev ?? '',
    heat: ppmToHeat(r.momentum_ppm),
    sub: r.players?.position_code === 'D' ? 'Defense' : 'Forward',
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goalieRows: RankRow[] = (goalies as any[]).slice(0, 5).map(g => ({
    playerId: g.id,
    href: playerUrl(g.id, g.first_name, g.last_name),
    name: `${g.first_name} ${g.last_name}`,
    photo: g.headshot_url ?? null,
    team: g.teams?.abbrev ?? '',
    heat: null,
    sub: `SV% ${g.avgSavePct.toFixed(3).replace(/^0/, '')} · last ${g.gamesPlayed}`,
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rookieRows: RankRow[] = (rookies as any[]).slice(0, 5).map(r => ({
    playerId: r.player_id,
    href: playerUrl(r.player_id, r.players.first_name, r.players.last_name),
    name: `${r.players.first_name} ${r.players.last_name}`,
    photo: r.players.headshot_url ?? null,
    team: r.players.teams?.abbrev ?? '',
    heat: ppmToHeat(r.momentum_ppm),
    sub: r.players.age != null ? `Age ${r.players.age}` : `${r.players.career_games} NHL games`,
  }));

  return { today, tonight, nextGameDate, resultsDate, results, stories, hottest, goalies: goalieRows, rookies: rookieRows, pickAccuracyPct: accuracy, rankedCount: rankings?.totalSkaters ?? null, heroImageUrl: latest?.hero_image_url ?? null };
}
