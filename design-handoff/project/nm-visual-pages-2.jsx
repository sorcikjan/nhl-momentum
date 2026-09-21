// Additional branded pages — Games list, Game detail, Rankings, Hot players.
// Desktop + mobile variants. Uses BrandedHeaderDesktop/Mobile + heatColor + TEAMS from earlier files.

// ───────── HELPERS ─────────
function PageTitle({ kicker, title, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 8 }}>{kicker}</div>
        <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 44, letterSpacing: -1.5, lineHeight: 1, color: NM.textBright }}>{title}</div>
        {sub && <div style={{ fontSize: 14, color: NM.text, marginTop: 8 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function TeamBadge({ code, size = 36, ringed }) {
  const t = TEAMS[code] || { c: '#333', t: '#fff' };
  return (
    <div style={{ width: size, height: size, borderRadius: size/4, background: t.c, color: t.t,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
      fontSize: size * 0.34, border: ringed ? `2px solid ${NM.heat}` : 'none', flexShrink: 0 }}>{code}</div>
  );
}

function HeatPill({ h, size = 'md' }) {
  const c = heatColor(h);
  const fs = size === 'sm' ? 11 : 13;
  return (
    <span style={{ fontFamily: NM.fontMono, fontSize: fs, fontWeight: 800, color: c,
      padding: '3px 8px', borderRadius: 4, background: `${c}1c`, border: `1px solid ${c}55` }}>{h}</span>
  );
}

// ───────── 1. GAMES LIST — DESKTOP ─────────
function DesktopGamesList() {
  const days = [
    { date: 'TUESDAY · APR 28', live: false, games: [
      { a: 'EDM', h: 'COL', t: '7:00 PM', p: 'EDM', c: 68, star: 'McDavid', sh: 94 },
      { a: 'TOR', h: 'BOS', t: '7:30 PM', p: 'BOS', c: 54, star: 'Pastrnak', sh: 88 },
      { a: 'NYR', h: 'PIT', t: '8:00 PM', p: 'NYR', c: 58, star: 'Crosby',  sh: 71 },
      { a: 'DAL', h: 'VGK', t: '9:00 PM', p: 'VGK', c: 61, star: 'Eichel',  sh: 70 },
      { a: 'FLA', h: 'NSH', t: '7:00 PM', p: 'FLA', c: 72, star: 'Reinhart',sh: 76 },
      { a: 'CGY', h: 'VAN', t: '10:00 PM',p: 'VAN', c: 55, star: 'Pettersson', sh: 64 },
    ]},
    { date: 'WEDNESDAY · APR 29', games: [
      { a: 'BUF', h: 'OTT', t: '7:00 PM', p: 'BUF', c: 52, star: 'Tkachuk B', sh: 73 },
      { a: 'WSH', h: 'CAR', t: '7:30 PM', p: 'CAR', c: 64, star: 'Aho', sh: 79 },
      { a: 'CBJ', h: 'DET', t: '7:30 PM', p: 'DET', c: 50, star: 'Raymond', sh: 67 },
      { a: 'STL', h: 'CHI', t: '8:30 PM', p: 'STL', c: 60, star: 'Thomas', sh: 68 },
    ]},
  ];

  return (
    <DCArtboard label="Desktop · Games list · 1440" width={1440} height={1180}
      style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <BrandedHeaderDesktop active="Tonight"/>
      <div style={{ padding: '32px 48px' }}>
        <PageTitle
          kicker="ALL GAMES"
          title="Schedule"
          sub="Our pick highlighted on every game. Tap any row to open the matchup."
          right={
            <div style={{ display: 'flex', gap: 8 }}>
              {['All','Today','Tomorrow','This week'].map((l, i) => (
                <span key={l} style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                  color: i === 1 ? NM.heat : NM.text, background: i === 1 ? NM.heatDim : NM.bgCard,
                  border: `1px solid ${i === 1 ? NM.heat + '66' : NM.border}` }}>{l}</span>
              ))}
            </div>
          }
        />

        {days.map((d, di) => (
          <div key={d.date} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.4 }}>{d.date}</span>
              <span style={{ flex: 1, height: 1, background: NM.borderSoft }}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>{d.games.length} games</span>
            </div>
            <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, overflow: 'hidden' }}>
              {d.games.map((g, gi) => (
                <div key={gi} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 200px 220px 160px 40px',
                  gap: 16, alignItems: 'center', padding: '18px 24px',
                  borderTop: gi ? `1px solid ${NM.borderSoft}` : 'none' }}>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 13, color: NM.textBright, fontWeight: 600 }}>{g.t}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <TeamBadge code={g.a} ringed={g.p === g.a}/>
                    <div>
                      <div style={{ fontWeight: 700, color: NM.textBright, fontSize: 15 }}>{TEAMS[g.a]?.name || g.a}</div>
                      <div style={{ fontSize: 11, color: NM.textMuted }}>away</div>
                    </div>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, margin: '0 6px' }}>at</span>
                    <TeamBadge code={g.h} ringed={g.p === g.h}/>
                    <div>
                      <div style={{ fontWeight: 700, color: NM.textBright, fontSize: 15 }}>{TEAMS[g.h]?.name || g.h}</div>
                      <div style={{ fontSize: 11, color: NM.textMuted }}>home</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1 }}>OUR PICK</span>
                      <span style={{ fontFamily: NM.fontSans, fontSize: 13, color: NM.textBright, fontWeight: 700 }}>{g.p} · {g.c}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ flex: g.c, background: NM.heat }}/>
                      <div style={{ flex: 100 - g.c, background: NM.borderSoft }}/>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: NM.textMuted, marginBottom: 4 }}>Watch for</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, color: NM.textBright, fontSize: 13 }}>{g.star}</span>
                      <HeatPill h={g.sh} size="sm"/>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: NM.textMuted }}>+12 stories</div>
                  <div style={{ color: NM.textMuted, fontSize: 18 }}>›</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DCArtboard>
  );
}

