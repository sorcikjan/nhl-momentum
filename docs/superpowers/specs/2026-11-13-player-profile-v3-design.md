# Player profile v3 — design

Date: 2026-11-13 · Status: direction approved in conversation (mockups v15–v18), document awaiting approval

**Final prototype (source of truth for the look): `docs/design/player-profile-v3/profile-final-v19.html`**,
with all four tabs clickable for Gauthier and Postava. Earlier iterations, for reference only:
`docs/design/player-profile-v3/profile-v15.html`
(Now; its "Where he's heading" card is superseded by the Career chart below),
`profile-tabs-v17.html` (Games; its Player and Career cards are superseded by v18), and
`profile-tabs-v18.html` (Player, Career). They are HTML fragments with no page shell, so
some companion styles (cards, captions) are missing, but the phone frames render. The numbers in them are real NHL data for
Cutter Gauthier (ANA) and Michal Postava (DET) as of 2026-11-13, except where this document
says "illustrative".

## Intent and the why

Today's player page (`app/players/[id]/[slug]/page.tsx` + `components/player/ProfileBody.tsx`)
has good data and good ideas, all poured on the user at once. The audit on 2026-11-06 counted
231 numbers on one page and sections that contradict each other. Real example from the
user: they read an article about Michal Postava and came to see why. The page said "injured"
(he is in the AHL). It showed a huge energy line that said nothing, AI summaries that did not
load, form bars with no values and no league comparison, and a few numbers from two games.
The page failed its one job: to deliver information.

**Who it is for.** Mainly returning users who click a name in tables, stats or on the
homepage. SEO landings are a minor case.

**The page's job.** Give a name depth, so the fan can mentally file the player and tell a
friend about him ("saw X score, he's a rising sniper, I checked..."). There are four real
moments:

1. **Unknown player from the homepage.** Who is he, which nationality, where did he come
   from? Is he a kid on the rise or a veteran on a heater? Is this a lasting level or a
   few lucky games?
2. **Known star (Pastrnak).** Recent form against *his own* normal, and whether the mix
   changed (fewer goals and more assists may mean he is turning into a playmaker). Should I
   watch his next game?
3. **Player in the news (Postava).** An honest answer behind the headline: 2 games, called
   up, average numbers, back in the AHL. Still good to know he exists.
4. **Scored last night, unknown.** What is his role: a 4th-liner with a rare goal, or a
   rising sniper?

## Principles (the user's, binding)

