import Link from 'next/link';
import { TeamChip } from '@/components/ds';
import { heatColor } from '@/lib/heat';
import type { StandingRow } from '@/lib/nhl-stats';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;

// One standings table: the official record, then each team's Heat (its five
// hottest skaters). `detail` adds GD and last 10 for the full standings page.
export function StandingsTable({ caption, rows, detail = false }: { caption: string; rows: StandingRow[]; detail?: boolean }) {
  const th = 'px-2 pb-2 pt-1.5 font-bold text-right';
  return (
    <div className="overflow-x-auto rounded-[14px] border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <table className="w-full border-collapse text-[13px]" style={{ minWidth: detail ? 560 : 440 }}>
        <caption className="px-4 pb-2.5 pt-3.5 text-left text-[15px] font-extrabold" style={{ color: 'var(--text-bright)' }}>{caption}</caption>
        <thead>
          <tr className="text-[10px]" style={{ ...MONO, color: 'var(--text-muted)', letterSpacing: 0.8 }}>
            <th scope="col" className="pb-2 pl-4 pr-2 pt-1.5 text-left font-bold">#</th>
            <th scope="col" className="px-2 pb-2 pt-1.5 text-left font-bold">TEAM</th>
            <th scope="col" className={th}>GP</th>
            <th scope="col" className={th}>W-L-OT</th>
            <th scope="col" className={th} style={{ color: 'var(--text-bright)' }}>PTS</th>
            {detail && <th scope="col" className={th}>GD</th>}
            {detail && <th scope="col" className={th}>L10</th>}
            <th scope="col" className={th}>STRK</th>
            <th scope="col" className="pb-2 pl-2 pr-4 pt-1.5 text-right font-bold" style={{ color: 'var(--heat)' }}>HEAT</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => (
            <tr key={t.abbrev} className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
              <td className="py-[7px] pl-4 pr-2 text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{i + 1}</td>
              <td className="px-2 py-[7px]">
                {t.href
                  ? <Link href={t.href} className="flex items-center gap-2 font-semibold hover:underline" style={{ color: 'var(--text-bright)' }}><TeamChip abbrev={t.abbrev} size={22} />{t.name}</Link>
                  : <span className="flex items-center gap-2 font-semibold" style={{ color: 'var(--text-bright)' }}><TeamChip abbrev={t.abbrev} size={22} />{t.name}</span>}
              </td>
              <td className="px-2 py-[7px] text-right tabular-nums" style={{ color: 'var(--text)' }}>{t.gp}</td>
              <td className="px-2 py-[7px] text-right tabular-nums" style={{ color: 'var(--text)' }}>{t.w}-{t.l}-{t.otl}</td>
              <td className="px-2 py-[7px] text-right font-extrabold tabular-nums" style={{ color: 'var(--text-bright)' }}>{t.pts}</td>
              {detail && <td className="px-2 py-[7px] text-right tabular-nums" style={{ color: 'var(--text)' }}>{t.gd > 0 ? `+${t.gd}` : t.gd}</td>}
              {detail && <td className="px-2 py-[7px] text-right tabular-nums" style={{ color: 'var(--text)' }}>{t.l10}</td>}
              <td className="px-2 py-[7px] text-right text-[11px]" style={{ ...MONO, color: 'var(--text)' }}>{t.streak}</td>
              <td className="py-[7px] pl-2 pr-4">
                {t.heat == null ? <span className="block text-right" style={{ color: 'var(--text-muted)' }}>–</span> : (
                  <span className="flex items-center justify-end gap-2">
                    <span aria-hidden className="h-1 w-11 overflow-hidden rounded-sm" style={{ background: 'var(--bg-raised)' }}>
                      <span className="block h-full" style={{ width: `${t.heat}%`, background: heatColor(t.heat) }} />
                    </span>
                    <span className="min-w-[22px] text-right font-extrabold tabular-nums" style={{ color: heatColor(t.heat) }}>{t.heat}</span>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Teams of one conference or division, in league order.
export const byGroup = (rows: StandingRow[], key: 'conference' | 'division') =>
  [...new Set(rows.map(r => r[key]))].filter(Boolean).sort().map(name => ({ name, rows: rows.filter(r => r[key] === name) }));