// ───────── 2. GAMES LIST — MOBILE ─────────
function MobileGamesList() {
  const games = [
    { a: 'EDM', h: 'COL', t: '7:00 PM', p: 'EDM', c: 68, star: 'McDavid', sh: 94 },
    { a: 'TOR', h: 'BOS', t: '7:30 PM', p: 'BOS', c: 54, star: 'Pastrnak', sh: 88 },
    { a: 'NYR', h: 'PIT', t: '8:00 PM', p: 'NYR', c: 58, star: 'Crosby', sh: 71 },
    { a: 'DAL', h: 'VGK', t: '9:00 PM', p: 'VGK', c: 61, star: 'Eichel', sh: 70 },
    { a: 'FLA', h: 'NSH', t: '7:00 PM', p: 'FLA', c: 72, star: 'Reinhart', sh: 76 },
    { a: 'CGY', h: 'VAN', t: '10:00 PM',p: 'VAN', c: 55, star: 'Pettersson', sh: 64 },
  ];
  return (
    <PhoneFrame label="Mobile · Games list" width={390} height={1100} statusBar={true}>
      <div style={{ background: NM.bg, color: NM.textBright, minHeight: '100%' }}>
        <BrandedHeaderMobile/>
        <div style={{ padding: '20px 16px 12px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>TUESDAY · APR 28</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 30, letterSpacing: -1, lineHeight: 1, color: NM.textBright }}>Tonight's slate</div>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '0 16px 16px', overflow: 'hidden' }}>
          {['All','Today','Tom.','Week'].map((l, i) => (
            <span key={l} style={{ padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
              color: i === 1 ? NM.heat : NM.text, background: i === 1 ? NM.heatDim : NM.bgCard,
              border: `1px solid ${i === 1 ? NM.heat + '66' : NM.border}` }}>{l}</span>
          ))}
        </div>
        <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {games.map((g, i) => (
            <div key={i} style={{ background: NM.bgCard, borderRadius: 12, border: `1px solid ${NM.border}`, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700 }}>{g.t}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1 }}>PICK · {g.p} {g.c}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <TeamBadge code={g.a} size={32} ringed={g.p === g.a}/>
                <span style={{ flex: 1, fontWeight: 700, color: NM.textBright }}>{TEAMS[g.a]?.name || g.a}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>@</span>
                <span style={{ flex: 1, fontWeight: 700, color: NM.textBright, textAlign: 'right' }}>{TEAMS[g.h]?.name || g.h}</span>
                <TeamBadge code={g.h} size={32} ringed={g.p === g.h}/>
              </div>
              <div style={{ height: 3, borderRadius: 2, overflow: 'hidden', display: 'flex', marginBottom: 10 }}>
                <div style={{ flex: g.c, background: NM.heat }}/>
                <div style={{ flex: 100 - g.c, background: NM.borderSoft }}/>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: NM.textMuted }}>Watch:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: NM.textBright }}>{g.star}</span>
                <HeatPill h={g.sh} size="sm"/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

