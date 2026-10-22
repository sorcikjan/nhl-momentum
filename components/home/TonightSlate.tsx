import Link from 'next/link';
import { SectionHeading, SectionLink } from '@/components/ds';
import { GameCard } from '@/components/game/GameCard';
import type { GameCardData } from '@/lib/game-card';
import { dayLabel } from './format';

// "★ Game of the night: Carolina at Edmonton — McDavid at Heat 100." Facts only.
function marqueeLine(games: GameCardData[]) {
  const g = games.find(c => c.marquee);
  if (!g) return undefined;
  const star = [...g.away.players, ...g.home.players].filter(p => p.heat != null).sort((a, b) => b.heat! - a.heat!)[0];
  return (
    <>
      <span className="font-bold" style={{ color: 'var(--gold)' }}>★ Game of the night:</span> {g.away.name} at {g.home.name}
      {star ? ` — ${star.name} at Heat ${star.heat}.` : '.'}
    </>
  );
}

// Tonight's games: one GameCard each (same card as results and the schedule),
// the game of the night first.
export function TonightSlate({ games, nextGameDate }: { games: GameCardData[]; nextGameDate: string | null }) {
  return (
    <section data-section="tonight">
      <SectionHeading
        kicker={games.length ? `TONIGHT · ${games.length} GAME${games.length === 1 ? '' : 'S'}` : 'TONIGHT'}
        title={games.length ? "What's on tonight." : 'No games tonight.'}
        sub={marqueeLine(games)}
        size="feature"
        right={<SectionLink href="/games">Full schedule</SectionLink>}
      />
      {games.length === 0 ? (
        <div className="rounded-xl border px-5 py-4 text-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}>
          {nextGameDate ? <>Next games: <Link href="/games?range=week" className="font-semibold" style={{ color: 'var(--text-bright)' }}>{dayLabel(nextGameDate)}</Link></> : 'No games scheduled this week.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {games.map(g => <GameCard key={g.id} g={g} />)}
        </div>
      )}
    </section>
  );
}
