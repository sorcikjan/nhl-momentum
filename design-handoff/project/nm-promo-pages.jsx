// Marketing landing page — desktop hero
// "Hockey, in real time." — single screen, mobile-first decisions translated to wide.

function LandingPage() {
  return (
    <DCArtboard label="momentum.com — landing page (desktop hero)" width={1440}
      style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <HeatGradientBg intensity={1.2}>
        <div style={{ minHeight: 900, display: 'flex', flexDirection: 'column', position: 'relative', color: NM.textBright }}>
          {/* Nav */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '24px 56px',
          }}>
            <MomentumWordmark size={26}/>
            <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
              {['Tonight','Heat map','Players','Stories','How it works'].map(l => (
                <span key={l} style={{ fontSize: 13, color: NM.text, fontWeight: 500 }}>{l}</span>
              ))}
              <button style={{
                padding: '8px 16px', borderRadius: 999, border: 0, cursor: 'pointer',
                background: NM.textBright, color: NM.bg, fontSize: 13, fontWeight: 700,
                fontFamily: NM.fontSans,
              }}>Open the app</button>
            </div>
          </div>

          {/* Hero grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 48,
            padding: '60px 56px 0', alignItems: 'center',
          }}>
            {/* Left: headline */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: NM.heatDim, border: `1px solid ${NM.heat}55`, marginBottom: 24 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: NM.heat, boxShadow: `0 0 8px ${NM.heat}` }}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1 }}>
                  LIVE · 4 GAMES TONIGHT
                </span>
              </div>

              <h1 style={{
                margin: 0, fontFamily: NM.fontSans, fontWeight: 800,
                fontSize: 88, lineHeight: 0.95, letterSpacing: -3,
                color: NM.textBright,
              }}>
                Hockey,<br/>
                <span style={{ color: NM.heat }}>in real time</span><span style={{ color: NM.heat }}>.</span>
              </h1>

              <p style={{
                margin: '24px 0 32px', fontSize: 18, lineHeight: 1.5,
                color: NM.text, maxWidth: 480, textWrap: 'pretty',
              }}>
                Every player gets a Heat score from 0 to 100, updated after every shift. See who's burning, who's cooling, and which games tonight are worth your remote.
              </p>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button style={{
                  padding: '14px 22px', borderRadius: 999, border: 0, cursor: 'pointer',
                  background: NM.heat, color: '#fff', fontSize: 14, fontWeight: 700,
                  fontFamily: NM.fontSans, letterSpacing: -0.1,
                  boxShadow: `0 8px 24px ${NM.heat}55`,
                }}>Open the app →</button>
                <button style={{
                  padding: '14px 22px', borderRadius: 999, cursor: 'pointer',
                  background: 'transparent', border: `1px solid ${NM.border}`,
                  color: NM.textBright, fontSize: 14, fontWeight: 600,
                  fontFamily: NM.fontSans,
                }}>How Heat works</button>
              </div>

              {/* Social proof */}
              <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: NM.textMuted }}>
                <div style={{ display: 'flex' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      width: 28, height: 28, borderRadius: 14, marginLeft: i > 1 ? -8 : 0,
                      background: ['#ff5a24','#3a88ff','#00e5a0','#e5508b'][i-1],
                      border: `2px solid ${NM.bg}`,
                    }}/>
                  ))}
                </div>
                <div>
                  <div style={{ color: NM.textBright, fontWeight: 600 }}>12,400+ fans tracking their team</div>
                  <div style={{ marginTop: 2 }}>Featured in The Athletic, Sportsnet, /r/hockey</div>
                </div>
              </div>
            </div>

            {/* Right: live preview card */}
            <div style={{ position: 'relative' }}>
              <div style={{
                background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 20,
                padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.4 }}>
                    BURNING RIGHT NOW
                  </span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 700 }}>● LIVE</span>
                </div>

                {/* Mini heat grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
                  {[94,91,88,82,79,75,72,68,64,61,58,54,50,46,42,38,34,29,24,19].map((h, i) => {
                    const c = heatColor(h);
                    return (
                      <div key={i} style={{
                        aspectRatio: '1', borderRadius: 6,
                        background: `linear-gradient(155deg, ${c}${Math.round(h*2).toString(16).padStart(2,'0').slice(0,2)} 0%, ${NM.bg} 100%)`,
                        border: `1px solid ${h >= 70 ? c+'66' : NM.borderSoft}`,
                        boxShadow: h >= 85 ? `0 0 14px ${c}77` : 'none',
                        padding: 6, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      }}>
                        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: c, fontWeight: 700 }}>{h}</span>
                        <div style={{ height: 2, borderRadius: 1, background: c, opacity: h/100 }}/>
                      </div>
                    );
                  })}
                </div>

                {/* Featured player highlight */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: NM.bg, border: `1px solid ${NM.heat}33` }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 22,
                    background: `linear-gradient(135deg, ${NM.heat}, #ff8a47)`,
                    border: `2px solid ${NM.heat}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 18, color: '#fff',
                  }}>M</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: NM.textBright }}>Connor McDavid</div>
                    <div style={{ fontSize: 11, color: NM.textMuted, fontFamily: NM.fontMono, marginTop: 2 }}>EDM · #97 · 5G 4A in last 5</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: NM.fontMono, fontSize: 22, fontWeight: 700, color: NM.heat, lineHeight: 1 }}>94</div>
                    <div style={{ fontSize: 9, color: NM.rise, fontFamily: NM.fontMono, fontWeight: 700, marginTop: 3 }}>↑ +6 today</div>
                  </div>
                </div>
              </div>

              {/* Floating label */}
              <div style={{
                position: 'absolute', top: -12, right: -12, padding: '6px 12px',
                background: NM.bg, border: `1px solid ${NM.heat}55`, borderRadius: 999,
                fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1,
              }}>updated 12s ago</div>
            </div>
          </div>

          {/* Bottom: trust bar */}
          <div style={{
            marginTop: 'auto', marginLeft: 56, marginRight: 56, marginBottom: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 0', borderTop: `1px solid ${NM.borderSoft}`,
          }}>
            <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
              Powered by
            </span>
            <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
              {['NHL Stats API','MoneyPuck','Natural Stat Trick','Evolving Hockey'].map(s => (
                <span key={s} style={{ fontSize: 13, color: NM.text, fontWeight: 500 }}>{s}</span>
              ))}
            </div>
            <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>v1.4 · 2025–26 season</span>
          </div>
        </div>
      </HeatGradientBg>
    </DCArtboard>
  );
}

// ─── Shareable: Game recap card (social — Twitter/Reddit) ───
function GameRecapCard() {
  return (
    <DCArtboard label="Shareable · Game recap card" width={600} height={600}
      style={{ background: NM.bg, padding: 32, borderRadius: 6 }}>
      <div style={{
        width: 536, aspectRatio: '1',
        background: `radial-gradient(circle at 80% 0%, rgba(255,90,36,0.25) 0%, transparent 50%), ${NM.bgCard}`,
        borderRadius: 16, padding: 28, position: 'relative', overflow: 'hidden',
        border: `1px solid ${NM.border}`,
      }}>
        {/* Watermark */}
        <div style={{ position: 'absolute', top: 22, right: 22, opacity: 0.9 }}>
          <MomentumWordmark size={16}/>
        </div>

        {/* Date */}
        <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, letterSpacing: 1.4, fontWeight: 700 }}>
          APR 27 · FINAL
        </div>

        {/* Score */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: TEAMS.COL.c, color: TEAMS.COL.t, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, fontFamily: NM.fontSans }}>COL</div>
            <span style={{ flex: 1, fontSize: 22, fontWeight: 600, color: NM.text }}>Avalanche</span>
            <span style={{ fontFamily: NM.fontMono, fontSize: 56, fontWeight: 700, color: NM.text, letterSpacing: -3, lineHeight: 1 }}>3</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: TEAMS.EDM.c, color: TEAMS.EDM.t, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, fontFamily: NM.fontSans, border: `2px solid ${NM.heat}` }}>EDM</div>
            <span style={{ flex: 1, fontSize: 22, fontWeight: 700, color: NM.textBright }}>Oilers</span>
            <span style={{ fontFamily: NM.fontMono, fontSize: 56, fontWeight: 700, color: NM.heat, letterSpacing: -3, lineHeight: 1 }}>5</span>
          </div>
        </div>

        {/* Story */}
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${NM.borderSoft}` }}>
          <div style={{
            fontFamily: NM.fontSans, fontWeight: 700, fontSize: 22, letterSpacing: -0.5,
            lineHeight: 1.2, color: NM.textBright, textWrap: 'pretty',
          }}>
            McDavid's hat trick pushes Edmonton into first in the Pacific.
          </div>
        </div>

        {/* Stat line */}
        <div style={{ position: 'absolute', left: 28, right: 28, bottom: 70, display: 'flex', gap: 16 }}>
          {[
            ['3G 0A',  'Hat trick'],
            ['22:14',  'TOI'],
            ['+3',     'Plus-minus'],
          ].map(([v, l]) => (
            <div key={l} style={{ flex: 1, padding: '12px 14px', borderRadius: 8, background: NM.bg, border: `1px solid ${NM.borderSoft}` }}>
              <div style={{ fontFamily: NM.fontMono, fontSize: 18, fontWeight: 700, color: NM.textBright }}>{v}</div>
              <div style={{ fontSize: 10, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Heat badge */}
        <div style={{ position: 'absolute', right: 28, bottom: 28 }}>
          <div style={{
            padding: '8px 14px', borderRadius: 999,
            background: NM.heat, color: '#fff',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: `0 0 24px ${NM.heat}77`,
          }}>
            <span style={{ fontFamily: NM.fontMono, fontSize: 10, fontWeight: 700, letterSpacing: 1.2 }}>HEAT</span>
            <span style={{ fontFamily: NM.fontMono, fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>94</span>
            <span style={{ fontFamily: NM.fontMono, fontSize: 10, fontWeight: 700, opacity: 0.85 }}>↑6</span>
          </div>
        </div>
        {/* CTA */}
        <div style={{ position: 'absolute', left: 28, bottom: 32, fontSize: 11, color: NM.textMuted, fontFamily: NM.fontMono }}>
          momentum.app/edm-col
        </div>
      </div>
    </DCArtboard>
  );
}

// ─── Shareable: Player heat card (Reddit/Twitter "look at this guy") ───
function PlayerHeatCard() {
  return (
    <DCArtboard label="Shareable · Player heat card" width={600} height={600}
      style={{ background: NM.bg, padding: 32, borderRadius: 6 }}>
      <div style={{
        width: 536, aspectRatio: '1',
        background: NM.bg, borderRadius: 16, position: 'relative', overflow: 'hidden',
        border: `1px solid ${NM.border}`,
      }}>
        {/* Photo / color slab */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${TEAMS.EDM.c} 0%, #0a0b0f 70%)`,
        }}/>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 80% 30%, rgba(255,90,36,0.45) 0%, transparent 55%)`,
        }}/>

        {/* Big jersey number ghost */}
        <div style={{
          position: 'absolute', top: -40, right: -20,
          fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 380,
          color: 'rgba(255,255,255,0.06)', letterSpacing: -20, lineHeight: 0.8,
        }}>97</div>

        {/* Wordmark */}
        <div style={{ position: 'absolute', top: 22, left: 22, opacity: 0.9 }}>
          <MomentumWordmark size={16}/>
        </div>
        <div style={{ position: 'absolute', top: 24, right: 24, fontFamily: NM.fontMono, fontSize: 10, color: '#fff', opacity: 0.6, letterSpacing: 1.4, fontWeight: 700 }}>
          ON FIRE · APR 27
        </div>

        {/* Bottom name + heat */}
        <div style={{ position: 'absolute', left: 28, right: 28, bottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: 4, background: TEAMS.EDM.c, color: TEAMS.EDM.t, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10 }}>EDM</div>
            <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4, fontWeight: 600 }}>
              EDMONTON OILERS · #97 · C
            </span>
          </div>

          <div style={{
            fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 76,
            letterSpacing: -2.4, lineHeight: 0.92, color: '#fff',
            textShadow: '0 4px 24px rgba(0,0,0,0.6)',
          }}>
            Connor<br/>
            <span style={{ color: NM.heat }}>McDavid.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginTop: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: NM.fontMono, letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>HEAT · L5</div>
              <div style={{ fontFamily: NM.fontMono, fontSize: 76, fontWeight: 700, color: NM.heat, letterSpacing: -3, lineHeight: 0.9 }}>94</div>
            </div>
            <div style={{ flex: 1, paddingBottom: 8, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, textWrap: 'pretty' }}>
              5 goals, 4 assists in his last 5 games. Career-best April pace.
              <div style={{ fontSize: 10, color: NM.heat, fontFamily: NM.fontMono, fontWeight: 700, marginTop: 6 }}>
                momentum.app/mcdavid
              </div>
            </div>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

// ─── App splash ───
function AppSplash() {
  return (
    <PhoneFrame label="App splash" width={390} height={844} statusBar={false}>
      <div style={{ height: '100%', background: NM.bg, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 60%, ${NM.heat}33 0%, transparent 55%)` }}/>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <HeatPulseMark size={120} glow={true}/>
          <MomentumWordmark size={36} mark={false}/>
          <div style={{ fontSize: 14, color: NM.text, fontFamily: NM.fontSans, marginTop: -4 }}>
            Hockey, in real time.
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, letterSpacing: 1, fontWeight: 600 }}>
          Loading tonight's slate…
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── Onboarding (3 cards) ───
function Onboarding({ step = 1 }) {
  const cards = [
    { kicker: 'STEP 1 · WHAT IS HEAT?',
      head: 'Every player has a number. From 0 to 100.',
      body: 'Heat measures form. Last 5 games, scored against their season pace and strength of schedule. 100 = on fire. 50 = average. 0 = ice cold.',
      visual: <HeatScale/>,
    },
    { kicker: 'STEP 2 · YOUR TEAM',
      head: 'Pick your team. We surface the rest.',
      body: "We'll show you who's burning, who's slumping, and which games tonight are worth tuning in for. Change anytime.",
      visual: <TeamPicker/>,
    },
    { kicker: 'STEP 3 · YOU\'RE IN',
      head: 'Read the ice. Every shift.',
      body: 'Push for game starts. Daily Heat report at 9am. No spam — promise.',
      visual: <SwitchRow/>,
    },
  ];
  const c = cards[step - 1];

  return (
    <PhoneFrame label={`Onboarding · ${step}/3`} width={390} height={844}>
      <div style={{ height: '100%', background: NM.bg, color: NM.textBright, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <MomentumWordmark size={20} mark={false}/>
          <span style={{ fontSize: 12, color: NM.textMuted, fontFamily: NM.fontMono }}>Skip</span>
        </div>

        {/* Visual */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          {c.visual}
        </div>

        {/* Copy */}
        <div style={{ padding: '0 24px 20px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 8 }}>
            {c.kicker}
          </div>
          <div style={{
            fontFamily: NM.fontSans, fontWeight: 800, fontSize: 28, lineHeight: 1.05, letterSpacing: -0.8,
            color: NM.textBright, marginBottom: 12, textWrap: 'pretty',
          }}>
            {c.head}
          </div>
          <div style={{ fontSize: 14, color: NM.text, lineHeight: 1.5, textWrap: 'pretty' }}>
            {c.body}
          </div>
        </div>

        {/* Dots + CTA */}
        <div style={{ padding: '0 24px 36px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1,2,3].map(s => (
              <div key={s} style={{
                width: s === step ? 20 : 6, height: 6, borderRadius: 3,
                background: s === step ? NM.heat : NM.borderSoft,
                transition: 'all 0.2s',
              }}/>
            ))}
          </div>
          <div style={{ flex: 1 }}/>
          <button style={{
            padding: '14px 24px', borderRadius: 999, border: 0, cursor: 'pointer',
            background: NM.heat, color: '#fff',
            fontSize: 14, fontWeight: 700, fontFamily: NM.fontSans, letterSpacing: -0.1,
            boxShadow: `0 6px 20px ${NM.heat}55`,
          }}>{step === 3 ? 'Open the app' : 'Continue'} →</button>
        </div>
      </div>
    </PhoneFrame>
  );
}

function HeatScale() {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {[ {h: 94, name: 'Connor McDavid',  team: 'EDM', label: 'On fire'},
         {h: 67, name: 'Auston Matthews', team: 'TOR', label: 'Hot'},
         {h: 50, name: 'David Pastrnak',  team: 'BOS', label: 'Average'},
         {h: 28, name: 'Kirill Kaprizov', team: 'MIN', label: 'Cooling'},
      ].map((p, i) => {
        const c = heatColor(p.h);
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10,
            background: NM.bgCard, border: `1px solid ${p.h >= 70 ? c+'55' : NM.borderSoft}`,
            boxShadow: p.h >= 85 ? `0 0 20px ${c}44` : 'none',
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 17, background: TEAMS[p.team].c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: NM.fontDisplay, fontWeight: 900, color: TEAMS[p.team].t, fontSize: 12 }}>
              {p.name.split(' ')[1][0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: NM.textBright }}>{p.name}</div>
              <div style={{ fontSize: 10, color: c, fontWeight: 700, fontFamily: NM.fontMono, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 2 }}>
                {p.label}
              </div>
            </div>
            <div style={{ fontFamily: NM.fontMono, fontSize: 26, fontWeight: 700, color: c, letterSpacing: -1 }}>{p.h}</div>
          </div>
        );
      })}
    </div>
  );
}

