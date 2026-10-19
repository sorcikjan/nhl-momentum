// Homepage Final — communicates the value, hooks new users, surfaces every story we have.
// Desktop + Mobile. Two hero modes (regular / playoffs) via prop.

// ─── VALUE PROP BAR (the "what is this?" hook) ───
function ValuePropStrip() {
  return (
    <div style={{
      background: `linear-gradient(90deg, ${NM.heatDim} 0%, transparent 60%)`,
      borderBottom: `1px solid ${NM.heat}33`, padding: '14px 48px',
      display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4 }}>NEW HERE?</span>
        <span style={{ fontSize: 14, color: NM.textBright, fontWeight: 500 }}>
          Momentum gives every NHL player a <span style={{ color: NM.heat, fontWeight: 700 }}>Heat score from 0 to 100</span>, updated every game. See who's burning, who's cooling, and which games tonight are worth watching.
        </span>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.text }}>67% pick accuracy · YTD</span>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700 }}>How it works →</span>
      </div>
    </div>
  );
}

// ─── PLAYOFFS HERO ───
function PlayoffsHero() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${NM.borderSoft}` }}>
      <div style={{ position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 60% 80% at 70% 30%, rgba(255,90,36,0.25) 0%, transparent 60%),
                     radial-gradient(ellipse 50% 70% at 20% 60%, rgba(229,80,139,0.15) 0%, transparent 60%)` }}/>
      <div style={{ position: 'absolute', top: -100, right: 60, fontFamily: NM.fontDisplay, fontWeight: 900,
        fontSize: 380, color: 'rgba(255,255,255,0.04)', letterSpacing: -18, lineHeight: 0.85, pointerEvents: 'none' }}>
        PO
      </div>

      <div style={{ position: 'relative', padding: '36px 48px 40px' }}>
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: NM.heat, boxShadow: `0 0 12px ${NM.heat}` }}/>
          <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 2 }}>
            STANLEY CUP PLAYOFFS · ROUND 2 · NIGHT 4
          </span>
          <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${NM.heat}55 0%, transparent 100%)` }}/>
        </div>

        {/* Headline */}
        <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 64, letterSpacing: -2.4, lineHeight: 0.95, color: NM.textBright, marginBottom: 14 }}>
          Game 4 tonight: <span style={{ color: NM.heat }}>Oilers lead 2–1.</span>
        </div>
        <div style={{ fontSize: 16, color: NM.text, lineHeight: 1.5, maxWidth: 700, marginBottom: 28 }}>
          McDavid has 7 points in 3 games. Colorado's defense is leaking on the rush. We've got the Oilers at <b style={{ color: NM.textBright }}>58% to win tonight</b> — and 64% to take the series.
        </div>

        {/* Series + tonight grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
          {/* Series card */}
          <div style={{ background: 'rgba(19,21,28,0.7)', backdropFilter: 'blur(10px)', border: `1px solid ${NM.heat}55`,
            borderRadius: 14, padding: 24, boxShadow: `0 0 32px ${NM.heat}22` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4 }}>SECOND ROUND · WEST</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>BEST OF 7</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                <TeamBadge code="EDM" size={64}/>
                <div>
                  <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 28, color: NM.textBright, letterSpacing: -0.6, lineHeight: 1 }}>Oilers</div>
                  <div style={{ fontSize: 11, color: NM.heat, fontFamily: NM.fontMono, fontWeight: 700, marginTop: 4 }}>LEADS SERIES</div>
                </div>
              </div>
              <div style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 80, color: NM.textBright, letterSpacing: -3, lineHeight: 1 }}>
                2<span style={{ color: NM.textMuted, margin: '0 8px' }}>–</span><span style={{ color: NM.textMuted }}>1</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 28, color: NM.text, letterSpacing: -0.6, lineHeight: 1 }}>Avalanche</div>
                  <div style={{ fontSize: 11, color: NM.textMuted, fontFamily: NM.fontMono, fontWeight: 700, marginTop: 4 }}>TRAILS</div>
                </div>
                <TeamBadge code="COL" size={64}/>
              </div>
            </div>
            {/* Game-by-game */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { g: 1, w: 'COL', s: '4-3' },
                { g: 2, w: 'EDM', s: '5-2' },
                { g: 3, w: 'EDM', s: '4-1' },
                { g: 4, w: null,  s: 'tonight' },
                { g: 5, w: null,  s: '—' },
                { g: 6, w: null,  s: '—' },
                { g: 7, w: null,  s: '—' },
              ].map(gm => (
                <div key={gm.g} style={{ flex: 1, padding: '10px 6px', borderRadius: 8, textAlign: 'center',
                  background: gm.w ? NM.bg : 'transparent', border: `1px solid ${gm.s === 'tonight' ? NM.heat : NM.borderSoft}`,
                  boxShadow: gm.s === 'tonight' ? `0 0 14px ${NM.heat}55` : 'none' }}>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 0.6 }}>G{gm.g}</div>
                  <div style={{ fontSize: 11, fontWeight: 700,
                    color: gm.s === 'tonight' ? NM.heat : (gm.w ? NM.textBright : NM.textMuted), marginTop: 4 }}>
                    {gm.w || (gm.s === 'tonight' ? 'TONIGHT' : '—')}
                  </div>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, marginTop: 2 }}>{gm.w ? gm.s : ''}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tonight predictions card */}
          <div style={{ background: 'rgba(19,21,28,0.7)', backdropFilter: 'blur(10px)', border: `1px solid ${NM.border}`,
            borderRadius: 14, padding: 24 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 12 }}>TONIGHT · GAME 4</div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: NM.text }}>Win probability</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>EDM @ COL · 8:00 PM</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 26, color: NM.heat }}>EDM 58%</span>
                <span style={{ fontFamily: NM.fontSans, fontWeight: 600, fontSize: 18, color: NM.textMuted }}>COL 42%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                <div style={{ flex: 58, background: NM.heat }}/>
                <div style={{ flex: 42, background: NM.borderSoft }}/>
              </div>
            </div>
            <div style={{ paddingTop: 14, borderTop: `1px solid ${NM.borderSoft}` }}>
              <div style={{ fontSize: 12, color: NM.textMuted, marginBottom: 8 }}>Series odds</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textBright, fontWeight: 700, width: 36 }}>EDM</span>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: NM.borderSoft, overflow: 'hidden' }}>
                  <div style={{ width: '64%', height: '100%', background: NM.heat }}/>
                </div>
                <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.heat, fontWeight: 700, width: 36, textAlign: 'right' }}>64%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.text, fontWeight: 700, width: 36 }}>COL</span>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: NM.borderSoft, overflow: 'hidden' }}>
                  <div style={{ width: '36%', height: '100%', background: NM.text }}/>
                </div>
                <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.text, fontWeight: 700, width: 36, textAlign: 'right' }}>36%</span>
              </div>
            </div>
          </div>
        </div>

        {/* All series strip */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.4, marginBottom: 10 }}>OTHER SERIES · ROUND 2</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { a: 'TOR', h: 'FLA', sa: 2, sh: 1, next: 'Game 4 · Wed', leadA: true },
              { a: 'NYR', h: 'CAR', sa: 1, sh: 2, next: 'Game 4 · Wed', leadA: false },
              { a: 'WPG', h: 'VGK', sa: 0, sh: 3, next: 'Game 4 · Thu', leadA: false },
            ].map((s, i) => (
              <div key={i} style={{ padding: 14, background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TeamBadge code={s.a} size={26} ringed={s.leadA}/>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 18, fontWeight: 800, color: s.leadA ? NM.textBright : NM.textMuted }}>{s.sa}</span>
                  </div>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>–</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 18, fontWeight: 800, color: !s.leadA ? NM.textBright : NM.textMuted }}>{s.sh}</span>
                    <TeamBadge code={s.h} size={26} ringed={!s.leadA}/>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: NM.textMuted, fontFamily: NM.fontMono, marginTop: 6, textAlign: 'center' }}>{s.next}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ARTICLE GRID (last night stories) ───
function ArticleGrid() {
  const lead = {
    kicker: 'LAST NIGHT · BIG STORY',
    title: 'McDavid put on a clinic. Oilers move within 2 of the Cup.',
    dek: 'Three goals in 18 minutes, including the dagger. His Heat is at 94 — the highest of any player in the playoffs.',
    team: 'EDM', tag: 'HEAT 94',
  };
  const others = [
    { kicker: 'GOALTENDING', title: 'Bobrovsky\'s save percentage is .938 in the playoffs.', dek: 'Florida\'s veteran is having his best postseason in a Panthers uniform.', team: 'FLA', tag: 'SV% .938' },
    { kicker: 'BREAKOUT',    title: 'How a 4th-line center became the X-factor.', dek: 'Nick Cousins is averaging 18 minutes a game and making the most of every shift.', team: 'FLA', tag: 'TOI ↑6:00' },
    { kicker: 'COLD',        title: 'Carolina\'s power play has gone dry — and it\'s costing them.', dek: '0-for-19 over the last two games. The model says it can\'t last.', team: 'CAR', tag: 'PP 0%' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>STORIES · LAST NIGHT</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -1, color: NM.textBright }}>The night in 4 stories.</div>
        </div>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.text }}>AI-assisted · written 6:14 AM</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        {/* Lead */}
        <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ aspectRatio: '16/9', position: 'relative', overflow: 'hidden',
            background: `linear-gradient(155deg, ${TEAMS[lead.team].c}cc 0%, ${NM.bg} 100%)` }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: NM.fontMono, fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 2 }}>
              HERO PHOTO
            </div>
            <div style={{ position: 'absolute', top: 14, left: 14 }}><TeamBadge code={lead.team} size={32}/></div>
            <div style={{ position: 'absolute', top: 14, right: 14, padding: '4px 10px', borderRadius: 999,
              background: 'rgba(255,90,36,0.85)', fontFamily: NM.fontMono, fontSize: 11, color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}>
              ★ {lead.tag}
            </div>
          </div>
          <div style={{ padding: '20px 22px 22px', flex: 1 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 10 }}>{lead.kicker}</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 26, letterSpacing: -0.8, color: NM.textBright, lineHeight: 1.15, marginBottom: 10, textWrap: 'pretty' }}>
              {lead.title}
            </div>
            <div style={{ fontSize: 14, color: NM.text, lineHeight: 1.55 }}>{lead.dek}</div>
            <div style={{ marginTop: 16, fontSize: 12, color: NM.heat, fontFamily: NM.fontMono, fontWeight: 700, letterSpacing: 0.5 }}>READ MORE →</div>
          </div>
        </div>

        {/* Sidebar 3 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {others.map((s, i) => (
            <div key={i} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10,
              padding: 14, display: 'flex', gap: 12, flex: 1 }}>
              <div style={{ width: 80, aspectRatio: '1', borderRadius: 8, flexShrink: 0,
                background: `linear-gradient(155deg, ${TEAMS[s.team].c}aa 0%, ${NM.bg} 100%)`, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 6, left: 6 }}><TeamBadge code={s.team} size={18}/></div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.2 }}>{s.kicker}</span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 600, padding: '1px 6px', background: NM.bg, borderRadius: 3 }}>{s.tag}</span>
                </div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 14, color: NM.textBright, lineHeight: 1.25, letterSpacing: -0.2, marginBottom: 4 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 11, color: NM.textMuted, lineHeight: 1.45 }}>{s.dek}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RESULTS GRID (yesterday's games — predictions + outcomes) ───
function ResultsSection() {
  const results = [
    { a: 'EDM', h: 'COL', as: 4, hs: 1, pred: 'EDM', conf: 58, hit: true,  star: 'McDavid', sh: 94 },
    { a: 'FLA', h: 'TOR', as: 3, hs: 2, pred: 'FLA', conf: 54, hit: true,  star: 'Tkachuk', sh: 82 },
    { a: 'CAR', h: 'NYR', as: 2, hs: 4, pred: 'CAR', conf: 56, hit: false, star: 'Shesterkin', sh: 88 },
    { a: 'VGK', h: 'WPG', as: 5, hs: 2, pred: 'VGK', conf: 61, hit: true,  star: 'Eichel', sh: 79 },
  ];
  const hits = results.filter(r => r.hit).length;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>YESTERDAY · 4 GAMES</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -1, color: NM.textBright }}>Results & predictions.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10 }}>
          <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1 }}>WE GOT</span>
          <span style={{ fontFamily: NM.fontMono, fontSize: 22, color: NM.rise, fontWeight: 800, letterSpacing: -0.5 }}>{hits}/{results.length}</span>
          <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.text, fontWeight: 600 }}>right · {Math.round(hits/results.length*100)}%</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {results.map((r, i) => (
          <div key={i} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 12, overflow: 'hidden' }}>
            {/* Prediction header */}
            <div style={{ padding: '8px 14px', background: r.hit ? `${NM.rise}1a` : `${NM.cold}1a`,
              borderBottom: `1px solid ${r.hit ? NM.rise + '33' : NM.cold + '33'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: r.hit ? NM.rise : NM.cold, fontWeight: 700, letterSpacing: 1 }}>
                {r.hit ? '✓ PICK HIT' : '✗ PICK MISS'}
              </span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.text, fontWeight: 600 }}>{r.pred} {r.conf}%</span>
            </div>
            {/* Score */}
            <div style={{ padding: '16px 16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <TeamBadge code={r.a} size={26}/>
                <span style={{ flex: 1, fontWeight: r.as > r.hs ? 700 : 500, fontSize: 13, color: r.as > r.hs ? NM.textBright : NM.text }}>
                  {TEAMS[r.a]?.name || r.a}
                </span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 22, fontWeight: 800, color: r.as > r.hs ? NM.textBright : NM.textMuted, letterSpacing: -0.5 }}>{r.as}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TeamBadge code={r.h} size={26}/>
                <span style={{ flex: 1, fontWeight: r.hs > r.as ? 700 : 500, fontSize: 13, color: r.hs > r.as ? NM.textBright : NM.text }}>
                  {TEAMS[r.h]?.name || r.h}
                </span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 22, fontWeight: 800, color: r.hs > r.as ? NM.textBright : NM.textMuted, letterSpacing: -0.5 }}>{r.hs}</span>
              </div>
            </div>
            {/* Star */}
            <div style={{ padding: '10px 14px', borderTop: `1px solid ${NM.borderSoft}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1 }}>★</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: NM.textBright, flex: 1 }}>{r.star}</span>
              <HeatPill h={r.sh} size="sm"/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TRIPLE RANKINGS (Heat / Goalies / Fresh faces) ───
function TripleRankings() {
  const heatList = [
    { n: 'McDavid',  t: 'EDM', val: 94 },
    { n: 'Pastrnak', t: 'BOS', val: 88 },
    { n: 'MacKinnon',t: 'COL', val: 85 },
    { n: 'Matthews', t: 'TOR', val: 82 },
    { n: 'Kaprizov', t: 'MIN', val: 80 },
  ];
  const goalies = [
    { n: 'Bobrovsky', t: 'FLA', sv: '.938', val: 92 },
    { n: 'Shesterkin',t: 'NYR', sv: '.928', val: 88 },
    { n: 'Swayman',   t: 'BOS', sv: '.924', val: 85 },
    { n: 'Hellebuyck',t: 'WPG', sv: '.918', val: 79 },
    { n: 'Saros',     t: 'NSH', sv: '.916', val: 76 },
  ];
  const fresh = [
    { n: 'Celebrini', t: 'SJS', age: 19, val: 71 },
    { n: 'Bedard',    t: 'CHI', age: 20, val: 68 },
    { n: 'Carlsson',  t: 'ANA', age: 20, val: 64 },
    { n: 'Wood',      t: 'NJD', age: 22, val: 62 },
    { n: 'Cooley',    t: 'UTA', age: 21, val: 58 },
  ];

  const Column = ({ kicker, title, sub, color, list, valLabel, extraCol }) => (
    <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 14, padding: 22 }}>
      <div style={{ fontFamily: NM.fontMono, fontSize: 10, color, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>{kicker}</div>
      <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 20, letterSpacing: -0.5, color: NM.textBright, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: NM.textMuted, marginBottom: 16 }}>{sub}</div>
      {list.map((p, i) => {
        const c = heatColor(p.val);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
            borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
            <span style={{ width: 16, fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700 }}>{i + 1}</span>
            <TeamBadge code={p.t} size={24}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: NM.textBright }}>{p.n}</div>
              {extraCol && <div style={{ fontSize: 10, color: NM.textMuted, fontFamily: NM.fontMono, marginTop: 1 }}>{extraCol(p)}</div>}
            </div>
            <HeatPill h={p.val} size="sm"/>
          </div>
        );
      })}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${NM.borderSoft}`, fontSize: 11, color, fontWeight: 600, fontFamily: NM.fontMono, letterSpacing: 0.5 }}>
        FULL LIST →
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>RANKINGS · LIVE</div>
        <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -1, color: NM.textBright }}>Who's hot. Right now.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Column kicker="HEAT · TOP 5" title="Hottest skaters" sub="Last 5 games · all positions" color={NM.heat} list={heatList} extraCol={p => `Forward`}/>
        <Column kicker="GOALIES · TOP 5" title="Best in net" sub="Save % last 5 starts" color={NM.cold} list={goalies} extraCol={p => `SV% ${p.sv}`}/>
        <Column kicker="FRESH FACES · TOP 5" title="Rookies on the rise" sub="Under 23, breakout pace" color={NM.rise} list={fresh} extraCol={p => `Age ${p.age}`}/>
      </div>
    </div>
  );
}

