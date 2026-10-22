// Pre-filled share text and share-intent links (X, Reddit). Text is built from
// real data only and kept short enough for a post.
import { gameView } from '@/lib/game-state';
import { lastName, type GameCardData } from '@/lib/game-card';

export function shareLinks(url: string, text: string) {
  const u = encodeURIComponent(url), t = encodeURIComponent(text);
  return {
    x: `https://x.com/intent/post?text=${t}&url=${u}`,
    reddit: `https://www.reddit.com/submit?url=${u}&title=${t}`,
  };
}

export function gameShareText(c: GameCardData): string {
  if (gameView(c.state) === 'final' && c.away.score != null && c.home.score != null) {
    const [w, l] = c.home.score > c.away.score ? [c.home, c.away] : [c.away, c.home];
    const pick = c.pick && c.pickResult ? ` — our pick (${c.pick.abbrev} ${c.pick.pct}%) ${c.pickResult === 'hit' ? '✓' : '✗'}` : '';
    return `${w.abbrev} ${w.score}–${l.score} ${l.abbrev}${pick}`;
  }
  const hottest = [...c.away.players, ...c.home.players].filter(p => p.heat != null).sort((a, b) => b.heat! - a.heat!)[0];
  const pick = c.pick ? ` — our pick: ${c.pick.abbrev} ${c.pick.pct}%` : '';
  const hot = hottest ? ` · hottest tonight: ${hottest.name} (Heat ${hottest.heat})` : '';
  return `${c.away.abbrev} @ ${c.home.abbrev}${pick}${hot}`;
}

export function playerShareText(name: string, heat: number | null): string {
  return heat != null ? `${name} is at ${heat} Heat right now` : `${name} — form and stats`;
}

export function hotShareText(top: { name: string; heat: number }[]): string {
  return `Hottest in the NHL right now: ${top.map(p => `${lastName(p.name)} ${p.heat}`).join(', ')}`;
}

export function predictionsShareText(games: number, dayLabel: string): string {
  return `Our picks for all ${games} NHL games on ${dayLabel}`;
}
