// Variation 4 — STREAKS & STORIES
// Three oversized "streak" cards, each with a big number, photo, spark.
// Optimized for glanceable scroll — one story per viewport.

function V4Streaks() {
  const onFire    = [...PLAYERS].filter(p => p.streak === 'fire').sort((a,b)=>b.heat-a.heat)[0];
  const rising    = [...PLAYERS].filter(p => p.streak === 'breakout').sort((a,b)=>b.heat-a.heat)[0];
  const defensive = PLAYERS.find(p => p.pos === 'D' && p.heat >= 75);

  const Card = ({ player, kickerText, kickerColor, headline, bigStat, statLabel, accent }) => {
    const c = accent;
    return (
      <div style={{
        borderRadius: 16, overflow: 'hidden',
        background: NM.bgCard,
        border: `1px solid ${NM.borderSoft}`,
        position: 'relative',
      }}>
        {/* Accent glow top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent 0%, ${c} 50%, transparent 100%)` }}/>

        {/* Photo strip */}
        <div style={{ position: 'relative', height: 120 }}>
          <PhotoPlaceholder w="100%" h={120} subject={`${player.last} · ${player.team}`} team={player.team}/>
          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <Kicker color={kickerColor}>{kickerText}</Kicker>
          </div>
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <TeamChip code={player.team} size={28} fontSize={11}/>
            <div>
              <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: -0.2, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
                {player.first} {player.last}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.82)', fontFamily: NM.fontMono, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
                #{player.num ?? '—'} · {player.pos} · age {player.age ?? '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px 16px' }}>
          <h3 style={{
            margin: 0, fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 18,
            lineHeight: 1.15, letterSpacing: -0.3, color: NM.textBright,
            textWrap: 'pretty',
          }}>{headline}</h3>

          <div style={{
            marginTop: 12, display: 'flex', alignItems: 'center', gap: 16,
            padding: '12px 14px', background: NM.bg, borderRadius: 10,
            border: `1px solid ${c}22`,
          }}>
            <div>
              <div style={{ fontFamily: NM.fontMono, fontWeight: 700, fontSize: 32, color: c, lineHeight: 1, letterSpacing: -1 }}>
                {bigStat}
              </div>
              <div style={{ fontSize: 10, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 4 }}>
                {statLabel}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>Heat · last 6 weeks</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 13, fontWeight: 700, color: c }}>{player.heat}</span>
              </div>
              <Sparkline values={player.trend} w={140} h={28} stroke={c}/>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <span style={{ fontSize: 11, color: NM.text }}>{player.g}G</span>
            <span style={{ color: NM.borderSoft }}>·</span>
            <span style={{ fontSize: 11, color: NM.text }}>{player.a}A</span>
            <span style={{ color: NM.borderSoft }}>·</span>
            <span style={{ fontSize: 11, color: NM.text }}>{player.g + player.a}pts in {player.gm}GP</span>
            <div style={{ flex: 1 }}/>
            <span style={{ fontSize: 11, color: c, fontWeight: 600 }}>Read story →</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: NM.bg, color: NM.textBright }}>
      <PhoneTopBar subtitle="Three stories, one scroll" variant="heat"/>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 30, letterSpacing: -1, lineHeight: 1, color: NM.textBright }}>
            The streaks.
          </div>
          <div style={{ fontSize: 12, color: NM.text, marginTop: 6 }}>
            Three players worth your time this week.
          </div>
        </div>

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card
            player={onFire}
            kickerText="On fire" kickerColor={NM.heat}
            headline={`${onFire.g} goals in ${onFire.gm} games — the slump is over.`}
            bigStat={onFire.g} statLabel={`goals · last ${onFire.gm}`}
            accent={NM.heat}
          />
          <Card
            player={rising}
            kickerText="Breakout" kickerColor={NM.rise}
            headline={`From 38 to ${rising.heat} Heat in three weeks.`}
            bigStat={`+${rising.heat - rising.trend[0]}`} statLabel="heat gained"
            accent={NM.rise}
          />
          <Card
            player={defensive}
            kickerText="D-Man watch" kickerColor={NM.blue}
            headline={`A defenseman leading the conversation — ${defensive.a}A in 5.`}
            bigStat={defensive.a} statLabel={`assists · last ${defensive.gm}`}
            accent={NM.blue}
          />
        </div>

        {/* Tonight strip at bottom */}
        <div style={{ padding: '24px 20px 20px' }}>
          <div style={{ fontFamily: NM.fontDisplay, fontWeight: 800, fontSize: 14, color: NM.textBright, letterSpacing: -0.2, marginBottom: 10 }}>
            Tonight
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {GAMES.slice(0, 3).map(g => <ScoreRow key={g.id} game={g} compact/>)}
          </div>
        </div>
      </div>

      <PhoneTabBar active="home"/>
    </div>
  );
}

Object.assign(window, { V4Streaks });
