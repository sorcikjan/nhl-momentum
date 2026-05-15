import type { Metadata } from 'next';
import {
  fetchWCStandings,
  fetchWCGamesToday,
  computeTeamHeats,
  TEAM_FLAG,
  type WCStanding,
  type WCGame,
} from '@/lib/iihf';
import { heatColor } from '@/lib/heat';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'IIHF World Championship 2026 — Hockey Momentum',
  description: 'Team momentum, group standings, and live scores for the 2026 IIHF Ice Hockey World Championship.',
};

function SectionTitle({ main, accent }: { main: string; accent: string }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-fraunces), Georgia, serif',
      fontWeight: 900, fontSize: '1.3rem',
      letterSpacing: '-0.025em', lineHeight: 1.1,
    }}>
      <span style={{ color: 'var(--text-bright)' }}>{main} </span>
      <span style={{ color: 'var(--heat)' }}>{accent}</span>
    </h2>
  );
}

function HeatBadge({ heat }: { heat: number }) {
  const color = heatColor(heat);
  const isNeutral = heat === 50;
  return (
    <span className="text-sm font-black font-mono tabular-nums"
      style={{ color: isNeutral ? 'var(--text)' : color, opacity: isNeutral ? 0.4 : 1 }}>
      {isNeutral ? '—' : heat}
    </span>
  );
}

function FormPips({ form }: { form: string }) {
  if (!form) return null;
  return (
    <div className="flex gap-0.5 items-center">
      {form.slice(-5).split('').map((c, i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full inline-block"
          style={{
            background: c === 'W' ? 'var(--green)' : c === 'L' ? 'var(--red)' : 'var(--amber)',
          }} />
      ))}
    </div>
  );
}

