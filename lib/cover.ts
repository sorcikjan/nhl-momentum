// A finished game's cover image, for /games/{id}/cover and the game's share image.
import { fetchGameCover } from '@/lib/data';
import { coverImage } from '@/lib/og';
import { coverStar, gameTag, type FinishedGame } from '@/lib/stories';

export async function gameCover(gameId: number) {
  const cover = await fetchGameCover(gameId).catch(() => null);
  if (!cover) return null;
  const g = cover.game as unknown as FinishedGame & { home_team: { abbrev: string }; away_team: { abbrev: string } };
  return coverImage({
    away: g.away_team.abbrev, home: g.home_team.abbrev, awayScore: g.away_score ?? 0, homeScore: g.home_score ?? 0,
    date: new Date(`${g.game_date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).toUpperCase(),
    tag: gameTag(g, cover.pickMissed),
    star: coverStar(g),
  });
}
