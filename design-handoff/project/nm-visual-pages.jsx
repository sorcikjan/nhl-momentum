// Full visual system applied — desktop + mobile homepages and player pages
// Built around the original HeatPulseMark + momentum. wordmark.

// ─── Shared branded header (desktop) ───
function BrandedHeaderDesktop({ active = 'Tonight', status = { live: true, label: 'LIVE · 4' } }) {
  const items = ['Tonight', 'Heat map', 'Players', 'Rankings', 'Stories'];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 48px', borderBottom: `1px solid ${NM.borderSoft}`,
      background: 'rgba(10,11,15,0.85)', backdropFilter: 'blur(10px)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <MomentumWordmark size={22}/>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {items.map(l => (
          <span key={l} style={{
            padding: '8px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600,
            color: l === active ? NM.textBright : NM.text,
            background: l === active ? NM.bgCard : 'transparent',
          }}>{l}</span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {status && (
          <div style={{ padding: '6px 10px', borderRadius: 999,
            background: status.live ? NM.heatDim : NM.bgCard,
            border: `1px solid ${status.live ? NM.heat + '55' : NM.border}`,
            display: 'flex', alignItems: 'center', gap: 6 }}>
            {status.live && <span style={{ width: 6, height: 6, borderRadius: 3, background: NM.heat, boxShadow: `0 0 8px ${NM.heat}` }}/>}
            <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: status.live ? NM.heat : NM.text, fontWeight: 700, letterSpacing: 1 }}>{status.label}</span>
          </div>
        )}
        <div style={{ width: 30, height: 30, borderRadius: 15, background: NM.bgCard, border: `1px solid ${NM.border}` }}/>
      </div>
    </div>
  );
}

// ─── Branded header (mobile) ───
function BrandedHeaderMobile({ status = { live: true, label: 'LIVE 4' } }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderBottom: `1px solid ${NM.borderSoft}`,
    }}>
      <MomentumWordmark size={18}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {status && (
          <div style={{ padding: '4px 8px', borderRadius: 999,
            background: status.live ? NM.heatDim : NM.bgCard,
            border: `1px solid ${status.live ? 'transparent' : NM.border}`,
            display: 'flex', alignItems: 'center', gap: 5 }}>
            {status.live && <span style={{ width: 5, height: 5, borderRadius: 3, background: NM.heat }}/>}
            <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: status.live ? NM.heat : NM.text, fontWeight: 700, letterSpacing: 0.8 }}>{status.label}</span>
          </div>
        )}
        <div style={{ width: 24, height: 24, borderRadius: 12, background: NM.bgCard, border: `1px solid ${NM.border}` }}/>
      </div>
    </div>
  );
}

