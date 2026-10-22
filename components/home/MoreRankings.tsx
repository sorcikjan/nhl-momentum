import { PlayerList, SectionHeading, SectionLink } from '@/components/ds';
import type { PlayerRowData } from '@/lib/player-row';

// Best in net + rookies: top 10 each, the same PlayerRow as the Heat lists.
export function MoreRankings({ goalies, rookies }: { goalies: PlayerRowData[]; rookies: PlayerRowData[] }) {
  if (!goalies.length && !rookies.length) return null;
  return (
    <section data-section="rankings" className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-6">
      <div>
        <SectionHeading kicker="GOALIES · LAST 5 STARTS" title="Best in net." sub="Ranked by save percentage." right={<SectionLink href="/rankings?pos=G">All goalies</SectionLink>} />
        <PlayerList rows={goalies} />
      </div>
      <div>
        <SectionHeading kicker="FRESH FACES · UP TO 50 NHL GAMES" title="Rookies on the rise." sub="Ranked by Heat." right={<SectionLink href="/rankings">All rookies</SectionLink>} />
        <PlayerList rows={rookies} />
      </div>
    </section>
  );
}
