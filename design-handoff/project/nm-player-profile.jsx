// Player profile redesign — editorial hero, heat timeline, moments.

function PlayerProfile() {
  const p = PLAYERS[0]; // McDavid
  const recentGames = [
    { opp: 'COL', score: '5-3 W', g: 2, a: 3, heat: 94 },
    { opp: 'VAN', score: '4-2 W', g: 1, a: 2, heat: 90 },
    { opp: 'CGY', score: '6-4 W', g: 3, a: 1, heat: 88 },
    { opp: 'SEA', score: '3-2 W', g: 0, a: 3, heat: 82 },
    { opp: 'LAK', score: '4-1 W', g: 1, a: 2, heat: 75 },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: NM.bg, color: NM.textBright }}>
      {/* Hero with big photo */}
      <div style={{ position: 'relative', height: 260, flexShrink: 0 }}>
        <PhotoPlaceholder w="100%" h={260} subject={`${p.last} action`} team={p.team}/>
        {/* Back button */}
        <div style={{ position: 'absolute', top: 14, left: 16, zIndex: 2 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 18, background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 14, right: 16, zIndex: 2, display: 'flex', gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 18, background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M6 3h12v18l-6-4-6 4Z"/></svg>
          </div>
        </div>

        {/* Big number jersey */}
        <div style={{
          position: 'absolute', right: 12, bottom: 60,
          fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 180, color: 'rgba(255,255,255,0.08)',
          letterSpacing: -6, lineHeight: 0.8, pointerEvents: 'none',
        }}>
          {p.num}
        </div>

        {/* Name + team at bottom */}
        <div style={{ position: 'absolute', left: 16, bottom: 14, right: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <TeamChip code={p.team} size={20} fontSize={9} radius={3}/>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontFamily: NM.fontMono, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              {TEAMS[p.team].name} · #{p.num} · {p.pos}
            </span>
          </div>
          <div style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 36, color: '#fff', letterSpacing: -1.2, lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
            {p.first}<br/>{p.last}.
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20, marginTop: -14, position: 'relative' }}>
        {/* Heat dial + one-liner */}
        <div style={{
          margin: '0 16px', padding: '16px', borderRadius: 14,
          background: NM.bgCard, border: `1px solid ${NM.border}`,
          display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
        }}>
          <HeatBadge heat={p.heat} size={64} thickness={4}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>On fire</div>
            <div style={{ fontFamily: NM.fontDisplay, fontWeight: 700, fontSize: 15, color: NM.textBright, lineHeight: 1.25, letterSpacing: -0.2, marginTop: 3, textWrap: 'pretty' }}>
              Back-to-back hat tricks push Edmonton into first in the Pacific.
            </div>
          </div>
        </div>

        {/* Heat timeline */}
        <div style={{ padding: '18px 20px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>Heat · last 6 weeks</div>
              <div style={{ fontFamily: NM.fontMono, fontSize: 20, color: NM.heat, fontWeight: 700, marginTop: 2 }}>
                {p.trend[0]} → <span style={{ color: NM.heat }}>{p.heat}</span>
              </div>
            </div>
            <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.rise, fontWeight: 600 }}>
              +{p.heat - p.trend[0]}
            </span>
          </div>
          <div style={{ background: NM.bgCard, borderRadius: 10, padding: 10, border: `1px solid ${NM.borderSoft}` }}>
            <Sparkline values={p.trend} w={320} h={60} stroke={NM.heat} strokeWidth={2}/>
          </div>
        </div>

        {/* Stat row */}
        <div style={{ padding: '14px 20px 18px' }}>
          <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: NM.bgCard, borderRadius: 10, border: `1px solid ${NM.borderSoft}` }}>
            <Stat label="Goals L5"  value={p.g} color={NM.heat} size="lg"/>
            <div style={{ width: 1, background: NM.borderSoft }}/>
            <Stat label="Assists L5" value={p.a} color={NM.textBright} size="lg"/>
            <div style={{ width: 1, background: NM.borderSoft }}/>
            <Stat label="Points L5"  value={p.g + p.a} color={NM.textBright} size="lg"/>
            <div style={{ width: 1, background: NM.borderSoft }}/>
            <Stat label="Games"      value={p.gm} color={NM.textMuted} size="lg"/>
          </div>
        </div>

        {/* Last 5 games strip */}
        <div style={{ padding: '0 20px 18px' }}>
          <div style={{ fontSize: 10, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Recent games</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentGames.map((g, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderBottom: i < recentGames.length - 1 ? `1px solid ${NM.borderSoft}` : 'none',
              }}>
                <TeamChip code={g.opp} size={22} fontSize={9} radius={3}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: NM.textBright, fontWeight: 600 }}>vs {g.opp}</div>
                  <div style={{ fontSize: 10, color: NM.textMuted, fontFamily: NM.fontMono }}>{g.score}</div>
                </div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.textBright, width: 54, textAlign: 'right' }}>
                  {g.g}G {g.a}A
                </div>
                <div style={{
                  width: 34, textAlign: 'center',
                  fontFamily: NM.fontMono, fontWeight: 700, fontSize: 13,
                  color: heatColor(g.heat),
                }}>{g.heat}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Compare CTA */}
        <div style={{ padding: '0 20px 30px' }}>
          <div style={{
            padding: '12px 14px', borderRadius: 10,
            background: NM.bgCard, border: `1px solid ${NM.borderSoft}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 16, background: NM.blueDim,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={NM.blue} strokeWidth="2" strokeLinecap="round"><path d="M12 3v18M3 12h18"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: NM.textBright, fontWeight: 600 }}>Compare to MacKinnon</div>
              <div style={{ fontSize: 10, color: NM.textMuted, marginTop: 1 }}>Side-by-side Heat, points, ice time</div>
            </div>
            <span style={{ fontSize: 12, color: NM.blue, fontWeight: 600 }}>→</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PlayerProfile });
