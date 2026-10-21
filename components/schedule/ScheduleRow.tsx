import Link from 'next/link';
import { KeyLine, TeamChip } from '@/components/ds';
import { gameView } from '@/lib/game-state';

const MONO = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' } as const;

export type ScheduleRowData = {
  href: string; state: string; startTimeUTC: string | null;
  away: string; home: string; awayScore: number | null; homeScore: number | null;
  pick: { abbrev: string; pct: number } | null;
  pickResult: 'hit' | 'miss' | null;
  keyAway: { name: string; photo: string | null; team: string }[];
  keyHome: { name: string; photo: string | null; team: string }[];
  watchability: number | null;
  recapHref: string | null;
  marquee: boolean;
};

const timeET = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET' : 'TBD';

function Label({ children, color = 'var(--text-muted)' }: { children: React.ReactNode; color?: string }) {
  return <div className="mb-1 text-[9px] font-bold" style={{ ...MONO, color, letterSpacing: 1 }}>{children}</div>;
}

// One game on the schedule (design DesktopScheduleEnhanced row; stacks on mobile).
export function ScheduleRow({ g }: { g: ScheduleRowData }) {
  const view = gameView(g.state);
  const scored = view !== 'upcoming' && g.awayScore != null && g.homeScore != null;
  const score = (n: number | null, win: boolean) => (
    <span className="w-6 text-center text-lg font-extrabold" style={{ ...MONO, color: win ? 'var(--text-bright)' : 'var(--text-muted)' }}>{n}</span>
  );
  return (
    <Link
      href={g.href}
      className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-3.5 gap-y-3 px-4 py-4 transition-colors hover:bg-[var(--bg-hover)] lg:grid-cols-[90px_minmax(0,1fr)_130px_280px_130px_24px] lg:px-[22px]"
      style={{ background: g.marquee ? 'linear-gradient(90deg, var(--heat-dim) 0%, transparent 60%)' : undefined }}
    >
      <div>
        {view === 'final' ? (
          <>
            <div className="text-[10px] font-bold" style={{ ...MONO, color: 'var(--text)' }}>FINAL</div>
            {g.pickResult && (
              <span className="text-[9px] font-bold" style={{ ...MONO, color: g.pickResult === 'hit' ? 'var(--rise)' : 'var(--cold)', letterSpacing: 0.8 }}>
                {g.pickResult === 'hit' ? '✓ HIT' : '✗ MISS'}
              </span>
            )}
          </>
        ) : view === 'live' ? (
          <div className="text-[11px] font-bold" style={{ ...MONO, color: 'var(--heat)' }}>● LIVE</div>
        ) : (
          <div className="text-[13px] font-bold" style={{ ...MONO, color: 'var(--text-bright)' }}>{timeET(g.startTimeUTC)}</div>
        )}
      </div>

      <div className="flex min-w-0 items-center gap-3">
        {g.marquee && <span className="rounded-[3px] border px-1.5 py-0.5 text-[9px] font-bold" style={{ ...MONO, color: 'var(--heat)', background: 'var(--bg)', borderColor: 'rgba(255, 90, 36, 0.4)' }}>★</span>}
        <TeamChip abbrev={g.away} size={36} ringed={g.pick?.abbrev === g.away} />
        {scored && score(g.awayScore, g.awayScore! > g.homeScore!)}
        <span className="text-[11px]" style={{ ...MONO, color: 'var(--text-muted)' }}>{scored ? '–' : 'at'}</span>
        {scored && score(g.homeScore, g.homeScore! > g.awayScore!)}
        <TeamChip abbrev={g.home} size={36} ringed={g.pick?.abbrev === g.home} />
      </div>

      <div className="col-start-2 lg:col-start-auto">
        {g.pick ? (
          <>
            <Label color="var(--heat)">OUR PICK</Label>
            <div className="flex items-center gap-1.5">
              <TeamChip abbrev={g.pick.abbrev} size={18} />
              <span className="text-xs font-bold" style={{ ...MONO, color: 'var(--text-bright)' }}>{g.pick.pct}%</span>
            </div>
          </>
        ) : (
          <span className="text-[10px]" style={{ ...MONO, color: 'var(--text-muted)' }}>Pick pending</span>
        )}
      </div>

      <div className="col-start-2 flex min-w-0 flex-col gap-1.5 lg:col-start-auto">
        <KeyLine team={g.away} players={g.keyAway} />
        <KeyLine team={g.home} players={g.keyHome} />
      </div>

      <div className="col-start-2 lg:col-start-auto">
        {g.watchability != null ? (
          <>
            <Label color="var(--gold)">WATCHABILITY</Label>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-extrabold" style={{ ...MONO, color: 'var(--gold)' }}>{g.watchability}</span>
              <span className="text-[10px]" style={{ ...MONO, color: 'var(--text-muted)' }}>/100</span>
            </div>
          </>
        ) : g.recapHref ? (
          <>
            <Label>RECAP</Label>
            <span className="text-[11px] font-bold" style={{ ...MONO, color: 'var(--heat)' }}>READ →</span>
          </>
        ) : null}
      </div>

      <span className="hidden text-lg lg:block" style={{ color: 'var(--text-muted)' }}>›</span>
    </Link>
  );
}
