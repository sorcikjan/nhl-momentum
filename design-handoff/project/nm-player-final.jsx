// Player Profile — Final, comprehensive design.
// Desktop + Mobile. Hero with full bio + heat + energy. All sections requested.

// ─── Player archetype badge (AI-identified character: Playmaker, Sniper, Enforcer, etc.) ───
function ArchetypeBadge({ archetype, blurb, tags = [], compact }) {
  // Icon per archetype — abstract SVG glyph
  const icon = (() => {
    const s = compact ? 18 : 22;
    switch ((archetype || '').toLowerCase()) {
      case 'playmaker':
        // Vision rays radiating from a center dot
        return <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" fill={NM.heat}/>
          <path d="M12 4v3M12 17v3M4 12h3M17 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" stroke={NM.heat} strokeWidth="2" strokeLinecap="round"/>
        </svg>;
      case 'sniper':
      case 'striker':
        // Crosshair
        return <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke={NM.heat} strokeWidth="2"/>
          <circle cx="12" cy="12" r="3" fill={NM.heat}/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke={NM.heat} strokeWidth="2" strokeLinecap="round"/>
        </svg>;
      case 'enforcer':
        // Fist / shield
        return <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path d="M12 2 L20 5 V12 C20 17 16 21 12 22 C8 21 4 17 4 12 V5 Z" fill={NM.heat}/>
        </svg>;
      case 'two-way':
      case 'two-way center':
        // Up + down arrows
        return <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path d="M8 4v16M4 8l4-4 4 4M16 4v16M12 16l4 4 4-4" stroke={NM.heat} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>;
      case 'defender':
      case 'puck-mover':
        // Shield + arrow
        return <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path d="M12 3 L19 6 V12 C19 16 16 20 12 21 C8 20 5 16 5 12 V6 Z" stroke={NM.heat} strokeWidth="2" fill="none"/>
          <path d="M12 9v6M9 12l3 3 3-3" stroke={NM.heat} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>;
      case 'power forward':
        // Bulk + arrow
        return <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="5" y="9" width="14" height="10" rx="2" fill={NM.heat}/>
          <path d="M12 3v6M9 6l3-3 3 3" stroke={NM.heat} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>;
      default:
        // Flame / generic
        return <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path d="M12 3 C10 8 7 9 7 13 C7 17 9 20 12 20 C15 20 17 17 17 13 C17 9 14 8 12 3 Z" fill={NM.heat}/>
        </svg>;
    }
  })();

  if (compact) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 999,
        background: NM.heatDim, border: `1px solid ${NM.heat}55`,
      }}>
        {icon}
        <span style={{ fontFamily: NM.fontSans, fontSize: 12, fontWeight: 700, color: NM.heat, letterSpacing: 0.2 }}>
          {archetype}
        </span>
        <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 600, letterSpacing: 1 }}>
          · AI
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px', borderRadius: 12,
      background: NM.heatDim, border: `1px solid ${NM.heat}55`,
      boxShadow: `0 0 14px ${NM.heat}22`,
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 8, background: NM.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${NM.heat}55`, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
          <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.4 }}>
            AI ARCHETYPE
          </span>
        </div>
        <div style={{ fontFamily: NM.fontSans, fontSize: 18, fontWeight: 800, color: NM.textBright, letterSpacing: -0.4, lineHeight: 1.1 }}>
          {archetype}
        </div>
        {blurb && (
          <div style={{ fontSize: 11, color: NM.text, marginTop: 4, lineHeight: 1.4 }}>{blurb}</div>
        )}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
            {tags.map(tag => (
              <span key={tag} style={{
                fontFamily: NM.fontMono, fontSize: 9, fontWeight: 700, letterSpacing: 0.4,
                color: NM.text, padding: '3px 8px', borderRadius: 4,
                background: NM.bg, border: `1px solid ${NM.borderSoft}`,
              }}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helper: radar / spider chart ───
function PerformanceRadar({ stats, size = 240, color = '#ff5a24' }) {
  const cx = size / 2, cy = size / 2;
  const radius = size / 2 - 30;
  const n = stats.length;
  const angleStep = (Math.PI * 2) / n;
  const angle = i => -Math.PI / 2 + i * angleStep;
  const pt = (val, i) => {
    const r = radius * val;
    return [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
  };
  const rings = [0.25, 0.5, 0.75, 1];
  const points = stats.map((s, i) => pt(s.value, i));
  const polygon = points.map(p => p.join(',')).join(' ');
  return (
    <svg width={size} height={size}>
      {rings.map((r, i) => {
        const pts = stats.map((_, idx) => pt(r, idx).join(',')).join(' ');
        return <polygon key={i} points={pts} fill="none" stroke={NM.borderSoft} strokeWidth="1"/>;
      })}
      {stats.map((_, i) => {
        const [x, y] = pt(1, i);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={NM.borderSoft} strokeWidth="1"/>;
      })}
      <polygon points={polygon} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill={color}/>)}
      {stats.map((s, i) => {
        const [x, y] = pt(1.18, i);
        const align = Math.abs(x - cx) < 5 ? 'middle' : (x > cx ? 'start' : 'end');
        return (
          <text key={i} x={x} y={y} fontFamily={NM.fontMono} fontSize="10" fontWeight="700"
            fill={NM.textBright} textAnchor={align} dominantBaseline="middle">
            {s.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Helper: vs-league bar comparison ───
function VsLeagueRow({ label, you, leagueAvg, top10, unit = '', flipColor }) {
  // bar position 0..1 — assume max = max(top10, you) * 1.05
  const max = Math.max(you, top10) * 1.1;
  const pY = (you / max) * 100;
  const pL = (leagueAvg / max) * 100;
  const pT = (top10 / max) * 100;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'baseline' }}>
        <span style={{ fontSize: 13, color: NM.textBright, fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: NM.fontMono, fontSize: 13, color: NM.heat, fontWeight: 700 }}>{you}{unit}</span>
      </div>
      <div style={{ position: 'relative', height: 6, background: NM.borderSoft, borderRadius: 3 }}>
        {/* league avg marker */}
        <div style={{ position: 'absolute', left: `${pL}%`, top: -3, bottom: -3, width: 2, background: NM.textMuted }}/>
        {/* top10 marker */}
        <div style={{ position: 'absolute', left: `${pT}%`, top: -3, bottom: -3, width: 2, background: NM.rise }}/>
        {/* you bar */}
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pY}%`,
          background: NM.heat, borderRadius: 3, boxShadow: `0 0 8px ${NM.heat}77` }}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>
        <span>League avg <span style={{ color: NM.text }}>{leagueAvg}{unit}</span></span>
        <span>Top 10 <span style={{ color: NM.rise }}>{top10}{unit}</span></span>
      </div>
    </div>
  );
}

