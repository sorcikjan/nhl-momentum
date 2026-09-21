// Logo wild ideation — 10 quick sketches.
// Themes: heat, flame, data, analytics, puck, net, goal.
// Sport-transferable — momentum is the brand, not hockey.
// Not refined; these are SKETCHES.

const LOGO_C = '#ff5a24';

function L_Flamebar({ size = 64, c = LOGO_C }) {
  // Bar chart bars whose tops curl into individual flames
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M10 56 L10 36 C10 30 14 28 14 24 C14 28 18 30 18 36 L18 56 Z" fill={c} opacity="0.5"/>
      <path d="M24 56 L24 28 C24 20 28 18 28 12 C28 18 32 20 32 28 L32 56 Z" fill={c} opacity="0.75"/>
      <path d="M38 56 L38 22 C38 12 42 10 42 4 C42 10 46 12 46 22 L46 56 Z" fill={c}/>
    </svg>
  );
}

function L_HeatDot({ size = 64, c = LOGO_C }) {
  // Three concentric heat rings — radar / thermal target
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" stroke={c} strokeWidth="3" opacity="0.25"/>
      <circle cx="32" cy="32" r="18" stroke={c} strokeWidth="3" opacity="0.55"/>
      <circle cx="32" cy="32" r="8"  fill={c}/>
    </svg>
  );
}

function L_NetGoal({ size = 64, c = LOGO_C }) {
  // Goal net diamond grid with a flame inside — "scoring on fire"
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="8" y="14" width="48" height="38" rx="2" stroke={c} strokeWidth="2.5" fill="none"/>
      <path d="M8 24 H56 M8 34 H56 M8 44 H56 M20 14 V52 M32 14 V52 M44 14 V52" stroke={c} strokeWidth="1" opacity="0.4"/>
      <path d="M32 22 C26 22 22 28 26 34 C24 38 28 42 32 41 C36 42 40 38 38 34 C42 28 38 22 32 22 Z" fill={c}/>
    </svg>
  );
}

function L_PuckFlame({ size = 64, c = LOGO_C }) {
  // Puck silhouette with flame trail behind — "puck on fire"
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M48 32 C48 20 40 18 32 26 C26 32 20 30 16 36 C12 42 18 48 26 44 C32 42 38 46 44 42 C48 40 48 36 48 32 Z" fill={c} opacity="0.45"/>
      <ellipse cx="44" cy="32" rx="14" ry="10" fill="#0a0b0f" stroke={c} strokeWidth="3"/>
    </svg>
  );
}

function L_DataSpike({ size = 64, c = LOGO_C }) {
  // Stock-chart spike — sharp upward zigzag terminating in a dot
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M6 50 L18 38 L26 44 L42 14 L50 22 L58 10" stroke={c} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="58" cy="10" r="4" fill={c}/>
    </svg>
  );
}

function L_FlameM({ size = 64, c = LOGO_C }) {
  // Flame silhouette that doubles as a capital M
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M10 54 L10 28 C10 18 16 14 16 4 C18 14 22 16 22 22 L26 18 L32 30 L38 18 L42 22 C42 16 46 14 48 4 C48 14 54 18 54 28 L54 54 Z"
        fill={c} stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function L_Pixelfire({ size = 64, c = LOGO_C }) {
  // Pixelated/stepped flame — "data fire"
  const px = (x, y, fill = c) => <rect key={`${x}-${y}`} x={x*8} y={y*8} width="8" height="8" fill={fill}/>;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {[
        [3,1],[2,2],[3,2],[4,2],[2,3],[3,3],[4,3],[5,3],
        [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],
        [1,5],[2,5],[3,5],[4,5],[5,5],[6,5],
        [2,6],[3,6],[4,6],[5,6],
      ].map(([x,y]) => px(x,y))}
    </svg>
  );
}

function L_GoalLight({ size = 64, c = LOGO_C }) {
  // Goal lamp / siren — circle on a base with rays = "goal scored"
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M10 12 L4 8 M54 12 L60 8 M32 6 L32 0 M14 26 L8 24 M50 26 L56 24"
        stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="32" cy="32" r="16" fill={c}/>
      <circle cx="28" cy="28" r="4" fill="#fff" opacity="0.5"/>
      <rect x="20" y="48" width="24" height="8" rx="2" fill={c} opacity="0.7"/>
    </svg>
  );
}

function L_Histofire({ size = 64, c = LOGO_C }) {
  // Histogram bars that gradient up to a flame — left cold, right hot
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="lh" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a88ff"/>
          <stop offset="1" stopColor={c}/>
        </linearGradient>
      </defs>
      <rect x="6"  y="44" width="6" height="14" rx="1" fill="url(#lh)"/>
      <rect x="16" y="38" width="6" height="20" rx="1" fill="url(#lh)"/>
      <rect x="26" y="30" width="6" height="28" rx="1" fill="url(#lh)"/>
      <rect x="36" y="22" width="6" height="36" rx="1" fill="url(#lh)"/>
      <path d="M48 58 L48 28 C48 22 52 20 52 12 C54 20 58 22 58 28 L58 58 Z" fill={c}/>
    </svg>
  );
}

function L_RingScore({ size = 64, c = LOGO_C }) {
  // Heat ring at percentile — circular gauge ¾ filled, dot at the tip
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="22" stroke={c} strokeWidth="6" opacity="0.18"/>
      <circle cx="32" cy="32" r="22" stroke={c} strokeWidth="6"
        strokeDasharray="138.2" strokeDashoffset="34.5" strokeLinecap="round"
        transform="rotate(-90 32 32)"/>
      <circle cx="50" cy="20" r="5" fill={c}/>
    </svg>
  );
}

