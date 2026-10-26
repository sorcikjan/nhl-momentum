import { TeamChip, energyColor, energyLabel } from '@/components/ds';
import { heatColor } from '@/lib/heat';
import { teamColor } from '@/lib/team-colors';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;

export type HeroProps = {
  first: string; last: string; team: string; teamName: string; number: number | null; position: string; age: number | null;
  shoots: string | null; height: string | null; weight: string | null;
  birthPlace: string | null; flag: string | null; drafted: string | null;
  photo: string | null;
  archetype: { name: string; basis: string | null } | null;
  // "11 points in 11 games — 23rd of 346 forwards. The average forward has 5."
  headline: React.ReactNode;
  // Heat against his position: share he's hotter than, the average, the top 5%.
  // null: no games yet; 'none': a goalie (Heat measures skater scoring).
  heat: { value: number; delta: number | null; pct: number; avg: number; one: string; many: string } | null | 'none';
  energy: { value: number; avg: number | null; one: string | null; note: string | null } | null;
  outBanner: { label: string; note: string } | null;
};

const HEAT_SCALE = 'linear-gradient(90deg, #4a88ff 0%, #8a94a6 25%, #f7b267 45%, #ff8a47 60%, #ff5a24 75%, #ff3a0f 100%)';

function HeatBlock({ heat }: { heat: Exclude<HeroProps['heat'], 'none'> }) {
  if (!heat) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.4 }}>HEAT · FORM, LAST 5 GAMES</span>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>No games yet this season</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline gap-3.5">
        <span className="text-[56px] font-extrabold leading-[0.9] lg:text-[64px]" style={{ color: heatColor(heat.value), letterSpacing: -2 }}>{heat.value}</span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[11px] font-bold" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.4 }}>
            HEAT · FORM, LAST 5 GAMES
            {heat.delta != null && heat.delta !== 0 && <span style={{ color: heat.delta > 0 ? 'var(--rise)' : 'var(--cold)' }}> {heat.delta > 0 ? '↑ +' : '↓ '}{heat.delta}</span>}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-bright)' }}>
            hotter than <b>{heat.pct}%</b> of {heat.many} · average {heat.one} {heat.avg}
          </span>
        </span>
      </div>
      <div className="relative h-2 rounded" style={{ background: HEAT_SCALE }} aria-hidden>
        <span className="absolute -top-[5px] h-[18px] w-0.5" style={{ left: `${heat.avg}%`, background: 'var(--text-bright)' }} title={`Average ${heat.one}`} />
        <span className="absolute -top-1 h-4 w-4 rounded-full" style={{ left: `calc(${Math.min(heat.value, 99)}% - 8px)`, background: heatColor(heat.value), border: '3px solid var(--bg)' }} />
      </div>
    </div>
  );
}

function EnergyBlock({ energy }: { energy: NonNullable<HeroProps['energy']> }) {
  const c = energyColor(energy.value);
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline gap-3.5">
        <span className="text-[40px] font-extrabold leading-[0.9]" style={{ color: c }}>{energy.value}</span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[11px] font-bold" style={{ ...MONO, color: c, letterSpacing: 1.4 }}>ENERGY · {energyLabel(energy.value).toUpperCase()}</span>
          <span className="text-sm" style={{ color: 'var(--text-bright)' }}>
            {[energy.avg != null && energy.one ? `average ${energy.one} ${energy.avg}` : null, energy.note].filter(Boolean).join(' · ')}
          </span>
        </span>
      </div>
      <div className="relative h-2 rounded" style={{ background: 'var(--border-soft)' }} aria-hidden>
        <span className="absolute left-0 top-0 h-2 rounded" style={{ width: `${energy.value}%`, background: c }} />
        {energy.avg != null && <span className="absolute -top-[5px] h-[18px] w-0.5" style={{ left: `${energy.avg}%`, background: 'var(--text-bright)' }} />}
      </div>
    </div>
  );
}

// Player hero: who he is (archetype, his season against his position) and
// how he's doing now (Heat and Energy, each against the average at his position).
export function PlayerHero(p: HeroProps) {
  const tc = teamColor(p.team);
  const meta = [p.teamName || tc.name, p.number != null ? `#${p.number}` : null, p.position, p.age != null ? `age ${p.age}` : null, p.height, p.weight, p.shoots ? `shoots ${p.shoots}` : null].filter(Boolean).join(' · ');
  const origin = [p.birthPlace ? `Born ${p.flag ? `${p.flag} ` : ''}${p.birthPlace}` : null, p.drafted ? (p.drafted === 'Undrafted' ? 'Undrafted' : `Drafted ${p.drafted}`) : null].filter(Boolean).join(' · ');
  return (
    <section aria-label="Player" className="grid grid-cols-1 gap-7 rounded-[18px] border p-5 lg:grid-cols-2 lg:p-7" style={{ borderColor: 'var(--border)', background: `linear-gradient(150deg, color-mix(in srgb, ${tc.bg} 40%, transparent) 0%, var(--bg-card) 55%)` }}>
      <div className="flex min-w-0 flex-col gap-3.5">
        {p.outBanner && (
          <div className="inline-flex w-fit items-center gap-2 rounded-md px-2.5 py-1 text-[10px] font-bold" style={{ ...MONO, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: 'var(--red)', letterSpacing: 1 }}>
            {p.outBanner.label}<span className="font-medium" style={{ color: 'var(--text)' }}>{p.outBanner.note}</span>
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-full border-[3px] lg:h-[104px] lg:w-[104px]" style={{ background: tc.bg, borderColor: 'var(--border)' }}>
            {p.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photo} alt={`${p.first} ${p.last}`} className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="text-[32px] font-extrabold leading-none lg:text-[42px]" style={{ color: 'var(--text-bright)', letterSpacing: '-0.035em' }}>
              {p.first} <span style={{ color: 'var(--heat)' }}>{p.last}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[13px] lg:text-sm" style={{ color: 'var(--text)' }}>
              <TeamChip abbrev={p.team} size={22} /><span>{meta}</span>
            </div>
            {origin && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{origin}</div>}
          </div>
        </div>
        {p.archetype && (
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-lg px-3 py-1.5 text-[15px] font-extrabold" style={{ background: 'var(--heat)', color: 'var(--bg)', letterSpacing: 0.4 }}>{p.archetype.name.toUpperCase()}</span>
            {p.archetype.basis && <span className="text-[13px]" style={{ color: 'var(--text)' }}>{p.archetype.basis}</span>}
          </div>
        )}
        <div className="text-[15px] leading-relaxed" style={{ color: 'var(--text-bright)' }}>{p.headline}</div>
      </div>
      <div className="flex flex-col justify-center gap-5">
        {p.heat !== 'none' && <HeatBlock heat={p.heat} />}
        {p.energy && <EnergyBlock energy={p.energy} />}
      </div>
    </section>
  );
}
