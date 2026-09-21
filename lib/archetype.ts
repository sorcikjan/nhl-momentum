// Deterministic player archetype classification.
//
// This is intentionally NOT an AI-generated label. It's pure math over stats
// already in player_metric_snapshots — no new AI call, no new schema, no
// invented facts (e.g. "PP1 quarterback" never ships here because we have no
// power-play line data). Every label and tag traces back to a real number,
// which is what makes it correctable: a wrong-looking archetype is either a
// genuine small-sample artifact (it self-corrects as season_games grows) or
// a threshold worth tuning — never a fact someone has to manually retract.
//
// Deliberately does NOT use hits or blocked_shots: verified directly against
// game_player_stats (49,068 rows) that both columns are 0 for every row in
// the DB — a pre-existing gamelogs ingestion gap, not something to build
// archetype categories on top of. Only goals, assists, shooting %, PIM,
// shots on goal, and PP points are confirmed genuinely populated.

export interface ArchetypeInput {
  positionCode: string | null;
  seasonGames: number;
  seasonGoals: number;
  seasonAssists: number;
  seasonShootingPct: number; // 0-1
  seasonShots: number;
  seasonPpPoints: number;
  seasonPim: number;
}

export interface ArchetypeResult {
  label: string;
  tags: { text: string; basis: string }[];
  basis: string; // one-line explanation of the label itself
}

const MIN_GAMES = 10;

export function deriveArchetype(input: ArchetypeInput): ArchetypeResult | null {
  const {
    positionCode, seasonGames, seasonGoals, seasonAssists, seasonShootingPct,
    seasonShots, seasonPpPoints, seasonPim,
  } = input;

  if (!positionCode || seasonGames < MIN_GAMES) return null;

  const points = seasonGoals + seasonAssists;
  if (points === 0) return null;

  const ptsPerGame = points / seasonGames;
  const goalShare = points > 0 ? seasonGoals / points : 0;
  const assistShare = points > 0 ? seasonAssists / points : 0;
  const shotsPerGame = seasonShots / seasonGames;
  const pimPerGame = seasonPim / seasonGames;
  const ppShare = points > 0 ? seasonPpPoints / points : 0;

  let label: string;
  let basis: string;

  if (positionCode === 'D') {
    if (ptsPerGame >= 0.5) {
      label = 'Offensive Defenseman';
      basis = `${ptsPerGame.toFixed(2)} points/game from the blue line this season`;
    } else if (pimPerGame >= 0.8) {
      label = 'Physical Defenseman';
      basis = `${pimPerGame.toFixed(1)} penalty minutes/game, ${ptsPerGame.toFixed(2)} points/game`;
    } else {
      label = 'Two-Way Defenseman';
      basis = `${ptsPerGame.toFixed(2)} points/game — steady, no single skill dominates`;
    }
  } else {
    // Forwards (C/L/R)
    if (goalShare >= 0.55 && seasonShootingPct >= 0.12) {
      label = 'Sniper';
      basis = `${(goalShare * 100).toFixed(0)}% of points are goals, shooting ${(seasonShootingPct * 100).toFixed(1)}%`;
    } else if (assistShare >= 0.65) {
      label = 'Playmaker';
      basis = `${(assistShare * 100).toFixed(0)}% of points are assists this season`;
    } else if (shotsPerGame >= 3.0 && ptsPerGame < 0.7) {
      label = 'Volume Shooter';
      basis = `${shotsPerGame.toFixed(1)} shots/game, shooting ${(seasonShootingPct * 100).toFixed(1)}%`;
    } else if (ptsPerGame < 0.3 && pimPerGame >= 0.5) {
      label = 'Grinder';
      basis = `${pimPerGame.toFixed(1)} penalty minutes/game in a depth role (${ptsPerGame.toFixed(2)} points/game)`;
    } else if (ptsPerGame >= 0.7) {
      label = 'Scorer';
      basis = `${ptsPerGame.toFixed(2)} points/game with a ${goalShare >= assistShare ? 'goal' : 'assist'}-leaning mix`;
    } else {
      label = 'Two-Way Forward';
      basis = `${ptsPerGame.toFixed(2)} points/game — steady, no single skill dominates`;
    }
  }

  const tags: { text: string; basis: string }[] = [];
  if (ppShare >= 0.3 && seasonPpPoints >= 5) {
    tags.push({ text: 'Power-play weapon', basis: `${(ppShare * 100).toFixed(0)}% of points came on the power play` });
  }
  if (positionCode !== 'D' && seasonShootingPct >= 0.15 && seasonGoals >= 5 && label !== 'Sniper') {
    tags.push({ text: 'Finisher', basis: `${(seasonShootingPct * 100).toFixed(1)}% shooting this season` });
  }
  if (shotsPerGame >= 3.0 && label !== 'Volume Shooter') {
    tags.push({ text: 'High shot volume', basis: `${shotsPerGame.toFixed(1)} shots/game` });
  }

  return { label, tags: tags.slice(0, 2), basis };
}
