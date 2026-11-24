// Desktop only: what the radar says, beside it. Top of his position, bottom,
// and what moved most from the season to the last three weeks (prototype v25).
import { radarReadout, type Axis } from '@/lib/profile-v3';

const head = 'mb-2.5 text-[10px] font-bold uppercase tracking-[1.2px]';
const mono = { color: 'var(--text-muted)', fontFamily: 'ui-monospace,monospace' };

function Row({ label, note, value, color }: { label: string; note: string; value: string; color: string }) {
  return (
    <div className="flex items-baseline gap-3 border-t py-2 first-of-type:border-t-0" style={{ borderColor: 'var(--border-soft)' }}>
      <span className="flex-1 text-[15px]" style={{ color: '#c5ccd8' }}>{label}</span>
      <em className="text-[13px] not-italic" style={{ color: 'var(--text-muted)' }}>{note}</em>
      <b className="min-w-[110px] text-right text-[17px] font-black" style={{ color }}>{value}</b>
    </div>
  );
}

export function RadarReadout({ axes, of }: { axes: Axis[]; of: string }) {
  const r = radarReadout(axes);
  if (!r.top.length && !r.bottom.length && !r.moved.length) return null;
  return (
    <div className="flex flex-col gap-6">
      {r.top.length > 0 && (
        <div>
          <h3 className={head} style={mono}>Top of the league{r.recent ? ' · last 3 weeks' : ' · season'}</h3>
          {r.top.map(t => <Row key={t.label} label={t.label} note={`better than ${t.pct}% of ${of}`} value={`top ${Math.max(1, 100 - t.pct)}%`} color="#ff7a3a" />)}
        </div>
      )}
      {r.bottom.length > 0 && (
        <div>
          <h3 className={head} style={mono}>Bottom of the league</h3>
          {r.bottom.map(t => <Row key={t.label} label={t.label} note={`better than ${t.pct}% of ${of}`} value={`bottom ${Math.max(1, t.pct)}%`} color="var(--text-dim, #8a94a6)" />)}
        </div>
      )}
      {r.moved.length > 0 && (
        <div>
          <h3 className={head} style={mono}>Moved most · season → last 3 weeks</h3>
          {r.moved.map(m => {
            const d = m.to - m.from;
            return <Row key={m.label} label={m.label} note={`percentile ${m.from} → ${m.to}`} value={`${d > 0 ? '▲' : '▼'} ${Math.abs(d)}`} color={d > 0 ? 'var(--rise)' : 'var(--cold)'} />;
          })}
        </div>
      )}
    </div>
  );
}
