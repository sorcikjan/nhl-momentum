// Shared primitives across all variations.

// ─── Team color block (2-letter code) ─────────────────────────────
function TeamChip({ code, size = 28, radius = 4, fontSize }) {
  const t = TEAMS[code] || { c: '#333', t: '#fff' };
  const fs = fontSize || Math.round(size * 0.44);
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: t.c, color: t.t,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: NM.fontMono, fontWeight: 700, fontSize: fs,
      letterSpacing: 0.2, flexShrink: 0,
    }}>
      {code}
    </div>
  );
}

// ─── Player headshot placeholder ──────────────────────────────────
function Headshot({ player, size = 36, ring }) {
  const initials = `${player.first[0]}${player.last[0]}`;
  const t = TEAMS[player.team] || { c: '#333', t: '#fff' };
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: `linear-gradient(145deg, ${t.c} 0%, ${t.c}cc 60%, #1a1d26 100%)`,
      color: t.t,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: NM.fontSans, fontWeight: 600, fontSize: size * 0.36,
      flexShrink: 0,
      boxShadow: ring ? `0 0 0 2px ${ring}` : 'none',
      overflow: 'hidden', position: 'relative',
    }}>
      {initials}
      {/* Subtle diagonal stripe texture */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(255,255,255,0.04) 6px 7px)',
      }}/>
    </div>
  );
}

// ─── Heat number with colored ring ────────────────────────────────
function HeatBadge({ heat, size = 40, thickness = 3, label = true }) {
  const color = heatColor(heat);
  const pct = heat;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="#252a38" strokeWidth={thickness} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={thickness} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: NM.fontSans, fontWeight: 700, fontSize: size * 0.4, color,
      }}>
        {heat}
      </div>
    </div>
  );
}

// ─── Horizontal heat bar ──────────────────────────────────────────
function HeatBar({ heat, height = 4, showLabel = false, width = '100%', bg = '#1c2030' }) {
  const color = heatColor(heat);
  return (
    <div style={{ width, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height, borderRadius: height, background: bg, overflow: 'hidden',
      }}>
        <div style={{
          width: `${heat}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}66 0%, ${color} 100%)`,
          borderRadius: height,
        }}/>
      </div>
      {showLabel && (
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, fontWeight: 600, color, minWidth: 20, textAlign: 'right' }}>
          {heat}
        </span>
      )}
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────
function Sparkline({ values, w = 80, h = 22, stroke, strokeWidth = 1.5, fill = true }) {
  const color = stroke || heatColor(values[values.length - 1]);
  const d = sparkPath(values, w, h, 2);
  const min = Math.min(...values), max = Math.max(...values);
  const range = Math.max(1, max - min);
  const step = (w - 4) / (values.length - 1);
  const lastX = 2 + (values.length - 1) * step;
  const lastY = h - 2 - ((values[values.length-1] - min) / range) * (h - 4);
  const areaD = `${d} L${lastX.toFixed(1)},${h} L2,${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {fill && <path d={areaD} fill={`${color}20`} />}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lastX} cy={lastY} r={2} fill={color}/>
    </svg>
  );
}

// ─── Kicker label ─────────────────────────────────────────────────
function Kicker({ children, color = NM.story, size = 10 }) {
  return (
    <span style={{
      fontFamily: NM.fontSans, fontWeight: 700, fontSize: size,
      letterSpacing: 1.4, textTransform: 'uppercase', color,
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>
      <span style={{ width: 14, height: 2, background: color, borderRadius: 1 }}/>
      {children}
    </span>
  );
}

// ─── Sidebar / nav item (in phone, this is in top or hamburger) ────
function Tab({ active, children, onClick, compact }) {
  return (
    <button onClick={onClick} style={{
      border: 0, background: 'transparent', cursor: 'pointer',
      padding: compact ? '6px 10px' : '8px 14px',
      fontFamily: NM.fontSans, fontSize: 13, fontWeight: active ? 600 : 500,
      color: active ? NM.textBright : NM.textMuted,
      borderBottom: `2px solid ${active ? NM.heat : 'transparent'}`,
      transition: 'color 0.15s',
    }}>{children}</button>
  );
}

// ─── Stat box ─────────────────────────────────────────────────────
function Stat({ label, value, color = NM.textBright, size = 'md' }) {
  const sizes = {
    sm: { v: 14, l: 9 },
    md: { v: 18, l: 10 },
    lg: { v: 24, l: 10 },
    xl: { v: 32, l: 10 },
  };
  const s = sizes[size];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontFamily: NM.fontMono, fontSize: s.v, fontWeight: 600, color }}>{value}</span>
      <span style={{ fontFamily: NM.fontSans, fontSize: s.l, fontWeight: 500, color: NM.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

// ─── Image placeholder (editorial photo slot) ─────────────────────
function PhotoPlaceholder({ w, h, subject = 'player action shot', team, accent }) {
  const t = team ? TEAMS[team] : null;
  const bg1 = t ? t.c : '#2a2f3f';
  const bg2 = t ? t.t : '#1a1d26';
  return (
    <div style={{
      width: w, height: h, position: 'relative', overflow: 'hidden',
      background: `linear-gradient(135deg, ${bg1} 0%, ${bg2}aa 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Diagonal stripes */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(115deg, transparent 0 20px, rgba(255,255,255,0.04) 20px 22px)',
      }}/>
      {/* Dark gradient overlay bottom */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%)',
      }}/>
      <span style={{
        position: 'relative',
        fontFamily: NM.fontMono, fontSize: 9, fontWeight: 500,
        color: 'rgba(255,255,255,0.55)', letterSpacing: 1,
        textTransform: 'uppercase',
        background: 'rgba(0,0,0,0.3)', padding: '3px 8px', borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.15)',
      }}>{subject}</span>
    </div>
  );
}

// ─── Mini game row (scores ticker) ────────────────────────────────
function ScoreRow({ game, compact }) {
  const live = game.status === 'live';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: compact ? '6px 10px' : '8px 12px',
      background: NM.bgRaised, borderRadius: 8,
      border: `1px solid ${live ? NM.heat : NM.borderSoft}`,
      fontSize: 12,
    }}>
      <TeamChip code={game.away} size={compact ? 18 : 22} fontSize={compact ? 9 : 10}/>
      <span style={{ color: NM.textBright, fontWeight: 600, fontFamily: NM.fontMono, minWidth: 14, textAlign: 'center' }}>
        {game.awayScore ?? ''}
      </span>
      <span style={{ color: NM.textMuted, fontFamily: NM.fontMono, fontSize: 10 }}>@</span>
      <TeamChip code={game.home} size={compact ? 18 : 22} fontSize={compact ? 9 : 10}/>
      <span style={{ color: NM.textBright, fontWeight: 600, fontFamily: NM.fontMono, minWidth: 14, textAlign: 'center' }}>
        {game.homeScore ?? ''}
      </span>
      <div style={{ flex: 1 }}/>
      <span style={{
        fontFamily: NM.fontMono, fontSize: 10, fontWeight: 600,
        color: live ? NM.heat : NM.text,
      }}>
        {live ? `● ${game.period}` : game.time}
      </span>
    </div>
  );
}

Object.assign(window, { TeamChip, Headshot, HeatBadge, HeatBar, Sparkline, Kicker, Tab, Stat, PhotoPlaceholder, ScoreRow });