// ───────── 3. GAME DETAIL — DESKTOP ─────────
function DesktopGameDetail() {
  const home = 'BOS', away = 'TOR';
  return (
    <DCArtboard label="Desktop · Game detail · 1440" width={1440} height={1380}
      style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <BrandedHeaderDesktop active="Tonight"/>

      {/* HERO — full-bleed split team colors */}
      <div style={{ position: 'relative', height: 360, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
          <div style={{ flex: 1, background: `linear-gradient(135deg, ${TEAMS[away].c} 0%, ${NM.bg} 100%)` }}/>
          <div style={{ flex: 1, background: `linear-gradient(225deg, ${TEAMS[home].c} 0%, ${NM.bg} 100%)` }}/>
        </div>
        <div style={{ position: 'relative', padding: '40px 48px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 8 }}>TONIGHT · 7:30 PM · TD GARDEN</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <TeamBadge code={away} size={88}/>
                <div>
                  <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 56, letterSpacing: -2, lineHeight: 1, color: NM.textBright }}>Maple Leafs</div>
                  <div style={{ fontSize: 13, color: NM.text, marginTop: 6 }}>42-18-8 · 92 pts · 3rd Atlantic</div>
                </div>
              </div>
              <div style={{ fontFamily: NM.fontDisplay, fontStyle: 'italic', fontSize: 40, color: NM.textMuted, fontWeight: 400 }}>at</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 56, letterSpacing: -2, lineHeight: 1, color: NM.textBright }}>Bruins</div>
                  <div style={{ fontSize: 13, color: NM.text, marginTop: 6 }}>44-15-9 · 97 pts · 1st Atlantic</div>
                </div>
                <TeamBadge code={home} size={88}/>
              </div>
            </div>
          </div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 26, letterSpacing: -0.6, color: NM.textBright, maxWidth: 720, lineHeight: 1.2, textWrap: 'pretty' }}>
            <span style={{ color: NM.heat }}>The story:</span> Pastrnak's playing his hottest hockey of the year. Toronto's defense has leaked goals in 4 straight.
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: '40px 48px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        {/* LEFT — prediction + factors + heads to watch */}
        <div>
          {/* Prediction card */}
          <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, padding: 28, marginBottom: 24 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>OUR PREDICTION</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 36, letterSpacing: -1, color: NM.textBright, marginBottom: 4 }}>Bruins win.</div>
            <div style={{ fontSize: 14, color: NM.text, marginBottom: 20 }}>54% confidence · model accuracy this month: 71%</div>
            {/* Bar */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.textBright, fontWeight: 700 }}>TOR 46%</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.heat, fontWeight: 700 }}>BOS 54%</span>
              </div>
              <div style={{ height: 12, borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
                <div style={{ flex: 46, background: TEAMS[away].c }}/>
                <div style={{ flex: 54, background: NM.heat }}/>
              </div>
            </div>
            {/* Factors */}
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 14 }}>WHY</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                ['BOS home record', '24-6-3', NM.rise],
                ['TOR road L5', '1-4-0', NM.red],
                ['Pastrnak heat', '88', NM.heat],
                ['Matthews heat', '76', NM.heat],
                ['BOS PP %', '24.1', NM.rise],
                ['TOR PK %', '74.8', NM.red],
              ].map(([k,v,c]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: NM.bg, borderRadius: 8, border: `1px solid ${NM.borderSoft}` }}>
                  <span style={{ fontSize: 13, color: NM.text }}>{k}</span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 13, fontWeight: 700, color: c }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Players to watch */}
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 8 }}>PLAYERS TO WATCH</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 28, letterSpacing: -0.8, color: NM.textBright, marginBottom: 18 }}>Six players. Three storylines.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { t: away, n: 'Auston Matthews', p: 'C · #34', h: 76, n2: '12G in last 10' },
              { t: home, n: 'David Pastrnak', p: 'RW · #88', h: 88, n2: 'Burning. 5 in 3.' },
              { t: away, n: 'William Nylander', p: 'C · #88', h: 71, n2: '7-game point streak' },
              { t: home, n: 'Charlie McAvoy', p: 'D · #73', h: 64, n2: '+11 this month' },
              { t: away, n: 'Mitch Marner', p: 'RW · #16', h: 58, n2: 'Cooled from 80' },
              { t: home, n: 'Jeremy Swayman', p: 'G · #1', h: 73, n2: '.928 SV% L10' },
            ].map((p, i) => (
              <div key={i} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <TeamBadge code={p.t} size={36}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: NM.textBright, fontSize: 14 }}>{p.n}</div>
                  <div style={{ fontSize: 11, color: NM.textMuted, marginTop: 2 }}>{p.p} · {p.n2}</div>
                </div>
                <HeatPill h={p.h}/>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — H2H + recent + venue */}
        <div>
          <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, padding: 22, marginBottom: 18 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 14 }}>SEASON SERIES</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 42, letterSpacing: -1, lineHeight: 1, color: NM.textBright, marginBottom: 6 }}>
              BOS 2 <span style={{ color: NM.textMuted }}>—</span> 1 TOR
            </div>
            <div style={{ fontSize: 12, color: NM.textMuted, marginBottom: 14 }}>One game remaining after tonight</div>
            {[['Nov 3', 'BOS', '4-2'], ['Jan 15', 'BOS', '3-1'], ['Feb 22', 'TOR', '5-3']].map(([d, w, s]) => (
              <div key={d} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${NM.borderSoft}`, fontSize: 12 }}>
                <span style={{ color: NM.textMuted }}>{d}</span>
                <span style={{ color: NM.textBright, fontWeight: 600 }}>{w} won</span>
                <span style={{ fontFamily: NM.fontMono, color: NM.text }}>{s}</span>
              </div>
            ))}
          </div>

          <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, padding: 22, marginBottom: 18 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 14 }}>LAST 10</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ width: 32, fontFamily: NM.fontMono, fontSize: 11, color: NM.textBright, fontWeight: 700 }}>TOR</span>
              {['W','L','W','W','L','W','L','L','W','L'].map((r, i) => (
                <span key={i} style={{ width: 18, height: 18, borderRadius: 3, background: r === 'W' ? NM.rise : NM.red,
                  fontSize: 9, color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r}</span>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 32, fontFamily: NM.fontMono, fontSize: 11, color: NM.textBright, fontWeight: 700 }}>BOS</span>
              {['W','W','L','W','W','W','W','L','W','W'].map((r, i) => (
                <span key={i} style={{ width: 18, height: 18, borderRadius: 3, background: r === 'W' ? NM.rise : NM.red,
                  fontSize: 9, color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r}</span>
              ))}
            </div>
          </div>

          <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, padding: 22 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 10 }}>VENUE · TD GARDEN</div>
            <div style={{ fontSize: 13, color: NM.text, lineHeight: 1.6 }}>
              Boston is <span style={{ color: NM.textBright, fontWeight: 700 }}>24-6-3</span> at home this year.<br/>
              They've won 7 of their last 8 in Boston.
            </div>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

// ───────── 4. GAME DETAIL — MOBILE ─────────
function MobileGameDetail() {
  const home = 'BOS', away = 'TOR';
  return (
    <PhoneFrame label="Mobile · Game detail" width={390} height={1100} statusBar={true}>
      <div style={{ background: NM.bg, color: NM.textBright, minHeight: '100%' }}>
        <BrandedHeaderMobile/>
        {/* HERO */}
        <div style={{ position: 'relative', padding: '18px 16px 22px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            <div style={{ flex: 1, background: `linear-gradient(135deg, ${TEAMS[away].c}cc 0%, ${NM.bg} 100%)` }}/>
            <div style={{ flex: 1, background: `linear-gradient(225deg, ${TEAMS[home].c}cc 0%, ${NM.bg} 100%)` }}/>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 10 }}>TONIGHT · 7:30 PM · TD GARDEN</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <TeamBadge code={away} size={56}/>
                <div style={{ fontWeight: 800, fontSize: 18, color: NM.textBright }}>Leafs</div>
                <div style={{ fontSize: 10, color: NM.textMuted }}>92 pts</div>
              </div>
              <div style={{ fontFamily: NM.fontDisplay, fontStyle: 'italic', fontSize: 22, color: NM.textMuted }}>at</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <TeamBadge code={home} size={56}/>
                <div style={{ fontWeight: 800, fontSize: 18, color: NM.textBright }}>Bruins</div>
                <div style={{ fontSize: 10, color: NM.textMuted }}>97 pts</div>
              </div>
            </div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 16, color: NM.textBright, lineHeight: 1.3, textWrap: 'pretty' }}>
              <span style={{ color: NM.heat }}>The story:</span> Pastrnak is on fire. TOR D is leaking.
            </div>
          </div>
        </div>

        {/* Prediction */}
        <div style={{ padding: '0 16px 18px' }}>
          <div style={{ background: NM.bgCard, borderRadius: 12, border: `1px solid ${NM.border}`, padding: 16 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 6 }}>OUR PICK</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 26, letterSpacing: -0.8, color: NM.textBright, marginBottom: 4 }}>Bruins win · 54%</div>
            <div style={{ fontSize: 11, color: NM.text, marginBottom: 12 }}>Model accuracy this month: 71%</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: NM.fontMono, fontSize: 11, color: NM.textBright, fontWeight: 700, marginBottom: 6 }}>
              <span>TOR 46%</span><span style={{ color: NM.heat }}>BOS 54%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
              <div style={{ flex: 46, background: TEAMS[away].c }}/>
              <div style={{ flex: 54, background: NM.heat }}/>
            </div>
          </div>
        </div>

        {/* Watch */}
        <div style={{ padding: '4px 16px 24px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>WATCH</div>
          {[
            { t: home, n: 'David Pastrnak', sub: 'Burning. 5 in 3.', h: 88 },
            { t: away, n: 'Auston Matthews', sub: '12G in L10', h: 76 },
            { t: home, n: 'Jeremy Swayman', sub: '.928 SV% L10', h: 73 },
          ].map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10, marginBottom: 8 }}>
              <TeamBadge code={p.t} size={30}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: NM.textBright }}>{p.n}</div>
                <div style={{ fontSize: 10, color: NM.textMuted }}>{p.sub}</div>
              </div>
              <HeatPill h={p.h} size="sm"/>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

// ───────── 5. RANKINGS — DESKTOP ─────────
function DesktopRankings() {
  const rows = [
    { r: 1, n: 'Connor McDavid',  t: 'EDM', p: 'C', g: 48, a: 67, pts: 115, h: 94, d: '+12', spark: [60,65,72,78,82,88,94] },
    { r: 2, n: 'Leon Draisaitl',  t: 'EDM', p: 'C', g: 42, a: 60, pts: 102, h: 91, d: '+8',  spark: [55,62,70,76,82,86,91] },
    { r: 3, n: 'Auston Matthews', t: 'TOR', p: 'C', g: 51, a: 38, pts: 89,  h: 88, d: '+4',  spark: [70,72,76,80,82,85,88] },
    { r: 4, n: 'David Pastrnak',  t: 'BOS', p: 'RW',g: 44, a: 50, pts: 94,  h: 88, d: '+10', spark: [55,60,68,74,80,84,88] },
    { r: 5, n: 'Nathan MacKinnon', t: 'COL', p: 'C', g: 39, a: 62, pts: 101, h: 85, d: '+2',  spark: [78,80,82,82,84,84,85] },
    { r: 6, n: 'Kirill Kaprizov', t: 'MIN', p: 'LW',g: 40, a: 48, pts: 88,  h: 82, d: '+6',  spark: [62,66,72,76,78,80,82] },
    { r: 7, n: 'Quinn Hughes',    t: 'VAN', p: 'D', g: 12, a: 70, pts: 82,  h: 79, d: '+5',  spark: [66,70,72,74,76,78,79] },
    { r: 8, n: 'Mitch Marner',    t: 'TOR', p: 'RW',g: 28, a: 60, pts: 88,  h: 76, d: '-2',  spark: [80,80,78,78,76,76,76] },
    { r: 9, n: 'Jack Eichel',     t: 'VGK', p: 'C', g: 30, a: 50, pts: 80,  h: 73, d: '+1',  spark: [68,70,72,72,72,72,73] },
    { r:10, n: 'Nikita Kucherov', t: 'TBL', p: 'RW',g: 36, a: 54, pts: 90,  h: 70, d: '-4',  spark: [78,76,74,72,72,70,70] },
  ];
  const Sparkline = ({ data, color }) => {
    const W = 90, H = 28, max = 100;
    const pts = data.map((v, i) => `${(i/(data.length-1))*W},${H - (v/max)*H}`).join(' ');
    return (
      <svg width={W} height={H}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={W} cy={H - (data[data.length-1]/max)*H} r="2.5" fill={color}/>
      </svg>
    );
  };
  return (
    <DCArtboard label="Desktop · Rankings · 1440" width={1440} height={1100}
      style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <BrandedHeaderDesktop active="Rankings"/>
      <div style={{ padding: '32px 48px' }}>
        <PageTitle kicker="ALL SKATERS · 312" title="Rankings"
          sub="Sorted by Heat. The current state of every player in one place."
          right={
            <div style={{ display: 'flex', gap: 8 }}>
              {['Heat','Points','Goals','Assists'].map((l, i) => (
                <span key={l} style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                  color: i === 0 ? NM.heat : NM.text, background: i === 0 ? NM.heatDim : NM.bgCard,
                  border: `1px solid ${i === 0 ? NM.heat + '66' : NM.border}` }}>{l}</span>
              ))}
            </div>
          }
        />

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['ALL','C','L','R','D','G'].map((l, i) => (
            <span key={l} style={{ padding: '6px 14px', borderRadius: 4, fontFamily: NM.fontMono, fontSize: 11, fontWeight: 700,
              color: i === 0 ? NM.heat : NM.text, background: i === 0 ? NM.heatDim : NM.bgCard,
              border: `1px solid ${i === 0 ? NM.heat + '66' : NM.border}` }}>{l}</span>
          ))}
          <span style={{ flex: 1 }}/>
          <input placeholder="Search players or teams" style={{
            padding: '6px 14px', background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 4,
            color: NM.text, fontSize: 12, fontFamily: NM.fontSans, width: 240 }}/>
        </div>

        {/* Table */}
        <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, overflow: 'hidden' }}>
          <div style={{ display: 'grid',
            gridTemplateColumns: '60px 1fr 80px 60px 60px 60px 60px 120px 110px 80px',
            gap: 12, padding: '14px 24px',
            fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1,
            borderBottom: `1px solid ${NM.borderSoft}` }}>
            <span>RANK</span><span>PLAYER</span><span>TEAM · POS</span>
            <span style={{ textAlign: 'right' }}>G</span>
            <span style={{ textAlign: 'right' }}>A</span>
            <span style={{ textAlign: 'right' }}>PTS</span>
            <span style={{ textAlign: 'right' }}>HEAT</span>
            <span>TREND (6W)</span>
            <span style={{ textAlign: 'right' }}>Δ AVG</span>
            <span/>
          </div>
          {rows.map(r => {
            const c = heatColor(r.h);
            const up = r.d.startsWith('+');
            return (
              <div key={r.r} style={{ display: 'grid',
                gridTemplateColumns: '60px 1fr 80px 60px 60px 60px 60px 120px 110px 80px',
                gap: 12, padding: '14px 24px', alignItems: 'center', borderTop: `1px solid ${NM.borderSoft}`,
                borderLeft: `3px solid ${c}`, marginLeft: -3 }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 14, color: NM.textBright, fontWeight: 700 }}>{r.r}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 14, background: NM.bgRaised, border: `1px solid ${NM.border}` }}/>
                  <span style={{ fontWeight: 700, color: NM.textBright, fontSize: 14 }}>{r.n}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TeamBadge code={r.t} size={22}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>{r.p}</span>
                </div>
                <span style={{ fontFamily: NM.fontMono, fontSize: 13, color: NM.text, textAlign: 'right' }}>{r.g}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 13, color: NM.text, textAlign: 'right' }}>{r.a}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 13, color: NM.textBright, fontWeight: 700, textAlign: 'right' }}>{r.pts}</span>
                <div style={{ textAlign: 'right' }}><HeatPill h={r.h}/></div>
                <Sparkline data={r.spark} color={c}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 12, fontWeight: 700, color: up ? NM.rise : NM.red, textAlign: 'right' }}>{r.d}</span>
                <span style={{ color: NM.textMuted, fontSize: 18, textAlign: 'right' }}>›</span>
              </div>
            );
          })}
        </div>
      </div>
    </DCArtboard>
  );
}

// ───────── 6. RANKINGS — MOBILE ─────────
function MobileRankings() {
  const rows = [
    { r: 1, n: 'McDavid',  t: 'EDM', pts: 115, h: 94, d: '+12' },
    { r: 2, n: 'Draisaitl',t: 'EDM', pts: 102, h: 91, d: '+8' },
    { r: 3, n: 'Matthews', t: 'TOR', pts: 89,  h: 88, d: '+4' },
    { r: 4, n: 'Pastrnak', t: 'BOS', pts: 94,  h: 88, d: '+10' },
    { r: 5, n: 'MacKinnon',t: 'COL', pts: 101, h: 85, d: '+2' },
    { r: 6, n: 'Kaprizov', t: 'MIN', pts: 88,  h: 82, d: '+6' },
    { r: 7, n: 'Hughes',   t: 'VAN', pts: 82,  h: 79, d: '+5' },
    { r: 8, n: 'Marner',   t: 'TOR', pts: 88,  h: 76, d: '-2' },
  ];
  return (
    <PhoneFrame label="Mobile · Rankings" width={390} height={820} statusBar={true}>
      <div style={{ background: NM.bg, color: NM.textBright, minHeight: '100%' }}>
        <BrandedHeaderMobile/>
        <div style={{ padding: '20px 16px 14px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>312 SKATERS · BY HEAT</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 30, letterSpacing: -1, lineHeight: 1, color: NM.textBright }}>Rankings</div>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px', overflow: 'hidden' }}>
          {['ALL','C','L','R','D','G'].map((l, i) => (
            <span key={l} style={{ padding: '5px 10px', borderRadius: 4, fontFamily: NM.fontMono, fontSize: 10, fontWeight: 700,
              color: i === 0 ? NM.heat : NM.text, background: i === 0 ? NM.heatDim : NM.bgCard,
              border: `1px solid ${i === 0 ? NM.heat + '66' : NM.border}` }}>{l}</span>
          ))}
        </div>
        <div style={{ padding: '0 16px 24px' }}>
          {rows.map(r => {
            const c = heatColor(r.h);
            const up = r.d.startsWith('+');
            return (
              <div key={r.r} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 12px',
                background: NM.bgCard, borderRadius: 10, borderLeft: `3px solid ${c}`,
                border: `1px solid ${NM.borderSoft}`, marginBottom: 6 }}>
                <span style={{ width: 22, fontFamily: NM.fontMono, fontSize: 13, color: NM.textBright, fontWeight: 700 }}>{r.r}</span>
                <TeamBadge code={r.t} size={26}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: NM.textBright }}>{r.n}</div>
                  <div style={{ fontSize: 10, color: NM.textMuted, fontFamily: NM.fontMono }}>{r.pts} pts · {r.d}
                    <span style={{ color: up ? NM.rise : NM.red, marginLeft: 4 }}>{up ? '↑' : '↓'}</span>
                  </div>
                </div>
                <HeatPill h={r.h} size="sm"/>
              </div>
            );
          })}
        </div>
      </div>
    </PhoneFrame>
  );
}

// ───────── 7. HOT PLAYERS — DESKTOP ─────────
function DesktopHotPlayers() {
  const top = { n: 'Connor McDavid', t: 'EDM', p: 'C · #97', h: 94, pts: 115, story: '12 points in his last 5 games. The model has him at his hottest since November.' };
  const rest = [
    { n: 'Leon Draisaitl', t: 'EDM', h: 91, sub: '8G in L7' },
    { n: 'Auston Matthews', t: 'TOR', h: 88, sub: '12G in L10' },
    { n: 'David Pastrnak', t: 'BOS', h: 88, sub: '5G in L3' },
    { n: 'Nathan MacKinnon', t: 'COL', h: 85, sub: '4-game point streak' },
    { n: 'Kirill Kaprizov', t: 'MIN', h: 82, sub: 'Heat +6 vs avg' },
    { n: 'Quinn Hughes', t: 'VAN', h: 79, sub: 'D leading pts' },
    { n: 'Jack Hughes', t: 'NJD', h: 78, sub: 'Back from injury hot' },
    { n: 'Mitch Marner', t: 'TOR', h: 76, sub: 'Cooling but still hot' },
  ];
  const breakouts = [
    { n: 'Lucas Raymond', t: 'DET', h: 67, sub: 'From 42 to 67 in 2 weeks' },
    { n: 'Wyatt Johnston', t: 'DAL', h: 64, sub: 'Sophomore surge' },
    { n: 'Connor Bedard', t: 'CHI', h: 62, sub: 'Heating up post-AS' },
    { n: 'Logan Cooley', t: 'UTA', h: 58, sub: 'Career-high stretch' },
  ];

  return (
    <DCArtboard label="Desktop · Hot players · 1440" width={1440} height={1300}
      style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <BrandedHeaderDesktop active="Heat map"/>
      <div style={{ padding: '32px 48px' }}>
        <PageTitle kicker="HEAT MAP · LIVE" title={<><span style={{ color: NM.heat }}>Burning</span> right now.</>}
          sub="Players above their season pace. Updated every hour."/>

        {/* HERO — #1 + grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 36 }}>
          {/* #1 hero */}
          <div style={{ background: `linear-gradient(155deg, ${TEAMS[top.t].c}88 0%, ${NM.bgCard} 50%)`,
            borderRadius: 16, border: `1px solid ${NM.heat}55`, padding: 32, position: 'relative', overflow: 'hidden',
            boxShadow: `0 0 40px ${NM.heat}22` }}>
            <div style={{ position: 'absolute', top: 24, right: 24, fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, padding: '4px 10px', background: NM.bg, borderRadius: 999, border: `1px solid ${NM.heat}66` }}>#1 · HOTTEST RIGHT NOW</div>
            <TeamBadge code={top.t} size={42}/>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 56, letterSpacing: -2, lineHeight: 1, color: NM.textBright, marginTop: 18, marginBottom: 8, textWrap: 'pretty' }}>
              {top.n.split(' ')[0]} <span style={{ color: NM.heat }}>{top.n.split(' ').slice(1).join(' ')}</span>
            </div>
            <div style={{ fontSize: 13, color: NM.text, marginBottom: 24 }}>{top.p} · {top.pts} pts</div>
            {/* Big heat dial */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18 }}>
              <div style={{ width: 110, height: 110, borderRadius: 55, background: `conic-gradient(${NM.heat} ${top.h}%, ${NM.bgRaised} 0)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 8, borderRadius: 55, background: NM.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 32, fontWeight: 800, color: NM.heat, lineHeight: 1 }}>{top.h}</span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 1 }}>HEAT</span>
                </div>
              </div>
              <div style={{ flex: 1, fontSize: 14, color: NM.text, lineHeight: 1.55, textWrap: 'pretty' }}>{top.story}</div>
            </div>
          </div>

          {/* 2-8 stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>RANKED 2–9</div>
            {rest.map((p, i) => {
              const c = heatColor(p.h);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                  background: NM.bgCard, borderRadius: 10, borderLeft: `3px solid ${c}`, border: `1px solid ${NM.borderSoft}` }}>
                  <span style={{ width: 18, fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, fontWeight: 700 }}>{i + 2}</span>
                  <TeamBadge code={p.t} size={26}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: NM.textBright }}>{p.n}</div>
                    <div style={{ fontSize: 11, color: NM.textMuted }}>{p.sub}</div>
                  </div>
                  <HeatPill h={p.h}/>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakout watch */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.rise, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>BREAKOUT WATCH</div>
              <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 28, letterSpacing: -0.8, color: NM.textBright }}>Heating up fast.</div>
            </div>
            <span style={{ fontSize: 12, color: NM.textMuted }}>Biggest Heat gains last 14 days</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {breakouts.map((b, i) => {
              const c = heatColor(b.h);
              return (
                <div key={i} style={{ background: NM.bgCard, borderRadius: 12, border: `1px solid ${NM.borderSoft}`, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <TeamBadge code={b.t} size={28}/>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 700, letterSpacing: 1, marginLeft: 'auto' }}>↑ RISING</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: NM.textBright, marginBottom: 4 }}>{b.n}</div>
                  <div style={{ fontSize: 11, color: NM.textMuted, marginBottom: 14 }}>{b.sub}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 28, fontWeight: 800, color: c, lineHeight: 1 }}>{b.h}</span>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1 }}>HEAT</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cooling — counterpoint section */}
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.cold, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>COOLING OFF</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 24, letterSpacing: -0.6, color: NM.textBright, marginBottom: 12 }}>Hot last month, fading now.</div>
          <div style={{ background: NM.bgCard, borderRadius: 12, border: `1px solid ${NM.borderSoft}`, padding: '4px 18px' }}>
            {[
              { n: 'Nikita Kucherov', t: 'TBL', h: 70, prev: 88, sub: 'Down 18 in 2 weeks' },
              { n: 'Sidney Crosby', t: 'PIT', h: 64, prev: 79, sub: 'Quiet stretch' },
              { n: 'Brad Marchand', t: 'BOS', h: 52, prev: 71, sub: 'Below season pace' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <TeamBadge code={p.t} size={32}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: NM.textBright }}>{p.n}</div>
                  <div style={{ fontSize: 11, color: NM.textMuted }}>{p.sub}</div>
                </div>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, textDecoration: 'line-through' }}>{p.prev}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>→</span>
                <HeatPill h={p.h}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

