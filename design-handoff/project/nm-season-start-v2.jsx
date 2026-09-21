// Season-phase model + rebuilt SEASON START homepage (v2)
// Leads with: when it starts → schedule → odds from last season → three rankings (photo-forward) → last night

// ─── Player photo placeholder (portrait, team-tinted) ───
function PlayerPhoto({ name, team, size = 96, ratio = 1, rank, heat }) {
  const t = TEAMS[team] || { c: '#333', t: '#fff' };
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('');
  return (
    <div style={{ width: size, aspectRatio: String(ratio), borderRadius: 10, overflow: 'hidden',
      position: 'relative', flexShrink: 0,
      background: `linear-gradient(160deg, ${t.c} 0%, ${NM.bg} 100%)` }}>
      {/* stripe texture */}
      <div style={{ position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(125deg, transparent 0 14px, rgba(255,255,255,0.04) 14px 15px)' }}/>
      {/* initials watermark */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: size * 0.42, color: 'rgba(255,255,255,0.16)', letterSpacing: -2 }}>
        {initials}
      </div>
      {/* bottom scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgba(10,11,15,0.82) 100%)' }}/>
      {/* photo slot label */}
      <div style={{ position: 'absolute', top: 6, left: 6, fontFamily: NM.fontMono, fontSize: 7,
        color: 'rgba(255,255,255,0.5)', letterSpacing: 0.8, fontWeight: 700 }}>PHOTO</div>
      {rank !== undefined && (
        <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 4,
          background: 'rgba(10,11,15,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: NM.fontMono, fontSize: 9, fontWeight: 800, color: NM.textBright }}>{rank}</div>
      )}
      {heat !== undefined && (
        <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: NM.fontMono, fontSize: 8, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 0.6 }}>HEAT</span>
          <span style={{ fontFamily: NM.fontMono, fontSize: 14, fontWeight: 800, color: heatColor(heat), lineHeight: 1 }}>{heat}</span>
        </div>
      )}
    </div>
  );
}

// ─── STRATEGY: three phases of the season ───
function SeasonPhaseModel() {
  const phases = [
    { k: 'PHASE 0', t: 'Preseason', when: 'Late Sep · 2 wks', c: NM.gold,
      lead: 'Roster battles — not predictions',
      show: ['Countdown to opening night', 'Preseason schedule + lineup notes', 'Roster battles & prospects', 'Players to watch (carried Heat)', 'Why we don\'t predict preseason'],
      hide: ['Confident picks', 'Accuracy record', 'Live Heat (paused)'] },
    { k: 'PHASE 1', t: 'Season start', when: 'Oct · weeks 1–3', c: NM.rise,
      lead: 'Last night + reintroducing the league',
      show: ['Last night spotlight', 'Overnight storylines', 'Matches to watch + 3 players/team', 'Players to watch (seeded Heat)', 'First-week schedule'],
      hide: ['Cup odds (playoff concern)', 'Form trends', 'Streak stories'] },
    { k: 'PHASE 2', t: 'Regular season', when: 'Nov – Mar', c: NM.heat,
      lead: 'Last night + tonight, on a daily loop',
      show: ['Last night results + pick graded', 'Last night stories & highlights', 'Tonight\'s slate + picks', 'Three rankings — live Heat', 'Heat map / breakouts'],
      hide: ['Preseason odds', 'Season previews', 'Roster battles'] },
    { k: 'PHASE 3', t: 'Playoffs', when: 'Apr – Jun', c: NM.story,
      lead: 'The series is the whole story',
      show: ['Series spotlight + bracket state', 'Series odds, not just game odds', 'Game-by-game strip', 'Playoff-only Heat leaders', 'Elimination stakes'],
      hide: ['Regular-season rankings', 'Non-playoff teams'] },
  ];
  return (
    <DCArtboard label="Strategy · Four phases of the season" width={1540}
      style={{ background: NM.bg, padding: 36, borderRadius: 6 }}>
      <div style={{ color: NM.textBright }}>
        <div style={{ fontFamily: NM.fontMono, fontSize: 10, letterSpacing: 1.4, color: NM.heat, fontWeight: 700, marginBottom: 8 }}>
          CONTENT MODEL
        </div>
        <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -1, lineHeight: 1.05, marginBottom: 8, maxWidth: 820, textWrap: 'pretty' }}>
          One homepage. Four modes. The calendar decides which.
        </div>
        <div style={{ fontSize: 13, color: NM.text, maxWidth: 820, lineHeight: 1.55, marginBottom: 28 }}>
          The modules stay the same all year — only their order and prominence change. That keeps the product recognisable while always leading with whatever is actually interesting that week.
        </div>

        {/* Timeline bar */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 26, borderRadius: 6, overflow: 'hidden' }}>
          {phases.map(p => (
            <div key={p.k} style={{ flex: p.k === 'PHASE 2' ? 2.4 : 1, padding: '10px 14px', background: `${p.c}22`,
              borderTop: `2px solid ${p.c}` }}>              <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: p.c, fontWeight: 700, letterSpacing: 1.2 }}>{p.when}</div>
              <div style={{ fontFamily: NM.fontSans, fontSize: 14, fontWeight: 700, color: NM.textBright, marginTop: 2 }}>{p.t}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {phases.map(p => (
            <div key={p.k} style={{ background: NM.bgCard, border: `1px solid ${p.c}44`, borderRadius: 12, padding: 22 }}>
              <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: p.c, fontWeight: 700, letterSpacing: 1.4, marginBottom: 8 }}>{p.k} · {p.when}</div>
              <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.5, color: NM.textBright, marginBottom: 6 }}>{p.t}</div>
              <div style={{ fontSize: 12, color: p.c, fontWeight: 600, marginBottom: 18, lineHeight: 1.4 }}>{p.lead}</div>

              <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.rise, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>↑ LEAD WITH</div>
              {p.show.map(s => (
                <div key={s} style={{ display: 'flex', gap: 8, padding: '5px 0', fontSize: 12, color: NM.textBright }}>
                  <span style={{ color: p.c }}>·</span>{s}
                </div>
              ))}

              <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginTop: 16, marginBottom: 8 }}>↓ DEMOTE / HIDE</div>
              {p.hide.map(s => (
                <div key={s} style={{ display: 'flex', gap: 8, padding: '5px 0', fontSize: 12, color: NM.textMuted }}>
                  <span>·</span>{s}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, padding: 16, background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10,
          fontSize: 12, color: NM.text, lineHeight: 1.6, maxWidth: 1000 }}>
          <b style={{ color: NM.heat }}>The constant:</b> the three rankings — <b style={{ color: NM.textBright }}>skaters, goalies, fresh faces</b> — appear in every phase. Only the data source changes: carried-over Heat in preseason and week one, live Heat through the regular season, playoff-only Heat in the spring. That makes them the spine of the product and the thing a returning visitor checks first.
        </div>
      </div>
    </DCArtboard>
  );
}

