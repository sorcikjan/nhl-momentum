// Phone frame — lightweight iOS-ish device to show mobile-first designs.

function PhoneFrame({ children, label, width = 390, height = 844, statusBar = true, accent = '#ff5a24' }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {label && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, paddingBottom: 10,
          fontSize: 13, fontWeight: 500, color: 'rgba(60,50,40,0.72)', whiteSpace: 'nowrap',
        }}>{label}</div>
      )}
      <div style={{
        width: width + 20, minHeight: height + 20, padding: 10, borderRadius: 52,
        background: '#0a0b0f',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2), 0 12px 40px rgba(0,0,0,0.25), inset 0 0 0 1.5px #2a2f3a',
      }}>
        <div style={{
          width, minHeight: height, borderRadius: 42, overflow: 'hidden',
          background: NM.bg, position: 'relative',
          fontFamily: NM.fontSans,
        }}>
          {/* Status bar */}
          {statusBar && (
            <div style={{
              height: 44, paddingTop: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 28px 0',
              position: 'relative', zIndex: 10,
            }}>
              <span style={{ fontFamily: NM.fontSans, fontSize: 13, fontWeight: 600, color: NM.textBright }}>9:41</span>
              {/* Notch / Dynamic Island */}
              <div style={{
                position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                width: 112, height: 32, background: '#000', borderRadius: 16,
              }}/>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {/* Signal */}
                <svg width="16" height="10" viewBox="0 0 16 10"><rect x="0" y="6" width="2.5" height="4" rx="0.5" fill={NM.textBright}/><rect x="4" y="4" width="2.5" height="6" rx="0.5" fill={NM.textBright}/><rect x="8" y="2" width="2.5" height="8" rx="0.5" fill={NM.textBright}/><rect x="12" y="0" width="2.5" height="10" rx="0.5" fill={NM.textBright}/></svg>
                {/* Battery */}
                <svg width="24" height="11" viewBox="0 0 24 11"><rect x="0.5" y="0.5" width="20" height="10" rx="2.5" fill="none" stroke={NM.textBright} opacity="0.4"/><rect x="2" y="2" width="17" height="7" rx="1.5" fill={NM.textBright}/><rect x="21" y="3.5" width="1.5" height="4" rx="0.5" fill={NM.textBright} opacity="0.4"/></svg>
              </div>
            </div>
          )}

          {/* Content area */}
          <div style={{
            minHeight: statusBar ? height - 44 : height,
            paddingBottom: 26,
            position: 'relative',
          }}>
            {children}
          </div>

          {/* Home indicator */}
          <div style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            width: 134, height: 5, borderRadius: 3, background: NM.textBright, opacity: 0.9,
          }}/>
        </div>
      </div>
    </div>
  );
}

// Bottom tab bar used across variations
function PhoneTabBar({ active = 'home' }) {
  const tabs = [
    { id: 'home',     label: 'Today',    icon: 'home' },
    { id: 'games',    label: 'Games',    icon: 'games' },
    { id: 'hot',      label: 'Hot',      icon: 'flame' },
    { id: 'rankings', label: 'Ranks',    icon: 'bars' },
    { id: 'you',      label: 'You',      icon: 'bookmark' },
  ];
  const icon = (t, color) => {
    const s = { width: 22, height: 22, stroke: color, fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
    switch (t) {
      case 'home':     return <svg viewBox="0 0 24 24" {...s}><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1Z"/></svg>;
      case 'games':    return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="8.5"/><path d="M4 12h16M12 4v16"/></svg>;
      case 'flame':    return <svg viewBox="0 0 24 24" {...s}><path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s-1-3 4-6Z"/><path d="M9 15c0 1.5 1.3 3 3 3s3-1.5 3-3-3-4-3-4-3 2.5-3 4Z"/></svg>;
      case 'bars':     return <svg viewBox="0 0 24 24" {...s}><path d="M4 20V10M10 20V4M16 20v-6M22 20v-9"/></svg>;
      case 'bookmark': return <svg viewBox="0 0 24 24" {...s}><path d="M6 3h12v18l-6-4-6 4Z"/></svg>;
    }
  };
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      display: 'flex', padding: '10px 8px 24px',
      background: 'rgba(10,11,15,0.88)',
      backdropFilter: 'blur(20px)',
      borderTop: `1px solid ${NM.borderSoft}`,
    }}>
      {tabs.map(t => {
        const isActive = t.id === active;
        const color = isActive ? NM.heat : NM.textMuted;
        return (
          <div key={t.id} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}>
            {icon(t.icon, color)}
            <span style={{ fontSize: 10, fontWeight: 600, color, letterSpacing: 0.2 }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Top "app bar" used across most variations
function PhoneTopBar({ title = 'NHL Momentum', subtitle, right, transparent = false, variant = 'heat' }) {
  const accent = variant === 'heat' ? NM.heat : variant === 'rise' ? NM.rise : variant === 'story' ? NM.story : NM.blue;
  return (
    <div style={{
      padding: '6px 20px 12px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: transparent ? 'transparent' : NM.bg,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `linear-gradient(135deg, ${accent} 0%, ${accent}88 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 15, color: '#fff',
        }}>M</div>
        <div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 15, color: NM.textBright, letterSpacing: -0.2 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 10, color: NM.textMuted, fontWeight: 500, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {right}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NM.text} strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="7"/>
          <path d="m20 20-4-4"/>
        </svg>
      </div>
    </div>
  );
}

Object.assign(window, { PhoneFrame, PhoneTabBar, PhoneTopBar });
