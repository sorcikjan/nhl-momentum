// Last-N results as colored cells (design game-detail-final FormStreak).
export function FormStreak({ team, results }: { team?: string; results: ('W' | 'L' | 'OTL')[] }) {
  return (
    <div className="flex items-center gap-2.5">
      {team && (
        <span className="w-9 text-[11px] font-bold" style={{ fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text-bright)' }}>
          {team}
        </span>
      )}
      <div className="flex gap-1">
        {results.map((r, i) => (
          <span
            key={i}
            data-result={r}
            title={r}
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-extrabold text-white"
            style={{ background: r === 'W' ? 'var(--rise)' : r === 'OTL' ? 'var(--gold)' : 'var(--red)' }}
          >
            {r === 'OTL' ? 'L' : r}
          </span>
        ))}
      </div>
    </div>
  );
}