// ─── DESKTOP HOMEPAGE ───
function DesktopHome() {
  return (
    <DCArtboard label="Desktop · Homepage · 1440" width={1440} height={1400}
      style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <BrandedHeaderDesktop active="Tonight"/>

      {/* HERO: Tonight + featured game */}
      <div style={{ padding: '32px 48px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>TUESDAY · APR 28 · TONIGHT</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 44, letterSpacing: -1.5, lineHeight: 1, color: NM.textBright }}>
              6 games. <span style={{ color: NM.text }}>2 to watch.</span>
            </div>
          </div>
          <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>Heat updated 12s ago</span>
        </div>

        {/* Two flagship cards + slate list */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 360px', gap: 16, marginBottom: 36 }}>
          {[
            { home: 'EDM', away: 'COL', t: '7:00 PM', pred: 'EDM', conf: 68, watch: 'McDavid · 94 heat', side: 'home' },
            { home: 'TOR', away: 'BOS', t: '7:30 PM', pred: 'BOS', conf: 54, watch: 'Pastrnak · 88 heat', side: 'away' },
          ].map((g, i) => (
            <div key={i} style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, padding: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${TEAMS[g[g.side === 'home' ? 'home' : 'away']].c}44 0%, transparent 60%)` }}/>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1 }}>WATCH TONIGHT</span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>· {g.t}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: TEAMS[g.away].c, color: TEAMS[g.away].t, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, border: g.pred === g.away ? `2px solid ${NM.heat}` : 'none' }}>{g.away}</div>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 13, color: NM.textMuted }}>at</span>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: TEAMS[g.home].c, color: TEAMS[g.home].t, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, border: g.pred === g.home ? `2px solid ${NM.heat}` : 'none' }}>{g.home}</div>
                </div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 22, color: NM.textBright, letterSpacing: -0.4, marginBottom: 8, textWrap: 'pretty' }}>
                  Our pick: {TEAMS[g.pred].name} ({g.conf}%)
                </div>
                <div style={{ fontSize: 13, color: NM.text, marginBottom: 14 }}>{g.watch}</div>
                {/* Probability bar */}
                <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 6 }}>
                  <div style={{ flex: g.conf, background: NM.heat }}/>
                  <div style={{ flex: 100 - g.conf, background: NM.borderSoft }}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700 }}>
                  <span>{g.pred} {g.conf}%</span>
                  <span>{g.pred === g.home ? g.away : g.home} {100 - g.conf}%</span>
                </div>
              </div>
            </div>
          ))}

          {/* Slate list */}
          <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, padding: 18 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 12 }}>REST OF THE SLATE</div>
            {[
              ['NYR','PIT','8:00','NYR',58],
              ['DAL','VGK','9:00','VGK',61],
              ['FLA','NSH','7:00','FLA',72],
              ['CGY','VAN','10:00','VAN',55],
            ].map(([a,h,t,p,c]) => (
              <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: `1px solid ${NM.borderSoft}` }}>
                <div style={{ width: 22, height: 22, borderRadius: 4, background: TEAMS[a].c, color: TEAMS[a].t, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a}</div>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>@</span>
                <div style={{ width: 22, height: 22, borderRadius: 4, background: TEAMS[h].c, color: TEAMS[h].t, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{h}</div>
                <span style={{ flex: 1 }}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.text, fontWeight: 600 }}>{p} {c}%</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, marginLeft: 6 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* HEAT MAP — full width */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>BURNING RIGHT NOW</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -1, lineHeight: 1, color: NM.textBright }}>
              These 20 are above their season pace.
            </div>
          </div>
          <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 600 }}>See all 312 →</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8, marginBottom: 40 }}>
          {[94,91,88,85,82,79,76,73,70,68,66,64,61,58,55,52,48,44,38,32].map((h, i) => {
            const c = heatColor(h);
            const names = ['McDavid','Draisaitl','Matthews','Pastrnak','MacKinnon','Kaprizov','Hughes','Marner','Eichel','Kucherov','Stamkos','Tkachuk','Reinhart','Werenski','Hellebuyck','Robertson','Hyman','Kreider','Stutzle','Tarasenko'];
            return (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: 8, padding: 10,
                background: `linear-gradient(155deg, ${c}${Math.round(h*1.8).toString(16).padStart(2,'0').slice(0,2)} 0%, ${NM.bg} 100%)`,
                border: `1px solid ${h >= 70 ? c+'66' : NM.borderSoft}`,
                boxShadow: h >= 85 ? `0 0 18px ${c}55` : 'none',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 16, fontWeight: 700, color: c }}>{h}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: NM.textBright, textWrap: 'pretty', lineHeight: 1.1 }}>{names[i]}</div>
                  <div style={{ height: 2, background: c, opacity: h/100, marginTop: 6 }}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* LAST NIGHT + STORIES */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 48 }}>
          <div>
            <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>LAST NIGHT · 8 GAMES · 6 RIGHT</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -1, lineHeight: 1, color: NM.textBright, marginBottom: 20 }}>
              McDavid put on a clinic.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { home: 'EDM', away: 'COL', hs: 5, as: 3, pick: true, star: 'McDavid · 3G 0A' },
                { home: 'TOR', away: 'MTL', hs: 4, as: 2, pick: true, star: 'Matthews · 2G 1A' },
                { home: 'NYR', away: 'NJD', hs: 2, as: 4, pick: false, star: 'Hughes · 1G 3A' },
              ].map((r, i) => (
                <div key={i} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 9, fontWeight: 700, letterSpacing: 1, color: r.pick ? NM.rise : NM.text, padding: '2px 6px', background: r.pick ? NM.riseDim : 'transparent', borderRadius: 3, border: `1px solid ${r.pick ? NM.rise+'55' : NM.borderSoft}` }}>{r.pick ? 'PICK ✓' : 'MISS ✗'}</span>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>FINAL</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: TEAMS[r.away].c, color: TEAMS[r.away].t, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.away}</div>
                    <span style={{ flex: 1, fontFamily: NM.fontMono, fontSize: 16, color: r.as > r.hs ? NM.textBright : NM.textMuted, fontWeight: 700 }}>{r.as}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: TEAMS[r.home].c, color: TEAMS[r.home].t, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.home}</div>
                    <span style={{ flex: 1, fontFamily: NM.fontMono, fontSize: 16, color: r.hs > r.as ? NM.textBright : NM.textMuted, fontWeight: 700 }}>{r.hs}</span>
                  </div>
                  <div style={{ fontSize: 11, color: NM.heat, fontFamily: NM.fontMono, fontWeight: 700 }}>★ {r.star}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.story, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>THIS WEEK</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, lineHeight: 1.1, color: NM.textBright, marginBottom: 16 }}>Stories</div>
            {[
              { k: 'BREAKOUT', t: 'Bedard is heating up — and fast.', d: 'CHI · L5' },
              { k: 'SLUMP',    t: 'What happened to Kucherov?',        d: 'TBL · L10' },
              { k: 'ROOKIE',   t: 'Celebrini\'s first 20 games.',       d: 'SJS · season' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '12px 0', borderTop: `1px solid ${NM.borderSoft}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, fontWeight: 700, letterSpacing: 1, color: NM.story }}>{s.k}</span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted }}>· {s.d}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: NM.textBright, textWrap: 'pretty' }}>{s.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

// ─── DESKTOP PLAYER ───
function DesktopPlayer() {
  return (
    <DCArtboard label="Desktop · Player profile · 1440" width={1440} height={1080}
      style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <BrandedHeaderDesktop active="Players"/>

      {/* HERO with photo slab */}
      <div style={{ position: 'relative', height: 380, overflow: 'hidden', borderBottom: `1px solid ${NM.borderSoft}` }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(120deg, ${TEAMS.EDM.c} 0%, ${NM.bg} 70%)` }}/>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 80% 30%, rgba(255,90,36,0.4) 0%, transparent 55%)` }}/>
        <div style={{ position: 'absolute', top: -40, right: 40, fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 480, color: 'rgba(255,255,255,0.05)', letterSpacing: -24, lineHeight: 0.8 }}>97</div>

        <div style={{ position: 'relative', padding: '36px 48px', display: 'flex', alignItems: 'flex-end', height: '100%' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 24, height: 24, borderRadius: 5, background: TEAMS.EDM.c, color: TEAMS.EDM.t, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>EDM</div>
              <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.6, fontWeight: 600 }}>EDMONTON OILERS · #97 · C · AGE 28</span>
            </div>
            <div style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 120, letterSpacing: -4, lineHeight: 0.88, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
              Connor<br/><span style={{ color: NM.heat }}>McDavid.</span>
            </div>
          </div>

          {/* Heat circle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 160, height: 160, borderRadius: 80,
              background: `conic-gradient(${NM.heat} 0% 94%, ${NM.borderSoft} 94% 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 40px ${NM.heat}55`,
            }}>
              <div style={{ width: 138, height: 138, borderRadius: 69, background: NM.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.4 }}>HEAT · L5</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 56, fontWeight: 700, color: NM.heat, letterSpacing: -2, lineHeight: 1 }}>94</div>
                <div style={{ fontSize: 10, color: NM.rise, fontFamily: NM.fontMono, fontWeight: 700, marginTop: 4 }}>↑ +6 today</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row + content grid */}
      <div style={{ padding: '32px 48px' }}>
        {/* 4 key stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            ['5G 4A','9 pts in last 5','+4 vs L5 avg'],
            ['22:14','TOI per game','+1:30 vs L5 avg'],
            ['12.8%','Shooting %','+3.2 vs season'],
            ['+8','Plus-minus L5','#1 on team'],
          ].map(([v, l, d]) => (
            <div key={l} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10, padding: 18 }}>
              <div style={{ fontFamily: NM.fontMono, fontSize: 26, fontWeight: 700, color: NM.textBright, letterSpacing: -0.5, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 12, color: NM.text, marginTop: 6, fontWeight: 500 }}>{l}</div>
              <div style={{ fontSize: 10, color: NM.rise, fontFamily: NM.fontMono, fontWeight: 700, marginTop: 6 }}>{d}</div>
            </div>
          ))}
        </div>

        {/* Heat timeline + ranks */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 32 }}>
          {/* Timeline */}
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 12, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>HEAT TIMELINE · 6 WEEKS</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: NM.textBright, letterSpacing: -0.4 }}>Climbing all month.</div>
              </div>
              <div style={{ display: 'flex', gap: 4, padding: 3, background: NM.bg, borderRadius: 6, border: `1px solid ${NM.borderSoft}` }}>
                {['6W','Season','Career'].map((t, i) => (
                  <span key={t} style={{ padding: '5px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: i === 0 ? NM.textBright : NM.textMuted, background: i === 0 ? NM.bgRaised : 'transparent' }}>{t}</span>
                ))}
              </div>
            </div>
            <svg viewBox="0 0 700 200" style={{ width: '100%', height: 200 }}>
              <line x1="0" y1="120" x2="700" y2="120" stroke={NM.textMuted} strokeWidth="1" strokeDasharray="4 4" opacity="0.5"/>
              <text x="700" y="115" fontFamily={NM.fontMono} fontSize="10" fill={NM.textMuted} textAnchor="end">season avg 72</text>
              <path d="M 0 140 L 100 130 L 200 110 L 300 95 L 400 75 L 500 55 L 600 40 L 700 30" stroke={NM.heat} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 0 140 L 100 130 L 200 110 L 300 95 L 400 75 L 500 55 L 600 40 L 700 30 L 700 200 L 0 200 Z" fill={NM.heat} opacity="0.1"/>
              <circle cx="700" cy="30" r="6" fill={NM.heat}/>
              <circle cx="700" cy="30" r="11" fill="none" stroke={NM.heat} strokeWidth="2" opacity="0.4">
                <animate attributeName="r" from="6" to="14" dur="1.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>

          {/* Where he ranks */}
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 12, padding: 22 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 700, letterSpacing: 1.4, marginBottom: 14 }}>WHERE HE RANKS</div>
            {[
              { l: 'Heat L5', v: '#1 of 312', p: 100 },
              { l: 'Goals L10', v: '#1 of 312', p: 99 },
              { l: 'TOI/gm', v: '#3 of 312', p: 96 },
              { l: 'Plus-minus', v: '#8 of 312', p: 88 },
            ].map(r => (
              <div key={r.l} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: NM.text }}>{r.l}</span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textBright, fontWeight: 700 }}>{r.v}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: NM.borderSoft, overflow: 'hidden' }}>
                  <div style={{ width: `${r.p}%`, height: '100%', background: NM.heat }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stories */}
        <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.story, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>STORIES · 3 NEW</div>
        <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 24, letterSpacing: -0.6, color: NM.textBright, marginBottom: 16 }}>The story McDavid is telling.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { k: 'LAST NIGHT', t: 'A hat trick — and a statement.', d: 'EDM 5 · COL 3' },
            { k: 'THE STREAK', t: '7-game point streak, longest of season.', d: 'Apr 14 – Apr 27' },
            { k: 'THE NUMBER', t: '94 Heat — career-high April.', d: 'Top 1% of all skaters' },
          ].map((s, i) => (
            <div key={i} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10, padding: 18 }}>
              <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>{s.k}</div>
              <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 17, color: NM.textBright, lineHeight: 1.15, letterSpacing: -0.3, textWrap: 'pretty', marginBottom: 8 }}>{s.t}</div>
              <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </DCArtboard>
  );
}

