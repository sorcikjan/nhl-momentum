// Homepage — Stories through data
// Composition (top to bottom):
//   1. LAST NIGHT — compelling recap hero that pulls you in daily
//   2. TONIGHT — matches + predicted outcomes (HERO per user feedback)
//   3. BURNING HEAT MAP — "who's on fire right now"
//   4. SECONDARY STORIES — last-night breakouts + newsroom ticker
//   5. QUICK LINKS — rankings / player page entry points

function HomeV2({ onOpenPlayer }) {
  const lastNight = [
    { id: 1, home: 'EDM', away: 'COL', homeScore: 5, awayScore: 3, moment: 'McDavid hat trick',
      storyKicker: 'LAST NIGHT', storyHead: 'McDavid\'s hat trick pushes Edmonton into first in the Pacific.',
      storyDek: 'Three goals in 14 minutes — a career-high pace extended for the 3rd straight game.',
      playerId: 1, heatAfter: 94, heatDelta: +6,
    },
    { id: 2, home: 'NJD', away: 'NYR', homeScore: 4, awayScore: 2, moment: 'Hughes 2G 2A',
      storyKicker: 'BREAKOUT', storyHead: 'Jack Hughes is back — with 12 points in 4 games.',
      storyDek: 'The Devils star missed three weeks. His Heat has jumped 44 points since returning.',
      playerId: 11, heatAfter: 82, heatDelta: +7,
    },
  ];

  const featured = lastNight[0];
  const topHot = [...PLAYERS].sort((a, b) => b.heat - a.heat).slice(0, 24);
  const tonightGames = GAMES.filter(g => g.status !== 'live');
  const liveGame = GAMES.find(g => g.status === 'live');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: NM.bg, color: NM.textBright }}>
      <PhoneTopBar subtitle="Tuesday · Apr 20" variant="heat"
        right={<div style={{ fontSize: 10, color: NM.rise, fontFamily: NM.fontMono, fontWeight: 600 }}>● LIVE</div>}
      />

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 1 — LAST NIGHT (the hook that brings people back)
            A single cinematic story card, overlaid on the game photo.
            ═══════════════════════════════════════════════════════════ */}
        <div style={{ padding: '0 16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
            <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Last night
            </span>
            <span style={{ fontSize: 11, color: NM.textMuted, fontFamily: NM.fontMono }}>
              {lastNight.length + 6} games · 3 stories
            </span>
          </div>

          {/* Hero story */}
          <div style={{
            borderRadius: 16, overflow: 'hidden',
            background: NM.bgCard, border: `1px solid ${NM.border}`,
            position: 'relative',
          }}>
            {/* Photo area */}
            <div style={{ position: 'relative', height: 220 }}>
              <PhotoPlaceholder w="100%" h={220} subject="McDavid hat trick" team={featured.home}/>
              {/* Gradient for legibility */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(10,11,15,0.5) 0%, transparent 30%, rgba(10,11,15,0.85) 100%)',
              }}/>
              {/* Top row: scoreline chip */}
              <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px', borderRadius: 999,
                  background: 'rgba(10,11,15,0.75)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <TeamChip code={featured.away} size={14} fontSize={7} radius={2}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 11, fontWeight: 600, color: NM.textBright }}>
                    {featured.awayScore}
                  </span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted }}>—</span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 11, fontWeight: 700, color: NM.heat }}>
                    {featured.homeScore}
                  </span>
                  <TeamChip code={featured.home} size={14} fontSize={7} radius={2}/>
                </div>
                <div style={{ flex: 1 }}/>
                <span style={{
                  fontFamily: NM.fontMono, fontSize: 10, fontWeight: 700, letterSpacing: 1,
                  color: NM.heat,
                  background: 'rgba(255,90,36,0.18)', padding: '4px 8px', borderRadius: 4,
                  border: '1px solid rgba(255,90,36,0.3)',
                }}>
                  🔥 HEAT +{featured.heatDelta}
                </span>
              </div>

              {/* Bottom: headline */}
              <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>
                <Kicker color={NM.heat}>{featured.storyKicker}</Kicker>
                <h2 style={{
                  margin: '8px 0 0', fontFamily: NM.fontDisplay, fontWeight: 900,
                  fontSize: 24, lineHeight: 1.1, letterSpacing: -0.6,
                  color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.7)',
                  textWrap: 'pretty',
                }}>
                  {featured.storyHead}
                </h2>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '14px 16px 14px' }}>
              <p style={{ margin: 0, fontSize: 13, color: NM.text, lineHeight: 1.5, textWrap: 'pretty' }}>
                {featured.storyDek}
              </p>
              <div style={{
                marginTop: 12, paddingTop: 12, borderTop: `1px solid ${NM.borderSoft}`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <button onClick={onOpenPlayer} style={{
                  border: 0, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 4px', background: 'transparent',
                }}>
                  <Headshot player={PLAYERS[0]} size={30} ring={NM.heat}/>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 12, color: NM.textBright, fontWeight: 600, letterSpacing: -0.1 }}>
                      Connor McDavid
                    </div>
                    <div style={{ fontSize: 10, color: NM.textMuted, fontFamily: NM.fontMono, marginTop: 1 }}>
                      Heat {featured.heatAfter} · 3G 0A last night
                    </div>
                  </div>
                </button>
                <div style={{ flex: 1 }}/>
                <span style={{ fontSize: 12, color: NM.heat, fontWeight: 600 }}>Read →</span>
              </div>
            </div>
          </div>

          {/* Secondary last-night strip */}
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            {lastNight.slice(1).map(s => (
              <div key={s.id} style={{
                flex: 1, padding: 12, borderRadius: 10,
                background: NM.bgCard, border: `1px solid ${NM.borderSoft}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <TeamChip code={s.away} size={16} fontSize={7} radius={2}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.text, fontWeight: 600 }}>
                    {s.awayScore}–{s.homeScore}
                  </span>
                  <TeamChip code={s.home} size={16} fontSize={7} radius={2}/>
                  <div style={{ flex: 1 }}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 700 }}>
                    +{s.heatDelta}
                  </span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: NM.rise, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 }}>
                  {s.storyKicker}
                </div>
                <div style={{
                  fontFamily: NM.fontDisplay, fontWeight: 700, fontSize: 13,
                  lineHeight: 1.25, letterSpacing: -0.2, color: NM.textBright, textWrap: 'pretty',
                }}>
                  {s.storyHead}
                </div>
              </div>
            ))}
            {/* "See all" last-night tile */}
            <div style={{
              width: 72, borderRadius: 10, background: 'transparent',
              border: `1px dashed ${NM.borderSoft}`, display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              <div style={{ fontFamily: NM.fontDisplay, fontWeight: 800, fontSize: 18, color: NM.textBright, letterSpacing: -0.3 }}>8</div>
              <div style={{ fontSize: 9, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.1 }}>
                more<br/>recaps
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 2 — TONIGHT (matches + predictions HERO)
            ═══════════════════════════════════════════════════════════ */}
        <SectionHeader number="02" title="Tonight's slate" accent={NM.blue}
          right={<span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>{GAMES.length} games</span>}
        />

        {/* Live game banner (if any) */}
        {liveGame && (
          <div style={{ padding: '0 16px 10px' }}>
            <div style={{
              padding: 14, borderRadius: 12,
              background: `linear-gradient(135deg, ${NM.heatDim} 0%, transparent 80%)`,
              border: `1px solid ${NM.heat}66`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: 3, background: NM.heat,
                  boxShadow: `0 0 8px ${NM.heat}`,
                }}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4 }}>
                  LIVE · {liveGame.period}
                </span>
                <div style={{ flex: 1 }}/>
                <span style={{ fontSize: 10, color: NM.textMuted, fontFamily: NM.fontMono }}>
                  was {Math.round(liveGame.awayWin * 100)}/{Math.round(liveGame.homeWin * 100)} pre-game
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <TeamChip code={liveGame.away} size={26} fontSize={10}/>
                  <span style={{ fontFamily: NM.fontDisplay, fontSize: 24, fontWeight: 800, color: NM.textBright, letterSpacing: -0.3 }}>
                    {liveGame.awayScore}
                  </span>
                </div>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>at</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                  <span style={{ fontFamily: NM.fontDisplay, fontSize: 24, fontWeight: 800, color: NM.textBright, letterSpacing: -0.3 }}>
                    {liveGame.homeScore}
                  </span>
                  <TeamChip code={liveGame.home} size={26} fontSize={10}/>
                </div>
              </div>
              <div style={{ fontSize: 12, color: NM.text, marginTop: 8, textWrap: 'pretty' }}>
                {liveGame.narrative}
              </div>
            </div>
          </div>
        )}

        {/* Prediction hero — first upcoming game */}
        <div style={{ padding: '0 16px 12px' }}>
          <PredictionHero game={tonightGames[0]}/>
        </div>

        {/* Rest of tonight's slate — compact prediction rows */}
        <div style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tonightGames.slice(1).map(g => <PredictionRow key={g.id} game={g}/>)}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 3 — BURNING HEAT MAP
            ═══════════════════════════════════════════════════════════ */}
        <SectionHeader number="03" title="Who's burning right now" accent={NM.heat}
          right={<span style={{ fontSize: 11, color: NM.heat, fontWeight: 600 }}>All →</span>}
        />

        <div style={{ padding: '0 16px 12px' }}>
          {/* Heat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
            {topHot.slice(0, 20).map((p, i) => {
              const c = heatColor(p.heat);
              const intensity = p.heat / 100;
              const glow = p.heat >= 85 ? `0 0 20px ${c}77` : p.heat >= 70 ? `0 0 10px ${c}33` : 'none';
              return (
                <button key={p.id}
                  onClick={i === 0 ? onOpenPlayer : undefined}
                  style={{
                    border: 0, cursor: i === 0 ? 'pointer' : 'default', textAlign: 'left',
                    aspectRatio: '1', borderRadius: 8, padding: 7,
                    background: `linear-gradient(155deg, ${c}${Math.round(intensity*200).toString(16).padStart(2,'0')} 0%, ${NM.bgCard} 100%)`,
                    boxShadow: glow,
                    borderTop: `1px solid ${p.heat >= 70 ? c+'55' : NM.borderSoft}`,
                    borderLeft: `1px solid ${p.heat >= 70 ? c+'33' : NM.borderSoft}`,
                    borderRight: `1px solid ${NM.borderSoft}`,
                    borderBottom: `1px solid ${NM.borderSoft}`,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    position: 'relative', overflow: 'hidden',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <TeamChip code={p.team} size={14} fontSize={6} radius={2}/>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 13, fontWeight: 700, color: c, lineHeight: 1 }}>
                      {p.heat}
                    </span>
                  </div>
                  <div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: NM.textBright, lineHeight: 1.1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.last}
                    </div>
                    <div style={{ fontSize: 8, color: NM.textMuted, fontWeight: 500, marginTop: 1 }}>
                      {p.pos} · {p.g}G {p.a}A
                    </div>
                  </div>
                  {/* subtle heat line at bottom */}
                  <div style={{
                    position: 'absolute', left: 0, right: 0, bottom: 0, height: 2,
                    background: c, opacity: intensity,
                  }}/>
                </button>
              );
            })}
          </div>

          {/* Heat legend */}
          <div style={{
            marginTop: 10, display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', background: NM.bgCard, borderRadius: 8,
            border: `1px solid ${NM.borderSoft}`,
          }}>
            <span style={{ fontSize: 9, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>
              Cold
            </span>
            <div style={{
              flex: 1, height: 5, borderRadius: 3,
              background: 'linear-gradient(90deg, #4a88ff 0%, #8a94a6 30%, #f7b267 60%, #ff5a24 85%, #ff3a0f 100%)',
            }}/>
            <span style={{ fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
              On fire
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 4 — SECONDARY STORIES (newsroom, ticker style)
            Smaller, opt-in. Not the main event per the feedback.
            ═══════════════════════════════════════════════════════════ */}
        <SectionHeader number="04" title="More stories" accent={NM.story}
          right={<span style={{ fontSize: 11, color: NM.textMuted, fontFamily: NM.fontMono }}>weekly</span>}
        />

        <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STORIES.slice(0, 3).map((s, i) => (
            <StoryRow key={i} story={s}/>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 5 — QUICK LINKS
            ═══════════════════════════════════════════════════════════ */}
        <div style={{ padding: '6px 16px 24px', display: 'flex', gap: 8 }}>
          <QuickLink
            label="Full rankings"
            sub={`${PLAYERS.length}+ skaters, live Heat`}
            accent={NM.heat}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={NM.heat} strokeWidth="2" strokeLinecap="round">
                <path d="M4 20V10M10 20V4M16 20v-6M22 20v-9"/>
              </svg>
            }
          />
          <QuickLink
            label="Compare players"
            sub="McDavid vs MacKinnon →"
            accent={NM.blue}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={NM.blue} strokeWidth="2" strokeLinecap="round">
                <path d="M12 3v18M3 12h18"/>
              </svg>
            }
          />
        </div>
      </div>

      <PhoneTabBar active="home"/>
    </div>
  );
}

// ─── Section divider used throughout ──────────────────────────────
function SectionHeader({ number, title, accent, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 10,
      padding: '6px 20px 10px',
    }}>
      <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: accent, fontWeight: 700, letterSpacing: 1 }}>
        {number}
      </span>
      <span style={{ fontFamily: NM.fontDisplay, fontWeight: 800, fontSize: 17, color: NM.textBright, letterSpacing: -0.3 }}>
        {title}
      </span>
      <div style={{ flex: 1, height: 1, background: NM.borderSoft, alignSelf: 'center' }}/>
      {right}
    </div>
  );
}

// ─── Prediction hero: the flagship "game tonight" card ────────────
function PredictionHero({ game }) {
  const awayPct = Math.round(game.awayWin * 100);
  const homePct = Math.round(game.homeWin * 100);
  const favored = game.homeWin > game.awayWin ? 'home' : 'away';
  const favPct = Math.max(awayPct, homePct);
  const awayC = TEAMS[game.away], homeC = TEAMS[game.home];

  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      background: NM.bgCard, border: `1px solid ${NM.border}`,
    }}>
      {/* Team split header — bold visual hook */}
      <div style={{ display: 'flex', height: 80, position: 'relative' }}>
        <div style={{
          flex: game.awayWin,
          background: `linear-gradient(135deg, ${awayC.c} 0%, ${awayC.c}bb 100%)`,
          display: 'flex', alignItems: 'center', padding: '0 14px',
          color: awayC.t,
          filter: favored === 'away' ? 'none' : 'saturate(0.6) brightness(0.75)',
          transition: 'filter 0.3s',
        }}>
          <div>
            <div style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 26, letterSpacing: -0.5, lineHeight: 1 }}>
              {game.away}
            </div>
            <div style={{ fontSize: 10, opacity: 0.85, marginTop: 3, fontFamily: NM.fontMono, fontWeight: 600 }}>
              {awayPct}% win
            </div>
          </div>
        </div>
        <div style={{
          flex: game.homeWin,
          background: `linear-gradient(225deg, ${homeC.c} 0%, ${homeC.c}bb 100%)`,
          display: 'flex', alignItems: 'center', padding: '0 14px',
          color: homeC.t, justifyContent: 'flex-end', textAlign: 'right',
          filter: favored === 'home' ? 'none' : 'saturate(0.6) brightness(0.75)',
          transition: 'filter 0.3s',
        }}>
          <div>
            <div style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 26, letterSpacing: -0.5, lineHeight: 1 }}>
              {game.home}
            </div>
            <div style={{ fontSize: 10, opacity: 0.85, marginTop: 3, fontFamily: NM.fontMono, fontWeight: 600 }}>
              {homePct}% win
            </div>
          </div>
        </div>
        {/* Centre VS + time */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
          width: 54, height: 54, borderRadius: 27, background: NM.bg,
          border: `2px solid ${NM.bgCard}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 600, lineHeight: 1 }}>
            {game.time.replace(' PM','').replace(' AM','')}
          </div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.text, letterSpacing: 0.5, marginTop: 2 }}>
            VS
          </div>
        </div>
      </div>

      {/* Narrative body */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          {game.rivalry && (
            <span style={{
              fontFamily: NM.fontMono, fontSize: 10, color: NM.gold, fontWeight: 700, letterSpacing: 0.8,
              background: 'rgba(255,181,71,0.14)', padding: '2px 7px', borderRadius: 4,
            }}>
              🔥 RIVALRY
            </span>
          )}
          <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>
            {game.time}
          </span>
          <div style={{ flex: 1 }}/>
        </div>

        <p style={{ margin: 0, fontSize: 13, color: NM.textBright, lineHeight: 1.5, textWrap: 'pretty' }}>
          {game.narrative}
        </p>

        {/* Pick row */}
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: `1px solid ${NM.borderSoft}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 10, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>
            Our pick
          </span>
          <TeamChip code={game.pick} size={20} fontSize={9} radius={3}/>
          <span style={{ fontSize: 13, fontWeight: 700, color: NM.textBright }}>
            {game.pick}
          </span>
          <div style={{ flex: 1 }}/>
          <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.rise, fontWeight: 700 }}>
            {favPct}% confidence
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Compact prediction row ───────────────────────────────────────
function PredictionRow({ game }) {
  const awayPct = Math.round(game.awayWin * 100);
  const homePct = Math.round(game.homeWin * 100);
  const favoredHome = game.homeWin > game.awayWin;
  const favPct = Math.max(awayPct, homePct);

  return (
    <div style={{
      padding: '12px 14px', background: NM.bgCard, borderRadius: 10,
      border: `1px solid ${NM.borderSoft}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <TeamChip code={game.away} size={22} fontSize={9}/>
        <span style={{
          fontFamily: NM.fontMono, fontSize: 11, fontWeight: 600,
          color: favoredHome ? NM.textMuted : NM.textBright, width: 28,
        }}>
          {awayPct}%
        </span>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, height: 5 }}>
          <div style={{
            flex: game.awayWin, height: '100%', borderRadius: '3px 1px 1px 3px',
            background: favoredHome ? NM.borderSoft : NM.rise,
          }}/>
          <div style={{
            flex: game.homeWin, height: '100%', borderRadius: '1px 3px 3px 1px',
            background: favoredHome ? NM.rise : NM.borderSoft,
          }}/>
        </div>
        <span style={{
          fontFamily: NM.fontMono, fontSize: 11, fontWeight: 600,
          color: favoredHome ? NM.textBright : NM.textMuted, width: 28, textAlign: 'right',
        }}>
          {homePct}%
        </span>
        <TeamChip code={game.home} size={22} fontSize={9}/>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>
          {game.time}
        </span>
        {game.rivalry && (
          <span style={{ fontSize: 10, color: NM.gold, fontWeight: 600 }}>· rivalry</span>
        )}
        <div style={{ flex: 1 }}/>
        <span style={{ fontSize: 11, color: NM.text, lineHeight: 1.3, textAlign: 'right', textWrap: 'balance' }}>
          {game.narrative}
        </span>
      </div>
    </div>
  );
}

