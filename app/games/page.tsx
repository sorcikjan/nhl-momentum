import type { Metadata } from 'next';
import { Suspense } from 'react';
import { fetchGamesRange, fetchAccuracy, fetchRecap, isPlayoffGameId } from '@/lib/data';
import { recapUrl } from '@/lib/urls';
import { ppmToHeat } from '@/lib/heat';
import { calcWatchability } from '@/lib/watchability';
import ScheduleFilters, { type ScheduleRange } from '@/components/games/ScheduleFilters';
import ScheduleRow from '@/components/games/ScheduleRow';
import DayPredictionSummary from '@/components/games/DayPredictionSummary';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'NHL Schedule & Predictions',
  description: 'Every NHL game, every AI win prediction, grouped by day — with live scores, betting-market comparisons, and who to watch.',
  openGraph: {
    title: 'NHL Schedule & Predictions — Hockey Momentum',
    description: 'Every NHL game with AI win predictions, live scores, and who to watch tonight.',
  },
};

function datesForRange(range: ScheduleRange, customDate?: string): string[] {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  if (range === 'tomorrow') {
    const d = new Date(today); d.setDate(d.getDate() + 1);
    return [iso(d)];
  }
  if (range === 'week') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() + i);
      return iso(d);
    });
  }
  if (range === 'custom' && customDate) return [customDate];
  return [iso(today)];
}

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; date?: string }>;
}) {
  const { range: rawRange, date: customDate } = await searchParams;
  const range: ScheduleRange = (['today', 'tomorrow', 'week', 'custom'] as const).includes(rawRange as ScheduleRange)
    ? (rawRange as ScheduleRange)
    : 'today';
  const dates = datesForRange(range, customDate);

  const [{ games, predictions, topPlayerByGame, topHeatByGameTeam }, accuracy] = await Promise.all([
    fetchGamesRange(dates).catch(() => ({ games: [], predictions: [], odds: [], topPlayerByGame: new Map(), topHeatByGameTeam: new Map() })),
    fetchAccuracy().catch(() => null),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeVersion = (accuracy?.modelVersions as any[])?.find((v: any) => v.is_active)?.version;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeModelStats = (accuracy?.modelStats as any[])?.find((m: any) => m.version === activeVersion);
  const ytdAccuracy = activeModelStats?.winnerAccuracyPct ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predMap = new Map<number, any>((predictions ?? []).map((p: { game_id: number }) => [p.game_id, p]));

  // Group by date, in order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byDate = new Map<string, any[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const g of (games as any[])) {
    const d = g.gameDate ?? g.startTimeUTC?.slice(0, 10);
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(g);
  }

  // Recap lookup — one fetch per distinct date that has a final game
  const finalDates = [...byDate.entries()]
    .filter(([, dayGames]) => dayGames.some(g => ['FINAL', 'OFF'].includes(g.gameState)))
    .map(([d]) => d);
  const recapEntries = await Promise.all(finalDates.map(async d => [d, await fetchRecap(d).catch(() => null)] as const));
  const recapByDate = new Map(recapEntries);

  const today = new Date().toISOString().slice(0, 10);
  const tomorrowDate = new Date(today + 'T12:00:00Z');
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);
  const dayLabel = (d: string) => {
    if (d === today) return 'Today';
    if (d === tomorrow) return 'Tomorrow';
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const totalGames = games.length;

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--heat)' }}>Schedule · {range === 'today' ? 'Live' : 'Upcoming'}</div>
        <h1 className="text-3xl sm:text-4xl font-bold font-editorial" style={{ color: 'var(--text-bright)' }}>All games. Every prediction.</h1>
        {ytdAccuracy != null && (
          <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
            YTD pick accuracy <span className="font-semibold" style={{ color: 'var(--rise)' }}>{ytdAccuracy}%</span>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Suspense>
          <ScheduleFilters active={range} customDate={customDate} />
        </Suspense>
        <span className="text-sm" style={{ color: 'var(--text)' }}>{totalGames} game{totalGames !== 1 ? 's' : ''}</span>
      </div>

      {range === 'today' && <DayPredictionSummary predictions={predictions ?? []} />}

      {totalGames === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p style={{ color: 'var(--text)' }}>No games scheduled</p>
        </div>
      ) : (
        [...byDate.entries()].map(([date, dayGames]) => (
          <div key={date} className="mb-6">
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>{dayLabel(date)}</h2>
              <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.6 }}>{dayGames.length} game{dayGames.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              {dayGames.map(g => {
                const prediction = predMap.get(g.id);
                const top = topPlayerByGame.get(g.id);
                const isFinal = ['FINAL', 'OFF'].includes(g.gameState);
                const recap = recapByDate.get(date);
                const watchability = !isFinal
                  ? calcWatchability({
                      topHomeHeat: ppmToHeat(topHeatByGameTeam.get(`${g.id}-true`) ?? 0),
                      topAwayHeat: ppmToHeat(topHeatByGameTeam.get(`${g.id}-false`) ?? 0),
                      homeWinProbability: prediction?.home_win_probability ?? null,
                      isPlayoff: isPlayoffGameId(g.id),
                    })
                  : null;
                return (
                  <ScheduleRow
                    key={g.id}
                    game={g}
                    prediction={prediction}
                    watchPlayer={top ? { name: top.name, teamAbbrev: top.teamAbbrev, heat: ppmToHeat(top.compositePpm) } : null}
                    watchability={watchability}
                    recapHref={isFinal && recap ? recapUrl(date, recap.title) : null}
                  />
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
