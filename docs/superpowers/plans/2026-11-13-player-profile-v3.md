# Player Profile v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the player page with the four-tab profile (Now · Games · Player · Career) of the approved prototype, and fix the wrong "injured" status for players in the minors.

**Architecture:** The page server-renders all four tab panels. A small client component switches the active panel (`?tab=`) and shows the sticky compact header. New league comparisons (radar, career ranks, team ladder, goalie starts) come from api.nhle.com/stats/rest league tables, cached in Next's fetch cache and shared across instances with `sharedResult`. No new DB queries. Pure functions do all comparisons and are unit-tested; components only draw.

**Tech Stack:** Next.js 16 (app router, RSC), React, Tailwind + CSS variables, inline SVG charts, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-13-player-profile-v3-design.md`. The look is defined by `docs/design/player-profile-v3/profile-final-v19.html`. Open it in a browser; its CSS is the visual reference for every component below.

## Global Constraints

- Text is the exception. At most one sentence per screen, it must be objective, and no AI text is allowed. No archetype labels or word verdicts.
- Every number has a drawn comparison (rank, percentile or league average). The per-game log rows are the only exception.
- No team abbreviations the user must decode in Career. Use full team names and/or the NHL logo (`https://assets.nhle.com/logos/nhl/svg/{ABBR}_dark.svg`). Standard 3-letter opponents in the game log are fine.
- Stable layout: every section renders for every player. Missing data shows an empty state in place, never a hidden section.
- Heat is shown only for skaters with ≥ 5 NHL games this season. Goalies show save % wherever skaters show Heat, with the same 5-game minimum.
- Status and next game are always visible: in the compact header on every tab, and in the strip on Now.
- There are no new per-request DB queries. NHL stats REST calls send a `User-Agent` header and use `next: { revalidate }`. League tables are shared via `sharedResult` (`lib/db-fallback.ts`).
- The page must still render when the DB is down (existing `assertDatabaseUp` / fallback path) and when the NHL stats API fails. Each block then shows its empty state.
- Keep `revalidate = 21600`, `generateStaticParams`, the canonical redirect, JSON-LD (`personLd`) and the share button.
- UI copy is English (the site is English).

## Review Focus

1. **Player traded mid-season.** `teamAbbrevs` is like `"PHI,ANA"`. The team ladder and starts must use his current team, and the radar must use his whole-season totals. Test in Task 3.
2. **Rookie or call-up with 0–4 NHL games.** No Heat or SV% number, a "N of 5" empty state, an empty radar, and Career with no NHL columns. Nothing crashes on division by zero. Test in Tasks 3 and 6.
3. **NHL stats API down or slow (8 s timeout).** The page still renders. Radar, ladder and ranks show empty states, and the rest (bio, log, Heat) still works. Test in Task 2 (fetch failure returns `[]`).
4. **Veteran with 15+ NHL seasons.** The Career chart shows only the last 6 NHL seasons, and the timeline stays short. Test in Task 3.
5. **Player in the minors who was recalled.** The status flips back to playing once he is on the NHL roster. Test in Task 1.

---

### Task 1: Minors status from NHL rosters

Postava shows "injured" because `in_minors` is false. The current route only checks players inactive for 14+ days, one landing call each, inside a 60 s timeout. It also compares `sequence`, which is not chronological: NHL is 1 and AHL is 987. The new rule: **a player is in the minors when he is not on his team's current NHL roster and has current-season games in a minor league.**

**Files:**
- Create: `lib/player-assignment.ts`
- Modify: `app/api/ingest/player-assignments/route.ts` (rewrite the body; keep auth and the response shape `{ data: { flagged_in_minors, unflagged, checked, ... } }`, which `netlify/functions/daily-worker-background.mts:188` logs)
- Test: `tests/player-assignment.test.ts`

