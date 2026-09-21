// Logo ideation lab — 5 distinct directions for "momentum."
// Each is built so you can read it instantly at favicon size AND on a billboard.

// ─── Direction 1: The Spark (Power-on dot) ───
// A simple filled circle with a single rising flick — like a switch turning on.
// Reads as: "the moment something gets hot." Easiest to recognize at any size.
function Logo1Spark({ size = 64, color = '#ff5a24' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="38" r="14" fill={color}/>
      <path d="M32 24 L32 10" stroke={color} strokeWidth="6" strokeLinecap="round"/>
      <circle cx="32" cy="6" r="3" fill={color}/>
    </svg>
  );
}

// ─── Direction 2: The Arrow-M (Monogram with motion) ───
// An "M" whose middle peak is taller and offset — the letter literally has momentum.
// Geometric, confident, looks like a sports mark. Works as a stamp.
function Logo2ArrowM({ size = 64, color = '#ff5a24' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M10 50 L10 18 L24 14 L32 36 L40 10 L54 14 L54 50"
        stroke={color} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// ─── Direction 3: The Notch (Bar-chart icon) ───
// Three rising bars — the universal "going up" symbol — with the tallest one
// extended into a rounded flame head. Reads instantly as "rising / hot."
function Logo3Notch({ size = 64, color = '#ff5a24' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="10" y="38" width="10" height="16" rx="2" fill={color} opacity="0.45"/>
      <rect x="24" y="28" width="10" height="26" rx="2" fill={color} opacity="0.7"/>
      <path d="M40 22 L40 54 L50 54 L50 22 C50 14 46 10 45 10 C44 10 40 14 40 22 Z" fill={color}/>
    </svg>
  );
}

// ─── Direction 4: The Puck (Hockey-native) ───
// A puck silhouette (oval) with a single horizontal speed-line cut through it —
// hockey-obvious, but the speed line abstracts it into a brand mark, not a clipart puck.
function Logo4Puck({ size = 64, color = '#ff5a24', dark = '#0a0b0f' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="32" rx="22" ry="14" fill={dark} stroke={color} strokeWidth="3"/>
      <rect x="6" y="30" width="52" height="4" rx="2" fill={color}/>
    </svg>
  );
}

// ─── Direction 5: The Period (Just the dot) ───
// The wordmark's terminal period, isolated. A heat-orange filled circle.
// Most reductive possible. Becomes recognizable through repetition.
// (Think: Threads' @, Stripe's =, Cash's $.)
function Logo5Period({ size = 64, color = '#ff5a24' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="16" fill={color}/>
    </svg>
  );
}

// ─── Reusable lockup with each mark ───
function LockupRow({ Mark, name, color = '#ff5a24', dark }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <Mark size={42} color={color} dark={dark}/>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 30, color: NM.textBright, letterSpacing: -1.2, lineHeight: 1 }}>momentum</span>
        <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 30, color, letterSpacing: -1.2, lineHeight: 1 }}>.</span>
      </div>
    </div>
  );
}

// ─── Single logo card ───
function LogoCard({ num, name, tagline, rationale, Mark, recommended }) {
  return (
    <div style={{
      background: NM.bgCard, border: `1px solid ${recommended ? NM.heat : NM.border}`,
      borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column',
      boxShadow: recommended ? `0 0 24px ${NM.heat}33` : 'none',
      position: 'relative',
    }}>
      {recommended && (
        <span style={{
          position: 'absolute', top: 12, right: 12,
          fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.2,
          padding: '3px 7px', background: NM.bg, borderRadius: 4, border: `1px solid ${NM.heat}`,
        }}>RECOMMENDED</span>
      )}

      {/* Header: number + name */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2 }}>
          0{num}
        </span>
        <span style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 18, color: NM.textBright, letterSpacing: -0.4 }}>
          {name}
        </span>
      </div>
      <div style={{ fontSize: 11, color: NM.textMuted, fontStyle: 'italic', marginBottom: 18 }}>
        "{tagline}"
      </div>

      {/* Big mark on dark slab */}
      <div style={{
        background: NM.bg, border: `1px solid ${NM.borderSoft}`, borderRadius: 10,
        padding: '36px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 12, minHeight: 140,
      }}>
        <Mark size={96}/>
      </div>

      {/* Lockup */}
      <div style={{
        background: NM.bg, border: `1px solid ${NM.borderSoft}`, borderRadius: 10,
        padding: '18px 16px', marginBottom: 12,
      }}>
        <LockupRow Mark={Mark}/>
      </div>

      {/* Scale row — favicon, app icon, watermark */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[16, 24, 32, 48].map(s => (
          <div key={s} style={{
            width: s + 16, height: s + 16, borderRadius: 4,
            background: NM.bg, border: `1px solid ${NM.borderSoft}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mark size={s}/>
          </div>
        ))}
        {/* App icon — rounded square with mark on heat bg */}
        <div style={{
          width: 64, height: 64, borderRadius: 14,
          background: `linear-gradient(135deg, ${NM.heat} 0%, #ff8a47 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px ${NM.heat}55`, marginLeft: 'auto',
        }}>
          <Mark size={42} color="#fff" dark="#fff"/>
        </div>
      </div>

      {/* Rationale */}
      <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.55 }}>
        {rationale}
      </div>
    </div>
  );
}