- **Tell it with visuals and numbers. Text is the exception.** At most one sentence per
  screen, and it must be objective ("the hottest forward in the NHL" is objective; "Power-play
  weapon" is not). Translating stats into word labels is out: no archetype chips, no AI
  prose blocks. This is an app-wide principle; the profile is first.
- **Every visual carries its own scale and a drawn comparison** (league average, rank or
  percentile). No unlabeled bars, no bare numbers. Numbers sit on the visual they belong to,
  not in free text next to it.
- **No abbreviations the user must decode.** Team names are written in full or shown as a
  logo (no "PRE", "GRG").
- **Stable layout.** Sections never hide, reorder or change based on what we think is
  interesting today. A user builds a habit ("I go there for X during the game") and we must
  not move X. A section with too little data stays in place and shows its empty state.
- **Status and next game are always visible.**
- **Energy stays** as a supporting indicator (how often and when he last played). It is
  unique, but it is not a headline.

## Goals

- First screen (Now) answers "how is he doing and what's next" at a glance, on a phone.
- Each of the three summary cards on Now has a tab behind it that answers the same question
  in depth. Users learn one map: card → tab.
- The four moments above are each answerable within one tab switch.
- No contradictions between sections. One source of truth per fact.

## Non-goals

- Changing Heat, Energy or prediction-model computation. This is display only, with one
  exception: Heat is not *shown* below 5 NHL games (see Now).
- League comparisons for non-NHL leagues (Czech, AHL, NCAA, Europe). We show their values
  without a rank.
- The rest of the site. The principle applies there later, as separate projects.
- AI-written text on the profile. The existing AI summaries for "character" and "trend"
  are removed from the page.

## Anti-goals (failure even if it works)

- A page that again needs reading to understand: word verdicts, texts floating next to charts,
  legends that must be decoded.
- Any number without a comparison.
- A section that appears or disappears depending on the player.
- A status that is wrong, e.g. "injured" for a player in the minors.

## Structure

*My call:* the header carries status and next game, so "always visible" holds on every
tab. A sticky compact header (photo, name, Heat number; the second line reads
"#61 · LW · Anaheim · Sat vs NYI", and when he is not playing normally the status takes the
next game's place in amber, e.g. "In the AHL · Grand Rapids") appears once the
user scrolls past the hero or switches to a tab other than Now. The user explicitly praised
it: it keeps context and Heat says "who I'm looking at". Tabs: **Now · Games · Player · Career**.

| Tab | Question it answers | Card on Now that leads to it |
|---|---|---|
| Now | How is he doing, when does he play next? | — |
| Games | What exactly did he do in which game? | "How he's doing" |
| Player | What kind of player is he, what is his role? | "His role" |
| Career | Where did he come from, where is he heading, against the league? | "Where he's heading" |

Tab content is server-rendered (all tabs in the HTML). The active tab is in the URL, so a
link or a back-navigation lands on the same tab. *My call:* `?tab=games` etc.

### Now (mockup v15)

Top to bottom:

1. **Hero**: team colors, team logo, big jersey number, photo, first and last name, "#61 · Left
   wing · Anaheim Ducks".
2. **Four bio tiles**: nationality flag and country (from national-team play, not birthplace,
   with "born in Sweden" when they differ), age, NHL season count ("3rd NHL season"), draft
   ("#5 pick 2022" / "Undrafted").
3. **One objective sentence** (the only text). It is generated by rules from facts, not by AI.
   Example: "The hottest forward in the NHL, and his goals per game have gone up every
   season." *My call:* a small, ordered rule set; the builder proposes the rules, and every
   claim must be checkable against data on the page.
4. **Card "How he's doing"**: Heat number with change since the last game, plus a Heat
   line over this season's games with the average-forward line drawn in. Under a divider
   (so it doesn't read as chart controls): last 5 games as tiles (opponent, his G/A, team
   W/L).
5. **Card "His role"**: a team ice-time ladder ("4th of 13 Ducks forwards · 18:24", most and
   fewest at the ends). Goalies: starts among the team's goalies (Gibson 13, Tarasov 6,
   Postava 1).
6. **Card "Where he's heading"**: a small version of the Career season chart.
7. **Strip: next game + Energy**, always visible. Exception states replace the next game with an
   amber strip: "In the AHL · Grand Rapids · 6–0, .944", injured, and so on.

**Goalies (decided by the user 2026-11-13):** Heat stays a skater metric. Wherever a
skater shows Heat, a goalie shows **save %**:
- the number in the sticky header,
- the number in "How he's doing", with the change since the last game,
- a line of save % after each game with the league average drawn in,
- the per-game value in Games.

No new goalie metric is invented. The same 5-game minimum applies.

Heat is not shown below 5 NHL games this season. The Heat number shows "–", and the chart
area shows how many games are missing.

### Games (mockup v17, Games)

Purely a log for looking things up.

- Four season totals (GP, G, A, P for skaters; GP, W, SV%, GAA for goalies). *My call:*
  each total carries its rank among the same position under the number ("#1", "top 36 %"),
  from the same season summary data the Career chart uses. The per-game rows are a lookup
  log and stay bare by design; that is the only allowed exception to "every number has a
  comparison".
- Every game, newest first, grouped by month. Columns: date, team result (W/L square) and
  opponent, G, A, SOG, and Heat after the game as a colored number. Goalies: saves/shots,
  SV%, decision.
- Zeros are muted and goals highlighted, so scoring games stand out without reading.
- Older games are collapsed ("10 more October games").
- **Removed:** "Last 5 vs his normal" (the user found it chaotic). The form question is
  answered by the Heat line on Now and the radar on Player.

### Player (mockup v18, Player)

1. **His role in the team**: the ice-time ladder (same component as on Now).
2. **What kind of player**: a radar with two curves:
   - season: white dashed line,
   - last 3 weeks: orange line,
   - dashed ring: league average (50th percentile).

   How each axis works:
   - It shows a percentile against NHL players at the same position, rated **per minute on
     ice** for rate stats. This fixes the old radar's problem that good players fill
     everything and bad players nothing.
   - Each axis label carries the last-3-weeks value plus a green ▲ / red ▼ delta against the
     season, shown only when the gap is 5 or more.
   - Hovering or tapping an axis shows both values.

   Answering the Pastrnak question (mix shift) is the point of the two curves.

   *My call:* the last-3-weeks percentile places the player's own 3-week per-minute rate in
   the **season** distribution of his position. It answers "where would his recent level rank
   this season". This needs only the daily season snapshot plus a per-player window, not a
   3-week window for every player.

   The radar replaces the old "Where he stands" (ranked season stats) and "Shape of his game"
   sections on purpose. Both questions now live in one chart.
   - **Forward axes**: Goals, Shots, Assists, Power play, Ice time, Team shots on ice, Takeaways
     vs giveaways, Hits + blocks, Penalties drawn vs taken.
   - **Defensive situations not used** (penalty kill, faceoffs) are listed under the radar as
     muted tags ("Penalty kill · not used"), not drawn as a zero. A zero would read as a
     weakness.
   - **Defensemen** (*my call*, the builder may adjust after checking data availability): Points,
     Shots, Ice time, Power play, Penalty kill, Team shots on ice, Hits + blocks, Takeaways vs
     giveaways, Penalties drawn vs taken.
   - **Goalies** (*my call*): Save %, Even-strength save %, Shorthanded save %, Goals against
     average (inverted), Quality-start %, Workload (share of team starts).
   - Below the minimum sample, the radar area keeps its place and shows an empty state with the
     games still missing.

### Career (final prototype v19)

Order: season chart first (the trend is the most important thing here), then the timeline, then country.

2. **How he got here**: a vertical timeline of steps, now at the bottom. Examples: U.S.
   National Team Program → drafted #5 by PHI 2022 → Boston College → traded to Anaheim 2024 →
   Anaheim Ducks, 3rd NHL season. One short number per step where it helps ("38 goals in 41
   games"). The user praised it: unlike EliteProspects, you see where he is without counting
   years. The source is NHL.com landing `seasonTotals` plus draft details. Trades and signings
   come only from fields we can verify; *my call:* when unknown, omit the step and never guess
   a year.
1. **Season by season**: columns, one per season.
   - **Skaters**:
     - Column height is the percentile rank of points per game among NHL forwards (or
       defensemen) that season.
     - The dashed line is the average.
     - Above each column: points per game and "top X %".
     - Under it: team logo, full team name and season.
     - Column color follows the team.

     Trend and league comparison are one shape. Real Gauthier ranks: 2024–25 top 37 %
     (0.54), 2025–26 top 10 % (0.91), 2026–27 top 3 % (1.28). Pool: forwards with at least 20
     GP in a season, at least 5 in the current one.
   - **Non-NHL seasons** cannot be ranked. For skaters they stay in the timeline only.
   - **Goalies**: columns on a labeled save % scale (.880–.950), team-colored. Under each:
     full team name, league and season; above: SV% and games. Seasons under 5 GP are hatched,
     meaning an unreliable sample. Non-NHL league averages are a later improvement.
3. **For his country**: tournaments and years with the flag. This is also the source of
   nationality.

## Data work this needs

1. **Player status / `in_minors` sync.** Postava is flagged `in_minors=false` while he plays in
   the AHL, so `deriveOutStatus` (`lib/player-status.ts`) calls him injured. Fix the sync so
   the status strip is right.
2. **Nationality.** Derive it from national-team entries in `seasonTotals`
   (WJC/WC/Olympics/4 Nations…), and fall back to birth country.
3. **Next game.** NHL `club-schedule` per team.
4. **Radar inputs** from api.nhle.com/stats/rest (needs a User-Agent header):
   - `skater/timeonice`: PP and SH TOI,
   - `skater/realtime`: hits, blocks, takeaways, giveaways,
   - `skater/penalties`: drawn/taken,
   - `skater/faceoffwins`,
   - `skater/percentages` or SAT: team shots on ice,
   - `goalie/summary`, `goalie/advanced`, `goalie/savesByStrength`.

   Both a season snapshot and a last-3-weeks window are needed. The builder decides storage
   and refresh. It must fit the daily pipeline and the free Supabase tier (see the DB load
   notes; prefer one daily computed blob/table per position group over per-request
   queries).
5. **Season percentile ranks** for the Career chart, from `skater/summary` / `goalie/summary` per
   past season. Past seasons can be computed once and cached.

## Constraints

- Next.js 16 on Netlify, Supabase free tier with a small instance. Profile pages must not add
  per-request heavy queries; use the Netlify Blobs read-through cache (`lib/db-fallback.ts`)
  as existing pages do.
- The page must render when the DB is down (fallback) and must not show wrong statuses.
- Mobile first (the mockups are phone width). On desktop, the same tabs with a wider layout;
  *my call:* Now cards may sit in two columns.
- Dark theme, existing tokens and Heat color scale (`lib/heat.ts`).
- SEO: keep the existing title, meta and JSON-LD (`personLd`). The objective sentence doubles
  as the meta description.

## Left to the builder

- Component breakdown, chart implementation (SVG by hand vs a library), exact spacing and
  type sizes within the mockups' look.
- Storage and refresh of radar and percentile data.
- The objective-sentence rule set (with the constraints above).
- Minimum-sample thresholds, keeping the ones stated here as the default.
- Whether to remove dead code from the old profile (archetype, radarAxes, AI insight calls) in
  the same project or a follow-up.
