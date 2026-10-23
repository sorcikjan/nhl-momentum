import { GameCard } from '@/components/game/GameCard';
import type { GameCardData } from '@/lib/game-card';

const GRID = 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3';

// The top games in view, the rest one click away (a native <details>: works
// without JavaScript and stays in the HTML for search engines).
export function GameGrid({ top, rest }: { top: GameCardData[]; rest: GameCardData[] }) {
  const total = top.length + rest.length;
  return (
    <div className="flex flex-col gap-3">
      <div className={GRID}>{top.map(g => <GameCard key={g.id} g={g} />)}</div>
      {rest.length > 0 && (
        <details className="group">
          <summary
            className="flex min-h-[44px] cursor-pointer list-none items-center justify-center gap-2 rounded-xl border text-[13px] font-bold transition-colors hover:bg-[var(--bg-hover)] [&::-webkit-details-marker]:hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }}
          >
            <span className="group-open:hidden">Show all {total} games</span>
            <span className="hidden group-open:inline">Show fewer</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden className="transition-transform group-open:rotate-180"><polyline points="6 9 12 15 18 9" /></svg>
          </summary>
          <div className={`${GRID} mt-3`}>{rest.map(g => <GameCard key={g.id} g={g} />)}</div>
        </details>
      )}
    </div>
  );
}

// How much a finished game is worth a look: our pick missed, it was close,
// it had goals.
export function resultInterest(g: GameCardData): number {
  const a = g.away.score ?? 0, h = g.home.score ?? 0;
  return (g.pickResult === 'miss' ? 2 : 0) + (Math.abs(a - h) === 1 ? 1 : 0) + (a + h) * 0.3;
}

// Finished games: the most interesting first (stable, so ties keep their order).
export function splitResults(games: GameCardData[], visible = 3) {
  const ranked = [...games].sort((x, y) => resultInterest(y) - resultInterest(x));
  return { top: ranked.slice(0, visible), rest: ranked.slice(visible) };
}

// Tonight: the game of the night and the most watchable in view; the rest stay
// in schedule order.
export function splitTonight(games: GameCardData[], visible = 3) {
  const top = [...games].sort((x, y) => Number(!!y.marquee) - Number(!!x.marquee) || (y.watchability ?? 0) - (x.watchability ?? 0)).slice(0, visible);
  const ids = new Set(top.map(g => g.id));
  return { top, rest: games.filter(g => !ids.has(g.id)) };
}
