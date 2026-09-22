import type { SeriesInfo } from '@/lib/data';

export default function SeriesTrackerCard({ series }: { series: SeriesInfo }) {
  const leaderWins = Math.max(series.awayWins, series.homeWins);
  const leaderAbbrev = series.awayWins >= series.homeWins ? series.awayTeam.abbrev : series.homeTeam.abbrev;
  const winsNeeded = 4 - leaderWins;
  const isUpcoming = !series.isComplete;

  // Which game number are we on? (the next unplayed game)
  const currentGameNum = series.seriesGames.length + (series.isComplete ? 0 : 1);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 14,
        border: '1px solid rgba(255,90,36,0.35)',
        padding: 22,
        boxShadow: '0 0 20px rgba(255,90,36,0.10)',
      }}
    >
      <div className="text-[10px] font-mono font-bold uppercase mb-3" style={{ color: 'var(--heat)', letterSpacing: '0.12em' }}>
        {series.isComplete ? 'Series Final' : 'Series · Best of 7'}
      </div>
      <div
        className="font-sans font-extrabold leading-none mb-1.5"
        style={{ fontSize: 'clamp(22px, 2.5vw, 36px)', color: 'var(--text-bright)', letterSpacing: '-0.04em' }}
      >
        {series.awayTeam.abbrev} {series.awayWins}{' '}
        <span style={{ color: 'var(--text)', opacity: 0.5 }}>—</span>{' '}
        {series.homeWins} {series.homeTeam.abbrev}
      </div>

      {!series.isComplete && leaderWins > 0 && (
        <p className="mb-4" style={{ fontSize: 12, color: 'var(--text)' }}>
          {leaderAbbrev} leads · advances with{' '}
          <span style={{ color: 'var(--rise)', fontWeight: 700 }}>
            {winsNeeded} more win{winsNeeded === 1 ? '' : 's'}
          </span>
        </p>
      )}
      {series.isComplete && (
        <p className="mb-4" style={{ fontSize: 12, color: 'var(--heat)', fontWeight: 600 }}>
          Series complete — {leaderAbbrev} advances
        </p>
      )}

      <div className="flex gap-1.5">
        {Array.from({ length: 7 }, (_, i) => i + 1).map(gameNum => {
          const g = series.seriesGames.find(sg => sg.gameNum === gameNum);
          const winner = g ? (g.seriesAwayScore > g.seriesHomeScore ? series.awayTeam.abbrev : g.seriesHomeScore > g.seriesAwayScore ? series.homeTeam.abbrev : null) : null;
          const isNext = isUpcoming && gameNum === currentGameNum;
          const hasResult = !!winner;

          return (
            <div
              key={gameNum}
              className="flex-1 text-center rounded"
              style={{
                padding: '7px 4px',
                background: isNext ? 'rgba(255,90,36,0.15)' : hasResult ? 'var(--bg)' : 'transparent',
                border: `1px solid ${isNext ? 'var(--heat)' : 'var(--border)'}`,
              }}
            >
              <div className="font-mono font-bold" style={{ fontSize: 8, color: 'var(--text)', opacity: 0.6 }}>G{gameNum}</div>
              <div
                className="font-mono font-bold mt-0.5"
                style={{
                  fontSize: 9,
                  color: isNext ? 'var(--heat)' : hasResult ? 'var(--text-bright)' : 'var(--text)',
                  opacity: hasResult || isNext ? 1 : 0.35,
                }}
              >
                {isNext ? '●' : winner ?? '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