// ─── THREE RANKINGS · photo-forward showcase ───
const RANK_SKATERS = [
  { n: 'Connor McDavid',   t: 'EDM', h: 94, l1: 'C · Oilers',    l2: '132 pts · 1.72/gm', note: "Led the league in Heat for 19 straight weeks" },
  { n: 'Nathan MacKinnon', t: 'COL', h: 91, l1: 'C · Avalanche', l2: '128 pts · Art Ross' },
  { n: 'Auston Matthews',  t: 'TOR', h: 88, l1: 'C · Maple Leafs', l2: '58 goals · Rocket' },
  { n: 'David Pastrnak',   t: 'BOS', h: 86, l1: 'RW · Bruins',   l2: '110 pts · 4th 100+' },
  { n: 'Kirill Kaprizov',  t: 'MIN', h: 84, l1: 'LW · Wild',     l2: '96 pts · career high' },
];
const RANK_GOALIES = [
  { n: 'Sergei Bobrovsky', t: 'FLA', h: 92, l1: 'G · Panthers',  l2: '.925 SV% · 2.18 GAA', note: 'Best playoff run of his career, and it carried' },
  { n: 'Igor Shesterkin',  t: 'NYR', h: 89, l1: 'G · Rangers',   l2: '.922 SV% · 6 SO' },
  { n: 'Connor Hellebuyck',t: 'WPG', h: 86, l1: 'G · Jets',      l2: 'Vezina winner' },
  { n: 'Jeremy Swayman',   t: 'BOS', h: 83, l1: 'G · Bruins',    l2: '.919 SV% · 38 W' },
  { n: 'Juuse Saros',      t: 'NSH', h: 80, l1: 'G · Predators', l2: '.916 SV% · 64 GP' },
];
const RANK_FRESH = [
  { n: 'Macklin Celebrini', t: 'SJS', h: 78, l1: 'C · Sharks · 20',  l2: '71 pts as a rookie', note: 'Calder winner — and the model says year two is bigger' },
  { n: 'Connor Bedard',     t: 'CHI', h: 74, l1: 'C · Blackhawks · 21', l2: '68 pts · year 3' },
  { n: 'Matvei Michkov',    t: 'PHI', h: 71, l1: 'RW · Flyers · 21', l2: '63 pts · +14 Heat' },
  { n: 'Logan Cooley',      t: 'UTA', h: 68, l1: 'C · Utah · 22',    l2: 'Top-line minutes' },
  { n: 'Leo Carlsson',      t: 'ANA', h: 65, l1: 'C · Ducks · 21',   l2: '54 pts · rising' },
];

