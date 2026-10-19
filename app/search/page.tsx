import PlayerSearch from '@/components/layout/PlayerSearch';
import { SectionHeading } from '@/components/ds';

export const metadata = { title: 'Search Players' };

export default function SearchPage() {
  return (
    <div className="max-w-[640px] pb-24">
      <SectionHeading as="h1" size="page" kicker="PLAYERS" title="Find a player." sub="Search every active NHL skater and goalie by name." />
      <PlayerSearch autoFocus />
    </div>
  );
}
