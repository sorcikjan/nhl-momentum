import type { HomeData } from '@/lib/home';
import { ArticleGrid } from './ArticleGrid';
import { ExploreStrip } from './ExploreStrip';
import { ResultsSection } from './ResultsSection';
import { TonightSlate } from './TonightSlate';
import { TripleRankings } from './TripleRankings';
import { ValuePropStrip } from './ValuePropStrip';

// Regular-season homepage (design DesktopHomeFinal / MobileHomeFinal, playoffs={false}).
// Same order on both breakpoints — the mobile artboard drops Tonight in regular season;
// we keep it in the desktop position (agreed 2026-10-19).
export const HOME_SECTIONS = ['value-prop', 'tonight', 'results', 'stories', 'rankings', 'explore'] as const;

export function HomeBody({ data, heroImageUrl }: { data: HomeData; heroImageUrl?: string | null }) {
  return (
    <div className="flex flex-col gap-8 lg:gap-12">
      <ValuePropStrip pickAccuracyPct={data.pickAccuracyPct} />
      <TonightSlate games={data.tonight} nextGameDate={data.nextGameDate} />
      <ResultsSection date={data.resultsDate} results={data.results} />
      <ArticleGrid stories={data.stories} heroImageUrl={heroImageUrl} />
      <TripleRankings
        columns={[
          { key: 'heat', tab: 'Heat', kicker: 'HEAT · TOP 5', title: 'Hottest skaters', sub: 'Last 5 games · all positions', color: 'var(--heat)', href: '/hot', rows: data.hottest },
          { key: 'goalies', tab: 'Goalies', kicker: 'GOALIES · TOP 5', title: 'Best in net', sub: 'Save % · recent starts', color: 'var(--cold)', href: '/rankings?pos=G', rows: data.goalies },
          { key: 'rookies', tab: 'Fresh faces', kicker: 'FRESH FACES · TOP 5', title: 'Rookies on the rise', sub: 'Up to 50 NHL games · by recent Heat', color: 'var(--rise)', href: '/hot', rows: data.rookies },
        ]}
      />
      <ExploreStrip rankedCount={data.rankedCount} />
    </div>
  );
}
