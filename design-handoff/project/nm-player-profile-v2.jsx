// Player Profile v2 — essential traffic driver
// Story-forward, data-rich, shareable. This is where SEO lands.

function PlayerProfileV2({ onBack }) {
  const p = PLAYERS[0]; // McDavid
  const seasonAvg = 68;
  const recentGames = [
    { opp: 'COL', home: true,  score: '5-3 W', g: 3, a: 0, toi: '22:14', heat: 94, result: 'W' },
    { opp: 'VAN', home: true,  score: '4-2 W', g: 1, a: 3, toi: '21:48', heat: 90, result: 'W' },
    { opp: 'CGY', home: false, score: '6-4 W', g: 2, a: 2, toi: '20:32', heat: 88, result: 'W' },
    { opp: 'SEA', home: false, score: '3-2 W', g: 0, a: 3, toi: '23:02', heat: 82, result: 'W' },
    { opp: 'LAK', home: true,  score: '4-1 W', g: 1, a: 3, toi: '22:51', heat: 75, result: 'W' },
  ];

  // Comparable players for the "see also"
  const related = PLAYERS.filter(x => x.pos === 'C' && x.id !== p.id).slice(0, 4);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: NM.bg, color: NM.textBright }}>
      {/* ═══════════════════════════════════════════════════════════
          HERO — full-bleed photo with overlapping name
          ═══════════════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', height: 300, flexShrink: 0 }}>
        <PhotoPlaceholder w="100%" h={300} subject="McDavid in motion" team={p.team}/>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(10,11,15,0.3) 0%, transparent 30%, rgba(10,11,15,0.6) 80%, rgba(10,11,15,0.95) 100%)',
        }}/>

        {/* Back + actions */}
        <div style={{ position: 'absolute', top: 14, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{
            border: 0, cursor: 'pointer', padding: 0,
            width: 36, height: 36, borderRadius: 18, background: 'rgba(10,11,15,0.55)',
            backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              <svg key="s" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/></svg>,
              <svg key="b" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M6 3h12v18l-6-4-6 4Z"/></svg>,
            ].map((s, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: 18, background: 'rgba(10,11,15,0.55)',
                backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{s}</div>
            ))}
          </div>
        </div>

        {/* Jersey number ghost */}
        <div style={{
          position: 'absolute', right: -10, bottom: 60,
          fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 240,
          color: 'rgba(255,255,255,0.06)', letterSpacing: -10, lineHeight: 0.8,
          pointerEvents: 'none',
        }}>{p.num}</div>

        {/* Name block */}
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <TeamChip code={p.team} size={22} fontSize={10} radius={3}/>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontFamily: NM.fontMono, fontWeight: 600, letterSpacing: 0.3, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
              {TEAMS[p.team].name.toUpperCase()} · #{p.num} · {p.pos} · AGE {p.age}
            </span>
          </div>
          <div style={{
            fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 40,
            letterSpacing: -1.4, lineHeight: 0.95, color: '#fff',
            textShadow: '0 2px 12px rgba(0,0,0,0.6)',
          }}>
            {p.first}<br/>
            <span style={{ color: NM.heat }}>{p.last}.</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
        {/* ═══════════════════════════════════════════════════════════
            HEAT SUMMARY — big number + one-liner story
            ═══════════════════════════════════════════════════════════ */}
        <div style={{
          margin: '-20px 16px 0', padding: 16, borderRadius: 14,
          background: NM.bgCard, border: `1px solid ${NM.border}`,
          position: 'relative', zIndex: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <HeatBadge heat={p.heat} size={72} thickness={5}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{
                  fontFamily: NM.fontMono, fontSize: 10, fontWeight: 700, letterSpacing: 1, color: NM.heat,
                  background: 'rgba(255,90,36,0.15)', padding: '2px 7px', borderRadius: 3,
                }}>🔥 ON FIRE</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 700 }}>
                  +{p.heat - seasonAvg} vs season
                </span>
              </div>
              <div style={{
                fontFamily: NM.fontDisplay, fontWeight: 700, fontSize: 16,
                lineHeight: 1.2, letterSpacing: -0.3, color: NM.textBright,
                textWrap: 'pretty',
              }}>
                {p.story}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            KEY STATS — last 5, season, career pace
            ═══════════════════════════════════════════════════════════ */}
        <div style={{ padding: '20px 16px 8px' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <StatBlock label="Goals" val={p.g} sub={`L${p.gm}`} accent={NM.heat}/>
            <StatBlock label="Assists" val={p.a} sub={`L${p.gm}`}/>
            <StatBlock label="Points" val={p.g + p.a} sub={`L${p.gm}`}/>
            <StatBlock label="+/-" val="+11" sub={`L${p.gm}`} accent={NM.rise}/>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            HEAT TIMELINE — the signature chart
            ═══════════════════════════════════════════════════════════ */}
        <div style={{ padding: '14px 20px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: NM.fontDisplay, fontWeight: 800, fontSize: 17, color: NM.textBright, letterSpacing: -0.3 }}>
                Heat over 6 weeks
              </div>
              <div style={{ fontSize: 11, color: NM.textMuted, marginTop: 2 }}>
                From {p.trend[0]} → {p.heat} · net <span style={{ color: NM.rise, fontFamily: NM.fontMono, fontWeight: 600 }}>+{p.heat - p.trend[0]}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['6W','S','C'].map((l, i) => (
                <span key={l} style={{
                  fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 4,
                  background: i === 0 ? NM.heatDim : 'transparent',
                  color: i === 0 ? NM.heat : NM.textMuted,
                  border: `1px solid ${i === 0 ? NM.heat+'55' : NM.borderSoft}`,
                }}>{l}</span>
              ))}
            </div>
          </div>

          <HeatTimeline values={p.trend} seasonAvg={seasonAvg}/>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            RECENT GAMES — the "streak" table
            ═══════════════════════════════════════════════════════════ */}
        <div style={{ padding: '20px 20px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: NM.fontDisplay, fontWeight: 800, fontSize: 17, color: NM.textBright, letterSpacing: -0.3 }}>
              Last 5 games
            </div>
            <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.rise, fontWeight: 600 }}>5–0–0</span>
          </div>

          <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${NM.borderSoft}` }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '36px 1fr 60px 40px 36px',
              gap: 8, padding: '8px 12px', background: NM.bgCard,
              fontSize: 9, fontWeight: 700, color: NM.textMuted, letterSpacing: 0.8, textTransform: 'uppercase',
            }}>
              <span>VS</span>
              <span>Result</span>
              <span style={{ textAlign: 'center' }}>G–A</span>
              <span style={{ textAlign: 'right' }}>TOI</span>
              <span style={{ textAlign: 'right' }}>Heat</span>
            </div>
            {recentGames.map((g, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 60px 40px 36px',
                gap: 8, padding: '11px 12px', alignItems: 'center',
                borderTop: `1px solid ${NM.borderSoft}`,
                background: NM.bg,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9, color: NM.textMuted, fontFamily: NM.fontMono }}>
                    {g.home ? 'vs' : '@'}
                  </span>
                  <TeamChip code={g.opp} size={18} fontSize={8} radius={2}/>
                </div>
                <span style={{ fontSize: 12, color: NM.textBright, fontFamily: NM.fontMono, fontWeight: 600 }}>
                  <span style={{ color: g.result === 'W' ? NM.rise : NM.cold, fontWeight: 700 }}>{g.result}</span>
                  <span style={{ color: NM.textMuted, marginLeft: 6 }}>{g.score.replace(/[WL]\s*/, '')}</span>
                </span>
                <span style={{ fontSize: 12, fontFamily: NM.fontMono, color: NM.textBright, fontWeight: 600, textAlign: 'center' }}>
                  {g.g}–{g.a}
                </span>
                <span style={{ fontSize: 11, fontFamily: NM.fontMono, color: NM.text, textAlign: 'right' }}>
                  {g.toi}
                </span>
                <span style={{
                  fontSize: 12, fontFamily: NM.fontMono, fontWeight: 700,
                  color: heatColor(g.heat), textAlign: 'right',
                }}>{g.heat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SEASON CONTEXT — where this rank sits
            ═══════════════════════════════════════════════════════════ */}
        <div style={{ padding: '20px 20px 8px' }}>
          <div style={{ fontFamily: NM.fontDisplay, fontWeight: 800, fontSize: 17, color: NM.textBright, letterSpacing: -0.3, marginBottom: 10 }}>
            Where he ranks
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <RankRow label="Heat score"       rank={1} total={312} ofLabel="skaters" bar={p.heat/100} color={NM.heat}/>
            <RankRow label="Points · season"  rank={3} total={312} ofLabel="skaters" bar={0.97}/>
            <RankRow label="Goals · L10"      rank={1} total={312} ofLabel="skaters" bar={1} color={NM.heat}/>
            <RankRow label="5v5 xG per 60"    rank={2} total={312} ofLabel="skaters" bar={0.96}/>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            COMPARE TO
            ═══════════════════════════════════════════════════════════ */}
        <div style={{ padding: '20px 20px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: NM.fontDisplay, fontWeight: 800, fontSize: 17, color: NM.textBright, letterSpacing: -0.3 }}>
              Compare to
            </div>
            <span style={{ fontSize: 11, color: NM.blue, fontWeight: 600 }}>Custom →</span>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, margin: '0 -4px 0', padding: '0 4px' }}>
            {related.map(r => (
              <div key={r.id} style={{
                flexShrink: 0, width: 108, padding: 10, borderRadius: 10,
                background: NM.bgCard, border: `1px solid ${NM.borderSoft}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <TeamChip code={r.team} size={18} fontSize={8} radius={2}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 13, fontWeight: 700, color: heatColor(r.heat) }}>
                    {r.heat}
                  </span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: NM.textBright, lineHeight: 1.15 }}>
                  {r.first[0]}. {r.last}
                </div>
                <div style={{ fontSize: 9, color: NM.textMuted, fontFamily: NM.fontMono, marginTop: 2 }}>
                  {r.g}G {r.a}A
                </div>
                <div style={{ marginTop: 6 }}>
                  <Sparkline values={r.trend} w={86} h={18} fill={false} strokeWidth={1.2}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            STORY CARDS — AI-generated story recaps (traffic hook)
            ═══════════════════════════════════════════════════════════ */}
        <div style={{ padding: '20px 20px 24px' }}>
          <div style={{ fontFamily: NM.fontDisplay, fontWeight: 800, fontSize: 17, color: NM.textBright, letterSpacing: -0.3, marginBottom: 10 }}>
            McDavid stories
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { k: 'LAST NIGHT', d: '24 hours ago', h: 'Hat trick powers Edmonton past Colorado.', dek: 'Three goals in the second period — all five-on-five — pushed his Heat to 94.' },
              { k: 'THE STREAK', d: '1 week ago',   h: '18 points in 5 games: career-best pace continues.', dek: 'Only Gretzky ever started April hotter.' },
              { k: 'THE NUMBER', d: '2 weeks ago',  h: 'His +/- on the road is the league\'s best.', dek: 'A quiet stat that explains why Edmonton is winning close games again.' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '12px 14px', borderRadius: 10,
                background: NM.bgCard, border: `1px solid ${NM.borderSoft}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontFamily: NM.fontMono, fontSize: 9, fontWeight: 700, letterSpacing: 1.2,
                    color: i === 0 ? NM.heat : NM.textMuted,
                  }}>{s.k}</span>
                  <div style={{ width: 3, height: 3, borderRadius: 1.5, background: NM.textMuted }}/>
                  <span style={{ fontSize: 10, color: NM.textMuted, fontFamily: NM.fontMono }}>{s.d}</span>
                </div>
                <div style={{ fontFamily: NM.fontDisplay, fontWeight: 700, fontSize: 14, color: NM.textBright, letterSpacing: -0.2, lineHeight: 1.25, marginBottom: 4, textWrap: 'pretty' }}>
                  {s.h}
                </div>
                <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.45 }}>{s.dek}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat block (4 across top) ────────────────────────────────────
function StatBlock({ label, val, sub, accent = NM.textBright }) {
  return (
    <div style={{
      flex: 1, padding: '12px 10px', borderRadius: 10,
      background: NM.bgCard, border: `1px solid ${NM.borderSoft}`,
    }}>
      <div style={{ fontFamily: NM.fontMono, fontSize: 22, fontWeight: 700, color: accent, lineHeight: 1, letterSpacing: -0.5 }}>
        {val}
      </div>
      <div style={{ fontSize: 10, color: NM.text, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 9, color: NM.textMuted, fontFamily: NM.fontMono, marginTop: 1 }}>
        {sub}
      </div>
    </div>
  );
}

// ─── Heat timeline — the big chart ────────────────────────────────
function HeatTimeline({ values, seasonAvg = 60 }) {
  const w = 330, h = 110, pad = 8;
  const min = Math.min(...values, seasonAvg) - 6;
  const max = Math.max(...values, seasonAvg) + 6;
  const range = max - min;
  const step = (w - pad * 2) / (values.length - 1);

  const pts = values.map((v, i) => ({
    x: pad + i * step,
    y: h - pad - ((v - min) / range) * (h - pad * 2),
    v,
  }));

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length-1].x},${h} L${pts[0].x},${h} Z`;
  const avgY = h - pad - ((seasonAvg - min) / range) * (h - pad * 2);
  const weeks = ['6w', '5w', '4w', '3w', '2w', 'now'];

  return (
    <div style={{
      padding: 12, borderRadius: 10,
      background: NM.bgCard, border: `1px solid ${NM.borderSoft}`,
    }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="heatGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={NM.heat} stopOpacity="0.35"/>
            <stop offset="100%" stopColor={NM.heat} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Season avg line */}
        <line x1={pad} x2={w - pad} y1={avgY} y2={avgY} stroke={NM.textMuted} strokeDasharray="2 3" strokeWidth="1" opacity="0.5"/>
        <text x={w - pad - 2} y={avgY - 4} fontSize="9" fill={NM.textMuted} fontFamily={NM.fontMono} textAnchor="end">
          season avg {seasonAvg}
        </text>
        {/* Area + line */}
        <path d={area} fill="url(#heatGrad)"/>
        <path d={line} fill="none" stroke={NM.heat} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Points */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4 : 2.5} fill={NM.heat} stroke={NM.bg} strokeWidth="1.5"/>
            {i === pts.length - 1 && (
              <>
                <circle cx={p.x} cy={p.y} r="8" fill="none" stroke={NM.heat} strokeWidth="1" opacity="0.3">
                  <animate attributeName="r" values="4;10;4" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
                </circle>
                <text x={p.x} y={p.y - 10} fontSize="11" fontWeight="700" fill={NM.heat} fontFamily={NM.fontMono} textAnchor="middle">
                  {p.v}
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, letterSpacing: 0.3 }}>
        {weeks.map(w => <span key={w}>{w}</span>)}
      </div>
    </div>
  );
}

// ─── Ranking row ──────────────────────────────────────────────────
function RankRow({ label, rank, total, ofLabel, bar, color = NM.textBright }) {
  return (
    <div style={{
      padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 12,
      background: NM.bgCard,
      borderBottom: `1px solid ${NM.borderSoft}`,
    }}>
      <span style={{ fontSize: 12, color: NM.text, flex: 1 }}>{label}</span>
      <div style={{ width: 90, height: 5, background: NM.borderSoft, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          width: `${bar * 100}%`, height: '100%', background: color, borderRadius: 3,
          boxShadow: color === NM.heat ? `0 0 6px ${color}88` : 'none',
        }}/>
      </div>
      <div style={{ fontFamily: NM.fontMono, fontSize: 12, fontWeight: 700, color: NM.textBright, minWidth: 60, textAlign: 'right' }}>
        #{rank} <span style={{ color: NM.textMuted, fontWeight: 500 }}>/ {total}</span>
      </div>
    </div>
  );
}

Object.assign(window, { PlayerProfileV2, StatBlock, HeatTimeline, RankRow });