function GameCard({ game }: { game: WCGame }) {
  const home = game.teams.home;
  const away = game.teams.away;
  const homeScore = game.scores.home.total;
  const awayScore = game.scores.away.total;
  const isLive = game.status.short === 'LIVE' || game.status.short === '1P' || game.status.short === '2P' || game.status.short === '3P' || game.status.short === 'OT';
  const isFinished = game.status.short === 'FT' || game.status.short === 'AOT';
  const isScheduled = !isLive && !isFinished;

  // Format scheduled time (UTC → display as CET = UTC+2)
  let timeDisplay = '';
  if (isScheduled && game.date) {
    const d = new Date(game.date);
    const cet = new Date(d.getTime() + 2 * 60 * 60 * 1000);
    const h = String(cet.getUTCHours()).padStart(2, '0');
    const m = String(cet.getUTCMinutes()).padStart(2, '0');
    timeDisplay = `${h}:${m} CET`;
  }

  return (
    <div className="rounded-xl border p-4 flex flex-col gap-3"
      style={{ background: 'var(--bg-card)', borderColor: isLive ? 'rgba(255,90,36,0.4)' : 'var(--border)' }}>

      {/* Status row */}
      <div className="flex items-center justify-between">
        {isLive && (
          <span className="text-xs font-bold tracking-widest px-2 py-0.5 rounded"
            style={{ background: 'rgba(255,90,36,0.15)', color: 'var(--heat)' }}>
            LIVE · {game.status.elapsed ?? game.status.short}
          </span>
        )}
        {isFinished && (
          <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text)', opacity: 0.5 }}>FINAL</span>
        )}
        {isScheduled && (
          <span className="text-xs font-mono" style={{ color: 'var(--text)', opacity: 0.5 }}>{timeDisplay}</span>
        )}
      </div>

      {/* Teams + score */}
      {[
        { team: home, score: homeScore, opponent: awayScore },
        { team: away, score: awayScore, opponent: homeScore },
      ].map(({ team, score, opponent }) => (
        <div key={team.id} className="flex items-center gap-3">
          <img src={team.logo} alt={team.name} width={28} height={28} style={{ objectFit: 'contain', flexShrink: 0 }} />
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
              {TEAM_FLAG[team.name] ?? ''} {team.name}
            </span>
          </div>
          {score !== null && (
            <span className="text-xl font-black font-mono tabular-nums"
              style={{ color: score > (opponent ?? 0) ? 'var(--text-bright)' : 'var(--text)', opacity: score > (opponent ?? 0) ? 1 : 0.5 }}>
              {score}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function StandingsTable({ standings, heats, title, accent }: {
  standings: WCStanding[];
  heats: Map<number, number>;
  title: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="px-5 pt-5 pb-3">
        <SectionTitle main={title} accent={accent} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              <th className="px-4 py-2 text-left font-semibold uppercase tracking-wide w-6" style={{ color: 'var(--text)' }}>#</th>
              <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>Team</th>
              <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>GP</th>
              <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide" style={{ color: 'var(--green)' }}>W</th>
              <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide" style={{ color: 'var(--amber)' }}>OT</th>
              <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide" style={{ color: 'var(--red)' }}>L</th>
              <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>GF</th>
              <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>GA</th>
              <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>PTS</th>
              <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide hidden sm:table-cell" style={{ color: 'var(--text)' }}>Form</th>
              <th className="px-4 py-2 text-center font-semibold uppercase tracking-wide" style={{ color: 'var(--heat)' }}>Heat</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const heat = heats.get(s.team.id) ?? 50;
              const otTotal = s.games.win_overtime.total + s.games.lose_overtime.total;
              const isPromotion = s.description?.toLowerCase().includes('quarter') || s.description?.toLowerCase().includes('play');
              return (
                <tr key={s.team.id}
                  style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 font-mono text-center"
                    style={{ color: isPromotion ? 'var(--neon)' : 'var(--text)', opacity: isPromotion ? 1 : 0.4 }}>
                    {s.position}
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <img src={s.team.logo} alt={s.team.name} width={22} height={22} style={{ objectFit: 'contain', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-bright)', fontWeight: 600 }}>
                        {TEAM_FLAG[s.team.name] ?? ''} {s.team.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center font-mono" style={{ color: 'var(--text)' }}>{s.games.played}</td>
                  <td className="px-2 py-3 text-center font-mono font-bold" style={{ color: 'var(--green)' }}>{s.games.win.total}</td>
                  <td className="px-2 py-3 text-center font-mono" style={{ color: 'var(--amber)' }}>{otTotal}</td>
                  <td className="px-2 py-3 text-center font-mono" style={{ color: 'var(--red)' }}>{s.games.lose.total}</td>
                  <td className="px-2 py-3 text-center font-mono" style={{ color: 'var(--text-bright)' }}>{s.goals.for}</td>
                  <td className="px-2 py-3 text-center font-mono" style={{ color: 'var(--text)' }}>{s.goals.against}</td>
                  <td className="px-2 py-3 text-center font-mono font-black" style={{ color: 'var(--text-bright)' }}>{s.points}</td>
                  <td className="px-2 py-3 text-center hidden sm:table-cell">
                    <FormPips form={s.form} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <HeatBadge heat={heat} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function IIHFWorldChampionshipPage() {
  const [{ groupA, groupB }, todayGames] = await Promise.all([
    fetchWCStandings(),
    fetchWCGamesToday(),
  ]);

  const allStandings = [...groupA, ...groupB];
  const heats = computeTeamHeats(allStandings);
  const hasStandings = allStandings.length > 0;

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0 space-y-4">

      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden px-6 py-8"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div style={{
            position: 'absolute', right: -20, top: -30, fontSize: 220,
            fontWeight: 900, lineHeight: 1, color: 'rgba(255,90,36,0.04)',
            letterSpacing: '-0.05em', fontFamily: 'var(--font-fraunces), Georgia, serif',
          }}>WC</div>
        </div>
        <div className="relative z-10 flex flex-col gap-2">
          <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--heat)', opacity: 0.8 }}>
            IIHF · May 15–26, 2026 · Stockholm & Herning
          </div>
          <h1 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', lineHeight: 0.95, letterSpacing: '-0.025em' }}>
            <span className="block font-black" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', color: 'var(--text-bright)' }}>
              World
            </span>
            <span className="block font-black" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', color: 'var(--heat)' }}>
              Championship.
            </span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text)', opacity: 0.65 }}>
            Team momentum scores updated every 5 minutes · {allStandings.length} nations competing
          </p>
        </div>
      </div>

      {/* Today's slate */}
      {todayGames.length > 0 && (
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="mb-4">
            <SectionTitle main="Today's" accent="slate." />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {todayGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}

      {/* Group standings */}
      {hasStandings ? (
        <>
          <StandingsTable standings={groupA} heats={heats} title="Group" accent="A." />
          <StandingsTable standings={groupB} heats={heats} title="Group" accent="B." />
        </>
      ) : (
        <div className="rounded-xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text)', opacity: 0.5 }}>
            Standings will appear once games begin.
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs px-1" style={{ color: 'var(--text)', opacity: 0.45 }}>
        <span><span style={{ color: 'var(--neon)' }}>●</span> Advances to quarterfinals</span>
        <span>Heat = recent form (60%) + goals/game (40%)</span>
        <span>OT = overtime wins + overtime losses</span>
      </div>

    </div>
  );
}
