interface Meeting {
  id: number;
  game_date: string;
  home_score: number | null;
  away_score: number | null;
  // Supabase's generated types embed a to-one FK join as an array — normalize below.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  home_team: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  away_team: any;
}

const abbrevOf = (team: { abbrev: string } | { abbrev: string }[] | null): string | undefined =>
  Array.isArray(team) ? team[0]?.abbrev : team?.abbrev;

export default function HeadToHeadCard({
  meetings, homeAbbrev, awayAbbrev,
}: {
  meetings: Meeting[];
  homeAbbrev: string;
  awayAbbrev: string;
}) {
  if (!meetings.length) return null;

  // Results from the current home team's perspective, regardless of which
  // side they were on in each past meeting.
  const results = meetings.map(m => {
    const wasHome = abbrevOf(m.home_team) === homeAbbrev;
    const homeTeamScore = wasHome ? m.home_score : m.away_score;
    const otherScore = wasHome ? m.away_score : m.home_score;
    const won = homeTeamScore != null && otherScore != null && homeTeamScore > otherScore;
    const margin = homeTeamScore != null && otherScore != null ? Math.abs(homeTeamScore - otherScore) : null;
    return { won, margin };
  }).reverse(); // oldest → newest, left to right

  const wins = results.filter(r => r.won).length;
  const losses = results.length - wins;
  const avgMargin = results.filter(r => r.margin != null).reduce((s, r) => s + (r.margin ?? 0), 0) / (results.length || 1);

  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text)' }}>Head-to-Head</div>
      <div className="text-lg font-bold font-editorial mb-0.5" style={{ color: 'var(--text-bright)' }}>
        {homeAbbrev} {wins} — {losses} {awayAbbrev}
      </div>
      <div className="text-xs mb-3" style={{ color: 'var(--text)' }}>
        Last {meetings.length} meetings · avg margin {avgMargin.toFixed(1)} goals
      </div>
      <div className="flex gap-1">
        {results.map((r, i) => (
          <span
            key={i}
            className="flex-1 text-center text-xs font-bold py-1 rounded"
            style={{
              background: r.won ? 'rgba(0,229,160,0.12)' : 'rgba(239,68,68,0.12)',
              color: r.won ? 'var(--rise)' : 'var(--red)',
            }}
          >
            {r.won ? 'W' : 'L'}
          </span>
        ))}
      </div>
    </div>
  );
}
