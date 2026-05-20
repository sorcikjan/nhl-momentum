import type { SeriesInfo } from '@/lib/data';
import { computeSeriesProb, teamLogoUrl } from '@/lib/data';
import { ppmToHeat, heatColor } from '@/lib/heat';
import { gameUrl } from '@/lib/urls';
import Link from 'next/link';

// Dark split-background colors (mirrored from TonightSection)
const TEAM_COLORS: Record<string, string> = {
  ANA: '#b5895a', ARI: '#8c2633', UTA: '#1a5276',
  BOS: '#8b6914', BUF: '#003087', CGY: '#8c1c1c',
  CAR: '#7a0000', CHI: '#7a0618', COL: '#4a1726',
  CBJ: '#002654', DAL: '#004a30', DET: '#7a0a14',
  EDM: '#8b3000', FLA: '#041e42', LAK: '#111111',
  MIN: '#0f3022', MTL: '#6e1220', NSH: '#041e42',
  NJD: '#7a0a14', NYI: '#003a6b', NYR: '#00277a',
  OTT: '#7a5c1a', PHI: '#8b2e00', PIT: '#1a1a1a',
  SEA: '#001628', SJS: '#004a50', STL: '#001e6b',
  TBL: '#001a5c', TOR: '#001845', VAN: '#00421e',
  VGK: '#252f34', WSH: '#041e42', WPG: '#041e42',
};

const ROUND_LABELS: Record<number, string> = {
  1: 'First Round', 2: 'Second Round', 3: 'Conference Finals', 4: 'Stanley Cup Final',
};

const CONF_LABELS: Record<number, string> = {
  1: 'FIRST ROUND',
  2: 'SECOND ROUND',
  3: 'CONF FINALS',
  4: 'STANLEY CUP FINAL',
};

interface PlayoffHeroProps {
  seriesMap: Map<string, SeriesInfo>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rankings: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  todayGames: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  predMap: Record<number, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  goalies: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newcomers: any[];
}

// Build a heat-score lookup: team abbrev → top 3 Heat players
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTeamHeatMap(rankings: any[]): Map<string, { name: string; heat: number }[]> {
  const map = new Map<string, { name: string; heat: number }[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of rankings as any[]) {
    const abbrev = r.players?.teams?.abbrev;
    if (!abbrev) continue;
    const heat = ppmToHeat(r.momentum_ppm ?? 0);
    const name = `${r.players.first_name ?? ''} ${r.players.last_name ?? ''}`.trim();
    if (!map.has(abbrev)) map.set(abbrev, []);
    map.get(abbrev)!.push({ name, heat });
  }
  return map;
}

// Sum of top-3 Heat scores for a team
function teamHeatScore(abbrev: string, heatMap: Map<string, { name: string; heat: number }[]>): number {
  const players = heatMap.get(abbrev) ?? [];
  return players.slice(0, 3).reduce((sum, p) => sum + p.heat, 0);
}

// ── Game tracker circles ───────────────────────────────────────────────────────

interface GameTrackerProps {
  totalPlayed: number;
  awayWins: number;
  homeWins: number;
  gameInSeriesTonight: number | null;
  seriesGames: Array<{ gameNum: number; seriesAwayScore: number; seriesHomeScore: number }>;
  awayAbbrev: string;
  homeAbbrev: string;
}

