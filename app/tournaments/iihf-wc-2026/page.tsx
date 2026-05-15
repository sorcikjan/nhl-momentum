import type { Metadata } from 'next';
import {
  fetchWCSchedule,
  fetchLiveStatus,
  buildStandingsFromSchedule,
  computeTeamHeats,
  TEAM_FLAG,
  type TSDBEvent,
  type WCStanding,
} from '@/lib/iihf';
import { heatColor } from '@/lib/heat';

export const revalidate = 1800;

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
      style={{ color: isNeutral ? 'var(--text)' : color, opacity: isNeutral ? 0.35 : 1 }}>
      {isNeutral ? '—' : heat}
    </span>
  );
}

function FormPips({ form }: { form: string }) {
  if (!form) return null;
  return (
    <div className="flex gap-0.5 items-center justify-center">
      {form.slice(-5).split('').map((c, i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full inline-block"
          style={{ background: c === 'W' ? 'var(--green)' : c === 'L' ? 'var(--red)' : 'var(--amber)' }} />
      ))}
    </div>
  );
}

function GameCard({ event, live }: {
  event: TSDBEvent;
  live?: { status: string; elapsed: string | null; homeScore: number | null; awayScore: number | null };
}) {
  const homeName = event.strHomeTeam.replace(/\s+Ice\s+Hockey$/i, '').trim();
  const awayName = event.strAwayTeam.replace(/\s+Ice\s+Hockey$/i, '').trim();

  // Prefer live API data for status/score; fall back to TSDB
  const status = live?.status ?? event.strStatus;
  const homeScore = live?.homeScore ?? (event.intHomeScore !== null ? Number(event.intHomeScore) : null);
  const awayScore = live?.awayScore ?? (event.intAwayScore !== null ? Number(event.intAwayScore) : null);
  const elapsed = live?.elapsed ?? null;

  const isLive = ['LIVE', '1P', '2P', '3P', 'OT', 'BT'].includes(status);
  const isFinished = ['FT', 'AOT', 'AP'].includes(status);

  return (
    <div className="rounded-xl border p-4 flex flex-col gap-3"
      style={{ background: 'var(--bg-card)', borderColor: isLive ? 'rgba(255,90,36,0.4)' : 'var(--border)' }}>

      <div className="flex items-center justify-between h-4">
        {isLive && (
          <span className="text-xs font-bold tracking-widest px-2 py-0.5 rounded"
            style={{ background: 'rgba(255,90,36,0.15)', color: 'var(--heat)' }}>
            LIVE {elapsed ? `· ${elapsed}′` : ''}
          </span>
        )}
        {isFinished && (
          <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text)', opacity: 0.45 }}>
            FINAL{status === 'AOT' ? ' · OT' : status === 'AP' ? ' · SO' : ''}
          </span>
        )}
        {!isLive && !isFinished && (
          <span className="text-xs font-mono" style={{ color: 'var(--text)', opacity: 0.45 }}>
            {event.strTimeLocal.slice(0, 5)} CET
          </span>
        )}
      </div>

      {([ { name: homeName, logo: event.strHomeTeamBadge, score: homeScore, opp: awayScore },
          { name: awayName, logo: event.strAwayTeamBadge, score: awayScore, opp: homeScore },
      ]).map(({ name, logo, score, opp }) => (
        <div key={name} className="flex items-center gap-3">
          {logo && <img src={logo} alt={name} width={28} height={28} style={{ objectFit: 'contain', flexShrink: 0 }} />}
          <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
            {TEAM_FLAG[name] ?? ''} {name}
          </span>
          {score !== null && (
            <span className="text-xl font-black font-mono tabular-nums"
              style={{ color: score > (opp ?? 0) ? 'var(--text-bright)' : 'var(--text)', opacity: score > (opp ?? 0) ? 1 : 0.45 }}>
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
  if (standings.length === 0) return null;
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="px-5 pt-5 pb-3">
        <SectionTitle main={title} accent={accent} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              <th className="px-4 py-2 text-left font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>#</th>
              <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>Team</th>
              <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>GP</th>
              <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide" style={{ color: 'var(--green)' }}>W</th>
              <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide" style={{ color: 'var(--amber)' }}>OT</th>
              <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide" style={{ color: 'var(--red)' }}>L</th>
              <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>GF</th>
              <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>GA</th>
              <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide font-black" style={{ color: 'var(--text-bright)' }}>PTS</th>
              <th className="px-2 py-2 text-center hidden sm:table-cell font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>Form</th>
              <th className="px-4 py-2 text-center font-semibold uppercase tracking-wide" style={{ color: 'var(--heat)' }}>Heat</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const heat = heats.get(s.team.id) ?? 50;
              const otTotal = s.games.win_overtime.total + s.games.lose_overtime.total;
              return (
                <tr key={s.team.id}
                  style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 font-mono text-center"
                    style={{ color: s.position <= 4 ? 'var(--neon)' : 'var(--text)', opacity: s.position <= 4 ? 1 : 0.35 }}>
                    {s.position}
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      {s.team.logo && <img src={s.team.logo} alt={s.team.name} width={22} height={22} style={{ objectFit: 'contain', flexShrink: 0 }} />}
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
                  <td className="px-2 py-3 hidden sm:table-cell">
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
  const today = new Date().toISOString().slice(0, 10);

  const [schedule, liveStatus] = await Promise.all([
    fetchWCSchedule(),
    fetchLiveStatus(),
  ]);

  const todayGames = schedule.filter(e => e.dateEvent === today);
  const { groupA, groupB } = buildStandingsFromSchedule(schedule);
  const allStandings = [...groupA, ...groupB];
  const heats = computeTeamHeats(allStandings);
  const gamesPlayed = schedule.filter(e => ['FT', 'AOT', 'AP'].includes(e.strStatus)).length;
  const hasStandings = allStandings.length > 0;

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0 space-y-4">

      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden px-6 py-8" style={{ background: 'var(--bg-card)' }}>
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div style={{
            position: 'absolute', right: -20, top: -30, fontSize: 220, fontWeight: 900, lineHeight: 1,
            color: 'rgba(255,90,36,0.04)', letterSpacing: '-0.05em',
            fontFamily: 'var(--font-fraunces), Georgia, serif',
          }}>WC</div>
        </div>
        <div className="relative z-10 flex flex-col gap-2">
          <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--heat)', opacity: 0.8 }}>
            IIHF · May 15–26, 2026 · Stockholm & Herning
          </div>
          <h1 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', lineHeight: 0.95, letterSpacing: '-0.025em' }}>
            <span className="block font-black" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', color: 'var(--text-bright)' }}>World</span>
            <span className="block font-black" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', color: 'var(--heat)' }}>Championship.</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text)', opacity: 0.5 }}>
            {gamesPlayed > 0
              ? `${gamesPlayed} game${gamesPlayed !== 1 ? 's' : ''} played · standings update every 30 min`
              : 'Tournament begins today · 16 nations · standings build as games finish'}
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
              <GameCard
                key={game.idEvent}
                event={game}
                live={game.idAPIfootball ? liveStatus.get(game.idAPIfootball) : undefined}
              />
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
          <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Standings build as games finish.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text)', opacity: 0.45 }}>Check back after tonight's games.</p>
        </div>
      )}

      {hasStandings && (
        <div className="flex flex-wrap gap-4 text-xs px-1" style={{ color: 'var(--text)', opacity: 0.4 }}>
          <span><span style={{ color: 'var(--neon)' }}>●</span> Top 4 advance to quarterfinals</span>
          <span>Heat = recent form (60%) + goals/game vs field (40%)</span>
          <span>OT = overtime wins + overtime losses</span>
        </div>
      )}

    </div>
  );
}
