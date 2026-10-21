// One game card for every state and every list (homepage, schedule): the same
// three-per-team "key players" — top pre-game Heat — with what they did once the
// game has been played.
import type { KeyPlayer } from '@/lib/key-players';

export type CardPlayer = { playerId: number; name: string; href: string; photo: string | null; heat: number | null; stat: string | null };
export type CardSide = { abbrev: string; name: string; score: number | null; pct: number | null; players: CardPlayer[] };
export type GameCardData = {
  id: number; href: string; state: string; startTimeUTC: string | null;
  away: CardSide; home: CardSide;
  pick: { abbrev: string; pct: number } | null;
  pickResult: 'hit' | 'miss' | null;
  watchability?: number | null;
  recapHref?: string | null;
  marquee?: boolean;
};

export function lastName(full: string): string {
  const i = full.indexOf(' ');
  return i > 0 ? full.slice(i + 1) : full;
}

// Three per team from a Heat-ordered pool. `stats` is null before the game;
// afterwards only players with a box-score row (who actually played) qualify —
// the pre-game snapshot can't know late scratches.
export function cardPlayers(
  keys: KeyPlayer[] | undefined,
  photos: Map<number, string>,
  stats: Map<number, { goals: number; assists: number }> | null,
): CardPlayer[] {
  return (keys ?? [])
    .filter(k => !stats || stats.has(k.playerId))
    .slice(0, 3)
    .map(k => {
      const s = stats?.get(k.playerId);
      const line = s ? [s.goals ? `${s.goals}G` : '', s.assists ? `${s.assists}A` : ''].filter(Boolean).join(' ') || '–' : null;
      return { playerId: k.playerId, name: k.name, href: k.href, photo: k.photo ?? photos.get(k.playerId) ?? null, heat: k.heat, stat: line };
    });
}
