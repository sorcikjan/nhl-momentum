import Link from 'next/link';
import { Headshot, HeatPill, SectionHeading, TeamChip } from '@/components/ds';
import type { ResultCard } from '@/lib/home';
import { dayLabel, MONO } from './format';

function Tally({ results }: { results: ResultCard[] }) {
  const judged = results.filter(r => r.pick);
  if (!judged.length) return null;
  const hits = judged.filter(r => r.pick === 'hit').length;
  return (
    <div className="flex items-center gap-3 rounded-[10px] border px-3 py-1.5 lg:px-4 lg:py-2.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}>
      <span className="hidden text-[10px] font-bold lg:inline" style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 1 }}>WE GOT</span>
      <span className="text-sm font-extrabold lg:text-[22px]" style={{ ...MONO, color: 'var(--rise)' }}>{hits}/{judged.length}</span>
      <span className="text-[9px] font-semibold lg:text-[10px]" style={{ ...MONO, color: 'var(--text)' }}>right · {Math.round((hits / judged.length) * 100)}%</span>
    </div>
  );
}

function TeamLine({ t, won }: { t: ResultCard['home']; won: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <TeamChip abbrev={t.abbrev} size={26} />
      <span className="flex-1 truncate text-[13px]" style={{ fontWeight: won ? 700 : 500, color: won ? 'var(--text-bright)' : 'var(--text)' }}>{t.name}</span>
      <span className="text-[22px] font-extrabold" style={{ ...MONO, color: won ? 'var(--text-bright)' : 'var(--text-muted)', letterSpacing: -0.5 }}>{t.score}</span>
    </div>
  );
}

// Last game day: our pick vs the result + first star (design ResultsSection).
export function ResultsSection({ date, results }: { date: string | null; results: ResultCard[] }) {
  if (!date || !results.length) return null;
  const hit = (r: ResultCard) => r.pick === 'hit';
  return (
    <section data-section="results">
      <SectionHeading
        kicker={`${dayLabel(date).toUpperCase()} · ${results.length} GAME${results.length === 1 ? '' : 'S'}`}
        title="Results & predictions."
        size="feature"
        right={<Tally results={results} />}
      />
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-4 lg:gap-3">
        {results.map(r => (
          <Link key={r.id} href={r.href} className="overflow-hidden rounded-xl border transition-colors hover:border-[var(--border)]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}>
            {r.pick && (
              <div
                className="flex items-center justify-between px-3.5 py-2"
                style={{
                  background: hit(r) ? 'rgba(0, 229, 160, 0.1)' : 'rgba(58, 136, 255, 0.1)',
                  borderBottom: `1px solid ${hit(r) ? 'rgba(0, 229, 160, 0.2)' : 'rgba(58, 136, 255, 0.2)'}`,
                }}
              >
                <span className="text-[9px] font-bold" style={{ ...MONO, color: hit(r) ? 'var(--rise)' : 'var(--cold)', letterSpacing: 1 }}>
                  {hit(r) ? '✓ PICK HIT' : '✗ PICK MISS'}
                </span>
                <span className="text-[10px] font-semibold" style={{ ...MONO, color: 'var(--text)' }}>{r.pickTeam} {r.pickPct}%</span>
              </div>
            )}
            <div className="flex flex-col gap-2 px-4 pb-3.5 pt-4">
              <TeamLine t={r.away} won={r.away.score > r.home.score} />
              <TeamLine t={r.home} won={r.home.score > r.away.score} />
            </div>
            {r.star && (
              <div className="flex items-center gap-2 border-t px-3.5 py-2.5" style={{ borderColor: 'var(--border-soft)' }}>
                <span className="text-[9px] font-bold" style={{ ...MONO, color: 'var(--heat)' }}>★</span>
                <Headshot src={r.star.photo} name={r.star.name} team={r.star.team} size={24} />
                <span className="flex-1 truncate text-xs font-semibold" style={{ color: 'var(--text-bright)' }}>{r.star.name}</span>
                {r.starHeat != null && <HeatPill heat={r.starHeat} size="sm" />}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