// ─── The board ───
function LogoIdeations() {
  const items = [
    { num: 1, name: 'The Spark',  tag: 'Power-on, plain and loud',
      Mark: Logo1Spark,
      rationale: 'A filled dot with a single rising flick — like a power switch lighting up. Hyper-simple, instantly readable at 16px, and sits comfortably inside the wordmark as both monogram and ascender. Risk: too plain on its own; needs the wordmark to land.',
      recommended: false },

    { num: 2, name: 'The Arrow-M', tag: 'Monogram with built-in motion',
      Mark: Logo2ArrowM,
      rationale: 'An M where the middle peak is offset higher — the letter has momentum baked into its geometry. Reads as a sports mark, looks like a varsity letter, works as a stamp on hoodies and stickers. Strongest "this is the brand" signal of the five.',
      recommended: true },

    { num: 3, name: 'The Climb',   tag: 'Bar chart that catches fire',
      Mark: Logo3Notch,
      rationale: 'Three rising bars — the universal "going up" symbol — with the tallest one rounded into a flame head. Says "data + heat" in one glyph. Most literal of the five, most immediately understood, but slightly more illustrative.',
      recommended: false },

    { num: 4, name: 'The Puck',    tag: 'Hockey-native, abstracted',
      Mark: Logo4Puck,
      rationale: 'A puck oval cut through with a horizontal speed-line. Hockey-obvious without being a clipart puck. Pairs the literal sport with the sense of motion. Locks the brand to hockey though — harder if we ever expand to other sports.',
      recommended: false },

    { num: 5, name: 'The Period',  tag: 'Just the dot. Nothing else.',
      Mark: Logo5Period,
      rationale: 'The wordmark\'s terminal period, isolated. A heat-orange filled circle. Most reductive possible — a single shape becomes recognizable through repetition (Threads, Stripe, Cash app). Demands the most brand investment but the highest ceiling.',
      recommended: false },
  ];

  return (
    <DCArtboard label="Logo · 5 ideations" width={1320} height={1480}
      style={{ background: NM.bg, padding: 36, borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ color: NM.textBright }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, letterSpacing: 1.4, color: NM.heat, fontWeight: 700, marginBottom: 8 }}>
            LOGO LAB · 5 DIRECTIONS
          </div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -1, lineHeight: 1.05, color: NM.textBright, marginBottom: 6, maxWidth: 720, textWrap: 'pretty' }}>
            Five marks, one wordmark. Each one tells a different story.
          </div>
          <div style={{ fontSize: 13, color: NM.text, maxWidth: 720, lineHeight: 1.55 }}>
            Same wordmark across all five — only the symbol changes. We've kept the lowercase <b style={{ color: NM.textBright }}>momentum.</b> with the orange period as a constant, so we're testing meaning, not typography. Each card shows the mark at hero size, in the lockup, at favicon scale (16/24/32/48px), and as an app icon.
          </div>
        </div>

        {/* Grid of 5 — top row 3, bottom row 2 + summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 20 }}>
          {items.slice(0, 3).map(it => <LogoCard key={it.num} {...it} tagline={it.tag} Mark={it.Mark}/>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {items.slice(3).map(it => <LogoCard key={it.num} {...it} tagline={it.tag} Mark={it.Mark}/>)}

          {/* Summary card */}
          <div style={{
            background: '#fff8f4', border: `1px solid ${NM.heat}`, borderRadius: 14, padding: 22,
            color: '#1a1a1a', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 10 }}>
              MY PICK
            </div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 10, color: '#1a1a1a' }}>
              02 · The Arrow-M.
            </div>
            <div style={{ fontSize: 12.5, color: '#444', lineHeight: 1.55, marginBottom: 14 }}>
              It does the most work. The letter <i>is</i> the meaning — momentum baked into the geometry. It's a sports mark first, an icon second. Looks great on a hoodie, on a sticker, embroidered, in a broadcast lower-third. Hockey teams already speak this visual language.
            </div>
            <div style={{ fontSize: 11.5, color: '#666', lineHeight: 1.55, padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #f0e8df' }}>
              <b>If you want safer:</b> 03 The Climb (most universally legible).<br/>
              <b>If you want bolder:</b> 05 The Period (highest brand ceiling).<br/>
              <b>If you want hockey-first:</b> 04 The Puck.
            </div>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

Object.assign(window, { Logo1Spark, Logo2ArrowM, Logo3Notch, Logo4Puck, Logo5Period, LogoIdeations });
