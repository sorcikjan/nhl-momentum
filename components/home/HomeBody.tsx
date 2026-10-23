import type { HomeData } from '@/lib/home';
import { ArticleGrid } from './ArticleGrid';
import { HeatHero } from './HeatHero';
import { MoreRankings } from './MoreRankings';
import { ResultsSection } from './ResultsSection';
import { TeamHeatGrid } from './TeamHeatGrid';
import { TonightSlate } from './TonightSlate';

// Homepage (agreed 2026-10-22): finished games first — the reason to come
// back — then Heat, the USP; tonight's games; goalies and rookies; stories;
// teams last. Every heading is a SectionHeading, every player list a PlayerRow.
export const HOME_SECTIONS = ['results', 'heat', 'tonight', 'rankings', 'stories', 'teams'] as const;

export function HomeBody({ data }: { data: HomeData }) {
  return (
    <div className="flex flex-col gap-12 lg:gap-16">
      <ResultsSection date={data.resultsDate} results={data.results} />
      <HeatHero leader={data.leader} leaders={data.leaders} heatingUp={data.heatingUp} coolingOff={data.coolingOff} />
      <TonightSlate games={data.tonight} nextGameDate={data.nextGameDate} />
      <MoreRankings goalies={data.goalies} rookies={data.rookies} />
      <ArticleGrid night={data.night} games={data.gameStories} />
      <TeamHeatGrid teams={data.teams} />
    </div>
  );
}
