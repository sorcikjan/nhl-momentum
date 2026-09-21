// Game Detail Final — Upcoming / Live / Final states + enhanced schedule (games list)
// Desktop + Mobile artboards on the design canvas.

// ─── SHARED HELPERS ─────────────────────────────────────────────────

function GameSection({ kicker, title, right, children }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>{kicker}</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 24, letterSpacing: -0.6, color: NM.textBright }}>{title}</div>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function FormStreak({ team, results, color = NM.text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textBright, fontWeight: 700, width: 36 }}>{team}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {results.map((r, i) => (
          <span key={i} style={{
            width: 20, height: 20, borderRadius: 4, fontSize: 10, fontWeight: 800, color: '#fff',
            background: r === 'W' ? NM.rise : r === 'OTL' ? NM.gold : NM.red,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{r === 'OTL' ? 'L' : r}</span>
        ))}
      </div>
    </div>
  );
}

function H2HRow({ d, h, a, hs, as, w }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '70px 30px 30px 40px 1fr 60px', gap: 8,
      padding: '10px 0', alignItems: 'center', borderTop: `1px solid ${NM.borderSoft}`, fontSize: 12 }}>
      <span style={{ fontFamily: NM.fontMono, color: NM.textMuted, fontSize: 11 }}>{d}</span>
      <TeamBadge code={a} size={22}/>
      <TeamBadge code={h} size={22}/>
      <span style={{ fontFamily: NM.fontMono, color: NM.textBright, fontWeight: 700, textAlign: 'right' }}>{as}–{hs}</span>
      <span style={{ color: NM.text }}><b style={{ color: NM.textBright }}>{w}</b> won</span>
      <span style={{ fontFamily: NM.fontMono, color: NM.textMuted, fontSize: 10, textAlign: 'right' }}>regular</span>
    </div>
  );
}