function RankingShowcase({ kicker, title, sub, color, list, cardW = 400 }) {
  const [hero, ...rest] = list;
  return (
    <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 14, overflow: 'hidden' }}>
      {/* Hero */}
      <div style={{ padding: 20, background: `linear-gradient(160deg, ${TEAMS[hero.t].c}33 0%, transparent 70%)`,
        borderBottom: `1px solid ${NM.borderSoft}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontFamily: NM.fontMono, fontSize: 10, color, fontWeight: 700, letterSpacing: 1.4 }}>{kicker}</span>
          <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 600, letterSpacing: 0.8 }}>FINAL '25–26</span>
        </div>
        <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 20, letterSpacing: -0.5, color: NM.textBright, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11, color: NM.textMuted, marginBottom: 16 }}>{sub}</div>

        <div style={{ display: 'flex', gap: 14 }}>
          <PlayerPhoto name={hero.n} team={hero.t} size={104} ratio={0.82} rank={1}/>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <TeamBadge code={hero.t} size={20}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 600 }}>{hero.l1}</span>
            </div>
            <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 19, letterSpacing: -0.4, color: NM.textBright, lineHeight: 1.1, marginBottom: 6 }}>
              {hero.n}
            </div>
            <div style={{ fontFamily: NM.fontMono, fontSize: 11, color, fontWeight: 700, marginBottom: 8 }}>{hero.l2}</div>
            {hero.note && (
              <div style={{ fontSize: 11, color: NM.text, lineHeight: 1.45, textWrap: 'pretty' }}>{hero.note}</div>
            )}
            <div style={{ flex: 1 }}/>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <HeatPill h={hero.h}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 0.8 }}>LAST SEASON FINAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rest — photo thumbs */}
      <div style={{ padding: '6px 16px 10px' }}>
        {rest.map((p, i) => (
          <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
            borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
            <span style={{ width: 12, fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700 }}>{i + 2}</span>
            <PlayerPhoto name={p.n} team={p.t} size={38} ratio={1}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NM.textBright, lineHeight: 1.2 }}>{p.n}</div>
              <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, marginTop: 2 }}>{p.l2}</div>
            </div>
            <HeatPill h={p.h} size="sm"/>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 18px', borderTop: `1px solid ${NM.borderSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>Updated after every game</span>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color, fontWeight: 700, letterSpacing: 0.5 }}>FULL LIST →</span>
      </div>
    </div>
  );
}

function ThreeRankingsShowcase() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>THE RANKINGS · BUILT FROM LAST SEASON</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 36, letterSpacing: -1.2, lineHeight: 1, color: NM.textBright, marginBottom: 10 }}>
            Who to follow this year.
          </div>
          <div style={{ fontSize: 14, color: NM.text, lineHeight: 1.5, maxWidth: 660 }}>
            Everyone forgets where last season ended. These are the three lists that matter — carried over from final 2025–26 Heat, and they start moving again tonight.
          </div>
        </div>
        <div style={{ padding: '10px 14px', background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10, textAlign: 'right' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 1 }}>SOURCE</div>
          <div style={{ fontSize: 12, color: NM.textBright, fontWeight: 600, marginTop: 3 }}>1,312 games · 2025–26</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <RankingShowcase kicker="SKATERS" title="Hottest skaters" sub="Final Heat, 2025–26 season" color={NM.heat} list={RANK_SKATERS}/>
        <RankingShowcase kicker="GOALIES"  title="Best in net"     sub="Final Heat, 2025–26 season" color={NM.cold} list={RANK_GOALIES}/>
        <RankingShowcase kicker="FRESH FACES" title="Young & rising" sub="Under 23 · final Heat" color={NM.rise} list={RANK_FRESH}/>
      </div>
    </div>
  );
}

