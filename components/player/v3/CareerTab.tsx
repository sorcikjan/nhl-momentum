// Career: season by season against the league, the path he took, his country.
import { Card } from './Card';
import { SeasonColumns } from './SeasonColumns';
import { Timeline } from './Timeline';
import type { ProfileV3View } from './types';

export function CareerTab({ v }: { v: ProfileV3View }) {
  const c = v.career;
  return (
    <div className="pb-4 lg:grid lg:grid-cols-2 lg:gap-x-2.5">
      <Card title="Season by season" right={v.goalie ? 'save % · games' : 'points a game · vs NHL players at his position'}>
        <SeasonColumns columns={c.columns} goalie={v.goalie} />
      </Card>
      <div>
        <Card title="How he got here" right="source NHL.com"><Timeline steps={c.timeline} /></Card>
        <Card title="For his country" right={c.country ? `${c.country.flag} ${c.country.name}` : undefined}>
          {c.events.length ? (
            <div className="flex flex-wrap gap-1.5">
              {c.events.map(e => <span key={e.name} className="rounded-lg px-2 py-1.5 text-[11px]" style={{ background: 'var(--border-soft)', color: 'var(--text-bright)' }}><b className="font-extrabold">{e.name}</b> {e.years.join(' · ')}</span>)}
            </div>
          ) : <span className="inline-block rounded-lg border border-dashed px-2 py-1.5 text-[11px]" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>No national team games yet</span>}
        </Card>
      </div>
    </div>
  );
}
