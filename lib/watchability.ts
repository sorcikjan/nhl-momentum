// Watchability: a new, transparent composite score for the schedule page — NOT
// an observed fact, a derived ranking signal. Built entirely from real inputs
// (Heat scores already computed for the site, current model win probability,
// and whether the game is a playoff game) so it can be explained on request,
// unlike a fabricated per-game "hype" number.
//
// Formula: 50% star power (the hotter of the two best players in the game),
// 30% competitiveness (closer predicted probability = more watchable),
// 20% stakes (playoff games score higher).

export function calcWatchability({
  topHomeHeat,
  topAwayHeat,
  homeWinProbability,
  isPlayoff,
}: {
  topHomeHeat: number;
  topAwayHeat: number;
  homeWinProbability: number | null;
  isPlayoff: boolean;
}): number {
  const starPower = Math.max(topHomeHeat, topAwayHeat);
  const competitiveness = homeWinProbability != null
    ? 100 - Math.abs(homeWinProbability - 0.5) * 200
    : 50;
  const stakes = isPlayoff ? 100 : 55;

  const score = starPower * 0.5 + competitiveness * 0.3 + stakes * 0.2;
  return Math.max(0, Math.min(100, Math.round(score)));
}
