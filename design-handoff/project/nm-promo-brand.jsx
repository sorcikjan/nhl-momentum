// Promo / Brand foundation — logo, type, color, voice, taglines

// ─── Logo: the "Heat Pulse" mark ───
// A hand-drawn ECG-line that climbs into a flame tip — momentum visualized.
// Works at any size; used as both icon and integrated into the wordmark.
function HeatPulseMark({ size = 48, color = '#ff5a24', glow = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ filter: glow ? `drop-shadow(0 0 8px ${color}55)` : 'none' }}>
      <path d="M4 30 L12 30 L15 22 L19 36 L23 14 L27 28 L30 24 C32 22 35 22 36 26 C37 30 35 34 30 36 C28 37 26 37 24 36"
        stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="36" cy="26" r="2.5" fill={color}/>
    </svg>
  );
}

// ─── Wordmark lockup ───
function MomentumWordmark({ size = 28, color = NM.textBright, accent = NM.heat, mark = true, tight = false }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: tight ? 6 : 10, lineHeight: 1 }}>
      {mark && <HeatPulseMark size={size * 1.2} color={accent}/>}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <span style={{
          fontFamily: NM.fontSans, fontWeight: 800, fontSize: size,
          color, letterSpacing: -size * 0.04,
        }}>momentum</span>
        <span style={{
          fontFamily: NM.fontSans, fontWeight: 800, fontSize: size,
          color: accent, letterSpacing: -size * 0.04,
        }}>.</span>
      </div>
    </div>
  );
}

// ─── Hex pattern background (subtle motion bg) ───
function HeatGradientBg({ children, intensity = 1 }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 80% 20%, rgba(255,90,36,${0.18*intensity}) 0%, transparent 45%),
                     radial-gradient(circle at 20% 80%, rgba(229,80,139,${0.10*intensity}) 0%, transparent 45%),
                     radial-gradient(circle at 50% 50%, rgba(77,124,255,${0.06*intensity}) 0%, transparent 60%)`,
        pointerEvents: 'none',
      }}/>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}

// ─── Brand foundation board ───
function BrandFoundation() {
  return (
    <DCArtboard label="Brand foundation" width={1200} height={760} style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <HeatGradientBg>
        <div style={{ padding: 40, color: NM.textBright }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
            <MomentumWordmark size={32}/>
            <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, letterSpacing: 1.4, textTransform: 'uppercase' }}>
              Brand book v1
            </span>
          </div>

          {/* Section grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
            {/* The mark */}
            <div>
              <Eyebrow>01 · Logomark</Eyebrow>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, marginBottom: 16 }}>
                {[ 96, 64, 44, 28 ].map(s => (
                  <div key={s} style={{ width: s + 24, height: s + 24, borderRadius: s/4, background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HeatPulseMark size={s} glow={s >= 64}/>
                  </div>
                ))}
              </div>
              <BodyCopy>
                A hand-drawn pulse line that climbs into a flame tip. It reads as <b>"data turning into heat"</b> — exactly what the product does. Three jagged spikes climb to a peak, then trail into a glowing dot. Works in monochrome, on dark, on photo, at favicon size.
              </BodyCopy>

              <Divider/>

              <Eyebrow>02 · Wordmark</Eyebrow>
              <div style={{ marginTop: 12, marginBottom: 12, padding: '20px 24px', background: NM.bgCard, borderRadius: 8, border: `1px solid ${NM.borderSoft}` }}>
                <MomentumWordmark size={42}/>
                <div style={{ height: 14 }}/>
                <MomentumWordmark size={28} mark={false}/>
                <div style={{ height: 12 }}/>
                <MomentumWordmark size={20} color={NM.text} accent={NM.text} mark={false}/>
              </div>
              <BodyCopy>
                Lowercase <b>momentum.</b> in Geist 800. The terminal period is heat-orange — a small, repeatable signature. We <b>drop "NHL"</b> from the brand: it's legally cleaner, future-proofs us for other leagues, and "Momentum" stands on its own.
              </BodyCopy>
            </div>

            {/* Color & type */}
            <div>
              <Eyebrow>03 · Heat palette</Eyebrow>
              <div style={{ marginTop: 12, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {[
                  ['#0a0b0f', 'Ink',    NM.textBright],
                  ['#ff5a24', 'Heat',   '#fff'],
                  ['#3a88ff', 'Cold',   '#fff'],
                  ['#00e5a0', 'Rise',   '#000'],
                  ['#e5508b', 'Story',  '#fff'],
                ].map(([c, n, t]) => (
                  <div key={n} style={{ background: c, padding: '14px 10px', borderRadius: 6, color: t }}>
                    <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 13, letterSpacing: -0.2 }}>{n}</div>
                    <div style={{ fontFamily: NM.fontMono, fontSize: 9, marginTop: 4, opacity: 0.7 }}>{c}</div>
                  </div>
                ))}
              </div>

              <Eyebrow>04 · Type system</Eyebrow>
              <div style={{ marginTop: 12, marginBottom: 16, padding: 16, background: NM.bgCard, borderRadius: 8, border: `1px solid ${NM.borderSoft}` }}>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 28, letterSpacing: -0.6, color: NM.textBright, lineHeight: 1 }}>Geist · Display</div>
                <div style={{ fontSize: 10, color: NM.textMuted, fontFamily: NM.fontMono, marginTop: 4 }}>Headlines, UI, wordmark</div>
                <div style={{ height: 10 }}/>
                <div style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 28, letterSpacing: -0.6, color: NM.textBright, lineHeight: 1 }}>Fraunces · Player names only</div>
                <div style={{ fontSize: 10, color: NM.textMuted, fontFamily: NM.fontMono, marginTop: 4 }}>Legacy display only used for player nameplates</div>
                <div style={{ height: 10 }}/>
                <div style={{ fontFamily: NM.fontMono, fontSize: 14, color: NM.text }}>Geist Mono — 94 · 5G 0A · L5</div>
                <div style={{ fontSize: 10, color: NM.textMuted, fontFamily: NM.fontMono, marginTop: 4 }}>All numbers, scores, heat values</div>
              </div>

              <Eyebrow>05 · Voice</Eyebrow>
              <div style={{ marginTop: 12, padding: 16, background: NM.bgCard, borderRadius: 8, border: `1px solid ${NM.borderSoft}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                  <div>
                    <div style={{ fontSize: 9, color: NM.rise, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>We sound like</div>
                    <ul style={{ margin: 0, paddingLeft: 14, color: NM.text, lineHeight: 1.6 }}>
                      <li>Confident, not hyped</li>
                      <li>Numbers, not adjectives</li>
                      <li>Hockey-native slang</li>
                      <li>One sentence, then a stat</li>
                    </ul>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: NM.cold, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>We don't sound like</div>
                    <ul style={{ margin: 0, paddingLeft: 14, color: NM.text, lineHeight: 1.6 }}>
                      <li>Broadcast cliché</li>
                      <li>Hot-take Twitter</li>
                      <li>Crypto-bro emoji storm</li>
                      <li>Over-explaining</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </HeatGradientBg>
    </DCArtboard>
  );
}

