// Player: his role in the team and what kind of player he is.
import { TEAMS } from '@/lib/team-colors';
import { Card } from './Card';
import { Radar } from './Radar';
import { RadarReadout } from './RadarReadout';
import { TeamLadder } from './TeamLadder';
import { GoalieStarts } from './GoalieStarts';
import type { ProfileV3View } from './types';

export function PlayerTab({ v }: { v: ProfileV3View }) {
  return (
    <div className="pb-4 lg:pt-1">
      <div>
        <Card kicker="ROLE" title={`His role in ${TEAMS[v.hero.team]?.name ?? v.hero.teamName}`} right={v.role.kind === 'ladder' ? `ice time a game · ${v.role.ladder.bars.length} ${v.role.teamName}` : 'starts this season'}>
          {v.role.kind === 'ladder' ? <TeamLadder {...v.role.ladder} teamName={v.role.teamName} /> : <GoalieStarts rows={v.role.rows} />}
        </Card>
      </div>
      <Card kicker="PROFILE" title={v.goalie ? 'What kind of goalie' : 'What kind of player'} right={`percentile · NHL ${v.goalie ? 'goalies' : v.hero.position === 'Defenseman' ? 'defensemen' : 'forwards'}`}>
        {/* Desktop: the radar with what it says beside it. Phone: the radar alone. */}
        <div className="lg:grid lg:grid-cols-[480px_1fr] lg:items-center lg:gap-12">
          <Radar axes={v.character.axes} unused={v.character.unused} emptyNote={v.emptyNote ?? undefined} labels={v.axisLabels} />
          <div className="hidden lg:block">
            <RadarReadout axes={v.character.axes} of={v.goalie ? 'goalies' : v.hero.position === 'Defenseman' ? 'defensemen' : 'forwards'} />
          </div>
        </div>
      </Card>
    </div>
  );
}
