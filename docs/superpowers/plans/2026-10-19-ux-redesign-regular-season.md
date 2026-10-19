# UX Redesign (Regular Season) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild every in-scope page to match its "Final" artboard (regular season), on one shared component library.

**Architecture:** A `components/ds/` primitives layer (from the design's `primitives.js` and artboard helpers) is built and tested first; each page is then rebuilt section-by-section from those primitives and existing `lib/data.ts` fetchers. Layout switches from the mobile artboard (390) to the desktop artboard (1440) at Tailwind `lg` (1024px). Season-phase code is removed once the new homepage replaces it.

**Tech Stack:** Next.js 16.1 App Router (ISR), React 19.2, Tailwind 4, TypeScript; Vitest (added in Task 1) with `react-dom/server` `renderToStaticMarkup` for component tests.

**Spec:** `docs/superpowers/specs/2026-10-19-ux-redesign-regular-season-design.md` · design sources `docs/design/redesign-2026/`

## Global Constraints

- Regular-season state only; no preseason / season-start / playoff variants, no series tracker.
- Visual source of truth = the artboard named for each page in the spec's Source-of-truth table; match section order, hierarchy, type, spacing, color.
- Colors only via CSS variables from `app/globals.css` (aligned to `docs/design/redesign-2026/tokens.js`); hex allowed only in `lib/team-colors.ts` and `lib/heat.ts`.
- Heat color always via `heatColor()` from `lib/heat.ts`; Heat value via `ppmToHeat()`.
- Fonts: Geist (UI), Geist Mono (numbers, kickers, labels), Fraunces (display headlines) — already loaded.
- Header wordmark is exactly `momentum.` (period in `var(--heat)`) with the HeatPulse mark; no "Hockey".
- Footer data-source line: `DATA · NHL Stats API` — never MoneyPuck / Natural Stat Trick / Evolving Hockey.
- No prototype mock numbers or copy shipped as real ("67% pick accuracy", "Updated every hour", "ALL SKATERS · 312", "Oilers win.").
- Every ISR page keeps `await assertDatabaseUp()` first, its current `revalidate`, `generateMetadata`, JSON-LD and OG image.
- New queries must be bounded (date window or limit) and go through `lib/data.ts`; nothing heavier than today per render.
- Mobile (<1024px) uses the mobile artboard layout; desktop (≥1024px) the desktop artboard.
- Work on branch `redesign`; commit and push after every task.

## Review Focus

1. **No games today / off-day** — homepage Tonight and `/games?range=today` show an empty state with the next game day, not a blank block. (Tasks 7, 12)
2. **Player with no snapshot or no games this season** (call-up, injured all year) — profile renders with Heat shown as "—" and "No games yet this season", never `NaN`/0 Heat. (Task 8)
3. **Long names at 390px** (e.g. "Oliver Ekman-Larsson", "Columbus Blue Jackets") — truncate with ellipsis inside rows; no horizontal page scroll. (Tasks 3, 7, 13)
4. **Game state values** `FUT`, `PRE` → upcoming; `LIVE`, `CRIT` → live; `OFF`, `FINAL` → final; anything else → upcoming. (Task 9)
5. **Missing optional data** — no recap for yesterday, no prediction for a game, no three stars yet: the section is omitted or shows a one-line placeholder; the page still renders. (Tasks 7, 11)

---

### Task 1: Test harness

**Files:**
- Create: `vitest.config.ts`, `tests/smoke.test.ts`
- Modify: `package.json` (devDependencies `vitest`; script `"test": "vitest run"`), `tsconfig.json` only if `tests/` needs including

**Interfaces:**
- Produces: `npm test` runs `tests/**/*.test.ts(x)`; `@/` alias resolves to repo root; tests render components with `renderToStaticMarkup` from `react-dom/server`.

- [ ] **Step 1: Write `tests/smoke.test.ts`** — `import { ppmToHeat } from '@/lib/heat'`; assert `ppmToHeat(0.12) === 100` and `ppmToHeat(null) === 0`.
- [ ] **Step 2: Run `npx vitest run`** — expected FAIL (vitest missing / no config).
- [ ] **Step 3: Add vitest + `vitest.config.ts`** (environment `node`, `resolve.alias` `@` → project root, include `tests/**/*.test.{ts,tsx}`, esbuild `jsx: 'automatic'`).
- [ ] **Step 4: Run `npm test`** — expected PASS (2 assertions).
- [ ] **Step 5: Commit** `test: add vitest harness`

### Task 2: Tokens and team colors

**Files:**
- Modify: `app/globals.css` (`:root` token values)
- Create: `lib/team-colors.ts`
- Modify: `components/dashboard/TonightSection.tsx`, `components/dashboard/PlayoffHero.tsx`, `app/games/[id]/[slug]/opengraph-image.tsx`, `app/players/[id]/[slug]/page.tsx` (drop local color maps, import from `lib/team-colors.ts`)
- Test: `tests/team-colors.test.ts`

**Interfaces:**
- Produces: `teamColor(abbrev: string): { bg: string; fg: string; name: string }` (fallback `{ bg: 'var(--bg-raised)', fg: 'var(--text-bright)', name: abbrev }` for unknown codes); `TEAMS: Record<string, { bg: string; fg: string; name: string }>` copied from `tokens.js` `TEAMS` (`c`→`bg`, `t`→`fg`).

- [ ] **Step 1: Test** — `teamColor('EDM')` equals `{ bg: '#041E42', fg: '#FF4C00', name: 'Edmonton' }`; `teamColor('UTA').bg === '#71AFE5'`; `teamColor('XXX').name === 'XXX'`; `Object.keys(TEAMS).length === 32`.
- [ ] **Step 2: Run** `npm test -- team-colors` — FAIL (module missing).
- [ ] **Step 3: Implement `lib/team-colors.ts`**, replace the four local maps; set `globals.css` `:root` values to `tokens.js` (`--bg #0a0b0f`, `--bg-card #13151c`, `--bg-raised #1a1d26`, `--bg-hover #1f2330`, `--border #252a38`, `--border-soft #1c2030`, `--text #8a94a6`, `--text-muted #5a6378`, `--text-bright #f4f5f8`, `--heat #ff5a24`, `--cold #3a88ff`, `--rise #00e5a0`, `--story #e5508b`, `--gold #ffb547`, `--red #ef4444`, `--green #22c55e`); add `--text-dim #6b7388`, `--blue #4d7cff`. Leave `--neon` defined (removed in Task 16).
- [ ] **Step 4: Run** `npm test && npx tsc --noEmit` — PASS.
- [ ] **Step 5: Commit** `feat(ds): design tokens + single team color map`

### Task 3: DS primitives — identity and layout

**Files:**
- Create: `components/ds/TeamChip.tsx`, `components/ds/Headshot.tsx`, `components/ds/Kicker.tsx`, `components/ds/SectionHeading.tsx`, `components/ds/Stat.tsx`, `components/ds/FilterChips.tsx`, `components/ds/index.ts`
- Test: `tests/ds/identity.test.tsx`

**Interfaces:**
- Consumes: `teamColor` (Task 2).
- Produces (all exported from `@/components/ds`):
  - `TeamChip({ abbrev, size = 28, ringed = false })` — 2–3 letter block in team colors (design `TeamChip` / `TeamBadge`).
  - `Headshot({ src, name, size = 36, ringColor? })` — round photo; initials on `bg-raised` when `src` is null.
  - `Kicker({ children, color? })` — Geist Mono 10–11px, uppercase, letter-spacing 1, default `var(--text-muted)`.
  - `SectionHeading({ kicker, title, sub?, right?, as = 'h2' })` — design `PageTitle`/`GameSection`/`PpSection` pattern.
  - `Stat({ label, value, sub?, align = 'left' })`.
  - `FilterChips({ options: { label: string; href: string; active: boolean }[] })` — links, not client state.

- [ ] **Step 1: Tests** — `TeamChip abbrev="EDM"` markup contains `#041E42` and text `EDM`; `Headshot src={null} name="Connor McDavid"` contains `CM`; `SectionHeading kicker="OUR PREDICTION" title="x" as="h1"` renders an `<h1>`; `FilterChips` marks exactly the active option with `aria-current="page"`; a 40-character name inside `Headshot`'s sibling text uses the `truncate` class (Review Focus 3).
- [ ] **Step 2: Run** `npm test -- ds/identity` — FAIL.
- [ ] **Step 3: Implement** the six components to match `primitives.js` / artboard helpers (sizes, radii, fonts from the design).
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `feat(ds): identity and layout primitives`

### Task 4: DS primitives — data visuals

**Files:**
- Create: `components/ds/HeatBadge.tsx` (exports `HeatPill`, `HeatDial`), `components/ds/HeatBar.tsx`, `components/ds/EnergyBar.tsx`, `components/ds/Sparkline.tsx`, `components/ds/ProbabilityBar.tsx`, `components/ds/FormStreak.tsx`, `components/ds/ScoreRow.tsx`, `components/ds/ArchetypeBadge.tsx`
- Test: `tests/ds/visuals.test.tsx`

**Interfaces:**
- Consumes: `heatColor` (`lib/heat.ts`), `TeamChip` (Task 3).
- Produces:
  - `HeatPill({ heat: number | null, size?: 'sm' | 'md' })`, `HeatDial({ heat: number | null, size = 120, label = 'HEAT · L5' })` — `null` renders `—` in `var(--text-muted)`.
  - `HeatBar({ heat })`, `EnergyBar({ value, size?: 'sm' | 'lg' })` — label HIGH ≥70 / MODERATE ≥40 / DRAINED.
  - `Sparkline({ values: number[], width = 80, height = 24, color? })` — SVG polyline; fewer than 2 values renders nothing.
  - `ProbabilityBar({ home: {abbrev, pct}, away: {abbrev, pct}, pick: 'home' | 'away' })`.
  - `FormStreak({ results: ('W' | 'L' | 'OTL')[] })`, `ScoreRow({ away, home, awayScore?, homeScore?, status })`, `ArchetypeBadge({ archetype, blurb?, compact? })`.

- [ ] **Step 1: Tests** — `HeatPill heat={87}` contains `#ff3a0f`; `HeatPill heat={null}` contains `—` and not `NaN`; `HeatDial heat={0}` shows `0`; `EnergyBar value={39}` contains `DRAINED`; `Sparkline values={[1]}` renders empty string; `ProbabilityBar` with home 62 / away 38 contains `62%` and `38%`.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** per `primitives.js`, `player-profile-final.js` (`EnergyBar`, `ArchetypeBadge`), `game-detail-final-and-schedule.js` (`FormStreak`).
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `feat(ds): heat, energy, sparkline, probability primitives`

### Task 5: App shell — branded header and footer

**Files:**
- Create: `components/ds/HeatPulseMark.tsx`, `components/layout/BrandHeader.tsx`, `components/layout/SiteFooter.tsx`
- Modify: `app/layout.tsx` (replace `Sidebar` with `BrandHeader` + `SiteFooter`; adjust `main` top padding to header height), remove page-level footers in `app/page.tsx` / `app/welcome/page.tsx` that duplicate it
- Delete: `components/layout/Sidebar.tsx`, `components/layout/LiveBadge.tsx` (if unused after)
- Test: `tests/layout/shell.test.tsx`

**Interfaces:**
- Consumes: `TonightPill` (existing), `PlayerSearch` (existing).
- Produces: `NAV_ITEMS: { href: string; label: string }[]` exported from `BrandHeader.tsx` = Tonight `/`, Heat map `/hot`, Players `/search`, Rankings `/rankings`, Stories `/recaps`; `HeatPulseMark({ size = 28 })` (SVG from `brand-foundation.js` `HeatPulseMark`).

- [ ] **Step 1: Tests** — `NAV_ITEMS.map(i => i.href)` equals `['/', '/hot', '/search', '/rankings', '/recaps']`; `SiteFooter` markup contains `NHL Stats API` and does not contain `MoneyPuck`, `Natural Stat Trick` or `Evolving Hockey`; header markup contains `momentum` and does not contain `Hockey`.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** to `BrandedHeaderDesktop` / `BrandedHeaderMobile` (active item by pathname — client component only for that), footer per `DesktopHomeFinal` trust footer with links "How Heat works" → `/welcome`, "Methodology" → `/accuracy`.
- [ ] **Step 4: Run** `npm test && npx tsc --noEmit && npm run build` — PASS.
- [ ] **Step 5: Commit** `feat(shell): branded header and footer`

### Task 6: Homepage data

**Files:**
- Create: `lib/home.ts`
- Test: `tests/home.test.ts`

**Interfaces:**
- Consumes: `fetchGames`, `fetchRecentCompletedGames`, `fetchRankings`, `fetchGoalieRankings`, `fetchNewcomerWatch`, `fetchRecentRecaps`, `fetchAccuracy` (`lib/data.ts`).
- Produces:
  - `fetchHomeData(today: string): Promise<HomeData>` with `HomeData = { tonight: SlateGame[]; nextGameDate: string | null; results: ResultCard[]; stories: StoryCard[]; hottest: RankRow[]; goalies: RankRow[]; rookies: RankRow[]; pickAccuracyPct: number | null }` — each part caught to its empty value on error so one failing fetcher can't blank the page.
  - Pure helpers (tested): `toResultCard(game, prediction | null): ResultCard` with `pick: 'hit' | 'miss' | null`; `formatAccuracy(pct: number | null): string` → `"67% pick accuracy · YTD"` or `null`-safe `"Pick accuracy tracking"`.
  - `nextGameDate` = first date after `today` with scheduled games when `tonight` is empty (Review Focus 1), looked up within 7 days via `fetchGamesRange`.

- [ ] **Step 1: Tests** — `toResultCard` on home 3–2 win with home prob 0.6 → `pick === 'hit'`; with prob 0.4 → `'miss'`; with no prediction → `null`; `formatAccuracy(66.6)` → `"67% pick accuracy · YTD"`; `formatAccuracy(null)` contains no `%`.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** (shapes taken from the existing fetchers' return values).
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `feat(home): homepage data loader`

### Task 7: Homepage

**Files:**
- Create: `components/home/ValuePropStrip.tsx`, `TonightSlate.tsx`, `ResultsSection.tsx`, `ArticleGrid.tsx`, `TripleRankings.tsx`, `ExploreStrip.tsx` (all in `components/home/`)
- Modify: `app/page.tsx` (rewrite: `assertDatabaseUp()`, `fetchHomeData`, sections in order, keep `metadata` and `revalidate = 120`)
- Delete: `lib/season.ts` section registry and its consumers; homepage-only components no longer imported (`LastNightHero`, `StorylinesGrid`, `WeekSchedule`, `SeasonStatsStrip`, `PlayoffHero`, `DailyBrandStrip`, `TonightSection`, `HeatGrid`, … — delete only those with zero remaining imports, verified by grep)
- Test: `tests/home/page-order.test.tsx`

**Interfaces:**
- Consumes: `HomeData` (Task 6), `components/ds` (Tasks 3–4).
- Produces: `HOME_SECTIONS = ['value-prop', 'tonight', 'results', 'stories', 'rankings', 'explore'] as const`, rendered in this order on both breakpoints (mobile includes Tonight — agreed deviation from the mobile artboard); each section root has `data-section={key}`.

- [ ] **Step 1: Tests** — rendering the page body component with a fixture `HomeData` yields `data-section` attributes in exactly `HOME_SECTIONS` order; with `tonight: []` and `nextGameDate: '2026-10-21'` the Tonight section contains `Oct 21` (Review Focus 1); with `stories: []` the stories section is absent (Review Focus 5); markup contains no `67%` unless `pickAccuracyPct` is 67.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** sections to `DesktopHomeFinal` / `MobileHomeFinal` (`playoffs={false}`); Tonight takes the slot `TonightSlate` has on desktop.
- [ ] **Step 4: Run** `npm test && npx tsc --noEmit && npm run build` — PASS; open `/` at 390 and 1440 and compare with the artboards (fix or note differences in the commit message).
- [ ] **Step 5: Commit** `feat(home): regular-season homepage per design; remove season-phase layouts`

### Task 8: Player profile

**Files:**
- Create: `components/player/PlayerHero.tsx`, `FormTracker.tsx`, `RecentFormAI.tsx`, `LastFive.tsx`, `SeasonStats.tsx`, `RadarVsLeague.tsx` (in `components/player/`)
- Modify: `app/players/[id]/[slug]/page.tsx` (compose new sections; keep data loading, out-status banner logic, metadata, JSON-LD, OG)
- Delete: superseded `components/players/*` with zero imports afterwards
- Test: `tests/player/profile.test.tsx`

**Interfaces:**
- Consumes: `fetchPlayer`, `fetchLeagueAverages`, `getPlayerInsights`, archetype from `lib/archetype.ts`, `deriveOutStatus`; DS `HeatDial`, `EnergyBar`, `ArchetypeBadge`, `Sparkline`, `SectionHeading`.
- Produces: `PlayerHero({ player, heat: number | null, energy: number | null, archetype, bio, outStatus })`.

- [ ] **Step 1: Tests** — `PlayerHero` with `heat={null}` contains `No games yet this season` and not `NaN` (Review Focus 2); with `outStatus='injured'` contains `INJURED`; `SectionHeading` kickers present in order `FORM TRACKER`, `RECENT FORM · AI`, `SEASON STATS`.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** to `DesktopPlayerFinal` / `MobilePlayerFinal`; season label from the current season (e.g. `2026–27`), not the artboard's `2025–26`.
- [ ] **Step 4: Run** tests, tsc, build; compare `/players/8478402/connor-mcdavid` at 390/1440 with the artboards.
- [ ] **Step 5: Commit** `feat(player): profile per design`

### Task 9: Game detail — shell and upcoming state

**Files:**
- Create: `lib/game-state.ts`, `components/game/GameHeroUpcoming.tsx`, `components/game/UpcomingSections.tsx`
- Modify: `app/games/[id]/[slug]/page.tsx` (branch on `gameView(state)`; upcoming composes new sections from existing data: prediction + factors, goalie matchup, players to watch, form L10 + H2H, rest days + injuries labelled "Projected", special teams)
- Test: `tests/game/state.test.ts`, `tests/game/upcoming.test.tsx`

**Interfaces:**
- Produces: `gameView(state: string | null): 'upcoming' | 'live' | 'final'` — `FUT|PRE` → upcoming, `LIVE|CRIT` → live, `OFF|FINAL` → final, else upcoming (Review Focus 4).

- [ ] **Step 1: Tests** — each mapping above incl. `gameView(null) === 'upcoming'` and `gameView('XYZ') === 'upcoming'`; upcoming render with no prediction omits `OUR PREDICTION` and still renders the hero (Review Focus 5); no `SERIES` or `PLAYOFFS` text in upcoming markup; lineup kicker reads `LINEUP · PROJECTED`.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** to `DesktopGameUpcoming` / `MobileGameUpcoming` minus series blocks and "OFFICIALS".
- [ ] **Step 4: Run** tests, tsc, build; compare an upcoming game page with the artboards.
- [ ] **Step 5: Commit** `feat(game): upcoming state per design`

### Task 10: Game detail — live state

**Files:**
- Create: `components/game/GameHeroLive.tsx`, `components/game/LiveSections.tsx`
- Modify: `app/games/[id]/[slug]/page.tsx` (live branch)
- Test: `tests/game/live.test.tsx`

**Interfaces:**
- Consumes: `gameView` (Task 9); existing live data used by `MomentumTracker`, `LiveStatsGrid`, `RecentActionFeed`, `WinProbabilityCard`.

- [ ] **Step 1: Tests** — live render contains kickers in order `LIVE WIN PROBABILITY`, `MOMENTUM TRACKER · LIVE`, `LIVE STATS`, `PLAY-BY-PLAY`; empty play-by-play renders a one-line placeholder, not an empty card.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** to `DesktopGameLive` / `MobileGameLive`, reusing the existing live components' data, restyled with DS primitives.
- [ ] **Step 4: Run** tests, tsc, build.
- [ ] **Step 5: Commit** `feat(game): live state per design`

### Task 11: Game detail — final state

**Files:**
- Create: `components/game/GameHeroFinal.tsx`, `components/game/FinalSections.tsx`
- Modify: `app/games/[id]/[slug]/page.tsx` (final branch); delete game components left with zero imports after Tasks 9–11 (incl. `SeriesTrackerCard`)
- Test: `tests/game/final.test.tsx`

**Interfaces:**
- Consumes: `three_stars`, prediction outcome, `fetchPostGameHeat`, recap, `youtube_highlight_id`.

- [ ] **Step 1: Tests** — kickers in order `THREE STARS · OFFICIAL`, `OUR PICK · HOW IT PLAYED`, `HEAT IMPACT`, `AI RECAP`; with `three_stars` null the stars section is omitted; with a missed pick the pick headline does not say "nailed".
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** to `DesktopGameFinal` / `MobileGameFinal` minus series blocks; pick headline from the outcome (hit → "The model called it.", miss → "The model missed this one.").
- [ ] **Step 4: Run** tests, tsc, build; compare a finished game with the artboards.
- [ ] **Step 5: Commit** `feat(game): final state per design`

### Task 12: Schedule

**Files:**
- Create: `lib/watchability.ts`, `components/schedule/ScheduleRow.tsx`
- Modify: `app/games/page.tsx` (rows + `FilterChips` All/Today/Tomorrow/This week on the existing `range` param)
- Test: `tests/watchability.test.ts`, `tests/schedule/row.test.tsx`

**Interfaces:**
- Produces: `watchability(input: { homeTopHeat: number[]; awayTopHeat: number[]; homeWinProb: number | null }): number` (0–100, integer).

```ts
// avgHeat = mean of up to 3 top Heat values per team, both teams pooled (0 if none)
// closeness = homeWinProb == null ? 50 : 100 * (1 - Math.abs(homeWinProb - 0.5) * 2)
// score = Math.round(0.6 * avgHeat + 0.4 * closeness)
```

- [ ] **Step 1: Tests** — `watchability({ homeTopHeat: [90, 80, 70], awayTopHeat: [90, 80, 70], homeWinProb: 0.5 }) === 88`; with `homeWinProb: 1` → `48`; empty heats and `null` prob → `20`; a row for a final game shows the score instead of the meter; `range=today` with no games shows the empty state with the next game date (Review Focus 1).
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** to `DesktopScheduleEnhanced` / `MobileGamesList`.
- [ ] **Step 4: Run** tests, tsc, build.
- [ ] **Step 5: Commit** `feat(schedule): schedule per design with watchability`

### Task 13: Rankings

**Files:**
- Modify: `app/rankings/page.tsx`, `components/rankings/RankingsTable.tsx` (rewrite to design), delete other `components/rankings/*` left unused
- Test: `tests/rankings/table.test.tsx`

**Interfaces:**
- Consumes: `fetchRankings` (cached), DS `FilterChips`, `HeatPill`, `Sparkline`, `TeamChip`.
- Produces: URL params `pos=ALL|C|L|R|D|G` and `sort=heat|points|goals|assists` (defaults `ALL`, `heat`).

- [ ] **Step 1: Tests** — kicker shows the real count (`ALL SKATERS · 540` for a 540-row fixture); `pos=D` keeps only defensemen; `sort=goals` orders by season goals desc; a 30-character name renders with `truncate` (Review Focus 3).
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** to `DesktopRankings` / `MobileRankings`.
- [ ] **Step 4: Run** tests, tsc, build; check 390px has no horizontal page scroll.
- [ ] **Step 5: Commit** `feat(rankings): rankings per design`

### Task 14: Heat page

**Files:**
- Modify: `app/hot/page.tsx`; rewrite `components/dashboard/BreakoutWatch.tsx`, `components/dashboard/CoolingOff.tsx`, `components/rankings/BurningSection.tsx` to design (or replace with `components/hot/*` and delete)
- Test: `tests/hot/page.test.tsx`

**Interfaces:**
- Consumes: `fetchRankings` (top100, breakoutWatch, coolingWatch), DS `HeatDial`.

- [ ] **Step 1: Tests** — section order `#1 hero`, `2–8`, `BREAKOUT WATCH`, `COOLING OFF`; sub-copy does not contain `Updated every hour`; with fewer than 8 ranked players renders those available.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** to `DesktopHotPlayers` / `MobileHotPlayers`.
- [ ] **Step 4: Run** tests, tsc, build.
- [ ] **Step 5: Commit** `feat(hot): heat page per design`

### Task 15: Remaining pages onto the system

**Files:**
- Modify: `app/teams/page.tsx`, `app/teams/[id]/[slug]/page.tsx`, `app/recaps/page.tsx`, `app/recaps/[date]/[slug]/page.tsx`, `app/news/page.tsx`, `app/news/[id]/page.tsx`, `app/accuracy/page.tsx`, `app/search/page.tsx`, `app/error.tsx`
- Test: `tests/pages/headings.test.tsx`

- [ ] **Step 1: Test** — each listed page's heading block is a `SectionHeading` (assert by rendering the page heading components with fixtures: a single `<h1>` per page, kicker present).
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** — swap headings, cards, chips, team/player identity to DS primitives; no layout re-think.
- [ ] **Step 4: Run** tests, tsc, build.
- [ ] **Step 5: Commit** `refactor: remaining pages onto design system`

### Task 16: Cleanup and parity review

**Files:**
- Modify: `app/globals.css` (remove `--neon`, `--neon-glow`), any remaining `var(--neon)` → semantic token
- Delete: components with zero imports (`grep -rL` over `components/`), `lib/season.ts` leftovers
- Create: `docs/superpowers/specs/2026-10-19-ux-redesign-parity.md` (per page: screenshot pair notes, accepted differences)

- [ ] **Step 1: Run** `grep -rn "var(--neon" app components` — expect matches (pre-cleanup).
- [ ] **Step 2: Replace and delete**; re-run grep — expect none; `grep -rnE "#[0-9a-fA-F]{6}" components/ds components/home components/player components/game` — expect none.
- [ ] **Step 3: Run** `npm test && npx tsc --noEmit && npm run lint && npm run build` — PASS, lint no new errors vs `main`.
- [ ] **Step 4: Parity** — screenshot every in-scope page at 390 and 1440 on the deploy preview (real data) next to its artboard; record differences and fix or justify in the parity doc; confirm `/api/pipeline-health` `ok` and `db_diagnostics` shows no new top query.
- [ ] **Step 5: Commit** `chore: redesign cleanup + parity review`, then open PR `redesign → main`.
