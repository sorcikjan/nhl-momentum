// Master app — homepage-first, with variations preserved as a catalog.

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "view": "home",
  "showAnnotations": true
}/*EDITMODE-END*/;

function App() {
  const [cfg, setCfg] = React.useState(DEFAULTS);
  const [panel, setPanel] = React.useState(false);
  const [route, setRoute] = React.useState('home'); // 'home' | 'player'

  React.useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === '__activate_edit_mode') setPanel(true);
      if (e.data?.type === '__deactivate_edit_mode') setPanel(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const update = (patch) => {
    setCfg(prev => {
      const next = { ...prev, ...patch };
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*');
      return next;
    });
  };

  return (
    <>
      <DesignCanvas>
        {/* PROMO — front and center */}
        <DCSection
          title="Promo & brand — Momentum"
          subtitle="A new identity, a tagline system, marketing surfaces, and shareable cards. The product needs to be a brand, not a tool."
        >
          <BrandFoundation/>
          <SeasonPhaseModel/>
          <DesktopPreseason/>
          <MobilePreseason/>
          <DesktopSeasonStartV3/>
          <MobileSeasonStartV3/>
          <DesktopHomeFinal playoffs={true}/>
          <MobileHomeFinal playoffs={true}/>
          <DesktopHomeFinal playoffs={false}/>
          <MobileHomeFinal playoffs={false}/>
          <DesktopPlayerFinal/>
          <MobilePlayerFinal/>
          <DesktopGameUpcoming/>
          <DesktopGameLive/>
          <DesktopGameFinal/>
          <MobileGameUpcoming/>
          <MobileGameLive/>
          <MobileGameFinal/>
          <DesktopScheduleEnhanced/>
          <DesktopGamesList/>
          <MobileGamesList/>
          <DesktopRankings/>
          <MobileRankings/>
          <DesktopHotPlayers/>
          <MobileHotPlayers/>
          <TaglineLab/>
          <LandingPage/>
          <GameRecapCard/>
          <PlayerHeatCard/>
          <AppSplash/>
          <Onboarding step={1}/>
          <Onboarding step={2}/>
          <Onboarding step={3}/>
          <OGCardPreview/>
        </DCSection>

        {/* Intro */}
        <DCSection
          title="NHL Momentum — Redesign"
          subtitle="Stories through data. Mobile-first. Matches lead, heat map as exploration, newsroom as secondary."
        >
          <DCArtboard label="The strategy" width={900} height={440}
            style={{ background: '#fff', padding: 32, borderRadius: 6 }}>
            <div style={{ color: '#1a1a1a', fontFamily: NM.fontSans, fontSize: 13, lineHeight: 1.6 }}>
              <div style={{ fontFamily: NM.fontDisplay, fontWeight: 700, fontSize: 26, letterSpacing: -0.5, marginBottom: 12, color: '#1a1a1a' }}>
                Homepage as a set of attention drivers — with stories as the product.
              </div>
              <p style={{ margin: '0 0 12px' }}>
                Your feedback was direct: <b>we're not a newsroom</b>, but we are the place people go <i>for new stories told through data</i>. The homepage is structured around that.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 14px', marginTop: 16 }}>
                <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700 }}>01 · LAST NIGHT</div>
                <div>The daily habit hook. One cinematic recap with photo, scoreline, and the story the data tells. Secondary strip shows 2 more recaps + "8 more →". <b>This is why people come back tomorrow.</b></div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.blue, fontWeight: 700 }}>02 · TONIGHT</div>
                <div>Matches + predicted outcomes <b>as the hero</b>. Live game banner, a split-color prediction card with narrative, then compact prediction rows for the rest of the slate.</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.heat, fontWeight: 700 }}>03 · HEAT MAP</div>
                <div>20 tiles, warm-to-cold. Easy to read, data-based. Functions as an exploration surface — tap any tile to dig into that player's story.</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.story, fontWeight: 700 }}>04 · MORE STORIES</div>
                <div>Newsroom-style ticker — breakouts, slumps, rookie watch. Smaller. Weekly cadence. Background hum, not the lede.</div>
                <div style={{ fontFamily: NM.fontMono, fontSize: 11, color: NM.textMuted, fontWeight: 700 }}>05 · LINKS</div>
                <div>Quiet entry points to full rankings and the compare tool.</div>
              </div>
            </div>
          </DCArtboard>

          <DCArtboard label="Vocabulary" width={440} height={440} style={{ background: NM.bg, padding: 28, borderRadius: 6 }}>
            <div style={{ color: NM.textBright }}>
              <div style={{ fontFamily: NM.fontDisplay, fontWeight: 900, fontSize: 22, letterSpacing: -0.5, marginBottom: 16, lineHeight: 1 }}>
                Rename things like a fan talks.
              </div>
              {[
                ['Momentum PPM',      'Heat', '0–100, warm = hot'],
                ['Hot Right Now',     'Who\'s burning?', ''],
                ['Nightly Stories',   'Last night', ''],
                ['Breakout Watch',    'Breakouts', ''],
                ['Prediction Accur.', 'How accurate is Heat?', ''],
              ].map(([o, n, s]) => (
                <div key={o} style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10, fontSize: 12 }}>
                  <span style={{ color: NM.textMuted, textDecoration: 'line-through', flex: 1 }}>{o}</span>
                  <span style={{ color: NM.heat, fontFamily: NM.fontMono }}>→</span>
                  <span style={{ color: NM.textBright, fontWeight: 600, flex: 1 }}>{n}</span>
                </div>
              ))}
              <div style={{ marginTop: 20, padding: 14, background: NM.bgCard, border: `1px solid ${NM.borderSoft}`, borderRadius: 8, fontSize: 11, color: NM.text, lineHeight: 1.5 }}>
                <b style={{ color: NM.heat }}>Heat</b> is the one word that unlocks everything else. It's emotional, hockey-native, and the scale (0–100) matches how people actually talk about a player: "McDavid is at a hundred right now."
              </div>
            </div>
          </DCArtboard>
        </DCSection>

        {/* THE HOMEPAGE */}
        <DCSection title="Homepage — Today (the main deliverable)" subtitle="Scroll all the way down on this device frame to see the full composition.">
          <PhoneFrame label="Homepage · Tuesday, game day" width={390} height={1700} statusBar={true}>
            <HomeV3 onOpenPlayer={() => setRoute('player')}/>
          </PhoneFrame>

          {/* Annotation column */}
          <DCArtboard label="Why this order" width={340} height={1700} style={{ background: '#fff', padding: 24 }}>
            <div style={{ color: '#1a1a1a', fontFamily: NM.fontSans, fontSize: 12.5, lineHeight: 1.55 }}>
              <Ann num="01" color={NM.heat} title="Results — the first thing you see">
                Clear and simple: who played, what was the result, was our pick right. Horizontal scroller scales from 1 game to 18 — same UI either way. Each card surfaces the standout player so you can tap straight into their profile. The mini accuracy strip up top sets honest expectations.
              </Ann>
              <Ann num="02" color={NM.blue} title="Upcoming — minimal, with watch-picks">
                Two flagship "Watch tonight" cards float to the top — these are the games we think you should actually watch, with star players highlighted ("watch for McDavid 94"). Below them, the rest of the slate is a quiet single-line list, sorted by time.
              </Ann>
              <Ann num="03" color={NM.heat} title="Burning heat map">
                Your favorite. Now in its proper place — after results and upcoming. An editorial lede frames it ("These twenty are scoring above their season average"). Tap any tile to dig into that player's story.
              </Ann>
              <Ann num="04" color={NM.story} title="More stories">
                Newsroom comes last. Smaller, weekly cadence. Background hum.
              </Ann>

              <div style={{ marginTop: 20, padding: 12, background: '#f7f5ef', borderRadius: 6, fontSize: 11, color: '#444' }}>
                <b>Typography note:</b> swapped Fraunces serifs out of headlines per your feedback — clean Geist throughout. Player names and the McDavid nameplate keep the display treatment because that one worked.
              </div>
            </div>
          </DCArtboard>
        </DCSection>

        {/* PLAYER PROFILE — the traffic driver */}
        <DCSection title="Player profile — essential traffic driver" subtitle="Where SEO lands. Where stories live. Where fans linger.">
          <PhoneFrame label="McDavid — full profile" width={390} height={1600}>
            <PlayerProfileV2 onBack={() => setRoute('home')}/>
          </PhoneFrame>

          <DCArtboard label="What makes this page earn its traffic" width={340} height={1600} style={{ background: '#fff', padding: 24 }}>
            <div style={{ color: '#1a1a1a', fontFamily: NM.fontSans, fontSize: 12.5, lineHeight: 1.55 }}>
              <Ann num="01" color={NM.heat} title="Cinematic hero">
                Full-bleed photo slot + massive Fraunces nameplate with last name accented in heat-orange. Jersey number ghosts the background. Instantly shareable as a social card.
              </Ann>
              <Ann num="02" color={NM.heat} title="Heat summary card">
                Overlaps the photo, with the signature circular Heat badge and a one-line editorial blurb. A fan gets the player's current story in under 2 seconds.
              </Ann>
              <Ann num="03" color={NM.blue} title="Four key stats">
                Last-5 focus. Matches the "Heat" philosophy — recency over career totals. Mono digits, tight.
              </Ann>
              <Ann num="04" color={NM.heat} title="Heat timeline">
                The signature chart. 6-week Heat curve with dashed season-avg reference line, pulsing endpoint, toggle to Season/Career views. Uses real SVG animation for the "now" dot.
              </Ann>
              <Ann num="05" color={NM.blue} title="Last 5 games table">
                Home/away marker, W/L, G–A, time-on-ice, and <b>Heat score per game</b>. The per-game Heat column is unique to your product — no other site has it.
              </Ann>
              <Ann num="06" color={NM.rise} title="Where he ranks">
                Percentile bars. #1 of 312 in Heat and goals L10. Immediately credibility-building.
              </Ann>
              <Ann num="07" color={NM.story} title="Compare to">
                Horizontal scroll of comparable peers (same position). One tap into a compare flow.
              </Ann>
              <Ann num="08" color={NM.heat} title="Stories stack">
                Three AI-generated story cards: Last night, The streak, The number. <b>This is your AI pipeline's home.</b> Every entry: kicker, date, headline, dek.
              </Ann>

              <div style={{ marginTop: 20, padding: 12, background: '#f7f5ef', borderRadius: 6, fontSize: 11, color: '#444' }}>
                <b>SEO hooks:</b> the player's name in H1, the last-5-games table as structured data, each story card indexable independently, jersey number & team as breadcrumb schema.
              </div>
            </div>
          </DCArtboard>
        </DCSection>

        {/* RANKINGS */}
        <DCSection title="Rankings — the database view" subtitle="The destination for fans who want to browse by position, sort by streak, filter by team.">
          <PhoneFrame label="Rankings · Heat-colored rows">
            <RankingsRedesign/>
          </PhoneFrame>
          <DCArtboard label="Notes" width={340} height={844} style={{ background: '#fff', padding: 24 }}>
            <div style={{ color: '#1a1a1a', fontFamily: NM.fontSans, fontSize: 12.5, lineHeight: 1.55 }}>
              <Ann num="A" color={NM.heat} title="Heat stripe on the left">
                Each row has a 3px left stripe whose opacity scales with Heat. No need to read the number to sense the heat of the player at a glance.
              </Ann>
              <Ann num="B" color={NM.blue} title="Position filter chips">
                ALL / C / L / R / D at the top. Heat-colored when active, matches the app's personality.
              </Ann>
              <Ann num="C" color={NM.story} title="Sparkline per row">
                A tiny 6-week Heat line shows direction-of-travel. Breakouts pop visually — fast-rising sparks look different from plateaus.
              </Ann>
              <Ann num="D" color={NM.rise} title="Δ vs avg column">
                How hot is this player <i>relative to their season average</i>? Positive = breaking out, negative = cooling off.
              </Ann>

              <div style={{ marginTop: 20, padding: 12, background: '#f7f5ef', borderRadius: 6, fontSize: 11, color: '#444' }}>
                <b>Future:</b> tap any row → player profile. Sticky column header. Secondary tabs for Goalies and Teams.
              </div>
            </div>
          </DCArtboard>
        </DCSection>

        {/* CATALOG OF EARLIER EXPLORATIONS */}
        {cfg.showAnnotations && (
          <DCSection title="Earlier explorations (kept for reference)" subtitle="V1–V5 led to the single homepage above. Included so you can see what was considered.">
            <PhoneFrame label="V1 — Newsroom (secondary-ized now)"><V1Newsroom/></PhoneFrame>
            <PhoneFrame label="V2 — Heat Map (absorbed into home)"><V2Heatmap/></PhoneFrame>
            <PhoneFrame label="V3 — Pulse / predictions (absorbed)"><V3Pulse/></PhoneFrame>
            <PhoneFrame label="V4 — Streaks"><V4Streaks/></PhoneFrame>
            <PhoneFrame label="V5 — Digest"><V5Minimal/></PhoneFrame>
          </DCSection>
        )}
      </DesignCanvas>

      {/* Tweaks */}
      {panel && (
        <div style={{
          position: 'fixed', bottom: 16, right: 16, zIndex: 100,
          background: '#1a1a1a', border: '1px solid #333', borderRadius: 12,
          padding: 14, minWidth: 240, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          fontFamily: NM.fontSans, color: '#eee',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#888', marginBottom: 10 }}>
            Tweaks
          </div>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>Show earlier explorations</div>
          <button onClick={() => update({ showAnnotations: !cfg.showAnnotations })} style={{
            width: '100%', padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
            border: `1px solid ${cfg.showAnnotations ? NM.heat : '#333'}`,
            background: cfg.showAnnotations ? NM.heatDim : 'transparent',
            color: cfg.showAnnotations ? NM.heat : '#ccc',
            fontSize: 12, fontWeight: 600,
          }}>{cfg.showAnnotations ? 'Shown' : 'Hidden'}</button>
        </div>
      )}
    </>
  );
}

// ─── Annotation block used in the side columns ───────────────────
function Ann({ num, color, title, children }) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #eee' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{ fontFamily: NM.fontMono, fontSize: 11, color, fontWeight: 700, letterSpacing: 1 }}>{num}</span>
        <span style={{ fontFamily: NM.fontDisplay, fontWeight: 700, fontSize: 14, color: '#1a1a1a', letterSpacing: -0.2 }}>{title}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
