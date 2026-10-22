import { fetchDayCards } from '@/lib/game-cards';
import { gameView } from '@/lib/game-state';
import { fallbackImage, listImage } from '@/lib/og';

// One row per game: "PHI @ BUF" with our pick, or the final score.
export async function predictionsImage(date: string) {
  const days = await fetchDayCards([date]).catch(() => []);
  const cards = days[0]?.cards ?? [];
  const label = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  if (!cards.length) return fallbackImage(`PREDICTIONS · ${label.toUpperCase()}`, 'No NHL games on this date.');
  return listImage(`PREDICTIONS · ${label.toUpperCase()}`, `Our picks: ${cards.length} game${cards.length === 1 ? '' : 's'}`, cards.map(c => {
    const final = gameView(c.state) === 'final' && c.away.score != null && c.home.score != null;
    return {
      team: c.pick?.abbrev ?? c.home.abbrev,
      label: `${c.away.abbrev} @ ${c.home.abbrev}`,
      sub: final ? `${c.away.score}–${c.home.score} final` : undefined,
      value: c.pick ? `${c.pick.abbrev} ${c.pick.pct}%${final && c.pickResult ? (c.pickResult === 'hit' ? ' · HIT' : ' · MISS') : ''}` : 'TBD',
      valueColor: final && c.pickResult === 'miss' ? '#3a88ff' : final && c.pickResult === 'hit' ? '#00e5a0' : undefined,
    };
  }));
}
