// Homepage — SEASON START edition (October, opening weeks)
// Different content strategy: no history yet, so we lead with anticipation + last season's
// proven data + storylines. Heat is explicitly "warming up" with a sample-size caveat.

function SeasonBadge() {
  return (
    <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 700, letterSpacing: 1.2,
      padding: '3px 8px', background: NM.riseDim, borderRadius: 3, border: `1px solid ${NM.rise}55` }}>
      SEASON 2026–27 · WEEK 1
    </span>
  );
}

// ─── Value prop, season-start framing ───
function SeasonValueStrip() {
  return (
    <div style={{ background: `linear-gradient(90deg, ${NM.heatDim} 0%, transparent 65%)`,
      borderBottom: `1px solid ${NM.heat}33`, padding: '14px 48px',
      display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4 }}>NEW SEASON</span>
        <span style={{ fontSize: 14, color: NM.textBright, fontWeight: 500 }}>
          Momentum tracks <span style={{ color: NM.heat, fontWeight: 700 }}>every NHL player's form as a 0–100 Heat score</span> — plus a win prediction on every game. Follow along from night one.
        </span>
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.text }}>Last season: 67% pick accuracy</span>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700 }}>How it works →</span>
      </div>
    </div>
  );
}

// ─── Opening-night hero ───
function OpeningNightHero() {
  const openers = [
    { a: 'FLA', h: 'BOS', t: '7:00 PM', p: 'FLA', c: 56, note: 'Banner night in Boston', watch: 91 },
    { a: 'EDM', h: 'VAN', t: '10:00 PM', p: 'EDM', c: 61, note: 'McDavid opens on the road', watch: 88 },
    { a: 'TOR', h: 'MTL', t: '7:30 PM', p: 'TOR', c: 58, note: 'Original Six, night one', watch: 86 },
  ];
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${NM.borderSoft}` }}>
      <div style={{ position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 55% 75% at 72% 28%, rgba(255,90,36,0.24) 0%, transparent 62%),
                     radial-gradient(ellipse 45% 65% at 18% 70%, rgba(0,229,160,0.12) 0%, transparent 60%)` }}/>
      <div style={{ position: 'absolute', top: -70, right: 48, fontFamily: NM.fontDisplay, fontWeight: 900,
        fontSize: 300, color: 'rgba(255,255,255,0.035)', letterSpacing: -16, lineHeight: 0.85, pointerEvents: 'none' }}>
        01
      </div>

      <div style={{ position: 'relative', padding: '34px 48px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: NM.heat, boxShadow: `0 0 12px ${NM.heat}` }}/>
          <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 2 }}>OPENING NIGHT · TONIGHT · 3 GAMES</span>
          <SeasonBadge/>
          <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${NM.heat}44 0%, transparent 100%)` }}/>
        </div>

        <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 60, letterSpacing: -2.2, lineHeight: 0.96, color: NM.textBright, marginBottom: 14 }}>
          The season starts <span style={{ color: NM.heat }}>tonight.</span>
        </div>
        <div style={{ fontSize: 16, color: NM.text, lineHeight: 1.5, maxWidth: 720, marginBottom: 28 }}>
          Three games, three predictions. Heat resets tonight — by the end of week two every skater in the league will have a live form score again.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {openers.map((g, i) => (
            <div key={i} style={{ background: 'rgba(19,21,28,0.72)', backdropFilter: 'blur(10px)',
              border: `1px solid ${i === 0 ? NM.heat + '66' : NM.border}`, borderRadius: 14, padding: 20,
              boxShadow: i === 0 ? `0 0 26px ${NM.heat}22` : 'none', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 5,
                padding: '3px 8px', borderRadius: 4, background: `${NM.gold}22`, border: `1px solid ${NM.gold}55` }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.gold, fontWeight: 700 }}>WATCH {g.watch}</span>
              </div>
              <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>{g.t} ET</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <TeamBadge code={g.a} size={44} ringed={g.p === g.a}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>at</span>
                <TeamBadge code={g.h} size={44} ringed={g.p === g.h}/>
              </div>
              <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 15, color: NM.textBright, letterSpacing: -0.2, marginBottom: 6 }}>
                {g.note}
              </div>
              <div style={{ fontSize: 12, color: NM.text, marginBottom: 12 }}>Our pick: <b style={{ color: NM.heat }}>{g.p} {g.c}%</b></div>
              <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                <div style={{ flex: g.c, background: NM.heat }}/>
                <div style={{ flex: 100 - g.c, background: NM.borderSoft }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Cup odds / season predictions ───
function SeasonPredictions() {
  const cup = [
    { t: 'FLA', name: 'Panthers',  pct: 14.2 },
    { t: 'EDM', name: 'Oilers',    pct: 12.8 },
    { t: 'COL', name: 'Avalanche', pct: 10.1 },
    { t: 'DAL', name: 'Stars',     pct: 8.6 },
    { t: 'CAR', name: 'Hurricanes',pct: 7.4 },
    { t: 'VGK', name: 'Knights',   pct: 6.9 },
  ];
  const divisions = [
    { div: 'Atlantic',     t: 'FLA', pct: 38 },
    { div: 'Metropolitan', t: 'CAR', pct: 34 },
    { div: 'Central',      t: 'DAL', pct: 31 },
    { div: 'Pacific',      t: 'EDM', pct: 42 },
  ];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>PRESEASON MODEL</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -1, color: NM.textBright }}>Who wins the Cup?</div>
        </div>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>10,000 season simulations · updated daily</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        {/* Cup odds */}
        <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 14, padding: 22 }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 14 }}>STANLEY CUP ODDS · TOP 6</div>
          {cup.map((c, i) => (
            <div key={c.t} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
              borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
              <span style={{ width: 16, fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700 }}>{i + 1}</span>
              <TeamBadge code={c.t} size={26}/>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: NM.textBright }}>{c.name}</span>
              <div style={{ width: 160, height: 5, background: NM.borderSoft, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${(c.pct / 15) * 100}%`, height: '100%', background: i === 0 ? NM.heat : NM.text, borderRadius: 3 }}/>
              </div>
              <span style={{ fontFamily: NM.fontMono, fontSize: 13, fontWeight: 700, color: i === 0 ? NM.heat : NM.textBright, width: 48, textAlign: 'right' }}>{c.pct}%</span>
            </div>
          ))}
        </div>
        {/* Division picks */}
        <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 14, padding: 22 }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 14 }}>DIVISION WINNERS</div>
          {divisions.map((d, i) => (
            <div key={d.div} style={{ padding: '12px 0', borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <TeamBadge code={d.t} size={24}/>
                <span style={{ flex: 1, fontSize: 13, color: NM.textBright, fontWeight: 700 }}>{d.div}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.heat, fontWeight: 700 }}>{d.pct}%</span>
              </div>
              <div style={{ height: 4, background: NM.borderSoft, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${d.pct}%`, height: '100%', background: NM.heat, borderRadius: 2 }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Heat is warming up (sample-size honesty) ───
function HeatWarmingUp() {
  const returning = [
    { n: 'Connor McDavid',  t: 'EDM', last: 94, note: "Last season's Heat leader" },
    { n: 'Nathan MacKinnon', t: 'COL', last: 91, note: 'Art Ross winner' },
    { n: 'Auston Matthews',  t: 'TOR', last: 88, note: '58-goal season' },
    { n: 'David Pastrnak',   t: 'BOS', last: 86, note: '4th straight 100-pt year' },
  ];
  const breakouts = [
    { n: 'Macklin Celebrini', t: 'SJS', age: 20, note: 'Sophomore leap candidate' },
    { n: 'Connor Bedard',     t: 'CHI', age: 21, note: 'Year 3 — the jump?' },
    { n: 'Matvei Michkov',    t: 'PHI', age: 21, note: 'Highest upside in the league' },
    { n: 'Logan Cooley',      t: 'UTA', age: 22, note: 'Top-line minutes now' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>HEAT · WARMING UP</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -1, color: NM.textBright }}>Live scores start after game 3.</div>
        </div>
        <div style={{ padding: '10px 16px', background: NM.bgCard, border: `1px solid ${NM.gold}55`, borderRadius: 10, maxWidth: 380 }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.gold, fontWeight: 700, letterSpacing: 1.2, marginBottom: 4 }}>⚠ SMALL SAMPLE</div>
          <div style={{ fontSize: 11, color: NM.text, lineHeight: 1.45 }}>
            Heat needs 3 games to stabilise. Until then we show last season's finish and preseason projections.
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Returning leaders */}
        <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 14, padding: 22 }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 6 }}>WHERE THEY FINISHED</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 18, color: NM.textBright, letterSpacing: -0.4, marginBottom: 4 }}>Last season's hottest</div>
          <div style={{ fontSize: 11, color: NM.textMuted, marginBottom: 14 }}>Final 2025–26 Heat · a baseline to beat</div>
          {returning.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
              borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
              <span style={{ width: 14, fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700 }}>{i + 1}</span>
              <TeamBadge code={p.t} size={24}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: NM.textBright }}>{p.n}</div>
                <div style={{ fontSize: 10, color: NM.textMuted, marginTop: 1 }}>{p.note}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <HeatPill h={p.last} size="sm"/>
                <div style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.textMuted, fontWeight: 700, marginTop: 3, letterSpacing: 0.6 }}>FINAL '26</div>
              </div>
            </div>
          ))}
        </div>
        {/* Breakout watch */}
        <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 14, padding: 22 }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 700, letterSpacing: 1.2, marginBottom: 6 }}>PROJECTED BREAKOUTS</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 18, color: NM.textBright, letterSpacing: -0.4, marginBottom: 4 }}>Who jumps this year</div>
          <div style={{ fontSize: 11, color: NM.textMuted, marginBottom: 14 }}>Model's biggest projected Heat gains</div>
          {breakouts.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
              borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
              <TeamBadge code={p.t} size={24}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: NM.textBright }}>{p.n}</div>
                <div style={{ fontSize: 10, color: NM.textMuted, marginTop: 1 }}>{p.note}</div>
              </div>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 600 }}>age {p.age}</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 700, padding: '3px 7px',
                background: NM.riseDim, borderRadius: 3, border: `1px solid ${NM.rise}55` }}>↑ WATCH</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Storylines to follow ───
function SeasonStorylines() {
  const stories = [
    { kicker: 'SEASON PREVIEW', title: 'Can Florida repeat? The model says they\'re still the team to beat.',
      dek: 'Same core, same system, and the deepest blue line in the East. Our sim gives them 14.2% — highest in the league.', team: 'FLA', tag: 'CUP 14.2%' },
    { kicker: 'THE CHASE', title: 'McDavid needs 39 points to hit 1,000 before turning 30.',
      dek: 'He\'s the fastest to almost every milestone. This one is a formality — the question is the date.', team: 'EDM', tag: '961 PTS' },
    { kicker: 'REBUILD WATCH', title: 'Chicago\'s young core finally has NHL support around it.',
      dek: 'Three veteran signings changed the depth chart. Bedard should see cleaner ice.', team: 'CHI', tag: 'YEAR 3' },
    { kicker: 'RULE CHANGE', title: 'The new coach\'s challenge rules could swing tight games.',
      dek: 'Delayed offside reviews are gone. Expect fewer overturned goals and faster games.', team: 'BOS', tag: 'NEW' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.story, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>STORYLINES · 2026–27</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -1, color: NM.textBright }}>Eight months to follow.</div>
        </div>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.text }}>AI-assisted · refreshed weekly</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        {/* Lead */}
        <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ aspectRatio: '16/9', position: 'relative',
            background: `linear-gradient(155deg, ${TEAMS[stories[0].team].c}cc 0%, ${NM.bg} 100%)` }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: NM.fontMono, fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: 2 }}>HERO PHOTO</div>
            <div style={{ position: 'absolute', top: 14, left: 14 }}><TeamBadge code={stories[0].team} size={32}/></div>
            <div style={{ position: 'absolute', top: 14, right: 14, padding: '4px 10px', borderRadius: 999,
              background: 'rgba(255,90,36,0.85)', fontFamily: NM.fontMono, fontSize: 11, color: '#fff', fontWeight: 700 }}>
              ★ {stories[0].tag}
            </div>
          </div>
          <div style={{ padding: '20px 22px 22px' }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.story, fontWeight: 700, letterSpacing: 1.4, marginBottom: 10 }}>{stories[0].kicker}</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 26, letterSpacing: -0.8, color: NM.textBright, lineHeight: 1.15, marginBottom: 10, textWrap: 'pretty' }}>
              {stories[0].title}
            </div>
            <div style={{ fontSize: 14, color: NM.text, lineHeight: 1.55 }}>{stories[0].dek}</div>
            <div style={{ marginTop: 16, fontSize: 12, color: NM.heat, fontFamily: NM.fontMono, fontWeight: 700 }}>READ MORE →</div>
          </div>
        </div>
        {/* Rest */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stories.slice(1).map((s, i) => (
            <div key={i} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10,
              padding: 14, display: 'flex', gap: 12, flex: 1 }}>
              <div style={{ width: 80, aspectRatio: '1', borderRadius: 8, flexShrink: 0, position: 'relative',
                background: `linear-gradient(155deg, ${TEAMS[s.team].c}aa 0%, ${NM.bg} 100%)` }}>
                <div style={{ position: 'absolute', top: 6, left: 6 }}><TeamBadge code={s.team} size={18}/></div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.story, fontWeight: 700, letterSpacing: 1.2 }}>{s.kicker}</span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 600, padding: '1px 6px', background: NM.bg, borderRadius: 3 }}>{s.tag}</span>
                </div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 14, color: NM.textBright, lineHeight: 1.25, letterSpacing: -0.2, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: NM.textMuted, lineHeight: 1.45 }}>{s.dek}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── First week schedule ───
function FirstWeekSchedule() {
  const days = [
    { d: 'TONIGHT · OCT 7', games: [['FLA','BOS','7:00','FLA',56],['TOR','MTL','7:30','TOR',58],['EDM','VAN','10:00','EDM',61]] },
    { d: 'WED · OCT 8',     games: [['NYR','PIT','7:00','NYR',54],['CAR','NJD','7:30','CAR',57],['DAL','COL','9:00','COL',52],['VGK','SEA','10:00','VGK',60]] },
    { d: 'THU · OCT 9',     games: [['TBL','DET','7:00','TBL',55],['WPG','MIN','8:00','WPG',53]] },
  ];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>WEEK ONE</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -1, color: NM.textBright }}>First week, every pick.</div>
        </div>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 600 }}>FULL SCHEDULE →</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {days.map(day => (
          <div key={day.d} style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 12 }}>{day.d}</div>
            {day.games.map(([a, h, t, p, c], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0',
                borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <TeamBadge code={a} size={20} ringed={p === a}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted }}>@</span>
                <TeamBadge code={h} size={20} ringed={p === h}/>
                <span style={{ flex: 1 }}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700 }}>{p} {c}%</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, width: 34, textAlign: 'right' }}>{t}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════ DESKTOP ═══════════════════════
function DesktopHomeSeasonStart() {
  return (
    <DCArtboard label="Desktop · Homepage (SEASON START) · 1440" width={1440} height={3180}
      style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <BrandedHeaderDesktop active="Tonight" status={{ live: false, label: 'TONIGHT · 3' }}/>
      <SeasonValueStrip/>
      <OpeningNightHero/>
      <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 48 }}>
        <SeasonPredictions/>
        <HeatWarmingUp/>
        <SeasonStorylines/>
        <FirstWeekSchedule/>
        <ExploreStrip/>
      </div>
      <div style={{ padding: '24px 48px 32px', borderTop: `1px solid ${NM.borderSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, letterSpacing: 1, fontWeight: 600 }}>
          DATA · NHL Stats API · MoneyPuck · Natural Stat Trick · Evolving Hockey
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 11, color: NM.textMuted }}>
          <span>How Heat works</span><span>Methodology</span><span>API</span><span>Twitter</span>
        </div>
      </div>
    </DCArtboard>
  );
}

