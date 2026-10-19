# UX redesign — regular season (design)

Date: 2026-10-19 · Branch: `redesign` · Status: approved in conversation, building

## Intent

The app has the right information but reads as a work-in-progress: every component
looks different, spacing and hierarchy vary page to page, and nothing leads the fan
from one thing to the next. It is not ready to put in front of real users.

A complete visual design already exists (Claude Design canvas "NHL Momentum —
Redesign", sources in `docs/design/redesign-2026/`). Production adopted pieces of it
piecemeal (tokens, some game-detail cards, archetype badges), each a little
differently. This project implements that design **faithfully and consistently**
across the app — for the **regular-season state only**.

## Goals

- Every in-scope page matches its "Final" artboard (desktop 1440 + mobile 390) in
  layout, section order, hierarchy, typography, spacing and color.
- One shared component library (the design's primitives) used by every page, so
  the same thing always looks the same.
- Pages tell one story: the header, section kickers and cross-links lead the fan
  Tonight → result → player → rankings, as in the design.
- Real data everywhere the design shows data; nothing on screen that the data can't
  back.

## Non-goals

- Preseason, season-start and playoff variants (season-phase model, PlayoffsHero,
  series tracker, "SPECIAL TEAMS · PLAYOFFS"). Regular season only.
- New surfaces the app doesn't have today: marketing landing page, onboarding,
  splash, shareable recap/heat cards, logo/tagline exploration.
- Prediction model, pipeline, or data-ingest changes (beyond read-side queries the
  pages need).
- New pages for "Players" and "Stories" — the design has no Final artboards for them;
  existing pages are restyled with the shared components.

## Anti-goals (failure even if it "works")

- Pages that look like the design in screenshots but use one-off styles again.
- Mock numbers or copy from the prototype shipped as if real (e.g. "67% pick
  accuracy", "Updated every hour", "ALL SKATERS · 312").
- Claiming data sources we don't use. The design footer lists MoneyPuck / Natural
  Stat Trick / Evolving Hockey — we only use the NHL Stats API; the footer says so.
- Breaking SEO already in place (titles, canonical URLs, sitemap, OG images, JSON-LD).
- Regressions in the resilience work from Oct 2026 (`assertDatabaseUp`, ISR
  intervals, cached rankings) or extra database load per render.

## Source of truth

`docs/design/redesign-2026/` (see its README). Per page, the artboard components:

| Page | Desktop | Mobile | File |
|---|---|---|---|
| Header | `BrandedHeaderDesktop` | `BrandedHeaderMobile` | branded-header-and-system.js |
| Homepage | `DesktopHomeFinal playoffs={false}` | `MobileHomeFinal playoffs={false}` | homepage-final.js |
| Player profile | `DesktopPlayerFinal` | `MobilePlayerFinal` | player-profile-final.js |
| Game — upcoming / live / final | `DesktopGameUpcoming` / `Live` / `Final` | `MobileGame…` | game-detail-final-and-schedule.js |
| Schedule | `DesktopScheduleEnhanced`, `DesktopGamesList` | `MobileGamesList` | game-detail-final-and-schedule.js, games-list-rankings-hot.js |
| Rankings | `DesktopRankings` | `MobileRankings` | games-list-rankings-hot.js |
| Heat page | `DesktopHotPlayers` | `MobileHotPlayers` | games-list-rankings-hot.js |

Tokens: `tokens.js` (`NM`). Primitives: `primitives.js`.

## Visual system

- Colors: `NM` tokens map 1:1 onto the existing CSS variables in `app/globals.css`
  (`--bg`, `--bg-card`, `--bg-raised`, `--border`, `--text-bright`, `--heat`, `--rise`,
  `--cold`, `--story`, `--gold`…). Values are aligned to `tokens.js`; drift is fixed
  in globals, not per component. `--neon` (currently a duplicate of `--cold`) is
  retired in favor of the semantic tokens.
- Heat scale: `heatColor()` in `lib/heat.ts` already equals the design's stepped
  scale — keep it, use it everywhere Heat is shown.
- Type: Geist (UI), Geist Mono (numbers, kickers, labels), Fraunces (display
  headlines) — already loaded in `app/layout.tsx`.
- Radii 4/8/12/16/pill; spacing on a 4px grid (`NM.s`).
- Team colors: one `lib/team-colors.ts` (from `tokens.js` `TEAMS`), replacing the four
  divergent copies in the codebase.

## Shared component library (`components/ds/`)

Built first; pages may only compose these plus page-specific sections.

From `primitives.js` / artboard helpers: `TeamChip` (+ `TeamBadge` ringed),
`Headshot` / `PhotoPlaceholder`, `HeatBadge` / `HeatPill` / Heat dial, `HeatBar`,
`EnergyBar`, `Kicker`, `SectionHeading` (the kicker + title + right-slot pattern used
as `PageTitle`, `GameSection`, `PpSection`), `Sparkline`, `Stat`, `Tab`/filter chips,
`ScoreRow`, `FormStreak`, `ArchetypeBadge`, `ProbabilityBar`.

Each is a server-renderable component (client only where interaction requires it),
typed props, tokens via CSS variables — no hard-coded hex outside `lib/team-colors.ts`
and `lib/heat.ts`.

## Pages (regular season)

### Shell
`BrandedHeaderDesktop/Mobile` replaces `components/layout/Sidebar.tsx`: HeatPulse mark
+ the wordmark **"momentum."** exactly as in the design — no "Hockey" (decided
2026-10-19), nav *Tonight `/` · Heat map `/hot` · Players `/search` · Rankings
`/rankings` · Stories `/recaps`*, live/tonight status pill. Footer per design with
"How Heat works" / "Methodology" links and the honest data-source line.

### Homepage `/`
Section order (desktop and mobile identical — the mobile artboard omits Tonight in
regular season; we add it in the same position as desktop, agreed in conversation):
1. Value-prop strip ("NEW HERE?" · Heat 0–100 · real YTD pick accuracy · How it works)
2. Tonight's slate — today's games with our pick (`fetchGames` + predictions)
3. Results — last completed game day: pick vs outcome + star (`fetchRecentCompletedGames`, three stars)
4. Article grid — lead story + 3 (`daily_recaps` / nightly stories)
5. Triple rankings — Hottest skaters (L5 Heat, `fetchRankings`) · Best in net (SV% last 5
   starts, `fetchGoalieRankings`) · Rookies on the rise (`fetchNewcomerWatch`)
6. Explore strip → Heat map, Rankings, Schedule, Accuracy
Removes: season-phase section registry (`lib/season.ts` SECTION_ORDER), LastNightHero,
StorylinesGrid, WeekSchedule, SeasonStatsStrip, PlayoffHero and other homepage
sections not in the design.

### Player profile `/players/[id]/[slug]`
Hero (team color + ghost number, photo, name, bio meta, AI archetype + AI bio, Heat
dial + Energy) → Form tracker (Heat over time, `metricTimeline`) → Recent form · AI
(perf eval) → Last 5 totals + game log → Season stats → Performance radar + vs league
(`fetchLeagueAverages`). Out/injury banner kept, restyled.

### Game detail `/games/[id]/[slug]` — three states by game state
- Upcoming: hero + probability bar → Our prediction (+ why/top factors, confidence &
  model accuracy) → Starting goalies → Players to watch (6) → Recent form L10 + H2H →
  Rest (rest days) + injuries/lineup → Special teams.
- Live: live hero (score, period dots) → live win probability over time → momentum
  tracker → live stats → play-by-play → top performers.
- Final: final hero → three stars → our pick · how it played (+ pick accuracy) → Heat
  impact (up / down) → AI recap → highlights.
Playoff-only blocks (series tracker, series context) are not rendered.

### Schedule `/games`
`DesktopScheduleEnhanced` row layout with filters All / Today / Tomorrow / This week
(existing `range` param): time/status, teams, our pick, watch-for players, and a
watchability indicator (or the final score after the game).

### Rankings `/rankings`
Heat-colored table with sparklines; position chips ALL/C/L/R/D/G; sort Heat /
Points / Goals / Assists. Count in the kicker is the real number of ranked skaters.

### Heat page `/hot`
#1 hero with big Heat dial → 2–8 stack → Breakout watch (biggest Heat gains, 14 days)
→ Cooling off.

### Other existing pages
`/teams`, `/teams/[id]/[slug]`, `/recaps`, `/recaps/[date]/[slug]`, `/news`,
`/accuracy`, `/search`: no Final artboards — move onto the shell and shared
components (SectionHeading, cards, chips) so they match; no layout re-think.
`/playoffs` stays as-is outside the main nav until playoffs (non-goal).

## Constraints

- Next.js App Router + ISR as today; keep `assertDatabaseUp()` first in each page,
  existing `revalidate` values, `generateMetadata`, JSON-LD and OG images.
- Data only via existing `lib/data.ts` fetchers; any new query must be bounded
  (window/limit) and cached like `fetchRankings` — free-tier database.
- Mobile-first: every page verified at 390px and 1440px.
- Work on branch `redesign`, pushed continuously; Netlify deploy preview for review;
  merge to `main` only when every in-scope page is done.

## My calls (not discussed — check these)

- Branch + deploy preview instead of committing straight to `main`, so production
  isn't half-redesigned during the work.
- Players/Stories nav keep `/search` and `/recaps` (restyled).
- Watchability on the schedule = simple derived score (sum of the two teams' top
  Heat + closeness of our win probability to 50%), shown as a meter; no new data.
- Design elements without data are omitted rather than faked: "OFFICIALS",
  "LINEUP · CONFIRMED" (we only know projected lineups → labeled "Projected"),
  travel distance in "REST & TRAVEL" (rest days only).
- Season-phase code is deleted, not hidden; git history keeps it.

## Left to the builder

Component APIs, file layout inside `components/ds/`, how page sections are split into
files, responsive breakpoints between the two artboard widths, loading skeletons
(must match final section heights), and empty states (no games today, no recap yet).

## Verification

- `tsc` clean, `next build` passes, lint no new errors.
- Side-by-side screenshots of each page (desktop + mobile, real data) against its
  artboard; differences listed and fixed or justified.
- Pipeline health check still `ok`; no new heavy queries in `db_diagnostics`.
