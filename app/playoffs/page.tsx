import type { Metadata } from 'next';
import { fetchSeriesStandings, teamLogoUrl } from '@/lib/data';
import type { SeriesInfo } from '@/lib/data';
import { notFound } from 'next/navigation';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Stanley Cup Playoffs — Hockey Momentum',
  description: 'Live NHL playoff bracket: series standings, wins, and next game schedules for all active series.',
};

const ROUND_LABELS: Record<number, string> = {
  1: 'First Round',
  2: 'Second Round',
  3: 'Conference Finals',
  4: 'Stanley Cup Final',
};

function SeriesCard({ s }: { s: SeriesInfo }) {
  const leaderWins = Math.max(s.awayWins, s.homeWins);
  const leaderTeam = s.awayWins >= s.homeWins ? s.awayTeam : s.homeTeam;
  const trailingTeam = s.awayWins >= s.homeWins ? s.homeTeam : s.awayTeam;
  const leaderW = s.awayWins >= s.homeWins ? s.awayWins : s.homeWins;
  const trailingW = s.awayWins >= s.homeWins ? s.homeWins : s.awayWins;

  const statusLabel = s.isComplete
    ? `${leaderTeam.abbrev} wins ${leaderW}–${trailingW}`
    : leaderW === trailingW
    ? `Tied ${leaderW}–${trailingW}`
    : `${leaderTeam.abbrev} leads ${leaderW}–${trailingW}`;

  const nextGameLabel = s.nextGame
    ? new Date(s.nextGame.game_date + 'T12:00:00Z').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      })
    : null;

  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      {/* Teams */}
      <div className="flex items-center justify-between gap-3 mb-3">
        {/* Away */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={teamLogoUrl(s.awayTeam.abbrev)} alt={s.awayTeam.abbrev} className="w-9 h-9 flex-shrink-0" />
          <span className="text-sm font-bold truncate"
            style={{ color: s.awayWins > s.homeWins || s.isComplete && s.awayWins > s.homeWins ? 'var(--text-bright)' : 'var(--text)', opacity: s.isComplete && s.awayWins < s.homeWins ? 0.4 : 1 }}>
            {s.awayTeam.name}
          </span>
        </div>

        {/* Wins */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl font-black font-mono tabular-nums"
            style={{ color: s.awayWins > s.homeWins ? 'var(--text-bright)' : 'var(--text)', opacity: s.awayWins < s.homeWins ? 0.35 : 1 }}>
            {s.awayWins}
          </span>
          <span className="text-base font-bold" style={{ color: 'var(--text)', opacity: 0.2 }}>–</span>
          <span className="text-2xl font-black font-mono tabular-nums"
            style={{ color: s.homeWins > s.awayWins ? 'var(--text-bright)' : 'var(--text)', opacity: s.homeWins < s.awayWins ? 0.35 : 1 }}>
            {s.homeWins}
          </span>
        </div>

        {/* Home */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm font-bold truncate text-right"
            style={{ color: s.homeWins > s.awayWins || s.isComplete && s.homeWins > s.awayWins ? 'var(--text-bright)' : 'var(--text)', opacity: s.isComplete && s.homeWins < s.awayWins ? 0.4 : 1 }}>
            {s.homeTeam.name}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={teamLogoUrl(s.homeTeam.abbrev)} alt={s.homeTeam.abbrev} className="w-9 h-9 flex-shrink-0" />
        </div>
      </div>

      {/* Status + next game */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold"
          style={{ color: s.isComplete ? 'var(--neon)' : 'var(--text)', opacity: s.isComplete ? 1 : 0.6 }}>
          {statusLabel}
        </span>
        {nextGameLabel && !s.isComplete && (
          <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.4 }}>
            Game {s.totalPlayed + 1} · {nextGameLabel}
          </span>
        )}
        {s.isComplete && (
          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: 'var(--neon)', color: '#000' }}>
            SERIES FINAL
          </span>
        )}
      </div>
    </div>
  );
}

export default async function PlayoffsPage() {
  const seriesMap = await fetchSeriesStandings();

  if (seriesMap.size === 0) notFound();

  const rounds = new Map<number, SeriesInfo[]>();
  for (const s of seriesMap.values()) {
    if (!rounds.has(s.round)) rounds.set(s.round, []);
    rounds.get(s.round)!.push(s);
  }

  const sortedRounds = [...rounds.entries()].sort(([a], [b]) => a - b);

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-0">
      <div className="mb-6 pt-4">
        <p className="text-xs font-semibold tracking-widest uppercase mb-1"
          style={{ color: 'var(--text)', opacity: 0.4 }}>
          Stanley Cup Playoffs
        </p>
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-bright)' }}>
          Bracket
        </h1>
      </div>

      <div className="flex flex-col gap-10">
        {sortedRounds.map(([round, series]) => (
          <div key={round}>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: 'var(--text)', opacity: 0.4 }}>
              {ROUND_LABELS[round] ?? `Round ${round}`}
            </p>
            <div className="flex flex-col gap-3">
              {series
                .sort((a, b) => a.seriesNum - b.seriesNum)
                .map(s => (
                  <SeriesCard key={`${s.round}-${s.seriesNum}`} s={s} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
