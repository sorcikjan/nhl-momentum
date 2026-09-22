// Season-start stats strip — sits below the top banner for the 'season-start' phase only.
// Desktop: wide row of stat pairs. Mobile: hidden (the simpler TopBanner shows instead).
import { fetchSeasonPhase } from '@/lib/data';
import { supabaseAdmin } from '@/lib/supabase';

async function fetchTodayGameCount(today: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('games')
    .select('id', { count: 'exact', head: true })
    .eq('game_date', today);
  return count ?? 0;
}

async function fetchCompletedGamesCount(since: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('games')
    .select('id', { count: 'exact', head: true })
    .gte('game_date', since)
    .in('game_state', ['FINAL', 'OFF']);
  return count ?? 0;
}

interface StatPairProps {
  value: string;
  label: string;
}

function StatPair({ value, label }: StatPairProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        style={{
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '1.5rem',
          fontWeight: 800,
          color: 'var(--text-bright)',
          lineHeight: 1,
          letterSpacing: '-0.03em',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.5625rem',
          color: 'var(--text-muted)',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default async function SeasonStatsStrip({ today }: { today: string }) {
  const [phaseData, todayCount, completedCount] = await Promise.all([
    fetchSeasonPhase().catch(() => ({ regularSeasonStartDate: null as string | null, daysUntilStart: null as number | null, isPreseason: false })),
    fetchTodayGameCount(today),
    fetchCompletedGamesCount(
      (() => {
        const d = new Date(today);
        d.setFullYear(d.getFullYear() - 1);
        // Use approximate season start: Aug 1 of current year
        const yr = new Date(today).getFullYear();
        const seasonStart = `${yr}-08-01`;
        return seasonStart;
      })()
    ),
  ]);

  const { regularSeasonStartDate } = phaseData;
  if (!regularSeasonStartDate) return null;

  const TOTAL_REGULAR_SEASON_GAMES = 1312; // 32 teams × 82 games / 2
  const gamesToCome = Math.max(0, TOTAL_REGULAR_SEASON_GAMES - completedCount);

  // Format the opening date label
  const openDate = new Date(`${regularSeasonStartDate}T00:00:00Z`);
  const openLabel = openDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const isToday = regularSeasonStartDate === today;
  const headlineDate = `${isToday ? 'Tonight' : 'Opened'} · ${openLabel}`;

  // Cup final month: June of the year after the season started
  const seasonYear = openDate.getUTCFullYear();
  const cupFinalLabel = `Jun ${seasonYear + 1}`;

  return (
    <div
      className="hidden md:flex items-center justify-between gap-6 px-6 py-4"
      style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left: kicker + headline date */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.5625rem',
            color: 'var(--text-muted)',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          SEASON OPENS
        </span>
        <span
          style={{
            fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--text-bright)',
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
          }}
        >
          {headlineDate}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 40, background: 'var(--border)', flexShrink: 0 }} />

      {/* Stat pairs */}
      <div className="flex items-center gap-8 flex-1">
        <StatPair value={String(todayCount)} label="Games Tonight" />
        <StatPair value="32" label="Teams" />
        <StatPair value={gamesToCome.toLocaleString()} label="Games to Come" />
        <StatPair value={cupFinalLabel} label="Cup Final" />
      </div>

      {/* Right: small info text */}
      <p
        className="text-right shrink-0 ml-4"
        style={{
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.5625rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          maxWidth: '200px',
        }}
      >
        Heat scores go live after game&nbsp;3<br />
        Picks start tonight
      </p>
    </div>
  );
}
