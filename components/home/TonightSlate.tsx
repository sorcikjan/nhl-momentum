import Link from 'next/link';
import { SectionHeading } from '@/components/ds';
import { GameCard } from '@/components/game/GameCard';
import type { GameCardData } from '@/lib/game-card';
import { dayLabel, MONO } from './format';

// Tonight's games: one GameCard each (same card as results and the schedule).
export function TonightSlate({ games, nextGameDate }: { games: GameCardData[]; nextGameDate: string | null }) {
  return (
    <section data-section="tonight">
      <SectionHeading
        kicker={games.length ? `TONIGHT · ${games.length} GAME${games.length === 1 ? '' : 'S'}` : 'TONIGHT'}
        title={games.length ? "What's on tonight." : 'No games tonight.'}
        size="feature"
        right={<Link href="/games" className="text-[11px] font-semibold" style={{ ...MONO, color: 'var(--heat)' }}>FULL SCHEDULE →</Link>}
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
