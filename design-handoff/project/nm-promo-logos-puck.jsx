// 5 logo variants — burning puck (horící puk)

const PUCK_C = '#ff5a24';
const PUCK_DARK = '#0a0b0f';

// V1: Clean side-profile puck with three flame tongues rising
function P_Classic({ size = 96, c = PUCK_C }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <path d="M30 22 C30 14 38 6 48 6 C58 6 66 14 66 22 M52 16 C52 10 56 4 58 0 C58 8 64 10 64 20"
        stroke={c} strokeWidth="4" strokeLinecap="round" fill="none"/>
      <path d="M40 30 C40 22 44 14 44 8 C46 16 52 18 52 26" stroke={c} strokeWidth="4" strokeLinecap="round" fill="none"/>
      <ellipse cx="48" cy="60" rx="34" ry="22" fill={PUCK_DARK} stroke={c} strokeWidth="4"/>
      <ellipse cx="48" cy="52" rx="34" ry="10" fill="none" stroke={c} strokeWidth="2" opacity="0.5"/>
    </svg>
  );
}

// V2: Top-down puck (circle) engulfed in flame ring
function P_TopDown({ size = 96, c = PUCK_C }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <path d="M48 8 C30 8 18 22 18 40 C12 50 18 64 30 70 C30 80 42 86 48 80 C54 86 66 80 66 70 C78 64 84 50 78 40 C78 22 66 8 48 8 Z" fill={c}/>
      <circle cx="48" cy="48" r="22" fill={PUCK_DARK}/>
      <circle cx="48" cy="48" r="22" fill="none" stroke={c} strokeWidth="2" opacity="0.4"/>
    </svg>
  );
}

// V3: Puck as motion streak with trailing flame
function P_Streak({ size = 96, c = PUCK_C }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <path d="M6 64 C16 60 26 58 36 56" stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.3"/>
      <path d="M10 56 C22 52 34 50 44 50" stroke={c} strokeWidth="4" strokeLinecap="round" opacity="0.55"/>
      <path d="M16 48 C28 46 42 46 52 48" stroke={c} strokeWidth="5" strokeLinecap="round" opacity="0.85"/>
      <ellipse cx="68" cy="48" rx="22" ry="14" fill={PUCK_DARK} stroke={c} strokeWidth="3.5"/>
      <rect x="46" y="46" width="44" height="4" fill={c} opacity="0.7"/>
    </svg>
  );
}

// V4: Geometric — single flame inside a circle (puck = circle)
function P_Geometric({ size = 96, c = PUCK_C }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <circle cx="48" cy="48" r="38" fill={PUCK_DARK} stroke={c} strokeWidth="5"/>
      <path d="M48 22 C40 28 36 36 40 46 C34 50 38 60 46 60 C44 64 48 70 52 68 C56 70 60 64 58 60 C66 58 68 50 62 46 C66 36 58 28 48 22 Z" fill={c}/>
    </svg>
  );
}

// V5: Speed lines + puck with single rising flame
function P_Speedlines({ size = 96, c = PUCK_C }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <path d="M4 50 H22 M4 58 H28 M4 66 H22" stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.55"/>
      <ellipse cx="58" cy="58" rx="26" ry="16" fill={PUCK_DARK} stroke={c} strokeWidth="4"/>
      <path d="M58 38 C52 30 56 22 56 14 C60 22 66 24 66 32 C70 30 70 38 64 42" fill={c} stroke={c} strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}

function PuckTile({ num, name, theme, Mark, note, pick }) {
  return (
    <div style={{
      background: NM.bgCard, border: `1px solid ${pick ? PUCK_C : NM.borderSoft}`, borderRadius: 12,
      padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: pick ? `0 0 20px ${PUCK_C}33` : 'none', position: 'relative',
    }}>
      {pick && <span style={{ position: 'absolute', top: 10, right: 10, fontFamily: NM.fontMono, fontSize: 9, color: PUCK_C, fontWeight: 700, letterSpacing: 1.2, padding: '3px 7px', background: NM.bg, borderRadius: 4, border: `1px solid ${PUCK_C}` }}>PICK</span>}
      <div style={{ background: NM.bg, border: `1px solid ${NM.borderSoft}`, borderRadius: 8, padding: '28px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 150 }}>
        <Mark size={110}/>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: NM.bg, borderRadius: 6, border: `1px solid ${NM.borderSoft}` }}>
        <Mark size={26}/>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 20, color: NM.textBright, letterSpacing: -0.7, lineHeight: 1 }}>momentum</span>
          <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 20, color: PUCK_C, letterSpacing: -0.7, lineHeight: 1 }}>.</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[16, 22, 28].map(s => (
          <div key={s} style={{ width: s + 10, height: s + 10, borderRadius: 4, background: NM.bg, border: `1px solid ${NM.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mark size={s}/>
          </div>
        ))}
        <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${PUCK_C}, #ff8a47)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }}>
          <Mark size={28} c="#fff"/>
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
          <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1 }}>{String(num).padStart(2,'0')}</span>
          <span style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 15, color: NM.textBright, letterSpacing: -0.3 }}>{name}</span>
        </div>
        <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: PUCK_C, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>{theme}</div>
        <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.5 }}>{note}</div>
      </div>
    </div>
  );
}

function LogoBurningPuck() {
  const items = [
    { num: 1, name: 'Classic',     theme: 'side puck + 3 flames',    Mark: P_Classic,    note: 'Side-profile puck with three flame tongues rising from the top. Most literal reading of "burning puck."', pick: false },
    { num: 2, name: 'Top-Down',    theme: 'puck engulfed',           Mark: P_TopDown,    note: 'Top-down puck with flames wrapping it on all sides. Strong silhouette, works as a stamp.', pick: true },
    { num: 3, name: 'Streak',      theme: 'puck on fire moving',     Mark: P_Streak,     note: 'Puck mid-flight with a flame trail behind. Speed + heat. Most dynamic, suggests "momentum" literally.', pick: false },
    { num: 4, name: 'Geometric',   theme: 'puck circle + flame',     Mark: P_Geometric,  note: 'Circle puck with a single clean flame inside. Most reductive — scales to favicon best.', pick: false },
    { num: 5, name: 'Speedlines',  theme: 'puck + speedlines',       Mark: P_Speedlines, note: 'Puck with speedlines and a single flame rising. Comic-book sports energy.', pick: false },
  ];
  return (
    <DCArtboard label="Logo · 5 burning puck variants" width={1320} height={780} style={{ background: NM.bg, padding: 32, borderRadius: 6 }}>
      <div style={{ color: NM.textBright, marginBottom: 20 }}>
        <div style={{ fontFamily: NM.fontMono, fontSize: 10, letterSpacing: 1.4, color: PUCK_C, fontWeight: 700, marginBottom: 6 }}>ROUND 3 · BURNING PUCK</div>
        <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 26, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 4 }}>Horící puk — 5 variants.</div>
        <div style={{ fontSize: 12.5, color: NM.text, maxWidth: 720, lineHeight: 1.5 }}>Same theme, five different takes. Wordmark stays constant.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        {items.map(s => <PuckTile key={s.num} {...s}/>)}
      </div>
    </DCArtboard>
  );
}

Object.assign(window, { P_Classic, P_TopDown, P_Streak, P_Geometric, P_Speedlines, LogoBurningPuck });