function GameTracker({ totalPlayed, awayWins, homeWins, gameInSeriesTonight, seriesGames, awayAbbrev, homeAbbrev }: GameTrackerProps) {
  const games = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="flex gap-1.5 mt-2 flex-wrap">
      {games.map(num => {
        const isPlayed = num <= totalPlayed;
        const isTonight = num === gameInSeriesTonight;
        const isFuture = !isPlayed && !isTonight;

        if (isTonight) {
          return (
            <div
              key={num}
              className="flex items-center justify-center rounded"
              style={{
                width: '28px', height: '20px',
                background: 'var(--heat)',
                border: 'none',
                color: '#fff',
              }}
            >
              <span style={{ fontSize: '0.55rem', fontWeight: 900 }}>G{num}</span>
            </div>
          );
        }

        if (isPlayed) {
          const gameData = seriesGames.find(sg => sg.gameNum === num);
          if (gameData) {
            const awayWon = gameData.seriesAwayScore > gameData.seriesHomeScore;
            const winnerAbbrev = awayWon ? awayAbbrev : homeAbbrev;
            const score = `${gameData.seriesAwayScore}–${gameData.seriesHomeScore}`;
            return (
              <div
                key={num}
                className="flex flex-col items-center justify-center rounded"
                style={{
                  width: '48px', height: '34px',
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                }}
              >
                <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{winnerAbbrev}</span>
                <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.1 }}>{score}</span>
              </div>
            );
          }
          // Fallback if no gameData found
          return (
            <div
              key={num}
              className="flex items-center justify-center rounded"
              style={{
                width: '28px', height: '20px',
                background: 'rgba(255,255,255,0.12)',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              <span style={{ fontSize: '0.6rem', fontWeight: 700 }}>{num}</span>
            </div>
          );
        }

        if (isFuture) {
          return (
            <div
              key={num}
              className="flex items-center justify-center rounded"
              style={{
                width: '28px', height: '20px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.2)',
              }}
            >
              <span style={{ fontSize: '0.55rem' }}>—</span>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

// ── Compact other-series row ───────────────────────────────────────────────────

function OtherSeriesRow({ s }: { s: SeriesInfo }) {
  const leaderW = Math.max(s.awayWins, s.homeWins);
  const trailingW = Math.min(s.awayWins, s.homeWins);
  const leaderAbbrev = s.awayWins >= s.homeWins ? s.awayTeam.abbrev : s.homeTeam.abbrev;

  const statusLabel = s.isComplete
    ? `${leaderAbbrev} wins`
    : leaderW === trailingW
    ? `Tied ${leaderW}–${trailingW}`
    : `${leaderAbbrev} leads ${leaderW}–${trailingW}`;

  const nextGameNum = s.nextGame ? s.awayWins + s.homeWins + 1 : null;

  return (
    <div
      className="flex items-center justify-between gap-2 rounded-xl border px-4 py-3"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamLogoUrl(s.awayTeam.abbrev)} alt={s.awayTeam.abbrev} className="w-6 h-6 flex-shrink-0" />
        <span className="text-sm font-black" style={{ color: s.awayWins > s.homeWins ? 'var(--text-bright)' : 'var(--text)', opacity: s.awayWins < s.homeWins && s.isComplete ? 0.4 : 1 }}>
          {s.awayTeam.abbrev}
        </span>
        <span className="text-base font-black font-mono" style={{ color: 'var(--text-bright)' }}>
          {s.awayWins}
        </span>
        <span className="text-sm" style={{ color: 'var(--text)', opacity: 0.3 }}>—</span>
        <span className="text-base font-black font-mono" style={{ color: 'var(--text-bright)' }}>
          {s.homeWins}
        </span>
        <span className="text-sm font-black" style={{ color: s.homeWins > s.awayWins ? 'var(--text-bright)' : 'var(--text)', opacity: s.homeWins < s.awayWins && s.isComplete ? 0.4 : 1 }}>
          {s.homeTeam.abbrev}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamLogoUrl(s.homeTeam.abbrev)} alt={s.homeTeam.abbrev} className="w-6 h-6 flex-shrink-0" />
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-sm font-semibold" style={{ color: s.isComplete ? 'var(--neon)' : 'var(--text)', opacity: s.isComplete ? 0.9 : 0.5 }}>
          {statusLabel}
        </span>
        {!s.isComplete && nextGameNum !== null && s.nextGame && (
          <Link
            href={gameUrl(s.nextGame.id, s.awayTeam.abbrev, s.homeTeam.abbrev, s.nextGame.game_date)}
            className="text-xs font-semibold"
            style={{ color: 'var(--heat)' }}
          >
            Game {nextGameNum} →
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Main PlayoffHero component ────────────────────────────────────────────────

export default function PlayoffHero({ seriesMap, rankings, todayGames, predMap, goalies, newcomers }: PlayoffHeroProps) {
  if (seriesMap.size === 0) return null;

  const heatMap = buildTeamHeatMap(rankings);
  const allSeries = [...seriesMap.values()];

  // Find all series that have a game tonight
  const todayAbbrevsSet = new Set<string>();
  for (const g of todayGames) {
    if (g.awayTeam?.abbrev) todayAbbrevsSet.add(g.awayTeam.abbrev);
    if (g.homeTeam?.abbrev) todayAbbrevsSet.add(g.homeTeam.abbrev);
  }

  // Score each series by combined top-3 Heat of both teams
  const activeSeries = allSeries.filter(s => !s.isComplete);

  // Prefer series with a game tonight
  const seriesTonight = activeSeries.filter(s =>
    todayAbbrevsSet.has(s.awayTeam.abbrev) || todayAbbrevsSet.has(s.homeTeam.abbrev)
  );

  const candidateSeries = seriesTonight.length > 0 ? seriesTonight : activeSeries;

  // Score and pick the featured series
  let featured: SeriesInfo | null = null;
  let bestScore = -1;
  for (const s of candidateSeries) {
    const score = teamHeatScore(s.awayTeam.abbrev, heatMap) + teamHeatScore(s.homeTeam.abbrev, heatMap);
    if (score > bestScore) { bestScore = score; featured = s; }
  }

  if (!featured) {
    // Fall back to any series (even completed)
    featured = allSeries[0] ?? null;
  }
  if (!featured) return null;

  // Get tonight's game for the featured series
  const featuredTodayGame = todayGames.find((g: { awayTeam?: { abbrev?: string }; homeTeam?: { abbrev?: string } }) =>
    (g.awayTeam?.abbrev === featured!.awayTeam.abbrev || g.awayTeam?.abbrev === featured!.homeTeam.abbrev) &&
    (g.homeTeam?.abbrev === featured!.awayTeam.abbrev || g.homeTeam?.abbrev === featured!.homeTeam.abbrev)
  ) ?? null;

  const featuredPred = featuredTodayGame ? predMap[featuredTodayGame.id] ?? null : null;

  // Determine which team in the game is the "featured series" home team
  const featuredGameHomeAbbrev = featuredTodayGame?.homeTeam?.abbrev ?? null;
  const featuredHomeIsSeriesHome = featuredGameHomeAbbrev === featured.homeTeam.abbrev;

  // home_win_probability is relative to the game's home team, not the series home team
  const rawHomeProb = featuredPred?.home_win_probability ?? null;

  // Probability that the featured series' "awayTeam" wins tonight's game
  let awayWinProbTonight: number | null = null;
  if (rawHomeProb !== null) {
    awayWinProbTonight = featuredHomeIsSeriesHome ? (1 - rawHomeProb) : rawHomeProb;
  }

  // Series leader = team with more wins
  const awayLeads = featured.awayWins > featured.homeWins;
  const tied = featured.awayWins === featured.homeWins;
  const leaderAbbrev = awayLeads ? featured.awayTeam.abbrev : featured.homeTeam.abbrev;
  const leaderWins = Math.max(featured.awayWins, featured.homeWins);
  const trailerWins = Math.min(featured.awayWins, featured.homeWins);

  // Leader's per-game win probability tonight (the leader wants to keep leading)
  let leaderWinProbTonight: number | null = null;
  if (awayWinProbTonight !== null) {
    leaderWinProbTonight = awayLeads ? awayWinProbTonight : (1 - awayWinProbTonight);
  }

  // Series win probability using computeSeriesProb
  // p = per-game prob for the leader; aWins = leader's series wins; bWins = trailer's
  let leaderSeriesProb: number | null = null;
  if (leaderWinProbTonight !== null) {
    leaderSeriesProb = computeSeriesProb(leaderWinProbTonight, leaderWins, trailerWins);
  }

  const trailerAbbrev = awayLeads ? featured.homeTeam.abbrev : featured.awayTeam.abbrev;
  const trailerSeriesProb = leaderSeriesProb !== null ? 1 - leaderSeriesProb : null;

  // Tonight's game number
  const gameInSeriesTonight = featured.totalPlayed + 1;

  // Status line
  const seriesStatusLine = featured.isComplete
    ? `${leaderAbbrev} won the series ${leaderWins}–${trailerWins}`
    : tied
    ? `Series tied ${leaderWins}–${trailerWins}`
    : `${leaderAbbrev} lead ${leaderWins}–${trailerWins}`;

  // Team background colors
  const awayBg = TEAM_COLORS[featured.awayTeam.abbrev] ?? 'var(--bg-card)';
  const homeBg = TEAM_COLORS[featured.homeTeam.abbrev] ?? 'var(--bg-card)';

  // All OTHER active series (not featured)
  const otherSeries = allSeries
    .filter(s => !(s.awayTeam.abbrev === featured!.awayTeam.abbrev && s.homeTeam.abbrev === featured!.homeTeam.abbrev && s.round === featured!.round))
    .filter(s => !s.isComplete);

  // Current round (max round of active series)
  const currentRound = activeSeries.length > 0
    ? Math.max(...activeSeries.map(s => s.round))
    : featured.round;

  // Subtext
  const subtext = featuredPred && leaderWinProbTonight !== null && leaderSeriesProb !== null
    ? `We've got ${leaderAbbrev} at ${Math.round(leaderWinProbTonight * 100)}% to win tonight — and ${Math.round(leaderSeriesProb * 100)}% to take the series.`
    : null;

  // Game-time display
  function formatTime(utc: string): string {
    try {
      return new Date(utc).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York'
      });
    } catch { return ''; }
  }

  const gameTime = featuredTodayGame?.startTimeUTC ? formatTime(featuredTodayGame.startTimeUTC) : null;
  const featuredAwayAbbrev = featuredTodayGame?.awayTeam?.abbrev ?? featured.awayTeam.abbrev;
  const featuredHomeAbbrevDisplay = featuredTodayGame?.homeTeam?.abbrev ?? featured.homeTeam.abbrev;

  return (
    <section className="flex flex-col gap-6">

      {/* Hero headline */}
      <div>
        <p className="text-xs font-bold tracking-widest uppercase mb-2"
          style={{ color: 'var(--heat)' }}>
          ● STANLEY CUP PLAYOFFS · {CONF_LABELS[featured.round] ?? `ROUND ${featured.round}`} · NIGHT {gameInSeriesTonight > 7 ? 7 : gameInSeriesTonight}
        </p>
        <h2 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', letterSpacing: '-0.03em', lineHeight: 1.0, color: 'var(--text-bright)' }}>
          Game {gameInSeriesTonight} tonight:{' '}
          <span style={{ color: 'var(--heat)' }}>{seriesStatusLine}.</span>
        </h2>
        {subtext && (
          <p className="mt-2 text-sm" style={{ color: 'var(--text)', opacity: 0.7 }}>
            {subtext}
          </p>
        )}
      </div>

      {/* Desktop two-column */}
      <div className="flex flex-col md:flex-row gap-4">

        {/* Left: featured series card (~60%) */}
        <div
          className="flex-1 rounded-xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${awayBg} 0%, rgba(13,15,20,0.95) 40%, ${homeBg} 100%)`,
            border: '1px solid var(--border)',
            minHeight: '180px',
            position: 'relative',
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0" style={{ background: 'rgba(8,8,12,0.55)' }} />

          <div className="relative z-10 p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text)', opacity: 0.5 }}>
                {ROUND_LABELS[featured.round] ?? `Round ${featured.round}`}
              </span>
              <span className="text-xs font-semibold" style={{ color: 'var(--text)', opacity: 0.4 }}>
                BEST OF 7
              </span>
            </div>

            {/* Teams + score */}
            <div className="flex items-center justify-between gap-4">
              {/* Away team */}
              <div className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={teamLogoUrl(featured.awayTeam.abbrev)} alt={featured.awayTeam.abbrev}
                  style={{ width: '52px', height: '52px' }} />
                <span className="text-sm font-black" style={{ color: '#fff' }}>{featured.awayTeam.name}</span>
                {featured.isComplete && featured.awayWins > featured.homeWins && (
                  <span className="text-xs font-semibold" style={{ color: 'var(--neon)' }}>WINS</span>
                )}
                {!featured.isComplete && featured.awayWins > featured.homeWins && (
                  <span className="text-xs font-semibold" style={{ color: 'var(--heat)' }}>LEADS</span>
                )}
                {!featured.isComplete && !tied && featured.awayWins < featured.homeWins && (
                  <span className="text-xs font-semibold" style={{ color: 'var(--text)', opacity: 0.45 }}>TRAILS</span>
                )}
              </div>

              {/* Score */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black font-mono" style={{ color: featured.awayWins > featured.homeWins ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                    {featured.awayWins}
                  </span>
                  <span className="text-lg" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                  <span className="text-3xl font-black font-mono" style={{ color: featured.homeWins > featured.awayWins ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                    {featured.homeWins}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {tied ? 'Series tied' : `${leaderAbbrev} leads`}
                </p>
              </div>

              {/* Home team */}
              <div className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={teamLogoUrl(featured.homeTeam.abbrev)} alt={featured.homeTeam.abbrev}
                  style={{ width: '52px', height: '52px' }} />
                <span className="text-sm font-black" style={{ color: '#fff' }}>{featured.homeTeam.name}</span>
                {featured.isComplete && featured.homeWins > featured.awayWins && (
                  <span className="text-xs font-semibold" style={{ color: 'var(--neon)' }}>WINS</span>
                )}
                {!featured.isComplete && featured.homeWins > featured.awayWins && (
                  <span className="text-xs font-semibold" style={{ color: 'var(--heat)' }}>LEADS</span>
                )}
                {!featured.isComplete && !tied && featured.homeWins < featured.awayWins && (
                  <span className="text-xs font-semibold" style={{ color: 'var(--text)', opacity: 0.45 }}>TRAILS</span>
                )}
              </div>
            </div>

            {/* Game tracker */}
            <GameTracker
              totalPlayed={featured.totalPlayed}
              awayWins={featured.awayWins}
              homeWins={featured.homeWins}
              gameInSeriesTonight={featured.isComplete ? null : gameInSeriesTonight}
              seriesGames={featured.seriesGames}
              awayAbbrev={featured.awayTeam.abbrev}
              homeAbbrev={featured.homeTeam.abbrev}
            />

            {/* Full bracket link */}
            <div className="mt-3">
              <a href="/playoffs" className="text-xs font-semibold" style={{ color: 'var(--heat)' }}>
                Full bracket →
              </a>
            </div>
          </div>
        </div>

        {/* Right: probability panel (~40%) */}
        <div
          className="md:w-80 flex-shrink-0 rounded-xl border p-5 flex flex-col gap-4"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--text)', opacity: 0.4 }}>
              TONIGHT · GAME {gameInSeriesTonight}
            </p>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text)', opacity: 0.6 }}>
              Win probability
              {gameTime && (
                <span className="ml-2 font-mono" style={{ color: 'var(--text)', opacity: 0.4 }}>
                  {featuredAwayAbbrev} @ {featuredHomeAbbrevDisplay} · {gameTime}
                </span>
              )}
            </p>

            {leaderWinProbTonight !== null ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black font-mono" style={{ color: 'var(--heat)' }}>
                    {leaderAbbrev} {Math.round(leaderWinProbTonight * 100)}%
                  </span>
                  <span className="text-sm font-mono" style={{ color: 'var(--text)', opacity: 0.4 }}>
                    {trailerAbbrev} {Math.round((1 - leaderWinProbTonight) * 100)}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="flex rounded-full overflow-hidden" style={{ height: '6px', background: 'var(--border)' }}>
                  <div style={{ width: `${Math.round(leaderWinProbTonight * 100)}%`, background: 'var(--heat)', height: '100%' }} />
                </div>
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text)', opacity: 0.4 }}>No prediction available</p>
            )}
          </div>

          {leaderSeriesProb !== null && (
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--text)', opacity: 0.4 }}>
                Series odds
              </p>
              <div className="flex flex-col gap-2">
                {/* Leader */}
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={teamLogoUrl(leaderAbbrev)} alt={leaderAbbrev} style={{ width: 20, height: 20, flexShrink: 0 }} />
                  <div className="flex-1 flex rounded-full overflow-hidden" style={{ height: '5px', background: 'var(--border)' }}>
                    <div style={{ width: `${Math.round(leaderSeriesProb * 100)}%`, background: 'var(--heat)', height: '100%' }} />
                  </div>
                  <span className="text-xs font-mono font-bold" style={{ color: 'var(--heat)', minWidth: '32px', textAlign: 'right' }}>
                    {Math.round(leaderSeriesProb * 100)}%
                  </span>
                </div>
                {/* Trailer */}
                {trailerSeriesProb !== null && (
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={teamLogoUrl(trailerAbbrev)} alt={trailerAbbrev} style={{ width: 20, height: 20, flexShrink: 0 }} />
                    <div className="flex-1 flex rounded-full overflow-hidden" style={{ height: '5px', background: 'var(--border)' }}>
                      <div style={{ width: `${Math.round(trailerSeriesProb * 100)}%`, background: 'rgba(255,255,255,0.2)', height: '100%' }} />
                    </div>
                    <span className="text-xs font-mono" style={{ color: 'var(--text)', opacity: 0.5, minWidth: '32px', textAlign: 'right' }}>
                      {Math.round(trailerSeriesProb * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Link to game page */}
          {featuredTodayGame && (
            <Link
              href={gameUrl(featuredTodayGame.id, featuredAwayAbbrev, featuredHomeAbbrevDisplay, featuredTodayGame.gameDate ?? '')}
              className="text-xs font-semibold"
              style={{ color: 'var(--neon)' }}
            >
              Game preview →
            </Link>
          )}
        </div>
      </div>

      {/* Players to watch */}
      {(() => {
        const awayAbbrev = featured.awayTeam.abbrev;
        const homeAbbrev = featured.homeTeam.abbrev;

        // Top 3 Heat skaters per team (rankings already sorted by momentum_ppm descending in caller)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const awaySkaters = (rankings as any[])
          .filter((r: any) => r.players?.teams?.abbrev === awayAbbrev)
          .slice(0, 3);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const homeSkaters = (rankings as any[])
          .filter((r: any) => r.players?.teams?.abbrev === homeAbbrev)
          .slice(0, 3);

        // Top goalie whose team is one of the two featured teams
        // GoaliePlayer shape: { id, first_name, last_name, teams: { abbrev }, avgSavePct, ... }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const featuredGoalie = (goalies as any[]).find((g: any) =>
          g.teams?.abbrev === awayAbbrev || g.teams?.abbrev === homeAbbrev
        ) ?? null;

        // Top newcomer whose team is one of the two featured teams
        // NewcomerPlayer shape: { player_id, momentum_ppm, players: { first_name, last_name, teams: { abbrev } } }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const featuredNewcomer = (newcomers as any[]).find((n: any) =>
          n.players?.teams?.abbrev === awayAbbrev || n.players?.teams?.abbrev === homeAbbrev
        ) ?? null;

        if (awaySkaters.length === 0 && homeSkaters.length === 0 && !featuredGoalie && !featuredNewcomer) {
          return null;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function SkaterRow({ player, rank }: { player: any; rank: number }) {
          const lastName = (player.players?.last_name ?? `${player.players?.first_name ?? ''} ${player.players?.last_name ?? ''}`.trim().split(' ').pop() ?? '—');
          const heat = ppmToHeat(player.momentum_ppm ?? 0);
          return (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono" style={{ color: 'var(--text)', opacity: 0.4, minWidth: '14px' }}>{rank}</span>
              <span className="flex-1 text-sm font-semibold truncate" style={{ color: 'var(--text-bright)' }}>{lastName}</span>
              <span style={{
                fontSize: '0.65rem', fontWeight: 900, color: '#fff',
                background: heatColor(heat), borderRadius: '4px', padding: '1px 5px',
                flexShrink: 0,
              }}>{heat}</span>
            </div>
          );
        }

        return (
          <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text)', opacity: 0.4 }}>PLAYERS TO WATCH</p>

            {/* Two-column skater list */}
            {(awaySkaters.length > 0 || homeSkaters.length > 0) && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Away team */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={teamLogoUrl(awayAbbrev)} alt={awayAbbrev} style={{ width: '16px', height: '16px' }} />
                    <span className="text-xs font-black" style={{ color: 'var(--text-bright)' }}>{awayAbbrev}</span>
                    <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.4 }}>TOP SKATERS</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {awaySkaters.map((p: any, i: number) => (
                      <SkaterRow key={p.player_id ?? i} player={p} rank={i + 1} />
                    ))}
                    {awaySkaters.length === 0 && (
                      <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.3 }}>No data</span>
                    )}
                  </div>
                </div>

                {/* Home team */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={teamLogoUrl(homeAbbrev)} alt={homeAbbrev} style={{ width: '16px', height: '16px' }} />
                    <span className="text-xs font-black" style={{ color: 'var(--text-bright)' }}>{homeAbbrev}</span>
                    <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.4 }}>TOP SKATERS</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {homeSkaters.map((p: any, i: number) => (
                      <SkaterRow key={p.player_id ?? i} player={p} rank={i + 1} />
                    ))}
                    {homeSkaters.length === 0 && (
                      <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.3 }}>No data</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Goalie + Newcomer small cards */}
            {(featuredGoalie || featuredNewcomer) && (
              <div className="grid grid-cols-2 gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                {/* Top Goalie */}
                {featuredGoalie && (
                  <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                    <p className="text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: 'var(--text)', opacity: 0.4 }}>TOP GOALIE</p>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {featuredGoalie.teams?.abbrev && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={teamLogoUrl(featuredGoalie.teams.abbrev)} alt={featuredGoalie.teams.abbrev} style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                        )}
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-bright)' }}>
                          {featuredGoalie.last_name ?? '—'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold flex-shrink-0" style={{ color: 'var(--neon)' }}>
                        .{String(Math.round((featuredGoalie.avgSavePct ?? 0) * 1000)).padStart(3, '0')}
                      </span>
                    </div>
                  </div>
                )}
                {!featuredGoalie && <div />}

                {/* Fresh face */}
                {featuredNewcomer && (
                  <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                    <p className="text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: 'var(--text)', opacity: 0.4 }}>FRESH FACE</p>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {featuredNewcomer.players?.teams?.abbrev && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={teamLogoUrl(featuredNewcomer.players.teams.abbrev)} alt={featuredNewcomer.players.teams.abbrev} style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                        )}
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-bright)' }}>
                          {featuredNewcomer.players?.last_name ?? '—'}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 900, color: '#fff',
                        background: heatColor(ppmToHeat(featuredNewcomer.momentum_ppm ?? 0)),
                        borderRadius: '4px', padding: '1px 5px', flexShrink: 0,
                      }}>{ppmToHeat(featuredNewcomer.momentum_ppm ?? 0)}</span>
                    </div>
                  </div>
                )}
                {!featuredNewcomer && <div />}
              </div>
            )}
          </div>
        );
      })()}

      {/* Other series */}
      {otherSeries.length > 0 && (
        <div>
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text)', opacity: 0.4 }}>
            OTHER SERIES · {CONF_LABELS[currentRound] ?? `ROUND ${currentRound}`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {otherSeries.sort((a, b) => a.seriesNum - b.seriesNum).map(s => (
              <OtherSeriesRow key={`${s.round}-${s.seriesNum}`} s={s} />
            ))}
          </div>
        </div>
      )}

    </section>
  );
}