// ───────── 8. HOT PLAYERS — MOBILE ─────────
function MobileHotPlayers() {
  const players = [
    { r: 1, n: 'McDavid', t: 'EDM', h: 94, sub: '12 pts L5' },
    { r: 2, n: 'Draisaitl', t: 'EDM', h: 91, sub: '8G in L7' },
    { r: 3, n: 'Matthews', t: 'TOR', h: 88, sub: '12G in L10' },
    { r: 4, n: 'Pastrnak', t: 'BOS', h: 88, sub: '5G in L3' },
    { r: 5, n: 'MacKinnon', t: 'COL', h: 85, sub: '4-game streak' },
    { r: 6, n: 'Kaprizov', t: 'MIN', h: 82, sub: 'Heat +6' },
  ];
  return (
    <PhoneFrame label="Mobile · Hot players" width={390} height={1000} statusBar={true}>
      <div style={{ background: NM.bg, color: NM.textBright, minHeight: '100%' }}>
        <BrandedHeaderMobile/>
        <div style={{ padding: '20px 16px 14px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>HEAT MAP · LIVE</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 30, letterSpacing: -1, lineHeight: 1, color: NM.textBright }}>
            <span style={{ color: NM.heat }}>Burning</span> right now
          </div>
        </div>

        {/* #1 hero card */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ background: `linear-gradient(155deg, ${TEAMS.EDM.c}88 0%, ${NM.bgCard} 60%)`,
            borderRadius: 14, border: `1px solid ${NM.heat}66`, padding: 18, boxShadow: `0 0 20px ${NM.heat}22` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, padding: '3px 8px', background: NM.bg, borderRadius: 999, border: `1px solid ${NM.heat}66` }}>#1 HOTTEST</span>
              <TeamBadge code="EDM" size={24}/>
            </div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 30, letterSpacing: -1, lineHeight: 1, color: NM.textBright, marginBottom: 4 }}>
              Connor <span style={{ color: NM.heat }}>McDavid</span>
            </div>
            <div style={{ fontSize: 11, color: NM.textMuted, marginBottom: 14 }}>C · #97 · 115 pts</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 70, height: 70, borderRadius: 35, background: `conic-gradient(${NM.heat} 94%, ${NM.bgRaised} 0)`, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 6, borderRadius: 35, background: NM.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 22, fontWeight: 800, color: NM.heat }}>94</span>
                </div>
              </div>
              <div style={{ flex: 1, fontSize: 12, color: NM.text, lineHeight: 1.5 }}>12 points in his last 5. Hottest since November.</div>
            </div>
          </div>
        </div>

        {/* List */}
        <div style={{ padding: '0 16px 24px' }}>
          {players.slice(1).map(p => {
            const c = heatColor(p.h);
            return (
              <div key={p.r} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px',
                background: NM.bgCard, borderRadius: 10, borderLeft: `3px solid ${c}`, border: `1px solid ${NM.borderSoft}`, marginBottom: 6 }}>
                <span style={{ width: 18, fontFamily: NM.fontMono, fontSize: 12, color: NM.textMuted, fontWeight: 700 }}>{p.r}</span>
                <TeamBadge code={p.t} size={26}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: NM.textBright }}>{p.n}</div>
                  <div style={{ fontSize: 10, color: NM.textMuted }}>{p.sub}</div>
                </div>
                <HeatPill h={p.h} size="sm"/>
              </div>
            );
          })}
        </div>
      </div>
    </PhoneFrame>
  );
}

Object.assign(window, {
  DesktopGamesList, MobileGamesList,
  DesktopGameDetail, MobileGameDetail,
  DesktopRankings, MobileRankings,
  DesktopHotPlayers, MobileHotPlayers,
});
