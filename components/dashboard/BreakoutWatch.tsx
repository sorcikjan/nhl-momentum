interface Player {
  player_id: number;
  breakout_delta: number;
  momentum_ppm: number;
  season_ppm: number;
  players: {
    first_name: string;
    last_name: string;
    headshot_url: string | null;
    position_code: string;
    teams: { abbrev: string };
  };
}

export default function BreakoutWatch({ players }: { players: Player[] }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--amber)' }}>
          🔥 Breakout Watch
        </h2>
        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--amber)' }}>
          Momentum vs Season
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {players.map((p) => {
          const name = `${p.players.first_name} ${p.players.last_name}`;
          const delta = p.breakout_delta ?? 0;
          const pct = Math.min(100, Math.abs(delta) * 500);
          return (
            <div key={p.player_id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                {p.players.headshot_url
                  ? <img src={p.players.headshot_url} alt={name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--text)' }}>
                      {p.players.first_name[0]}
                    </div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text-bright)' }}>{name}</span>
                  <span className="text-xs font-mono ml-2" style={{ color: 'var(--green)' }}>
                    +{delta.toFixed(4)}
                  </span>
                </div>
                <div className="w-full h-1 rounded-full" style={{ background: 'var(--border)' }}>
                  <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--amber)' }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs" style={{ color: 'var(--text)' }}>
                    {p.players.teams.abbrev} · {p.players.position_code}
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text)' }}>
                    {p.momentum_ppm?.toFixed(4)} PPM
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
