// One game card for every state and every list (homepage, schedule): the same
// three-per-team "key players" — top pre-game Heat — with what they did once the
// game has been played.
import type { KeyPlayer } from '@/lib/key-players';

export type CardPlayer = { playerId: number; name: string; href: string; photo: string | null; heat: number | null; stat: string | null };
// `teamHeat`: the team's Heat (lib/team-heat), when the rankings have it.
export type CardSide = { abbrev: string; name: string; score: number | null; pct: number | null; players: CardPlayer[]; teamHeat?: number | null };
export type GameCardData = {
  id: number; href: string; state: string; startTimeUTC: string | null;
  away: CardSide; home: CardSide;
  pick: { abbrev: string; pct: number } | null;
  pickResult: 'hit' | 'miss' | null;
  // Internal only: picks the game of the night, never shown.
  watchability?: number | null;
  recapHref?: string | null;
  marquee?: boolean;
};

const keyHeat = (c: GameCardData) => [...c.away.players, ...c.home.players].reduce((s, p) => s + (p.heat ?? 0), 0);

// ★ The single most watchable upcoming game of a day (needs at least two
// games). A tie goes to the game whose key players carry more Heat — start
// time is no reason to watch.
export function markGameOfTheNight(cards: GameCardData[]): void {
  let best: GameCardData | null = null;
  for (const c of cards) {
    if (c.watchability == null) continue;
    if (!best || c.watchability > best.watchability! || (c.watchability === best.watchability && keyHeat(c) > keyHeat(best))) best = c;
  }
  if (best && cards.length > 1) best.marquee = true;
}

export function withTeamHeat(cards: GameCardData[], teamHeat: Record<string, number> | null | undefined): void {
  if (!teamHeat) return;
  for (const c of cards) {
    c.away.teamHeat = teamHeat[c.away.abbrev] ?? null;
    c.home.teamHeat = teamHeat[c.home.abbrev] ?? null;
  }
}

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
