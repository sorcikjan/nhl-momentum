import Link from 'next/link';
import { Headshot, HeatDial, HeatPill, SectionHeading, TeamChip } from '@/components/ds';
import { heatColor } from '@/lib/heat';
import { hotShareText } from '@/lib/share';
import ShareButton from '@/components/ui/ShareButton';
import type { HotView } from '@/lib/hot-view';
import { teamColor } from '@/lib/team-colors';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;

// Heat page (design DesktopHotPlayers / MobileHotPlayers).
export function HotBody({ view }: { view: HotView }) {
  const { top, rest, breakouts, cooling } = view;
  return (
    <div className="pb-20 lg:pb-0">
      <SectionHeading
        as="h1" size="page" kicker="HEAT MAP · LAST 5 GAMES"
        title={<><span style={{ color: 'var(--heat)' }}>Burning</span> right now.</>}
        right={top ? <ShareButton path="/hot" text={hotShareText([top, ...rest].slice(0, 3).map(p => ({ name: `${p.first} ${p.last}`, heat: p.heat })))} /> : undefined}
        sub="Highest Heat over the last five games, plus who is breaking out and who is cooling off. Refreshed after every game night."
      />
      {!top ? (
        <p className="rounded-xl border p-6 text-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Not enough games yet this season.</p>
      ) : (
        <div className="mb-9 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Link href={top.href} className="relative overflow-hidden rounded-2xl border p-6 lg:p-8" style={{ background: `linear-gradient(155deg, ${teamColor(top.team).bg}88 0%, var(--bg-card) 50%)`, borderColor: 'rgba(255, 90, 36, 0.33)', boxShadow: '0 0 40px rgba(255, 90, 36, 0.13)' }}>
            <span className="absolute right-4 top-4 rounded-full border px-2.5 py-1 text-[10px] font-bold lg:right-6 lg:top-6" style={{ ...MONO, color: 'var(--heat)', background: 'var(--bg)', borderColor: 'rgba(255, 90, 36, 0.4)', letterSpacing: 1.4 }}>#1 · HOTTEST RIGHT NOW</span>
            <span className="flex items-center gap-3"><Headshot src={top.photo} name={`${top.first} ${top.last}`} team={top.team} size={72} /><TeamChip abbrev={top.team} size={36} /></span>
            <div className="mb-2 mt-[18px] font-extrabold leading-none" style={{ fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: '-0.036em', color: 'var(--text-bright)', textWrap: 'pretty' }}>
              {top.first} <span style={{ color: 'var(--heat)' }}>{top.last}</span>
            </div>
            <div className="mb-6 text-[13px]" style={{ color: 'var(--text)' }}>{top.pos} · {top.sub}</div>
            <div className="flex items-center gap-5">
              <HeatDial heat={top.heat} size={110} />
              <p className="flex-1 text-sm leading-relaxed" style={{ color: 'var(--text)', textWrap: 'pretty' }}>{top.story}</p>
            </div>
          </Link>
          <div className="flex flex-col gap-2">
            <div className="mb-1 text-[11px] font-bold" style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 1.4 }}>RANKED 2–{rest.length + 1}</div>
            {rest.map((p, i) => (
              <Link key={p.playerId} href={p.href} className="flex items-center gap-3 rounded-[10px] border px-3.5 py-[11px]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)', borderLeft: `3px solid ${heatColor(p.heat)}` }}>
                <span className="w-[18px] text-[11px] font-bold" style={{ ...MONO, color: 'var(--text-muted)' }}>{i + 2}</span>
                <Headshot src={p.photo} name={`${p.first} ${p.last}`} team={p.team} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold" style={{ color: 'var(--text-bright)' }}>{p.first} {p.last}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{p.sub}</div>
                </div>
                <HeatPill heat={p.heat} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {breakouts.length > 0 && (
        <section className="mb-8">
          <SectionHeading kicker="BREAKOUT WATCH" kickerColor="var(--rise)" title="Heating up fast." size="feature" right={<span className="text-xs" style={{ color: 'var(--text-muted)' }}>Furthest above their season pace</span>} />
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            {breakouts.map(b => (
              <Link key={b.playerId} href={b.href} className="rounded-xl border p-[18px]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}>
                <div className="mb-3 flex items-center gap-2">
                  <Headshot src={b.photo} name={`${b.first} ${b.last}`} team={b.team} size={36} />
                  <span className="ml-auto text-[10px] font-bold" style={{ ...MONO, color: 'var(--rise)', letterSpacing: 1 }}>↑ RISING</span>
                </div>
                <div className="mb-1 truncate text-base font-bold" style={{ color: 'var(--text-bright)' }}>{b.first} {b.last}</div>
                <div className="mb-3.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>{b.sub}</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[28px] font-extrabold leading-none" style={{ ...MONO, color: heatColor(b.heat) }}>{b.heat}</span>
                  <span className="text-[10px] font-bold" style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 1 }}>HEAT</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {cooling.length > 0 && (
        <section>
          <SectionHeading kicker="COOLING OFF" kickerColor="var(--cold)" title="Below their season pace." />
          <div className="rounded-xl border px-[18px] py-1" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}>
            {cooling.map((p, i) => (
              <Link key={p.playerId} href={p.href} className="flex items-center gap-3 py-3.5" style={{ borderTop: i ? '1px solid var(--border-soft)' : undefined }}>
                <Headshot src={p.photo} name={`${p.first} ${p.last}`} team={p.team} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold" style={{ color: 'var(--text-bright)' }}>{p.first} {p.last}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{p.sub}</div>
                </div>
                <span className="text-[11px] line-through" style={{ ...MONO, color: 'var(--text-muted)' }} title="Season pace">{p.prev}</span>
                <span className="text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>→</span>
                <HeatPill heat={p.heat} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
