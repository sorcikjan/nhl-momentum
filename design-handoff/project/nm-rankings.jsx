// Rankings table redesign — heat-colored rows + sparklines, mobile-friendly.

function RankingsRedesign() {
  const sorted = [...PLAYERS].sort((a,b)=>b.heat-a.heat);
  const [filter, setFilter] = React.useState('ALL');
  const filtered = filter === 'ALL' ? sorted : sorted.filter(p => p.pos === filter);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: NM.bg, color: NM.textBright }}>
      <PhoneTopBar subtitle="Rankings" variant="heat"/>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {/* Title */}
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 28, letterSpacing: -0.8, lineHeight: 1, color: NM.textBright }}>
            Heat Rankings
          </div>
          <div style={{ fontSize: 12, color: NM.text, marginTop: 6 }}>
            Last 5 vs season. Higher = hotter. <span style={{ color: NM.text, textDecoration: 'underline', textDecorationStyle: 'dotted' }}>How?</span>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ padding: '0 20px 14px', display: 'flex', gap: 6 }}>
          {['ALL','C','L','R','D'].map(pos => {
            const active = filter === pos;
            return (
              <button key={pos} onClick={() => setFilter(pos)} style={{
                border: 0, cursor: 'pointer',
                padding: '7px 12px', borderRadius: 999,
                fontSize: 12, fontWeight: 600,
                background: active ? NM.heat : NM.bgCard,
                color: active ? '#fff' : NM.text,
                border: `1px solid ${active ? NM.heat : NM.borderSoft}`,
              }}>{pos}</button>
            );
          })}
          <div style={{ flex: 1 }}/>
          <div style={{
            padding: '7px 12px', borderRadius: 999, fontSize: 11,
            background: NM.bgCard, color: NM.textMuted, border: `1px solid ${NM.borderSoft}`,
            fontFamily: NM.fontMono,
          }}>
            {filtered.length}
          </div>
        </div>

        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '26px 1fr 60px 44px 36px',
          gap: 10, padding: '6px 20px', fontSize: 9, color: NM.textMuted,
          fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
          borderBottom: `1px solid ${NM.borderSoft}`,
        }}>
          <span>#</span>
          <span>Player</span>
          <span>Trend</span>
          <span style={{ textAlign: 'right' }}>Δ vs avg</span>
          <span style={{ textAlign: 'right' }}>Heat</span>
        </div>

        {/* Rows */}
        <div>
          {filtered.map((p, i) => {
            const delta = p.heat - p.trend[0];
            const c = heatColor(p.heat);
            return (
              <div key={p.id} style={{
                display: 'grid', gridTemplateColumns: '26px 1fr 60px 44px 36px',
                gap: 10, padding: '11px 20px', alignItems: 'center',
                borderBottom: `1px solid ${NM.borderSoft}`,
                position: 'relative',
              }}>
                {/* Left heat stripe */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: c,
                  opacity: p.heat / 100,
                }}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.textMuted, fontWeight: 600 }}>
                  {(i+1).toString().padStart(2, '0')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  <TeamChip code={p.team} size={18} fontSize={8} radius={3}/>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: NM.textBright, fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.first[0]}. {p.last}
                    </div>
                    <div style={{ fontSize: 10, color: NM.textMuted, fontFamily: NM.fontMono, marginTop: 1 }}>
                      {p.pos} · {p.g}G {p.a}A
                    </div>
                  </div>
                </div>
                <Sparkline values={p.trend} w={56} h={20} fill={false} strokeWidth={1.3}/>
                <span style={{
                  fontFamily: NM.fontMono, fontSize: 11, fontWeight: 600, textAlign: 'right',
                  color: delta > 0 ? NM.rise : delta < 0 ? NM.cold : NM.textMuted,
                }}>
                  {delta > 0 ? '+' : ''}{delta}
                </span>
                <span style={{
                  fontFamily: NM.fontMono, fontWeight: 700, fontSize: 14, color: c, textAlign: 'right',
                }}>{p.heat}</span>
              </div>
            );
          })}
        </div>
      </div>

      <PhoneTabBar active="rankings"/>
    </div>
  );
}

Object.assign(window, { RankingsRedesign });
