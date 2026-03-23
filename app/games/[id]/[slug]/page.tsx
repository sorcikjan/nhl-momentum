import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchMatch, teamLogoUrl } from '@/lib/data';
import { teamUrl, playerUrl } from '@/lib/urls';

export const dynamic = 'force-dynamic';

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
  const { game, liveData, predictions, snapshots, playerStats, goalieStats } = await fetchMatch(id);

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
  const homeSnap = (snapshots ?? []).find((s: any) => s.is_home);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awaySnap = (snapshots ?? []).find((s: any) => !s.is_home);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeSkaters = (homeSnap?.skater_snapshots as any[]) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awaySkaters = (awaySnap?.skater_snapshots as any[]) ?? [];

  // Split player stats by team
  const homeStats = (playerStats ?? []).filter((p: { team_id: number }) => p.team_id === homeId);
  const awayStats = (playerStats ?? []).filter((p: { team_id: number }) => p.team_id === awayId);
  const homeGoalie = (goalieStats ?? []).find((g: { team_id: number }) => g.team_id === homeId);
  const awayGoalie = (goalieStats ?? []).find((g: { team_id: number }) => g.team_id === awayId);

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0">

      {/* Match header */}
      <div className="rounded-xl border p-6 mb-4" style={{ background: 'var(--bg-card)', borderColor: isLive ? 'var(--red)' : 'var(--border)' }}>
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
              {prediction.ot_probability > 0 && (
                <span>OT {Math.round(prediction.ot_probability * 100)}%</span>
              )}
              <span style={{ color: 'var(--neon)' }}>{homeAbbrev} {Math.round(prediction.home_win_probability * 100)}%</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden">
              <div style={{ width: `${prediction.away_win_probability * 100}%`, background: 'var(--silver)' }} />
              {prediction.ot_probability > 0 && (
                <div style={{ width: `${prediction.ot_probability * 100}%`, background: 'var(--amber)' }} />
              )}
              <div style={{ width: `${prediction.home_win_probability * 100}%`, background: 'var(--neon)' }} />
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

      {/* Side-by-side lineups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* Away lineup */}
        <LineupCard
          abbrev={awayAbbrev}
          teamName={awayName}
          logo={awayLogo}
          skaters={isFinal ? awayStats : awaySkaters}
          goalie={isFinal ? awayGoalie : null}
          isLive={isFinal}
          teamId={awayId}
        />

        {/* Home lineup */}
        <LineupCard
          abbrev={homeAbbrev}
          teamName={homeName}
          logo={homeLogo}
          skaters={isFinal ? homeStats : homeSkaters}
          goalie={isFinal ? homeGoalie : null}
          isLive={isFinal}
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
                      className="text-xs hover:opacity-80" style={{ color: 'var(--text-bright)' }}>
                      {name}
                    </Link>
                    {p.injuryStatus && (
                      <span className="ml-1 text-xs" style={{ color: 'var(--red)' }}>IR</span>
                    )}
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
