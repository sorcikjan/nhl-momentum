// Season-start homepage v3 — LAST NIGHT in the spotlight, then storylines,
// then matches to watch (with 3 players per team), then players to watch.
// Carries last season's Heat forward so nothing starts blank.

// ─── 1. LAST NIGHT SPOTLIGHT (the reason people open the site) ───
function LastNightSpotlight() {
  const lead = {
    a: 'EDM', h: 'VAN', as: 6, hs: 3, hit: true, pick: 'EDM', conf: 61,
    head: 'McDavid opened the season exactly where he ended it.',
    dek: 'Four points in Vancouver, and a Heat score that barely had to move — he finished last year at 94.',
    star: { n: 'Connor McDavid', t: 'EDM', h: 95, line: '2G 2A · 22:41 TOI' },
  };
  const rest = [
    { a: 'FLA', h: 'BOS', as: 4, hs: 2, hit: true,  pick: 'FLA', conf: 56, star: 'Bobrovsky', sh: 93, note: '34 saves on banner night' },
    { a: 'TOR', h: 'MTL', as: 3, hs: 5, hit: false, pick: 'TOR', conf: 58, star: 'Slafkovsky', sh: 72, note: 'OT winner, 2 points' },
  ];
  const hits = [lead, ...rest].filter(g => g.hit).length;

  return (
    <div>
      {/* Section head */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: NM.heat, boxShadow: `0 0 12px ${NM.heat}` }}/>
            <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 2 }}>
              LAST NIGHT · OCT 7 · 3 GAMES
            </span>
          </div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 44, letterSpacing: -1.6, lineHeight: 1, color: NM.textBright }}>
            Night one is in the books.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px',
          background: NM.bgCard, border: `1px solid ${NM.rise}44`, borderRadius: 10 }}>
          <div>
            <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 1 }}>OUR PICKS</div>
            <div style={{ fontFamily: NM.fontMono, fontSize: 24, color: NM.rise, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 }}>
              {hits}/3
            </div>
          </div>
          <div style={{ width: 1, height: 34, background: NM.borderSoft }}/>
          <div style={{ fontSize: 12, color: NM.text, maxWidth: 150, lineHeight: 1.4 }}>
            Every pick graded, every night. <b style={{ color: NM.textBright }}>67%</b> last season.
          </div>
        </div>
      </div>

      {/* Spotlight grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        {/* Lead game — big */}
        <div style={{ background: NM.bgCard, border: `1px solid ${NM.heat}55`, borderRadius: 14,
          overflow: 'hidden', boxShadow: `0 0 30px ${NM.heat}1a` }}>
          {/* Photo band */}
          <div style={{ position: 'relative', height: 230,
            background: `linear-gradient(150deg, ${TEAMS[lead.a].c} 0%, ${NM.bg} 85%)` }}>
            <div style={{ position: 'absolute', inset: 0,
              background: 'repeating-linear-gradient(120deg, transparent 0 22px, rgba(255,255,255,0.03) 22px 23px)' }}/>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 35%, rgba(10,11,15,0.9) 100%)' }}/>
            <div style={{ position: 'absolute', top: 14, left: 16, fontFamily: NM.fontMono, fontSize: 9,
              color: 'rgba(255,255,255,0.5)', letterSpacing: 1.2, fontWeight: 700 }}>HIGHLIGHT PHOTO</div>
            <div style={{ position: 'absolute', top: 14, right: 16, display: 'flex', gap: 8 }}>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, fontWeight: 800, letterSpacing: 1,
                color: NM.rise, padding: '4px 9px', borderRadius: 4,
                background: 'rgba(10,11,15,0.7)', border: `1px solid ${NM.rise}66` }}>✓ PICK HIT · {lead.pick} {lead.conf}%</span>
            </div>
            {/* Scoreline */}
            <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20,
              display: 'flex', alignItems: 'center', gap: 14 }}>
              <TeamBadge code={lead.a} size={44}/>
              <span style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 46, color: '#fff', letterSpacing: -2, lineHeight: 1 }}>{lead.as}</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>—</span>
              <span style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 46, color: 'rgba(255,255,255,0.55)', letterSpacing: -2, lineHeight: 1 }}>{lead.hs}</span>
              <TeamBadge code={lead.h} size={44}/>
              <span style={{ flex: 1 }}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 1 }}>FINAL</span>
            </div>
          </div>
          {/* Body */}
          <div style={{ padding: '20px 22px 22px' }}>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 26, letterSpacing: -0.8,
              lineHeight: 1.15, color: NM.textBright, marginBottom: 10, textWrap: 'pretty' }}>
              {lead.head}
            </div>
            <div style={{ fontSize: 14, color: NM.text, lineHeight: 1.55, marginBottom: 18 }}>{lead.dek}</div>
            {/* Star of the night */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14,
              background: NM.bg, border: `1px solid ${NM.heat}33`, borderRadius: 10 }}>
              <PlayerPhoto name={lead.star.n} team={lead.star.t} size={56} ratio={0.85}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 4 }}>STAR OF THE NIGHT</div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 16, color: NM.textBright, letterSpacing: -0.3 }}>{lead.star.n}</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, marginTop: 2 }}>{lead.star.line}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <HeatPill h={lead.star.h}/>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.rise, fontWeight: 700, marginTop: 5 }}>↑ +1 vs last yr</div>
              </div>
            </div>
            <div style={{ marginTop: 14, fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 0.5 }}>
              FULL RECAP + HIGHLIGHTS →
            </div>
          </div>
        </div>

        {/* Other results + highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rest.map((g, i) => (
            <div key={i} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, fontWeight: 800, letterSpacing: 1,
                  color: g.hit ? NM.rise : NM.cold, padding: '3px 8px', borderRadius: 3,
                  background: g.hit ? NM.riseDim : 'rgba(58,136,255,0.12)',
                  border: `1px solid ${g.hit ? NM.rise + '55' : NM.cold + '55'}` }}>
                  {g.hit ? '✓ HIT' : '✗ MISS'}
                </span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 600 }}>
                  picked {g.pick} {g.conf}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
                <TeamBadge code={g.a} size={30}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 24, fontWeight: 800,
                  color: g.as > g.hs ? NM.textBright : NM.textMuted, letterSpacing: -1 }}>{g.as}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted }}>—</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 24, fontWeight: 800,
                  color: g.hs > g.as ? NM.textBright : NM.textMuted, letterSpacing: -1 }}>{g.hs}</span>
                <TeamBadge code={g.h} size={30}/>
                <span style={{ flex: 1 }}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700 }}>FINAL</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, borderTop: `1px solid ${NM.borderSoft}` }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700 }}>★</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: NM.textBright, fontWeight: 600 }}>{g.star}</div>
                  <div style={{ fontSize: 10, color: NM.textMuted, marginTop: 1 }}>{g.note}</div>
                </div>
                <HeatPill h={g.sh} size="sm"/>
              </div>
            </div>
          ))}
          {/* Highlight reel strip */}
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 12, padding: 16, flex: 1 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 12 }}>HIGHLIGHTS · 3 CLIPS</div>
            {[
              { t: "McDavid's 4-point opener", team: 'EDM', d: '1:12' },
              { t: 'Bobrovsky, 34 saves', team: 'FLA', d: '0:48' },
              { t: "Slafkovsky's OT winner", team: 'MTL', d: '0:31' },
            ].map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0',
                borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <div style={{ width: 52, height: 36, borderRadius: 5, flexShrink: 0, position: 'relative',
                  background: `linear-gradient(135deg, ${TEAMS[h.team].c}cc, ${NM.bg})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)' }}>▶</span>
                </div>
                <span style={{ flex: 1, fontSize: 12, color: NM.textBright, fontWeight: 600, lineHeight: 1.3 }}>{h.t}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted }}>{h.d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 2. STORYLINES (right after last night) ───
function NightStorylines() {
  const stories = [
    { k: 'WHAT WE LEARNED', t: "Edmonton's top line looks unchanged — and that's the scariest part.",
      d: 'McDavid and Draisaitl combined for 6 points on night one. Our model already had them as the highest-Heat duo in hockey.', team: 'EDM', tag: 'HEAT 95' },
    { k: 'THE MISS', t: 'Montreal beat our pick, and the reason is on their third line.',
      d: "Slafkovsky's line out-chanced Toronto 14–6. The model underweighted their summer additions.", team: 'MTL', tag: 'PICK ✗' },
    { k: 'GOALIE WATCH', t: 'Bobrovsky picked up in October where he left off in June.',
      d: '34 saves, .944 on the night. He finished last season as our top-Heat goalie at 92.', team: 'FLA', tag: 'SV% .944' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.story, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>STORYLINES · WRITTEN OVERNIGHT</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 36, letterSpacing: -1.2, lineHeight: 1, color: NM.textBright, marginBottom: 10 }}>
            What the data found while you slept.
          </div>
          <div style={{ fontSize: 14, color: NM.text, lineHeight: 1.5, maxWidth: 620 }}>
            Every morning we read the box scores so you don't have to — including the games where our own pick was wrong.
          </div>
        </div>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.story, fontWeight: 700 }}>ALL STORIES →</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {stories.map((s, i) => (
          <div key={i} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ aspectRatio: '16/9', position: 'relative',
              background: `linear-gradient(155deg, ${TEAMS[s.team].c}cc 0%, ${NM.bg} 100%)` }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: NM.fontMono, fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 2 }}>PHOTO</div>
              <div style={{ position: 'absolute', top: 12, left: 12 }}><TeamBadge code={s.team} size={26}/></div>
              <div style={{ position: 'absolute', top: 12, right: 12, padding: '3px 9px', borderRadius: 999,
                background: 'rgba(10,11,15,0.78)', border: `1px solid ${NM.borderSoft}`,
                fontFamily: NM.fontMono, fontSize: 9, color: NM.textBright, fontWeight: 700 }}>{s.tag}</div>
            </div>
            <div style={{ padding: '18px 20px 20px' }}>
              <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.story, fontWeight: 700, letterSpacing: 1.4, marginBottom: 10 }}>{s.k}</div>
              <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 18, letterSpacing: -0.4,
                lineHeight: 1.2, color: NM.textBright, marginBottom: 8, textWrap: 'pretty' }}>{s.t}</div>
              <div style={{ fontSize: 12.5, color: NM.text, lineHeight: 1.55 }}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 3. MATCHES TO WATCH — predictions + 3 players per team ───
const WATCH_GAMES = [
  { a: 'COL', h: 'DAL', t: '8:00 PM', p: 'COL', c: 57, watch: 93,
    why: 'Two of the four highest-Heat rosters in the West, on night two.',
    away: [
      { n: 'Nathan MacKinnon', pos: 'C',  h: 91, l: '128 pts last yr' },
      { n: 'Cale Makar',       pos: 'D',  h: 87, l: 'Norris winner' },
      { n: 'Mikko Rantanen',   pos: 'RW', h: 83, l: '104 pts last yr' },
    ],
    home: [
      { n: 'Jason Robertson',  pos: 'LW', h: 82, l: '89 pts last yr' },
      { n: 'Wyatt Johnston',   pos: 'C',  h: 76, l: '+11 Heat trend' },
      { n: 'Jake Oettinger',   pos: 'G',  h: 79, l: '.918 SV%' },
    ] },
  { a: 'NYR', h: 'CAR', t: '7:00 PM', p: 'CAR', c: 54, watch: 87,
    why: 'Metro rematch. Carolina keeps the shot volume; New York keeps Shesterkin.',
    away: [
      { n: 'Igor Shesterkin',  pos: 'G',  h: 89, l: 'Top-Heat goalie #2' },
      { n: 'Artemi Panarin',   pos: 'LW', h: 81, l: '92 pts last yr' },
      { n: 'Adam Fox',         pos: 'D',  h: 77, l: '68 pts from D' },
    ],
    home: [
      { n: 'Sebastian Aho',    pos: 'C',  h: 80, l: '87 pts last yr' },
      { n: 'Seth Jarvis',      pos: 'RW', h: 74, l: '+9 Heat trend' },
      { n: 'Jaccob Slavin',    pos: 'D',  h: 71, l: 'Best PK D-man' },
    ] },
];

function MatchesToWatch({ games = WATCH_GAMES }) {
  const TeamCol = ({ code, players, favoured, align = 'left' }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
        <TeamBadge code={code} size={30} ringed={favoured}/>
        <div style={{ textAlign: align }}>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 14, color: NM.textBright, letterSpacing: -0.2 }}>
            {TEAMS[code]?.name || code}
          </div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: favoured ? NM.heat : NM.textMuted, fontWeight: 700, letterSpacing: 0.8 }}>
            {favoured ? 'OUR PICK' : align === 'right' ? 'HOME' : 'AWAY'}
          </div>
        </div>
      </div>
      {players.map(p => (
        <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
          flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
          <PlayerPhoto name={p.n} team={code} size={34} ratio={1}/>
          <div style={{ flex: 1, minWidth: 0, textAlign: align }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: NM.textBright, lineHeight: 1.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.n}</div>
            <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, marginTop: 2 }}>{p.pos} · {p.l}</div>
          </div>
          <HeatPill h={p.h} size="sm"/>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>TONIGHT · MATCHES TO WATCH</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 36, letterSpacing: -1.2, lineHeight: 1, color: NM.textBright, marginBottom: 10 }}>
            Two games worth your evening.
          </div>
          <div style={{ fontSize: 14, color: NM.text, lineHeight: 1.5, maxWidth: 660 }}>
            Our pick on every game, plus the <b style={{ color: NM.textBright }}>three players from each team</b> most likely to decide it — ranked by the Heat they carried out of last season.
          </div>
        </div>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700 }}>ALL 8 GAMES →</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {games.map((g, i) => (
          <div key={i} style={{ background: NM.bgCard,
            border: `1px solid ${i === 0 ? NM.heat + '55' : NM.border}`, borderRadius: 14, overflow: 'hidden',
            boxShadow: i === 0 ? `0 0 24px ${NM.heat}14` : 'none' }}>
            {/* Probability band */}
            <div style={{ display: 'flex', height: 58, position: 'relative' }}>
              <div style={{ flex: g.c, background: `linear-gradient(135deg, ${TEAMS[g.p].c} 0%, ${TEAMS[g.p].c}aa 100%)`,
                display: 'flex', alignItems: 'center', padding: '0 18px' }}>
                <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 17, letterSpacing: -0.3, color: TEAMS[g.p].t }}>
                  {g.p} {g.c}%
                </span>
              </div>
              <div style={{ flex: 100 - g.c, background: NM.bgRaised, display: 'flex', alignItems: 'center',
                justifyContent: 'flex-end', padding: '0 18px' }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 13, color: NM.textMuted, fontWeight: 700 }}>
                  {g.p === g.a ? g.h : g.a} {100 - g.c}%
                </span>
              </div>
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px 0' }}>
              <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textBright, fontWeight: 700 }}>{g.t} ET</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.gold, fontWeight: 700, padding: '3px 8px',
                background: `${NM.gold}22`, borderRadius: 3, border: `1px solid ${NM.gold}55` }}>WATCHABILITY {g.watch}</span>
              <span style={{ flex: 1, fontSize: 13, color: NM.text, textAlign: 'right' }}>{g.why}</span>
            </div>

            {/* Three players per team */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '16px 20px 20px' }}>
              <TeamCol code={g.a} players={g.away} favoured={g.p === g.a} align="left"/>
              <div style={{ width: 1, alignSelf: 'stretch', background: NM.borderSoft }}/>
              <TeamCol code={g.h} players={g.home} favoured={g.p === g.h} align="right"/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 4. PLAYERS TO WATCH — carried-over Heat, retitled ───
function PlayersToWatch() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>PLAYERS TO WATCH · CARRIED FROM LAST SEASON</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 36, letterSpacing: -1.2, lineHeight: 1, color: NM.textBright, marginBottom: 10 }}>
            Nobody starts from zero.
          </div>
          <div style={{ fontSize: 14, color: NM.text, lineHeight: 1.5, maxWidth: 700 }}>
            Heat carries over. These are the three lists we seeded from final 2025–26 form — so night one already has a leaderboard, and it starts moving again immediately.
          </div>
        </div>
        <div style={{ padding: '10px 14px', background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10, textAlign: 'right' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 1 }}>SEEDED FROM</div>
          <div style={{ fontSize: 12, color: NM.textBright, fontWeight: 600, marginTop: 3 }}>1,312 games · 2025–26</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <RankingShowcase kicker="SKATERS" title="Hottest skaters" sub="Seeded from final 2025–26 Heat" color={NM.heat} list={RANK_SKATERS}/>
        <RankingShowcase kicker="GOALIES" title="Best in net" sub="Seeded from final 2025–26 Heat" color={NM.cold} list={RANK_GOALIES}/>
        <RankingShowcase kicker="FRESH FACES" title="Young & rising" sub="Under 23 · projected to climb" color={NM.rise} list={RANK_FRESH}/>
      </div>
    </div>
  );
}

// ═══════════════════════ DESKTOP v3 ═══════════════════════
function DesktopSeasonStartV3() {
  return (
    <DCArtboard label="Desktop · Homepage · SEASON START v3 · 1440" width={1440}
      style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <BrandedHeaderDesktop active="Tonight" status={{ live: false, label: 'TONIGHT · 2' }}/>
      <SeasonValueStrip/>
      <SeasonOpenerBar/>
      <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 56 }}>
        <LastNightSpotlight/>
        <NightStorylines/>
        <MatchesToWatch/>
        <PlayersToWatch/>
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

// ═══════════════════════ MOBILE v3 ═══════════════════════
function MobileSeasonStartV3() {
  return (
    <PhoneFrame label="Mobile · Homepage · SEASON START v3" width={390} height={3560} statusBar={true}>
      <div style={{ background: NM.bg, color: NM.textBright, minHeight: '100%' }}>
        <BrandedHeaderMobile status={{ live: false, label: 'TONIGHT 2' }}/>

        {/* Value + opener */}
        <div style={{ padding: '12px 16px', background: `linear-gradient(90deg, ${NM.heatDim} 0%, transparent 100%)`,
          borderBottom: `1px solid ${NM.heat}33` }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 4 }}>SEASON UNDER WAY · WEEK 1</div>
          <div style={{ fontSize: 11, color: NM.text, lineHeight: 1.45 }}>
            Every player carries a <span style={{ color: NM.heat, fontWeight: 700 }}>Heat score 0–100</span> from last season. We pick every game. <span style={{ color: NM.text }}>67% last year.</span>
          </div>
        </div>

        {/* 1. LAST NIGHT SPOTLIGHT */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: NM.heat, boxShadow: `0 0 8px ${NM.heat}` }}/>
            <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.6 }}>LAST NIGHT · 3 GAMES</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 28, letterSpacing: -1, lineHeight: 1 }}>
              Night one is<br/>in the books.
            </div>
            <div style={{ padding: '7px 11px', background: NM.bgCard, border: `1px solid ${NM.rise}44`, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontFamily: NM.fontMono, fontSize: 16, color: NM.rise, fontWeight: 800, lineHeight: 1 }}>2/3</div>
              <div style={{ fontFamily: NM.fontMono, fontSize: 7, color: NM.textMuted, fontWeight: 700, letterSpacing: 0.8, marginTop: 3 }}>PICKS HIT</div>
            </div>
          </div>

          {/* Lead game */}
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.heat}55`, borderRadius: 12, overflow: 'hidden',
            marginBottom: 10, boxShadow: `0 0 16px ${NM.heat}1a` }}>
            <div style={{ position: 'relative', height: 150,
              background: `linear-gradient(150deg, ${TEAMS.EDM.c} 0%, ${NM.bg} 85%)` }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(10,11,15,0.9) 100%)' }}/>
              <div style={{ position: 'absolute', top: 10, left: 12, fontFamily: NM.fontMono, fontSize: 8,
                color: 'rgba(255,255,255,0.5)', letterSpacing: 1, fontWeight: 700 }}>HIGHLIGHT PHOTO</div>
              <div style={{ position: 'absolute', top: 10, right: 12, fontFamily: NM.fontMono, fontSize: 9, fontWeight: 800,
                color: NM.rise, padding: '3px 7px', borderRadius: 3,
                background: 'rgba(10,11,15,0.7)', border: `1px solid ${NM.rise}66` }}>✓ HIT · EDM 61%</div>
              <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <TeamBadge code="EDM" size={30}/>
                <span style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 30, color: '#fff', letterSpacing: -1.4, lineHeight: 1 }}>6</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>—</span>
                <span style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 30, color: 'rgba(255,255,255,0.55)', letterSpacing: -1.4, lineHeight: 1 }}>3</span>
                <TeamBadge code="VAN" size={30}/>
                <span style={{ flex: 1 }}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 8, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>FINAL</span>
              </div>
            </div>
            <div style={{ padding: '14px 16px 16px' }}>
              <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 18, letterSpacing: -0.5,
                lineHeight: 1.2, color: NM.textBright, marginBottom: 8, textWrap: 'pretty' }}>
                McDavid opened the season exactly where he ended it.
              </div>
              <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.5, marginBottom: 14 }}>
                Four points in Vancouver, and a Heat score that barely had to move.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 12,
                background: NM.bg, border: `1px solid ${NM.heat}33`, borderRadius: 9 }}>
                <PlayerPhoto name="Connor McDavid" team="EDM" size={42} ratio={0.85}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 3 }}>STAR OF THE NIGHT</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: NM.textBright }}>Connor McDavid</div>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, marginTop: 1 }}>2G 2A · 22:41</div>
                </div>
                <HeatPill h={95} size="sm"/>
              </div>
            </div>
          </div>

          {/* Other results */}
          {[
            { a: 'FLA', h: 'BOS', as: 4, hs: 2, hit: true,  pick: 'FLA', conf: 56, star: 'Bobrovsky', sh: 93 },
            { a: 'TOR', h: 'MTL', as: 3, hs: 5, hit: false, pick: 'TOR', conf: 58, star: 'Slafkovsky', sh: 72 },
          ].map((g, i) => (
            <div key={i} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10,
              padding: 13, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 8, fontWeight: 800, letterSpacing: 1,
                  color: g.hit ? NM.rise : NM.cold, padding: '2px 7px', borderRadius: 3,
                  background: g.hit ? NM.riseDim : 'rgba(58,136,255,0.12)' }}>{g.hit ? '✓ HIT' : '✗ MISS'}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 600 }}>picked {g.pick} {g.conf}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <TeamBadge code={g.a} size={24}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 18, fontWeight: 800,
                  color: g.as > g.hs ? NM.textBright : NM.textMuted, letterSpacing: -0.8 }}>{g.as}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted }}>—</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 18, fontWeight: 800,
                  color: g.hs > g.as ? NM.textBright : NM.textMuted, letterSpacing: -0.8 }}>{g.hs}</span>
                <TeamBadge code={g.h} size={24}/>
                <span style={{ flex: 1 }}/>
                <span style={{ fontSize: 11, color: NM.textBright, fontWeight: 600 }}>{g.star}</span>
                <HeatPill h={g.sh} size="sm"/>
              </div>
            </div>
          ))}

          {/* Highlights */}
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10, padding: 13 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 10 }}>HIGHLIGHTS</div>
            {[
              { t: "McDavid's 4-point opener", team: 'EDM', d: '1:12' },
              { t: 'Bobrovsky, 34 saves', team: 'FLA', d: '0:48' },
              { t: "Slafkovsky's OT winner", team: 'MTL', d: '0:31' },
            ].map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <div style={{ width: 46, height: 32, borderRadius: 4, flexShrink: 0,
                  background: `linear-gradient(135deg, ${TEAMS[h.team].c}cc, ${NM.bg})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)' }}>▶</span>
                </div>
                <span style={{ flex: 1, fontSize: 11, color: NM.textBright, fontWeight: 600 }}>{h.t}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.textMuted }}>{h.d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. STORYLINES */}
        <div style={{ padding: '26px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.story, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>STORYLINES · OVERNIGHT</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 24, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 8 }}>
            What the data found<br/>while you slept.
          </div>
          <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.45, marginBottom: 14 }}>
            Including the games where our own pick was wrong.
          </div>
          {[
            { k: 'WHAT WE LEARNED', t: "Edmonton's top line looks unchanged — and that's the scariest part.", team: 'EDM', tag: 'HEAT 95' },
            { k: 'THE MISS', t: 'Montreal beat our pick, and the reason is on their third line.', team: 'MTL', tag: 'PICK ✗' },
            { k: 'GOALIE WATCH', t: 'Bobrovsky picked up in October where he left off in June.', team: 'FLA', tag: '.944' },
          ].map((s, i) => (
            <div key={i} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 11,
              overflow: 'hidden', marginBottom: 9 }}>
              <div style={{ aspectRatio: '16/7', position: 'relative',
                background: `linear-gradient(155deg, ${TEAMS[s.team].c}cc 0%, ${NM.bg} 100%)` }}>
                <div style={{ position: 'absolute', top: 9, left: 10 }}><TeamBadge code={s.team} size={20}/></div>
                <div style={{ position: 'absolute', top: 9, right: 10, padding: '2px 7px', borderRadius: 999,
                  background: 'rgba(10,11,15,0.78)', fontFamily: NM.fontMono, fontSize: 8, color: NM.textBright, fontWeight: 700 }}>{s.tag}</div>
              </div>
              <div style={{ padding: '12px 14px 14px' }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.story, fontWeight: 700, letterSpacing: 1.2, marginBottom: 6 }}>{s.k}</div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 14, letterSpacing: -0.2,
                  lineHeight: 1.25, color: NM.textBright, textWrap: 'pretty' }}>{s.t}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 3. MATCHES TO WATCH */}
        <div style={{ padding: '26px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>TONIGHT · MATCHES TO WATCH</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 24, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 8 }}>
            Two games worth<br/>your evening.
          </div>
          <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.45, marginBottom: 14 }}>
            Our pick, plus the <b style={{ color: NM.textBright }}>three players from each team</b> most likely to decide it.
          </div>
          {WATCH_GAMES.map((g, i) => (
            <div key={i} style={{ background: NM.bgCard,
              border: `1px solid ${i === 0 ? NM.heat + '55' : NM.borderSoft}`, borderRadius: 12,
              overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ display: 'flex', height: 42 }}>
                <div style={{ flex: g.c, background: `linear-gradient(135deg, ${TEAMS[g.p].c} 0%, ${TEAMS[g.p].c}aa 100%)`,
                  display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                  <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 14, color: TEAMS[g.p].t }}>{g.p} {g.c}%</span>
                </div>
                <div style={{ flex: 100 - g.c, background: NM.bgRaised, display: 'flex', alignItems: 'center',
                  justifyContent: 'flex-end', padding: '0 12px' }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, fontWeight: 700 }}>{100 - g.c}%</span>
                </div>
              </div>
              <div style={{ padding: '12px 14px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textBright, fontWeight: 700 }}>{g.t}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.gold, fontWeight: 700, padding: '2px 6px',
                  background: `${NM.gold}22`, borderRadius: 3 }}>WATCH {g.watch}</span>
              </div>
              <div style={{ padding: '4px 14px 10px', fontSize: 11, color: NM.text, lineHeight: 1.45 }}>{g.why}</div>
              {/* Teams stacked on mobile */}
              {[{ code: g.a, players: g.away, fav: g.p === g.a, label: 'AWAY' },
                { code: g.h, players: g.home, fav: g.p === g.h, label: 'HOME' }].map(side => (
                <div key={side.code} style={{ padding: '10px 14px', borderTop: `1px solid ${NM.borderSoft}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <TeamBadge code={side.code} size={22} ringed={side.fav}/>
                    <span style={{ fontSize: 12, fontWeight: 700, color: NM.textBright }}>{TEAMS[side.code]?.name}</span>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 8, color: side.fav ? NM.heat : NM.textMuted,
                      fontWeight: 700, letterSpacing: 0.8 }}>{side.fav ? 'OUR PICK' : side.label}</span>
                  </div>
                  {side.players.map(p => (
                    <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 0' }}>
                      <PlayerPhoto name={p.n} team={side.code} size={28} ratio={1}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: NM.textBright }}>{p.n}</div>
                        <div style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.textMuted, marginTop: 1 }}>{p.pos} · {p.l}</div>
                      </div>
                      <HeatPill h={p.h} size="sm"/>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* 4. PLAYERS TO WATCH */}
        <div style={{ padding: '26px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>PLAYERS TO WATCH</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 24, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 8 }}>
            Nobody starts from zero.
          </div>
          <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.45, marginBottom: 14 }}>
            Seeded from final 2025–26 Heat — night one already has a leaderboard.
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[['Skaters', NM.heat, true], ['Goalies', NM.cold, false], ['Fresh faces', NM.rise, false]].map(([l, c, active]) => (
              <span key={l} style={{ padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                color: active ? c : NM.text, background: active ? `${c}1a` : NM.bgCard,
                border: `1px solid ${active ? c + '55' : NM.border}` }}>{l}</span>
            ))}
          </div>
          {/* Hero */}
          <div style={{ background: `linear-gradient(160deg, ${TEAMS.EDM.c}33 0%, ${NM.bgCard} 65%)`,
            border: `1px solid ${NM.heat}55`, borderRadius: 12, padding: 15, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <PlayerPhoto name="Connor McDavid" team="EDM" size={78} ratio={0.8} rank={1}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <TeamBadge code="EDM" size={18}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 600 }}>C · Oilers</span>
                </div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 16, letterSpacing: -0.4, lineHeight: 1.1, marginBottom: 4 }}>
                  Connor McDavid
                </div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, marginBottom: 6 }}>132 pts · 1.72/gm</div>
                <div style={{ fontSize: 10.5, color: NM.text, lineHeight: 1.4 }}>Led the league in Heat for 19 straight weeks</div>
                <div style={{ marginTop: 8 }}><HeatPill h={94} size="sm"/></div>
              </div>
            </div>
          </div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: '4px 14px' }}>
            {RANK_SKATERS.slice(1).map((p, i) => (
              <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <span style={{ width: 12, fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700 }}>{i + 2}</span>
                <PlayerPhoto name={p.n} team={p.t} size={32} ratio={1}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: NM.textBright }}>{p.n}</div>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, marginTop: 1 }}>{p.l2}</div>
                </div>
                <HeatPill h={p.h} size="sm"/>
              </div>
            ))}
          </div>
          {[
            { label: 'GOALIES', color: NM.cold, list: RANK_GOALIES.slice(0, 3) },
            { label: 'FRESH FACES', color: NM.rise, list: RANK_FRESH.slice(0, 3) },
          ].map(block => (
            <div key={block.label} style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: block.color, fontWeight: 700, letterSpacing: 1.2 }}>{block.label}</span>
                <span style={{ flex: 1, height: 1, background: NM.borderSoft }}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: block.color, fontWeight: 700 }}>ALL →</span>
              </div>
              <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: '4px 14px' }}>
                {block.list.map((p, i) => (
                  <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
                    borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                    <span style={{ width: 12, fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700 }}>{i + 1}</span>
                    <PlayerPhoto name={p.n} team={p.t} size={30} ratio={1}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: NM.textBright }}>{p.n}</div>
                      <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, marginTop: 1 }}>{p.l2}</div>
                    </div>
                    <HeatPill h={p.h} size="sm"/>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Explore */}
        <div style={{ padding: '26px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>EXPLORE</div>
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
  LastNightSpotlight, NightStorylines, MatchesToWatch, PlayersToWatch,
  DesktopSeasonStartV3, MobileSeasonStartV3, WATCH_GAMES,
});
