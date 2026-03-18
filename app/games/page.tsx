import type { Metadata } from 'next';
import { Suspense } from 'react';
import DateNav from '@/components/games/DateNav';
import GameCard from '@/components/games/GameCard';
import { fetchGames } from '@/lib/data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Games',
  description: 'NHL game schedule with momentum-based predictions, win probabilities, and live scores.',
  openGraph: {
    title: 'Games — NHL Momentum',
    description: 'NHL game schedule with momentum-based predictions, win probabilities, and live scores.',
  },
};

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const selected = date ?? new Date().toISOString().slice(0, 10);
  const { games, predictions } = await fetchGames(selected).catch(() => ({ games: [], predictions: [] }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predMap = new Map<number, any>((predictions ?? []).map((p: { game_id: number }) => [p.game_id, p]));

  const label = (() => {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    if (selected === today) return 'Today';
    if (selected === tomorrow) return 'Tomorrow';
    return new Date(selected + 'T12:00:00').toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  })();

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>Games</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
          Schedule · predictions · results
        </p>
      </div>

      <Suspense>
        <DateNav selected={selected} />
      </Suspense>

      <div className="flex items-center justify-between mt-6 mb-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-bright)' }}>{label}</h2>
        <span className="text-sm" style={{ color: 'var(--text)' }}>
          {games.length} game{games.length !== 1 ? 's' : ''}
        </span>
      </div>

      {games.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="text-4xl mb-3">🏒</div>
          <p style={{ color: 'var(--text)' }}>No games scheduled</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(games as any[]).map((game) => (
            <GameCard
              key={game.id}
              game={game}
              prediction={predMap.get(game.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
