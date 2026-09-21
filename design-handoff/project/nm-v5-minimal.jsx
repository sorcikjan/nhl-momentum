// Variation 5 — MINIMAL / DIGEST
// The "3-second read": strong typographic hierarchy, almost no chrome.
// Dense but calm. Closest to transfermarkt's data-as-copy approach.

function V5Minimal() {
  const hot = [...PLAYERS].sort((a,b)=>b.heat-a.heat).slice(0, 5);
  const breakouts = [...PLAYERS].filter(p => p.streak === 'breakout').slice(0, 3);
  const gameOfNight = GAMES[0];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: NM.bg, color: NM.textBright }}>
      <PhoneTopBar subtitle="Your NHL digest" variant="blue"/>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {/* Prose lede */}
        <div style={{ padding: '4px 24px 24px' }}>
          <div style={{
            fontFamily: NM.fontDisplay, fontWeight: 400, fontSize: 22,
            lineHeight: 1.3, letterSpacing: -0.3, color: NM.textBright, textWrap: 'pretty',
          }}>
            Tonight, <span style={{ color: NM.heat, fontWeight: 700 }}>{hot[0].last}</span> is the
            hottest skater in the league with a Heat of{' '}
            <span style={{ color: NM.heat, fontWeight: 700, fontFamily: NM.fontMono }}>{hot[0].heat}</span>,
            and Boston hosts Toronto in the only rivalry game on the slate.
          </div>
          <div style={{ fontSize: 11, color: NM.textMuted, marginTop: 12, fontFamily: NM.fontMono, letterSpacing: 0.3 }}>
            TUE · APR 20 · 6 GAMES
          </div>
        </div>

        {/* Section: HOT */}
        <Section title="Hottest" number="01" accent={NM.heat}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {hot.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 24px',
                borderTop: i > 0 ? `1px solid ${NM.borderSoft}` : 'none',
              }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, width: 16 }}>{(i+1).toString().padStart(2,'0')}</span>
                <TeamChip code={p.team} size={20} fontSize={8} radius={3}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: NM.textBright, letterSpacing: -0.1 }}>
                    {p.first[0]}. {p.last}
                  </div>
                  <div style={{ fontSize: 10, color: NM.textMuted, fontFamily: NM.fontMono, marginTop: 1 }}>
                    {p.pos} · {p.g}G {p.a}A / last {p.gm}
                  </div>
                </div>
                <Sparkline values={p.trend} w={48} h={20} fill={false} strokeWidth={1.2}/>
                <span style={{ fontFamily: NM.fontMono, fontWeight: 700, fontSize: 15, color: heatColor(p.heat), width: 32, textAlign: 'right' }}>
                  {p.heat}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Section: BREAKOUTS */}
        <Section title="Breakouts" number="02" accent={NM.rise}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {breakouts.map((p, i) => (
              <div key={p.id} style={{
                padding: '12px 24px',
                borderTop: i > 0 ? `1px solid ${NM.borderSoft}` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: NM.textBright }}>{p.first} {p.last}</span>
                  <TeamChip code={p.team} size={14} fontSize={7} radius={2}/>
                  <div style={{ flex: 1 }}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 13, color: NM.rise, fontWeight: 700 }}>
                    +{p.heat - p.trend[0]}
                  </span>
                </div>
                {p.story && (
                  <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.45, marginTop: 4, textWrap: 'pretty' }}>
                    {p.story}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Section: TONIGHT'S PICK */}
        <Section title="Our pick tonight" number="03" accent={NM.blue}>
          <div style={{ padding: '6px 24px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <TeamChip code={gameOfNight.away} size={22} fontSize={9}/>
              <span style={{ fontSize: 13, color: NM.text }}>at</span>
              <TeamChip code={gameOfNight.home} size={22} fontSize={9}/>
              <div style={{ flex: 1 }}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>{gameOfNight.time}</span>
            </div>
            <div style={{
              fontFamily: NM.fontDisplay, fontWeight: 500, fontSize: 16,
              lineHeight: 1.4, color: NM.textBright, letterSpacing: -0.2, textWrap: 'pretty',
            }}>
              {gameOfNight.narrative}
            </div>
            <div style={{
              marginTop: 10, display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', background: NM.bgCard, borderRadius: 8,
              border: `1px solid ${NM.borderSoft}`,
            }}>
              <span style={{ fontSize: 10, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>Model pick</span>
              <TeamChip code={gameOfNight.pick} size={18} fontSize={8} radius={3}/>
              <span style={{ fontSize: 13, fontWeight: 700, color: NM.textBright }}>{gameOfNight.pick}</span>
              <div style={{ flex: 1 }}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.rise, fontWeight: 600 }}>
                {Math.round(Math.max(gameOfNight.awayWin, gameOfNight.homeWin)*100)}%
              </span>
            </div>
          </div>
        </Section>

        {/* Full slate footer link */}
        <div style={{ padding: '8px 24px 20px' }}>
          <div style={{
            padding: '12px 14px', background: 'transparent', borderRadius: 8,
            border: `1px dashed ${NM.borderSoft}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 13, color: NM.textBright, fontWeight: 600 }}>5 more games tonight</div>
              <div style={{ fontSize: 11, color: NM.textMuted, marginTop: 1 }}>Full predictions, heat, and odds</div>
            </div>
            <span style={{ fontSize: 12, color: NM.blue, fontWeight: 600 }}>Open →</span>
          </div>
        </div>
      </div>

      <PhoneTabBar active="home"/>
    </div>
  );
}

function Section({ title, number, accent, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 10,
        padding: '0 24px 8px',
      }}>
        <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: accent, fontWeight: 700, letterSpacing: 1 }}>
          {number}
        </span>
        <span style={{ fontFamily: NM.fontDisplay, fontWeight: 800, fontSize: 16, color: NM.textBright, letterSpacing: -0.2 }}>
          {title}
        </span>
        <div style={{ flex: 1, height: 1, background: NM.borderSoft }}/>
      </div>
      {children}
    </div>
  );
}

Object.assign(window, { V5Minimal });
