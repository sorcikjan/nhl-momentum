import Link from 'next/link';
import { Headshot, HeatPill, SectionHeading } from '@/components/ds';
import type { RankRow } from '@/lib/home';
import { MONO } from './format';
import { RankingsTabs } from './RankingsTabs';

export type RankColumn = { key: string; tab: string; kicker: string; title: string; sub: string; color: string; href: string; rows: RankRow[] };

export function RankList({ rows }: { rows: RankRow[] }) {
  if (!rows.length) return <p className="py-3 text-xs" style={{ color: 'var(--text-muted)' }}>Not enough games yet.</p>;
  return (
    <>
      {rows.map((p, i) => (
        <Link key={p.playerId} href={p.href} className="flex items-center gap-2.5 py-2.5" style={{ borderTop: i ? '1px solid var(--border-soft)' : undefined }}>
          <span className="w-4 text-[10px] font-bold" style={{ ...MONO, color: 'var(--text-muted)' }}>{i + 1}</span>
          <Headshot src={p.photo} name={p.name} team={p.team} size={28} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold" style={{ color: 'var(--text-bright)' }}>{p.name}</div>
            <div className="mt-px text-[9px] lg:text-[10px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{p.sub}</div>
          </div>
          {p.heat != null && <HeatPill heat={p.heat} size="sm" />}
        </Link>
      ))}
    </>
  );
}

// Heat / goalies / rookies top 5 (design TripleRankings; mobile shows one list
// at a time behind pill tabs, per MobileHomeFinal).
export function TripleRankings({ columns }: { columns: RankColumn[] }) {
  return (
    <section data-section="rankings">
      <SectionHeading kicker="RANKINGS · LIVE" title="Who's hot. Right now." size="feature" />
      <div className="hidden grid-cols-1 gap-4 lg:grid lg:grid-cols-3">
        {columns.map(c => (
          <div key={c.key} className="rounded-[14px] border p-[22px]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="mb-1.5 text-[10px] font-bold" style={{ ...MONO, color: c.color, letterSpacing: 1.4 }}>{c.kicker}</div>
            <h3 className="mb-1 text-xl font-extrabold" style={{ color: 'var(--text-bright)', letterSpacing: -0.5 }}>{c.title}</h3>
            <div className="mb-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>{c.sub}</div>
            <RankList rows={c.rows} />
            <Link href={c.href} className="mt-3.5 block border-t pt-3 text-[11px] font-semibold" style={{ ...MONO, color: c.color, borderColor: 'var(--border-soft)', letterSpacing: 0.5 }}>
              FULL LIST →
            </Link>
          </div>
        ))}
      </div>
      <div className="lg:hidden">
        <RankingsTabs tabs={columns.map(c => ({ key: c.key, label: c.tab, color: c.color }))}>
          {columns.map(c => (
            <div key={c.key} className="rounded-[10px] border px-3 py-1.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <RankList rows={c.rows} />
            </div>
          ))}
        </RankingsTabs>
      </div>
    </section>
  );
}
