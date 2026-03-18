import PlayerRadarChart from '@/components/players/RadarChart';
import PPMTimeline from '@/components/players/PPMTimeline';
import EnergyBar from '@/components/players/EnergyBar';
import MetricLayers from '@/components/players/MetricLayers';
import { fetchPlayer, fetchRankings } from '@/lib/data';
import { teamUrl } from '@/lib/urls';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function buildLayerData(snapshot: Record<string, number>, prefix: string) {
  return {
    gamesPlayed:  snapshot[`${prefix}_games`]        ?? 0,
    goals:        snapshot[`${prefix}_goals`]         ?? 0,
    assists:      snapshot[`${prefix}_assists`]        ?? 0,
    points:       snapshot[`${prefix}_points`]         ?? 0,
    ppm:          snapshot[`${prefix}_ppm`]            ?? 0,
    shootingPct:  snapshot[`${prefix}_shooting_pct`]   ?? 0,
    hits:         0,
    blockedShots: 0,
    plusMinus:    0,
  };
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  const [data, rankings] = await Promise.all([
    fetchPlayer(id).catch(() => null),
    fetchRankings().catch(() => null),
  ]);

  if (!data?.player) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--text)' }}>Player not found</p>
      </div>
    );
  }

  const { player, metricTimeline, recentGames } = data;
  const latestSnapshot = metricTimeline?.[metricTimeline.length - 1] ?? {};
  const name = `${player.first_name} ${player.last_name}`;

  const ranked = rankings?.top100?.find((p: { player_id: number }) => p.player_id === Number(id));

  const momentum = buildLayerData(latestSnapshot, 'momentum');
  const season   = buildLayerData(latestSnapshot, 'season');
  const career   = { ...season, gamesPlayed: latestSnapshot.career_games ?? season.gamesPlayed, ppm: latestSnapshot.career_ppm ?? season.ppm };

  const leagueMax = {
    ppm:             0.15,
    shootingPct:     0.25,
    hits:            15,
    blockedShots:    12,
    plusMinus:       10,
    powerPlayPoints: 5,
  };

  const energyBar = latestSnapshot.energy_bar ?? 100;

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0">

      <div className="flex items-center gap-4 mb-6">
        {player.headshot_url && (
          <img src={player.headshot_url} alt={name}
            className="w-16 h-16 rounded-full object-cover border-2"
            style={{ borderColor: 'var(--neon)' }} />
        )}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>{name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: 'var(--text)' }}>
            {player.teams?.id ? (
              <Link href={teamUrl(player.teams.id, player.teams.name ?? player.teams.abbrev)}
                className="hover:opacity-80" style={{ color: 'var(--neon)' }}>
                {player.teams.abbrev}
              </Link>
            ) : (
              <span>{player.teams?.abbrev}</span>
            )}
            <span>·</span>
            <span>{player.position_code}</span>
            <span>·</span>
            <span>#{player.sweater_number}</span>
            {ranked && (
              <>
                <span>·</span>
                <span style={{ color: 'var(--neon)' }}>Rank #{ranked.momentum_rank}</span>
              </>
            )}
            {player.injury_status && (
              <span className="px-2 py-0.5 rounded text-xs font-semibold"
                style={{ background: 'rgba(239,68,68,0.2)', color: 'var(--red)' }}>
                {player.injury_status}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <EnergyBar value={energyBar} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <PlayerRadarChart
          momentum={{ ppm: momentum.ppm, shootingPct: momentum.shootingPct, hits: momentum.hits, blockedShots: momentum.blockedShots, plusMinus: momentum.plusMinus, powerPlayPoints: 0 }}
          season={{ ppm: season.ppm, shootingPct: season.shootingPct, hits: season.hits, blockedShots: season.blockedShots, plusMinus: season.plusMinus, powerPlayPoints: 0 }}
          leagueMax={leagueMax}
        />
        <PPMTimeline snapshots={metricTimeline ?? []} />
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text)' }}>
          3-Layer Metric Breakdown
        </h2>
        <MetricLayers momentum={momentum} season={season} career={career} />
      </div>

      {(recentGames?.length ?? 0) > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-3 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
              Recent Games
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--bg-card)' }}>
                <tr>
                  {['Date','G','A','Pts','+/-','TOI','Shots','Hits'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase"
                      style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(recentGames ?? []).slice(0, 10).map((g: any, i: number) => (
                  <tr key={i} className="border-t"
                    style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)' }}>
                    <td className="px-3 py-2 text-xs font-mono" style={{ color: 'var(--text)' }}>
                      {g.games ? String(g.games.game_date ?? '').slice(5) : '—'}
                    </td>
                    <td className="px-3 py-2 font-mono" style={{ color: 'var(--text-bright)' }}>{String(g.goals ?? 0)}</td>
                    <td className="px-3 py-2 font-mono" style={{ color: 'var(--text-bright)' }}>{String(g.assists ?? 0)}</td>
                    <td className="px-3 py-2 font-mono font-semibold" style={{ color: 'var(--neon)' }}>
                      {String(Number(g.goals ?? 0) + Number(g.assists ?? 0))}
                    </td>
                    <td className="px-3 py-2 font-mono" style={{ color: Number(g.plus_minus) > 0 ? 'var(--green)' : Number(g.plus_minus) < 0 ? 'var(--red)' : 'var(--text)' }}>
                      {Number(g.plus_minus) > 0 ? `+${g.plus_minus}` : String(g.plus_minus ?? 0)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--text)' }}>
                      {Math.floor(Number(g.toi_seconds ?? 0) / 60)}:{String(Number(g.toi_seconds ?? 0) % 60).padStart(2, '0')}
                    </td>
                    <td className="px-3 py-2 font-mono" style={{ color: 'var(--text)' }}>{String(g.shots_on_goal ?? 0)}</td>
                    <td className="px-3 py-2 font-mono" style={{ color: 'var(--text)' }}>{String(g.hits ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
