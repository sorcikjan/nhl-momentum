// A team's Heat: the average Heat of its five hottest skaters. Shown on game
// cards and in "Teams running hot", so both read the same number.
export function teamHeatByTeam(rows: { team: string; heat: number }[], top = 5): Record<string, number> {
  const by = new Map<string, number[]>();
  for (const r of rows) {
    if (!r.team) continue;
    if (!by.has(r.team)) by.set(r.team, []);
    by.get(r.team)!.push(r.heat);
  }
  const out: Record<string, number> = {};
  for (const [team, heats] of by) {
    const best = heats.sort((a, b) => b - a).slice(0, top);
    out[team] = Math.round(best.reduce((s, h) => s + h, 0) / best.length);
  }
  return out;
}
