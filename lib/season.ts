// Season phase detection and section ordering.
//
// The homepage is not one layout — it is four modes selected by the calendar.
// Adding a new phase or reordering sections is a data change here, not a
// component rewrite.

import { fetchSeasonPhase, fetchPlayoffActiveTeams } from '@/lib/data';

export type SeasonPhase = 'preseason' | 'season-start' | 'regular' | 'playoffs';

// The canonical list of renderable homepage sections.
// Each maps to one React component in app/page.tsx's section registry.
export type SectionKey =
  | 'value-prop'
  | 'phase-hero'
  | 'last-night'
  | 'storylines'
  | 'matches-to-watch'
  | 'rankings'
  | 'season-strip'
  | 'week-schedule'
  | 'explore';

// Section render order by phase.
// Critical: for regular and season-start, 'last-night' must be FIRST content section.
export const SECTION_ORDER: Record<SeasonPhase, SectionKey[]> = {
  // Preseason: real exhibition games still happen this window, and last
  // season's Heat scores are still meaningful — show the same content as
  // regular season. Both sections already no-op (return null) when there's
  // genuinely nothing to show, so this never renders empty shells.
  preseason: ['value-prop', 'last-night', 'matches-to-watch', 'rankings', 'explore'],

  // Season start (first 3 weeks after opening night): stats strip leads, then
  // last-night hero, storylines, tonight, rankings, first-week schedule.
  'season-start': ['value-prop', 'season-strip', 'last-night', 'storylines', 'matches-to-watch', 'rankings', 'week-schedule', 'explore'],

  // Regular season: same anchor — what happened, what's on tonight.
  regular: ['value-prop', 'last-night', 'storylines', 'matches-to-watch', 'rankings', 'explore'],

  // Playoffs: series context first, then tonight, then last night.
  playoffs: ['value-prop', 'phase-hero', 'matches-to-watch', 'last-night', 'rankings', 'explore'],
};

// How many days after opening night counts as "season start" phase.
const SEASON_START_WINDOW_DAYS = 21;

export async function getSeasonPhase(): Promise<SeasonPhase> {
  const [phaseData, playoffTeams] = await Promise.all([
    fetchSeasonPhase().catch(() => ({
      isPreseason: false,
      regularSeasonStartDate: null as string | null,
      daysUntilStart: null as number | null,
    })),
    fetchPlayoffActiveTeams().catch(() => new Set<number>()),
  ]);

  if (phaseData.isPreseason) return 'preseason';

  // Playoffs: active playoff teams in the schedule means playoffs are underway.
  if (playoffTeams.size > 0) return 'playoffs';

  // Season start: within 21 days of opening night.
  if (phaseData.regularSeasonStartDate) {
    const startMs = new Date(`${phaseData.regularSeasonStartDate}T00:00:00Z`).getTime();
    const daysSinceStart = (Date.now() - startMs) / (24 * 60 * 60 * 1000);
    if (daysSinceStart >= 0 && daysSinceStart < SEASON_START_WINDOW_DAYS) {
      return 'season-start';
    }
  }

  return 'regular';
}
