# UX redesign — parity review (regular season)

Each in-scope page was screenshotted with real data (production build, 1440px and a
true 390px viewport via puppeteer) and compared with its artboard in
`docs/design/redesign-2026/`. All pages: no horizontal scroll at 390px.

| Page | Matches | Accepted differences (why) |
|---|---|---|
| Header / footer | HeatPulse mark + "momentum.", nav, status pill, trust footer | Avatar circle → search button (no accounts). Mobile bottom tab bar added (design has no mobile nav). Footer names only the NHL Stats API. Pill reads "TONIGHT · N" (no live-state fetch in the layout). |
| Homepage | Section order, value strip, tonight slate, results, stories, triple rankings, explore | Tonight also on mobile (agreed). Explore links only to existing pages (no "Compare"). Stories = last night's recap + its game sections. Rookies = ≤50 NHL games (not "under 23"). |
| Player profile | Hero (gradient, ghost number, photo, identity, archetype, AI bio, Heat dial, energy), form tracker, recent form, last 5 + game log, season grid, radar, vs league | No FOW%, per-stat league ranks, xG/60 or "Top 10" marker (no data; p95 shown as "Top 5%"). Radar axes are ones we can compute. Goalies: no Heat, no radar/game log. One-day Heat dips can appear from Oct 13 partial-rebuild snapshots (data artifact). |
| Game — upcoming | Split-gradient hero, prediction + factors, goalies, players to watch, special teams, H2H, lineup (PROJECTED) | No team record/division line, officials or travel (no data). Odds block and full lineups kept below (real data; model vs market line added). |
| Game — live | Section order and headings | Verified by unit tests only — no live game during the review. |
| Game — final | Score hero, three stars, pick (headline follows outcome), heat impact, AI recap, highlights | No series context (regular season). |
| Schedule | Row layout, ringed pick, watch-for, watchability, ★ marquee, day headers, filters | Filters: Today / Tomorrow / This week / Next 2 weeks (no date picker). No "+N stories" column. |
| Rankings | Heat-colored rows, sparklines, Δ vs average, position + sort chips | Kicker "TOP 100 OF N SKATERS" (top 100 only). No in-table search. Goalie view (G) by save %. |
| Heat page | #1 hero + dial, ranked 2–9, breakout watch, cooling off | Copy describes what's computed ("furthest above/below season pace") instead of "last 14 days" / "updated every hour". |
| Other pages | Shared SectionHeading h1, gutters, tokens | Layouts unchanged by design (no artboards). |

Pipeline / database: no pipeline code changed. New read queries are bounded and
cached (season pick accuracy 30 min, today's game count 5 min, goalie season
scoped by game id). Game pages and the schedule no longer call `fetchAccuracy()`.
