import Link from 'next/link';
import { playerUrl } from '@/lib/urls';

type Newcomer = {
  player_id: number;
  season_games: number;
  momentum_games: number;
  momentum_goals: number;
  momentum_assists: number;
  season_goals: number;
  season_assists: number;
  players: {
    first_name: string;
    last_name: string;
    headshot_url: string | null;
    position_code: string;
    career_games: number;
    draft_year: number | null;
    draft_round: number | null;
    draft_pick: number | null;
    teams: { id: number; abbrev: string } | null;
  };
};

export function NewcomerWatch({ newcomers }: { newcomers: Newcomer[] }) {
  if (!newcomers.length) return null;

  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-bright)' }}>
          ✦ Newcomer Watch
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
          50 career games or fewer — players making their early mark. Remember the name.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {newcomers.map((p) => {
          const name = `${p.players.first_name} ${p.players.last_name}`;
          const seaPts = p.season_goals + p.season_assists;
          const momPts = p.momentum_goals + p.momentum_assists;
          const ptsPerGame = p.season_games > 0
            ? ((seaPts / p.season_games) * 100 | 0) / 100
            : 0;

          const draftLine = p.players.draft_year
            ? `${p.players.draft_year} · R${p.players.draft_round ?? '?'} · #${p.players.draft_pick ?? '?'}`
            : null;

          // Career context label
          const careerLabel = p.players.career_games <= 10
            ? 'First weeks'
            : p.players.career_games <= 25
            ? 'Establishing'
            : 'Breaking in';

          return (
            <Link
              key={p.player_id}
              href={playerUrl(p.player_id, p.players.first_name, p.players.last_name)}
              className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              {/* Headshot */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 mt-0.5">
                {p.players.headshot_url
                  ? <img src={p.players.headshot_url} alt={name} className="w-full h-full object-cover" loading="lazy" />
                  : <div className="w-full h-full flex items-center justify-center text-sm font-bold"
                      style={{ color: 'var(--text)' }}>
                      {p.players.first_name[0]}
                    </div>
                }
              </div>

              {/* Info block */}
              <div className="flex-1 min-w-0">
                {/* Name + badge */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm" style={{ color: 'var(--text-bright)' }}>
                    {name}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0"
                    style={{ background: 'var(--border)', color: 'var(--text)' }}>
                    {p.players.teams?.abbrev ?? '—'}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--silver)' }}>
                    {p.players.position_code}
                  </span>
                </div>

                {/* Career context */}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-semibold" style={{ color: 'var(--amber)' }}>
                    {careerLabel}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--silver)', opacity: 0.6 }}>
                    {p.players.career_games} career GP
                  </span>
                </div>

                {/* Draft line */}
                {draftLine && (
                  <div className="text-xs mt-0.5" style={{ color: 'var(--silver)', opacity: 0.5 }}>
                    {draftLine}
                  </div>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-3 mt-2">
                  <div>
                    <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--neon)' }}>
                      {p.season_goals}G {p.season_assists}A
                    </span>
                    <span className="text-xs ml-1.5" style={{ color: 'var(--silver)' }}>
                      {p.season_games} GP
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--silver)', opacity: 0.6 }}>
                    {ptsPerGame.toFixed(2)} pts/gm
                  </div>
                  {momPts > 0 && (
                    <div className="text-xs font-semibold" style={{ color: '#10b981' }}>
                      {momPts > 0 ? `${p.momentum_goals}G ${p.momentum_assists}A last 5` : ''}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
