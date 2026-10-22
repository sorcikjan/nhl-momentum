import Link from 'next/link';
import { Headshot, HeatDial, PlayerList, SectionHeading, SectionLink, TeamChip } from '@/components/ds';
import type { HeatLeader } from '@/lib/home';
import type { PlayerRowData } from '@/lib/player-row';
import { teamColor } from '@/lib/team-colors';
import { MONO, timeET } from './format';

function Chip({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span className="rounded-lg px-2.5 py-1.5 text-[13px] font-bold" style={{ ...MONO, background: 'var(--bg-raised)', color: accent ? 'var(--heat)' : 'var(--text-bright)' }}>
      {children}
    </span>
  );
}

function LeaderCard({ p }: { p: HeatLeader }) {
  const pace = p.pace == null ? null : `${p.pace > 0 ? '+' : p.pace < 0 ? '−' : ''}${Math.abs(p.pace)}% vs season pace`;
  return (
    <Link
      href={p.href}
      className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border p-6 lg:p-8"
      style={{ background: `linear-gradient(155deg, ${teamColor(p.team).bg}88 0%, var(--bg-card) 55%)`, borderColor: 'rgba(255, 90, 36, 0.33)', boxShadow: '0 0 40px rgba(255, 90, 36, 0.13)' }}
    >
      <span className="absolute right-4 top-4 rounded-full border px-2.5 py-1 text-[10px] font-bold lg:right-6 lg:top-6" style={{ ...MONO, color: 'var(--heat)', background: 'var(--bg)', borderColor: 'rgba(255, 90, 36, 0.4)', letterSpacing: 1.4 }}>
        #1 · HOTTEST RIGHT NOW
      </span>
      <span className="flex items-center gap-3"><Headshot src={p.photo} name={`${p.first} ${p.last}`} team={p.team} size={72} /><TeamChip abbrev={p.team} size={36} /></span>
      <div>
        <div className="font-extrabold leading-none" style={{ fontSize: 'clamp(34px, 5vw, 52px)', letterSpacing: '-0.036em', color: 'var(--text-bright)' }}>
          {p.first} <span style={{ color: 'var(--heat)' }}>{p.last}</span>
        </div>
        <div className="mt-2 text-[13px]" style={{ color: 'var(--text)' }}>{[p.pos, p.teamName, pace].filter(Boolean).join(' · ')}</div>
      </div>
      <div className="flex flex-wrap items-center gap-5 lg:gap-6">
        <HeatDial heat={p.heat} size={112} />
        <div className="flex flex-1 flex-col gap-2.5" style={{ minWidth: 200 }}>
          <div className="text-[10px] font-bold" style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 1.4 }}>LAST {p.games} GAMES</div>
          <div className="flex flex-wrap gap-2">
            <Chip>{p.goals} G</Chip>
            <Chip>{p.assists} A</Chip>
            <Chip accent>{p.goals + p.assists} PTS</Chip>
          </div>
          {p.tonight && (
            <span className="text-[13px] font-bold" style={{ color: 'var(--heat)' }}>
              Tonight vs {p.tonight.opponent}{p.tonight.time ? `, ${timeET(p.tonight.time)}` : ''} →
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// The USP: who's hot, what they did, and who is rising or falling. Every list
// is the same PlayerRow.
export function HeatHero({ leader, leaders, heatingUp, coolingOff }: {
  leader: HeatLeader | null; leaders: PlayerRowData[]; heatingUp: PlayerRowData[]; coolingOff: PlayerRowData[];
}) {
  if (!leader) return null;
  return (
    <section data-section="heat" className="flex flex-col gap-6 lg:gap-8">
      <div>
        <SectionHeading
          as="h1"
          size="feature"
          kicker="HEAT · LAST 5 GAMES"
          title="Who's hot in the NHL right now."
          sub={<>Heat is one number from 0 to 100 for each player&apos;s current form, recalculated after every game. {leader.first} {leader.last} leads the league at {leader.heat}. <Link href="/welcome" className="font-semibold" style={{ color: 'var(--heat)' }}>How Heat works</Link></>}
          right={<SectionLink href="/hot">Full Heat rankings</SectionLink>}
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_1fr] lg:gap-6">
          <LeaderCard p={leader} />
          <PlayerList rows={leaders} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <SectionHeading as="h3" kicker="BREAKING OUT · L5 VS SEASON PACE" title="Heating up." sub="Furthest above their own season pace." right={<SectionLink href="/hot">See all</SectionLink>} />
          <PlayerList rows={heatingUp} />
        </div>
        <div>
          <SectionHeading as="h3" kicker="COOLING OFF · L5 VS SEASON PACE" title="Going cold." sub="Furthest below their own season pace." right={<SectionLink href="/hot">See all</SectionLink>} />
          <PlayerList rows={coolingOff} />
        </div>
      </div>
    </section>
  );
}
