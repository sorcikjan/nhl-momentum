// A goalie's role: starts among his team's goalies.
export function GoalieStarts({ rows }: { rows: { name: string; starts: number; me: boolean }[] }) {
  const max = Math.max(1, ...rows.map(r => r.starts));
  if (!rows.length) return <div className="py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No starts yet</div>;
  return (
    <div>
      {rows.map(r => (
        <div key={r.name} className="grid grid-cols-[1fr_64px_22px] items-center gap-2 py-1 text-xs">
          <i className="block h-3.5 rounded-[3px]" style={{ width: `${Math.max(4, Math.round((r.starts / max) * 100))}%`, background: r.me ? 'var(--heat)' : 'var(--border)' }} />
          <span style={{ color: r.me ? 'var(--text-bright)' : 'var(--text-dim, #8a94a6)', fontWeight: r.me ? 700 : 400 }}>{r.name}</span>
          <b className="text-right font-black" style={{ color: 'var(--text-bright)' }}>{r.starts}</b>
        </div>
      ))}
      <div className="mt-1 text-[9px]" style={{ color: 'var(--text-muted)' }}>starts this season</div>
    </div>
  );
}
