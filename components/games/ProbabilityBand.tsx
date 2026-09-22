/**
 * ProbabilityBand — win-probability split as two flex children.
 * The favoured side keeps full saturation (var(--heat)); the other is greyed
 * (var(--border)). Width equals the probability share, so a 58/42 split reads
 * instantly without looking at labels.
 */
export default function ProbabilityBand({
  away,
  home,
  pick,
  height = 8,
}: {
  away: number;   // 0–100 probability (away team)
  home: number;   // 0–100 probability (home team)
  pick: 'away' | 'home';
  height?: number;
}) {
  return (
    <div className="flex rounded-full overflow-hidden" style={{ height }}>
      <div
        style={{
          flex: Math.max(away, 1),
          background: pick === 'away' ? 'var(--heat)' : 'var(--border)',
        }}
      />
      <div
        style={{
          flex: Math.max(home, 1),
          background: pick === 'home' ? 'var(--heat)' : 'var(--border)',
        }}
      />
    </div>
  );
}
