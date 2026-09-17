import type { SeriesInfo } from '@/lib/data';

export default function SeriesTrackerCard({ series }: { series: SeriesInfo }) {
  const leaderWins = Math.max(series.awayWins, series.homeWins);
  const leaderAbbrev = series.awayWins >= series.homeWins ? series.awayTeam.abbrev : series.homeTeam.abbrev;
  const winsNeeded = 4 - leaderWins;

  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text)' }}>Series Now</div>
      <div className="text-xl font-bold font-editorial mb-1" style={{ color: 'var(--text-bright)' }}>
        {series.awayTeam.abbrev} {series.awayWins} — {series.homeWins} {series.homeTeam.abbrev}
      </div>
      {!series.isComplete && leaderWins > 0 && (
        <p className="text-xs mb-3" style={{ color: 'var(--text)' }}>
          {leaderAbbrev} {winsNeeded === 4 ? 'leads' : `advances with ${winsNeeded} more win${winsNeeded === 1 ? '' : 's'}`}
        </p>
      )}
      {series.isComplete && (
        <p className="text-xs mb-3" style={{ color: 'var(--heat)' }}>Series complete — {leaderAbbrev} advances</p>
      )}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, i) => i + 1).map(gameNum => {
          const g = series.seriesGames.find(sg => sg.gameNum === gameNum);
          const winner = g ? (g.seriesAwayScore > g.seriesHomeScore ? series.awayTeam.abbrev : g.seriesHomeScore > g.seriesAwayScore ? series.homeTeam.abbrev : null) : null;
          return (
            <div
              key={gameNum}
              className="text-center rounded py-1.5 text-[10px] font-mono"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: winner ? 'var(--text-bright)' : 'var(--text)',
                opacity: winner ? 1 : 0.4,
              }}
            >
              <div>G{gameNum}</div>
              <div className="font-semibold">{winner ?? '–'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