// ─── Energy bar ───
function EnergyBar({ value = 78, size = 'lg' }) {
  // 0-100 — green at 80+, amber 50-79, red below
  const c = value >= 80 ? NM.rise : value >= 50 ? NM.gold : NM.red;
  const h = size === 'lg' ? 8 : 5;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: h, background: NM.borderSoft, borderRadius: h/2, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: `linear-gradient(90deg, ${c}88 0%, ${c} 100%)`, borderRadius: h/2 }}/>
      </div>
      <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: c, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

// ─── Section heading ───
function PpSection({ kicker, title, right, children }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>{kicker}</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 28, letterSpacing: -0.8, color: NM.textBright }}>{title}</div>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

// ═══════════════════════ DESKTOP ═══════════════════════
function DesktopPlayerFinal() {
  const p = {
    first: 'Connor', last: 'McDavid', t: 'EDM', num: 97, pos: 'C', age: 28, h: 94, energy: 82,
    born: 'Richmond Hill, ON', country: 'CA', flag: '🇨🇦', drafted: '2015 · 1st overall',
    shoots: 'L', height: "6'1\"", weight: '193 lb',
    archetype: 'Playmaker',
    archetypeBlurb: 'Vision-first center who creates space with elite skating.',
    archetypeTags: ['Elite passer', 'Speed threat', 'PP1 quarterback'],
    bio: 'A generational talent at the peak of his powers. McDavid combines unmatched skating speed with elite vision and shooting accuracy — currently sitting at career-best pace through April. His Heat score has climbed steadily over six weeks, reflecting a consistent run of high-impact games.',
    pts: 115, g: 48, a: 67, ppg: 1.78,
  };

  return (
    <DCArtboard label="Desktop · Player profile · 1440" width={1440} height={2680}
      style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <BrandedHeaderDesktop active="Players"/>

      {/* ═══ HERO ═══ */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${NM.borderSoft}` }}>
        {/* Background: team color + ghost number */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(115deg, ${TEAMS[p.t].c} 0%, ${NM.bg} 65%)` }}/>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 75% 30%, rgba(255,90,36,0.32) 0%, transparent 55%)` }}/>
        <div style={{ position: 'absolute', top: -80, right: 40, fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 560,
          color: 'rgba(255,255,255,0.04)', letterSpacing: -28, lineHeight: 0.8, pointerEvents: 'none' }}>
          {p.num}
        </div>

        <div style={{ position: 'relative', padding: '40px 48px 36px', display: 'grid', gridTemplateColumns: '320px 1fr 200px', gap: 36, alignItems: 'flex-end' }}>
          {/* LEFT: photo slot */}
          <div style={{ width: 320, height: 360, borderRadius: 16, overflow: 'hidden',
            background: `linear-gradient(160deg, ${NM.bgRaised} 0%, ${NM.bg} 100%)`,
            border: `1px solid ${NM.border}`, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, letterSpacing: 2, fontWeight: 700 }}>
              PLAYER PHOTO
            </div>
            <div style={{ position: 'absolute', top: 14, left: 14 }}>
              <TeamBadge code={p.t} size={42}/>
            </div>
            <div style={{ position: 'absolute', bottom: 14, right: 14, padding: '6px 12px', borderRadius: 999,
              background: 'rgba(10,11,15,0.7)', backdropFilter: 'blur(8px)',
              fontFamily: NM.fontMono, fontSize: 13, color: NM.textBright, fontWeight: 700 }}>
              #{p.num}
            </div>
          </div>

          {/* CENTER: name + bio + meta */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: 1, fontWeight: 700 }}>
                {TEAMS[p.t].name.toUpperCase()} · {p.pos} · AGE {p.age}
              </span>
              <span style={{ width: 4, height: 4, borderRadius: 2, background: NM.textMuted }}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                {p.shoots}-shoots · {p.height} · {p.weight}
              </span>
            </div>
            <div style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 88, letterSpacing: -3.2,
              lineHeight: 0.9, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.5)', marginBottom: 18 }}>
              {p.first}<br/>
              <span style={{ color: NM.heat }}>{p.last}.</span>
            </div>

            {/* Bio meta row */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 18, fontSize: 13, color: NM.text }}>
              <div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>BORN</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: NM.textBright, fontWeight: 600 }}>
                  <span style={{ fontSize: 16 }}>{p.flag}</span> {p.born}
                </div>
              </div>
              <div style={{ width: 1, background: NM.borderSoft }}/>
              <div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>DRAFTED</div>
                <div style={{ color: NM.textBright, fontWeight: 600 }}>{p.drafted}</div>
              </div>
              <div style={{ width: 1, background: NM.borderSoft }}/>
              <div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>SEASON</div>
                <div style={{ color: NM.textBright, fontWeight: 600 }}>{p.g}G · {p.a}A · {p.pts} pts</div>
              </div>
            </div>

            {/* AI archetype badge */}
            <div style={{ marginBottom: 14 }}>
              <ArchetypeBadge archetype={p.archetype} blurb={p.archetypeBlurb} tags={p.archetypeTags}/>
            </div>

            {/* AI bio paragraph */}
            <div style={{ padding: '14px 18px', background: 'rgba(10,11,15,0.4)', backdropFilter: 'blur(8px)',
              border: `1px solid ${NM.borderSoft}`, borderRadius: 10, position: 'relative' }}>
              <div style={{ position: 'absolute', top: -8, left: 14, padding: '2px 8px', background: NM.bg,
                fontFamily: NM.fontMono, fontSize: 9, color: NM.story, fontWeight: 700, letterSpacing: 1.2, borderRadius: 3, border: `1px solid ${NM.story}55` }}>
                AI CHARACTER
              </div>
              <div style={{ fontSize: 13, color: NM.text, lineHeight: 1.6, textWrap: 'pretty' }}>{p.bio}</div>
            </div>
          </div>

          {/* RIGHT: heat + energy stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Heat dial */}
            <div style={{ background: NM.bgCard, border: `1px solid ${NM.heat}55`, borderRadius: 14, padding: 16,
              boxShadow: `0 0 24px ${NM.heat}33` }}>
              <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 8 }}>HEAT · L5</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 80, height: 80, borderRadius: 40,
                  background: `conic-gradient(${NM.heat} ${p.h}%, ${NM.borderSoft} 0)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 6, borderRadius: 40, background: NM.bgCard,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 26, fontWeight: 800, color: NM.heat, lineHeight: 1 }}>{p.h}</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: NM.rise, fontFamily: NM.fontMono, fontWeight: 700, letterSpacing: 0.5 }}>↑ +6 today</div>
                  <div style={{ fontSize: 11, color: NM.textMuted, marginTop: 2 }}>#1 of 312</div>
                </div>
              </div>
            </div>
            {/* Energy */}
            <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.rise, fontWeight: 700, letterSpacing: 1.4 }}>ENERGY</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 600 }}>FRESH</span>
              </div>
              <EnergyBar value={p.energy}/>
              <div style={{ fontSize: 10, color: NM.textMuted, marginTop: 8, lineHeight: 1.4 }}>
                Last game 2 days ago. Below season fatigue average.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div style={{ padding: '40px 48px' }}>

        {/* FORM TRACKER */}
        <PpSection kicker="FORM TRACKER" title="Heat over time."
          right={
            <div style={{ display: 'flex', gap: 4, padding: 4, background: NM.bgCard, borderRadius: 8, border: `1px solid ${NM.border}` }}>
              {['6W', 'Season'].map((t, i) => (
                <span key={t} style={{ padding: '6px 14px', borderRadius: 5, fontSize: 12, fontWeight: 600,
                  color: i === 0 ? NM.textBright : NM.textMuted,
                  background: i === 0 ? NM.bgRaised : 'transparent' }}>{t}</span>
              ))}
            </div>
          }
        >
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 12, padding: 24 }}>
            <svg viewBox="0 0 1280 220" style={{ width: '100%', height: 220 }}>
              {/* horizontal grid */}
              {[40, 80, 120, 160].map(y => (
                <line key={y} x1="0" y1={y} x2="1280" y2={y} stroke={NM.borderSoft} strokeWidth="1" strokeDasharray="3 5"/>
              ))}
              <text x="1270" y="86" fontFamily={NM.fontMono} fontSize="10" fill={NM.textMuted} textAnchor="end">season avg 72</text>
              {/* Area fill */}
              <path d="M 0 160 L 120 150 L 240 140 L 360 130 L 480 120 L 600 100 L 720 80 L 840 60 L 960 50 L 1080 35 L 1280 25 L 1280 220 L 0 220 Z"
                fill={NM.heat} opacity="0.12"/>
              {/* Line */}
              <path d="M 0 160 L 120 150 L 240 140 L 360 130 L 480 120 L 600 100 L 720 80 L 840 60 L 960 50 L 1080 35 L 1280 25"
                stroke={NM.heat} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Dots */}
              {[[0,160],[120,150],[240,140],[360,130],[480,120],[600,100],[720,80],[840,60],[960,50],[1080,35],[1280,25]].map(([x,y], i) => (
                <circle key={i} cx={x} cy={y} r={i === 10 ? 6 : 3.5} fill={NM.heat}/>
              ))}
              {/* Pulse on last */}
              <circle cx="1280" cy="25" r="12" fill="none" stroke={NM.heat} strokeWidth="2" opacity="0.4">
                <animate attributeName="r" from="6" to="18" dur="1.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite"/>
              </circle>
              <text x="1265" y="18" fontFamily={NM.fontMono} fontSize="13" fontWeight="800" fill={NM.heat} textAnchor="end">94</text>
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12,
              fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 600 }}>
              <span>6 weeks ago</span><span>5w</span><span>4w</span><span>3w</span><span>2w</span><span>1w</span><span style={{ color: NM.heat, fontWeight: 700 }}>NOW</span>
            </div>
          </div>
        </PpSection>

        {/* RECENT FORM CHARACTERISTICS */}
        <PpSection kicker="RECENT FORM · AI" title="What the numbers say.">
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 12, padding: '24px 28px',
            display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32 }}>
            <div>
              <div style={{ fontFamily: NM.fontDisplay, fontWeight: 700, fontSize: 22, color: NM.textBright,
                letterSpacing: -0.4, lineHeight: 1.3, marginBottom: 14, textWrap: 'pretty' }}>
                "Career-best April pace, driven by 5v5 production rather than power-play minutes."
              </div>
              <div style={{ fontSize: 13, color: NM.text, lineHeight: 1.7, textWrap: 'pretty' }}>
                McDavid's last 5 games show a marked shift in <b style={{ color: NM.textBright }}>even-strength scoring efficiency</b> —
                12 of his 15 recent points came at 5v5, up from a 65% baseline. Shot generation is up 18% per 60 minutes,
                but his shot quality has stayed elite (xG/shot = .12). Most notable: <b style={{ color: NM.heat }}>zero turnovers</b> in
                his last 78 minutes of ice time. He's playing his most complete hockey of the season.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Trend', 'Climbing', NM.rise],
                ['Streak', '5-game points', NM.heat],
                ['Risk', 'Low fatigue', NM.rise],
                ['Outlook', 'Elite', NM.heat],
              ].map(([k, v, c]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px',
                  background: NM.bg, borderRadius: 8, border: `1px solid ${NM.borderSoft}` }}>
                  <span style={{ fontSize: 12, color: NM.textMuted, fontFamily: NM.fontMono, letterSpacing: 0.4, fontWeight: 600, textTransform: 'uppercase' }}>{k}</span>
                  <span style={{ fontSize: 13, color: c, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </PpSection>

        {/* LAST 5 STATS + GAME LOG */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          {/* Last 5 totals */}
          <div>
            <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>LAST 5 STATS</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 24, letterSpacing: -0.6, color: NM.textBright, marginBottom: 16 }}>The hot stretch.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                ['G',     '5',     'goals',          NM.heat],
                ['A',     '4',     'assists',        NM.textBright],
                ['PTS',   '9',     'points',         NM.textBright],
                ['+/-',   '+8',    'plus-minus',     NM.rise],
                ['SOG',   '21',    'shots on goal',  NM.textBright],
                ['SH%',   '23.8%', 'shooting %',     NM.heat],
                ['TOI',   '22:14', 'time on ice',    NM.textBright],
                ['FOW%',  '54.2%', 'faceoff win %',  NM.textBright],
                ['HITS',  '11',    'hits',           NM.textBright],
              ].map(([l, v, sub, c]) => (
                <div key={l} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 22, fontWeight: 800, color: c, letterSpacing: -0.6, lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 10, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 6 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Game log */}
          <div>
            <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>LAST 5 GAME LOG</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 24, letterSpacing: -0.6, color: NM.textBright, marginBottom: 16 }}>Game by game.</div>
            <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '20px 56px 1fr 30px 30px 30px 36px 36px',
                gap: 8, padding: '10px 14px', fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 0.8,
                borderBottom: `1px solid ${NM.borderSoft}` }}>
                <span>R</span><span>DATE</span><span>OPP</span>
                <span style={{ textAlign: 'right' }}>G</span><span style={{ textAlign: 'right' }}>A</span>
                <span style={{ textAlign: 'right' }}>+/-</span><span style={{ textAlign: 'right' }}>TOI</span>
                <span style={{ textAlign: 'right' }}>HEAT</span>
              </div>
              {[
                { r: 'W', d: 'Apr 27', opp: 'COL', home: false, g: 3, a: 0, pm: '+3', toi: '23:18', h: 94 },
                { r: 'W', d: 'Apr 25', opp: 'VAN', home: true,  g: 1, a: 1, pm: '+1', toi: '21:42', h: 88 },
                { r: 'W', d: 'Apr 23', opp: 'WPG', home: true,  g: 0, a: 2, pm: '+2', toi: '22:01', h: 84 },
                { r: 'L', d: 'Apr 21', opp: 'CGY', home: false, g: 1, a: 0, pm: '-1', toi: '20:55', h: 76 },
                { r: 'W', d: 'Apr 19', opp: 'SEA', home: true,  g: 0, a: 1, pm: '+3', toi: '22:48', h: 78 },
              ].map((g, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px 56px 1fr 30px 30px 30px 36px 36px',
                  gap: 8, padding: '11px 14px', alignItems: 'center',
                  borderTop: i ? `1px solid ${NM.borderSoft}` : 'none', fontSize: 12 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 3, fontSize: 9, fontWeight: 800,
                    color: '#fff', background: g.r === 'W' ? NM.rise : NM.red,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{g.r}</span>
                  <span style={{ fontFamily: NM.fontMono, color: NM.text, fontSize: 11 }}>{g.d}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, width: 10 }}>{g.home ? 'vs' : '@'}</span>
                    <TeamBadge code={g.opp} size={22}/>
                  </div>
                  <span style={{ fontFamily: NM.fontMono, color: NM.textBright, fontWeight: 600, textAlign: 'right' }}>{g.g}</span>
                  <span style={{ fontFamily: NM.fontMono, color: NM.textBright, fontWeight: 600, textAlign: 'right' }}>{g.a}</span>
                  <span style={{ fontFamily: NM.fontMono, color: g.pm.startsWith('+') ? NM.rise : NM.red, fontWeight: 600, textAlign: 'right' }}>{g.pm}</span>
                  <span style={{ fontFamily: NM.fontMono, color: NM.text, textAlign: 'right' }}>{g.toi}</span>
                  <span style={{ textAlign: 'right' }}><HeatPill h={g.h} size="sm"/></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SEASON STATS */}
        <PpSection kicker="SEASON STATS · 2025–26" title="The full picture."
          right={<span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>74 games played</span>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
            {[
              ['115', 'POINTS', '#1 NHL'],
              ['48',  'GOALS', '#3 NHL'],
              ['67',  'ASSISTS', '#1 NHL'],
              ['1.78','POINTS/GM', '#1 NHL'],
              ['+34', 'PLUS-MINUS', '#4 NHL'],
              ['16.8%', 'SHOOTING %', 'top 10'],
              ['22:08','TOI/GM', '#3 forwards'],
              ['58.4%','FACEOFF %', '#5 NHL'],
              ['28',   'PP GOALS', '#2 NHL'],
              ['11',   'GW GOALS', '#1 NHL'],
              ['4',    'HAT TRICKS', '#1 NHL'],
              ['2',    'EMPTY-NETTERS', ''],
            ].map(([v, l, r]) => (
              <div key={l} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10, padding: '14px 14px' }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 22, fontWeight: 800, color: NM.textBright, letterSpacing: -0.5, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 6 }}>{l}</div>
                {r && <div style={{ fontSize: 10, color: NM.heat, fontFamily: NM.fontMono, fontWeight: 700, marginTop: 4 }}>{r}</div>}
              </div>
            ))}
          </div>
        </PpSection>

        {/* PERFORMANCE RADAR + VS LEAGUE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          {/* Radar */}
          <div>
            <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>PERFORMANCE RADAR</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 24, letterSpacing: -0.6, color: NM.textBright, marginBottom: 16 }}>Shape of his game.</div>
            <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 12, padding: '24px 28px',
              display: 'flex', alignItems: 'center', gap: 24 }}>
              <PerformanceRadar
                size={280}
                stats={[
                  { label: 'SCORING',     value: 0.98 },
                  { label: 'PLAYMAKING',  value: 1.0 },
                  { label: 'SHOOTING',    value: 0.82 },
                  { label: 'DEFENSE',     value: 0.55 },
                  { label: 'PHYSICALITY', value: 0.42 },
                  { label: 'SPEED',       value: 0.96 },
                ]}
              />
              <div style={{ flex: 1, fontSize: 12, color: NM.text, lineHeight: 1.7 }}>
                Percentile vs all NHL forwards.<br/><br/>
                <span style={{ color: NM.heat, fontWeight: 700 }}>Elite</span> scoring, playmaking and speed —
                top 5% of the league across all three.<br/><br/>
                Below-median in physicality, which matches a play style built on space-creation
                rather than puck-battles.
              </div>
            </div>
          </div>

          {/* Vs league */}
          <div>
            <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>VS LEAGUE</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 24, letterSpacing: -0.6, color: NM.textBright, marginBottom: 16 }}>Where he separates.</div>
            <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 12, padding: '24px 28px' }}>
              <VsLeagueRow label="Points per game"   you={1.78} leagueAvg={0.62} top10={1.32}/>
              <VsLeagueRow label="Goals per 60"      you={1.42} leagueAvg={0.84} top10={1.18} unit="/60"/>
              <VsLeagueRow label="Assists per 60"    you={2.04} leagueAvg={1.10} top10={1.78} unit="/60"/>
              <VsLeagueRow label="Shots on goal"     you={4.2}  leagueAvg={2.1}  top10={3.5}  unit="/g"/>
              <VsLeagueRow label="xG per 60"         you={1.31} leagueAvg={0.78} top10={1.12} unit=""/>
              <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${NM.borderSoft}`, fontSize: 10, color: NM.textMuted }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 6, background: NM.heat, borderRadius: 1 }}/>Player
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 2, height: 10, background: NM.textMuted }}/>League avg
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 2, height: 10, background: NM.rise }}/>Top 10
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

// ═══════════════════════ MOBILE ═══════════════════════
function MobilePlayerFinal() {
  const p = {
    first: 'Connor', last: 'McDavid', t: 'EDM', num: 97, pos: 'C', age: 28, h: 94, energy: 82,
    flag: '🇨🇦', born: 'Richmond Hill, ON', drafted: '2015 · #1 OVR',
    archetype: 'Playmaker',
    archetypeBlurb: 'Vision-first center who creates space.',
    archetypeTags: ['Elite passer', 'Speed threat'],
    bio: 'Generational talent at the peak of his powers. Career-best April pace driven by 5v5 production.',
    pts: 115,
  };
  return (
    <PhoneFrame label="Mobile · Player profile" width={390} height={3050} statusBar={true}>
      <div style={{ background: NM.bg, color: NM.textBright, minHeight: '100%' }}>
        <BrandedHeaderMobile/>

        {/* HERO */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(155deg, ${TEAMS[p.t].c}cc 0%, ${NM.bg} 70%)` }}/>
          <div style={{ position: 'absolute', top: -40, right: -20, fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 240,
            color: 'rgba(255,255,255,0.05)', letterSpacing: -12, lineHeight: 0.8 }}>{p.num}</div>

          <div style={{ position: 'relative', padding: '16px 16px 20px' }}>
            {/* Photo + Team + Number */}
            <div style={{ width: '100%', aspectRatio: '5/3', borderRadius: 12, overflow: 'hidden',
              background: `linear-gradient(160deg, ${NM.bgRaised} 0%, ${NM.bg} 100%)`,
              border: `1px solid ${NM.border}`, position: 'relative', marginBottom: 14 }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, letterSpacing: 2, fontWeight: 700 }}>
                PLAYER PHOTO
              </div>
              <div style={{ position: 'absolute', top: 10, left: 10 }}>
                <TeamBadge code={p.t} size={30}/>
              </div>
              <div style={{ position: 'absolute', bottom: 10, right: 10, padding: '4px 10px', borderRadius: 999,
                background: 'rgba(10,11,15,0.7)', backdropFilter: 'blur(8px)',
                fontFamily: NM.fontMono, fontSize: 11, color: NM.textBright, fontWeight: 700 }}>#{p.num}</div>
            </div>

            {/* Meta */}
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.8, fontWeight: 700, marginBottom: 8 }}>
              {TEAMS[p.t].name.toUpperCase()} · {p.pos} · AGE {p.age}
            </div>
            {/* Name */}
            <div style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 44, letterSpacing: -1.8, lineHeight: 0.92, marginBottom: 14 }}>
              {p.first}<br/><span style={{ color: NM.heat }}>{p.last}.</span>
            </div>

            {/* AI archetype badge — compact */}
            <div style={{ marginBottom: 14 }}>
              <ArchetypeBadge archetype={p.archetype} compact/>
            </div>

            {/* Heat + Energy in one row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, background: NM.bgCard, border: `1px solid ${NM.heat}66`, borderRadius: 10, padding: 12, boxShadow: `0 0 12px ${NM.heat}33` }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 6 }}>HEAT · L5</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 22, background: `conic-gradient(${NM.heat} ${p.h}%, ${NM.borderSoft} 0)`, position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 4, borderRadius: 22, background: NM.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: NM.fontMono, fontSize: 14, fontWeight: 800, color: NM.heat }}>{p.h}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: NM.rise, fontFamily: NM.fontMono, fontWeight: 700 }}>↑ +6</div>
                    <div style={{ fontSize: 9, color: NM.textMuted }}>#1 of 312</div>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: 12 }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.rise, fontWeight: 700, letterSpacing: 1.2, marginBottom: 6 }}>ENERGY</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 22, fontWeight: 800, color: NM.rise, lineHeight: 1, marginBottom: 4 }}>{p.energy}</div>
                <EnergyBar value={p.energy} size="sm"/>
                <div style={{ fontSize: 9, color: NM.textMuted, marginTop: 4 }}>Fresh · 2 days rest</div>
              </div>
            </div>

            {/* Bio meta strip */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, padding: '8px 10px', background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 8 }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.textMuted, fontWeight: 700, letterSpacing: 1 }}>BORN</div>
                <div style={{ fontSize: 11, color: NM.textBright, fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>{p.flag}</span> {p.born}
                </div>
              </div>
              <div style={{ flex: 1, padding: '8px 10px', background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 8 }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.textMuted, fontWeight: 700, letterSpacing: 1 }}>DRAFTED</div>
                <div style={{ fontSize: 11, color: NM.textBright, fontWeight: 600, marginTop: 2 }}>{p.drafted}</div>
              </div>
            </div>

            {/* AI bio */}
            <div style={{ position: 'relative', padding: '12px 14px', background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10 }}>
              <div style={{ position: 'absolute', top: -8, left: 12, padding: '2px 7px', background: NM.bg,
                fontFamily: NM.fontMono, fontSize: 8, color: NM.story, fontWeight: 700, letterSpacing: 1.2, borderRadius: 3, border: `1px solid ${NM.story}55` }}>
                AI CHARACTER
              </div>
              <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.55, textWrap: 'pretty' }}>{p.bio}</div>
            </div>
          </div>
        </div>

        {/* FORM TRACKER */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>FORM TRACKER</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6 }}>Heat over time.</div>
            <div style={{ display: 'flex', gap: 4, padding: 3, background: NM.bgCard, borderRadius: 6, border: `1px solid ${NM.border}` }}>
              {['6W','Season'].map((t, i) => (
                <span key={t} style={{ padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                  color: i === 0 ? NM.textBright : NM.textMuted, background: i === 0 ? NM.bgRaised : 'transparent' }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: 14 }}>
            <svg viewBox="0 0 320 120" style={{ width: '100%', height: 120 }}>
              <line x1="0" y1="44" x2="320" y2="44" stroke={NM.borderSoft} strokeWidth="1" strokeDasharray="3 5"/>
              <text x="315" y="40" fontFamily={NM.fontMono} fontSize="9" fill={NM.textMuted} textAnchor="end">avg 72</text>
              <path d="M 0 90 L 50 84 L 100 76 L 150 64 L 200 50 L 250 30 L 320 14 L 320 120 L 0 120 Z" fill={NM.heat} opacity="0.12"/>
              <path d="M 0 90 L 50 84 L 100 76 L 150 64 L 200 50 L 250 30 L 320 14"
                stroke={NM.heat} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <circle cx="320" cy="14" r="5" fill={NM.heat}/>
              <text x="305" y="10" fontFamily={NM.fontMono} fontSize="11" fontWeight="800" fill={NM.heat} textAnchor="end">94</text>
            </svg>
          </div>
        </div>

        {/* RECENT FORM CHARACTERISTICS */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>RECENT FORM · AI</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, marginBottom: 12 }}>What the numbers say.</div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: '16px 16px' }}>
            <div style={{ fontFamily: NM.fontDisplay, fontWeight: 700, fontSize: 16, color: NM.textBright, letterSpacing: -0.3, lineHeight: 1.3, marginBottom: 10, textWrap: 'pretty' }}>
              "Career-best April pace, driven by 5v5 production."
            </div>
            <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.6, marginBottom: 12 }}>
              12 of 15 recent points at 5v5, shot generation up 18%, zero turnovers in last 78 minutes.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[['Trend', 'Climbing', NM.rise], ['Risk', 'Low', NM.rise], ['Streak', '5G pts', NM.heat], ['Outlook', 'Elite', NM.heat]].map(([k, v, c]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: NM.bg, borderRadius: 6, border: `1px solid ${NM.borderSoft}` }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{k}</span>
                  <span style={{ fontSize: 11, color: c, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LAST 5 STATS */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>LAST 5 STATS</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, marginBottom: 12 }}>The hot stretch.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {[['5','G',NM.heat],['4','A',NM.textBright],['9','PTS',NM.textBright],['+8','+/-',NM.rise],['21','SOG',NM.textBright],['23.8%','SH%',NM.heat]].map(([v, l, c]) => (
              <div key={l} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 18, fontWeight: 800, color: c, letterSpacing: -0.4, lineHeight: 1 }}>{v}</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 0.5, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* LAST 5 GAME LOG */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>GAME LOG</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, marginBottom: 12 }}>Game by game.</div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, overflow: 'hidden' }}>
            {[
              { r: 'W', d: 'Apr 27', opp: 'COL', home: false, ga: '3-0', pm: '+3', h: 94 },
              { r: 'W', d: 'Apr 25', opp: 'VAN', home: true,  ga: '1-1', pm: '+1', h: 88 },
              { r: 'W', d: 'Apr 23', opp: 'WPG', home: true,  ga: '0-2', pm: '+2', h: 84 },
              { r: 'L', d: 'Apr 21', opp: 'CGY', home: false, ga: '1-0', pm: '-1', h: 76 },
              { r: 'W', d: 'Apr 19', opp: 'SEA', home: true,  ga: '0-1', pm: '+3', h: 78 },
            ].map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px',
                borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <span style={{ width: 16, height: 16, borderRadius: 3, fontSize: 8, fontWeight: 800, color: '#fff',
                  background: g.r === 'W' ? NM.rise : NM.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{g.r}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.text, width: 44 }}>{g.d}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted }}>{g.home ? 'vs' : '@'}</span>
                <TeamBadge code={g.opp} size={20}/>
                <span style={{ flex: 1 }}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textBright, fontWeight: 700 }}>{g.ga}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: g.pm.startsWith('+') ? NM.rise : NM.red, fontWeight: 600, width: 24, textAlign: 'right' }}>{g.pm}</span>
                <HeatPill h={g.h} size="sm"/>
              </div>
            ))}
          </div>
        </div>

        {/* SEASON STATS */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>SEASON 2025–26</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, marginBottom: 12 }}>The full picture.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {[
              ['115','PTS','#1 NHL'],['48','G','#3 NHL'],['67','A','#1 NHL'],
              ['1.78','PTS/GM','#1 NHL'],['+34','+/-','#4 NHL'],['16.8%','SH%','top 10'],
              ['22:08','TOI','#3 fwd'],['58.4%','FO%','#5 NHL'],['28','PP G','#2 NHL'],
            ].map(([v, l, r]) => (
              <div key={l} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 8, padding: '10px 10px' }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 16, fontWeight: 800, color: NM.textBright, letterSpacing: -0.4, lineHeight: 1 }}>{v}</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 0.5, marginTop: 4 }}>{l}</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, marginTop: 2 }}>{r}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RADAR */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>PERFORMANCE</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, marginBottom: 12 }}>Shape of his game.</div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PerformanceRadar
              size={300}
              stats={[
                { label: 'SCORE',   value: 0.98 },
                { label: 'PLAYMK',  value: 1.0 },
                { label: 'SHOT',    value: 0.82 },
                { label: 'DEF',     value: 0.55 },
                { label: 'PHYS',    value: 0.42 },
                { label: 'SPEED',   value: 0.96 },
              ]}
            />
            <div style={{ fontSize: 11, color: NM.text, lineHeight: 1.5, marginTop: 6, textAlign: 'center' }}>
              Percentile vs all NHL forwards.
            </div>
          </div>
        </div>

        {/* VS LEAGUE */}
        <div style={{ padding: '20px 16px 24px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>VS LEAGUE</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, marginBottom: 12 }}>Where he separates.</div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: '16px 16px' }}>
            <VsLeagueRow label="Points per game"   you={1.78} leagueAvg={0.62} top10={1.32}/>
            <VsLeagueRow label="Goals per 60"      you={1.42} leagueAvg={0.84} top10={1.18} unit="/60"/>
            <VsLeagueRow label="Assists per 60"    you={2.04} leagueAvg={1.10} top10={1.78} unit="/60"/>
            <VsLeagueRow label="xG per 60"         you={1.31} leagueAvg={0.78} top10={1.12} unit=""/>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10, paddingTop: 12, borderTop: `1px solid ${NM.borderSoft}`, fontSize: 9, color: NM.textMuted }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 5, background: NM.heat, borderRadius: 1 }}/>Player
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 2, height: 9, background: NM.textMuted }}/>League avg
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 2, height: 9, background: NM.rise }}/>Top 10
              </div>
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

Object.assign(window, { DesktopPlayerFinal, MobilePlayerFinal, PerformanceRadar, VsLeagueRow, EnergyBar });
