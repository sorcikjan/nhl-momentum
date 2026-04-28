// Daily brand identity strip — sits at the top of the homepage.
// Establishes Hockey Momentum as a daily destination, not just a tool.

interface Props {
  topPlayer?: { name: string; team: string; ppm: number } | null;
  gameCount?: number;
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

export default function DailyBrandStrip({ topPlayer, gameCount }: Props) {
  return (
    <div className="flex flex-col gap-3">

      {/* ── Masthead ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-[0.2em] uppercase"
              style={{ color: 'var(--neon)' }}>
              Hockey Momentum
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded font-bold tracking-wide"
              style={{ background: 'rgba(249,115,22,0.15)', color: 'var(--heat)' }}>
              DAILY
            </span>
          </div>
          <div className="mt-0.5 text-lg font-black tracking-tight leading-tight"
            style={{ color: 'var(--text-bright)' }}>
            Hockey Intelligence, Daily.
          </div>
          <div className="mt-1 text-xs font-medium" style={{ color: 'var(--neon)' }}>
            Powered by AI.
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-xs font-mono" style={{ color: 'var(--text)' }}>
            {formatTodayDate()}
          </div>
          <div className="flex items-center gap-1 justify-end mt-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: 'var(--green)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--green)' }}>Live</span>
          </div>
        </div>
      </div>

      {/* ── Story hooks bar ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>

        {topPlayer && (
          <a href="/rankings"
            className="flex-shrink-0 flex items-center gap-2 rounded-lg px-3 py-2 border transition-opacity hover:opacity-80"
            style={{ background: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.25)' }}>
            <span className="text-sm">🔥</span>
            <div>
              <div className="text-xs font-bold whitespace-nowrap" style={{ color: 'var(--heat)' }}>
                ON FIRE
              </div>
              <div className="text-xs whitespace-nowrap" style={{ color: 'var(--text-bright)' }}>
                {topPlayer.name} · {topPlayer.team}
              </div>
            </div>
          </a>
        )}

        {gameCount !== undefined && gameCount > 0 && (
          <a href="/games"
            className="flex-shrink-0 flex items-center gap-2 rounded-lg px-3 py-2 border transition-opacity hover:opacity-80"
            style={{ background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.25)' }}>
            <span className="text-sm">🏒</span>
            <div>
              <div className="text-xs font-bold whitespace-nowrap" style={{ color: 'var(--neon)' }}>
                TONIGHT
              </div>
              <div className="text-xs whitespace-nowrap" style={{ color: 'var(--text-bright)' }}>
                {gameCount} {gameCount === 1 ? 'game' : 'games'} · see predictions
              </div>
            </div>
          </a>
        )}

        <a href="/rankings"
          className="flex-shrink-0 flex items-center gap-2 rounded-lg px-3 py-2 border transition-opacity hover:opacity-80"
          style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
          <span className="text-sm">📉</span>
          <div>
            <div className="text-xs font-bold whitespace-nowrap" style={{ color: 'var(--red)' }}>
              WHO'S FADING
            </div>
            <div className="text-xs whitespace-nowrap" style={{ color: 'var(--text-bright)' }}>
              Slump tracker
            </div>
          </div>
        </a>

        <a href="/recaps"
          className="flex-shrink-0 flex items-center gap-2 rounded-lg px-3 py-2 border transition-opacity hover:opacity-80"
          style={{ background: 'rgba(148,163,184,0.06)', borderColor: 'var(--border)' }}>
          <span className="text-sm">📰</span>
          <div>
            <div className="text-xs font-bold whitespace-nowrap" style={{ color: 'var(--silver)' }}>
              STORIES
            </div>
            <div className="text-xs whitespace-nowrap" style={{ color: 'var(--text-bright)' }}>
              Last night →
            </div>
          </div>
        </a>

      </div>

      {/* ── Divider ────────────────────────────────────────────────────────────── */}
      <div className="h-px" style={{ background: 'var(--border)' }} />

    </div>
  );
}
