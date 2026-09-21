// Logo round 3 — concrete, sport-anchored marks.
// Constraint: pair concretely with data/analytics + actual sport objects (puck, net, ice, scoreboard).
// No more abstract orbs.

const LC = '#ff5a24';

// 1. SCOREBOARD — a literal LED scoreboard digit "M" / momentum
function L_Scoreboard({ size = 64, c = LC }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="6" y="14" width="52" height="36" rx="4" fill="#0a0b0f" stroke={c} strokeWidth="2"/>
      {/* segmented digits forming an M */}
      <g fill={c}>
        <rect x="12" y="20" width="4" height="24"/>
        <rect x="16" y="20" width="6" height="4"/>
        <rect x="22" y="22" width="4" height="14"/>
        <rect x="26" y="20" width="6" height="4"/>
        <rect x="32" y="22" width="4" height="14"/>
        <rect x="36" y="20" width="6" height="4"/>
        <rect x="42" y="20" width="4" height="24"/>
      </g>
      <circle cx="50" cy="44" r="2" fill={c}/>
    </svg>
  );
}

// 2. ICE CRACK — orange flame splitting through cracked ice
function L_IceCrack({ size = 64, c = LC }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* ice rink oval */}
      <ellipse cx="32" cy="36" rx="24" ry="18" fill="none" stroke="#3a88ff" strokeWidth="2.5" opacity="0.6"/>
      {/* crack lines */}
      <path d="M14 30 L24 36 L20 44 M44 28 L40 38 L48 44" stroke="#3a88ff" strokeWidth="1.5" opacity="0.6" strokeLinecap="round"/>
      {/* flame in center */}
      <path d="M32 48 L26 38 C26 32 30 32 30 24 C32 30 36 28 34 36 C38 32 40 38 38 42 L32 48 Z" fill={c}/>
    </svg>
  );
}

// 3. STAT-LINE PUCK — puck with stat readout etched across it
function L_StatPuck({ size = 64, c = LC }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="32" rx="26" ry="16" fill="#0a0b0f" stroke={c} strokeWidth="2.5"/>
      {/* "94" stat line */}
      <text x="32" y="38" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="16" fontWeight="800" fill={c} letterSpacing="-1">94</text>
      {/* tick marks around edge — like a gauge */}
      <g stroke={c} strokeWidth="1.5" opacity="0.5">
        <line x1="14" y1="32" x2="10" y2="32"/>
        <line x1="50" y1="32" x2="54" y2="32"/>
        <line x1="32" y1="18" x2="32" y2="14"/>
        <line x1="32" y1="46" x2="32" y2="50"/>
      </g>
    </svg>
  );
}

// 4. SLAPSHOT — hockey stick blade striking a puck that becomes a flame
function L_Slapshot({ size = 64, c = LC }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* stick */}
      <path d="M52 6 L18 40 L10 40 L8 48 L18 50 L22 44" stroke="#8a94a6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* puck-flame */}
      <path d="M30 50 C24 50 22 44 26 40 C24 36 28 32 32 34 C36 32 40 36 38 40 C42 44 38 50 32 50 Z" fill={c}/>
      {/* speed lines */}
      <path d="M44 22 L48 18 M50 30 L56 26 M40 14 L44 10" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
    </svg>
  );
}

// 5. SCATTER PLOT — analytics scatter with one hot dot way above the trend line
function L_Scatter({ size = 64, c = LC }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* axes */}
      <path d="M10 54 L10 8 M10 54 L58 54" stroke="#8a94a6" strokeWidth="1.5" opacity="0.4"/>
      {/* trend line */}
      <path d="M14 46 L54 22" stroke="#8a94a6" strokeWidth="1" strokeDasharray="2 2" opacity="0.5"/>
      {/* scatter dots */}
      <circle cx="18" cy="44" r="2" fill="#5a6378"/>
      <circle cx="24" cy="40" r="2" fill="#5a6378"/>
      <circle cx="32" cy="36" r="2" fill="#5a6378"/>
      <circle cx="40" cy="32" r="2" fill="#5a6378"/>
      <circle cx="48" cy="26" r="2" fill="#5a6378"/>
      {/* the hot outlier */}
      <circle cx="44" cy="12" r="6" fill={c}/>
      <circle cx="44" cy="12" r="11" fill="none" stroke={c} strokeWidth="1.5" opacity="0.4"/>
    </svg>
  );
}

