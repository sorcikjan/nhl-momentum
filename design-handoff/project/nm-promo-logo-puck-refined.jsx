// Refined burning puck logo — single hero version
// Side-profile puck (3/4 view) with a single bold flame rising from it.
// Carefully balanced: puck reads as puck, flame reads as flame.

const RP_C = '#ff5a24';
const RP_C2 = '#ffb547';
const RP_DARK = '#0a0b0f';

// Hero refined mark — puck flying horizontally, flame trails behind.
// Compact line count: puck (3 lines: top ellipse, side, bottom curve)
// + flame as ONE continuous outline with two wave-tongues for sophistication.
function PuckBlaze({ size = 120, mono = false }) {
  const c = mono ? '#fff' : RP_C;
  const sw = size >= 60 ? 4.5 : 3.5;
  return (
    <svg width={size} height={size} viewBox="0 0 120 64" fill="none">
      {/* FLAME — single continuous outline path.
          Starts at the top of the puck's back edge, sweeps backward through
          two wave-tongues, comes back to the bottom of the puck's back edge.
          This is the entire flame in ONE stroked path. */}
      <path d="
        M 78 18
        C 70 16, 58 18, 50 22
        C 60 22, 66 24, 70 28
        C 60 26, 48 28, 38 34
        C 50 32, 60 32, 66 34
        C 54 36, 42 40, 30 48
        C 44 42, 58 40, 68 40
        C 60 42, 50 44, 42 50
        C 56 46, 70 44, 78 46"
        fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round"/>

      {/* PUCK — 3 lines for 3/4 view, on the right (the direction of flight). */}
      {/* Top ellipse */}
      <ellipse cx="92" cy="20" rx="18" ry="6" fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round"/>
      {/* Side body — left edge, bottom curve, right edge */}
      <path d="
        M 74 20
        L 74 40
        C 74 46, 82 48, 92 48
        C 102 48, 110 46, 110 40
        L 110 20"
        fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

function MarkOnSurface({ bg, children, label, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ background: bg, borderRadius: 12, padding: '36px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, border: `1px solid ${NM.borderSoft}` }}>
        {children}
      </div>
      <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1 }}>
        {label} <span style={{ color: NM.text, fontWeight: 500, marginLeft: 6 }}>{sub}</span>
      </div>
    </div>
  );
}

function LogoBurningPuckRefined() {
  return (
    <DCArtboard label="Logo · Burning puck (refined)" width={1320} height={920} style={{ background: NM.bg, padding: 36, borderRadius: 6 }}>
      <div style={{ color: NM.textBright, marginBottom: 24 }}>
        <div style={{ fontFamily: NM.fontMono, fontSize: 10, letterSpacing: 1.4, color: RP_C, fontWeight: 700, marginBottom: 6 }}>ROUND 4 · REFINED</div>
        <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -1, lineHeight: 1.05, marginBottom: 6 }}>The burning puck. Properly drawn.</div>
        <div style={{ fontSize: 13, color: NM.text, maxWidth: 720, lineHeight: 1.5 }}>3/4-view puck with confident geometry and a single bold flame rising from the top. The flame uses a soft gradient (deep heat to amber tip) — one clear shape, instantly readable.</div>
      </div>

      {/* Hero showcase */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: NM.bgCard, borderRadius: 14, padding: 40, border: `1px solid ${NM.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
          <PuckBlaze size={240}/>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Lockup horizontal */}
          <div style={{ background: NM.bgCard, borderRadius: 12, padding: '24px 22px', border: `1px solid ${NM.borderSoft}`, display: 'flex', alignItems: 'center', gap: 16 }}>
            <PuckBlaze size={72}/>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 36, color: NM.textBright, letterSpacing: -1.3, lineHeight: 1 }}>momentum</span>
              <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 36, color: RP_C, letterSpacing: -1.3, lineHeight: 1 }}>.</span>
            </div>
          </div>

          {/* Lockup stacked */}
          <div style={{ background: NM.bgCard, borderRadius: 12, padding: 22, border: `1px solid ${NM.borderSoft}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <PuckBlaze size={60}/>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, color: NM.textBright, letterSpacing: -0.8, lineHeight: 1 }}>momentum</span>
              <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, color: RP_C, letterSpacing: -0.8, lineHeight: 1 }}>.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Variants in context */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <MarkOnSurface bg="#fff" label="ON LIGHT" sub="full color">
          <PuckBlaze size={120}/>
        </MarkOnSurface>
        <MarkOnSurface bg={RP_C} label="ON HEAT" sub="mono white">
          <PuckBlaze size={120} mono={true}/>
        </MarkOnSurface>
        <MarkOnSurface bg={NM.bgCard} label="APP ICON" sub="64 / 32 / 16">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 78, height: 78, borderRadius: 18, background: `linear-gradient(135deg, ${RP_C} 0%, #ff8a47 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 18px ${RP_C}55` }}>
              <PuckBlaze size={56} mono={true}/>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${RP_C} 0%, #ff8a47 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PuckBlaze size={30} mono={true}/>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: `linear-gradient(135deg, ${RP_C} 0%, #ff8a47 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PuckBlaze size={16} mono={true}/>
            </div>
          </div>
        </MarkOnSurface>
        <MarkOnSurface bg={NM.bgCard} label="FAVICON" sub="16 / 22 / 32 px">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PuckBlaze size={16}/>
            <PuckBlaze size={22}/>
            <PuckBlaze size={32}/>
            <PuckBlaze size={48}/>
          </div>
        </MarkOnSurface>
      </div>

      <div style={{ marginTop: 22, padding: 14, background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 8, fontSize: 12, color: NM.text, lineHeight: 1.55, maxWidth: 960 }}>
        <b style={{ color: RP_C }}>What changed from the rough sketches:</b> the puck is now properly drawn in 3/4 view with depth (top ellipse, side body, back rim, edge ridges) so it reads as an actual hockey puck — not just a flat circle. The flame is a single confident shape with a gradient highlight, not three competing tongues. The whole thing balances visually so neither element fights the other.
      </div>
    </DCArtboard>
  );
}

Object.assign(window, { PuckBlaze, LogoBurningPuckRefined });
