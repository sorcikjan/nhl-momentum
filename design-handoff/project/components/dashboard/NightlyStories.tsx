import { fetchNightlyStoryData } from '@/lib/data';
import { generateNightlyStories } from '@/lib/ai';
import type { NightlyGameResult, NightlyPerformer } from '@/lib/ai';

async function getYesterday(): Promise<string> {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default async function NightlyStories() {
  const yesterday = await getYesterday();
  const raw = await fetchNightlyStoryData(yesterday).catch(() => null);

  if (!raw || !raw.games.length) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const games: NightlyGameResult[] = (raw.games as any[]).map(g => ({
    awayTeam:  g.away_team?.abbrev ?? '?',
    homeTeam:  g.home_team?.abbrev ?? '?',
    awayScore: g.away_score ?? 0,
    homeScore: g.home_score ?? 0,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topPerformers: NightlyPerformer[] = (raw.topPerformers as any[]).map(p => ({
    name:      `${p.players.first_name} ${p.players.last_name}`,
    team:      p.teams?.abbrev ?? '?',
    position:  p.players.position_code,
    goals:     p.goals ?? 0,
    assists:   p.assists ?? 0,
    plusMinus: p.plus_minus ?? 0,
    toiMin:    (p.toi_seconds ?? 0) / 60,
  }));

  const summary = await generateNightlyStories({ date: yesterday, games, topPerformers });

  const dateLabel = new Date(yesterday + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="rounded-xl border p-4 mb-6"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--neon)' }}>
            Last Night in the NHL
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>{dateLabel}</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded font-medium"
          style={{ background: 'var(--neon-glow)', color: 'var(--neon)' }}>
          {games.length} game{games.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Scores row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {games.map((g, i) => {
          const awayWon = g.awayScore > g.homeScore;
          return (
            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <span style={{ color: awayWon ? 'var(--text-bright)' : 'var(--text)', fontWeight: awayWon ? 700 : 400 }}>
                {g.awayTeam} {g.awayScore}
              </span>
              <span style={{ color: 'var(--text)', opacity: 0.4 }}>–</span>
              <span style={{ color: !awayWon ? 'var(--text-bright)' : 'var(--text)', fontWeight: !awayWon ? 700 : 400 }}>
                {g.homeScore} {g.homeTeam}
              </span>
            </div>
          );
        })}
      </div>

      {/* AI summary */}
      {summary ? (
        <div className="rounded-lg px-4 py-3 mb-4"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-bright)' }}>
            {summary}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text)', opacity: 0.5 }}>
            AI-generated analysis
          </p>
        </div>
      ) : null}

      {/* Top performers */}
      {topPerformers.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text)' }}>
            Top Performers
          </p>
          <div className="flex flex-col gap-1.5">
            {topPerformers.slice(0, 5).map((p, i) => {
              const pts = p.goals + p.assists;
              const sign = (n: number) => n >= 0 ? `+${n}` : String(n);
              return (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold w-4 text-center"
                      style={{ color: 'var(--neon)' }}>{i + 1}</span>
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-bright)' }}>
                        {p.name}
                      </span>
                      <span className="text-xs ml-1.5" style={{ color: 'var(--text)' }}>
                        {p.team} · {p.position}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-semibold" style={{ color: 'var(--neon)' }}>
                      {p.goals}G {p.assists}A
                    </span>
                    <span className="text-xs ml-1.5" style={{ color: 'var(--text)' }}>
                      {pts}pts · {sign(p.plusMinus)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
