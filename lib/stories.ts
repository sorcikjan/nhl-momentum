// The homepage's "night in stories": the night recap as the lead, then the
// most interesting games, each with its highlight, its own story (or a line
// built from the box score until it has one) and its star.
import { gameUrl, recapUrl } from '@/lib/urls';
import { teamColor } from '@/lib/team-colors';

type Team = { abbrev: string; name?: string | null } | null;
type Star = { star?: number; name?: { default?: string }; teamAbbrev?: string; position?: string; goals?: number; assists?: number; savePctg?: number; headshot?: string };
export type FinishedGame = {
  id: number; game_date: string; home_score: number | null; away_score: number | null;
  youtube_highlight_id?: string | null; three_stars?: Star[] | null;
  home_team: Team; away_team: Team;
};
export type GameStoryText = { headline: string; dek: string };

export type NightScore = { away: string; awayScore: number; home: string; homeScore: number; href: string };
export type NightStory = {
  href: string; kicker: string; title: string; dek: string;
  image: string | null; watchLabel: string | null; watchHref: string | null; scores: NightScore[];
};
export type GameStoryCard = {
  id: number; href: string; image: string; score: string; watchLabel: string; highlight: boolean;
  kicker: string; title: string; dek: string; hasStory: boolean; goals: number;
  star: { name: string; line: string; team: string; photo: string | null } | null;
};