// ─── Single sketch tile ───
function SketchTile({ num, name, theme, Mark, note }) {
  return (
    <div style={{
      background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10,
      padding: 18, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Big mark */}
      <div style={{
        background: NM.bg, border: `1px solid ${NM.borderSoft}`, borderRadius: 8,
        padding: '24px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 120,
      }}>
        <Mark size={84}/>
      </div>

      {/* Lockup row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: NM.bg, borderRadius: 6, border: `1px solid ${NM.borderSoft}` }}>
        <Mark size={20}/>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 16, color: NM.textBright, letterSpacing: -0.6, lineHeight: 1 }}>momentum</span>
          <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 16, color: LOGO_C, letterSpacing: -0.6, lineHeight: 1 }}>.</span>
        </div>
      </div>

      {/* Favicon scales */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {[14, 18, 24].map(s => (
          <div key={s} style={{
            width: s + 8, height: s + 8, borderRadius: 3, background: NM.bg,
            border: `1px solid ${NM.borderSoft}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mark size={s}/>
          </div>
        ))}
        <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, marginLeft: 4 }}>favicon</span>
      </div>

      {/* Caption */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
          <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1 }}>{String(num).padStart(2,'0')}</span>
          <span style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 14, color: NM.textBright, letterSpacing: -0.3 }}>{name}</span>
        </div>
        <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: LOGO_C, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>{theme}</div>
        <div style={{ fontSize: 11, color: NM.text, lineHeight: 1.5 }}>{note}</div>
      </div>
    </div>
  );
}

// ─── The grid ───
function LogoSketches10() {
  const sketches = [
    { num: 1, name: 'Flamebar',   theme: 'data + flame',  Mark: L_Flamebar,  note: 'Three bar-chart bars whose tops curl into individual flame tongues. Reads as "rising data, on fire."' },
    { num: 2, name: 'Heat Target', theme: 'thermal/radar', Mark: L_HeatDot,   note: 'Three concentric heat rings — a radar lock or thermal target. Sport-agnostic, very legible at any size.' },
    { num: 3, name: 'Net + Flame', theme: 'goal + heat',   Mark: L_NetGoal,   note: 'Goal net grid with a flame in the middle — "scoring on fire". Most hockey-specific; less transferable.' },
    { num: 4, name: 'Hot Puck',    theme: 'puck + motion', Mark: L_PuckFlame, note: 'Puck silhouette with a flame trail behind it. Hockey-native but the abstract trail can read as "ball on fire" too.' },
    { num: 5, name: 'Data Spike',  theme: 'analytics',      Mark: L_DataSpike, note: 'Sharp stock-chart zigzag with a dot at the peak. Pure analytics aesthetic, league-agnostic.' },
    { num: 6, name: 'Flame-M',     theme: 'monogram + flame', Mark: L_FlameM,  note: 'A flame silhouette that doubles as a capital M. Two readings in one shape. Strong as a stamp.' },
    { num: 7, name: 'Pixelfire',   theme: 'data + flame',   Mark: L_Pixelfire, note: 'Pixelated stepped flame — "data fire". Tech-native, feels modern, scales perfectly to any pixel grid.' },
    { num: 8, name: 'Goal Lamp',   theme: 'goal scored',    Mark: L_GoalLight, note: 'Goal-light siren with rays. The "GOAL!" moment as a glyph. Hockey/soccer-coded.' },
    { num: 9, name: 'Histofire',   theme: 'cold→hot data',  Mark: L_Histofire, note: 'Histogram that gradients from cold blue on the left to a literal flame on the right. The brand thesis as a single image.' },
    { num: 10, name: 'Heat Ring',   theme: 'gauge / score',  Mark: L_RingScore, note: 'Circular percentile gauge ¾ filled with a dot at the tip — like a Heat score visualized. Most "fitness app" of the set.' },
  ];

  return (
    <DCArtboard label="Logo · 10 wild sketches" width={1320} height={1240}
      style={{ background: NM.bg, padding: 32, borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ color: NM.textBright, marginBottom: 22 }}>
        <div style={{ fontFamily: NM.fontMono, fontSize: 10, letterSpacing: 1.4, color: LOGO_C, fontWeight: 700, marginBottom: 6 }}>
          ROUND 2 · 10 ROUGH SKETCHES
        </div>
        <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 28, letterSpacing: -1, lineHeight: 1.05, marginBottom: 6, maxWidth: 760, textWrap: 'pretty' }}>
          Heat. Flame. Data. Goals. Sport-transferable.
        </div>
        <div style={{ fontSize: 12.5, color: NM.text, maxWidth: 760, lineHeight: 1.5 }}>
          Quick takes, not refined. Each anchored in one of the brand's core themes — heat, flame, data/analytics, or scoring (puck, net, goal). The wordmark <b style={{ color: NM.textBright }}>momentum.</b> stays constant; only the symbol changes. Pick directions you want to push further.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        {sketches.map(s => <SketchTile key={s.num} {...s}/>)}
      </div>

      <div style={{ marginTop: 22, padding: 14, background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 8, fontSize: 12, color: NM.text, lineHeight: 1.55, maxWidth: 900 }}>
        <b style={{ color: LOGO_C }}>Quick read:</b> #1, #5, #7, #9 lean <b>data</b> — most transferable across leagues. #2, #6 lean <b>heat/flame</b> — most evocative. #3, #4, #8 lean <b>sport-specific</b> — strongest for hockey-only. #10 is the <b>fitness/score</b> route. Tell me which 2–3 you want refined and I'll push them properly.
      </div>
    </DCArtboard>
  );
}

Object.assign(window, {
  L_Flamebar, L_HeatDot, L_NetGoal, L_PuckFlame, L_DataSpike,
  L_FlameM, L_Pixelfire, L_GoalLight, L_Histofire, L_RingScore,
  LogoSketches10,
});