// ─── MOBILE HOMEPAGE (branded) ───
function MobileHomeBranded() {
  return (
    <PhoneFrame label="Mobile · Homepage" width={390} height={1200} statusBar={true}>
      <div style={{ background: NM.bg, color: NM.textBright, minHeight: '100%', paddingBottom: 24 }}>
        <BrandedHeaderMobile/>

        {/* Hero */}
        <div style={{ padding: '20px 16px 12px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>TUE · APR 28 · TONIGHT</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 30, letterSpacing: -1, lineHeight: 1, color: NM.textBright }}>
            6 games. <span style={{ color: NM.text }}>2 to watch.</span>
          </div>
        </div>

        {/* Watch tonight card */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, padding: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${TEAMS.EDM.c}55 0%, transparent 70%)` }}/>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1 }}>WATCH TONIGHT</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted }}>· 7:00 PM</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 7, background: TEAMS.COL.c, color: TEAMS.COL.t, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>COL</div>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>at</span>
                <div style={{ width: 36, height: 36, borderRadius: 7, background: TEAMS.EDM.c, color: TEAMS.EDM.t, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${NM.heat}` }}>EDM</div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: NM.textBright, letterSpacing: -0.3, marginBottom: 4 }}>Our pick: Oilers (68%)</div>
              <div style={{ fontSize: 12, color: NM.heat, fontFamily: NM.fontMono, fontWeight: 600 }}>★ Watch McDavid · 94 heat</div>
            </div>
          </div>
        </div>

        {/* Rest of slate */}
        <div style={{ padding: '0 16px 24px' }}>
          {[['NYR','PIT','8:00','NYR',58],['DAL','VGK','9:00','VGK',61],['FLA','NSH','7:00','FLA',72]].map(([a,h,t,p,c]) => (
            <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: `1px solid ${NM.borderSoft}` }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: TEAMS[a].c, color: TEAMS[a].t, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a}</div>
              <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted }}>@</span>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: TEAMS[h].c, color: TEAMS[h].t, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{h}</div>
              <span style={{ flex: 1 }}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.text, fontWeight: 600 }}>{p} {c}%</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>{t}</span>
            </div>
          ))}
        </div>

        {/* Heat map */}
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>BURNING RIGHT NOW</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: NM.textBright, letterSpacing: -0.6, lineHeight: 1.05, marginBottom: 14 }}>20 above their pace.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {[94,91,88,85,82,79,76,73,70,68,66,64].map((h, i) => {
              const c = heatColor(h);
              const names = ['McDavid','Draisaitl','Matthews','Pastrnak','MacKinnon','Kaprizov','Hughes','Marner','Eichel','Kucherov','Stamkos','Tkachuk'];
              return (
                <div key={i} style={{
                  aspectRatio: '1', borderRadius: 8, padding: 8,
                  background: `linear-gradient(155deg, ${c}55 0%, ${NM.bg} 100%)`,
                  border: `1px solid ${h >= 70 ? c+'66' : NM.borderSoft}`,
                  boxShadow: h >= 85 ? `0 0 12px ${c}55` : 'none',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 13, fontWeight: 700, color: c }}>{h}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: NM.textBright, lineHeight: 1.05 }}>{names[i]}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

Object.assign(window, { BrandedHeaderDesktop, BrandedHeaderMobile, DesktopHome, DesktopPlayer, MobileHomeBranded });
