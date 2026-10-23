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
  image: string | null; watchLabel: string | null; scores: NightScore[];
};
export type GameStoryCard = {
  id: number; href: string; image: string | null; score: string; watchLabel: string;
  kicker: string; title: string; dek: string; hasStory: boolean;
  star: { name: string; line: string; team: string; photo: string | null } | null;
};

const abbr = (t: Team) => t?.abbrev ?? '?';
const hrefOf = (g: FinishedGame) => gameUrl(g.id, abbr(g.away_team), abbr(g.home_team), g.game_date);
// mqdefault is 16:9 (hqdefault is 4:3 with black bars); maxres for the lead.
export const thumb = (id: string, size: 'card' | 'hero') => `https://i.ytimg.com/vi/${id}/${size === 'hero' ? 'maxresdefault' : 'mqdefault'}.jpg`;
const youtubeIdOf = (url: string | null | undefined) => url?.match(/\/vi\/([\w-]{6,})\//)?.[1] ?? null;
const scoreLine = (g: FinishedGame) => `${abbr(g.away_team)} ${g.away_score ?? 0} – ${g.home_score ?? 0} ${abbr(g.home_team)}`;

const firstStar = (g: FinishedGame) => [...(g.three_stars ?? [])].sort((a, b) => (a.star ?? 9) - (b.star ?? 9))[0];

function starOf(g: FinishedGame): GameStoryCard['star'] {
  const s = firstStar(g);
  if (!s?.name?.default) return null;
  const line = s.position === 'G'
    ? (s.savePctg != null ? `${(s.savePctg * 100).toFixed(1)} SV%` : 'in net')
    : [s.goals ? `${s.goals}G` : '', s.assists ? `${s.assists}A` : ''].filter(Boolean).join(' ') || '0 PTS';
  return { name: s.name.default, line, team: s.teamAbbrev ?? '', photo: s.headshot ?? null };
}

// The game's tag: what made it worth a story.
function kickerOf(g: FinishedGame, pickMissed: boolean): string {
  const hi = Math.max(g.home_score ?? 0, g.away_score ?? 0), lo = Math.min(g.home_score ?? 0, g.away_score ?? 0);
  const tag = (g.three_stars ?? []).some(s => (s.goals ?? 0) >= 3) ? 'HAT TRICK' : lo === 0 ? 'SHUTOUT' : pickMissed ? 'UPSET' : hi - lo === 1 ? 'ONE-GOAL GAME' : hi - lo >= 4 ? 'ROUT' : null;
  return tag ? `GAME STORY · ${tag}` : 'GAME STORY';
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
    image: g.youtube_highlight_id ? thumb(g.youtube_highlight_id, 'card') : null,
    score: scoreLine(g),
    watchLabel: `${city(g.away_team)} ${g.away_score ?? 0}, ${city(g.home_team)} ${g.home_score ?? 0}`,
    kicker: kickerOf(g, pickMissed),
    title: story?.headline ?? `${city(w)} beats ${city(l)} ${hi}–${lo}`,
    dek: story?.dek || fallbackDek,
    hasStory: !!story,
    star,
  };
}

// How much a game deserves one of the few story slots.
function interest(c: GameStoryCard, g: FinishedGame): number {
  const goals = (g.home_score ?? 0) + (g.away_score ?? 0);
  return (c.hasStory ? 4 : 0) + (c.image ? 1 : 0) + goals * 0.25
    + (c.kicker.includes('HAT TRICK') ? 3 : c.kicker.includes('UPSET') ? 2 : c.kicker.includes('SHUTOUT') ? 1.5 : c.kicker.includes('ONE-GOAL') ? 1 : 0);
}

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
  const featured = ofNight.find(g => g.youtube_highlight_id && g.youtube_highlight_id === featuredYt) ?? null;
  const day = new Date(`${recap.date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).toUpperCase().replace(', ', ' · ');
  const night: NightStory = {
    href: recapUrl(recap.date, recap.title),
    kicker: `THE NIGHT · ${day}`,
    title: recap.title,
    dek: recap.summary ?? '',
    image: featuredYt ? thumb(featuredYt, 'hero') : recap.hero_image_url ?? null,
    watchLabel: featured ? `Highlights · ${scoreLine(featured).replace(' – ', '–')}` : null,
    scores: ofNight.map(g => ({ away: abbr(g.away_team), awayScore: g.away_score ?? 0, home: abbr(g.home_team), homeScore: g.home_score ?? 0, href: hrefOf(g) })),
  };
  const cards = ofNight
    .filter(g => g.id !== featured?.id)
    .map(g => ({ g, c: gameStoryCard(g, stories.get(g.id), missedPicks.has(g.id)) }))
    .sort((a, b) => interest(b.c, b.g) - interest(a.c, a.g))
    .slice(0, count)
    .map(x => x.c);
  return { night, games: cards };
}