// ─── SEASON COUNTDOWN / WHEN IT STARTS ───
function SeasonOpenerBar() {
  return (
    <div style={{ padding: '18px 48px', background: `linear-gradient(90deg, ${NM.heatDim} 0%, transparent 70%)`,
      borderBottom: `1px solid ${NM.heat}33`, display: 'flex', alignItems: 'center', gap: 28 }}>
      <div>
        <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>SEASON OPENS</div>
        <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, color: NM.textBright, lineHeight: 1 }}>
          Tonight · Oct 7
        </div>
      </div>
      <div style={{ width: 1, height: 40, background: NM.borderSoft }}/>
      <div style={{ display: 'flex', gap: 20 }}>
        {[['3', 'GAMES TONIGHT'], ['32', 'TEAMS'], ['1,312', 'GAMES TO COME'], ['Jun 2027', 'CUP FINAL']].map(([v, l]) => (
          <div key={l}>
            <div style={{ fontFamily: NM.fontMono, fontSize: 17, fontWeight: 800, color: NM.textBright, lineHeight: 1 }}>{v}</div>
            <div style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.textMuted, fontWeight: 700, letterSpacing: 0.8, marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }}/>
      <div style={{ fontSize: 13, color: NM.text }}>
        Heat scores go live after <b style={{ color: NM.textBright }}>game 3</b> · picks start tonight
      </div>
    </div>
  );
}

// ─── ODDS FROM LAST SEASON, WITH THE PLAYERS IN THEM ───
function OddsFromLastSeason() {
  const games = [
    { a: 'FLA', h: 'BOS', t: '7:00 PM', p: 'FLA', c: 56, watch: 91,
      why: 'Florida returns the deepest roster in the East. Boston lost two top-four D.',
      keys: [{ n: 'Sergei Bobrovsky', t: 'FLA', h: 92 }, { n: 'David Pastrnak', t: 'BOS', h: 86 }] },
    { a: 'EDM', h: 'VAN', t: '10:00 PM', p: 'EDM', c: 61, watch: 88,
      why: "McDavid finished last season at 94 Heat — the highest mark we've recorded.",
      keys: [{ n: 'Connor McDavid', t: 'EDM', h: 94 }, { n: 'Quinn Hughes', t: 'VAN', h: 79 }] },
    { a: 'TOR', h: 'MTL', t: '7:30 PM', p: 'TOR', c: 58, watch: 86,
      why: 'Toronto has the goal-scoring edge; Montreal has the younger, rising core.',
      keys: [{ n: 'Auston Matthews', t: 'TOR', h: 88 }, { n: 'Juraj Slafkovsky', t: 'MTL', h: 66 }] },
  ];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>TONIGHT · OPENING NIGHT</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 36, letterSpacing: -1.2, lineHeight: 1, color: NM.textBright, marginBottom: 10 }}>
            Three games. Three picks.
          </div>
          <div style={{ fontSize: 14, color: NM.text, lineHeight: 1.5, maxWidth: 660 }}>
            Tonight's odds come entirely from last season's data — roster Heat carried forward, adjusted for summer moves. Each pick names the players driving it.
          </div>
        </div>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700 }}>FULL SCHEDULE →</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {games.map((g, i) => (
          <div key={i} style={{ background: NM.bgCard, border: `1px solid ${i === 0 ? NM.heat + '66' : NM.border}`,
            borderRadius: 14, overflow: 'hidden', boxShadow: i === 0 ? `0 0 24px ${NM.heat}1a` : 'none' }}>
            {/* Team split band */}
            <div style={{ display: 'flex', height: 74, position: 'relative' }}>
              <div style={{ flex: g.c, background: `linear-gradient(135deg, ${TEAMS[g.p === g.a ? g.a : g.h].c} 0%, ${TEAMS[g.p === g.a ? g.a : g.h].c}aa 100%)`,
                display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 22, letterSpacing: -0.5,
                  color: TEAMS[g.p === g.a ? g.a : g.h].t }}>{g.p}</span>
              </div>
              <div style={{ flex: 100 - g.c, background: NM.bgRaised, display: 'flex', alignItems: 'center',
                justifyContent: 'flex-end', padding: '0 16px' }}>
                <span style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 18, letterSpacing: -0.3, color: NM.textMuted }}>
                  {g.p === g.a ? g.h : g.a}
                </span>
              </div>
              <div style={{ position: 'absolute', bottom: 8, left: 16, fontFamily: NM.fontMono, fontSize: 10,
                color: 'rgba(255,255,255,0.85)', fontWeight: 700, letterSpacing: 0.8 }}>{g.c}% WIN</div>
              <div style={{ position: 'absolute', bottom: 8, right: 16, fontFamily: NM.fontMono, fontSize: 10,
                color: NM.textMuted, fontWeight: 700 }}>{100 - g.c}%</div>
            </div>

            <div style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <TeamBadge code={g.a} size={26} ringed={g.p === g.a}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>at</span>
                <TeamBadge code={g.h} size={26} ringed={g.p === g.h}/>
                <span style={{ flex: 1 }}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 600 }}>{g.t}</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.gold, fontWeight: 700, padding: '2px 6px',
                  background: `${NM.gold}22`, borderRadius: 3, border: `1px solid ${NM.gold}55` }}>WATCH {g.watch}</span>
              </div>

              <div style={{ fontSize: 13, color: NM.textBright, lineHeight: 1.5, marginBottom: 14, textWrap: 'pretty' }}>{g.why}</div>

              <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 8 }}>
                PLAYERS DRIVING THE PICK
              </div>
              {g.keys.map(k => (
                <div key={k.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
                  <PlayerPhoto name={k.n} team={k.t} size={32} ratio={1}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: NM.textBright }}>{k.n}</div>
                    <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, marginTop: 1 }}>{TEAMS[k.t].name}</div>
                  </div>
                  <HeatPill h={k.h} size="sm"/>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LAST NIGHT (early-season: shown from game 2 onward) ───
