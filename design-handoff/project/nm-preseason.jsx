// PRESEASON phase — the kickoff before the kickoff.
// Honest framing: predictions are low-confidence because lineups aren't real.
// The value shifts to roster battles, prospects, and last season's carried Heat.

// ─── Countdown bar ───
function PreseasonBar() {
  return (
    <div style={{ padding: '18px 48px', background: `linear-gradient(90deg, rgba(0,229,160,0.14) 0%, transparent 70%)`,
      borderBottom: `1px solid ${NM.rise}33`, display: 'flex', alignItems: 'center', gap: 28 }}>
      <div>
        <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.rise, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>PRESEASON · UNDER WAY</div>
        <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, color: NM.textBright, lineHeight: 1 }}>
          Real season in 12 days
        </div>
      </div>
      <div style={{ width: 1, height: 40, background: NM.borderSoft }}/>
      <div style={{ display: 'flex', gap: 20 }}>
        {[['7', 'GAMES TONIGHT'], ['64', 'PRESEASON GAMES'], ['Oct 7', 'OPENING NIGHT'], ['12', 'DAYS TO GO']].map(([v, l]) => (
          <div key={l}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 17, fontWeight: 800, color: NM.textBright, lineHeight: 1 }}>{v}</div>
            <div style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.textMuted, fontWeight: 700, letterSpacing: 0.8, marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }}/>
      <div style={{ fontSize: 13, color: NM.text }}>
        Heat is <b style={{ color: NM.textBright }}>paused</b> until opening night · preseason doesn't count
      </div>
    </div>
  );
}

