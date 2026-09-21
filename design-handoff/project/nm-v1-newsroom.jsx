// Variation 1 — NEWSROOM
// Editorial-first. Big hero story with photo, then stories grid, then scores ticker.
// Inspired by HLTV / transfermarkt feature-story approach.

function V1Newsroom() {
  const hero = STORIES[0];
  const heroPlayer = PLAYERS.find(p => p.id === hero.playerId);
  const secondaries = STORIES.slice(1);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: NM.bg, color: NM.textBright }}>
      <PhoneTopBar subtitle="Today's stories" variant="story"
        right={<div style={{ fontSize: 10, color: NM.text, fontFamily: NM.fontMono }}>updated 4m ago</div>}
      />

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {/* Date line */}
        <div style={{ padding: '0 20px 10px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 30, color: NM.textBright, letterSpacing: -1, lineHeight: 1 }}>
              Tonight.
            </div>
            <div style={{ fontSize: 12, color: NM.text, marginTop: 2 }}>Tue · Apr 20 · 6 games</div>
          </div>
        </div>

        {/* HERO STORY */}
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{
            borderRadius: 14, overflow: 'hidden',
            background: NM.bgCard, border: `1px solid ${NM.border}`,
            position: 'relative',
          }}>
            <div style={{ position: 'relative' }}>
              <PhotoPlaceholder w="100%" h={200} subject="Hughes action shot" team={heroPlayer.team}/>
              <div style={{ position: 'absolute', top: 12, left: 12 }}>
                <Kicker color={NM.story}>Breakout story</Kicker>
              </div>
              <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
                <HeatBadge heat={heroPlayer.heat} size={48} thickness={3}/>
              </div>
            </div>
            <div style={{ padding: '14px 16px 16px' }}>
              <h2 style={{
                margin: 0, fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 22,
                lineHeight: 1.12, letterSpacing: -0.5, color: NM.textBright,
                textWrap: 'pretty',
              }}>
                {hero.headline}
              </h2>
              <p style={{ margin: '8px 0 12px', fontSize: 13, lineHeight: 1.5, color: NM.text }}>
                {hero.dek}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 10, borderTop: `1px solid ${NM.borderSoft}` }}>
                <TeamChip code={heroPlayer.team} size={22} fontSize={9}/>
                <Headshot player={heroPlayer} size={26}/>
                <span style={{ fontSize: 12, color: NM.textBright, fontWeight: 600 }}>
                  {heroPlayer.first} {heroPlayer.last}
                </span>
                <span style={{ fontSize: 11, color: NM.textMuted }}>· {heroPlayer.pos}</span>
                <div style={{ flex: 1 }}/>
                <span style={{ fontSize: 11, fontFamily: NM.fontMono, color: NM.rise, fontWeight: 600 }}>
                  +44 Heat
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: Stories grid */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: NM.fontDisplay, fontWeight: 800, fontSize: 16, color: NM.textBright, letterSpacing: -0.2 }}>
              More stories
            </span>
            <span style={{ fontSize: 11, color: NM.textMuted, fontFamily: NM.fontMono }}>AI-assisted</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {secondaries.map((s, i) => {
              const p = s.playerId ? PLAYERS.find(x => x.id === s.playerId) : null;
              const accent = s.tag === 'fire' ? NM.heat : s.tag === 'cold' ? NM.cold : s.tag === 'rise' ? NM.rise : NM.story;
              return (
                <div key={i} style={{
                  display: 'flex', gap: 12, padding: 12,
                  background: NM.bgCard, borderRadius: 12,
                  border: `1px solid ${NM.borderSoft}`,
                }}>
                  <div style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                    <PhotoPlaceholder w={72} h={72} subject={p ? p.team : 'team'} team={p ? p.team : 'PHI'}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Kicker color={accent} size={9}>{s.kicker}</Kicker>
                    <h3 style={{
                      margin: '4px 0 4px',
                      fontFamily: NM.fontSans, fontWeight: 700, fontSize: 14,
                      lineHeight: 1.25, color: NM.textBright, letterSpacing: -0.2,
                    }}>
                      {s.headline}
                    </h3>
                    <div style={{ fontSize: 11, color: NM.textMuted, fontFamily: NM.fontMono, letterSpacing: 0.2 }}>
                      {s.meta}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scores ticker */}
        <div style={{ padding: '4px 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: NM.fontDisplay, fontWeight: 800, fontSize: 16, color: NM.textBright, letterSpacing: -0.2 }}>
              Scores
            </span>
            <span style={{ fontSize: 11, color: NM.blue, fontWeight: 600 }}>See all →</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {GAMES.slice(0, 4).map(g => <ScoreRow key={g.id} game={g}/>)}
          </div>
        </div>
      </div>

      <PhoneTabBar active="home"/>
    </div>
  );
}

Object.assign(window, { V1Newsroom });
