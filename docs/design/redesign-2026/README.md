# Redesign 2026 — design source (reference only)

Extracted from the Claude Design canvas "NHL Momentum — Redesign"
(claude.ai/artifact/HHB4pZobVfUGJ5p6e8bWZ8). These are the prototype's React/JSX
sources, kept here as the visual source of truth for the implementation described in
`docs/superpowers/specs/2026-10-19-ux-redesign-regular-season-design.md`.

Not part of the app build. Only the files needed for the regular-season scope are
included; mock data is illustrative.

| File | Artboards |
|---|---|
| tokens.js | `NM` design tokens, `heatColor`, team colors |
| primitives.js | TeamChip, Headshot, HeatBadge, HeatBar, Kicker, Sparkline, Stat, Tab, ScoreRow |
| branded-header-and-system.js | BrandedHeaderDesktop / BrandedHeaderMobile |
| homepage-final.js | DesktopHomeFinal / MobileHomeFinal (`playoffs={false}` = regular season) |
| player-profile-final.js | DesktopPlayerFinal / MobilePlayerFinal |
| game-detail-final-and-schedule.js | Game Upcoming / Live / Final (desktop + mobile), DesktopScheduleEnhanced |
| games-list-rankings-hot.js | Games list, Rankings, Hot players (desktop + mobile) |
| brand-foundation.js | HeatPulseMark logo + wordmark used by the header |
