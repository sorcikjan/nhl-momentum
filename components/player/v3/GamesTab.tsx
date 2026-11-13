// Games: season totals with his rank, then every game for looking things up.
import { heatColor } from '@/lib/heat';
import { Card, ResultBox } from './Card';
import type { ProfileV3View } from './types';

const SHOWN = 8;
const month = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
const day = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });

export function GamesTab({ v }: { v: ProfileV3View }) {
  const g = v.games;
  const cols = `48px 1fr ${g.columns.map(c => (c === 'SAVES' ? '48px' : c === 'DEC' || c === 'HEAT' ? '42px' : c === 'SV%' ? '40px' : '28px')).join(' ')}`;
  const row = (r: ProfileV3View['games']['rows'][number], i: number, all: typeof g.rows) => (
    <div key={r.date + i}>
      {(i === 0 || month(all[i - 1].date) !== month(r.date)) && (
        <div className="mb-0.5 mt-3 text-[9px] font-bold uppercase tracking-[1.2px]" style={{ color: 'var(--text-muted)', fontFamily: 'ui-monospace,monospace' }}>{month(r.date)}</div>
      )}
      <div className="grid items-center gap-1 border-t py-2 text-[13px]" style={{ gridTemplateColumns: cols, borderColor: 'var(--border-soft)' }}>
        <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{day(r.date)}</span>
        <span className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--text-bright)' }}><ResultBox r={r.result} />{r.opp}</span>
        {r.cells.map((c, k) => (
          <span key={k} className="text-right" style={{ color: r.strong[k] ? '#ff7a3a' : c === '0' ? '#333a48' : 'var(--text-bright)', fontWeight: r.strong[k] ? 900 : 400 }}>{c}</span>
        ))}
        {!v.goalie && <span className="text-right font-extrabold" style={{ color: r.heat != null ? heatColor(r.heat) : 'var(--text-muted)' }}>{r.heat ?? '–'}</span>}
      </div>
    </div>
  );
  const older = g.rows.slice(SHOWN);
  return (
    <div className="pb-4">
      <Card title={v.goalie ? 'This season · NHL' : 'This season'} right={g.note}>
        <div className="flex gap-1.5">
          {g.totals.map(t => (
            <div key={t.label} className="flex-1 rounded-[10px] py-2 text-center" style={{ background: 'var(--bg)' }}>
              <b className="block text-xl font-black leading-none" style={{ color: 'var(--text-bright)' }}>{t.value}</b>
              <span className="mt-1 block text-[8px] font-bold tracking-[1px]" style={{ color: 'var(--text-muted)', fontFamily: 'ui-monospace,monospace' }}>{t.label}</span>
              <em className="mt-1 block text-[10px] font-extrabold not-italic" style={{ color: t.rank?.startsWith('#') ? 'var(--heat)' : 'var(--text-dim)' }}>{t.rank ?? ' '}</em>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Every game" right="newest first">
        {g.rows.length === 0 ? (
          <div className="py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No NHL games yet this season</div>
        ) : <>
          <div className="grid gap-1 text-[8px] font-bold tracking-[.8px]" style={{ gridTemplateColumns: cols, color: 'var(--text-muted)', fontFamily: 'ui-monospace,monospace' }}>
            <span /><span />{g.columns.map(c => <span key={c} className="text-right">{c}</span>)}
          </div>
          {g.rows.slice(0, SHOWN).map((r, i, a) => row(r, i, a))}
          {older.length > 0 && (
            <details className="group">
              <summary className="mt-2.5 cursor-pointer list-none rounded-lg p-2 text-center text-[11px] group-open:hidden" style={{ background: 'var(--bg)', color: 'var(--text-dim)' }}>{older.length} earlier game{older.length === 1 ? '' : 's'} ▾</summary>
              {older.map((r, i, a) => row(r, i, a))}
            </details>
          )}
        </>}
      </Card>
    </div>
  );
}