// ═══════════════════════ MOBILE ═══════════════════════
function MobileHomeSeasonStart() {
  return (
    <PhoneFrame label="Mobile · Homepage (SEASON START)" width={390} height={2760} statusBar={true}>
      <div style={{ background: NM.bg, color: NM.textBright, minHeight: '100%' }}>
        <BrandedHeaderMobile status={{ live: false, label: 'TONIGHT 3' }}/>

        {/* Value prop */}
        <div style={{ padding: '10px 16px', background: `linear-gradient(90deg, ${NM.heatDim} 0%, transparent 100%)`,
          borderBottom: `1px solid ${NM.heat}33` }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 4 }}>NEW SEASON · WEEK 1</div>
          <div style={{ fontSize: 11, color: NM.text, lineHeight: 1.45 }}>
            Every player gets a <span style={{ color: NM.heat, fontWeight: 700 }}>Heat score 0–100</span>. We pick every game. <span style={{ color: NM.text }}>Last season: 67%.</span>
          </div>
        </div>

        {/* Opening night hero */}
        <div style={{ position: 'relative', padding: '16px 16px 20px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 85% 60% at 80% 25%, rgba(255,90,36,0.2) 0%, transparent 62%)` }}/>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: NM.heat, boxShadow: `0 0 8px ${NM.heat}` }}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.4 }}>OPENING NIGHT · 3 GAMES</span>
            </div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 30, letterSpacing: -1.2, lineHeight: 0.98, marginBottom: 10 }}>
              The season starts <span style={{ color: NM.heat }}>tonight.</span>
            </div>
            <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.45, marginBottom: 16 }}>
              Three games, three predictions. Heat resets tonight and rebuilds over week one.
            </div>
            {[
              { a: 'FLA', h: 'BOS', t: '7:00 PM', p: 'FLA', c: 56, note: 'Banner night in Boston', watch: 91 },
              { a: 'EDM', h: 'VAN', t: '10:00 PM', p: 'EDM', c: 61, note: 'McDavid opens on the road', watch: 88 },
              { a: 'TOR', h: 'MTL', t: '7:30 PM', p: 'TOR', c: 58, note: 'Original Six, night one', watch: 86 },
            ].map((g, i) => (
              <div key={i} style={{ background: NM.bgCard, border: `1px solid ${i === 0 ? NM.heat + '66' : NM.borderSoft}`,
                borderRadius: 12, padding: 14, marginBottom: 8,
                boxShadow: i === 0 ? `0 0 14px ${NM.heat}22` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700 }}>{g.t}</span>
                  <span style={{ flex: 1 }}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.gold, fontWeight: 700, padding: '2px 6px',
                    background: `${NM.gold}22`, borderRadius: 3, border: `1px solid ${NM.gold}55` }}>WATCH {g.watch}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <TeamBadge code={g.a} size={30} ringed={g.p === g.a}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>at</span>
                  <TeamBadge code={g.h} size={30} ringed={g.p === g.h}/>
                  <span style={{ flex: 1 }}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700 }}>{g.p} {g.c}%</span>
                </div>
                <div style={{ fontSize: 12, color: NM.textBright, fontWeight: 600, marginBottom: 8 }}>{g.note}</div>
                <div style={{ height: 4, borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ flex: g.c, background: NM.heat }}/>
                  <div style={{ flex: 100 - g.c, background: NM.borderSoft }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cup odds */}
        <div style={{ padding: '4px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>PRESEASON MODEL</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, marginBottom: 4 }}>Who wins the Cup?</div>
          <div style={{ fontSize: 11, color: NM.textMuted, marginBottom: 12 }}>10,000 season simulations</div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: '6px 14px' }}>
            {[
              { t: 'FLA', name: 'Panthers',  pct: 14.2 },
              { t: 'EDM', name: 'Oilers',    pct: 12.8 },
              { t: 'COL', name: 'Avalanche', pct: 10.1 },
              { t: 'DAL', name: 'Stars',     pct: 8.6 },
              { t: 'CAR', name: 'Hurricanes',pct: 7.4 },
            ].map((c, i) => (
              <div key={c.t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <span style={{ width: 12, fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700 }}>{i + 1}</span>
                <TeamBadge code={c.t} size={22}/>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: NM.textBright }}>{c.name}</span>
                <div style={{ width: 54, height: 4, background: NM.borderSoft, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${(c.pct / 15) * 100}%`, height: '100%', background: i === 0 ? NM.heat : NM.text }}/>
                </div>
                <span style={{ fontFamily: NM.fontMono, fontSize: 12, fontWeight: 700, color: i === 0 ? NM.heat : NM.textBright, width: 40, textAlign: 'right' }}>{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Heat warming up */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>HEAT · WARMING UP</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, marginBottom: 10 }}>Live scores after game 3.</div>
          <div style={{ padding: '10px 12px', background: NM.bgCard, border: `1px solid ${NM.gold}55`, borderRadius: 8, marginBottom: 12 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.gold, fontWeight: 700, letterSpacing: 1.2, marginBottom: 4 }}>⚠ SMALL SAMPLE</div>
            <div style={{ fontSize: 11, color: NM.text, lineHeight: 1.45 }}>
              Heat needs 3 games to stabilise. Until then: last season's finish + projections.
            </div>
          </div>
          {/* Selector pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {[["Last season's hottest", NM.heat, true], ['Projected breakouts', NM.rise, false]].map(([l, c, active]) => (
              <span key={l} style={{ padding: '6px 11px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                color: active ? c : NM.text, background: active ? `${c}1a` : NM.bgCard,
                border: `1px solid ${active ? c + '55' : NM.border}` }}>{l}</span>
            ))}
          </div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: '6px 14px' }}>
            {[
              { n: 'Connor McDavid',   t: 'EDM', last: 94, note: "Last season's Heat leader" },
              { n: 'Nathan MacKinnon', t: 'COL', last: 91, note: 'Art Ross winner' },
              { n: 'Auston Matthews',  t: 'TOR', last: 88, note: '58-goal season' },
              { n: 'David Pastrnak',   t: 'BOS', last: 86, note: '4th straight 100-pt year' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <span style={{ width: 12, fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700 }}>{i + 1}</span>
                <TeamBadge code={p.t} size={22}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: NM.textBright }}>{p.n}</div>
                  <div style={{ fontSize: 9, color: NM.textMuted, marginTop: 1 }}>{p.note}</div>
                </div>
                <HeatPill h={p.last} size="sm"/>
              </div>
            ))}
          </div>
        </div>

        {/* Storylines */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.story, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>STORYLINES · 2026–27</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, marginBottom: 14 }}>Eight months to follow.</div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ aspectRatio: '16/9', position: 'relative',
              background: `linear-gradient(155deg, ${TEAMS.FLA.c}cc 0%, ${NM.bg} 100%)` }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: NM.fontMono, fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: 2 }}>HERO PHOTO</div>
              <div style={{ position: 'absolute', top: 10, left: 10 }}><TeamBadge code="FLA" size={24}/></div>
              <div style={{ position: 'absolute', top: 10, right: 10, padding: '3px 8px', borderRadius: 999,
                background: 'rgba(255,90,36,0.85)', fontFamily: NM.fontMono, fontSize: 9, color: '#fff', fontWeight: 700 }}>★ CUP 14.2%</div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.story, fontWeight: 700, letterSpacing: 1.2, marginBottom: 6 }}>SEASON PREVIEW</div>
              <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 17, letterSpacing: -0.4, lineHeight: 1.2, color: NM.textBright, textWrap: 'pretty' }}>
                Can Florida repeat? The model says they're still the team to beat.
              </div>
              <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.5, marginTop: 8 }}>
                Same core, same system, deepest blue line in the East. 14.2% — highest in the league.
              </div>
            </div>
          </div>
          {[
            { kicker: 'THE CHASE', title: 'McDavid needs 39 points for 1,000.', team: 'EDM', tag: '961 PTS' },
            { kicker: 'REBUILD', title: "Chicago's core finally has support.", team: 'CHI', tag: 'YEAR 3' },
          ].map((s, i) => (
            <div key={i} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10,
              padding: 12, marginBottom: 8, display: 'flex', gap: 10 }}>
              <div style={{ width: 56, height: 56, borderRadius: 6, flexShrink: 0, position: 'relative',
                background: `linear-gradient(155deg, ${TEAMS[s.team].c}aa 0%, ${NM.bg} 100%)` }}>
                <div style={{ position: 'absolute', top: 4, left: 4 }}><TeamBadge code={s.team} size={14}/></div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.story, fontWeight: 700, letterSpacing: 1 }}>{s.kicker}</span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.textMuted, padding: '1px 5px', background: NM.bg, borderRadius: 2 }}>{s.tag}</span>
                </div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 13, color: NM.textBright, lineHeight: 1.25, letterSpacing: -0.1 }}>{s.title}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Week one */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>WEEK ONE</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, marginBottom: 12 }}>First week, every pick.</div>
          {[
            { d: 'WED · OCT 8', games: [['NYR','PIT','7:00','NYR',54],['CAR','NJD','7:30','CAR',57],['DAL','COL','9:00','COL',52]] },
            { d: 'THU · OCT 9', games: [['TBL','DET','7:00','TBL',55],['WPG','MIN','8:00','WPG',53]] },
          ].map(day => (
            <div key={day.d} style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
              <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>{day.d}</div>
              {day.games.map(([a, h, t, p, c], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0',
                  borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                  <TeamBadge code={a} size={20} ringed={p === a}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted }}>@</span>
                  <TeamBadge code={h} size={20} ringed={p === h}/>
                  <span style={{ flex: 1 }}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700 }}>{p} {c}%</span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, width: 32, textAlign: 'right' }}>{t}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Explore */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>EXPLORE</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, marginBottom: 12 }}>More ways to dig in.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[['COMPARE','Player vs player',NM.heat],['HEAT MAP','All 312',NM.cold],['STORIES','AI archive',NM.story],['ACCURACY',"How we're doing",NM.rise]].map(([k, t, c]) => (
              <div key={k} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: c, fontWeight: 700, letterSpacing: 1.2, marginBottom: 4 }}>{k}</div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 13, color: NM.textBright }}>{t}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '20px 16px 24px', marginTop: 14, borderTop: `1px solid ${NM.borderSoft}` }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, letterSpacing: 1, fontWeight: 600 }}>
            DATA · NHL Stats API · MoneyPuck · Natural Stat Trick
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

Object.assign(window, {
  DesktopHomeSeasonStart, MobileHomeSeasonStart,
  SeasonValueStrip, OpeningNightHero, SeasonPredictions, HeatWarmingUp, SeasonStorylines, FirstWeekSchedule,
});