// ─── Tagline candidates ───
function TaglineLab() {
  const lines = [
    { t: 'Hockey, in real time.',                 angle: 'Vibe',         note: 'Short, ownable, scales beyond hockey one day.' },
    { t: "Who's hot. Right now.",                 angle: 'Utility',      note: 'The product in five words.' },
    { t: 'See it before the broadcast.',          angle: 'Insider edge', note: 'Positions us as faster than TV.' },
    { t: 'The stat that finds the story.',        angle: 'Storytelling', note: 'Heat = the story-finding metric.' },
    { t: 'Every game. Every player. One number.', angle: 'Authority',    note: 'Heat as the unifying scale.' },
    { t: 'Read the ice.',                         angle: 'Hockey-native',note: 'Doubles as a verb. Strong CTA.' },
    { t: 'Pulse of the NHL.',                     angle: 'Vibe',         note: 'Pairs perfectly with the pulse logomark.' },
    { t: 'Numbers, then narratives.',             angle: 'Editorial',    note: 'Our process, said plainly.' },
  ];
  const recommended = 0; // Hockey, in real time.

  return (
    <DCArtboard label="Tagline lab" width={780} style={{ background: '#fff', padding: 36, borderRadius: 6 }}>
      <div style={{ color: '#1a1a1a' }}>
        <div style={{ fontFamily: NM.fontMono, fontSize: 10, letterSpacing: 1.4, color: '#888', fontWeight: 700, marginBottom: 8 }}>
          TAGLINE CANDIDATES · 8 ANGLES
        </div>
        <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 26, letterSpacing: -0.6, lineHeight: 1.1, color: '#1a1a1a', marginBottom: 24 }}>
          One line that does the work of the product page.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lines.map((l, i) => (
            <div key={i} style={{
              padding: '14px 16px', borderRadius: 8,
              background: i === recommended ? '#fff8f4' : '#fafaf8',
              border: i === recommended ? `2px solid ${NM.heat}` : '1px solid #ececec',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{
                width: 24, height: 24, borderRadius: 12,
                background: i === recommended ? NM.heat : '#e8e8e4',
                color: i === recommended ? '#fff' : '#888',
                fontSize: 10, fontWeight: 700, fontFamily: NM.fontMono,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{String(i+1).padStart(2,'0')}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 18, letterSpacing: -0.4, color: '#1a1a1a' }}>
                  {l.t}
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  <span style={{ fontFamily: NM.fontMono, fontWeight: 700, color: i === recommended ? NM.heat : '#888' }}>{l.angle.toUpperCase()}</span>
                  <span> · {l.note}</span>
                </div>
              </div>
              {i === recommended && (
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1, padding: '3px 7px', background: '#fff', borderRadius: 4, border: `1px solid ${NM.heat}` }}>
                  RECOMMENDED
                </span>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: 14, background: '#f7f5ef', borderRadius: 6, fontSize: 12, color: '#444', lineHeight: 1.5 }}>
          <b>How to use:</b> #1 is the master tagline (hero, app store, OG). #2 is the utility line (push notifications, App Store subtitle). #6 "Read the ice." is the campaign line — works on stickers, hoodies, social.
        </div>
      </div>
    </DCArtboard>
  );
}

function Eyebrow({ children }) {
  return <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase' }}>{children}</div>;
}
function BodyCopy({ children }) {
  return <div style={{ fontSize: 12.5, color: NM.text, lineHeight: 1.55, marginTop: 8 }}>{children}</div>;
}
function Divider() {
  return <div style={{ height: 1, background: NM.borderSoft, margin: '20px 0' }}/>;
}

Object.assign(window, { HeatPulseMark, MomentumWordmark, HeatGradientBg, BrandFoundation, TaglineLab, Eyebrow, BodyCopy, Divider });