// 6. NET RAYS — back-of-net diamond grid with a goal-light ray burst behind
function L_NetRays({ size = 64, c = LC }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* rays */}
      <g stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.7">
        <line x1="32" y1="6" x2="32" y2="14"/>
        <line x1="14" y1="14" x2="20" y2="20"/>
        <line x1="50" y1="14" x2="44" y2="20"/>
        <line x1="6"  y1="32" x2="14" y2="32"/>
        <line x1="58" y1="32" x2="50" y2="32"/>
      </g>
      {/* net diamond grid */}
      <rect x="14" y="22" width="36" height="32" rx="2" fill="#0a0b0f" stroke={c} strokeWidth="2.5"/>
      <path d="M14 30 H50 M14 38 H50 M14 46 H50 M22 22 V54 M32 22 V54 M42 22 V54" stroke={c} strokeWidth="0.8" opacity="0.5"/>
    </svg>
  );
}

// 7. PUCK-CHART — puck silhouette where the top half IS a bar chart
function L_PuckChart({ size = 64, c = LC }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <clipPath id="puckClip">
          <ellipse cx="32" cy="32" rx="26" ry="16"/>
        </clipPath>
      </defs>
      <ellipse cx="32" cy="32" rx="26" ry="16" fill="#0a0b0f" stroke={c} strokeWidth="2.5"/>
      <g clipPath="url(#puckClip)">
        <rect x="12" y="28" width="5" height="20" fill={c} opacity="0.5"/>
        <rect x="19" y="22" width="5" height="26" fill={c} opacity="0.6"/>
        <rect x="26" y="18" width="5" height="30" fill={c} opacity="0.75"/>
        <rect x="33" y="14" width="5" height="34" fill={c} opacity="0.85"/>
        <rect x="40" y="20" width="5" height="28" fill={c}/>
        <rect x="47" y="26" width="5" height="22" fill={c} opacity="0.7"/>
      </g>
    </svg>
  );
}

// 8. SPEED LINES — three motion lines (like a stat sheet) with the front one ignited
function L_Speedlines({ size = 64, c = LC }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* three rising tracks */}
      <path d="M8 48 L42 22" stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.3"/>
      <path d="M12 50 L46 24" stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.55"/>
      <path d="M16 52 L50 26" stroke={c} strokeWidth="4" strokeLinecap="round"/>
      {/* flame at tip of front line */}
      <path d="M50 26 C46 22 50 16 52 18 C54 14 58 18 56 22 C60 22 60 28 54 28 Z" fill={c}/>
    </svg>
  );
}

// 9. ROSTER — three jersey-number tiles with the middle one ignited (heat highlight)
function L_Roster({ size = 64, c = LC }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="6"  y="20" width="16" height="24" rx="2" fill="#1a1d26" stroke="#252a38" strokeWidth="1.5"/>
      <text x="14" y="38" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="12" fontWeight="700" fill="#5a6378">12</text>
      <rect x="24" y="14" width="16" height="36" rx="2" fill={c} stroke={c} strokeWidth="1.5"/>
      <text x="32" y="36" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="14" fontWeight="800" fill="#fff">94</text>
      <rect x="42" y="20" width="16" height="24" rx="2" fill="#1a1d26" stroke="#252a38" strokeWidth="1.5"/>
      <text x="50" y="38" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="12" fontWeight="700" fill="#5a6378">71</text>
    </svg>
  );
}

// 10. TICKER — sports ticker bar with team codes scrolling, one highlighted in heat
function L_Ticker({ size = 64, c = LC }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="4" y="22" width="56" height="20" rx="3" fill="#0a0b0f" stroke="#252a38" strokeWidth="1.5"/>
      <rect x="22" y="22" width="20" height="20" fill={c}/>
      <text x="14" y="36" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="800" fill="#8a94a6">NYR</text>
      <text x="32" y="36" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="800" fill="#fff">EDM</text>
      <text x="50" y="36" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="800" fill="#8a94a6">BOS</text>
      {/* up arrow on highlight */}
      <path d="M32 18 L29 21 L31 21 L31 16 L33 16 L33 21 L35 21 Z" fill={c}/>
    </svg>
  );
}

