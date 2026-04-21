import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchMatch, teamLogoUrl } from '@/lib/data';
import { teamUrl, playerUrl } from '@/lib/urls';
import { decimalToNormProb, formatBookmaker } from '@/lib/odds-api';

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { game } = await fetchMatch(id).catch(() => ({ game: null, liveData: null, predictions: null, snapshots: null, playerStats: null, goalieStats: null }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const away = (game?.away_team as any)?.abbrev ?? 'Away';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const home = (game?.home_team as any)?.abbrev ?? 'Home';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awayName = (game?.away_team as any)?.name ?? away;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeName = (game?.home_team as any)?.name ?? home;
  const date = game?.game_date ? ` · ${game.game_date.slice(5)}` : '';
  const title = `${away} at ${home}${date}`;
  return {
    title,
    description: `${awayName} at ${homeName}${date} — momentum-based prediction, win probability, and lineup analysis on NHL Momentum.`,
    openGraph: {
      title: `${title} — NHL Momentum`,
      description: `${awayName} at ${homeName} — game prediction, expected goals, win probability, and player momentum inputs.`,
      images: [{ url: teamLogoUrl(home), width: 80, height: 80, alt: home }],
    },
  };
}

export default async function MatchPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  const { game, liveData, predictions, snapshots, playerStats, goalieStats, externalOdds } = await fetchMatch(id);

  // Resolve team info from live data or DB game
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const live = liveData as any;
  const homeAbbrev: string = live?.homeTeam?.abbrev ?? game?.home_team?.abbrev ?? '?';
  const awayAbbrev: string = live?.awayTeam?.abbrev ?? game?.away_team?.abbrev ?? '?';
  const homeName: string   = live?.homeTeam?.name?.default ?? game?.home_team?.name ?? homeAbbrev;
  const awayName: string   = live?.awayTeam?.name?.default ?? game?.away_team?.name ?? awayAbbrev;
  const homeLogo = live?.homeTeam?.logo ?? teamLogoUrl(homeAbbrev);
  const awayLogo = live?.awayTeam?.logo ?? teamLogoUrl(awayAbbrev);
  const homeId   = game?.home_team_id ?? live?.homeTeam?.id;
  const awayId   = game?.away_team_id ?? live?.awayTeam?.id;

  const homeScore = live?.homeTeam?.score ?? game?.home_score ?? null;
  const awayScore = live?.awayTeam?.score ?? game?.away_score ?? null;
  const gameState = live?.gameState ?? game?.game_state ?? 'FUT';
  const isLive    = gameState === 'LIVE' || gameState === 'CRIT';
  const isFinal   = gameState === 'FINAL' || gameState === 'OFF';
  const gameDate  = game?.game_date ?? live?.gameDate ?? '';

  const prediction = predictions?.[0] ?? null;
  const outcome    = prediction?.prediction_outcomes?.[0] ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const threeStars: any[] = (game as any)?.three_stars ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamGameStats: any[] = (game as any)?.team_game_stats ?? [];
  const youtubeId: string | null = (game as any)?.youtube_highlight_id ?? null;

  // Construct NHL.com gamecenter link
  const nhlUrl = game?.id && gameDate
    ? `https://www.nhl.com/gamecenter/${awayAbbrev.toLowerCase()}-vs-${homeAbbrev.toLowerCase()}/${gameDate.replaceAll('-', '/')}/${game.id}`
    : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeSnap = (snapshots ?? []).find((s: any) => s.is_home);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awaySnap = (snapshots ?? []).find((s: any) => !s.is_home);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeSkaters = (homeSnap?.skater_snapshots as any[]) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awaySkaters = (awaySnap?.skater_snapshots as any[]) ?? [];

  // Split player stats by team (DB — fallback when boxscore unavailable)
  const homeStats = (playerStats ?? []).filter((p: { team_id: number }) => p.team_id === homeId);
  const awayStats = (playerStats ?? []).filter((p: { team_id: number }) => p.team_id === awayId);
  const homeGoalie = (goalieStats ?? []).find((g: { team_id: number }) => g.team_id === homeId);
  const awayGoalie = (goalieStats ?? []).find((g: { team_id: number }) => g.team_id === awayId);

  // Live boxscore stats — available for LIVE, CRIT, and FINAL games directly from the NHL API.
  // This is the primary data source for game stats: it updates every 5 min via the fetch cache,
  // so live games show current stats without waiting for the nightly pipeline.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const liveBoxscore = (live?.playerByGameStats as any) ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function normPlayers(teamPlayers: any, teamId: number): any[] {
    return [
      ...(teamPlayers?.forwards ?? []),
      ...(teamPlayers?.defense ?? []),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ].map((p: any) => {
      const full: string = p.name?.default ?? '';
      const sp = full.indexOf(' ');
      return {
        player_id: p.playerId,
        team_id: teamId,
        goals: p.goals ?? 0,
        assists: p.assists ?? 0,
        plus_minus: p.plusMinus ?? 0,
        players: {
          first_name: sp > 0 ? full.slice(0, sp) : '',
          last_name: sp > 0 ? full.slice(sp + 1) : full,
          position_code: p.position,
        },
      };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).sort((a: any, b: any) => (b.goals + b.assists) - (a.goals + a.assists));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function normGoalie(goalies: any[], teamId: number): any | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (goalies ?? []).find((x: any) => x.starter) ?? goalies?.[0] ?? null;
    if (!g) return null;
    const full: string = g.name?.default ?? '';
    const sp = full.indexOf(' ');
    return {
      player_id: g.playerId,
      team_id: teamId,
      shots_against: g.shotsAgainst ?? 0,
      goals_against: g.goalsAgainst ?? 0,
      save_pct: (g.shotsAgainst ?? 0) > 0 ? (g.saves ?? 0) / g.shotsAgainst : null,
      players: {
        first_name: sp > 0 ? full.slice(0, sp) : '',
        last_name: sp > 0 ? full.slice(sp + 1) : full,
      },
    };
  }
  // Normalize boxscore whenever available — used as primary source for live games
  // and as fallback for final games where the pipeline hasn't run yet.
  const hasBoxscore = liveBoxscore != null;
  const homeBoxPlayers = hasBoxscore ? normPlayers(liveBoxscore.homeTeam, homeId) : null;
  const awayBoxPlayers = hasBoxscore ? normPlayers(liveBoxscore.awayTeam, awayId) : null;
  const homeBoxGoalie  = hasBoxscore ? normGoalie(liveBoxscore.homeTeam?.goalies ?? [], homeId) : null;
  const awayBoxGoalie  = hasBoxscore ? normGoalie(liveBoxscore.awayTeam?.goalies ?? [], awayId) : null;

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0">

      {/* Match header */}
      <div className="rounded-xl border p-4 sm:p-6 mb-4" style={{ background: 'var(--bg-card)', borderColor: isLive ? 'var(--red)' : 'var(--border)' }}>
        <div className="text-center text-xs mb-4 font-mono" style={{ color: isLive ? 'var(--red)' : 'var(--text)' }}>
          {isLive ? '● LIVE' : isFinal ? 'FINAL' : `${gameDate?.slice(5)} · Scheduled`}
          {live?.periodDescriptor?.periodType && (
            <span className="ml-2">· P{live.periodDescriptor.number}</span>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Away team */}
          <Link href={awayId ? teamUrl(awayId, awayName) : '#'} className="flex flex-col items-center gap-2 flex-1 hover:opacity-80">
            <img src={awayLogo} alt={awayAbbrev} className="w-16 h-16 object-contain" />
            <span className="text-sm font-bold" style={{ color: 'var(--text-bright)' }}>{awayAbbrev}</span>
            <span className="text-xs text-center leading-tight" style={{ color: 'var(--text)' }}>{awayName}</span>
          </Link>

          {/* Score */}
          <div className="text-center flex-shrink-0">
            {(isLive || isFinal) && homeScore !== null ? (
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold font-mono" style={{ color: 'var(--text-bright)' }}>{awayScore}</span>
                <span className="text-2xl" style={{ color: 'var(--border)' }}>–</span>
                <span className="text-4xl font-bold font-mono" style={{ color: 'var(--text-bright)' }}>{homeScore}</span>
              </div>
            ) : (
              <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>vs</span>
            )}
            {live?.clock?.timeRemaining && isLive && (
              <div className="text-xs font-mono mt-1" style={{ color: 'var(--amber)' }}>{live.clock.timeRemaining}</div>
            )}
          </div>

          {/* Home team */}
          <Link href={homeId ? teamUrl(homeId, homeName) : '#'} className="flex flex-col items-center gap-2 flex-1 hover:opacity-80">
            <img src={homeLogo} alt={homeAbbrev} className="w-16 h-16 object-contain" />
            <span className="text-sm font-bold" style={{ color: 'var(--text-bright)' }}>{homeAbbrev}</span>
            <span className="text-xs text-center leading-tight" style={{ color: 'var(--text)' }}>{homeName}</span>
          </Link>
        </div>
      </div>

      {/* YouTube highlight embed — shown for completed games once NHL posts the video */}
      {isFinal && youtubeId && (
        <div className="rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '16/9' }}>
          <iframe
            width="100%" height="100%"
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            title={`${awayAbbrev} vs ${homeAbbrev} Highlights`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ display: 'block' }}
          />
        </div>
      )}

      {/* Prediction breakdown */}
      {prediction && (
        <div className="rounded-xl border p-4 mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
              Prediction · {prediction.model_version}
            </h2>
            {outcome && (
              <span className="text-xs px-2 py-0.5 rounded font-semibold"
                style={{
                  background: outcome.correct_winner ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color: outcome.correct_winner ? 'var(--green)' : 'var(--red)',
                }}>
                {outcome.correct_winner ? '✓ Correct' : '✗ Wrong'}
              </span>
            )}
          </div>

          {/* xG scores */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono" style={{ color: 'var(--silver)' }}>
                {prediction.predicted_away_score}
              </div>
              <div className="text-xs" style={{ color: 'var(--text)' }}>xG {awayAbbrev}</div>
            </div>
            <div className="text-xs" style={{ color: 'var(--text)' }}>Expected Score</div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono" style={{ color: 'var(--neon)' }}>
                {prediction.predicted_home_score}
              </div>
              <div className="text-xs" style={{ color: 'var(--text)' }}>xG {homeAbbrev}</div>
            </div>
          </div>

          {/* Win probability bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text)' }}>
              <span style={{ color: 'var(--silver)' }}>{awayAbbrev} {Math.round(prediction.away_win_probability * 100)}%</span>
              <span style={{ color: 'var(--neon)' }}>{homeAbbrev} {Math.round(prediction.home_win_probability * 100)}%</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden">
              <div style={{ flexGrow: Math.round(prediction.away_win_probability * 1000), background: 'var(--silver)' }} />
              <div style={{ flexGrow: Math.round(prediction.home_win_probability * 1000), background: 'var(--neon)' }} />
            </div>
          </div>

          {/* Factor grid */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: 'Offensive Potential', away: prediction.away_offensive_potential, home: prediction.home_offensive_potential },
              { label: 'Defensive Filter',    away: prediction.away_defensive_filter,    home: prediction.home_defensive_filter },
              { label: 'SOS Multiplier',      away: prediction.away_sos_multiplier,      home: prediction.home_sos_multiplier },
              { label: 'Energy Bar',          away: prediction.away_energy_bar,           home: prediction.home_energy_bar },
            ].map(row => (
              <div key={row.label} className="rounded-lg p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div className="text-xs mb-2" style={{ color: 'var(--text)' }}>{row.label}</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono font-bold" style={{ color: 'var(--silver)' }}>
                    {typeof row.away === 'number' ? row.away.toFixed(2) : row.away ?? '—'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text)' }}>{awayAbbrev} / {homeAbbrev}</span>
                  <span className="text-sm font-mono font-bold" style={{ color: 'var(--neon)' }}>
                    {typeof row.home === 'number' ? row.home.toFixed(2) : row.home ?? '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Odds */}
      {externalOdds && externalOdds.length > 0 && (() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allRows = externalOdds as any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = allRows.filter((o: any) => o.home_odds && o.away_odds);
        if (!rows.length) return null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pinnacle = rows.find((o: any) => o.bookmaker === 'pinnacle') ?? rows[0];
        const pinProb  = decimalToNormProb(pinnacle.home_odds, pinnacle.away_odds, pinnacle.draw_odds);
        const pinH  = Math.round(pinProb.home * 100);
        const pinA  = Math.round(pinProb.away * 100);
        const pinOT = pinProb.draw ? Math.round(pinProb.draw * 100) : 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const otherBooks = rows.filter((o: any) => o.bookmaker !== pinnacle.bookmaker);

        const ProbBar = ({ a, h, opacity = 1 }: { a: number; h: number; opacity?: number }) => (
          <div className="flex h-3 rounded-full overflow-hidden" style={{ opacity }}>
            <div style={{ flexGrow: Math.round(a * 1000), background: 'var(--silver)' }} />
            <div style={{ flexGrow: Math.round(h * 1000), background: 'var(--neon)' }} />
          </div>
        );

        return (
          <div className="rounded-xl border p-4 mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
                  Betting Markets
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text)', opacity: 0.6 }}>
                  For reference — {rows.length} bookmaker{rows.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* ── Best bookmaker (full row with prob bar) ── */}
            <div className="rounded-lg p-3 mb-3"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                  <span style={{ color: 'var(--amber)', opacity: 0.7 }}>◆</span>
                  {formatBookmaker(pinnacle.bookmaker)}
                  {pinnacle.bookmaker === 'pinnacle' && (
                    <span className="font-mono px-1 rounded"
                      style={{ background: 'var(--border)', color: 'var(--text)', fontSize: '10px' }}>
                      sharpest
                    </span>
                  )}
                </span>
                <span className="text-xs font-mono" style={{ color: 'var(--text)', opacity: 0.5 }}>
                  hover for odds
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <img src={awayLogo} alt={awayAbbrev} className="w-5 h-5 object-contain flex-shrink-0" />
                <div className="flex-1">
                  <ProbBar a={pinA} h={pinH} opacity={0.6} />
                </div>
                <img src={homeLogo} alt={homeAbbrev} className="w-5 h-5 object-contain flex-shrink-0" />
              </div>
              <div
                className="flex justify-between text-xs font-mono cursor-default"
                title={`${awayAbbrev} ${pinnacle.away_odds.toFixed(2)}${pinnacle.draw_odds ? ` · OT ${pinnacle.draw_odds.toFixed(2)}` : ''} · ${homeAbbrev} ${pinnacle.home_odds.toFixed(2)}`}
              >
                <span style={{ color: pinA >= pinH ? 'var(--neon)' : 'var(--text)', opacity: pinA >= pinH ? 1 : 0.4, fontWeight: pinA >= pinH ? 600 : 400 }}>{awayAbbrev} {pinA}%</span>
                {pinOT > 0 && <span style={{ color: 'var(--text)', opacity: 0.5 }}>OT {pinOT}%</span>}
                <span style={{ color: pinH > pinA ? 'var(--neon)' : 'var(--text)', opacity: pinH > pinA ? 1 : 0.4, fontWeight: pinH > pinA ? 600 : 400 }}>{homeAbbrev} {pinH}%</span>
              </div>
            </div>

            {/* ── Other bookmakers ── */}
            {otherBooks.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {otherBooks.map((o: any) => {
                    const op = decimalToNormProb(o.home_odds, o.away_odds, o.draw_odds);
                    const oH = Math.round(op.home * 100);
                    const oA = Math.round(op.away * 100);
                  return (
                    <div key={o.id} className="rounded-lg p-2.5 flex flex-col gap-1 cursor-default"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                      title={`${awayAbbrev} ${o.away_odds.toFixed(2)}${o.draw_odds ? ` · OT ${o.draw_odds.toFixed(2)}` : ''} · ${homeAbbrev} ${o.home_odds.toFixed(2)}`}
                    >
                      <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                        {formatBookmaker(o.bookmaker)}
                      </span>
                      <div className="flex justify-between text-xs font-mono">
                        <span style={{ color: oA >= oH ? 'var(--neon)' : 'var(--text)', opacity: oA >= oH ? 1 : 0.4, fontWeight: oA >= oH ? 600 : 400 }}>{awayAbbrev} {oA}%</span>
                        <span style={{ color: oH > oA ? 'var(--neon)' : 'var(--text)', opacity: oH > oA ? 1 : 0.4, fontWeight: oH > oA ? 600 : 400 }}>{homeAbbrev} {oH}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs mt-3" style={{ color: 'var(--text)', opacity: 0.4 }}>
              Win % removes bookmaker margin · hover for decimal odds
            </p>
          </div>
        );
      })()}

      {/* Three Stars — only shown for completed games with data */}
      {isFinal && threeStars.length > 0 && (
        <div className="rounded-xl border p-4 mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>Three Stars</h2>
            {nhlUrl && !youtubeId && (
              <a href={nhlUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs px-3 py-1 rounded-full font-medium hover:opacity-80 transition-opacity"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                Watch on NHL.com ↗
              </a>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {threeStars.map((star) => (
              <a key={star.star} href={star.playerId ? `/players/${star.playerId}` : '#'}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:opacity-80 transition-opacity"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <span className="text-xs font-mono" style={{ color: 'var(--amber)' }}>#{star.star} Star</span>
                {star.headshot && (
                  <img src={star.headshot} alt={star.name?.default ?? ''} className="w-12 h-12 rounded-full object-cover" />
                )}
                <span className="text-xs font-semibold text-center leading-tight" style={{ color: 'var(--text-bright)' }}>
                  {star.name?.default ?? ''}
                </span>
                <span className="text-xs" style={{ color: 'var(--text)' }}>
                  {star.position === 'G'
                    ? `${star.savePctg !== undefined ? (star.savePctg * 100).toFixed(1) + '% SV' : ''}`
                    : `${star.points ?? 0}pts (${star.goals ?? 0}G ${star.assists ?? 0}A)`}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Team Box Score — only shown for completed games with data */}
      {isFinal && teamGameStats.length > 0 && (
        <div className="rounded-xl border p-4 mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>Team Stats</h2>
            <div className="flex items-center gap-4 text-xs font-semibold" style={{ color: 'var(--text)' }}>
              <span style={{ color: 'var(--silver)' }}>{awayAbbrev}</span>
              <span style={{ color: 'var(--neon)' }}>{homeAbbrev}</span>
            </div>
          </div>
          <div className="space-y-2">
            {teamGameStats
              .filter(s => ['sog', 'hits', 'faceoffWinningPctg', 'powerPlay', 'blockedShots', 'giveaways', 'takeaways'].includes(s.category))
              .map((stat) => {
                const label: Record<string, string> = {
                  sog: 'Shots on Goal', hits: 'Hits', faceoffWinningPctg: 'Faceoff %',
                  powerPlay: 'Power Play', blockedShots: 'Blocked Shots',
                  giveaways: 'Giveaways', takeaways: 'Takeaways',
                };
                const awayVal = stat.category === 'faceoffWinningPctg'
                  ? `${Math.round(stat.awayValue * 100)}%`
                  : String(stat.awayValue);
                const homeVal = stat.category === 'faceoffWinningPctg'
                  ? `${Math.round(stat.homeValue * 100)}%`
                  : String(stat.homeValue);
                return (
                  <div key={stat.category} className="flex items-center gap-3 text-xs">
                    <span className="font-mono w-10 text-right" style={{ color: 'var(--silver)' }}>{awayVal}</span>
                    <div className="flex-1 text-center" style={{ color: 'var(--text)' }}>{label[stat.category]}</div>
                    <span className="font-mono w-10 text-left" style={{ color: 'var(--neon)' }}>{homeVal}</span>
                  </div>
                );
              })}
          </div>
          {!nhlUrl && null}
          {!threeStars.length && nhlUrl && (
            <a href={nhlUrl} target="_blank" rel="noopener noreferrer"
              className="mt-3 inline-block text-xs px-3 py-1 rounded-full font-medium hover:opacity-80 transition-opacity"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              Watch on NHL.com ↗
            </a>
          )}
        </div>
      )}

      {/* NHL.com link fallback — shown for final games with no stars/stats yet */}
      {isFinal && threeStars.length === 0 && teamGameStats.length === 0 && nhlUrl && (
        <div className="mb-4">
          <a href={nhlUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full font-medium hover:opacity-80 transition-opacity"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            Watch highlights on NHL.com ↗
          </a>
        </div>
      )}

      {/* Side-by-side lineups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* Away lineup */}
        <LineupCard
          abbrev={awayAbbrev}
          teamName={awayName}
          logo={awayLogo}
          skaters={
            isLive  ? (awayBoxPlayers ?? awaySkaters) :          // live: API always
            isFinal ? (awayStats.length ? awayStats : (awayBoxPlayers ?? awaySkaters)) : // final: DB, fallback API
            awaySkaters                                           // pre-game: snapshots
          }
          goalie={
            isLive  ? awayBoxGoalie :
            isFinal ? (awayGoalie ?? awayBoxGoalie) :
            null
          }
          isLive={isLive || isFinal}
          teamId={awayId}
        />

        {/* Home lineup */}
        <LineupCard
          abbrev={homeAbbrev}
          teamName={homeName}
          logo={homeLogo}
          skaters={
            isLive  ? (homeBoxPlayers ?? homeSkaters) :
            isFinal ? (homeStats.length ? homeStats : (homeBoxPlayers ?? homeSkaters)) :
            homeSkaters
          }
          goalie={
            isLive  ? homeBoxGoalie :
            isFinal ? (homeGoalie ?? homeBoxGoalie) :
            null
          }
          isLive={isLive || isFinal}
          teamId={homeId}
        />
      </div>
    </div>
  );
}

function LineupCard({
  abbrev, teamName, logo, skaters, goalie, isLive, teamId,
}: {
  abbrev: string;
  teamName: string;
  logo: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  skaters: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  goalie: any;
  isLive: boolean;
  teamId: number;
}) {
  if (!skaters?.length) return null;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <div className="px-4 py-3 border-b flex items-center gap-2"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <img src={logo} alt={abbrev} className="w-6 h-6 object-contain" />
        <Link href={teamId ? teamUrl(teamId, teamName) : '#'} className="text-sm font-semibold hover:opacity-80" style={{ color: 'var(--text-bright)' }}>
          {abbrev}
        </Link>
        <span className="text-xs" style={{ color: 'var(--text)' }}>
          {isLive ? 'Game Stats' : 'Momentum Inputs'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--bg-card)' }}>
            <tr>
              <th className="px-3 py-1.5 text-left text-xs font-semibold uppercase"
                style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>Player</th>
              {isLive
                ? <>
                    <th className="px-3 py-1.5 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>G</th>
                    <th className="px-3 py-1.5 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>A</th>
                    <th className="px-3 py-1.5 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>Pts</th>
                    <th className="px-3 py-1.5 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>+/-</th>
                  </>
                : <>
                    <th className="px-3 py-1.5 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>cPPM</th>
                    <th className="px-3 py-1.5 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>Nrg</th>
                  </>
              }
            </tr>
          </thead>
          <tbody>
            {skaters.slice(0, 12).map((p, i) => {
              const name = isLive
                ? `${p.players?.first_name?.[0]}. ${p.players?.last_name}`
                : `${p.playerName ?? ''}`;
              const playerId = isLive ? p.player_id : p.playerId;
              const playerHref = isLive && p.player_id && p.players?.first_name
                ? playerUrl(p.player_id, p.players.first_name, p.players.last_name)
                : playerId ? `/players/${playerId}` : '#';
              return (
                <tr key={i} className="border-t"
                  style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)' }}>
                  <td className="px-3 py-1.5">
                    <Link href={playerHref}
                      className="text-xs hover:opacity-80 flex items-center gap-1" style={{ color: 'var(--text-bright)' }}>
                      {name}
                      {p.injuryStatus && (
                        <span className="text-xs px-1 py-0.5 rounded font-bold"
                          style={{ background: 'rgba(239,68,68,0.18)', color: 'var(--red)' }}>
                          INJURED
                        </span>
                      )}
                    </Link>
                  </td>
                  {isLive
                    ? <>
                        <td className="px-3 py-1.5 text-right font-mono text-xs" style={{ color: 'var(--text-bright)' }}>{p.goals ?? 0}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-xs" style={{ color: 'var(--text-bright)' }}>{p.assists ?? 0}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-xs font-bold" style={{ color: 'var(--neon)' }}>
                          {(p.goals ?? 0) + (p.assists ?? 0)}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-xs" style={{ color: Number(p.plus_minus) > 0 ? 'var(--green)' : Number(p.plus_minus) < 0 ? 'var(--red)' : 'var(--text)' }}>
                          {Number(p.plus_minus) > 0 ? `+${p.plus_minus}` : p.plus_minus ?? 0}
                        </td>
                      </>
                    : <>
                        <td className="px-3 py-1.5 text-right font-mono text-xs" style={{ color: 'var(--neon)' }}>
                          {Number(p.compositePpm ?? 0).toFixed(4)}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-xs" style={{ color: 'var(--amber)' }}>
                          {p.energyBar ?? 100}
                        </td>
                      </>
                  }
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Goalie row */}
      {goalie && (
        <div className="px-4 py-2 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <span className="text-xs" style={{ color: 'var(--text)' }}>
            G: {goalie.players?.first_name?.[0]}. {goalie.players?.last_name}
          </span>
          <span className="text-xs font-mono" style={{ color: 'var(--silver)' }}>
            {goalie.shots_against - goalie.goals_against}/{goalie.shots_against} SV
            · {goalie.save_pct ? (Number(goalie.save_pct) * 100).toFixed(1) : '—'}%
          </span>
        </div>
      )}
    </div>
  );
}
