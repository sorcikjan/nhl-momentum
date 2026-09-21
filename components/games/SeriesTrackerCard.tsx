import type { SeriesInfo } from '@/lib/data';

export default function SeriesTrackerCard({ series }: { series: SeriesInfo }) {
  const leaderWins = Math.max(series.awayWins, series.homeWins);
  const leaderAbbrev = series.awayWins >= series.homeWins ? series.awayTeam.abbrev : series.homeTeam.abbrev;
  const winsNeeded = 4 - leaderWins;

  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="text-xs font-mono font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--heat)', letterSpacing: '0.1em' }}>Series Now</div>
      <div className="font-sans font-extrabold mb-1" style={{ fontSize: '1.35rem', color: 'var(--text-bright)', letterSpacing: '-0.04em' }}>
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