// ─── UPCOMING GAME DETAIL (DESKTOP) ────────────────────────────────
function DesktopGameUpcoming() {
  const home = 'COL', away = 'EDM';
  return (
    <DCArtboard label="Desktop · Game detail (UPCOMING) · 1440" width={1440} height={2480}
      style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <BrandedHeaderDesktop active="Tonight"/>

      {/* HERO */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${NM.borderSoft}` }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
          <div style={{ flex: 1, background: `linear-gradient(120deg, ${TEAMS[away].c} 0%, ${NM.bg} 80%)` }}/>
          <div style={{ flex: 1, background: `linear-gradient(240deg, ${TEAMS[home].c} 0%, ${NM.bg} 80%)` }}/>
        </div>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 30%, rgba(255,90,36,0.18) 0%, transparent 60%)` }}/>

        <div style={{ position: 'relative', padding: '32px 48px 40px' }}>
          {/* Eyebrow row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: NM.heat, boxShadow: `0 0 10px ${NM.heat}` }}/>
            <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4 }}>
              STANLEY CUP · R2 · GAME 4 · TONIGHT 8:00 PM ET
            </span>
            <span style={{ flex: 1, height: 1, background: `${NM.borderSoft}` }}/>
            <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>Ball Arena · Denver, CO · 18,083 expected</span>
          </div>

          {/* Big matchup */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 1 }}>
              <TeamBadge code={away} size={96}/>
              <div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 56, letterSpacing: -1.8, lineHeight: 1, color: NM.textBright }}>Oilers</div>
                <div style={{ fontSize: 13, color: NM.text, marginTop: 8 }}>47-22-8 · 102 pts · 2nd Pacific</div>
                <div style={{ fontSize: 12, color: NM.heat, fontFamily: NM.fontMono, fontWeight: 700, marginTop: 4 }}>SERIES 2–1</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: NM.fontDisplay, fontStyle: 'italic', fontSize: 38, color: NM.textMuted, fontWeight: 400 }}>at</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2 }}>BEST OF 7</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 1, justifyContent: 'flex-end', textAlign: 'right' }}>
              <div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 56, letterSpacing: -1.8, lineHeight: 1, color: NM.text }}>Avalanche</div>
                <div style={{ fontSize: 13, color: NM.text, marginTop: 8 }}>50-22-7 · 107 pts · 1st Central</div>
                <div style={{ fontSize: 12, color: NM.textMuted, fontFamily: NM.fontMono, fontWeight: 700, marginTop: 4 }}>SERIES 1–2</div>
              </div>
              <TeamBadge code={home} size={96}/>
            </div>
          </div>

          {/* Story line */}
          <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 22, letterSpacing: -0.5, color: NM.textBright, maxWidth: 800, lineHeight: 1.3, textWrap: 'pretty' }}>
            <span style={{ color: NM.heat }}>The story:</span> Oilers can take a 3–1 stranglehold tonight. McDavid's at 94 Heat — Colorado has to find an answer fast.
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: '40px 48px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        <div>
          {/* PREDICTION */}
          <GameSection kicker="OUR PREDICTION" title="Oilers win.">
            <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 14, padding: 24 }}>
              {/* Confidence + accuracy */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
                <div style={{ width: 110, height: 110, borderRadius: 55,
                  background: `conic-gradient(${NM.heat} 58%, ${NM.borderSoft} 0)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 8, borderRadius: 55, background: NM.bgCard,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 26, fontWeight: 800, color: NM.heat, lineHeight: 1 }}>58%</span>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 1, marginTop: 2 }}>EDM WIN</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: NM.text, lineHeight: 1.6, textWrap: 'pretty' }}>
                    The model gives Edmonton a modest edge built on <b style={{ color: NM.textBright }}>McDavid's elite form</b> (Heat 94) and Colorado's <b style={{ color: NM.textBright }}>shaky transition defense</b> (#21 in xGA on the rush). Both teams are well-rested.
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 12 }}>
                    <span style={{ color: NM.textMuted }}>Model accuracy this round: <b style={{ color: NM.rise }}>71%</b></span>
                    <span style={{ color: NM.textMuted }}>Last 30 days: <b style={{ color: NM.rise }}>67%</b></span>
                  </div>
                </div>
              </div>
              {/* Probability bar */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700 }}>EDM 58%</span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.text, fontWeight: 700 }}>COL 42%</span>
                </div>
                <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ flex: 58, background: NM.heat }}/>
                  <div style={{ flex: 42, background: NM.borderSoft }}/>
                </div>
              </div>
              {/* Why factors */}
              <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 12 }}>WHY · TOP FACTORS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {[
                  ['McDavid heat',          '94',     NM.heat,  'EDM'],
                  ['MacKinnon heat',        '85',     NM.heat,  'COL'],
                  ['EDM road playoff record','5-2',   NM.rise,  'EDM'],
                  ['COL home L5',           '2-3',    NM.red,   'COL'],
                  ['EDM PP%',               '28.6',   NM.rise,  'EDM'],
                  ['COL PK%',               '72.4',   NM.red,   'COL'],
                  ['Rest days',             '2 / 2',  NM.text,  '—'],
                  ['xGF in series',         '+0.4/g', NM.rise,  'EDM'],
                ].map(([k, v, c, tag]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    background: NM.bg, borderRadius: 8, border: `1px solid ${NM.borderSoft}` }}>
                    {tag !== '—' && <TeamBadge code={tag} size={16}/>}
                    <span style={{ fontSize: 12, color: NM.text, flex: 1 }}>{k}</span>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 12, fontWeight: 700, color: c }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </GameSection>

          {/* GOALIE DUEL */}
          <GameSection kicker="STARTING GOALIES" title="The matchup in net.">
            <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 14, padding: 24,
              display: 'grid', gridTemplateColumns: '1fr 50px 1fr', gap: 24, alignItems: 'center' }}>
              {/* Away G */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <TeamBadge code={away} size={24}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1 }}>STUART SKINNER · #74</span>
                </div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 26, letterSpacing: -0.6, color: NM.textBright, marginBottom: 12 }}>Skinner</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[['.918','SV%'],['2.51','GAA'],['3','SO']].map(([v, l]) => (
                    <div key={l} style={{ padding: '10px 8px', background: NM.bg, borderRadius: 8, border: `1px solid ${NM.borderSoft}` }}>
                      <div style={{ fontFamily: NM.fontMono, fontSize: 17, fontWeight: 800, color: NM.textBright, lineHeight: 1 }}>{v}</div>
                      <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 0.5, marginTop: 4 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, padding: '8px 12px', background: NM.bg, borderRadius: 8, border: `1px solid ${NM.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.text }}>Heat L5</span>
                  <HeatPill h={73} size="sm"/>
                </div>
              </div>
              {/* VS */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: NM.fontDisplay, fontStyle: 'italic', fontSize: 22, color: NM.textMuted, fontWeight: 400, marginBottom: 4 }}>vs</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.2 }}>EDGE</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 22, fontWeight: 800, color: NM.heat, marginTop: 2 }}>+15</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 600, marginTop: 4 }}>HEAT</div>
              </div>
              {/* Home G */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, justifyContent: 'flex-end' }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1 }}>ALEXANDAR GEORGIEV · #40</span>
                  <TeamBadge code={home} size={24}/>
                </div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 26, letterSpacing: -0.6, color: NM.textBright, marginBottom: 12 }}>Georgiev</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[['.911','SV%'],['2.84','GAA'],['1','SO']].map(([v, l]) => (
                    <div key={l} style={{ padding: '10px 8px', background: NM.bg, borderRadius: 8, border: `1px solid ${NM.borderSoft}` }}>
                      <div style={{ fontFamily: NM.fontMono, fontSize: 17, fontWeight: 800, color: NM.textBright, lineHeight: 1 }}>{v}</div>
                      <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 0.5, marginTop: 4 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, padding: '8px 12px', background: NM.bg, borderRadius: 8, border: `1px solid ${NM.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.text }}>Heat L5</span>
                  <HeatPill h={58} size="sm"/>
                </div>
              </div>
            </div>
          </GameSection>

          {/* PLAYERS TO WATCH */}
          <GameSection kicker="PLAYERS TO WATCH" title="Watch these six.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {[
                { t: away, n: 'Connor McDavid',  p: 'C · #97',  h: 94, n2: '7 pts in 3 playoff games',    arch: 'Playmaker' },
                { t: home, n: 'Nathan MacKinnon', p: 'C · #29', h: 85, n2: 'Career-best playoff pace',     arch: 'Sniper' },
                { t: away, n: 'Leon Draisaitl',   p: 'C · #29', h: 88, n2: 'PP unit driving 60% of goals', arch: 'Power Forward' },
                { t: home, n: 'Cale Makar',       p: 'D · #8',  h: 81, n2: 'Norris-level shutdown D',      arch: 'Defender' },
                { t: away, n: 'Evan Bouchard',    p: 'D · #2',  h: 76, n2: '4-game point streak',         arch: 'Playmaker' },
                { t: home, n: 'Mikko Rantanen',   p: 'RW · #96',h: 78, n2: 'Hot on PP1',                    arch: 'Sniper' },
              ].map((p, i) => (
                <div key={i} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <TeamBadge code={p.t} size={36}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, color: NM.textBright, fontSize: 14 }}>{p.n}</span>
                      <span style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.heat, fontWeight: 700, letterSpacing: 0.8, padding: '1px 5px', background: NM.heatDim, borderRadius: 3, border: `1px solid ${NM.heat}55` }}>{p.arch.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: 11, color: NM.textMuted }}>{p.p} · {p.n2}</div>
                  </div>
                  <HeatPill h={p.h}/>
                </div>
              ))}
            </div>
          </GameSection>

          {/* SPECIAL TEAMS + ADVANCED */}
          <GameSection kicker="SPECIAL TEAMS · PLAYOFFS" title="Where games are won.">
            <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 14, padding: 24 }}>
              {[
                ['Power play %',        28.6, 18.4, NM.heat],
                ['Penalty kill %',      84.2, 72.4, NM.cold],
                ['5v5 expected goals/60',2.61, 2.42, NM.heat],
                ['High-danger chances', 14.2, 11.8, NM.heat],
                ['Faceoff %',           54.8, 51.2, NM.heat],
              ].map(([label, a, h, c], i) => {
                const max = Math.max(a, h);
                const pA = (a / max / 1.1) * 100;
                const pH = (h / max / 1.1) * 100;
                const aLeads = a > h;
                return (
                  <div key={i} style={{ padding: '12px 0', borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontFamily: NM.fontMono, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                      <span style={{ color: aLeads ? NM.heat : NM.text }}>{a}{typeof a === 'number' && a < 10 && a > 0.1 ? '' : ''}</span>
                      <span style={{ color: NM.textMuted, fontFamily: NM.fontSans, fontWeight: 600 }}>{label}</span>
                      <span style={{ color: !aLeads ? NM.heat : NM.text }}>{h}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
                      <div style={{ height: 4, background: NM.borderSoft, borderRadius: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: `${pA}%`, height: '100%', background: aLeads ? NM.heat : NM.text, borderRadius: 2 }}/>
                      </div>
                      <div style={{ height: 4, background: NM.borderSoft, borderRadius: 2 }}>
                        <div style={{ width: `${pH}%`, height: '100%', background: !aLeads ? NM.heat : NM.text, borderRadius: 2 }}/>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GameSection>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* SERIES TRACKER */}
          <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.heat}55`, padding: 22, marginBottom: 18, boxShadow: `0 0 20px ${NM.heat}22` }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 14 }}>SERIES · BEST OF 7</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 36, letterSpacing: -1, lineHeight: 1, color: NM.textBright, marginBottom: 6 }}>
              EDM 2 <span style={{ color: NM.textMuted }}>—</span> 1 COL
            </div>
            <div style={{ fontSize: 12, color: NM.textMuted, marginBottom: 16 }}>Series odds <b style={{ color: NM.heat }}>EDM 64%</b></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { g: 1, d: 'Apr 24', w: 'COL', s: '4-3 OT', star: 'Rantanen 1G 2A' },
                { g: 2, d: 'Apr 26', w: 'EDM', s: '5-2',    star: 'McDavid 2G 1A' },
                { g: 3, d: 'Apr 28', w: 'EDM', s: '4-1',    star: 'Skinner 32SV' },
                { g: 4, d: 'Apr 30', t: true },
                { g: 5, d: 'May 2',  pending: true },
                { g: 6, d: 'May 4',  pending: true, ifNec: true },
                { g: 7, d: 'May 6',  pending: true, ifNec: true },
              ].map(gm => (
                <div key={gm.g} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                  background: gm.t ? NM.heatDim : (gm.w ? NM.bg : 'transparent'),
                  border: `1px solid ${gm.t ? NM.heat : NM.borderSoft}`, borderRadius: 8 }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, width: 16 }}>G{gm.g}</span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, width: 44 }}>{gm.d}</span>
                  {gm.w ? (
                    <>
                      <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textBright, fontWeight: 700, width: 32 }}>{gm.w}</span>
                      <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.text, width: 50 }}>{gm.s}</span>
                      <span style={{ flex: 1, fontSize: 10, color: NM.textMuted, fontFamily: NM.fontMono, textAlign: 'right' }}>{gm.star}</span>
                    </>
                  ) : gm.t ? (
                    <span style={{ flex: 1, fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1 }}>TONIGHT · 8:00 PM</span>
                  ) : (
                    <span style={{ flex: 1, fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 600 }}>
                      {gm.ifNec ? 'IF NECESSARY' : 'IF NECESSARY'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* FORM L10 */}
          <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, padding: 22, marginBottom: 18 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 12 }}>RECENT FORM · LAST 10</div>
            <div style={{ marginBottom: 10 }}>
              <FormStreak team="EDM" results={['W','W','W','L','W','W','L','W','W','OTL']}/>
            </div>
            <FormStreak team="COL" results={['L','W','W','W','L','L','W','W','OTL','L']}/>
            <div style={{ marginTop: 14, fontSize: 11, color: NM.textMuted, lineHeight: 1.5 }}>
              EDM <b style={{ color: NM.rise }}>7-2-1</b> · COL <b style={{ color: NM.gold }}>5-4-1</b>
            </div>
          </div>

          {/* H2H */}
          <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, padding: 22, marginBottom: 18 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 12 }}>HEAD-TO-HEAD · SEASON + PLAYOFFS</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -0.8, lineHeight: 1, color: NM.textBright, marginBottom: 4 }}>
              EDM 4 <span style={{ color: NM.textMuted }}>—</span> 2 COL
            </div>
            <div style={{ fontSize: 12, color: NM.textMuted, marginBottom: 12 }}>Avg margin <b style={{ color: NM.textBright }}>1.8 goals</b> · 3 OT games</div>
            <H2HRow d="Nov 14" a="EDM" h="COL" hs={3} as={5} w="EDM"/>
            <H2HRow d="Jan 9"  a="COL" h="EDM" hs={4} as={3} w="EDM"/>
            <H2HRow d="Mar 16" a="EDM" h="COL" hs={6} as={4} w="COL"/>
            <H2HRow d="Apr 24" a="EDM" h="COL" hs={4} as={3} w="COL"/>
            <H2HRow d="Apr 26" a="COL" h="EDM" hs={5} as={2} w="EDM"/>
            <H2HRow d="Apr 28" a="COL" h="EDM" hs={4} as={1} w="EDM"/>
          </div>

          {/* INJURIES / LINEUP */}
          <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, padding: 22, marginBottom: 18 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 12 }}>LINEUP · CONFIRMED</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${NM.borderSoft}` }}>
              <TeamBadge code={away} size={20}/>
              <span style={{ fontSize: 12, color: NM.text }}>Full lineup · 12F · 6D · 2G</span>
              <span style={{ flex: 1 }}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 700 }}>OK</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${NM.borderSoft}` }}>
              <TeamBadge code={home} size={20}/>
              <span style={{ fontSize: 12, color: NM.text }}>Lehkonen — game-time decision (lower body)</span>
              <span style={{ flex: 1 }}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.gold, fontWeight: 700 }}>GTD</span>
            </div>
            <div style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 0.8 }}>OFFICIALS</span>
              <span style={{ fontSize: 11, color: NM.text }}>K. Pollock · F. L'Ecuyer · Refs avg 4.2 PP/g</span>
            </div>
          </div>

          {/* TRAVEL / REST */}
          <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, padding: 22 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 12 }}>REST & TRAVEL</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${NM.borderSoft}` }}>
              <span style={{ fontSize: 12, color: NM.text }}><TeamBadge code={away} size={16}/> Rest days</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.textBright, fontWeight: 700 }}>2 days</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${NM.borderSoft}` }}>
              <span style={{ fontSize: 12, color: NM.text }}><TeamBadge code={home} size={16}/> Rest days</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.textBright, fontWeight: 700 }}>2 days</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: 12, color: NM.text }}>Altitude</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.gold, fontWeight: 700 }}>5,280 ft · ⚠</span>
            </div>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