**Interfaces:**
- Produces: `inMinors(onNhlRoster: boolean, seasonTotals: { season: number; leagueAbbrev: string; gameTypeId: number; gamesPlayed: number }[], season: number): boolean`
- Produces: `MINOR_LEAGUES: ReadonlySet<string>` = AHL, ECHL, OHL, WHL, QMJHL, SPHL, USHL, NCAA, plus European leagues seen in landings (Czechia, Czechia2, SHL, Liiga, KHL, DEL, NL). A player loaned to Europe counts as "not in the NHL".

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { inMinors } from '@/lib/player-assignment';
const S = 20262027;
const nhl = { season: S, leagueAbbrev: 'NHL', gameTypeId: 2, gamesPlayed: 2 };
const ahl = { season: S, leagueAbbrev: 'AHL', gameTypeId: 2, gamesPlayed: 6 };
describe('inMinors', () => {
  it('off the NHL roster with AHL games → minors (Postava)', () => expect(inMinors(false, [nhl, ahl], S)).toBe(true));
  it('on the NHL roster → not minors even with AHL games (recalled)', () => expect(inMinors(true, [nhl, ahl], S)).toBe(false));
  it('off the roster with no minor-league games → not minors (injured / unsigned)', () => expect(inMinors(false, [nhl], S)).toBe(false));
  it('last season\'s AHL games do not count', () => expect(inMinors(false, [{ ...ahl, season: 20252026 }], S)).toBe(false));
  it('playoff rows do not count', () => expect(inMinors(false, [{ ...ahl, gameTypeId: 3 }], S)).toBe(false));
});
```

- [ ] **Step 2: Run** `npx vitest run tests/player-assignment.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `inMinors` in `lib/player-assignment.ts`.
- [ ] **Step 4: Rewrite the route.**
  1. Fetch `/roster/{ABBR}/{season}` for the 32 teams (abbrevs from `teams` in the DB, 4 at a time) and build `Set<playerId>` of NHL roster ids.
  2. Candidates are active players with `team_id` who are not in that set.
  3. Fetch each candidate's landing (5 at a time) and apply `inMinors`.
  4. Write `in_minors = true` for the minors and `false` for every other active player whose flag was true.
  5. Write after each batch of candidates, not only at the end, so a timeout keeps the work done.
- [ ] **Step 5: Run** `npx vitest run tests/player-assignment.test.ts` and `npx tsc --noEmit`. Expected: PASS, no errors.
- [ ] **Step 6: Commit** `fix(status): minors = off the NHL roster with minor-league games this season`

### Task 2: League stats tables

**Files:**
- Create: `lib/league-stats.ts`
- Test: `tests/league-stats.test.ts`

**Interfaces:**
- Produces types:

```ts
export type SkaterRow = {
  id: number; pos: 'F' | 'D'; team: string; // team = last entry of teamAbbrevs ("PHI,ANA" → "ANA")
  gp: number; toiSec: number; g: number; a: number; pts: number; sog: number;
  ppToiSec: number; shToiSec: number; hits: number; blocks: number; takeaways: number; giveaways: number;
  penDrawn: number; penTaken: number; satRel: number; faceoffs: number;
};
export type GoalieRow = {
  id: number; team: string; gp: number; gs: number; saves: number; shots: number; ga: number; toiSec: number;
  evSavePct: number | null; shSavePct: number | null; // shSavePct = goalie/savesByStrength ppSavePct (his team shorthanded)
  qsPct: number | null; wins: number;
};
```

- Produces fetchers. Each returns `[]` on any failure, never throws:
  - `skaterTable(season: string): Promise<SkaterRow[]>`
  - `skaterWindow(from: string, to: string): Promise<SkaterRow[]>`
  - `goalieTable(season: string): Promise<GoalieRow[]>`
  - `leagueSavePct(rows: GoalieRow[]): number | null`
- Produces the pure merge `mergeSkaters(summary: any[], realtime: any[], toi: any[], penalties: any[], percentages: any[], faceoffs: any[]): SkaterRow[]`, keyed by `playerId`, using the field names in the endpoint notes below.
- Endpoint notes:
  - Base: `https://api.nhle.com/stats/rest/en/{skater|goalie}/{report}?limit=-1&cayenneExp=...`
  - Season: `seasonId={season} and gameTypeId=2`.
  - Window: `isAggregate=true&isGame=true` with `gameDate>="{from}" and gameDate<="{to}" and gameTypeId=2`.
  - Skater reports and fields:
    - `summary`: goals, assists, points, shots, timeOnIcePerGame (sec), gamesPlayed, positionCode, teamAbbrevs.
    - `realtime`: hits, blockedShots, takeaways, giveaways.
    - `timeonice`: ppTimeOnIce, shTimeOnIce, timeOnIce (totals, sec).
    - `penalties`: penaltiesDrawn, penalties.
    - `percentages`: satRelative.
    - `faceoffwins`: totalFaceoffs.
  - Goalie reports: `summary`, `advanced` (qualityStartsPct), `savesByStrength` (evSavePct, ppSavePct).
  - Fetch: `fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (hockeymomentum.com)' }, next: { revalidate: 21600 }, signal: AbortSignal.timeout(8_000) })`.