const abbr = (t: Team) => t?.abbrev ?? '?';
const hrefOf = (g: FinishedGame) => gameUrl(g.id, abbr(g.away_team), abbr(g.home_team), g.game_date);
const youtubeIdOf = (url: string | null | undefined) => url?.match(/\/vi\/([\w-]{6,})\//)?.[1] ?? null;
const scoreLine = (g: FinishedGame) => `${abbr(g.away_team)} ${g.away_score ?? 0} – ${g.home_score ?? 0} ${abbr(g.home_team)}`;

const firstStar = (g: FinishedGame) => [...(g.three_stars ?? [])].sort((a, b) => (a.star ?? 9) - (b.star ?? 9))[0];

function starOf(g: FinishedGame): GameStoryCard['star'] {
  const s = firstStar(g);
  if (!s?.name?.default) return null;
  const line = s.position === 'G'
    ? (s.savePctg != null ? `${s.savePctg.toFixed(3).replace(/^0/, '')} SV%` : 'in net')
    : [s.goals ? `${s.goals}G` : '', s.assists ? `${s.assists}A` : ''].filter(Boolean).join(' ') || '0 PTS';
  return { name: s.name.default, line, team: s.teamAbbrev ?? '', photo: s.headshot ?? null };
}

// What made the game worth a story (card kicker and cover badge).
export function gameTag(g: FinishedGame, pickMissed: boolean): string | null {
  const hi = Math.max(g.home_score ?? 0, g.away_score ?? 0), lo = Math.min(g.home_score ?? 0, g.away_score ?? 0);
  return (g.three_stars ?? []).some(s => (s.goals ?? 0) >= 3) ? 'HAT TRICK' : lo === 0 ? 'SHUTOUT' : pickMissed ? 'UPSET' : hi - lo === 1 ? 'ONE-GOAL GAME' : hi - lo >= 4 ? 'ROUT' : null;
}
const kickerOf = (g: FinishedGame, pickMissed: boolean) => { const t = gameTag(g, pickMissed); return t ? `GAME STORY · ${t}` : 'GAME STORY'; };

// The game's cover image (app/games/[id]/cover): ours, not the NHL highlight thumbnail.
export const coverUrl = (gameId: number) => `/games/${gameId}/cover`;

// The game a night recap is about: the one whose highlight was its hero
// image, else the night's first game.
export function featuredGameId(heroImageUrl: string | null | undefined, games: FinishedGame[]): number | null {
  const yt = youtubeIdOf(heroImageUrl);
  return (games.find(g => g.youtube_highlight_id && g.youtube_highlight_id === yt) ?? games[0])?.id ?? null;
}

// The cover's first-star line and photo.
export function coverStar(g: FinishedGame) {
  const s = firstStar(g);
  const star = starOf(g);
  return star ? { ...star, photo: s?.headshot ?? null } : null;
}

export function gameStoryCard(g: FinishedGame, story: GameStoryText | undefined, pickMissed: boolean): GameStoryCard {
  const awayWon = (g.away_score ?? 0) > (g.home_score ?? 0);
  const [w, l] = awayWon ? [g.away_team, g.home_team] : [g.home_team, g.away_team];
  const hi = Math.max(g.home_score ?? 0, g.away_score ?? 0), lo = Math.min(g.home_score ?? 0, g.away_score ?? 0);
  const star = starOf(g);
  const city = (t: Team) => teamColor(abbr(t)).name;
  // Until the game has its own story: a line from the box score, nothing more.
  const fallbackDek = star
    ? star.line === '0 PTS' || star.line === 'in net' ? `${star.name} was the game's first star.` : `${star.name} led the way with ${star.line}.`
    : `Final: ${scoreLine(g)}.`;
  return {
    id: g.id, href: hrefOf(g),
    image: coverUrl(g.id),
    highlight: !!g.youtube_highlight_id,
    score: scoreLine(g),
    watchLabel: `${city(g.away_team)} ${g.away_score ?? 0}, ${city(g.home_team)} ${g.home_score ?? 0}`,
    kicker: kickerOf(g, pickMissed),
    title: story?.headline ?? `${city(w)} beats ${city(l)} ${hi}–${lo}`,
    dek: story?.dek || fallbackDek,
    hasStory: !!story,
    goals: (g.home_score ?? 0) + (g.away_score ?? 0),
    star,
  };
}

// How much a game deserves one of the few story slots.
function interest(c: GameStoryCard): number {
  return (c.hasStory ? 4 : 0) + (c.highlight ? 1 : 0) + c.goals * 0.25
    + (c.kicker.includes('HAT TRICK') ? 3 : c.kicker.includes('UPSET') ? 2 : c.kicker.includes('SHUTOUT') ? 1.5 : c.kicker.includes('ONE-GOAL') ? 1 : 0);
}

// Most interesting first (stable: ties keep their order).
export const rankStoryCards = (cards: GameStoryCard[]) => [...cards].sort((a, b) => interest(b) - interest(a));

// The lead: the night recap with every score of the night. Its featured game
// (the one in its hero image) is left out of the game cards below it.
export function nightStories(
  recap: { date: string; title: string; summary: string | null; hero_image_url?: string | null } | null,
  games: FinishedGame[],
  stories: Map<number, GameStoryText>,
  missedPicks: Set<number>,
  count = 3,
): { night: NightStory | null; games: GameStoryCard[] } {
  if (!recap) return { night: null, games: [] };
  const ofNight = games.filter(g => g.game_date === recap.date);
  const featuredYt = youtubeIdOf(recap.hero_image_url);
  // The game the recap's headline is about (its hero image was that game's highlight).
  const featured = ofNight.find(g => g.youtube_highlight_id && g.youtube_highlight_id === featuredYt) ?? ofNight[0] ?? null;
  const day = new Date(`${recap.date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).toUpperCase().replace(', ', ' · ');
  const night: NightStory = {
    href: recapUrl(recap.date, recap.title),
    kicker: `THE NIGHT · ${day}`,
    title: recap.title,
    dek: recap.summary ?? '',
    image: featured ? coverUrl(featured.id) : null,
    watchLabel: featured?.youtube_highlight_id ? `Highlights · ${scoreLine(featured).replace(' – ', '–')}` : null,
    watchHref: featured ? hrefOf(featured) : null,
    scores: ofNight.map(g => ({ away: abbr(g.away_team), awayScore: g.away_score ?? 0, home: abbr(g.home_team), homeScore: g.home_score ?? 0, href: hrefOf(g) })),
  };
  const cards = rankStoryCards(ofNight
    .filter(g => g.id !== featured?.id)
    .map(g => gameStoryCard(g, stories.get(g.id), missedPicks.has(g.id))))
    .slice(0, count);
  return { night, games: cards };
}

// ─── The stories page ─────────────────────────────────────────────────────────

type RecapRow = { date: string; title: string; summary: string | null; games_count?: number | null; hero_image_url?: string | null };
export type NightCard = {
  date: string; href: string; kicker: string; title: string; dek: string; image: string | null;
  gamesLabel: string; scores: string[]; more: number;
};

const dayLabel = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).toUpperCase().replace(', ', ' · ');

export function nightCard(r: RecapRow, games: FinishedGame[]): NightCard {
  const ofNight = games.filter(g => g.game_date === r.date);
  const count = ofNight.length || r.games_count || 0;
  const yt = youtubeIdOf(r.hero_image_url);
  const featured = ofNight.find(g => g.youtube_highlight_id && g.youtube_highlight_id === yt) ?? ofNight[0];
  return {
    date: r.date, href: recapUrl(r.date, r.title), kicker: dayLabel(r.date), title: r.title, dek: r.summary ?? '',
    image: featured ? coverUrl(featured.id) : null,
    gamesLabel: `${count} GAME${count === 1 ? '' : 'S'}`,
    scores: ofNight.slice(0, 3).map(g => scoreLine(g).replace(' – ', '–')),
    more: Math.max(0, ofNight.length - 3),
  };
}

// Monday of the week a date falls in, as "Week of Oct 19".
export function weekOf(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`;
}

export function groupByWeek(nights: NightCard[]): { title: string; nights: NightCard[] }[] {
  const out: { title: string; nights: NightCard[] }[] = [];
  for (const n of nights) {
    const title = weekOf(n.date);
    const last = out[out.length - 1];
    if (last?.title === title) last.nights.push(n); else out.push({ title, nights: [n] });
  }
  return out;
}
