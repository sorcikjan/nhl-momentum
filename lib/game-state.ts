// Game detail page states and section plan (docs/design/redesign-2026/
// game-detail-final-and-schedule.js), regular season only — no series blocks.

export type GameView = 'upcoming' | 'live' | 'final';

export function gameView(state: string | null | undefined): GameView {
  if (state === 'LIVE' || state === 'CRIT') return 'live';
  if (state === 'OFF' || state === 'FINAL') return 'final';
  return 'upcoming'; // FUT, PRE, null, anything unexpected
}

// Main-column sections get a SectionHeading with these; side-column cards carry
// the kicker inside their box, as in the design.
export const SECTION_META = {
  prediction: { kicker: 'OUR PREDICTION', title: '' }, // title is "<TEAM> win." at render
  goalies: { kicker: 'STARTING GOALIES', title: 'The matchup in net.' },
  watch: { kicker: 'KEY PLAYERS · WHY WATCH', title: 'Three to watch on each side.' },
  specialTeams: { kicker: 'SPECIAL TEAMS', title: 'Where games are won.' },
  h2h: { kicker: 'HEAD-TO-HEAD', title: 'Recent meetings.' },
  lineup: { kicker: 'LINEUP · PROJECTED', title: "Tonight's roster picture." },
  momentum: { kicker: 'MOMENTUM TRACKER · LIVE', title: "Who's pushing right now." },
  playByPlay: { kicker: 'PLAY-BY-PLAY', title: 'Recent action.' },
  winProb: { kicker: 'LIVE WIN PROBABILITY', title: '' },
  liveStats: { kicker: 'LIVE STATS', title: '' },
  topPerformers: { kicker: 'TOP PERFORMERS', title: '' },
  threeStars: { kicker: 'THREE STARS · OFFICIAL', title: "Tonight's best." },
  keyPlayers: { kicker: 'KEY PLAYERS · HOW THEY DID', title: 'The three hottest on each side.' },
  pick: { kicker: 'OUR PICK · HOW IT PLAYED', title: '' }, // title from pickHeadline()
  heatImpact: { kicker: 'HEAT IMPACT', title: 'Who moved up. Who moved down.' },
  recap: { kicker: 'AI RECAP', title: '' },
  highlights: { kicker: 'IF YOU MISSED IT', title: '' },
} as const;

export type SectionKey = keyof typeof SECTION_META;

const PLAN: Record<GameView, { main: SectionKey[]; side: SectionKey[] }> = {
  upcoming: { main: ['prediction', 'goalies', 'watch', 'specialTeams'], side: ['h2h', 'lineup'] },
  live: { main: ['momentum', 'playByPlay'], side: ['winProb', 'liveStats', 'topPerformers'] },
  final: { main: ['threeStars', 'keyPlayers', 'pick', 'heatImpact'], side: ['recap', 'highlights'] },
};

// Design order for the view, keeping only sections that have data.
export function sectionPlan(view: GameView, available: Set<string>) {
  const p = PLAN[view];
  return { main: p.main.filter(k => available.has(k)), side: p.side.filter(k => available.has(k)) };
}

export function pickHeadline(correct: boolean | null | undefined): string {
  return correct === true ? 'The model called it.' : correct === false ? 'The model missed this one.' : 'How our pick played.';
}