- Sharing: wrap each fetcher in `sharedResult(\`league/${kind}/${key}\`, 6 * 3_600_000, build)`. Past seasons use a 7-day TTL.

- [ ] **Step 1: Write failing tests** for `mergeSkaters` with two-row fixtures per report. Assert:
  - `team` is `'ANA'` for `teamAbbrevs: 'PHI,ANA'`.
  - `toiSec = timeOnIcePerGame * gamesPlayed` when `timeonice` is missing for the player.
  - A player missing from `realtime` gets zeros, not NaN.
  - `pos` maps C/L/R → `'F'` and D → `'D'`.
- [ ] **Step 2: Write a failing test** that `skaterTable` returns `[]` when `fetch` rejects (`vi.stubGlobal('fetch', () => Promise.reject(new Error('down')))`).
- [ ] **Step 3: Run** `npx vitest run tests/league-stats.test.ts`. Expected: FAIL.
- [ ] **Step 4: Implement** `lib/league-stats.ts`.
- [ ] **Step 5: Run** the tests and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 6: Commit** `feat(profile): league stats tables from the NHL stats API`

### Task 3: Profile facts and the character model (pure)

**Files:**
- Create: `lib/profile-v3.ts`
- Test: `tests/player/profile-v3.test.ts`

**Interfaces** (consume `SkaterRow` and `GoalieRow` from Task 2):

- `characterAxes(me: SkaterRow, recent: SkaterRow | null, field: SkaterRow[]): Character`
  - Types:
    - `Axis = { key: string; label: string; season: number; recent: number | null }`, where both values are 0–100 percentiles.
    - `Character = { axes: Axis[]; unused: string[] }`.
  - Field: the same `pos`, gp ≥ 5, rates per 60 minutes of `toiSec`.
  - Forward axes, in this order:
    1. Goals
    2. Shots
    3. Assists
    4. Power play: `ppToiSec / gp`, a usage rate
    5. Ice time: `toiSec / gp`
    6. Team shots on ice: `satRel`, raw
    7. Takeaways: `takeaways - giveaways` per 60
    8. Hits + blocks: per 60
    9. Penalties drawn: `penDrawn - penTaken` per 60
  - Defense axes: Points, Shots, Ice time, Power play, Penalty kill (`shToiSec / gp`), Team shots on ice, Hits + blocks, Takeaways, Penalties drawn.
  - `unused` lists "Penalty kill" when `shToiSec / gp < 30`, and for forwards "Faceoffs" when `faceoffs / gp < 2`. These are never axes for forwards.
  - The `recent` percentile places his window rate in the **season** distribution of the field (spec). It is `null` when the window has fewer than 4 games.
- `goalieAxes(me: GoalieRow, field: GoalieRow[]): Character`
  - Field: gp ≥ 5.
  - Axes: Save %, Even strength, Shorthanded, Goals against (inverted: lower GAA = higher percentile), Quality starts, Workload (`gs / team's total starts`).
  - `recent` is null; the goalie radar has one curve.
- `teamLadder(rows: SkaterRow[], meId: number, team: string): { min: number; max: number; bars: { id: number; toiPerGame: number; me: boolean }[]; myRank: number }`
  - Players with `team === team` and the same `pos`, gp ≥ 3, sorted by TOI per game descending.
- `goalieStarts(rows: GoalieRow[], meId: number, team: string): { name: string; starts: number; me: boolean }[]`
  - Takes `name` through a `names: Record<number,string>` param, or add `last: string` to `GoalieRow` in Task 2 (preferred; use `lastName`).
- `seasonColumns(landing: any, rankBySeason: Record<string, { pct: number; value: number } | null>, goalie: boolean): Column[]`
  - Type: `Column = { season: string; team: string; teamName: string; league: string; value: number; pct: number | null; gp: number; thin: boolean }`.
  - Skaters: NHL regular-season rows only, merged per season (a traded player gets one column per team, in order), at most the last 6 seasons. `value` = points per game, `pct` from `rankBySeason`.
  - Goalies: every league row with gp ≥ 1 from the last 6 seasons. `value` = savePctg, `pct` = null.
  - `thin` = gp < 5.
- `seasonRank(table: SkaterRow[], id: number, pos: 'F'|'D', minGp: number): { pct: number; value: number } | null`
  - Percentile of points per game among the same `pos` with `gp >= minGp`; null when he is not in the pool.
  - minGp is 20 for past seasons and 5 for the current one.
