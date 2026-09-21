// Homepage V3 — per direct user feedback.
// Section order:
//   01 RECENT RESULTS — horizontal scroller, who-played-what-was-the-result-vs-prediction
//   02 UPCOMING — minimal info per game + "watch-picks" highlighting must-see matchups + star players
//   03 HEAT MAP — "look at these guys, they're playing amazing"
//   04 STORIES — newsroom, last
// Typography: clean sans for headlines (NO Fraunces). Player names can stay display.

function HomeV3({ onOpenPlayer }) {
  // Pretend "today" — yesterday's results + tonight's upcoming
  const recentResults = [
    { id: 1, away: 'EDM', home: 'COL', awayScore: 5, homeScore: 3,
      predictedAway: 0.53, predictedHome: 0.47, pickedWinner: 'EDM',
      pickHit: true, headlinePlayer: 1, // McDavid
      moment: 'McDavid hat trick', heatTopId: 1, heatTopVal: 94 },
    { id: 2, away: 'NYR', home: 'PIT', awayScore: 4, homeScore: 2,
      predictedAway: 0.61, predictedHome: 0.39, pickedWinner: 'NYR',
      pickHit: true, moment: 'Shesterkin 38 saves', heatTopId: 9, heatTopVal: 71 },
    { id: 3, away: 'NJD', home: 'NYI', awayScore: 4, homeScore: 2,
      predictedAway: 0.55, predictedHome: 0.45, pickedWinner: 'NJD',
      pickHit: true, moment: 'Hughes 2G 2A', heatTopId: 11, heatTopVal: 82 },
    { id: 4, away: 'TBL', home: 'FLA', awayScore: 1, homeScore: 4,
      predictedAway: 0.55, predictedHome: 0.45, pickedWinner: 'TBL',
      pickHit: false, moment: 'Tkachuk 1G 2A', heatTopId: 8, heatTopVal: 74 },
    { id: 5, away: 'WPG', home: 'MIN', awayScore: 3, homeScore: 2,
      predictedAway: 0.54, predictedHome: 0.46, pickedWinner: 'WPG',
      pickHit: true, moment: 'OT winner · Scheifele', heatTopVal: 68 },
    { id: 6, away: 'VAN', home: 'CGY', awayScore: 2, homeScore: 4,
      predictedAway: 0.48, predictedHome: 0.52, pickedWinner: 'CGY',
      pickHit: true, moment: 'Huberdeau 2G', heatTopVal: 61 },
    { id: 7, away: 'TOR', home: 'BOS', awayScore: 3, homeScore: 2,
      predictedAway: 0.42, predictedHome: 0.58, pickedWinner: 'BOS',
      pickHit: false, moment: 'Matthews 2G', heatTopId: 4, heatTopVal: 86 },
  ];

  const upcoming = [
    { id: 1, away: 'EDM', home: 'COL', time: '9:30 PM', awayWin: 0.53, homeWin: 0.47,
      watchScore: 96, // 0-100 "watchability"
      pitch: 'McDavid (94) vs MacKinnon (91). The hottest matchup in hockey.',
      starIds: [1, 2], rivalry: false, marquee: true },
    { id: 2, away: 'TOR', home: 'BOS', time: '7:00 PM', awayWin: 0.42, homeWin: 0.58,
      watchScore: 88, pitch: 'Matthews on a tear. Boston has won 7 of 10 at home.',
      starIds: [4, 5], rivalry: true, marquee: true },
    { id: 3, away: 'VAN', home: 'CGY', time: '10:00 PM', awayWin: 0.48, homeWin: 0.52,
      watchScore: 71, pitch: 'Battle of Alberta classic.',
      starIds: [], rivalry: true, marquee: false },
    { id: 4, away: 'NYR', home: 'PIT', time: '7:30 PM', awayWin: 0.61, homeWin: 0.39,
      watchScore: 64, pitch: 'Crosby steady, but Rangers PK is best in league.',
      starIds: [9], rivalry: false, marquee: false },
    { id: 5, away: 'WPG', home: 'MIN', time: '8:00 PM', awayWin: 0.54, homeWin: 0.46,
      watchScore: 52, pitch: '', starIds: [], rivalry: false, marquee: false },
    { id: 6, away: 'FLA', home: 'TBL', time: '7:00 PM', awayWin: 0.55, homeWin: 0.45,
      watchScore: 79, pitch: 'Battle of Florida. Tkachuk vs Kucherov.',
      starIds: [8], rivalry: true, marquee: true },
  ];

  const topHot = [...PLAYERS].sort((a, b) => b.heat - a.heat).slice(0, 20);
  const dayResults = recentResults.length;
  const hits = recentResults.filter(r => r.pickHit).length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: NM.bg, color: NM.textBright }}>
      <PhoneTopBarV3 dateLabel="Tuesday · Apr 20"
        right={<span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.text, fontWeight: 600 }}>
          {hits}/{dayResults} picks hit
        </span>}
      />

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>

        {/* ═══════════════════════════════════════════════════════════
            01 — RECENT RESULTS
            Horizontal scroller. Each card: scoreline, pick-vs-result,
            standout player. Scales 1 game → 18 games.
            ═══════════════════════════════════════════════════════════ */}
        <SectionHeadV3 num="01" label="LAST NIGHT" title="Results"
          right={<span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>
            {dayResults} games · all →
          </span>}
        />

        {/* Pick-accuracy strip — at-a-glance honesty */}
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{
            padding: '10px 12px', borderRadius: 8,
            background: NM.bgCard, border: `1px solid ${NM.borderSoft}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 10, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', flexShrink: 0 }}>
              Last night's picks
            </span>
            <div style={{ flex: 1, display: 'flex', gap: 3 }}>
              {recentResults.map(r => (
                <div key={r.id} style={{
                  flex: 1, height: 6, borderRadius: 2,
                  background: r.pickHit ? NM.rise : NM.cold, opacity: 0.85,
                }}/>
              ))}
            </div>
            <span style={{ fontFamily: NM.fontMono, fontSize: 12, fontWeight: 700, color: NM.rise }}>
              {Math.round(hits/dayResults*100)}%
            </span>
          </div>
        </div>

        {/* Horizontal scroller */}
        <div style={{
          display: 'flex', gap: 10, overflowX: 'auto',
          padding: '0 16px 4px', scrollSnapType: 'x mandatory',
        }}>
          {recentResults.map(r => <ResultCard key={r.id} result={r} onOpenPlayer={onOpenPlayer}/>)}
        </div>

        <div style={{ padding: '14px 16px 24px' }}>
          <button style={{
            width: '100%', padding: '10px 12px', borderRadius: 8,
            background: 'transparent', border: `1px solid ${NM.borderSoft}`,
            color: NM.text, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: NM.fontSans, letterSpacing: 0.2,
          }}>
            See all {dayResults} results →
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            02 — UPCOMING
            Minimal info. Watch-picks float to top. Star players highlighted.
            ═══════════════════════════════════════════════════════════ */}
        <SectionHeadV3 num="02" label="TONIGHT" title="Upcoming"
          right={<span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>
            {upcoming.length} games
          </span>}
        />

        {/* Marquee watch-picks */}
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
            padding: '0 2px',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={NM.heat} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s-1-3 4-6Z"/>
            </svg>
            <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase' }}>
              Watch tonight
            </span>
            <div style={{ flex: 1, height: 1, background: NM.borderSoft, marginLeft: 6 }}/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.filter(g => g.marquee).slice(0, 2).map(g =>
              <WatchPickCard key={g.id} game={g} onOpenPlayer={onOpenPlayer}/>
            )}
          </div>
        </div>

        {/* Rest of slate — minimal */}
        <div style={{ padding: '4px 16px 24px' }}>
          <div style={{ fontSize: 10, color: NM.textMuted, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, padding: '0 2px' }}>
            Rest of the slate
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 10, overflow: 'hidden', border: `1px solid ${NM.borderSoft}` }}>
            {upcoming.filter(g => !g.marquee).map(g => <UpcomingRow key={g.id} game={g}/>)}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            03 — HEAT MAP — "look at these guys"
            ═══════════════════════════════════════════════════════════ */}
        <SectionHeadV3 num="03" label="ON FIRE" title="Players burning right now"
          right={<span style={{ fontSize: 11, color: NM.heat, fontWeight: 600 }}>All →</span>}
        />

        <div style={{ padding: '0 16px 8px' }}>
          {/* Editorial lede */}
          <div style={{
            fontSize: 13, color: NM.text, lineHeight: 1.5, marginBottom: 12,
            padding: '0 2px',
          }}>
            Heat is each player's last-5 form, scored 0–100. These twenty are scoring above their season average — some of them way above it.
          </div>

          {/* Heat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
            {topHot.map((p, i) => {
              const c = heatColor(p.heat);
              const intensity = p.heat / 100;
              const glow = p.heat >= 85 ? `0 0 22px ${c}77` : p.heat >= 72 ? `0 0 10px ${c}33` : 'none';
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
                  <div style={{
                    position: 'absolute', left: 0, right: 0, bottom: 0, height: 2,
                    background: c, opacity: intensity,
                  }}/>
                </button>
              );
            })}
          </div>

          {/* Heat scale */}
          <div style={{
            marginTop: 10, display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', background: NM.bgCard, borderRadius: 8,
            border: `1px solid ${NM.borderSoft}`,
          }}>
            <span style={{ fontSize: 9, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>Cold</span>
            <div style={{
              flex: 1, height: 5, borderRadius: 3,
              background: 'linear-gradient(90deg, #4a88ff 0%, #8a94a6 30%, #f7b267 60%, #ff5a24 85%, #ff3a0f 100%)',
            }}/>
            <span style={{ fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>On fire</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            04 — STORIES (newsroom, secondary)
            ═══════════════════════════════════════════════════════════ */}
        <SectionHeadV3 num="04" label="THIS WEEK" title="More stories"
          right={<span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>weekly</span>}
        />

        <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {STORIES.map((s, i) => <StoryItem key={i} story={s}/>)}
        </div>
      </div>

      <PhoneTabBar active="home"/>
    </div>
  );
}

// ─── Top bar (V3) — quieter, no logo gradient ─────────────────────
function PhoneTopBarV3({ dateLabel, right }) {
  return (
    <div style={{
      padding: '6px 20px 12px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 17, color: NM.textBright, letterSpacing: -0.3 }}>
          NHL Momentum
        </div>
        <div style={{ fontSize: 10, color: NM.textMuted, fontWeight: 500, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 1 }}>
          {dateLabel}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {right}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={NM.text} strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="7"/>
          <path d="m20 20-4-4"/>
        </svg>
      </div>
    </div>
  );
}

// ─── Section heading (V3) — clean sans, no Fraunces ───────────────
function SectionHeadV3({ num, label, title, right }) {
  return (
    <div style={{ padding: '8px 20px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
        <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.4 }}>
          {num} · {label}
        </span>
        <div style={{ flex: 1 }}/>
        {right}
      </div>
      <div style={{
        fontFamily: NM.fontSans, fontWeight: 700, fontSize: 20, color: NM.textBright,
        letterSpacing: -0.4, lineHeight: 1.2,
      }}>
        {title}
      </div>
    </div>
  );
}

// ─── Result card (horizontal scroller) ────────────────────────────
function ResultCard({ result, onOpenPlayer }) {
  const r = result;
  const wAway = r.awayScore > r.homeScore;
  const player = r.headlinePlayer ? PLAYERS.find(p => p.id === r.headlinePlayer) : null;
  const heatPlayer = r.heatTopId ? PLAYERS.find(p => p.id === r.heatTopId) : null;
  const predictedPctWinner = Math.round(Math.max(r.predictedAway, r.predictedHome) * 100);

  return (
    <div style={{
      flexShrink: 0, width: 248, scrollSnapAlign: 'start',
      borderRadius: 12, background: NM.bgCard, border: `1px solid ${NM.borderSoft}`,
      overflow: 'hidden',
    }}>
      {/* Top: scoreline */}
      <div style={{ padding: '12px 14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {/* Pick result chip */}
          <span style={{
            fontFamily: NM.fontMono, fontSize: 9, fontWeight: 700, letterSpacing: 0.8,
            color: r.pickHit ? NM.rise : NM.cold,
            background: r.pickHit ? 'rgba(0,229,160,0.12)' : 'rgba(58,136,255,0.12)',
            padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase',
          }}>
            {r.pickHit ? '✓ Pick hit' : '✗ Miss'}
          </span>
          <div style={{ flex: 1 }}/>
          <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted }}>
            {predictedPctWinner}% predicted
          </span>
        </div>

        {/* Teams stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { code: r.away, score: r.awayScore, won: wAway },
            { code: r.home, score: r.homeScore, won: !wAway },
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TeamChip code={t.code} size={22} fontSize={9} radius={3}/>
              <span style={{
                flex: 1, fontSize: 13, fontWeight: t.won ? 700 : 500,
                color: t.won ? NM.textBright : NM.text, letterSpacing: -0.1,
              }}>
                {TEAMS[t.code]?.name || t.code}
              </span>
              <span style={{
                fontFamily: NM.fontMono, fontSize: 18, fontWeight: 700,
                color: t.won ? NM.textBright : NM.textMuted, letterSpacing: -0.5,
              }}>
                {t.score}
              </span>
              {t.won && <div style={{ width: 4, height: 4, borderRadius: 2, background: NM.rise }}/>}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: headline player */}
      {(player || heatPlayer) && (
        <button
          onClick={player ? onOpenPlayer : undefined}
          style={{
            width: '100%', textAlign: 'left',
            border: 0, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            background: NM.bg, cursor: player ? 'pointer' : 'default',
            borderTop: `1px solid ${NM.borderSoft}`,
          }}
        >
          {(player || heatPlayer) && (
            <Headshot player={player || heatPlayer} size={28}
              ring={(player || heatPlayer).heat >= 85 ? NM.heat : null}/>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: NM.textBright, letterSpacing: -0.1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {r.moment}
            </div>
            <div style={{ fontSize: 9, color: NM.textMuted, marginTop: 2, fontFamily: NM.fontMono }}>
              Top heat: <span style={{ color: heatColor(r.heatTopVal), fontWeight: 700 }}>{r.heatTopVal}</span>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}

// ─── Watch-pick card (marquee upcoming game) ──────────────────────
function WatchPickCard({ game, onOpenPlayer }) {
  const g = game;
  const awayPct = Math.round(g.awayWin * 100);
  const homePct = Math.round(g.homeWin * 100);
  const stars = g.starIds.map(id => PLAYERS.find(p => p.id === id)).filter(Boolean);
  const watchColor = g.watchScore >= 90 ? NM.heat : g.watchScore >= 75 ? '#ff8a47' : NM.gold;

  return (
    <div style={{
      borderRadius: 12, background: NM.bgCard,
      border: `1px solid ${NM.border}`, overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Watchability ribbon */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 2,
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 8px', borderRadius: 4,
        background: `${watchColor}22`,
        border: `1px solid ${watchColor}55`,
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill={watchColor}>
          <path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s-1-3 4-6Z"/>
        </svg>
        <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: watchColor, fontWeight: 700, letterSpacing: 0.4 }}>
          Watch {g.watchScore}
        </span>
      </div>

      <div style={{ padding: '14px 16px 14px' }}>
        {/* Time + tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.text, fontWeight: 600 }}>
            {g.time}
          </span>
          {g.rivalry && (
            <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.gold, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
              · rivalry
            </span>
          )}
        </div>

        {/* Big matchup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
            <TeamChip code={g.away} size={32} fontSize={11}/>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: NM.textBright, letterSpacing: -0.2 }}>
                {g.away}
              </div>
              <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, marginTop: 1 }}>
                {awayPct}%
              </div>
            </div>
          </div>
          <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, letterSpacing: 1 }}>at</span>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: NM.textBright, letterSpacing: -0.2 }}>
                {g.home}
              </div>
              <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, marginTop: 1 }}>
                {homePct}%
              </div>
            </div>
            <TeamChip code={g.home} size={32} fontSize={11}/>
          </div>
        </div>

        {/* Probability bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 4, marginBottom: 12 }}>
          <div style={{
            flex: g.awayWin, height: '100%', borderRadius: '3px 1px 1px 3px',
            background: g.awayWin > g.homeWin ? NM.rise : NM.borderSoft,
          }}/>
          <div style={{
            flex: g.homeWin, height: '100%', borderRadius: '1px 3px 3px 1px',
            background: g.homeWin > g.awayWin ? NM.rise : NM.borderSoft,
          }}/>
        </div>

        {/* Pitch */}
        <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.5, textWrap: 'pretty' }}>
          {g.pitch}
        </div>

        {/* Stars */}
        {stars.length > 0 && (
          <div style={{
            marginTop: 12, paddingTop: 12, borderTop: `1px solid ${NM.borderSoft}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 9, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', flexShrink: 0 }}>
              Watch for
            </span>
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
              {stars.map(p => (
                <button key={p.id}
                  onClick={p.id === 1 ? onOpenPlayer : undefined}
                  style={{
                    border: 0, cursor: p.id === 1 ? 'pointer' : 'default',
                    background: NM.bg, padding: '4px 8px 4px 4px', borderRadius: 999,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  <Headshot player={p} size={20} ring={p.heat >= 85 ? NM.heat : null}/>
                  <span style={{ fontSize: 10, fontWeight: 600, color: NM.textBright, whiteSpace: 'nowrap' }}>
                    {p.last}
                  </span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, fontWeight: 700, color: heatColor(p.heat) }}>
                    {p.heat}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Compact upcoming row (rest of the slate) ─────────────────────
function UpcomingRow({ game }) {
  const g = game;
  const awayPct = Math.round(g.awayWin * 100);
  const homePct = Math.round(g.homeWin * 100);
  const favoredHome = g.homeWin > g.awayWin;

  return (
    <div style={{
      padding: '12px 14px', background: NM.bgCard,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, width: 48, fontWeight: 600 }}>
        {g.time.replace(' PM','p').replace(' AM','a')}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <TeamChip code={g.away} size={20} fontSize={9}/>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, fontWeight: 600, color: favoredHome ? NM.textMuted : NM.textBright, width: 24 }}>
          {awayPct}
        </span>
        <span style={{ fontSize: 10, color: NM.textMuted }}>@</span>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, fontWeight: 600, color: favoredHome ? NM.textBright : NM.textMuted, width: 24, textAlign: 'right' }}>
          {homePct}
        </span>
        <TeamChip code={g.home} size={20} fontSize={9}/>
      </div>
      <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 600 }}>
        {Math.round(Math.max(g.awayWin, g.homeWin) * 100)}%
      </span>
    </div>
  );
}

