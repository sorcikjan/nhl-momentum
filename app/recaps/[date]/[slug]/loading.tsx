// The night recap's shape while it loads: header, then the 16:9 cover and article beside the scoreboard.
export default function Loading() {
  const bar = (w: string, h = 'h-4', bg = 'var(--border)') => <div className={`${h} animate-pulse rounded`} style={{ background: bg, width: w }} />;
  return (
    <div className="flex flex-col gap-8 pb-20 lg:pb-0">
      <div className="flex max-w-[860px] flex-col gap-3">
        {bar('220px', 'h-3')}
        {bar('85%', 'h-10', 'var(--bg-card)')}
        {bar('60%', 'h-10', 'var(--bg-card)')}
        {bar('180px', 'h-3')}
      </div>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-3">
          <div className="mb-4 w-full animate-pulse rounded-[18px]" style={{ aspectRatio: '16/9', background: 'var(--bg-card)' }} />
          {['100%', '100%', '82%', '100%', '67%'].map((w, i) => <div key={i}>{bar(w)}</div>)}
        </div>
        <div className="flex flex-col gap-2">{[0, 1, 2, 3].map(i => <div key={i} className="h-10 animate-pulse rounded-lg" style={{ background: 'var(--bg-card)' }} />)}</div>
      </div>
    </div>
  );
}