// ─── LIVE GAME DETAIL (DESKTOP) ────────────────────────────────────
function DesktopGameLive() {
  const home = 'COL', away = 'EDM';
  return (
    <DCArtboard label="Desktop · Game detail (LIVE) · 1440" width={1440} height={1640}
      style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <BrandedHeaderDesktop active="Tonight"/>

      {/* HERO — LIVE */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${NM.heat}` }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
          <div style={{ flex: 1, background: `linear-gradient(120deg, ${TEAMS[away].c} 0%, ${NM.bg} 80%)` }}/>
          <div style={{ flex: 1, background: `linear-gradient(240deg, ${TEAMS[home].c} 0%, ${NM.bg} 80%)` }}/>
        </div>
        <div style={{ position: 'relative', padding: '28px 48px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: NM.heat, boxShadow: `0 0 16px ${NM.heat}` }}/>
            <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.heat, fontWeight: 800, letterSpacing: 2 }}>● LIVE · 2ND PERIOD · 8:47</span>
            <span style={{ flex: 1, height: 1, background: NM.borderSoft }}/>
            <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>R2 G4 · Ball Arena · 18,108 attendance</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
              <TeamBadge code={away} size={88}/>
              <div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -0.8, color: NM.textBright, lineHeight: 1 }}>Oilers</div>
                <div style={{ fontSize: 12, color: NM.heat, fontFamily: NM.fontMono, fontWeight: 700, marginTop: 6 }}>SHOTS 24 · PP 1/3</div>
              </div>
              <div style={{ flex: 1 }}/>
              <span style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 96, color: NM.textBright, letterSpacing: -3, lineHeight: 1 }}>3</span>
            </div>
            <span style={{ fontFamily: NM.fontMono, fontSize: 18, color: NM.textMuted, fontWeight: 700, letterSpacing: 2 }}>—</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 96, color: NM.text, letterSpacing: -3, lineHeight: 1 }}>2</span>
              <div style={{ flex: 1 }}/>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -0.8, color: NM.text, lineHeight: 1 }}>Avalanche</div>
                <div style={{ fontSize: 12, color: NM.text, fontFamily: NM.fontMono, fontWeight: 700, marginTop: 6 }}>SHOTS 19 · PP 0/2</div>
              </div>
              <TeamBadge code={home} size={88}/>
            </div>
          </div>

          {/* Period dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24, justifyContent: 'center' }}>
            {[
              { p: 'P1', a: 2, h: 1, done: true },
              { p: 'P2', a: 1, h: 1, live: true },
              { p: 'P3', a: 0, h: 0 },
            ].map(pd => (
              <div key={pd.p} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
                background: pd.live ? NM.heatDim : NM.bgCard, borderRadius: 8,
                border: `1px solid ${pd.live ? NM.heat : NM.borderSoft}` }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: pd.live ? NM.heat : NM.textMuted, fontWeight: 700, letterSpacing: 1 }}>{pd.p}</span>
                {pd.done || pd.live ? (
                  <span style={{ fontFamily: NM.fontMono, fontSize: 14, color: NM.textBright, fontWeight: 700 }}>{pd.a}-{pd.h}</span>
                ) : (
                  <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.textMuted }}>—</span>
                )}
                {pd.live && <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700 }}>● LIVE</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: '32px 48px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        <div>
          {/* MOMENTUM TRACKER */}
          <GameSection kicker="MOMENTUM TRACKER · LIVE" title="Who's pushing right now."
            right={<span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700 }}>● UPDATING</span>}
          >
            <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 14, padding: 22 }}>
              <svg viewBox="0 0 1200 200" style={{ width: '100%', height: 200 }}>
                <line x1="0" y1="100" x2="1200" y2="100" stroke={NM.borderSoft} strokeWidth="1"/>
                <text x="6" y="96" fontFamily={NM.fontMono} fontSize="10" fill={NM.textMuted}>EDM ↑</text>
                <text x="6" y="116" fontFamily={NM.fontMono} fontSize="10" fill={NM.textMuted}>COL ↓</text>
                {/* P1 */}
                <line x1="400" y1="0" x2="400" y2="200" stroke={NM.borderSoft} strokeDasharray="3 5"/>
                <line x1="800" y1="0" x2="800" y2="200" stroke={NM.borderSoft} strokeDasharray="3 5"/>
                <text x="200" y="14" fontFamily={NM.fontMono} fontSize="10" fill={NM.textMuted} textAnchor="middle" fontWeight="700">P1</text>
                <text x="600" y="14" fontFamily={NM.fontMono} fontSize="10" fill={NM.textMuted} textAnchor="middle" fontWeight="700">P2</text>
                {/* momentum path */}
                <path d="M 0 100 L 80 80 L 160 90 L 240 60 L 320 70 L 400 50 L 480 70 L 560 110 L 640 130 L 720 100 L 800 90 L 880 60 L 960 40 L 1040 60 L 1120 30 L 1200 20"
                  stroke={NM.heat} strokeWidth="3" fill="none" strokeLinecap="round"/>
                <path d="M 0 100 L 80 80 L 160 90 L 240 60 L 320 70 L 400 50 L 480 70 L 560 110 L 640 130 L 720 100 L 800 90 L 880 60 L 960 40 L 1040 60 L 1120 30 L 1200 20 L 1200 100 L 0 100 Z"
                  fill={NM.heat} opacity="0.1"/>
                {/* goal markers */}
                {[
                  { x: 120, t: 'EDM 1-0', y: 88 },
                  { x: 280, t: 'EDM 2-0', y: 65 },
                  { x: 360, t: 'COL 2-1', y: 60, col: true },
                  { x: 720, t: 'EDM 3-1', y: 100 },
                  { x: 1080, t: 'COL 3-2', y: 50, col: true },
                ].map(m => (
                  <g key={m.x}>
                    <circle cx={m.x} cy={m.y} r="6" fill={m.col ? NM.text : NM.heat} stroke={NM.bg} strokeWidth="2"/>
                    <text x={m.x} y={m.y - 14} fontFamily={NM.fontMono} fontSize="10" fill={m.col ? NM.text : NM.heat} fontWeight="700" textAnchor="middle">{m.t}</text>
                  </g>
                ))}
                {/* now indicator */}
                <line x1="1200" y1="0" x2="1200" y2="200" stroke={NM.heat} strokeWidth="2"/>
                <circle cx="1200" cy="20" r="8" fill={NM.heat}>
                  <animate attributeName="r" from="6" to="14" dur="1.4s" repeatCount="indefinite"/>
                </circle>
              </svg>
            </div>
          </GameSection>

          {/* LIVE PLAY-BY-PLAY */}
          <GameSection kicker="PLAY-BY-PLAY" title="Recent action.">
            <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {[
                { t: '8:47', p: 'P2', e: 'GOAL', d: 'McDavid 1 (EDM) · assists: Draisaitl, Bouchard', team: away, type: 'GOAL' },
                { t: '12:14',p: 'P2', e: 'SHOT', d: 'Rantanen wide right · saved off post', team: home, type: 'OK' },
                { t: '14:02',p: 'P2', e: 'PEN',  d: 'Nurse 2-min · holding · COL PP', team: away, type: 'BAD' },
                { t: '17:10',p: 'P2', e: 'GOAL', d: 'Mikko Rantanen 2 (COL) · PP · assists: MacKinnon, Makar', team: home, type: 'GOAL' },
                { t: '19:42',p: 'P2', e: 'HIT',  d: 'Kane crushes Toews behind net', team: away, type: 'OK' },
              ].map((ev, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 40px 60px 1fr 28px',
                  gap: 12, padding: '12px 18px', alignItems: 'center', borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.text }}>{ev.p} {ev.t}</span>
                  <TeamBadge code={ev.team} size={20}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, fontWeight: 700, letterSpacing: 0.8, padding: '3px 6px', borderRadius: 3,
                    color: ev.type === 'GOAL' ? NM.heat : ev.type === 'BAD' ? NM.red : NM.text,
                    background: ev.type === 'GOAL' ? NM.heatDim : ev.type === 'BAD' ? 'rgba(239,68,68,0.12)' : NM.bg,
                    border: `1px solid ${ev.type === 'GOAL' ? NM.heat + '55' : ev.type === 'BAD' ? NM.red + '55' : NM.borderSoft}`,
                    textAlign: 'center' }}>{ev.e}</span>
                  <span style={{ fontSize: 12, color: NM.textBright, fontWeight: ev.type === 'GOAL' ? 600 : 400 }}>{ev.d}</span>
                  <span style={{ color: NM.textMuted, fontSize: 14, textAlign: 'right' }}>›</span>
                </div>
              ))}
            </div>
          </GameSection>
        </div>

        <div>
          {/* TOP PERFORMERS LIVE */}
          <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.heat}55`, padding: 22, marginBottom: 18, boxShadow: `0 0 18px ${NM.heat}22` }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 14 }}>● HEATING UP TONIGHT</div>
            {[
              { n: 'Connor McDavid',   t: away, sub: '1G 1A · +2 · TOI 17:08', heat: 96, delta: '+2' },
              { n: 'Leon Draisaitl',   t: away, sub: '0G 2A · +1 · TOI 15:42', heat: 90, delta: '+2' },
              { n: 'Mikko Rantanen',   t: home, sub: '1G 0A · -1 · TOI 16:14', heat: 80, delta: '+2' },
              { n: 'Stuart Skinner',   t: away, sub: '17 saves · .894',         heat: 76, delta: '+3' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <TeamBadge code={p.t} size={24}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: NM.textBright, fontWeight: 700 }}>{p.n}</div>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, marginTop: 1 }}>{p.sub}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <HeatPill h={p.heat} size="sm"/>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.rise, fontWeight: 700, marginTop: 2 }}>↑ {p.delta}</div>
                </div>
              </div>
            ))}
          </div>

          {/* WIN PROB OVER TIME */}
          <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, padding: 22, marginBottom: 18 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 12 }}>LIVE WIN PROBABILITY</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: NM.fontMono, fontSize: 22, color: NM.heat, fontWeight: 800 }}>EDM 71%</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 22, color: NM.text, fontWeight: 700 }}>COL 29%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 14 }}>
              <div style={{ flex: 71, background: NM.heat }}/>
              <div style={{ flex: 29, background: NM.borderSoft }}/>
            </div>
            <svg viewBox="0 0 280 80" style={{ width: '100%', height: 80 }}>
              <line x1="0" y1="40" x2="280" y2="40" stroke={NM.borderSoft} strokeDasharray="2 3"/>
              <path d="M 0 40 L 30 36 L 60 30 L 90 38 L 120 32 L 150 22 L 180 28 L 210 50 L 240 40 L 270 18 L 280 16"
                stroke={NM.heat} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <circle cx="280" cy="16" r="4" fill={NM.heat}/>
            </svg>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>PRE</span><span>P1</span><span>P2</span><span style={{ color: NM.heat, fontWeight: 700 }}>NOW</span>
            </div>
          </div>

          {/* LIVE STATS */}
          <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, padding: 22 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 12 }}>LIVE STATS</div>
            {[
              ['Shots',    24, 19],
              ['Hits',     18, 14],
              ['Blocks',   11, 9 ],
              ['Faceoff %', 56, 44],
              ['Giveaways', 5, 8],
              ['Power play', '1/3', '0/2'],
            ].map(([k, a, h], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 13, color: NM.textBright, fontWeight: 700, width: 50 }}>{a}</span>
                <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: NM.textMuted }}>{k}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 13, color: NM.text, fontWeight: 700, width: 50, textAlign: 'right' }}>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