- `nationality(landing: any, birthCountry: string | null): { code: string; flag: string; name: string; born: string | null }`
  - Uses international `seasonTotals` rows (leagueAbbrev in WJC-20, WJC-18, WC, OG, International, WCup).
  - Maps `teamName.default` ("USA", "USA U20", "Czechia", "Canada"…) to an ISO-3 code. Falls back to `birthCountry`.
  - `born` is the birth country name, set only when it differs.
- `nhlSeasonOrdinal(landing: any): number` counts distinct NHL regular seasons with gp > 0.
- `timeline(landing: any, draft: { year: number; pick: number; team: string } | null): { title: string; detail: string; now: boolean }[]`
  - One step per club in order of first season, consecutive seasons merged, plus "Drafted #N by {full team name}" after the last pre-draft club.
  - Detail is the years plus the best season's line ("38 goals in 41 games" / ".943 save %").
  - At most 6 steps, keeping the most recent; the last step is `now: true`.
  - No trade steps (we have no reliable trade data).
- `seasonTotals(me: SkaterRow | GoalieRow, field, goalie: boolean): { label: string; value: string; rank: string | null }[]`
  - Skater totals: GP, G, A, P, each with rank "#3" when the rank ≤ 25, else "top N %". GP has rank null.
  - Goalie totals: GP, W, SV%, GAA. Ranks need gp ≥ 5; otherwise rank null and the block label says "too few games to rank".
- `verdict(input: VerdictInput): string`, a rule-based objective sentence. The first matching rule wins:
  1. Status minors → `"{n} NHL games this season, now in the {league}."`
  2. Status injured / out → `"Out of the lineup for {k} straight games."`
  3. Under 5 NHL games → `"{n} NHL game(s) this season."`
  4. Heat rank 1 at his position → `"The hottest {forward|defenseman} in the NHL"`, plus `", and his points a game have gone up every season."` when the last 3 `seasonColumns` values strictly rise.
  5. Heat rank ≤ 10 → `"Among the 10 hottest {forwards} in the NHL."`
  6. Points rank ≤ 25 → `"{ordinal} in points among NHL {forwards}."`
  7. Else → `"{g} goals and {a} assists in {gp} games this season."`
  8. Goalies:
     - Save % rank ≤ 5 (gp ≥ 5) → `"{ordinal} in save % among NHL goalies."`
     - Else → `"{w} wins in {gp} games this season."`

- [ ] **Step 1: Write failing tests**, using fixtures built from the real values in the spec and prototype:
  - **Gauthier:**
    - forward axes count 9, `unused` contains "Faceoffs";
    - `seasonRank` returns `pct` ≈ 63 / 90 / 97 for fixture tables shaped like 2024-25 / 2025-26 / 2026-27;
    - `verdict` returns "The hottest forward in the NHL, and his points a game have gone up every season.";
    - `nationality` → USA, born "Sweden";
    - `nhlSeasonOrdinal` counts the 1-game 2023-24 season (expect 4).
  - **Postava:**
    - `verdict` with status minors and 2 GP → "2 NHL games this season, now in the AHL.";
    - `seasonColumns` gives 6 goalie columns, with the NHL one `thin`;
    - `goalieStarts` lists Gibson 13, Tarasov 6, Postava 1.
  - **Traded player:** `teamLadder` uses the current team only.
  - **0-game player:** `characterAxes` returns an empty `axes` without NaN; `seasonTotals` ranks are null.
  - **18-season veteran:** `seasonColumns` length 6 and `timeline` length ≤ 6.
- [ ] **Step 2: Run** `npx vitest run tests/player/profile-v3.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `lib/profile-v3.ts`. Reuse `percentile` / `ordinal` from `lib/profile-context.ts` by exporting `percentile` there.
- [ ] **Step 4: Run** the tests and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(profile): v3 facts — character radar, ranks, career columns, verdict`

### Task 4: Chart components

Server components with inline SVG. Sizes and colors follow `profile-final-v19.html`: the Heat colors come from `heatColor`, and team colors from `lib/team-colors.ts` for NHL teams. For non-NHL clubs use a neutral `var(--text-muted)` dot.

**Files:**
- Create in `components/player/v3/`: `HeatLine.tsx`, `Radar.tsx`, `SeasonColumns.tsx`, `TeamLadder.tsx`, `GoalieStarts.tsx`, `Timeline.tsx`
- Test: `tests/player/v3-charts.test.tsx`

