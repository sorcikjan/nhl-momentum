import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchTeam, teamLogoUrl } from '@/lib/data';
import { playerUrl, gameUrl } from '@/lib/urls';

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { team, standing } = await fetchTeam(id).catch(() => ({ team: null, roster: [], recentGames: null, upcoming: null, seasonStats: null, standing: null }));
  if (!team) return { title: 'Team' };
  const record = standing ? `${standing.wins}–${standing.losses}–${standing.otLosses}` : '';
  return {
    title: team.name,
    description: `${team.name} (${team.conference} · ${team.division} Division${record ? ' · ' + record : ''}) — roster momentum, energy bar, and schedule on NHL Momentum.`,
    openGraph: {
      title: `${team.name} — NHL Momentum`,
      description: `${team.name} team profile — top skaters by momentum, roster energy, recent results, and upcoming games.`,
      images: [{ url: teamLogoUrl(team.abbrev), width: 80, height: 80, alt: team.name }],
    },
  };
}

export default async function TeamPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  const { team, roster, recentGames, upcoming, standing } = await fetchTeam(id);

  if (!team) return <p style={{ color: 'var(--text)' }}>Team not found</p>;

  const logo = teamLogoUrl(team.abbrev);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skaters = roster.filter((p: any) => p.players?.position_code !== 'G');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goalies  = roster.filter((p: any) => p.players?.position_code === 'G');

  const avgEnergy = roster.length
    ? Math.round(roster.reduce((s: number, p: { energy_bar: number }) => s + (p.energy_bar ?? 100), 0) / roster.length)
    : 100;

  const energyHex   = avgEnergy >= 70 ? '#22c55e' : avgEnergy >= 40 ? '#f59e0b' : '#ef4444';
  const energyColor = avgEnergy >= 70 ? 'var(--green)' : avgEnergy >= 40 ? 'var(--amber)' : 'var(--red)';

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0">

      {/* Team header */}
      <div className="flex items-center gap-5 mb-6">
        <img src={logo} alt={team.abbrev} className="w-20 h-20 object-contain" />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>{team.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: 'var(--text)' }}>
            {team.conference && <span>{team.conference}</span>}
            {team.division && <><span>·</span><span>{team.division} Division</span></>}
            {standing && (
              <>
                <span>·</span>
                <span style={{ color: 'var(--neon)' }}>
                  {standing.wins}–{standing.losses}–{standing.otLosses}
                </span>
                <span>·</span>
                <span>{standing.points} pts</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Team energy */}
      <div className="rounded-xl border p-4 mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text)' }}>
            Roster Energy
          </span>
          <span className="text-xs font-mono font-bold" style={{ color: energyColor }}>{avgEnergy}/100</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-2 rounded-full" style={{ width: `${avgEnergy}%`, background: `linear-gradient(90deg, ${energyHex}, ${energyHex}88)` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* Top skaters */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-3 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
              Top Skaters · Momentum
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {skaters.slice(0, 8).map((p: any, i: number) => (
              <Link key={p.player_id}
                href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
                className="flex items-center gap-3 px-4 py-2.5 hover:opacity-80 transition-opacity"
                style={{ background: 'var(--bg)' }}>
                {p.players.headshot_url
                  ? <img src={p.players.headshot_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'var(--border)', color: 'var(--text)' }}>
                      {p.players.position_code}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-bright)' }}>
                    {p.players.first_name} {p.players.last_name}
                    {p.players.injury_status && (
                      <span className="ml-1 text-xs" style={{ color: 'var(--red)' }}>IR</span>
                    )}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text)' }}>
                    #{i + 1} on team &middot; {p.players.position_code}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold font-mono" style={{ color: 'var(--neon)' }}>
                    {Number(p.momentum_ppm).toFixed(4)}
                  </div>
                  <div className="text-xs font-mono" style={{ color: Number(p.breakout_delta) > 0 ? 'var(--green)' : 'var(--red)' }}>
                    {Number(p.breakout_delta) > 0 ? '+' : ''}{Number(p.breakout_delta).toFixed(4)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Goalies + upcoming games */}
        <div className="flex flex-col gap-4">
          {/* Goalies */}
          {goalies.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="px-4 py-3 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>Goalies</h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {goalies.slice(0, 3).map((p: any) => (
                  <Link key={p.player_id}
                    href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:opacity-80"
                    style={{ background: 'var(--bg)' }}>
                    {p.players.headshot_url
                      ? <img src={p.players.headshot_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: 'var(--border)', color: 'var(--text)' }}>G</div>
                    }
                    <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
                      {p.players.first_name} {p.players.last_name}
                    </span>
                    <span className="text-xs font-mono" style={{ color: 'var(--silver)' }}>
                      G
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming games */}
          {(upcoming ?? []).length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="px-4 py-3 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>Upcoming</h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(upcoming ?? []).map((g: any) => {
                  const isHome = g.home_team?.id === Number(id);
                  const opp = isHome ? g.away_team : g.home_team;
                  return (
                    <Link key={g.id}
                      href={gameUrl(g.id, g.away_team?.abbrev ?? '', g.home_team?.abbrev ?? '', g.game_date)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:opacity-80"
                      style={{ background: 'var(--bg)' }}>
                      <img src={teamLogoUrl(opp?.abbrev ?? '')} alt={opp?.abbrev} className="w-6 h-6 object-contain" />
                      <span className="flex-1 text-sm" style={{ color: 'var(--text-bright)' }}>
                        {isHome ? 'vs' : '@'} {opp?.abbrev}
                      </span>
                      <span className="text-xs font-mono" style={{ color: 'var(--text)' }}>
                        {g.game_date?.slice(5)}
                      </span>
                      {g.game_state === 'LIVE' && (
                        <span className="text-xs font-bold" style={{ color: 'var(--red)' }}>LIVE</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent results */}
      {(recentGames ?? []).length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-3 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>Recent Results</h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(recentGames ?? []).map((g: any) => {
              const isHome = g.home_team?.id === Number(id);
              const opp = isHome ? g.away_team : g.home_team;
              const myScore  = isHome ? g.home_score : g.away_score;
              const oppScore = isHome ? g.away_score : g.home_score;
              const won = myScore !== null && oppScore !== null && myScore > oppScore;
              const lost = myScore !== null && oppScore !== null && myScore < oppScore;
              return (
                <Link key={g.id}
                  href={gameUrl(g.id, g.away_team?.abbrev ?? '', g.home_team?.abbrev ?? '', g.game_date)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:opacity-80"
                  style={{ background: 'var(--bg)' }}>
                  <span className="text-xs font-bold w-5 text-center rounded"
                    style={{
                      color: won ? 'var(--green)' : lost ? 'var(--red)' : 'var(--text)',
                      background: won ? 'rgba(34,197,94,0.1)' : lost ? 'rgba(239,68,68,0.1)' : 'transparent',
                    }}>
                    {won ? 'W' : lost ? 'L' : 'T'}
                  </span>
                  <img src={teamLogoUrl(opp?.abbrev ?? '')} alt={opp?.abbrev} className="w-6 h-6 object-contain" />
                  <span className="flex-1 text-sm" style={{ color: 'var(--text-bright)' }}>
                    {isHome ? 'vs' : '@'} {opp?.abbrev}
                  </span>
                  <span className="font-mono font-bold text-sm" style={{ color: won ? 'var(--green)' : 'var(--red)' }}>
                    {myScore}–{oppScore}
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text)' }}>
                    {g.game_date?.slice(5)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