function EarlySeasonLastNight() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>PREVIEW · FROM NIGHT TWO</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 32, letterSpacing: -1, lineHeight: 1, color: NM.textBright, marginBottom: 10 }}>
            Last night, every morning.
          </div>
          <div style={{ fontSize: 14, color: NM.text, lineHeight: 1.5, maxWidth: 620 }}>
            From tomorrow this block sits directly under the opener bar — results with our pick graded, highlights, and the stories the data found overnight.
          </div>
        </div>
        <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700, letterSpacing: 1,
          padding: '5px 10px', background: NM.bgCard, border: `1px dashed ${NM.border}`, borderRadius: 4 }}>
          EMPTY UNTIL OCT 8
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 16, opacity: 0.94 }}>
        {/* Results w/ grading */}
        <div style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.rise, fontWeight: 700, letterSpacing: 1.2, marginBottom: 14 }}>RESULTS · PICK GRADED</div>
          {[
            { a: 'FLA', h: 'BOS', as: 4, hs: 2, hit: true,  star: 'Bobrovsky', sh: 93 },
            { a: 'TOR', h: 'MTL', as: 3, hs: 5, hit: false, star: 'Slafkovsky', sh: 72 },
            { a: 'EDM', h: 'VAN', as: 6, hs: 3, hit: true,  star: 'McDavid', sh: 95 },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 0',
              borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
              <span style={{ fontFamily: NM.fontMono, fontSize: 9, fontWeight: 800, width: 18, textAlign: 'center',
                color: r.hit ? NM.rise : NM.cold, padding: '2px 0', borderRadius: 3,
                background: r.hit ? NM.riseDim : 'rgba(58,136,255,0.12)' }}>{r.hit ? '✓' : '✗'}</span>
              <TeamBadge code={r.a} size={20}/>
              <span style={{ fontFamily: NM.fontMono, fontSize: 13, fontWeight: 700, color: r.as > r.hs ? NM.textBright : NM.textMuted, width: 14, textAlign: 'right' }}>{r.as}</span>
              <span style={{ fontSize: 9, color: NM.textMuted }}>–</span>
              <span style={{ fontFamily: NM.fontMono, fontSize: 13, fontWeight: 700, color: r.hs > r.as ? NM.textBright : NM.textMuted, width: 14 }}>{r.hs}</span>
              <TeamBadge code={r.h} size={20}/>
              <span style={{ flex: 1 }}/>
              <HeatPill h={r.sh} size="sm"/>
            </div>
          ))}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${NM.borderSoft}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted }}>Night 1 accuracy</span>
            <span style={{ fontFamily: NM.fontMono, fontSize: 15, color: NM.rise, fontWeight: 800 }}>2/3 · 67%</span>
          </div>
        </div>

        {/* Highlights */}
        <div style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 14 }}>HIGHLIGHTS</div>
          {[
            { t: 'McDavid, 4 points on opening night', d: 'EDM 6 · VAN 3', team: 'EDM' },
            { t: 'Bobrovsky 34 saves in the banner game', d: 'FLA 4 · BOS 2', team: 'FLA' },
            { t: "Slafkovsky's OT winner", d: 'MTL 5 · TOR 3', team: 'MTL' },
          ].map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 0',
              borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
              <div style={{ width: 54, height: 40, borderRadius: 5, flexShrink: 0, position: 'relative',
                background: `linear-gradient(135deg, ${TEAMS[h.team].c}cc, ${NM.bg})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>▶</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: NM.textBright, fontWeight: 600, lineHeight: 1.3 }}>{h.t}</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, marginTop: 2 }}>{h.d}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stories */}
        <div style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.story, fontWeight: 700, letterSpacing: 1.2, marginBottom: 14 }}>STORIES · WRITTEN OVERNIGHT</div>
          {[
            { k: 'OPENING NIGHT', t: 'McDavid picked up where he left off — and the Heat scale barely moved.', d: 'Because he ended last season at 94.', team: 'EDM' },
            { k: 'UPSET', t: 'Montreal took the Original Six opener, and our pick missed.', d: "Slafkovsky's line drove it. Here's what the model underrated.", team: 'MTL' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0',
              borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
              <div style={{ width: 64, height: 64, borderRadius: 8, flexShrink: 0, position: 'relative',
                background: `linear-gradient(155deg, ${TEAMS[s.team].c}aa 0%, ${NM.bg} 100%)` }}>
                <div style={{ position: 'absolute', top: 5, left: 5 }}><TeamBadge code={s.team} size={16}/></div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.story, fontWeight: 700, letterSpacing: 1.2, marginBottom: 5 }}>{s.k}</div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 13, color: NM.textBright, lineHeight: 1.3, letterSpacing: -0.1, marginBottom: 4, textWrap: 'pretty' }}>{s.t}</div>
                <div style={{ fontSize: 11, color: NM.textMuted, lineHeight: 1.4 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════ DESKTOP ═══════════════════════
function DesktopSeasonStartV2() {
  return (
    <DCArtboard label="Desktop · Homepage · SEASON START v2 · 1440" width={1440}
      style={{ background: NM.bg, padding: 0, borderRadius: 6, overflow: 'hidden' }}>
      <BrandedHeaderDesktop active="Tonight" status={{ live: false, label: 'TONIGHT · 3' }}/>
      <SeasonValueStrip/>
      <SeasonOpenerBar/>
      <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 52 }}>
        <OddsFromLastSeason/>
        <ThreeRankingsShowcase/>
        <EarlySeasonLastNight/>
        <SeasonPredictions/>
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
function MobileSeasonStartV2() {
  return (
    <PhoneFrame label="Mobile · Homepage · SEASON START v2" width={390} height={3320} statusBar={true}>
      <div style={{ background: NM.bg, color: NM.textBright, minHeight: '100%' }}>
        <BrandedHeaderMobile status={{ live: false, label: 'TONIGHT 3' }}/>

        {/* Value + opener */}
        <div style={{ padding: '12px 16px', background: `linear-gradient(90deg, ${NM.heatDim} 0%, transparent 100%)`,
          borderBottom: `1px solid ${NM.heat}33` }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.heat, fontWeight: 700, letterSpacing: 1.2, marginBottom: 4 }}>SEASON OPENS TONIGHT · OCT 7</div>
          <div style={{ fontSize: 11, color: NM.text, lineHeight: 1.45 }}>
            Every player gets a <span style={{ color: NM.heat, fontWeight: 700 }}>Heat score 0–100</span>. We pick every game. <span style={{ color: NM.text }}>Last season: 67%.</span>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
            {[['3','TONIGHT'],['1,312','GAMES'],['67%','LAST YR']].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 14, fontWeight: 800, color: NM.textBright, lineHeight: 1 }}>{v}</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 7, color: NM.textMuted, fontWeight: 700, letterSpacing: 0.8, marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tonight's picks */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>TONIGHT · OPENING NIGHT</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 26, letterSpacing: -0.9, lineHeight: 1, marginBottom: 8 }}>
            Three games. Three picks.
          </div>
          <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.45, marginBottom: 14 }}>
            Odds built from last season's roster Heat. Each pick names the players behind it.
          </div>
          {[
            { a: 'FLA', h: 'BOS', t: '7:00 PM', p: 'FLA', c: 56, watch: 91,
              why: 'Deepest roster in the East vs a thinner Boston blue line.',
              keys: [{ n: 'Sergei Bobrovsky', t: 'FLA', h: 92 }, { n: 'David Pastrnak', t: 'BOS', h: 86 }] },
            { a: 'EDM', h: 'VAN', t: '10:00 PM', p: 'EDM', c: 61, watch: 88,
              why: "McDavid ended last season at 94 — our highest recorded Heat.",
              keys: [{ n: 'Connor McDavid', t: 'EDM', h: 94 }, { n: 'Quinn Hughes', t: 'VAN', h: 79 }] },
            { a: 'TOR', h: 'MTL', t: '7:30 PM', p: 'TOR', c: 58, watch: 86,
              why: 'Toronto scores more; Montreal is younger and rising.',
              keys: [{ n: 'Auston Matthews', t: 'TOR', h: 88 }, { n: 'Juraj Slafkovsky', t: 'MTL', h: 66 }] },
          ].map((g, i) => (
            <div key={i} style={{ background: NM.bgCard, border: `1px solid ${i === 0 ? NM.heat + '66' : NM.borderSoft}`,
              borderRadius: 12, overflow: 'hidden', marginBottom: 10,
              boxShadow: i === 0 ? `0 0 14px ${NM.heat}1a` : 'none' }}>
              <div style={{ display: 'flex', height: 46, position: 'relative' }}>
                <div style={{ flex: g.c, background: `linear-gradient(135deg, ${TEAMS[g.p].c} 0%, ${TEAMS[g.p].c}aa 100%)`,
                  display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                  <span style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 15, color: TEAMS[g.p].t }}>{g.p} {g.c}%</span>
                </div>
                <div style={{ flex: 100 - g.c, background: NM.bgRaised, display: 'flex', alignItems: 'center',
                  justifyContent: 'flex-end', padding: '0 12px' }}>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, fontWeight: 700 }}>{100 - g.c}%</span>
                </div>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <TeamBadge code={g.a} size={24} ringed={g.p === g.a}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted }}>at</span>
                  <TeamBadge code={g.h} size={24} ringed={g.p === g.h}/>
                  <span style={{ flex: 1 }}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 600 }}>{g.t}</span>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.gold, fontWeight: 700, padding: '2px 5px',
                    background: `${NM.gold}22`, borderRadius: 3 }}>W{g.watch}</span>
                </div>
                <div style={{ fontSize: 12, color: NM.textBright, lineHeight: 1.45, marginBottom: 10 }}>{g.why}</div>
                {g.keys.map(k => (
                  <div key={k.n} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0' }}>
                    <PlayerPhoto name={k.n} team={k.t} size={28} ratio={1}/>
                    <span style={{ flex: 1, fontSize: 11, color: NM.textBright, fontWeight: 600 }}>{k.n}</span>
                    <HeatPill h={k.h} size="sm"/>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* THREE RANKINGS — stacked, photo-forward */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>THE RANKINGS · LAST SEASON</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 26, letterSpacing: -0.9, lineHeight: 1, marginBottom: 8 }}>
            Who to follow this year.
          </div>
          <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.45, marginBottom: 14 }}>
            Carried over from final 2025–26 Heat. They start moving again tonight.
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[['Skaters', NM.heat, true], ['Goalies', NM.cold, false], ['Fresh faces', NM.rise, false]].map(([l, c, active]) => (
              <span key={l} style={{ padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                color: active ? c : NM.text, background: active ? `${c}1a` : NM.bgCard,
                border: `1px solid ${active ? c + '55' : NM.border}` }}>{l}</span>
            ))}
          </div>

          {/* Hero card */}
          <div style={{ background: `linear-gradient(160deg, ${TEAMS.EDM.c}33 0%, ${NM.bgCard} 65%)`,
            border: `1px solid ${NM.heat}55`, borderRadius: 12, padding: 16, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <PlayerPhoto name="Connor McDavid" team="EDM" size={84} ratio={0.8} rank={1}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <TeamBadge code="EDM" size={18}/>
                  <span style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, fontWeight: 600 }}>C · Oilers</span>
                </div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 17, letterSpacing: -0.4, lineHeight: 1.1, marginBottom: 4 }}>
                  Connor McDavid
                </div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, marginBottom: 6 }}>132 pts · 1.72/gm</div>
                <div style={{ fontSize: 11, color: NM.text, lineHeight: 1.4 }}>Led the league in Heat for 19 straight weeks</div>
                <div style={{ marginTop: 8 }}><HeatPill h={94} size="sm"/></div>
              </div>
            </div>
          </div>

          {/* Rows */}
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: '4px 14px' }}>
            {RANK_SKATERS.slice(1).map((p, i) => (
              <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <span style={{ width: 12, fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700 }}>{i + 2}</span>
                <PlayerPhoto name={p.n} team={p.t} size={34} ratio={1}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: NM.textBright }}>{p.n}</div>
                  <div style={{ fontFamily: NM.fontMono, fontSize: 9, color: NM.textMuted, marginTop: 1 }}>{p.l2}</div>
                </div>
                <HeatPill h={p.h} size="sm"/>
              </div>
            ))}
          </div>

          {/* Goalies + fresh compact previews */}
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
          ))}
        </div>

        {/* Last night preview */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4 }}>FROM NIGHT TWO</span>
            <span style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.textMuted, fontWeight: 700,
              padding: '2px 6px', border: `1px dashed ${NM.border}`, borderRadius: 3 }}>EMPTY UNTIL OCT 8</span>
          </div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 24, letterSpacing: -0.8, lineHeight: 1, marginBottom: 8 }}>
            Last night, every morning.
          </div>
          <div style={{ fontSize: 12, color: NM.text, lineHeight: 1.45, marginBottom: 14 }}>
            Results with our pick graded, highlights, and overnight stories — this moves to the top of the page tomorrow.
          </div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 10, padding: '4px 14px', marginBottom: 10 }}>
            {[
              { a: 'FLA', h: 'BOS', as: 4, hs: 2, hit: true,  sh: 93 },
              { a: 'TOR', h: 'MTL', as: 3, hs: 5, hit: false, sh: 72 },
              { a: 'EDM', h: 'VAN', as: 6, hs: 3, hit: true,  sh: 95 },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0',
                borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <span style={{ fontFamily: NM.fontMono, fontSize: 9, fontWeight: 800, width: 16, textAlign: 'center',
                  color: r.hit ? NM.rise : NM.cold, padding: '2px 0', borderRadius: 3,
                  background: r.hit ? NM.riseDim : 'rgba(58,136,255,0.12)' }}>{r.hit ? '✓' : '✗'}</span>
                <TeamBadge code={r.a} size={20}/>
                <span style={{ fontFamily: NM.fontMono, fontSize: 12, fontWeight: 700, color: r.as > r.hs ? NM.textBright : NM.textMuted, width: 12, textAlign: 'right' }}>{r.as}</span>
                <span style={{ fontSize: 9, color: NM.textMuted }}>–</span>
                <span style={{ fontFamily: NM.fontMono, fontSize: 12, fontWeight: 700, color: r.hs > r.as ? NM.textBright : NM.textMuted, width: 12 }}>{r.hs}</span>
                <TeamBadge code={r.h} size={20}/>
                <span style={{ flex: 1 }}/>
                <HeatPill h={r.sh} size="sm"/>
              </div>
            ))}
          </div>
          {[
            { k: 'OPENING NIGHT', t: 'McDavid picked up right where he left off.', team: 'EDM' },
            { k: 'UPSET', t: 'Montreal took the Original Six opener — our pick missed.', team: 'MTL' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: 12, background: NM.bgCard,
              border: `1px solid ${NM.borderSoft}`, borderRadius: 10, marginBottom: 8 }}>
              <div style={{ width: 54, height: 54, borderRadius: 6, flexShrink: 0, position: 'relative',
                background: `linear-gradient(155deg, ${TEAMS[s.team].c}aa 0%, ${NM.bg} 100%)` }}>
                <div style={{ position: 'absolute', top: 4, left: 4 }}><TeamBadge code={s.team} size={14}/></div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 8, color: NM.story, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{s.k}</div>
                <div style={{ fontFamily: NM.fontSans, fontWeight: 700, fontSize: 12, color: NM.textBright, lineHeight: 1.3 }}>{s.t}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Cup odds */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{ fontFamily: NM.fontMono, fontSize: 10, color: NM.heat, fontWeight: 700, letterSpacing: 1.4, marginBottom: 4 }}>PRESEASON MODEL</div>
          <div style={{ fontFamily: NM.fontSans, fontWeight: 800, fontSize: 24, letterSpacing: -0.8, marginBottom: 4 }}>Who wins the Cup?</div>
          <div style={{ fontSize: 11, color: NM.textMuted, marginBottom: 12 }}>10,000 sims from last season's data</div>
          <div style={{ background: NM.bgCard, border: `1px solid ${NM.border}`, borderRadius: 10, padding: '6px 14px' }}>
            {[
              { t: 'FLA', name: 'Panthers',  pct: 14.2 },
              { t: 'EDM', name: 'Oilers',    pct: 12.8 },
              { t: 'COL', name: 'Avalanche', pct: 10.1 },
              { t: 'DAL', name: 'Stars',     pct: 8.6 },
            ].map((c, i) => (
              <div key={c.t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderTop: i ? `1px solid ${NM.borderSoft}` : 'none' }}>
                <span style={{ width: 12, fontFamily: NM.fontMono, fontSize: 10, color: NM.textMuted, fontWeight: 700 }}>{i + 1}</span>
                <TeamBadge code={c.t} size={22}/>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: NM.textBright }}>{c.name}</span>
                <div style={{ width: 50, height: 4, background: NM.borderSoft, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${(c.pct / 15) * 100}%`, height: '100%', background: i === 0 ? NM.heat : NM.text }}/>
                </div>
                <span style={{ fontFamily: NM.fontMono, fontSize: 12, fontWeight: 700, color: i === 0 ? NM.heat : NM.textBright, width: 38, textAlign: 'right' }}>{c.pct}%</span>
              </div>
            ))}
          </div>
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
  PlayerPhoto, SeasonPhaseModel, ThreeRankingsShowcase, RankingShowcase,
  SeasonOpenerBar, OddsFromLastSeason, EarlySeasonLastNight,
  DesktopSeasonStartV2, MobileSeasonStartV2,
  RANK_SKATERS, RANK_GOALIES, RANK_FRESH,
});
