import type { Metadata } from 'next';
import Link from 'next/link';
import {
  fetchEventDetail,
  fetchGameEvents,
  TEAM_FLAG,
  type WCGameEvent,
} from '@/lib/iihf';

export const revalidate = 120;

function normName(raw: string): string {
  return raw.replace(/\s+Ice\s+Hockey$/i, '').trim();
}

function getYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/[?&]v=([^&]+)/) ?? url.match(/youtu\.be\/([^?]+)/);
  return m?.[1] ?? null;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function periodLabel(p: number): string {
  if (p === 1) return '1st Period';
  if (p === 2) return '2nd Period';
  if (p === 3) return '3rd Period';
  if (p === 4) return 'Overtime';
  if (p === 5) return 'Shootout';
  return `Period ${p}`;
}

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

function EventRow({ event, homeTeam }: { event: WCGameEvent; homeTeam: string }) {
  const isGoal = event.type.toLowerCase().includes('goal');
  const isPenalty = event.type.toLowerCase().includes('penalty');
  const isHome = event.team === homeTeam ||
    event.team.includes(homeTeam) ||
    homeTeam.includes(event.team);

  const color = isGoal ? 'var(--neon)' : isPenalty ? 'var(--amber)' : 'var(--text)';
  const icon = isGoal ? '◉' : isPenalty ? '▬' : '·';

  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="font-mono text-xs w-10 shrink-0 pt-0.5 text-right" style={{ color: 'var(--text)', opacity: 0.45 }}>
        {event.time}′
      </span>
      <span style={{ color, fontSize: '0.7rem', paddingTop: '0.2rem', flexShrink: 0 }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
            {TEAM_FLAG[event.team] ?? ''} {event.player}
          </span>
          <span className="text-xs font-mono shrink-0" style={{ color: 'var(--text)', opacity: 0.4 }}>
            {isHome ? '← home' : 'away →'}
          </span>
        </div>
        {(event.assist1 || event.assist2) && (
          <div className="text-xs mt-0.5" style={{ color: 'var(--text)', opacity: 0.55 }}>
            Assists: {[event.assist1, event.assist2].filter(Boolean).join(', ')}
          </div>
        )}
        {isPenalty && event.detail && (
          <div className="text-xs mt-0.5" style={{ color: 'var(--amber)', opacity: 0.7 }}>
            {event.detail}
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEventDetail(id);
  if (!event) return { title: 'Game — Hockey Momentum' };
  const home = normName(event.strHomeTeam);
  const away = normName(event.strAwayTeam);
  const score = event.intHomeScore !== null && event.intAwayScore !== null
    ? ` ${event.intHomeScore}–${event.intAwayScore}` : '';
  return {
    title: `${home} vs ${away}${score} — IIHF WC 2026`,
    description: `Match detail for ${home} vs ${away} at the 2026 IIHF Ice Hockey World Championship.`,
  };
}

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await fetchEventDetail(id);

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto pb-20 md:pb-0 space-y-4">
        <Link href="/tournaments/iihf-wc-2026"
          className="inline-flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: 'var(--heat)' }}>
          ← World Championship
        </Link>
        <div className="rounded-xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Game not found.</p>
        </div>
      </div>
    );
  }

  const homeName = normName(event.strHomeTeam);
  const awayName = normName(event.strAwayTeam);
  const homeScore = event.intHomeScore !== null ? Number(event.intHomeScore) : null;
  const awayScore = event.intAwayScore !== null ? Number(event.intAwayScore) : null;

  const isLive = ['LIVE', '1P', '2P', '3P', 'OT', 'BT'].includes(event.strStatus);
  const isFinished = ['FT', 'AOT', 'AP'].includes(event.strStatus);
  const hasScore = homeScore !== null && awayScore !== null;

  const gameEvents = event.idAPIfootball && (isLive || isFinished)
    ? await fetchGameEvents(event.idAPIfootball)
    : [];

  const goals = gameEvents.filter(e => e.type.toLowerCase().includes('goal'));
  const penalties = gameEvents.filter(e => e.type.toLowerCase().includes('penalty'));
  const allEvents = [...gameEvents].sort((a, b) => {
    if (a.period !== b.period) return a.period - b.period;
    const tA = parseFloat(a.time.replace(':', '.'));
    const tB = parseFloat(b.time.replace(':', '.'));
    return tA - tB;
  });

  const periods = [...new Set(allEvents.map(e => e.period))].sort((a, b) => a - b);
  const ytId = getYouTubeId(event.strVideo);

  const statusLabel = isLive
    ? 'LIVE'
    : isFinished
      ? `Final${event.strStatus === 'AOT' ? ' · OT' : event.strStatus === 'AP' ? ' · SO' : ''}`
      : event.strTimeLocal
        ? `${event.strTimeLocal.slice(0, 5)} CET`
        : 'Scheduled';

  return (
    <div className="max-w-3xl mx-auto pb-20 md:pb-0 space-y-4">

      {/* Breadcrumb */}
      <Link href="/tournaments/iihf-wc-2026"
        className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
        style={{ color: 'var(--heat)' }}>
        ← World Championship
      </Link>

      {/* Hero card */}
      <div className="rounded-xl border p-6" style={{
        background: 'var(--bg-card)',
        borderColor: isLive ? 'rgba(255,90,36,0.4)' : 'var(--border)',
      }}>
        {/* Status */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1.5 text-xs font-bold tracking-widest px-2 py-0.5 rounded"
                style={{ background: 'rgba(255,90,36,0.15)', color: 'var(--heat)' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: 'var(--heat)' }} />
                LIVE
              </span>
            )}
            <span className="text-xs font-semibold" style={{
              color: isLive ? 'var(--heat)' : 'var(--text)',
              opacity: isLive ? 1 : 0.45,
            }}>
              {statusLabel}
            </span>
          </div>
          <div className="text-xs" style={{ color: 'var(--text)', opacity: 0.4 }}>
            {event.dateEvent ? formatDate(event.dateEvent) : ''}
          </div>
        </div>

        {/* Teams + score */}
        <div className="space-y-4">
          {([
            { name: homeName, logo: event.strHomeTeamBadge, score: homeScore, opp: awayScore, label: 'Home' },
            { name: awayName, logo: event.strAwayTeamBadge, score: awayScore, opp: homeScore, label: 'Away' },
          ] as const).map(({ name, logo, score, opp, label }) => {
            const winning = hasScore && score !== null && opp !== null && score > opp;
            return (
              <div key={name} className="flex items-center gap-4">
                {logo && (
                  <img src={logo} alt={name} width={44} height={44}
                    style={{ objectFit: 'contain', flexShrink: 0 }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold" style={{ color: winning ? 'var(--text-bright)' : 'var(--text)' }}>
                    {TEAM_FLAG[name] ?? ''} {name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text)', opacity: 0.35 }}>{label}</div>
                </div>
                {score !== null && (
                  <span className="text-4xl font-black font-mono tabular-nums"
                    style={{ color: winning ? 'var(--text-bright)' : 'var(--text)', opacity: winning ? 1 : 0.35 }}>
                    {score}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Venue */}
        {(event.strVenue || event.strCity) && (
          <div className="mt-5 pt-4 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text)', opacity: 0.4 }}>
            {[event.strVenue, event.strCity].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>

      {/* Scoring summary */}
      {goals.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-5 pt-5 pb-3">
            <SectionTitle main="Scoring" accent="summary." />
          </div>
          <div className="px-5 pb-4">
            {periods.map(period => {
              const periodGoals = allEvents.filter(e => e.period === period && e.type.toLowerCase().includes('goal'));
              if (periodGoals.length === 0) return null;
              return (
                <div key={period} className="mb-4 last:mb-0">
                  <div className="text-xs font-semibold uppercase tracking-widest mb-1"
                    style={{ color: 'var(--text)', opacity: 0.4 }}>
                    {periodLabel(period)}
                  </div>
                  {periodGoals.map((e, i) => (
                    <EventRow key={i} event={e} homeTeam={homeName} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Penalties */}
      {penalties.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-5 pt-5 pb-3">
            <SectionTitle main="Penalty" accent="log." />
          </div>
          <div className="px-5 pb-4">
            {allEvents.filter(e => e.type.toLowerCase().includes('penalty')).map((e, i) => (
              <EventRow key={i} event={e} homeTeam={homeName} />
            ))}
          </div>
        </div>
      )}

      {/* No events available yet */}
      {!isFinished && !isLive && gameEvents.length === 0 && (
        <div className="rounded-xl border p-6 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
            Game hasn't started yet.
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text)', opacity: 0.45 }}>
            Live events and scoring will appear here once the puck drops.
          </p>
        </div>
      )}

      {/* YouTube highlight */}
      {ytId && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-5 pt-5 pb-3">
            <SectionTitle main="Match" accent="highlights." />
          </div>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              title="Match highlights"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              style={{ border: 0 }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