// ─── Story item (newsroom, secondary) ─────────────────────────────
function StoryItem({ story }) {
  const accent = story.tag === 'fire' ? NM.heat
    : story.tag === 'cold' ? NM.cold
    : story.tag === 'rise' ? NM.rise
    : NM.story;
  const player = story.playerId ? PLAYERS.find(p => p.id === story.playerId) : null;

  return (
    <div style={{
      display: 'flex', gap: 12, padding: '12px 4px',
      borderBottom: `1px solid ${NM.borderSoft}`,
    }}>
      <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 8, overflow: 'hidden' }}>
        {player
          ? <PhotoPlaceholder w={64} h={64} subject={player.last} team={player.team}/>
          : <div style={{
              width: 64, height: 64,
              background: `linear-gradient(135deg, ${accent}44 0%, ${NM.bgCard} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: NM.fontSans, fontSize: 20, fontWeight: 800, color: accent, opacity: 0.6,
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
          fontFamily: NM.fontSans, fontWeight: 600, fontSize: 13,
          lineHeight: 1.3, letterSpacing: -0.1, color: NM.textBright,
          marginTop: 4, textWrap: 'pretty',
        }}>
          {story.headline}
        </div>
        <div style={{ fontSize: 11, color: NM.textMuted, marginTop: 3, fontFamily: NM.fontMono }}>
          {story.meta}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeV3, ResultCard, WatchPickCard, UpcomingRow, StoryItem, SectionHeadV3, PhoneTopBarV3 });