function SketchTile3({ num, name, theme, Mark, note }) {
  return (
    <div style={{
      background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{
        background: NM.bg, border: `1px solid ${NM.borderSoft}`, borderRadius: 8,
        padding: '20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 110,
      }}>
        <Mark size={80}/>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: NM.bg, borderRadius: 6, border: `1px solid ${NM.borderSoft}` }}>
        <Mark size={20}/>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 16, color: NM.textBright, letterSpacing: -0.6, lineHeight: 1 }}>momentum</span>
          <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 16, color: LC, letterSpacing: -0.6, lineHeight: 1 }}>.</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {[14, 18, 24].map(s => (
          <div key={s} style={{ width: s + 8, height: s + 8, borderRadius: 3, background: NM.bg, border: `1px solid ${NM.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mark size={s}/>
          </div>
        ))}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
          <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1 }}>{String(num).padStart(2,'0')}</span>
          <span style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 14, color: NM.textBright, letterSpacing: -0.3 }}>{name}</span>
        </div>
        <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: LC, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>{theme}</div>
        <div style={{ fontSize: 11, color: NM.text, lineHeight: 1.5 }}>{note}</div>
      </div>
    </div>
  );
}

function LogoSketches3() {
  const sketches = [
    { num: 1, name: 'Scoreboard',   theme: 'literal scoreboard',  Mark: L_Scoreboard,  note: 'Segmented LED display spelling an M. Concrete sports object — every fan recognizes it.' },
    { num: 2, name: 'Ice Crack',    theme: 'ice + flame',          Mark: L_IceCrack,    note: 'A flame splitting through a cracked ice rink. Hockey-coded but the metaphor (heat melts ice) survives in any sport.' },
    { num: 3, name: 'Stat Puck',    theme: 'puck + readout',       Mark: L_StatPuck,    note: 'A puck with a Heat number etched across it and gauge ticks around the rim. Object you can touch + the data on it.' },
    { num: 4, name: 'Slapshot',     theme: 'shot + impact',        Mark: L_Slapshot,    note: 'A stick blade hitting a puck that becomes a flame. Action shot. Reads as "the moment something ignites."' },
    { num: 5, name: 'Outlier',      theme: 'scatter + hot dot',    Mark: L_Scatter,     note: 'Analytics scatter plot with one hot orange dot way above the trend line. The "Heat outlier" as a literal chart.' },
    { num: 6, name: 'Net Rays',     theme: 'net + goal moment',    Mark: L_NetRays,     note: 'Back-of-net grid with a goal-light ray burst behind it. The exact moment the puck crosses the line.' },
    { num: 7, name: 'Puck Chart',   theme: 'puck × bar chart',     Mark: L_PuckChart,   note: 'A puck whose top half is a bar chart inside its silhouette. Sport object + analytics in one shape.' },
    { num: 8, name: 'Speed Lines',  theme: 'motion + ignition',    Mark: L_Speedlines,  note: 'Three rising tracks (like a sprite ghosted in motion) with the front one ignited at the tip. Literal momentum.' },
    { num: 9, name: 'Roster',       theme: 'jerseys + heat tag',   Mark: L_Roster,      note: 'Three jersey-number tiles with the middle one taller and ignited in heat orange. "Who\'s hot on the roster."' },
    { num: 10, name: 'Ticker',      theme: 'scoreboard ticker',    Mark: L_Ticker,      note: 'A sports ticker with three team codes; the middle one is highlighted in heat with an up-arrow above it. The product as the glyph.' },
  ];

  return (
    <DCArtboard label="Logo · Round 3 — concrete, sport-anchored" width={1320} height={1240}
      style={{ background: NM.bg, padding: 32, borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ color: NM.textBright, marginBottom: 22 }}>
        <div style={{ fontFamily: NM.fontMono, fontSize: 10, letterSpacing: 1.4, color: LC, fontWeight: 700, marginBottom: 6 }}>
          ROUND 3 · CONCRETE & SPORT-ANCHORED
        </div>
        <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 28, letterSpacing: -1, lineHeight: 1.05, marginBottom: 6, maxWidth: 760, textWrap: 'pretty' }}>
          Real sport objects + real data. No more orbs.
        </div>
        <div style={{ fontSize: 12.5, color: NM.text, maxWidth: 760, lineHeight: 1.5 }}>
          Each mark is built around an object a fan can name out loud — a scoreboard, a puck, a net, a stat sheet, a ticker. Then crossed with the data layer. Most of these stay sport-transferable: a scoreboard is a scoreboard; a scatter plot is a scatter plot; a roster is a roster.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        {sketches.map(s => <SketchTile3 key={s.num} {...s}/>)}
      </div>

      <div style={{ marginTop: 22, padding: 14, background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 8, fontSize: 12, color: NM.text, lineHeight: 1.55, maxWidth: 980 }}>
        <b style={{ color: LC }}>My honest reads:</b><br/>
        <b>#5 Outlier</b> is the strongest analytics-native one — same lineage as Data Spike but actually says something specific (the hot one stands out from the pack). Doesn't look like Google Analytics.<br/>
        <b>#3 Stat Puck</b> and <b>#7 Puck Chart</b> are the strongest sport+data combos — concrete object overlaid with the data layer.<br/>
        <b>#10 Ticker</b> is the most "this IS what we do" — the product as the glyph.<br/>
        Tell me which to push and I'll refine 2–3 to final-quality.
      </div>
    </DCArtboard>
  );
}

Object.assign(window, {
  L_Scoreboard, L_IceCrack, L_StatPuck, L_Slapshot, L_Scatter,
  L_NetRays, L_PuckChart, L_Speedlines, L_Roster, L_Ticker,
  LogoSketches3,
});