// ─── FINAL GAME DETAIL (DESKTOP) ───────────────────────────────────
function DesktopGameFinal() {
  const home = 'COL', away = 'EDM';
  return (
    <DCArtboard label="Desktop · Game detail (FINAL) · 1440" width={1440} height={1820}
      style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <BrandedHeaderDesktop active="Tonight"/>

      {/* HERO — FINAL */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${NM.borderSoft}` }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
          <div style={{ flex: 1, background: `linear-gradient(120deg, ${TEAMS[away].c}cc 0%, ${NM.bg} 80%)` }}/>
          <div style={{ flex: 1, background: `linear-gradient(240deg, ${TEAMS[home].c} 0%, ${NM.bg} 80%)` }}/>
        </div>
        <div style={{ position: 'relative', padding: '32px 48px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.text, fontWeight: 700, letterSpacing: 1.4 }}>FINAL · R2 G4 · YESTERDAY</span>
            <span style={{ padding: '3px 9px', borderRadius: 4, fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 800, letterSpacing: 1, background: NM.riseDim, border: `1px solid ${NM.rise}55` }}>
              ✓ OUR PICK HIT
            </span>
            <span style={{ flex: 1, height: 1, background: NM.borderSoft }}/>
            <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>EDM leads series 3–1</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
              <TeamBadge code={away} size={96}/>
              <div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 44, letterSpacing: -1.2, color: NM.textBright, lineHeight: 1 }}>Oilers</div>
                <div style={{ fontSize: 12, color: NM.heat, fontFamily: NM.fontMono, fontWeight: 700, marginTop: 6 }}>WON · LEADS SERIES</div>
              </div>
              <div style={{ flex: 1 }}/>
              <span style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 120, color: NM.textBright, letterSpacing: -4, lineHeight: 1 }}>5</span>
            </div>
            <span style={{ fontFamily: NM.fontMono, fontSize: 18, color: NM.textMuted, fontWeight: 700 }}>—</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 120, color: NM.text, letterSpacing: -4, lineHeight: 1 }}>2</span>
              <div style={{ flex: 1 }}/>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 44, letterSpacing: -1.2, color: NM.text, lineHeight: 1 }}>Avalanche</div>
                <div style={{ fontSize: 12, color: NM.text, fontFamily: NM.fontMono, fontWeight: 700, marginTop: 6 }}>LOST · TRAILS SERIES</div>
              </div>
              <TeamBadge code={home} size={96}/>
            </div>
          </div>

          <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 22, letterSpacing: -0.5, color: NM.textBright, maxWidth: 800, lineHeight: 1.3, marginTop: 24, textWrap: 'pretty' }}>
            <span style={{ color: NM.heat }}>The story:</span> McDavid's hat trick puts Edmonton one win from the Conference Final. The pick hit — and the model loved this matchup.
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: '36px 48px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        <div>
          {/* THREE STARS */}
          <GameSection kicker="THREE STARS · OFFICIAL" title="Tonight's best.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { star: 1, n: 'Connor McDavid', t: away, line: '3G 1A · +3 · 23:18 TOI', h: 98, dh: '+4' },
                { star: 2, n: 'Stuart Skinner',  t: away, line: '34 saves · .919 SV%',     h: 84, dh: '+8' },
                { star: 3, n: 'Mikko Rantanen',  t: home, line: '1G 1A · -2',              h: 78, dh: '+1' },
              ].map(s => (
                <div key={s.star} style={{ background: NM.bgCard, border: `1px solid ${s.star === 1 ? NM.heat + '55' : NM.borderSoft}`,
                  borderRadius: 12, padding: 18, position: 'relative',
                  boxShadow: s.star === 1 ? `0 0 16px ${NM.heat}22` : 'none' }}>
                  <div style={{ position: 'absolute', top: 14, right: 14, fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 32,
                    color: s.star === 1 ? NM.heat : s.star === 2 ? NM.gold : NM.text, opacity: 0.85, lineHeight: 0.85 }}>★{s.star}</div>
                  <TeamBadge code={s.t} size={32}/>
                  <div style={{ marginTop: 10, fontFamily: NM.fontSans, fontWeight: 800, fontSize: 18, letterSpacing: -0.4, color: NM.textBright }}>{s.n}</div>
                  <div style={{ fontSize: 11, color: NM.textMuted, marginTop: 4, fontFamily: NM.fontMono }}>{s.line}</div>
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HeatPill h={s.h}/>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 700 }}>↑ {s.dh}</span>
                  </div>
                </div>
              ))}
            </div>
          </GameSection>

          {/* PICK ACCURACY */}
          <GameSection kicker="OUR PICK · HOW IT PLAYED" title="The model nailed this one.">
            <div style={{ background: NM.bgCard, border: `1px solid ${NM.rise}55`, borderRadius: 14, padding: 22, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 800, letterSpacing: 1.2 }}>✓ HIT · 58% CONF</span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.text }}>YTD: 67% · This round: 71%</span>
                </div>
                <div style={{ fontSize: 13, color: NM.text, lineHeight: 1.6, marginBottom: 16, textWrap: 'pretty' }}>
                  The model called EDM, led by McDavid's elite Heat. He delivered with a hat trick and Edmonton's PP went 2-for-3 — both factors the model flagged.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['EDM 58%','Special teams','McDavid Heat 94','Skinner trend ↑'].map(t => (
                    <span key={t} style={{ fontFamily: NM.fontMono, fontSize: 10, fontWeight: 700, color: NM.rise,
                      padding: '4px 8px', background: NM.riseDim, borderRadius: 3, border: `1px solid ${NM.rise}55` }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ borderLeft: `1px solid ${NM.borderSoft}`, paddingLeft: 24 }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>FINAL PROB CHANGE</div>
                <svg viewBox="0 0 200 80" style={{ width: '100%', height: 80 }}>
                  <line x1="0" y1="40" x2="200" y2="40" stroke={NM.borderSoft} strokeDasharray="2 3"/>
                  <path d="M 0 40 L 30 36 L 60 30 L 90 38 L 120 22 L 150 20 L 180 10 L 200 6"
                    stroke={NM.rise} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <circle cx="200" cy="6" r="4" fill={NM.rise}/>
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>
                  <span>58%</span><span style={{ color: NM.rise, fontWeight: 700 }}>100%</span>
                </div>
              </div>
            </div>
          </GameSection>

          {/* HEAT IMPACT */}
          <GameSection kicker="HEAT IMPACT" title="Who moved up. Who moved down.">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Up */}
              <div style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 12, padding: 18 }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 700, letterSpacing: 1.2, marginBottom: 10 }}>↑ HEATING UP</div>
                {[
                  { n: 'Connor McDavid', t: away, was: 94, now: 98, d: '+4' },
                  { n: 'Stuart Skinner',  t: away, was: 76, now: 84, d: '+8' },
                  { n: 'Leon Draisaitl',  t: away, was: 88, now: 92, d: '+4' },
                ].map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                    <TeamBadge code={p.t} size={20}/>
                    <span style={{ flex: 1, fontSize: 12, color: NM.textBright, fontWeight: 600 }}>{p.n}</span>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>{p.was}</span>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>→</span>
                    <HeatPill h={p.now} size="sm"/>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 700, width: 24, textAlign: 'right' }}>{p.d}</span>
                  </div>
                ))}
              </div>
              {/* Down */}
              <div style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 12, padding: 18 }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.cold, fontWeight: 700, letterSpacing: 1.2, marginBottom: 10 }}>↓ COOLING OFF</div>
                {[
                  { n: 'Cale Makar',          t: home, was: 81, now: 74, d: '-7' },
                  { n: 'Alexandar Georgiev',  t: home, was: 58, now: 51, d: '-7' },
                  { n: 'Nathan MacKinnon',    t: home, was: 85, now: 80, d: '-5' },
                ].map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                    <TeamBadge code={p.t} size={20}/>
                    <span style={{ flex: 1, fontSize: 12, color: NM.textBright, fontWeight: 600 }}>{p.n}</span>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>{p.was}</span>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>→</span>
                    <HeatPill h={p.now} size="sm"/>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.cold, fontWeight: 700, width: 24, textAlign: 'right' }}>{p.d}</span>
                  </div>
                ))}
              </div>
            </div>
          </GameSection>
        </div>

        <div>
          {/* AI RECAP */}
          <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.heat}55`, padding: 22, marginBottom: 18, boxShadow: `0 0 16px ${NM.heat}22` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.story, fontWeight: 700, letterSpacing: 1.2 }}>AI RECAP</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>· written 11:48 PM</span>
            </div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.5, color: NM.textBright, lineHeight: 1.2, marginBottom: 10, textWrap: 'pretty' }}>
              McDavid put on a clinic. Oilers move within 2 of the Cup.
            </div>
            <div style={{ fontSize: 13, color: NM.text, lineHeight: 1.55, textWrap: 'pretty' }}>
              Three goals in 18 minutes. The Oilers controlled the middle of the ice all night, generated 14 high-danger chances, and rode special teams (2-for-3 on the PP, perfect on the PK). MacKinnon was held off the scoresheet for the first time this round.
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: NM.heat, fontFamily: NM.fontMono, fontWeight: 700 }}>READ FULL RECAP →</div>
          </div>

          {/* HIGHLIGHTS */}
          <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, padding: 22, marginBottom: 18 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 14 }}>IF YOU MISSED IT</div>
            {[
              { t: 'McDavid breakaway · 8:47 P2',  d: 'The dagger goal', team: away },
              { t: 'Rantanen one-timer · 13:22 P1', d: 'COL PP equalizer', team: home },
              { t: 'Skinner glove save · 4:18 P3',  d: '36-save night', team: away },
            ].map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <div style={{ width: 48, height: 36, borderRadius: 4, background: `linear-gradient(135deg, ${TEAMS[h.team].c}aa, ${NM.bg})`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 14, color: '#fff' }}>▶</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: NM.textBright, fontWeight: 600 }}>{h.t}</div>
                  <div style={{ fontSize: 10, color: NM.textMuted, marginTop: 1 }}>{h.d}</div>
                </div>
                <span style={{ color: NM.textMuted, fontSize: 14 }}>›</span>
              </div>
            ))}
          </div>

          {/* SERIES UPDATED */}
          <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, padding: 22 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 12 }}>SERIES NOW</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -0.8, color: NM.textBright, marginBottom: 4 }}>
              EDM 3 — 1 COL
            </div>
            <div style={{ fontSize: 12, color: NM.text, marginBottom: 14 }}>
              EDM advances with <b style={{ color: NM.rise }}>1 win</b>. Series odds <b style={{ color: NM.heat }}>EDM 84%</b>.
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[{w:'COL',s:'4-3OT'},{w:'EDM',s:'5-2'},{w:'EDM',s:'4-1'},{w:'EDM',s:'5-2',just: true},{},{},{}].map((g, i) => (
                <div key={i} style={{ flex: 1, padding: '8px 4px', textAlign: 'center',
                  background: g.just ? NM.heatDim : (g.w ? NM.bg : 'transparent'),
                  border: `1px solid ${g.just ? NM.heat : NM.borderSoft}`, borderRadius: 4 }}>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700 }}>G{i+1}</div>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: g.w ? NM.textBright : NM.textMuted, fontWeight: 700, marginTop: 2 }}>{g.w || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

// ─── MOBILE — UPCOMING ─────────────────────────────────────────────
function MobileGameUpcoming() {
  const home = 'COL', away = 'EDM';
  return (
    <PhoneFrame label="Mobile · Game (UPCOMING)" width={390} height={2100} statusBar={true}>
      <div style={{ background: NM.bg, color: NM.textBright, minHeight: '100%' }}>
        <BrandedHeaderMobile/>

        {/* HERO */}
        <div style={{ position: 'relative', padding: '14px 16px 20px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            <div style={{ flex: 1, background: `linear-gradient(135deg, ${TEAMS[away].c}cc 0%, ${NM.bg} 100%)` }}/>
            <div style={{ flex: 1, background: `linear-gradient(225deg, ${TEAMS[home].c}cc 0%, ${NM.bg} 100%)` }}/>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: NM.heat, boxShadow: `0 0 6px ${NM.heat}` }}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.2 }}>R2 G4 · TONIGHT 8:00 PM</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <TeamBadge code={away} size={56}/>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 18, color: NM.textBright }}>Oilers</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700 }}>SERIES 2–1</div>
              </div>
              <span style={{ fontFamily: NM.fontDisplay, fontStyle: 'italic', fontSize: 22, color: NM.textMuted }}>at</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <TeamBadge code={home} size={56}/>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 18, color: NM.text }}>Avs</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700 }}>SERIES 1–2</div>
              </div>
            </div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 14, color: NM.textBright, lineHeight: 1.4, textWrap: 'pretty' }}>
              <span style={{ color: NM.heat }}>The story:</span> Oilers can take a 3–1 stranglehold tonight. McDavid at 94 Heat.
            </div>
          </div>
        </div>

        {/* PREDICTION */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.heat}55`, borderRadius: 12, padding: 16, boxShadow: `0 0 12px ${NM.heat}22` }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 10 }}>OUR PICK</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: 32, background: `conic-gradient(${NM.heat} 58%, ${NM.borderSoft} 0)`, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 5, borderRadius: 32, background: NM.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 18, fontWeight: 800, color: NM.heat }}>58%</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 18, color: NM.textBright, letterSpacing: -0.3, marginBottom: 4 }}>Oilers win.</div>
                <div style={{ fontSize: 11, color: NM.textMuted }}>YTD <b style={{ color: NM.rise }}>67%</b> · This round <b style={{ color: NM.rise }}>71%</b></div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontFamily: NM.fontMono, fontSize: 10, fontWeight: 700 }}>
              <span style={{ color: NM.heat }}>EDM 58%</span>
              <span style={{ color: NM.text }}>COL 42%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
              <div style={{ flex: 58, background: NM.heat }}/>
              <div style={{ flex: 42, background: NM.borderSoft }}/>
            </div>
          </div>
        </div>

        {/* SERIES */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>SERIES · BEST OF 7</div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 24, color: NM.textBright }}>EDM 2 — 1 COL</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700 }}>EDM 64% series</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[{g:1,w:'COL'},{g:2,w:'EDM'},{g:3,w:'EDM'},{g:4,t:true},{g:5},{g:6},{g:7}].map(gm => (
                <div key={gm.g} style={{ flex: 1, padding: '6px 0', textAlign: 'center',
                  background: gm.t ? NM.heatDim : (gm.w ? NM.bg : 'transparent'),
                  border: `1px solid ${gm.t ? NM.heat : NM.borderSoft}`, borderRadius: 4 }}>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.textMuted, fontWeight: 700 }}>G{gm.g}</div>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: gm.t ? NM.heat : (gm.w ? NM.textBright : NM.textMuted), fontWeight: 700, marginTop: 2 }}>{gm.w || (gm.t ? '●' : '—')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GOALIES */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>GOALIE MATCHUP</div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <TeamBadge code={away} size={16}/>
                <span style={{ fontSize: 12, fontWeight: 700, color: NM.textBright }}>Skinner</span>
              </div>
              <div style={{ fontFamily: NM.fontMono, fontSize: 13, color: NM.textBright, fontWeight: 700 }}>.918 · 2.51</div>
              <HeatPill h={73} size="sm"/>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700 }}>EDGE</div>
              <div style={{ fontFamily: NM.fontMono, fontSize: 18, fontWeight: 800, color: NM.heat }}>+15</div>
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: NM.textBright }}>Georgiev</span>
                <TeamBadge code={home} size={16}/>
              </div>
              <div style={{ fontFamily: NM.fontMono, fontSize: 13, color: NM.text, fontWeight: 700 }}>.911 · 2.84</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><HeatPill h={58} size="sm"/></div>
            </div>
          </div>
        </div>

        {/* WATCH */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>PLAYERS TO WATCH</div>
          {[
            { t: away, n: 'Connor McDavid',   h: 94, n2: 'PLAYMAKER · 7 pts in 3' },
            { t: away, n: 'Leon Draisaitl',    h: 88, n2: 'POWER FWD · PP threat' },
            { t: home, n: 'Nathan MacKinnon',  h: 85, n2: 'SNIPER · 4-game streak' },
            { t: home, n: 'Cale Makar',        h: 81, n2: 'DEFENDER · Norris pace' },
          ].map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 8, marginBottom: 6 }}>
              <TeamBadge code={p.t} size={26}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: NM.textBright, fontWeight: 700 }}>{p.n}</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted }}>{p.n2}</div>
              </div>
              <HeatPill h={p.h} size="sm"/>
            </div>
          ))}
        </div>

        {/* SPECIAL TEAMS */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>SPECIAL TEAMS</div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: 14 }}>
            {[['Power play', '28.6%', '18.4%', true], ['Penalty kill', '84.2%', '72.4%', true], ['xG/60', '2.61', '2.42', true]].map(([l, a, h, alead], i) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: alead ? NM.heat : NM.text, fontWeight: 700, width: 52 }}>{a}</span>
                <span style={{ flex: 1, textAlign: 'center', fontSize: 10, color: NM.textMuted }}>{l}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: !alead ? NM.heat : NM.text, fontWeight: 700, width: 52, textAlign: 'right' }}>{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* H2H */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>HEAD-TO-HEAD</div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, color: NM.textBright, marginBottom: 4 }}>EDM 4 — 2 COL</div>
            <div style={{ fontSize: 11, color: NM.textMuted, marginBottom: 10 }}>Last 6 meetings · avg margin 1.8 goals</div>
            <FormStreak team="EDM" results={['W','W','L','W','W','L']}/>
            <div style={{ marginTop: 6 }}>
              <FormStreak team="COL" results={['L','L','W','L','L','W']}/>
            </div>
          </div>
        </div>

        {/* LINEUP / TRAVEL */}
        <div style={{ padding: '0 16px 24px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>LINEUP & CONTEXT</div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: 14 }}>
            {[
              ['EDM lineup', 'Full · 12F · 6D · 2G', NM.rise, 'OK'],
              ['COL lineup', 'Lehkonen GTD (lower body)', NM.gold, 'GTD'],
              ['Rest days', '2 / 2 · even', NM.text, '✓'],
              ['Altitude', '5,280 ft · home advantage', NM.gold, '⚠'],
            ].map(([k, v, c, t]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: k !== 'EDM lineup' ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <span style={{ fontSize: 11, color: NM.text, flex: 1 }}>
                  <b style={{ color: NM.textBright }}>{k}</b> — {v}
                </span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: c, fontWeight: 700 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── MOBILE — LIVE ─────────────────────────────────────────────────
function MobileGameLive() {
  const home = 'COL', away = 'EDM';
  return (
    <PhoneFrame label="Mobile · Game (LIVE)" width={390} height={1500} statusBar={true}>
      <div style={{ background: NM.bg, color: NM.textBright, minHeight: '100%' }}>
        <BrandedHeaderMobile/>

        {/* LIVE HERO */}
        <div style={{ position: 'relative', padding: '14px 16px 20px', overflow: 'hidden', borderBottom: `1px solid ${NM.heat}55` }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            <div style={{ flex: 1, background: `linear-gradient(135deg, ${TEAMS[away].c}cc 0%, ${NM.bg} 100%)` }}/>
            <div style={{ flex: 1, background: `linear-gradient(225deg, ${TEAMS[home].c}cc 0%, ${NM.bg} 100%)` }}/>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: NM.heat, boxShadow: `0 0 10px ${NM.heat}` }}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 800, letterSpacing: 1.4 }}>● LIVE · P2 · 8:47</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <TeamBadge code={away} size={48}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700 }}>SOG 24</span>
              </div>
              <span style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 58, color: NM.textBright, letterSpacing: -2.2, lineHeight: 1 }}>3</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 14, color: NM.textMuted, fontWeight: 700 }}>—</span>
              <span style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 58, color: NM.text, letterSpacing: -2.2, lineHeight: 1 }}>2</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <TeamBadge code={home} size={48}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.text, fontWeight: 700 }}>SOG 19</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 14, justifyContent: 'center' }}>
              {[{p:'P1',a:2,h:1},{p:'P2',a:1,h:1,live:true},{p:'P3'}].map(pd => (
                <div key={pd.p} style={{ padding: '5px 12px', background: pd.live ? NM.heatDim : NM.bgCard,
                  border: `1px solid ${pd.live ? NM.heat : NM.borderSoft}`, borderRadius: 6,
                  display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: pd.live ? NM.heat : NM.textMuted, fontWeight: 700 }}>{pd.p}</span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textBright, fontWeight: 700 }}>
                    {pd.a !== undefined ? `${pd.a}-${pd.h}` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* WIN PROB */}
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>LIVE WIN PROBABILITY</div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: NM.fontMono, fontSize: 16, color: NM.heat, fontWeight: 800 }}>EDM 71%</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 16, color: NM.text, fontWeight: 700 }}>COL 29%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', display: 'flex', marginBottom: 10 }}>
              <div style={{ flex: 71, background: NM.heat }}/>
              <div style={{ flex: 29, background: NM.borderSoft }}/>
            </div>
            <svg viewBox="0 0 320 50" style={{ width: '100%', height: 50 }}>
              <line x1="0" y1="25" x2="320" y2="25" stroke={NM.borderSoft} strokeDasharray="2 3"/>
              <path d="M 0 25 L 40 22 L 80 18 L 120 24 L 160 18 L 200 12 L 240 16 L 280 30 L 320 8"
                stroke={NM.heat} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <circle cx="320" cy="8" r="3.5" fill={NM.heat}/>
            </svg>
          </div>
        </div>

        {/* HEATING UP */}
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>● HEATING UP TONIGHT</div>
          {[
            { n: 'McDavid', t: away, sub: '1G 1A · +2', h: 96, d: '+2' },
            { n: 'Draisaitl', t: away, sub: '0G 2A · +1', h: 90, d: '+2' },
            { n: 'Rantanen', t: home, sub: '1G 0A · PP', h: 80, d: '+2' },
          ].map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 8, marginBottom: 6 }}>
              <TeamBadge code={p.t} size={24}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: NM.textBright, fontWeight: 700 }}>{p.n}</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>{p.sub}</div>
              </div>
              <HeatPill h={p.h} size="sm"/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 700, width: 24, textAlign: 'right' }}>↑{p.d}</span>
            </div>
          ))}
        </div>

        {/* RECENT PLAYS */}
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>RECENT PLAYS</div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, overflow: 'hidden' }}>
            {[
              { t: '8:47 P2', e: 'GOAL', d: 'McDavid 1 (EDM)', team: away, type: 'GOAL' },
              { t: '12:14 P2', e: 'SHOT', d: 'Rantanen wide right', team: home },
              { t: '14:02 P2', e: 'PEN', d: 'Nurse holding 2m', team: away, type: 'BAD' },
              { t: '17:10 P2', e: 'GOAL', d: 'Rantanen 2 (COL) PP', team: home, type: 'GOAL' },
            ].map((ev, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, width: 50 }}>{ev.t}</span>
                <TeamBadge code={ev.team} size={18}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
                  color: ev.type === 'GOAL' ? NM.heat : ev.type === 'BAD' ? NM.red : NM.text,
                  background: ev.type === 'GOAL' ? NM.heatDim : ev.type === 'BAD' ? 'rgba(239,68,68,0.12)' : NM.bg }}>{ev.e}</span>
                <span style={{ flex: 1, fontSize: 11, color: NM.textBright }}>{ev.d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* LIVE STATS */}
        <div style={{ padding: '16px 16px 24px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>LIVE STATS</div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: 12 }}>
            {[['Shots', 24, 19], ['Hits', 18, 14], ['Faceoff %', 56, 44], ['Power play', '1/3', '0/2']].map(([k, a, h], i) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.textBright, fontWeight: 700, width: 40 }}>{a}</span>
                <span style={{ flex: 1, textAlign: 'center', fontSize: 10, color: NM.textMuted }}>{k}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.text, fontWeight: 700, width: 40, textAlign: 'right' }}>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── MOBILE — FINAL ────────────────────────────────────────────────
function MobileGameFinal() {
  const home = 'COL', away = 'EDM';
  return (
    <PhoneFrame label="Mobile · Game (FINAL)" width={390} height={1800} statusBar={true}>
      <div style={{ background: NM.bg, color: NM.textBright, minHeight: '100%' }}>
        <BrandedHeaderMobile/>

        {/* HERO FINAL */}
        <div style={{ position: 'relative', padding: '14px 16px 20px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            <div style={{ flex: 1, background: `linear-gradient(135deg, ${TEAMS[away].c}cc 0%, ${NM.bg} 100%)` }}/>
            <div style={{ flex: 1, background: `linear-gradient(225deg, ${TEAMS[home].c}cc 0%, ${NM.bg} 100%)` }}/>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.text, fontWeight: 700, letterSpacing: 1.2 }}>FINAL · R2 G4</span>
              <span style={{ padding: '2px 7px', borderRadius: 3, fontFamily: NM.fontMono, fontSize: 8, color: NM.rise, fontWeight: 800, background: NM.riseDim, border: `1px solid ${NM.rise}55` }}>✓ PICK HIT</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <TeamBadge code={away} size={48}/>
                <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 13, color: NM.textBright }}>Oilers</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.heat, fontWeight: 700 }}>WON</span>
              </div>
              <span style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 64, color: NM.textBright, letterSpacing: -2.4, lineHeight: 1 }}>5</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 14, color: NM.textMuted }}>—</span>
              <span style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 64, color: NM.text, letterSpacing: -2.4, lineHeight: 1 }}>2</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <TeamBadge code={home} size={48}/>
                <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 13, color: NM.text }}>Avs</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.textMuted, fontWeight: 700 }}>LOST</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI RECAP */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.heat}55`, borderRadius: 12, padding: 14, boxShadow: `0 0 10px ${NM.heat}22` }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.story, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>AI RECAP</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 17, letterSpacing: -0.4, color: NM.textBright, lineHeight: 1.2, marginBottom: 8, textWrap: 'pretty' }}>
              McDavid put on a clinic.
            </div>
            <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.5 }}>
              Hat trick + 1 assist. EDM controlled the middle, generated 14 HDC, perfect on PK. MacKinnon held off the scoresheet for the first time this round.
            </div>
          </div>
        </div>

        {/* THREE STARS */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>THREE STARS</div>
          {[
            { star: 1, n: 'Connor McDavid', t: away, l: '3G 1A · +3', h: 98 },
            { star: 2, n: 'Stuart Skinner',  t: away, l: '34 saves · .919', h: 84 },
            { star: 3, n: 'Mikko Rantanen',  t: home, l: '1G 1A · -2', h: 78 },
          ].map(s => (
            <div key={s.star} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12,
              background: NM.bgCard, border: `1px solid ${s.star === 1 ? NM.heat + '55' : NM.borderSoft}`, borderRadius: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 20,
                color: s.star === 1 ? NM.heat : s.star === 2 ? NM.gold : NM.text, width: 22 }}>★{s.star}</span>
              <TeamBadge code={s.t} size={22}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: NM.textBright, fontWeight: 700 }}>{s.n}</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>{s.l}</div>
              </div>
              <HeatPill h={s.h} size="sm"/>
            </div>
          ))}
        </div>

        {/* PICK */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.rise}55`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.rise, fontWeight: 800, letterSpacing: 1.2, marginBottom: 8 }}>✓ PICK HIT · WAS 58% EDM</div>
            <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.5, marginBottom: 10 }}>
              Model loved EDM. McDavid Heat 94, special teams edge. Both factors delivered.
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['EDM 58%','Special teams','McDavid 94'].map(t => (
                <span key={t} style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.rise, fontWeight: 700,
                  padding: '3px 6px', background: NM.riseDim, borderRadius: 3, border: `1px solid ${NM.rise}55` }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* HEAT IMPACT */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>HEAT MOVED</div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: 12 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.rise, fontWeight: 700, marginBottom: 6 }}>↑ HEATING UP</div>
            {[{n:'McDavid',t:away,was:94,now:98,d:'+4'},{n:'Skinner',t:away,was:76,now:84,d:'+8'}].map((p,i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <TeamBadge code={p.t} size={18}/>
                <span style={{ flex: 1, fontSize: 12, color: NM.textBright }}>{p.n}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>{p.was}→</span>
                <HeatPill h={p.now} size="sm"/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 700 }}>{p.d}</span>
              </div>
            ))}
            <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.cold, fontWeight: 700, marginTop: 10, marginBottom: 6 }}>↓ COOLING OFF</div>
            {[{n:'Makar',t:home,was:81,now:74,d:'-7'},{n:'Georgiev',t:home,was:58,now:51,d:'-7'}].map((p,i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <TeamBadge code={p.t} size={18}/>
                <span style={{ flex: 1, fontSize: 12, color: NM.textBright }}>{p.n}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>{p.was}→</span>
                <HeatPill h={p.now} size="sm"/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.cold, fontWeight: 700 }}>{p.d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* HIGHLIGHTS */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>IF YOU MISSED IT</div>
          {[
            { t: 'McDavid breakaway · 8:47 P2', d: 'The dagger', team: away },
            { t: 'Rantanen one-timer · 13:22 P1', d: 'PP equalizer', team: home },
          ].map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 8, marginBottom: 6 }}>
              <div style={{ width: 42, height: 32, borderRadius: 4, background: `linear-gradient(135deg, ${TEAMS[h.team].c}aa, ${NM.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 13, color: '#fff' }}>▶</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: NM.textBright, fontWeight: 600 }}>{h.t}</div>
                <div style={{ fontSize: 10, color: NM.textMuted }}>{h.d}</div>
              </div>
            </div>
          ))}
        </div>

        {/* SERIES NOW */}
        <div style={{ padding: '0 16px 24px' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>SERIES NOW</div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: 12 }}>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, color: NM.textBright }}>EDM 3 — 1 COL</div>
            <div style={{ fontSize: 11, color: NM.text, marginBottom: 10 }}>EDM advances with <b style={{ color: NM.rise }}>1 win</b>. Series odds <b style={{ color: NM.heat }}>EDM 84%</b>.</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[{w:'COL'},{w:'EDM'},{w:'EDM'},{w:'EDM',just:true},{},{},{}].map((g, i) => (
                <div key={i} style={{ flex: 1, padding: '6px 0', textAlign: 'center',
                  background: g.just ? NM.heatDim : (g.w ? NM.bg : 'transparent'),
                  border: `1px solid ${g.just ? NM.heat : NM.borderSoft}`, borderRadius: 4 }}>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.textMuted, fontWeight: 700 }}>G{i+1}</div>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: g.w ? NM.textBright : NM.textMuted, fontWeight: 700, marginTop: 2 }}>{g.w || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── ENHANCED SCHEDULE (DESKTOP) ───────────────────────────────────
function DesktopScheduleEnhanced() {
  const days = [
    { date: 'TONIGHT · APR 30', sub: 'STANLEY CUP · ROUND 2', games: [
      { a: 'EDM', h: 'COL', t: '8:00 PM', p: 'EDM', c: 58, star: 'McDavid', sh: 94, series: 'EDM 2-1', marquee: true, watch: 96 },
      { a: 'TOR', h: 'FLA', t: '7:00 PM', p: 'FLA', c: 54, star: 'Tkachuk', sh: 82, series: 'FLA 2-1', marquee: true, watch: 88 },
      { a: 'NYR', h: 'CAR', t: '7:30 PM', p: 'CAR', c: 53, star: 'Aho',     sh: 79, series: 'CAR 2-1', marquee: false, watch: 71 },
    ]},
    { date: 'TOMORROW · MAY 1', games: [
      { a: 'WPG', h: 'VGK', t: '9:00 PM', p: 'VGK', c: 61, star: 'Eichel', sh: 79, series: 'VGK 3-0', marquee: false, watch: 64 },
    ]},
    { date: 'YESTERDAY · APR 29 · FINAL', games: [
      { a: 'EDM', h: 'COL', as: 5, hs: 2, p: 'EDM', c: 58, hit: true,  star: 'McDavid', sh: 98, series: 'EDM 2-1→3-1 after' },
      { a: 'FLA', h: 'TOR', as: 4, hs: 3, p: 'FLA', c: 54, hit: true,  star: 'Tkachuk', sh: 86, series: 'FLA 1-1→2-1 after' },
      { a: 'CAR', h: 'NYR', as: 2, hs: 4, p: 'CAR', c: 56, hit: false, star: 'Shesterkin', sh: 88, series: 'CAR 1-1→1-2 after' },
    ]},
  ];

  return (
    <DCArtboard label="Desktop · Schedule (enhanced) · 1440" width={1440} height={1480}
      style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <BrandedHeaderDesktop active="Tonight"/>
      <div style={{ padding: '32px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 8 }}>SCHEDULE · LIVE</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 44, letterSpacing: -1.5, lineHeight: 1, color: NM.textBright }}>All games. Every prediction.</div>
            <div style={{ fontSize: 13, color: NM.text, marginTop: 10 }}>YTD pick accuracy <b style={{ color: NM.rise }}>67%</b> · This round <b style={{ color: NM.rise }}>71%</b></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Today','Tomorrow','This week','Custom'].map((l, i) => (
              <span key={l} style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                color: i === 0 ? NM.heat : NM.text, background: i === 0 ? NM.heatDim : NM.bgCard,
                border: `1px solid ${i === 0 ? NM.heat + '55' : NM.border}` }}>{l}</span>
            ))}
          </div>
        </div>

        {days.map(d => (
          <div key={d.date} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.4 }}>{d.date}</span>
              {d.sub && <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1, padding: '3px 8px', background: NM.heatDim, borderRadius: 3, border: `1px solid ${NM.heat}55` }}>{d.sub}</span>}
              <span style={{ flex: 1, height: 1, background: NM.borderSoft }}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>{d.games.length} game{d.games.length > 1 ? 's' : ''}</span>
            </div>
            <div style={{ background: NM.bgCard, borderRadius: 14, border: `1px solid ${NM.border}`, overflow: 'hidden' }}>
              {d.games.map((g, gi) => (
                <div key={gi} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 200px 200px 200px 60px 30px',
                  gap: 14, alignItems: 'center', padding: '16px 22px',
                  borderTop: gi ? `1px solid ${NM.borderSoft}` : 'none',
                  background: g.marquee ? `linear-gradient(90deg, ${NM.heatDim} 0%, transparent 60%)` : 'transparent' }}>
                  {/* Time / status */}
                  <div>
                    {g.as !== undefined ? (
                      <>
                        <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.text, fontWeight: 700 }}>FINAL</div>
                        {g.hit !== undefined && (
                          <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: g.hit ? NM.rise : NM.cold, fontWeight: 700, letterSpacing: 0.8 }}>
                            {g.hit ? '✓ HIT' : '✗ MISS'}
                          </span>
                        )}
                      </>
                    ) : (
                      <div style={{ fontFamily: NM.fontMono, fontSize: 13, color: NM.textBright, fontWeight: 700 }}>{g.t}</div>
                    )}
                  </div>
                  {/* Teams */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {g.marquee && <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, padding: '2px 6px', background: NM.bg, borderRadius: 3, border: `1px solid ${NM.heat}66` }}>★</span>}
                    <TeamBadge code={g.a} ringed={g.p === g.a}/>
                    {g.as !== undefined && (
                      <span style={{ fontFamily: NM.fontMono, fontSize: 18, fontWeight: 800, color: g.as > g.hs ? NM.textBright : NM.textMuted, width: 24, textAlign: 'right' }}>{g.as}</span>
                    )}
                    <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>{g.as !== undefined ? '–' : 'at'}</span>
                    {g.as !== undefined && (
                      <span style={{ fontFamily: NM.fontMono, fontSize: 18, fontWeight: 800, color: g.hs > g.as ? NM.textBright : NM.textMuted, width: 24 }}>{g.hs}</span>
                    )}
                    <TeamBadge code={g.h} ringed={g.p === g.h}/>
                    {g.series && <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.text, fontWeight: 600, marginLeft: 8 }}>· {g.series}</span>}
                  </div>
                  {/* Pick */}
                  <div>
                    <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>OUR PICK</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <TeamBadge code={g.p} size={18}/>
                      <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.textBright, fontWeight: 700 }}>{g.c}%</span>
                    </div>
                  </div>
                  {/* Watch */}
                  <div>
                    <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>WATCH FOR</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: NM.textBright, fontWeight: 600 }}>{g.star}</span>
                      <HeatPill h={g.sh} size="sm"/>
                    </div>
                  </div>
                  {/* Watchability score (or post) */}
                  <div>
                    {g.watch !== undefined ? (
                      <>
                        <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.gold, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>WATCHABILITY</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: NM.fontMono, fontSize: 16, fontWeight: 800, color: NM.gold }}>{g.watch}</span>
                          <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>/100</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>RECAP</div>
                        <span style={{ fontSize: 11, color: NM.heat, fontFamily: NM.fontMono, fontWeight: 700 }}>READ →</span>
                      </>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: NM.textMuted }}>+12 stories</span>
                  <span style={{ color: NM.textMuted, fontSize: 18 }}>›</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DCArtboard>
  );
}

Object.assign(window, {
  DesktopGameUpcoming, DesktopGameLive, DesktopGameFinal,
  MobileGameUpcoming,  MobileGameLive,  MobileGameFinal,
  DesktopScheduleEnhanced, GameSection, FormStreak,
});