function TeamPicker() {
  const teams = ['EDM','TOR','BOS','NYR','COL','VGK','FLA','TBL','CGY'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%' }}>
      {teams.map((t, i) => (
        <div key={t} style={{
          aspectRatio: '1', borderRadius: 12,
          background: i === 0 ? TEAMS[t].c : NM.bgCard,
          border: i === 0 ? `2px solid ${NM.heat}` : `1px solid ${NM.borderSoft}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: i === 0 ? `0 0 24px ${NM.heat}44` : 'none',
        }}>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, color: i === 0 ? TEAMS[t].t : NM.textBright }}>{t}</div>
          <div style={{ fontSize: 10, color: i === 0 ? TEAMS[t].t : NM.textMuted, fontFamily: NM.fontMono, opacity: 0.8 }}>{TEAMS[t].name.toUpperCase()}</div>
        </div>
      ))}
    </div>
  );
}

function SwitchRow() {
  const items = [
    { l: 'Game starts', s: 'Every game your team plays', on: true },
    { l: 'Hot streaks',   s: 'When a player breaks 85 Heat', on: true },
    { l: 'Daily report',  s: '9am every morning',           on: true },
    { l: 'Score updates', s: 'After every period',          on: false },
  ];
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, background: NM.bgCard, border: `1px solid ${NM.borderSoft}` }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: NM.textBright, fontWeight: 600 }}>{it.l}</div>
            <div style={{ fontSize: 11, color: NM.textMuted, marginTop: 2 }}>{it.s}</div>
          </div>
          <div style={{
            width: 40, height: 22, borderRadius: 11, padding: 2,
            background: it.on ? NM.heat : NM.borderSoft, transition: 'background 0.2s',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 9, background: '#fff',
              transform: it.on ? 'translateX(18px)' : 'translateX(0)', transition: 'transform 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── OG / social meta preview ───
function OGCardPreview() {
  return (
    <DCArtboard label="Open Graph card · 1200×630" width={1240} height={680}
      style={{ background: '#fafaf8', padding: 20, borderRadius: 6 }}>
      <div style={{ width: 1200, height: 630, position: 'relative', borderRadius: 10, overflow: 'hidden', background: NM.bg }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 75% 30%, rgba(255,90,36,0.35) 0%, transparent 50%),
                       radial-gradient(circle at 20% 80%, rgba(229,80,139,0.18) 0%, transparent 50%)`,
        }}/>
        {/* Wordmark */}
        <div style={{ position: 'absolute', top: 40, left: 56 }}>
          <MomentumWordmark size={28}/>
        </div>
        {/* Headline */}
        <div style={{ position: 'absolute', left: 56, top: 140, right: 56 }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 14, color: NM.heat, fontWeight: 700, letterSpacing: 1.6, marginBottom: 14 }}>
            HOCKEY · IN REAL TIME
          </div>
          <div style={{
            fontFamily: NM.fontSans, fontWeight: 800, fontSize: 96, lineHeight: 0.95, letterSpacing: -3.2, color: NM.textBright,
            textWrap: 'balance',
          }}>
            Every player.<br/>
            <span style={{ color: NM.heat }}>One number.</span>
          </div>
        </div>
        {/* Big heat number */}
        <div style={{ position: 'absolute', right: 56, bottom: 56, textAlign: 'right' }}>
          <div style={{ fontSize: 14, color: NM.textMuted, fontFamily: NM.fontMono, letterSpacing: 1.4, fontWeight: 700, marginBottom: 6 }}>HEAT · MCDAVID</div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 180, fontWeight: 700, color: NM.heat, lineHeight: 0.85, letterSpacing: -8 }}>94</div>
        </div>
        {/* URL */}
        <div style={{ position: 'absolute', left: 56, bottom: 56, fontFamily: NM.fontMono, fontSize: 14, color: NM.textMuted, fontWeight: 600 }}>
          momentum.app
        </div>
      </div>
    </DCArtboard>
  );
}

Object.assign(window, { LandingPage, GameRecapCard, PlayerHeatCard, AppSplash, Onboarding, OGCardPreview });
