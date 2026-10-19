import { ArchetypeBadge, EnergyBar, HeatDial, TeamChip, energyColor, energyLabel } from '@/components/ds';
import { teamColor } from '@/lib/team-colors';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;
const DISPLAY = { fontFamily: 'var(--font-fraunces), Georgia, serif' } as const;

export type HeroProps = {
  first: string; last: string; team: string; number: number | null; position: string; age: number | null;
  shoots: string | null; height: string | null; weight: string | null;
  birthPlace: string | null; flag: string | null; drafted: string | null; seasonLine: string;
  photo: string | null;
  heat: number | null; heatDelta: number | null; rankLine: string | null; heatNote?: string;
  energy: number | null; energyNote: string | null;
  archetype: { name: string; blurb: string | null; tags: string[] } | null;
  outBanner: { label: string; note: string } | null;
  bio: React.ReactNode;
};

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[8px] font-bold lg:text-[9px]" style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 1 }}>{label}</div>
      <div className="truncate text-[11px] font-semibold lg:text-[13px]" style={{ color: 'var(--text-bright)' }}>{children}</div>
    </div>
  );
}

function HeatCard({ heat, heatDelta, rankLine, heatNote }: Pick<HeroProps, 'heat' | 'heatDelta' | 'rankLine' | 'heatNote'>) {
  return (
    <div className="flex-1 rounded-[10px] border p-3 lg:rounded-[14px] lg:p-4" style={{ background: 'var(--bg-card)', borderColor: 'rgba(255, 90, 36, 0.33)', boxShadow: '0 0 24px rgba(255, 90, 36, 0.2)' }}>
      <div className="mb-1.5 text-[9px] font-bold lg:mb-2" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.4 }}>HEAT · L5</div>
      <div className="flex items-center gap-3.5">
        <span className="lg:hidden"><HeatDial heat={heat} size={44} /></span>
        <span className="hidden lg:inline-flex"><HeatDial heat={heat} size={80} /></span>
        <div className="min-w-0">
          {heat == null ? (
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{heatNote ?? 'No games yet this season'}</div>
          ) : (
            <>
              {heatDelta != null && heatDelta !== 0 && (
                <div className="text-[10px] font-bold lg:text-xs" style={{ ...MONO, color: heatDelta > 0 ? 'var(--rise)' : 'var(--cold)', letterSpacing: 0.5 }}>
                  {heatDelta > 0 ? '↑ +' : '↓ '}{heatDelta}
                </div>
              )}
              {rankLine && <div className="mt-0.5 text-[9px] lg:text-[11px]" style={{ color: 'var(--text-muted)' }}>{rankLine}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EnergyCard({ energy, energyNote }: Pick<HeroProps, 'energy' | 'energyNote'>) {
  if (energy == null) return null;
  return (
    <div className="flex-1 rounded-[10px] border p-3 lg:rounded-[14px] lg:p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="mb-2.5 flex justify-between text-[9px] font-bold" style={{ ...MONO, letterSpacing: 1.4 }}>
        <span style={{ color: energyColor(energy) }}>ENERGY</span>
        <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>{energyLabel(energy)}</span>
      </div>
      <EnergyBar value={energy} size="lg" />
      {energyNote && <div className="mt-2 text-[9px] leading-snug lg:text-[10px]" style={{ color: 'var(--text-muted)' }}>{energyNote}</div>}
    </div>
  );
}

// Player hero (design DesktopPlayerFinal / MobilePlayerFinal). Full-bleed: cancels
// the layout's top padding and side gutters.
export function PlayerHero(p: HeroProps) {
  const tc = teamColor(p.team);
  const meta = [tc.name.toUpperCase(), p.position, p.age != null ? `AGE ${p.age}` : null].filter(Boolean).join(' · ');
  const body = [p.shoots ? `${p.shoots}-shoots` : null, p.height, p.weight].filter(Boolean).join(' · ');
  return (
    <section className="relative -mx-4 -mt-4 overflow-hidden border-b lg:-mx-12 lg:-mt-8" style={{ borderColor: 'var(--border-soft)' }}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(115deg, ${tc.bg} 0%, var(--bg) 65%)` }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 75% 30%, rgba(255, 90, 36, 0.32) 0%, transparent 55%)' }} />
      {p.number != null && (
        <div aria-hidden className="pointer-events-none absolute -right-5 -top-10 select-none font-black leading-[0.8] lg:right-10 lg:-top-20" style={{ ...DISPLAY, fontSize: 'clamp(240px, 38vw, 560px)', color: 'rgba(255,255,255,0.045)', letterSpacing: '-0.05em' }}>
          {p.number}
        </div>
      )}

      <div className="relative grid grid-cols-1 gap-3.5 px-4 pb-5 pt-4 lg:grid-cols-[320px_1fr_200px] lg:items-end lg:gap-9 lg:px-12 lg:pb-9 lg:pt-10">
        {/* Photo */}
        <div className="relative aspect-[5/3] overflow-hidden rounded-xl border lg:aspect-auto lg:h-[360px] lg:w-[320px] lg:rounded-2xl" style={{ background: 'linear-gradient(160deg, var(--bg-raised) 0%, var(--bg) 100%)', borderColor: 'var(--border)' }}>
          {p.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photo} alt={`${p.first} ${p.last}`} className="absolute inset-0 h-full w-full object-contain object-bottom" />
          )}
          <div className="absolute left-2.5 top-2.5 lg:left-3.5 lg:top-3.5"><TeamChip abbrev={p.team} size={42} /></div>
          {p.number != null && (
            <div className="absolute bottom-2.5 right-2.5 rounded-full px-3 py-1.5 text-[11px] font-bold lg:bottom-3.5 lg:right-3.5 lg:text-[13px]" style={{ ...MONO, background: 'rgba(10,11,15,0.7)', backdropFilter: 'blur(8px)', color: 'var(--text-bright)' }}>
              #{p.number}
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="min-w-0">
          {p.outBanner && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-[10px] font-bold" style={{ ...MONO, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: 'var(--red)', letterSpacing: 1 }}>
              {p.outBanner.label}<span className="font-medium" style={{ color: 'var(--text)' }}>{p.outBanner.note}</span>
            </div>
          )}
          <div className="mb-2 flex flex-wrap items-center gap-2.5 text-[10px] font-bold lg:mb-3 lg:text-[11px]" style={{ ...MONO, color: 'rgba(255,255,255,0.85)', letterSpacing: 1 }}>
            <span>{meta}</span>
            {body && <><span className="h-1 w-1 rounded-full" style={{ background: 'var(--text-muted)' }} /><span className="font-normal" style={{ color: 'rgba(255,255,255,0.7)' }}>{body}</span></>}
          </div>
          <h1 className="mb-3.5 font-black text-white lg:mb-[18px]" style={{ ...DISPLAY, fontSize: 'clamp(44px, 6vw, 88px)', letterSpacing: '-0.036em', lineHeight: 0.92, textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
            {p.first}<br /><span style={{ color: 'var(--heat)' }}>{p.last}.</span>
          </h1>
          <div className="mb-3.5 grid grid-cols-3 gap-2 lg:flex lg:gap-6">
            {p.birthPlace && <Meta label="BORN">{p.flag} {p.birthPlace}</Meta>}
            {p.drafted && <Meta label="DRAFTED">{p.drafted}</Meta>}
            <Meta label="SEASON">{p.seasonLine}</Meta>
          </div>
          {p.archetype && (
            <div className="mb-3.5">
              <span className="lg:hidden"><ArchetypeBadge archetype={p.archetype.name} compact /></span>
              <span className="hidden lg:block"><ArchetypeBadge archetype={p.archetype.name} blurb={p.archetype.blurb} tags={p.archetype.tags} /></span>
            </div>
          )}
          {p.bio}
        </div>

        {/* Heat + energy (stacked on desktop, side by side on mobile) */}
        <div className="flex gap-2 lg:flex-col lg:gap-3.5">
          <HeatCard heat={p.heat} heatDelta={p.heatDelta} rankLine={p.rankLine} heatNote={p.heatNote} />
          <EnergyCard energy={p.energy} energyNote={p.energyNote} />
        </div>
      </div>
    </section>
  );
}

// "AI CHARACTER" bio box under the archetype (design hero center column).
export function AIBioBox({ text }: { text: string }) {
  return (
    <div className="relative rounded-[10px] border px-[18px] py-3.5" style={{ background: 'rgba(10,11,15,0.4)', backdropFilter: 'blur(8px)', borderColor: 'var(--border-soft)' }}>
      <div className="absolute -top-2 left-3.5 rounded-[3px] border px-2 py-0.5 text-[9px] font-bold" style={{ ...MONO, background: 'var(--bg)', color: 'var(--story)', borderColor: 'rgba(229, 80, 139, 0.33)', letterSpacing: 1.2 }}>
        AI CHARACTER
      </div>
      <p className="text-xs leading-relaxed lg:text-[13px]" style={{ color: 'var(--text)', textWrap: 'pretty' }}>{text}</p>
    </div>
  );
}
