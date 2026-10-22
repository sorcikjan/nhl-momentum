import Link from 'next/link';
import { SectionHeading, TeamChip } from '@/components/ds';
import { heatColor } from '@/lib/heat';
import type { TeamHeatRow } from '@/lib/home';
import { MONO } from './format';

// All 32 teams by Heat — the same number as on every game card. Last on the
// page; also the homepage's links into every team page.
export function TeamHeatGrid({ teams }: { teams: TeamHeatRow[] }) {
  if (!teams.length) return null;
  return (
    <section data-section="teams">
      <SectionHeading
        kicker="HEAT BY TEAM · TOP 5 SKATERS"
        title="Teams running hot."
        sub="Average Heat of each team's five hottest skaters — the same number shown on every game card."
        size="feature"
      />
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(128px,1fr))] lg:gap-2.5">
        {teams.map(t => {
          const body = (
            <>
              <TeamChip abbrev={t.abbrev} size={26} />
              <span className="hidden flex-1 text-xs font-bold sm:inline" style={{ ...MONO, color: 'var(--text-bright)' }}>{t.abbrev}</span>
              <span className="text-base font-extrabold tabular-nums" style={{ color: heatColor(t.heat) }}>{t.heat}</span>
            </>
          );
          const cls = 'flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl border px-3 py-2 sm:flex-row sm:justify-start sm:gap-2.5';
          const style = { background: 'var(--bg-card)', borderColor: 'var(--border-soft)' };
          return t.href
            ? <Link key={t.abbrev} href={t.href} className={`${cls} transition-colors hover:bg-[var(--bg-hover)]`} style={style} title={t.name}>{body}</Link>
            : <div key={t.abbrev} className={cls} style={style} title={t.name}>{body}</div>;
        })}
      </div>
    </section>
  );
}