// ─── TONIGHT'S SLATE (compact predictions list) ───
function TonightSlate() {
  const games = [
    { a: 'EDM', h: 'COL', t: '8:00 PM', pred: 'EDM', c: 58, watch: 'McDavid · 94' },
    { a: 'TOR', h: 'FLA', t: '7:00 PM', pred: 'FLA', c: 54, watch: 'Tkachuk · 82' },
    { a: 'NYR', h: 'CAR', t: '7:30 PM', pred: 'CAR', c: 53, watch: 'Aho · 79' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>TONIGHT · 3 GAMES</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -1, color: NM.textBright }}>What's on tonight.</div>
        </div>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 600 }}>FULL SCHEDULE →</span>
      </div>
      <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {games.map((g, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 240px 200px 40px',
            gap: 16, padding: '18px 24px', alignItems: 'center',
            borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
            <span style={{ fontFamily: NM.fontMono, fontSize: 13, color: NM.textBright, fontWeight: 600 }}>{g.t}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TeamBadge code={g.a} size={32} ringed={g.pred === g.a}/>
              <span style={{ fontWeight: 700, fontSize: 15, color: NM.textBright }}>{TEAMS[g.a]?.name || g.a}</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, margin: '0 6px' }}>at</span>
              <TeamBadge code={g.h} size={32} ringed={g.pred === g.h}/>
              <span style={{ fontWeight: 700, fontSize: 15, color: NM.textBright }}>{TEAMS[g.h]?.name || g.h}</span>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700 }}>{g.pred} {g.c}%</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 600 }}>{g.pred === g.a ? g.h : g.a} {100-g.c}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                <div style={{ flex: g.c, background: NM.heat }}/>
                <div style={{ flex: 100-g.c, background: NM.borderSoft }}/>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.5, marginBottom: 2 }}>WATCH FOR</div>
              <div style={{ fontSize: 13, color: NM.textBright, fontWeight: 600 }}>{g.watch}</div>
            </div>
            <span style={{ color: NM.textMuted, fontSize: 18 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EXPLORE STRIP (quick links to other tools) ───
function ExploreStrip() {
  const items = [
    { k: 'COMPARE', t: 'Player vs player', s: 'Side by side. Heat, stats, advanced metrics.', c: NM.heat },
    { k: 'HEAT MAP', t: 'All 312 skaters', s: 'Live grid. Filter by team, position, streak.', c: NM.cold },
    { k: 'STORIES', t: 'AI archive', s: 'Every story we\'ve written. Searchable.', c: NM.story },
    { k: 'ACCURACY', t: 'How we\'re doing', s: 'Pick history, model drift, calibration.', c: NM.rise },
  ];
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>EXPLORE</div>
        <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 28, letterSpacing: -0.8, color: NM.textBright }}>More ways to dig in.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {items.map(it => (
          <div key={it.k} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 12, padding: '20px 22px',
            display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: it.c, fontWeight: 700, letterSpacing: 1.4 }}>{it.k}</span>
            <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 20, color: NM.textBright, letterSpacing: -0.4 }}>{it.t}</span>
            <span style={{ fontSize: 12, color: NM.text, lineHeight: 1.5 }}>{it.s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════ DESKTOP ═══════════════════════
function DesktopHomeFinal({ playoffs = true }) {
  return (
    <DCArtboard label={`Desktop · Homepage${playoffs ? ' (playoffs)' : ''} · 1440`} width={1440} height={playoffs ? 3080 : 2400}
      style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <BrandedHeaderDesktop active="Tonight"/>
      <ValuePropStrip/>
      {playoffs ? <PlayoffsHero/> : (
        <div style={{ padding: '36px 48px' }}>
          <TonightSlate/>
        </div>
      )}
      <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 48 }}>
        <ResultsSection/>
        <ArticleGrid/>
        <TripleRankings/>
        {playoffs && <TonightSlate/>}
        <ExploreStrip/>
      </div>
      {/* Trust footer */}
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
function MobileHomeFinal({ playoffs = true }) {
  return (
    <PhoneFrame label={`Mobile · Homepage${playoffs ? ' (playoffs)' : ''}`} width={390} height={playoffs ? 2800 : 2200} statusBar={true}>
      <div style={{ background: NM.bg, color: NM.textBright, minHeight: '100%' }}>
        <BrandedHeaderMobile/>

        {/* Value prop bar */}
        <div style={{ padding: '10px 16px', background: `linear-gradient(90deg, ${NM.heatDim} 0%, transparent 100%)`,
          borderBottom: `1px solid ${NM.heat}33` }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 4 }}>NEW HERE?</div>
          <div style={{ fontSize: 11, color: NM.text, lineHeight: 1.4 }}>
            Every player gets a <span style={{ color: NM.heat, fontWeight: 700 }}>Heat score 0–100</span>. We pick tonight's games. <span style={{ color: NM.heat, fontWeight: 700 }}>67% accuracy.</span>
          </div>
        </div>

        {/* Playoffs hero */}
        {playoffs && (
          <div style={{ position: 'relative', padding: '16px 16px 20px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 60% at 80% 30%, rgba(255,90,36,0.18) 0%, transparent 60%)` }}/>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: NM.heat, boxShadow: `0 0 8px ${NM.heat}` }}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.4 }}>STANLEY CUP · R2 · NIGHT 4</span>
              </div>
              <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 26, letterSpacing: -1, lineHeight: 0.95, marginBottom: 8 }}>
                Game 4: <span style={{ color: NM.heat }}>Oilers lead 2–1.</span>
              </div>
              <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.4, marginBottom: 14 }}>
                We've got EDM at <b style={{ color: NM.textBright }}>58% tonight</b>, 64% to take the series.
              </div>
              {/* Series card */}
              <div style={{ background: NM.bgCard, border: `1px solid ${NM.heat}55`, borderRadius: 12, padding: 14, boxShadow: `0 0 18px ${NM.heat}22` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TeamBadge code="EDM" size={36}/>
                    <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 16, color: NM.textBright }}>EDM</span>
                  </div>
                  <span style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 40, color: NM.textBright, letterSpacing: -1.5, lineHeight: 1 }}>
                    2<span style={{ color: NM.textMuted, margin: '0 4px' }}>–</span><span style={{ color: NM.textMuted }}>1</span>
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 16, color: NM.text }}>COL</span>
                    <TeamBadge code="COL" size={36}/>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[{g:1,w:'COL'},{g:2,w:'EDM'},{g:3,w:'EDM'},{g:4,t:true},{g:5},{g:6},{g:7}].map(gm => (
                    <div key={gm.g} style={{ flex: 1, padding: '6px 0', borderRadius: 4, textAlign: 'center',
                      background: gm.w ? NM.bg : 'transparent', border: `1px solid ${gm.t ? NM.heat : NM.borderSoft}` }}>
                      <div style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.textMuted, fontWeight: 700 }}>G{gm.g}</div>
                      <div style={{ fontFamily: NM.fontMono, fontSize: 8, fontWeight: 700, color: gm.t ? NM.heat : (gm.w ? NM.textBright : NM.textMuted), marginTop: 2 }}>
                        {gm.w || (gm.t ? '●' : '—')}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${NM.borderSoft}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700 }}>EDM 58%</span>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 600 }}>COL 42%</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ flex: 58, background: NM.heat }}/>
                    <div style={{ flex: 42, background: NM.borderSoft }}/>
                  </div>
                </div>
              </div>

              {/* Other series mini */}
              <div style={{ marginTop: 14, fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.4, marginBottom: 8 }}>OTHER SERIES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { a: 'TOR', h: 'FLA', sa: 2, sh: 1, leadA: true },
                  { a: 'NYR', h: 'CAR', sa: 1, sh: 2, leadA: false },
                  { a: 'WPG', h: 'VGK', sa: 0, sh: 3, leadA: false },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 8 }}>
                    <TeamBadge code={s.a} size={20} ringed={s.leadA}/>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 14, fontWeight: 800, color: s.leadA ? NM.textBright : NM.textMuted }}>{s.sa}</span>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted }}>–</span>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 14, fontWeight: 800, color: !s.leadA ? NM.textBright : NM.textMuted }}>{s.sh}</span>
                    <TeamBadge code={s.h} size={20} ringed={!s.leadA}/>
                    <span style={{ flex: 1 }}/>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>Game 4 →</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>YESTERDAY · 4 GAMES</div>
              <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6 }}>Results.</div>
            </div>
            <div style={{ padding: '6px 10px', background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 8 }}>
              <span style={{ fontFamily: NM.fontMono, fontSize: 14, color: NM.rise, fontWeight: 800 }}>3/4</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.text, marginLeft: 4 }}>· 75%</span>
            </div>
          </div>
          {[
            { a: 'EDM', h: 'COL', as: 4, hs: 1, pred: 'EDM', conf: 58, hit: true,  star: 'McDavid', sh: 94 },
            { a: 'FLA', h: 'TOR', as: 3, hs: 2, pred: 'FLA', conf: 54, hit: true,  star: 'Tkachuk', sh: 82 },
            { a: 'CAR', h: 'NYR', as: 2, hs: 4, pred: 'CAR', conf: 56, hit: false, star: 'Shesterkin', sh: 88 },
            { a: 'VGK', h: 'WPG', as: 5, hs: 2, pred: 'VGK', conf: 61, hit: true,  star: 'Eichel', sh: 79 },
          ].map((r, i) => (
            <div key={i} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`,
              borderRadius: 10, padding: '10px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 24, fontFamily: NM.fontMono, fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                color: r.hit ? NM.rise : NM.cold, padding: '2px 4px', background: r.hit ? NM.riseDim : 'rgba(58,136,255,0.1)',
                borderRadius: 3, textAlign: 'center' }}>
                {r.hit ? '✓' : '✗'}
              </div>
              <TeamBadge code={r.a} size={22}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 14, fontWeight: 700, color: r.as > r.hs ? NM.textBright : NM.textMuted, width: 16, textAlign: 'right' }}>{r.as}</span>
              <span style={{ fontSize: 9, color: NM.textMuted }}>–</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 14, fontWeight: 700, color: r.hs > r.as ? NM.textBright : NM.textMuted, width: 16 }}>{r.hs}</span>
              <TeamBadge code={r.h} size={22}/>
              <span style={{ flex: 1 }}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700 }}>{r.pred} {r.conf}%</span>
              <HeatPill h={r.sh} size="sm"/>
            </div>
          ))}
        </div>

        {/* ARTICLES */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>STORIES · LAST NIGHT</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, marginBottom: 14 }}>The night in stories.</div>
          {/* Lead */}
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ aspectRatio: '16/9', position: 'relative',
              background: `linear-gradient(155deg, ${TEAMS.EDM.c}cc 0%, ${NM.bg} 100%)` }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: NM.fontMono, fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 2 }}>HERO PHOTO</div>
              <div style={{ position: 'absolute', top: 10, left: 10 }}><TeamBadge code="EDM" size={24}/></div>
              <div style={{ position: 'absolute', top: 10, right: 10, padding: '3px 8px', borderRadius: 999,
                background: 'rgba(255,90,36,0.85)', fontFamily: NM.fontMono, fontSize: 9, color: '#fff', fontWeight: 700 }}>★ HEAT 94</div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 6 }}>LAST NIGHT · BIG STORY</div>
              <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 18, letterSpacing: -0.4, lineHeight: 1.2, color: NM.textBright, textWrap: 'pretty' }}>
                McDavid put on a clinic. Oilers move within 2 of the Cup.
              </div>
              <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.5, marginTop: 8 }}>
                Three goals in 18 minutes. His Heat is at 94 — the highest of any playoff player.
              </div>
            </div>
          </div>
          {[
            { kicker: 'GOALTENDING', title: 'Bobrovsky\'s save % is .938.', team: 'FLA', tag: '.938' },
            { kicker: 'BREAKOUT',    title: 'A 4th-line center became the X-factor.', team: 'FLA', tag: 'TOI +6' },
          ].map((s, i) => (
            <div key={i} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10, padding: 12, marginBottom: 8, display: 'flex', gap: 10 }}>
              <div style={{ width: 56, height: 56, borderRadius: 6, flexShrink: 0,
                background: `linear-gradient(155deg, ${TEAMS[s.team].c}aa 0%, ${NM.bg} 100%)`, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 4, left: 4 }}><TeamBadge code={s.team} size={14}/></div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.heat, fontWeight: 700, letterSpacing: 1 }}>{s.kicker}</span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.textMuted, padding: '1px 5px', background: NM.bg, borderRadius: 2 }}>{s.tag}</span>
                </div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 13, color: NM.textBright, lineHeight: 1.25, letterSpacing: -0.1 }}>{s.title}</div>
              </div>
            </div>
          ))}
        </div>

        {/* RANKINGS — stacked vertically on mobile */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>RANKINGS · LIVE</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, marginBottom: 14 }}>Who's hot right now.</div>
          {/* Pills selector */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflow: 'hidden' }}>
            {[['Heat', NM.heat, true], ['Goalies', NM.cold, false], ['Fresh faces', NM.rise, false]].map(([l, c, active]) => (
              <span key={l} style={{ padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                color: active ? c : NM.text, background: active ? `${c}1a` : NM.bgCard, border: `1px solid ${active ? c + '55' : NM.border}` }}>{l}</span>
            ))}
          </div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: '6px 12px' }}>
            {[
              { n: 'McDavid',  t: 'EDM', sub: 'Forward', val: 94 },
              { n: 'Pastrnak', t: 'BOS', sub: 'Forward', val: 88 },
              { n: 'MacKinnon',t: 'COL', sub: 'Forward', val: 85 },
              { n: 'Matthews', t: 'TOR', sub: 'Forward', val: 82 },
              { n: 'Kaprizov', t: 'MIN', sub: 'Forward', val: 80 },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <span style={{ width: 14, fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700 }}>{i+1}</span>
                <TeamBadge code={p.t} size={22}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: NM.textBright }}>{p.n}</div>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted }}>{p.sub}</div>
                </div>
                <HeatPill h={p.val} size="sm"/>
              </div>
            ))}
          </div>
        </div>

        {/* TONIGHT — only on playoffs view */}
        {playoffs && (
          <div style={{ padding: '24px 16px 0' }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>TONIGHT</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, marginBottom: 14 }}>What's on tonight.</div>
            {[
              { a: 'EDM', h: 'COL', t: '8:00 PM', pred: 'EDM', c: 58 },
              { a: 'TOR', h: 'FLA', t: '7:00 PM', pred: 'FLA', c: 54 },
            ].map((g, i) => (
              <div key={i} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 600 }}>{g.t}</span>
                  <span style={{ flex: 1 }}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700 }}>{g.pred} {g.c}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TeamBadge code={g.a} size={26} ringed={g.pred === g.a}/>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: NM.textBright }}>{TEAMS[g.a]?.name || g.a}</span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>@</span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 700, fontSize: 13, color: NM.textBright }}>{TEAMS[g.h]?.name || g.h}</span>
                  <TeamBadge code={g.h} size={26} ringed={g.pred === g.h}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EXPLORE */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>EXPLORE</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, marginBottom: 12 }}>More ways to dig in.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[['COMPARE', 'Player vs player', NM.heat], ['HEAT MAP', 'All 312', NM.cold], ['STORIES', 'AI archive', NM.story], ['ACCURACY', 'How we\'re doing', NM.rise]].map(([k, t, c]) => (
              <div key={k} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: c, fontWeight: 700, letterSpacing: 1.2, marginBottom: 4 }}>{k}</div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 13, color: NM.textBright }}>{t}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 16px 24px', marginTop: 14, borderTop: `1px solid ${NM.borderSoft}` }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, letterSpacing: 1, fontWeight: 600 }}>
            DATA · NHL Stats API · MoneyPuck · Natural Stat Trick
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

Object.assign(window, { DesktopHomeFinal, MobileHomeFinal, ValuePropStrip, PlayoffsHero, ArticleGrid, ResultsSection, TripleRankings, TonightSlate, ExploreStrip });