**Interfaces:**
- `HeatLine({ values: number[]; lo: number; hi: number; avg: number | null; avgLabel: string; format: (v: number) => string; slots?: number; firstLabel: string })`. It is used for Heat (0–100) and SV% (lo .85, hi .95). `slots` draws dashed empty circles for missing games.
- `Radar({ axes: Axis[]; unused: string[]; emptyNote?: { have: number; need: number } })`
  - Season curve: white, dashed. Recent curve: orange. The 50 ring is dashed and labeled AVG.
  - Each label carries the recent (or season) value and a ▲/▼ delta when |Δ| ≥ 5.
  - Each axis has a `<title>` with both values.
- `SeasonColumns({ columns: Column[]; goalie: boolean; mini?: boolean })`
  - Skaters: height = `pct`, BEST and AVG (50, dashed) guides, label `value` + "top N %".
  - Goalies: height on the .880–.950 scale with labeled gridlines; `thin` columns are hatched.
  - Base: NHL logo + full team name + season (`mini`: season only).
- `TeamLadder(props from teamLadder + teamName)`, `GoalieStarts(rows)` and `Timeline(steps)`, per the prototype.

- [ ] **Step 1: Write failing render tests** (`renderToStaticMarkup`). Each must:
  - have no `NaN` in the output for the empty/zero inputs;
  - show `Radar` with `emptyNote {have: 2, need: 5}` containing "2 of 5";
  - show `SeasonColumns` with "Anaheim" and "top 3%" for a Gauthier fixture and with no "GRG"/"PRE" for a Postava fixture;
  - show `HeatLine` with `slots=5` and 2 values drawing 3 dashed placeholders.
