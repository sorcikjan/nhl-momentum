// Homepage data (regular season) — shapes the existing fetchers into what the
// design's sections show (docs/design/redesign-2026/homepage-final.js).
import {
  fetchGamesRange, fetchGoalieRankings, fetchNewcomerWatch, fetchRankings, fetchRecap,
  fetchPlayerPhotos, fetchRecentCompletedGames, fetchRecentRecaps, fetchSeasonPickAccuracy, fetchSnapshotHeat,
} from '@/lib/data';
import { ppmToHeat } from '@/lib/heat';
import { teamColor } from '@/lib/team-colors';
import { gameUrl, playerUrl, recapUrl } from '@/lib/urls';

export type TeamSide = { abbrev: string; name: string };
export type SlateGame = {
  id: number; href: string; startTimeUTC: string | null; state: string;
  awayScore: number | null; homeScore: number | null;
  away: TeamSide; home: TeamSide;
  pickSide: 'home' | 'away' | null; pickPct: number | null;
  watch: { playerId?: number; name: string; heat: number; photo: string | null; team: string } | null;
};
export type ResultCard = {
  id: number; href: string;
  away: TeamSide & { score: number }; home: TeamSide & { score: number };
  pick: 'hit' | 'miss' | null; pickTeam: string | null; pickPct: number | null;
  star: { playerId: number; name: string; team: string; goalie: boolean; photo: string | null } | null;
  starHeat?: number | null;
};
export type StoryCard = { href: string; kicker: string; title: string; dek: string; team: string | null; lead: boolean };
export type RankRow = { playerId: number; href: string; name: string; photo: string | null; team: string; heat: number | null; sub: string };
export type HomeData = {
  today: string;
  tonight: SlateGame[]; nextGameDate: string | null;
  resultsDate: string | null; results: ResultCard[];
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

export function toResultCard(g: FinishedGame, pred: Pred): ResultCard {
  const home = g.home_team?.abbrev ?? '?';
  const away = g.away_team?.abbrev ?? '?';
  const hs = g.home_score ?? 0;
  const as = g.away_score ?? 0;
  let pick: ResultCard['pick'] = null;
  let pickTeam: string | null = null;
  let pickPct: number | null = null;
  const p = pred?.home_win_probability;
  if (p != null) {
    const homePick = p >= 0.5;
    pickTeam = homePick ? home : away;
    pickPct = Math.round((homePick ? p : 1 - p) * 100);
    const recorded = pred?.prediction_outcomes?.[0]?.correct_winner;
    pick = (recorded ?? homePick === hs > as) ? 'hit' : 'miss';
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const first = Array.isArray(g.three_stars) ? (g.three_stars as any[]).find(s => s?.star === 1) : null;
  return {
    id: g.id,
    href: gameUrl(g.id, away, home, g.game_date),
    away: { ...side(away), score: as },
    home: { ...side(home), score: hs },
    pick, pickTeam, pickPct,
    star: first ? { playerId: first.playerId, name: first.name?.default ?? '', team: first.teamAbbrev ?? '', goalie: first.position === 'G', photo: first.headshot ?? null } : null,
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
  const emptyRange = { games: [], predictions: [], odds: [], topPlayerByGame: new Map(), topHeatByGameTeam: new Map() };
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
  const tonight: SlateGame[] = games.filter(g => dateOf(g) === today).map(g => {
    const p = predBy.get(g.id)?.home_win_probability ?? null;
    const top = range.topPlayerByGame.get(g.id);
    return {
      id: g.id,
      href: gameUrl(g.id, g.awayTeam.abbrev, g.homeTeam.abbrev, today),
      startTimeUTC: g.startTimeUTC ?? null,
      state: g.gameState ?? 'FUT',
      awayScore: g.awayTeam.score ?? null, homeScore: g.homeTeam.score ?? null,
      away: side(g.awayTeam.abbrev), home: side(g.homeTeam.abbrev),
      pickSide: p == null ? null : p >= 0.5 ? 'home' : 'away',
      pickPct: p == null ? null : Math.round((p >= 0.5 ? p : 1 - p) * 100),
      watch: top ? { name: top.name, heat: ppmToHeat(top.compositePpm), photo: null, team: top.teamAbbrev, playerId: top.playerId } : null,
    };
  });
  // Photos for the "watch for" players (snapshots carry no headshot).
  const watchIds = tonight.flatMap(t => (t.watch?.playerId ? [t.watch.playerId] : []));
  if (watchIds.length) {
    const photos = await safe(fetchPlayerPhotos(watchIds), new Map<number, string>());
    for (const t of tonight) if (t.watch?.playerId) t.watch.photo = photos.get(t.watch.playerId) ?? null;
  }
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
  // Goalies have no points-based Heat, so only skater stars get one.
  const starIds = results.filter(r => r.star && !r.star.goalie).map(r => r.star!.playerId);
  const starHeat = await safe(fetchSnapshotHeat(starIds), new Map<number, number>());
  for (const r of results) r.starHeat = r.star && !r.star.goalie ? starHeat.get(r.star.playerId) ?? null : null;

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
