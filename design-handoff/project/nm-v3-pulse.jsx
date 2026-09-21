// Variation 3 — TONIGHT'S PULSE
// Game predictions are the hero. Each game = narrative + heat comparison.

function V3Pulse() {
  const featured = GAMES[0];
  const rest = GAMES.slice(1);

  // Pick team heat averages for narrative (mock)
  const teamHeat = { TOR: 78, BOS: 66, EDM: 84, COL: 81, NYR: 72, PIT: 64, FLA: 70, TBL: 68, VAN: 58, CGY: 62, WPG: 67, MIN: 60 };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: NM.bg, color: NM.textBright }}>
      <PhoneTopBar subtitle="Tonight's picks" variant="heat"
        right={<div style={{ fontSize: 10, color: NM.rise, fontFamily: NM.fontMono, fontWeight: 600 }}>63% YTD</div>}
      />

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {/* Big hero game */}
        <div style={{ padding: '0 20px 16px' }}>
          <Kicker color={NM.heat}>Game of the night</Kicker>
          <div style={{ marginTop: 10, borderRadius: 14, overflow: 'hidden', background: NM.bgCard, border: `1px solid ${NM.border}` }}>
            {/* Team split header */}
            <div style={{ display: 'flex', height: 90, position: 'relative' }}>
              <div style={{
                flex: featured.awayWin, background: `linear-gradient(135deg, ${TEAMS[featured.away].c} 0%, ${TEAMS[featured.away].c}99 100%)`,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                padding: 12, color: TEAMS[featured.away].t,
              }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, opacity: 0.85 }}>AWAY</div>
                <div>
                  <div style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 28, letterSpacing: -0.5, lineHeight: 1 }}>{featured.away}</div>
                  <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2, fontFamily: NM.fontMono }}>{Math.round(featured.awayWin * 100)}%</div>
                </div>
              </div>
              <div style={{
                flex: featured.homeWin, background: `linear-gradient(225deg, ${TEAMS[featured.home].c} 0%, ${TEAMS[featured.home].c}99 100%)`,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                padding: 12, color: TEAMS[featured.home].t, textAlign: 'right',
              }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, opacity: 0.85 }}>HOME</div>
                <div>
                  <div style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 28, letterSpacing: -0.5, lineHeight: 1 }}>{featured.home}</div>
                  <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2, fontFamily: NM.fontMono }}>{Math.round(featured.homeWin * 100)}%</div>
                </div>
              </div>
              {/* Center badge */}
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 52, height: 52, borderRadius: 26, background: NM.bg,
                border: `2px solid ${NM.bgCard}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: NM.fontMono, fontSize: 10, color: NM.text, fontWeight: 600,
              }}>VS</div>
            </div>

            {/* Body */}
            <div style={{ padding: '14px 16px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.gold, fontWeight: 700, background: 'rgba(255,181,71,0.14)', padding: '2px 6px', borderRadius: 4 }}>
                  🔥 RIVALRY
                </span>
                <span style={{ fontSize: 11, color: NM.text, fontFamily: NM.fontMono }}>{featured.time}</span>
                <div style={{ flex: 1 }}/>
                <span style={{ fontSize: 11, color: NM.textMuted }}>TD Garden</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: NM.textBright, textWrap: 'pretty' }}>
                {featured.narrative}
              </p>

              {/* Heat comparison */}
              <div style={{ marginTop: 12, padding: 12, background: NM.bg, borderRadius: 10, border: `1px solid ${NM.borderSoft}` }}>
                <div style={{ fontSize: 10, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                  Team Heat · last 5 games
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TeamChip code={featured.away} size={22} fontSize={9}/>
                    <HeatBar heat={teamHeat[featured.away]} showLabel/>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TeamChip code={featured.home} size={22} fontSize={9}/>
                    <HeatBar heat={teamHeat[featured.home]} showLabel/>
                  </div>
                </div>
              </div>

              {/* Pick row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${NM.borderSoft}` }}>
                <span style={{ fontSize: 10, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>Our pick</span>
                <TeamChip code={featured.pick} size={22} fontSize={9}/>
                <span style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 14, color: NM.textBright }}>
                  {featured.pick} wins
                </span>
                <div style={{ flex: 1 }}/>
                <span style={{ fontSize: 11, color: NM.rise, fontFamily: NM.fontMono, fontWeight: 600 }}>
                  {Math.round(Math.max(featured.awayWin, featured.homeWin) * 100)}% confidence
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of tonight's slate */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: NM.fontDisplay, fontWeight: 800, fontSize: 16, color: NM.textBright, letterSpacing: -0.2 }}>
              The rest of tonight
            </span>
            <span style={{ fontSize: 11, color: NM.textMuted, fontFamily: NM.fontMono }}>{rest.length} games</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rest.map(g => {
              const favored = g.pick;
              const favPct = Math.round(Math.max(g.awayWin, g.homeWin) * 100);
              const live = g.status === 'live';
              return (
                <div key={g.id} style={{
                  padding: 12, background: NM.bgCard, borderRadius: 10,
                  border: `1px solid ${live ? NM.heat : NM.borderSoft}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <TeamChip code={g.away} size={24} fontSize={10}/>
                    {g.homeScore !== undefined ? (
                      <span style={{ fontFamily: NM.fontMono, fontWeight: 700, color: NM.textBright, fontSize: 14 }}>
                        {g.awayScore}
                      </span>
                    ) : null}
                    <span style={{ fontSize: 11, color: NM.textMuted }}>@</span>
                    <TeamChip code={g.home} size={24} fontSize={10}/>
                    {g.homeScore !== undefined ? (
                      <span style={{ fontFamily: NM.fontMono, fontWeight: 700, color: NM.textBright, fontSize: 14 }}>
                        {g.homeScore}
                      </span>
                    ) : null}
                    <div style={{ flex: 1 }}/>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 10, fontWeight: 600, color: live ? NM.heat : NM.text }}>
                      {live ? `● ${g.period}` : g.time}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.4, marginBottom: 8 }}>
                    {g.narrative}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>Pick</span>
                    <TeamChip code={favored} size={16} fontSize={7} radius={3}/>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.rise, fontWeight: 600 }}>{favPct}%</span>
                    <div style={{ flex: 1 }}/>
                    <HeatBar heat={teamHeat[g.away] || 60} height={3} bg={NM.borderSoft}/>
                    <div style={{ width: 10 }}/>
                    <HeatBar heat={teamHeat[g.home] || 60} height={3} bg={NM.borderSoft}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <PhoneTabBar active="games"/>
    </div>
  );
}

Object.assign(window, { V3Pulse });