- [ ] **Step 2: Run** `npx vitest run tests/player/v3-charts.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the six components.
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** `feat(profile): v3 charts — heat line, radar, season columns, ladder, timeline`

### Task 5: Tabs shell and sticky header

**Files:**
- Create: `components/player/v3/ProfileTabs.tsx` (`'use client'`)
- Create: `components/player/v3/MiniHeader.tsx`
- Test: `tests/player/v3-tabs.test.tsx`

**Interfaces:**
- `ProfileTabs({ hero: ReactNode; mini: ReactNode; panels: Record<'now'|'games'|'player'|'career', ReactNode>; initial: TabKey })`
  - Renders all four panels, with the inactive ones `hidden`, so all content stays in the HTML.
  - The tab bar is sticky.
  - Clicking a tab or a `[data-goto]` link inside a panel (the "Games ›" links on Now cards) switches panels, `history.replaceState`s `?tab=`, and scrolls to the top.
  - The `mini` header is fixed at the top. It shows when the tab ≠ now or the hero has scrolled out (IntersectionObserver on the hero).
- `MiniHeader({ photo, name, line: string; status: { text: string; tone: 'ok'|'amber'|'red' } | null; next: string | null; metric: { value: string; label: 'HEAT'|'SAVE %' } })`
  - The second line is `"#61 · LW · Anaheim · Sat vs NYI"`, or the amber status in place of the next game.

- [ ] **Step 1: Write failing tests**:
  - The static markup contains all four panels' content, with exactly one panel not `hidden` (the `initial` one).
  - `MiniHeader` shows the status text instead of the next game when a status is given.
- [ ] **Step 2: Run** the tests. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** `feat(profile): v3 tabs with sticky compact header`

### Task 6: Tab panels and the page

**Files:**
- Create in `components/player/v3/`: `NowTab.tsx`, `GamesTab.tsx`, `PlayerTab.tsx`, `CareerTab.tsx`, `types.ts` (with `ProfileV3View`)
- Modify: `app/players/[id]/[slug]/page.tsx` (build `ProfileV3View`; drop the AI insight calls, archetype and old context helpers)
- Modify: `lib/data.ts`, the `fetchPlayer` goalie aggregate: season `savePct = (shotsAgainst - goalsAgainst) / shotsAgainst`, not the mean of per-game percentages
- Create: `lib/next-game.ts`, `nextGame(team: string, today: string): Promise<{ date: string; label: string } | null>`
  - Fetches `api-web.nhle.com/v1/club-schedule/{team}/week/{today}` with revalidate 3600 and takes the first game with `gameState === 'FUT'`.
  - Label: `"Sat vs NYI"` / `"Sat @ NYI"`.
  - Returns null on failure.
- Test: `tests/player/v3-page.test.tsx`

**`ProfileV3View`** (the page fills it; the panels only read it):
- `hero`: first, last, number, position (full word), teamName, team, photo, logo.
- `bio`: nationality tile, age, NHL season ordinal, draft ("#5 · pick 2022" / "Undrafted").
- `verdict`: string.
- `status`: `{ text, tone } | null`, from `deriveOutStatus` with `in_minors`. Minors text: "In the AHL · {club}", using the minor-league club from the landing's current-season row.
- `next`: from `nextGame`.
- `energy`: `{ value, note }`.
- `metric`: skaters Heat / goalies SV%. Contains `current`, `delta`, `series` (per game this season), `avg`, `have`, and `need: 5`.
- `last5`: tiles. Skater: "3G 1A", opponent, W/L. Goalie: "24/27", opponent, W/L.
- `role`: ladder | starts.
- `character`: `Character | null` plus `emptyNote`.
- `career`: `{ columns, mini columns, timeline, country: string[] }`. Country = international tournaments with years, from the landing.
- `games`: `{ totals, rows by month }`.

Page data:
- `Promise.all` of `cachedFetchPlayer`, `fetchSeasonPhase`, `getPlayerLanding`, `skaterTable(current)` or `goalieTable(current)`, `skaterWindow(today-21d, today)` (skaters only), past-season tables for the seasons in `seasonColumns` (skaters only, max 5), and `nextGame`.
- `generateMetadata`'s description becomes the `verdict` sentence.

- [ ] **Step 1: Write failing tests** that render the four panels from two fixture views:
  - **Gauthier (skater)**: all 4 panels render and contain "How he's doing", "His role", "Where he's heading", "Every game", "What kind of player", "Season by season", "How he got here" and "For his country".
  - **Postava (goalie, minors, 2 GP)**: the same section titles are present (stable layout). "2 of 5" is shown, and the status "In the AHL" appears on Now and in the mini header. No "injured". No `NaN`.
  - Neither output contains "Scouting report", "Elite", "Playmaker" or any archetype label.
- [ ] **Step 2: Run** the tests. Expected: FAIL.
- [ ] **Step 3: Implement** the panels, `lib/next-game.ts`, the page wiring and the goalie save % fix.
- [ ] **Step 4: Run** `npx vitest run` (whole suite). Fix `tests/pages/seo-wiring.test.ts` / `isr.test.ts` only if they assert on removed imports; keep their intent. Then run `npx tsc --noEmit`. Expected: all green.
- [ ] **Step 5: Commit** `feat(profile): v3 player page — Now, Games, Player, Career`

### Task 7: Remove the old profile and verify in the real app

**Files:**
- Delete: `components/player/ProfileBody.tsx`, `components/player/PlayerHero.tsx`, `components/player/TrendChart.tsx`, `tests/player/profile.test.tsx`, `tests/player/trend.test.tsx`
- Delete, only if unused after Task 6 (check with grep): the old-profile-only parts of `lib/profile-context.ts` and `lib/player-profile.ts` (the radar, standings, last5 lines) and their tests
- Keep: `lib/archetype.ts`, `ArchetypeBadge`, and the `getPlayerInsights` call sites if anything else uses them (grep before deleting)

- [ ] **Step 1: Delete** the files and run `npx tsc --noEmit && npx vitest run`. Expected: green.
- [ ] **Step 2: Run** `npm run build`. Expected: success.
- [ ] **Step 3: Check it in a browser.**
  1. Run `npm run dev` with `.env.local`.
  2. Open `/players/8483445/cutter-gauthier` and `/players/8485545/michal-postava` at 390 px and 1280 px wide.
  3. Click every tab and compare against `profile-final-v19.html`.
  4. Check there is no layout overflow at 390 px and that the Postava status is not "injured". The DB flag gets fixed by Task 1's route; in dev, call the route once with the ingest key.
- [ ] **Step 4: Commit** `chore(profile): remove the v2 profile components`

### Task 8: Deploy

- [ ] **Step 1:** Follow `.claude/skills/push/SKILL.md`. This is a normal (non-P0) push, so check the window and the cron times. Run tsc and vitest, then check `git status`.
- [ ] **Step 2:** After the deploy, call the assignments route once (with `x-api-key: $INGEST_API_KEY`) so Postava's flag is fixed without waiting for 08:00. Then trigger targeted revalidation of the two player paths the normal way (a POST with a body). Never call `/api/revalidate` without a body.
- [ ] **Step 3:** Verify on hockeymomentum.com:
  - both players render all four tabs;
  - `?tab=career` deep-links;
  - `/api/debug/blobs` shows `set.ok=true`;
  - `/api/pipeline-health` is green.