// ─── The honest caveat + what preseason IS good for ───
function PreseasonPremise() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ background: NM.bgCard, border: `1px solid ${NM.gold}55`, borderRadius: 14, padding: 24 }}>
        <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.gold, fontWeight: 700, letterSpacing: 1.4, marginBottom: 10 }}>
          ⚠ WHY WE DON'T PREDICT PRESEASON
        </div>
        <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.5, lineHeight: 1.2, color: NM.textBright, marginBottom: 12, textWrap: 'pretty' }}>
          Half these lineups won't exist in two weeks.
        </div>
        <div style={{ fontSize: 13, color: NM.text, lineHeight: 1.6 }}>
          Stars play 20 minutes a night, not 60. Rosters are 40 players deep. A preseason win says almost nothing about October — so we show the games and skip the confident pick. Our accuracy record only counts games that matter.
        </div>
      </div>
      <div style={{ background: NM.bgCard, border: `1px solid ${NM.rise}44`, borderRadius: 14, padding: 24 }}>
        <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 700, letterSpacing: 1.4, marginBottom: 10 }}>
          ✓ WHAT PRESEASON IS ACTUALLY FOR
        </div>
        <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.5, lineHeight: 1.2, color: NM.textBright, marginBottom: 12, textWrap: 'pretty' }}>
          Finding out who made the team.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {[
            'Roster battles — who wins the last forward spot',
            'Prospects getting real NHL minutes',
            'New line combinations being tested',
            'Returning-from-injury players ramping up',
          ].map(t => (
            <div key={t} style={{ display: 'flex', gap: 9, fontSize: 13, color: NM.textBright, lineHeight: 1.4 }}>
              <span style={{ color: NM.rise, fontWeight: 700 }}>·</span>{t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Roster battles — the headline preseason story type ───
const ROSTER_BATTLES = [
  { team: 'MTL', spot: 'Final top-6 forward spot', heatNote: 'Winner likely opens on the second line',
    players: [
      { n: 'Ivan Demidov',    pos: 'RW', age: 20, h: 62, l: 'AHL · 74 pts', status: 'LEADING' },
      { n: 'Oliver Kapanen',  pos: 'C',  age: 22, h: 54, l: '3 preseason pts', status: 'IN THE MIX' },
      { n: 'Joshua Roy',      pos: 'LW', age: 22, h: 49, l: '2 preseason G', status: 'LONGSHOT' },
    ] },
  { team: 'CHI', spot: 'Second-pair defence', heatNote: 'Bedard needs someone who can move the puck',
    players: [
      { n: 'Kevin Korchinski', pos: 'D', age: 22, h: 58, l: 'Best zone exits', status: 'LEADING' },
      { n: 'Sam Rinzel',       pos: 'D', age: 21, h: 52, l: 'NCAA standout', status: 'IN THE MIX' },
      { n: 'Artyom Levshunov', pos: 'D', age: 20, h: 47, l: '#2 overall pick', status: 'DEVELOPING' },
    ] },
  { team: 'SJS', spot: 'Starting goalie', heatNote: 'Nobody has claimed the net yet',
    players: [
      { n: 'Yaroslav Askarov', pos: 'G', age: 23, h: 61, l: '.918 in AHL', status: 'LEADING' },
      { n: 'Alex Nedeljkovic', pos: 'G', age: 29, h: 55, l: 'Veteran insurance', status: 'IN THE MIX' },
      { n: 'Georgi Romanov',   pos: 'G', age: 24, h: 44, l: '1 preseason start', status: 'LONGSHOT' },
    ] },
];

function RosterBattles() {
  const statusColor = s => s === 'LEADING' ? NM.rise : s === 'IN THE MIX' ? NM.gold : NM.textMuted;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.rise, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>ROSTER BATTLES · LIVE</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 36, letterSpacing: -1.2, lineHeight: 1, color: NM.textBright, marginBottom: 10 }}>
            Who's playing for a job.
          </div>
          <div style={{ fontSize: 14, color: NM.text, lineHeight: 1.5, maxWidth: 660 }}>
            The only preseason storyline that changes October. Three spots still open across the league — with the prospects fighting for them and what their minutes say so far.
          </div>
        </div>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.rise, fontWeight: 700 }}>ALL 14 BATTLES →</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {ROSTER_BATTLES.map(b => (
          <div key={b.team} style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', background: `linear-gradient(150deg, ${TEAMS[b.team].c}33 0%, transparent 75%)`,
              borderBottom: `1px solid ${NM.borderSoft}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <TeamBadge code={b.team} size={28}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1 }}>
                  {TEAMS[b.team]?.name.toUpperCase()}
                </span>
              </div>
              <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 18, letterSpacing: -0.4, color: NM.textBright, marginBottom: 5 }}>
                {b.spot}
              </div>
              <div style={{ fontSize: 11.5, color: NM.text, lineHeight: 1.45 }}>{b.heatNote}</div>
            </div>
            <div style={{ padding: '6px 18px 14px' }}>
              {b.players.map((p, i) => (
                <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0',
                  borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                  <PlayerPhoto name={p.n} team={b.team} size={38} ratio={1}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: NM.textBright, lineHeight: 1.2 }}>{p.n}</div>
                    <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, marginTop: 2 }}>
                      {p.pos} · {p.age} · {p.l}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: NM.fontMono, fontSize: 8, fontWeight: 700, letterSpacing: 0.6,
                      color: statusColor(p.status), padding: '2px 6px', borderRadius: 3,
                      background: `${statusColor(p.status)}1a`, border: `1px solid ${statusColor(p.status)}44` }}>
                      {p.status}
                    </span>
                    <div style={{ marginTop: 5 }}><HeatPill h={p.h} size="sm"/></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Preseason schedule — no confident picks, lineup context instead ───
const PRESEASON_GAMES = [
  { a: 'TOR', h: 'OTT', t: '7:00 PM', split: 52, note: 'Both rolling near-full lineups', watch: 'Easton Cowan · TOR prospect' },
  { a: 'BOS', h: 'MTL', t: '7:00 PM', split: 49, note: 'Montreal sits 4 regulars',      watch: 'Ivan Demidov · roster battle' },
  { a: 'EDM', h: 'CGY', t: '9:00 PM', split: 55, note: 'McDavid expected ~2 periods',   watch: 'Matt Savoie · EDM prospect' },
  { a: 'CHI', h: 'STL', t: '8:00 PM', split: 47, note: 'Chicago dressing 7 rookies',    watch: 'Levshunov · #2 pick' },
  { a: 'SJS', h: 'VGK', t: '10:00 PM', split: 44, note: 'Askarov gets the full 60',     watch: 'Askarov · goalie battle' },
  { a: 'NYR', h: 'NJD', t: '7:30 PM', split: 51, note: 'Split-squad, both short',       watch: 'Brackett · NJD camp invite' },
  { a: 'DAL', h: 'COL', t: '8:30 PM', split: 53, note: 'First look at new DAL 2nd line', watch: 'Bourque · DAL prospect' },
];

function PreseasonSchedule() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>TONIGHT · PRESEASON · 7 GAMES</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 36, letterSpacing: -1.2, lineHeight: 1, color: NM.textBright, marginBottom: 10 }}>
            What's on, and who to look for.
          </div>
          <div style={{ fontSize: 14, color: NM.text, lineHeight: 1.5, maxWidth: 680 }}>
            No confident picks here — instead, the lineup context that actually matters and the one player in each game worth watching.
          </div>
        </div>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700 }}>FULL PRESEASON →</span>
      </div>

      <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '84px 200px 150px 1fr 220px',
          gap: 16, padding: '12px 24px', fontFamily: NM.fontMono, fontSize: 9,
          color: NM.textMuted, fontWeight: 700, letterSpacing: 1, borderBottom: `1px solid ${NM.borderSoft}` }}>
          <span>TIME</span><span>MATCHUP</span><span>LEAN</span><span>LINEUP NOTE</span><span>WORTH WATCHING</span>
        </div>
        {PRESEASON_GAMES.map((g, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '84px 200px 150px 1fr 220px',
            gap: 16, padding: '15px 24px', alignItems: 'center',
            borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
            <span style={{ fontFamily: NM.fontMono, fontSize: 12, color: NM.textBright, fontWeight: 600 }}>{g.t}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <TeamBadge code={g.a} size={26}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>at</span>
              <TeamBadge code={g.h} size={26}/>
            </div>
            <div>
              <div style={{ height: 4, borderRadius: 2, overflow: 'hidden', display: 'flex', marginBottom: 5 }}>
                <div style={{ flex: g.split, background: NM.textMuted }}/>
                <div style={{ flex: 100 - g.split, background: NM.borderSoft }}/>
              </div>
              <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.5 }}>
                {g.split}/{100 - g.split} · LOW CONF
              </span>
            </div>
            <span style={{ fontSize: 12.5, color: NM.text }}>{g.note}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.rise, fontWeight: 700 }}>★</span>
              <span style={{ fontSize: 12, color: NM.textBright, fontWeight: 600 }}>{g.watch}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════ DESKTOP · PRESEASON ═══════════════════════
function DesktopPreseason() {
  return (
    <DCArtboard label="Desktop · Homepage · PRESEASON · 1440" width={1440}
      style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <BrandedHeaderDesktop active="Tonight" status={{ live: false, label: 'PRESEASON · 7' }}/>
      <SeasonValueStrip/>
      <PreseasonBar/>
      <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 52 }}>
        <PreseasonPremise/>
        <PreseasonSchedule/>
        <RosterBattles/>
        <PlayersToWatch/>
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

// ═══════════════════════ MOBILE · PRESEASON ═══════════════════════
function MobilePreseason() {
  const statusColor = s => s === 'LEADING' ? NM.rise : s === 'IN THE MIX' ? NM.gold : NM.textMuted;
  return (
    <PhoneFrame label="Mobile · Homepage · PRESEASON" width={390} height={2840} statusBar={true}>
      <div style={{ background: NM.bg, color: NM.textBright, minHeight: '100%' }}>
        <BrandedHeaderMobile status={{ live: false, label: 'PRE · 7' }}/>

        {/* Value + countdown */}
        <div style={{ padding: '12px 16px', background: `linear-gradient(90deg, rgba(0,229,160,0.14) 0%, transparent 100%)`,
          borderBottom: `1px solid ${NM.rise}33` }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.rise, fontWeight: 700, letterSpacing: 1.2, marginBottom: 4 }}>PRESEASON · REAL SEASON IN 12 DAYS</div>
          <div style={{ fontSize: 11, color: NM.text, lineHeight: 1.45 }}>
            Every player carries a <span style={{ color: NM.heat, fontWeight: 700 }}>Heat score 0–100</span> from last season. It stays paused until opening night.
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
            {[['7','TONIGHT'],['64','PRESEASON'],['Oct 7','OPENS']].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 14, fontWeight: 800, color: NM.textBright, lineHeight: 1 }}>{v}</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 7, color: NM.textMuted, fontWeight: 700, letterSpacing: 0.8, marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Premise */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.gold}55`, borderRadius: 11, padding: 16, marginBottom: 8 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.gold, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>⚠ WHY WE DON'T PREDICT PRESEASON</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 17, letterSpacing: -0.4, lineHeight: 1.2, marginBottom: 8, textWrap: 'pretty' }}>
              Half these lineups won't exist in two weeks.
            </div>
            <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.55 }}>
              Stars play 20 minutes, not 60. We show the games and skip the confident pick — our accuracy record only counts games that matter.
            </div>
          </div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.rise}44`, borderRadius: 11, padding: 16 }}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.rise, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>✓ WHAT IT IS FOR</div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 17, letterSpacing: -0.4, lineHeight: 1.2, marginBottom: 10 }}>
              Finding out who made the team.
            </div>
            {['Roster battles', 'Prospects on real NHL minutes', 'New line combinations', 'Injury returns ramping up'].map(t => (
              <div key={t} style={{ display: 'flex', gap: 8, fontSize: 12, color: NM.textBright, padding: '3px 0' }}>
                <span style={{ color: NM.rise, fontWeight: 700 }}>·</span>{t}
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div style={{ padding: '26px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>TONIGHT · PRESEASON · 7 GAMES</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 24, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 8 }}>
            What's on, and<br/>who to look for.
          </div>
          <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.45, marginBottom: 14 }}>
            No confident picks — lineup context and one player per game worth watching.
          </div>
          {PRESEASON_GAMES.slice(0, 5).map((g, i) => (
            <div key={i} style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10,
              padding: 13, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                <TeamBadge code={g.a} size={24}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted }}>at</span>
                <TeamBadge code={g.h} size={24}/>
                <span style={{ flex: 1 }}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textBright, fontWeight: 600 }}>{g.t}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                <div style={{ flex: 1, height: 3, borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ flex: g.split, background: NM.textMuted }}/>
                  <div style={{ flex: 100 - g.split, background: NM.borderSoft }}/>
                </div>
                <span style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.textMuted, fontWeight: 700 }}>LOW CONF</span>
              </div>
              <div style={{ fontSize: 11.5, color: NM.text, lineHeight: 1.4, marginBottom: 8 }}>{g.note}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingTop: 9, borderTop: `1px solid ${NM.borderSoft}` }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.rise, fontWeight: 700 }}>★</span>
                <span style={{ fontSize: 11.5, color: NM.textBright, fontWeight: 600 }}>{g.watch}</span>
              </div>
            </div>
          ))}
          <div style={{ padding: '10px 0', textAlign: 'center', fontFamily: NM.fontMono, fontSize: 10,
            color: NM.heat, fontWeight: 700, letterSpacing: 0.5 }}>+2 MORE TONIGHT →</div>
        </div>

        {/* Roster battles */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.rise, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>ROSTER BATTLES · LIVE</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 24, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 8 }}>
            Who's playing for a job.
          </div>
          <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.45, marginBottom: 14 }}>
            The only preseason storyline that changes October.
          </div>
          {ROSTER_BATTLES.map(b => (
            <div key={b.team} style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 11,
              overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ padding: '14px 15px', background: `linear-gradient(150deg, ${TEAMS[b.team].c}33 0%, transparent 75%)`,
                borderBottom: `1px solid ${NM.borderSoft}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                  <TeamBadge code={b.team} size={22}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 1 }}>
                    {TEAMS[b.team]?.name.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 15, letterSpacing: -0.3, color: NM.textBright, marginBottom: 4 }}>
                  {b.spot}
                </div>
                <div style={{ fontSize: 11, color: NM.text, lineHeight: 1.4 }}>{b.heatNote}</div>
              </div>
              <div style={{ padding: '4px 15px 12px' }}>
                {b.players.map((p, i) => (
                  <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                    borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                    <PlayerPhoto name={p.n} team={b.team} size={32} ratio={1}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: NM.textBright }}>{p.n}</div>
                      <div style={{ fontFamily: NM.fontMono, fontSize: 8.5, color: NM.textMuted, marginTop: 1 }}>{p.pos} · {p.age} · {p.l}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: NM.fontMono, fontSize: 7.5, fontWeight: 700, letterSpacing: 0.5,
                        color: statusColor(p.status), padding: '2px 5px', borderRadius: 3,
                        background: `${statusColor(p.status)}1a` }}>{p.status}</span>
                      <div style={{ marginTop: 4 }}><HeatPill h={p.h} size="sm"/></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Players to watch — carried Heat */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>PLAYERS TO WATCH</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 24, letterSpacing: -0.8, lineHeight: 1.05, marginBottom: 8 }}>
            Nobody starts from zero.
          </div>
          <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.45, marginBottom: 14 }}>
            Seeded from final 2025–26 Heat, waiting for opening night.
          </div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: '4px 14px' }}>
            {RANK_SKATERS.map((p, i) => (
              <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <span style={{ width: 12, fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700 }}>{i + 1}</span>
                <PlayerPhoto name={p.n} team={p.t} size={32} ratio={1}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: NM.textBright }}>{p.n}</div>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, marginTop: 1 }}>{p.l2}</div>
                </div>
                <HeatPill h={p.h} size="sm"/>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '24px 16px 24px', marginTop: 10, borderTop: `1px solid ${NM.borderSoft}` }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, letterSpacing: 1, fontWeight: 600 }}>
            DATA · NHL Stats API · MoneyPuck · Natural Stat Trick
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

Object.assign(window, {
  PreseasonBar, PreseasonPremise, RosterBattles, PreseasonSchedule,
  DesktopPreseason, MobilePreseason, ROSTER_BATTLES, PRESEASON_GAMES,
});
