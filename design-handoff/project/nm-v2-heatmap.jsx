// Variation 2 — HEAT MAP
// Bold visual metaphor: the league as a grid of heat squares.
// Every player is a colored tile. Hottest glow, cold fade.

function V2Heatmap() {
  // Sort by heat desc, take 25 for a 5x5-ish grid
  const sorted = [...PLAYERS].sort((a, b) => b.heat - a.heat).slice(0, 24);
  const topHot = sorted.slice(0, 3);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: NM.bg, color: NM.textBright }}>
      <PhoneTopBar subtitle="League Heat Map" variant="heat"
        right={<div style={{ fontSize: 10, color: NM.text, fontFamily: NM.fontMono }}>live</div>}
      />

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {/* Headline */}
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{
            fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 30,
            lineHeight: 1, letterSpacing: -1, color: NM.textBright,
          }}>
            Who's
            <span style={{ color: NM.heat }}> burning</span>?
          </div>
          <div style={{ fontSize: 12, color: NM.text, marginTop: 6 }}>
            24 skaters, scored 0–100 on their last 5 games.
          </div>
        </div>

        {/* Top 3 summary bar */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{
            display: 'flex', gap: 8, padding: 12,
            background: `linear-gradient(135deg, ${NM.heatDim} 0%, transparent 100%)`,
            border: `1px solid ${NM.heatDim}`, borderRadius: 12,
          }}>
            {topHot.map((p, i) => (
              <div key={p.id} style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700 }}>#{i+1}</span>
                  <TeamChip code={p.team} size={14} fontSize={7} radius={3}/>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: NM.textBright, lineHeight: 1.15, marginBottom: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.last}
                </div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 16, fontWeight: 700, color: heatColor(p.heat), lineHeight: 1 }}>
                  {p.heat}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Heat grid */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
          }}>
            {sorted.map(p => {
              const c = heatColor(p.heat);
              const intensity = p.heat / 100;
              const glow = p.heat >= 80 ? `0 0 24px ${c}66` : p.heat >= 65 ? `0 0 12px ${c}33` : 'none';
              return (
                <div key={p.id} style={{
                  aspectRatio: '1',
                  borderRadius: 8,
                  background: `linear-gradient(155deg, ${c}${Math.round(intensity*255).toString(16).padStart(2,'0').slice(0,2)} 0%, ${NM.bgCard} 100%)`,
                  border: `1px solid ${p.heat >= 70 ? c+'55' : NM.borderSoft}`,
                  padding: 8,
                  position: 'relative', overflow: 'hidden',
                  boxShadow: glow,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <TeamChip code={p.team} size={16} fontSize={7} radius={3}/>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 14, fontWeight: 700, color: c, lineHeight: 1 }}>
                      {p.heat}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: NM.textMuted, fontWeight: 500, letterSpacing: 0.2, marginBottom: 2 }}>
                      {p.pos} · #{p.num ?? ''}
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: NM.textBright, lineHeight: 1.1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.last}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', background: NM.bgCard, borderRadius: 10,
            border: `1px solid ${NM.borderSoft}`,
          }}>
            <span style={{ fontSize: 10, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', flexShrink: 0 }}>
              Heat
            </span>
            <div style={{
              flex: 1, height: 6, borderRadius: 3,
              background: 'linear-gradient(90deg, #4a88ff 0%, #8a94a6 30%, #f7b267 60%, #ff5a24 85%, #ff3a0f 100%)',
            }}/>
            <div style={{ display: 'flex', gap: 12, fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>
              <span>0</span><span>50</span><span style={{ color: NM.heat, fontWeight: 700 }}>100</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: NM.textMuted, marginTop: 8, lineHeight: 1.4 }}>
            Heat = a player's last-5-game pace, scored against their own season average and strength-of-schedule. Hover on the web, tap on mobile.
          </div>
        </div>

        {/* Tonight's games — compact */}
        <div style={{ padding: '0 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: NM.fontDisplay, fontWeight: 800, fontSize: 16, color: NM.textBright, letterSpacing: -0.2 }}>
              Tonight
            </span>
            <span style={{ fontSize: 11, color: NM.heat, fontWeight: 600 }}>6 games →</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {GAMES.slice(0, 3).map(g => <ScoreRow key={g.id} game={g}/>)}
          </div>
        </div>
      </div>

      <PhoneTabBar active="hot"/>
    </div>
  );
}

Object.assign(window, { V2Heatmap });
