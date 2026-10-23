import { SectionHeading, SectionLink } from '@/components/ds';
import { LeaderBoard } from '@/components/standings/LeaderBoard';
import { StandingsTable, byGroup } from '@/components/standings/StandingsTable';
import type { LeaderBoard as Board, StandingRow } from '@/lib/nhl-stats';

// Official standings with each team's Heat (replaced "Teams running hot").
export function StandingsSection({ rows }: { rows: StandingRow[] }) {
  if (!rows.length) return null;
  return (
    <section data-section="standings" className="flex flex-col gap-3.5">
      <SectionHeading
        kicker="OFFICIAL NHL STANDINGS · SOURCE: NHL.COM"
        title="The standings."
        sub="Every team's record, next to its Heat: the form of its five hottest skaters over the last five games."
        size="feature"
        right={<SectionLink href="/standings">Full standings</SectionLink>}
      />
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {byGroup(rows, 'conference').map(c => <StandingsTable key={c.name} caption={`${c.name} Conference`} rows={c.rows} />)}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Records and points: NHL.com, updated after every game. Heat: momentum., from the last five games.</p>
    </section>
  );
}

// Official stat leaders, each with the player's Heat right now.
export function LeadersSection({ boards }: { boards: Board[] }) {
  if (!boards.length) return null;
  return (
    <section data-section="leaders" className="flex flex-col gap-3.5">
      <SectionHeading
        kicker="OFFICIAL STAT LEADERS · SOURCE: NHL.COM"
        title="League leaders."
        sub="The season totals, and whether each leader is still hot right now."
        size="feature"
        right={<SectionLink href="/stats">All stats</SectionLink>}
      />
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {boards.map(b => <LeaderBoard key={b.key} board={b} showHeat={b.key !== 'savePctg'} />)}
      </div>
    </section>
  );
}
