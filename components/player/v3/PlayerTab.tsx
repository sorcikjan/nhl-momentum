// Player: his role in the team and what kind of player he is.
import { TEAMS } from '@/lib/team-colors';
import { Card } from './Card';
import { Radar } from './Radar';
import { TeamLadder } from './TeamLadder';
import { GoalieStarts } from './GoalieStarts';
import type { ProfileV3View } from './types';

export function PlayerTab({ v }: { v: ProfileV3View }) {
  return (
    <div className="pb-4 lg:grid lg:grid-cols-2 lg:gap-x-2.5">
      <div>
        <Card title={`His role in ${TEAMS[v.hero.team]?.name ?? v.hero.teamName}`} right={v.role.kind === 'ladder' ? `ice time a game · ${v.role.ladder.bars.length} ${v.role.teamName}` : 'starts this season'}>
          {v.role.kind === 'ladder' ? <TeamLadder {...v.role.ladder} teamName={v.role.teamName} /> : <GoalieStarts rows={v.role.rows} />}
        </Card>
      </div>
      <Card title={v.goalie ? 'What kind of goalie' : 'What kind of player'} right={`percentile · NHL ${v.goalie ? 'goalies' : v.hero.position === 'Defenseman' ? 'defensemen' : 'forwards'}`}>
        <Radar axes={v.character.axes} unused={v.character.unused} emptyNote={v.emptyNote ?? undefined} labels={v.axisLabels} />
      </Card>
    </div>
  );
}
