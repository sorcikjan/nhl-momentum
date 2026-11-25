// When pages are rendered again: only when their data changes (2026-11-25).
//
// Data changes at a few known moments: a game finishes (game-finish worker),
// the daily pipeline runs, predictions are made. Each ends with a call to
// /api/revalidate for exactly the pages it changed. Between those moments a
// page is served from Netlify's cache and costs no compute.
//
// Two leaks made pages render far more often than that, from the database, at
// Netlify's per-second compute price (7 days in Nov 2026 used 879 credits):
// - the page-level `revalidate` timers (1–10 min), and
// - every external fetch made during a render: its own revalidate (5 min by
//   default) lowers the page's lifetime, so player pages expired every hour.
// The page timers are now only a backstop (1 day, 7 for player and team
// pages; set as literals in each page, Next requires that), and external fetches
// made while rendering a page are cached for as long (externalCache).
//
// The one exception is a game being played: its page is the only one that
// follows the game live (liveTtl).

import { workAsyncStorage } from 'next/dist/server/app-render/work-async-storage.external';

const DAY = 86_400;
// Longest an external answer may serve a page. /api/revalidate expires it with
// the page (revalidatePath), the daily full sweep expires all of it (NHL_TAG).
export const EXTERNAL_TTL = 7 * DAY;
export const NHL_TAG = 'nhl';
// How often a live game's page follows the score.
export const LIVE_TTL = 300;

function inApiRoute(): boolean {
  try {
    const route = workAsyncStorage.getStore()?.route;
    return !route || route.startsWith('/api');
  } catch {
    return true;
  }
}

// `next` options for an external fetch. In API routes (the pipeline) exactly
// what the caller asked for: ingest must read fresh data, nothing changes there.
// In page renders the long lifetime, unless the caller follows a live game.
export function externalCache(revalidate: number, opts: { live?: boolean } = {}): { revalidate: number; tags?: string[] } {
  if (inApiRoute() || opts.live) return { revalidate };
  return { revalidate: Math.max(revalidate, EXTERNAL_TTL), tags: [NHL_TAG] };
}

// A game that isn't final: before puck drop its page lives until puck drop
// (then it starts following the game), during the game LIVE_TTL. Null when the
// game is over (its page changes only when the pipeline writes).
export function liveTtl(game: { game_state?: string | null; start_time_utc?: string | null } | null, now = Date.now()): number | null {
  if (!game || game.game_state === 'FINAL' || game.game_state === 'OFF') return null;
  const start = game.start_time_utc ? Date.parse(game.start_time_utc) : NaN;
  if (!Number.isFinite(start)) return LIVE_TTL;
  const untilStart = Math.floor((start - now) / 1000);
  return Math.min(DAY, Math.max(LIVE_TTL, untilStart));
}
