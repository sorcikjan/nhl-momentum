import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { teamLogoUrl } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function TeamsPage() {
  const { data: teams } = await supabaseAdmin
    .from('teams')
    .select('id, name, abbrev, conference, division')
    .order('name');

  // Group by conference → division
  const grouped: Record<string, Record<string, typeof teams>> = {};
  for (const t of teams ?? []) {
    const conf = t.conference || 'Unknown';
    const div  = t.division  || 'Unknown';
    if (!grouped[conf]) grouped[conf] = {};
    if (!grouped[conf][div]) grouped[conf][div] = [];
    grouped[conf][div]!.push(t);
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>Teams</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>All 32 NHL teams · click for full profile</p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        // Flat grid if conference/division data not populated
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(teams ?? []).map(t => (
            <TeamTile key={t.id} team={t} />
          ))}
        </div>
      ) : (
        Object.entries(grouped).sort().map(([conf, divisions]) => (
          <div key={conf} className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--neon)' }}>
              {conf} Conference
            </h2>
            {Object.entries(divisions).sort().map(([div, divTeams]) => (
              <div key={div} className="mb-4">
                <h3 className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text)' }}>{div} Division</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(divTeams ?? []).map(t => <TeamTile key={t.id} team={t} />)}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

function TeamTile({ team }: { team: { id: number; name: string; abbrev: string } }) {
  return (
    <Link href={`/teams/${team.id}`}
      className="rounded-xl border p-4 flex flex-col items-center gap-2 transition-all hover:border-opacity-60"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <img src={teamLogoUrl(team.abbrev)} alt={team.abbrev} className="w-12 h-12 object-contain" />
      <span className="text-xs font-bold font-mono" style={{ color: 'var(--text-bright)' }}>{team.abbrev}</span>
      <span className="text-xs text-center leading-tight" style={{ color: 'var(--text)' }}>{team.name}</span>
    </Link>
  );
}