// ─── Story row (newsroom ticker item) ─────────────────────────────
function StoryRow({ story }) {
  const accent = story.tag === 'fire' ? NM.heat
    : story.tag === 'cold' ? NM.cold
    : story.tag === 'rise' ? NM.rise
    : NM.story;
  const player = story.playerId ? PLAYERS.find(p => p.id === story.playerId) : null;

  return (
    <div style={{
      display: 'flex', gap: 12, padding: '10px 2px',
    }}>
      {/* Thumb */}
      <div style={{ width: 70, height: 70, flexShrink: 0, borderRadius: 8, overflow: 'hidden' }}>
        {player
          ? <PhotoPlaceholder w={70} h={70} subject={player.last} team={player.team}/>
          : <div style={{
              width: 70, height: 70,
              background: `linear-gradient(135deg, ${accent}44 0%, ${NM.bgCard} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: NM.fontDisplay, fontSize: 24, fontWeight: 900, color: accent, opacity: 0.6,
            }}>?</div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: NM.fontMono, fontSize: 9, color: accent, fontWeight: 700,
          letterSpacing: 1.2, textTransform: 'uppercase',
        }}>
          {story.kicker}
        </div>
        <div style={{
          fontFamily: NM.fontDisplay, fontWeight: 700, fontSize: 14,
          lineHeight: 1.25, letterSpacing: -0.2, color: NM.textBright,
          marginTop: 4, textWrap: 'pretty',
        }}>
          {story.headline}
        </div>
        <div style={{ fontSize: 11, color: NM.textMuted, marginTop: 4, fontFamily: NM.fontMono }}>
          {story.meta}
        </div>
      </div>
    </div>
  );
}

// ─── Quick link card ──────────────────────────────────────────────
function QuickLink({ label, sub, accent, icon }) {
  return (
    <div style={{
      flex: 1, padding: '12px 14px', borderRadius: 10,
      background: NM.bgCard, border: `1px solid ${NM.borderSoft}`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 17,
        background: `${accent}1c`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: NM.textBright, letterSpacing: -0.1 }}>{label}</div>
        <div style={{ fontSize: 10, color: NM.textMuted, marginTop: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeV2, SectionHeader, PredictionHero, PredictionRow, StoryRow, QuickLink });
