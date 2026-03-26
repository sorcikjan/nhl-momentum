import type { Metadata } from 'next';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { teamLogoUrl } from '@/lib/data';
import { teamUrl } from '@/lib/urls';
import { getStandings } from '@/lib/nhl-api';

export const metadata: Metadata = {
  title: 'Teams',
  description: 'All 32 NHL teams — click any team for roster energy, top skaters by momentum, and upcoming schedule.',
  openGraph: {
    title: 'Teams — NHL Momentum',
    description: 'All 32 NHL teams — click any team for roster energy, top skaters by momentum, and upcoming schedule.',
  },
};

export const revalidate = 120;

// Current 32-team NHL structure (2025-26)
const NHL_STRUCTURE = {
  Eastern: {
    Atlantic:      ['BOS', 'BUF', 'DET', 'FLA', 'MTL', 'OTT', 'TBL', 'TOR'],
    Metropolitan:  ['CAR', 'CBJ', 'NJD', 'NYI', 'NYR', 'PHI', 'PIT', 'WSH'],
  },
  Western: {
    Central:       ['CHI', 'COL', 'DAL', 'MIN', 'NSH', 'STL', 'UTA', 'WPG'],
    Pacific:       ['ANA', 'CGY', 'EDM', 'LAK', 'SEA', 'SJS', 'VAN', 'VGK'],
  },
};

const ACTIVE_ABBREVS = new Set(Object.values(NHL_STRUCTURE).flatMap(c => Object.values(c).flat()));

export default async function TeamsPage() {
  const { data: teams } = await supabaseAdmin
    .from('teams')
    .select('id, name, abbrev')
    .order('name');

  // Only keep current 32 franchises
  const activeTeams = (teams ?? []).filter(t => ACTIVE_ABBREVS.has(t.abbrev));
  const byAbbrev = new Map(activeTeams.map(t => [t.abbrev, t]));

  // Fetch standings for W/L/Pts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let standingMap = new Map<string, any>();
  try {
    const today = new Date().toISOString().slice(0, 10);
    const data = await getStandings(today);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const s of (data.standings as any[]) ?? []) {
      const abbrev = s.teamAbbrev?.default;
      if (abbrev) standingMap.set(abbrev, s);
    }
  } catch { /* standings optional */ }

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>Teams</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>All 32 NHL teams · click for full roster & momentum profile</p>
      </div>

      {Object.entries(NHL_STRUCTURE).map(([conf, divisions]) => (
        <div key={conf} className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--neon)' }}>
            {conf} Conference
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(divisions).map(([div, abbrevs]) => (
              <div key={div}>
                <h3 className="text-xs uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text)' }}>
                  {div} Division
                </h3>
                <div className="flex flex-col gap-1">
                  {abbrevs.map(abbrev => {
                    const team = byAbbrev.get(abbrev);
                    const s = standingMap.get(abbrev);
                    if (!team) return null;
                    return (
                      <TeamRow
                        key={team.id}
                        team={team}
                        wins={s?.wins ?? null}
                        losses={s?.losses ?? null}
                        otLosses={s?.otLosses ?? null}
                        points={s?.points ?? null}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamRow({ team, wins, losses, otLosses, points }: {
  team: { id: number; name: string; abbrev: string };
  wins: number | null;
  losses: number | null;
  otLosses: number | null;
  points: number | null;
}) {
  const hasRecord = wins !== null && losses !== null;
  return (
    <Link href={teamUrl(team.id, team.name)}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:opacity-80"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <img src={teamLogoUrl(team.abbrev)} alt={team.abbrev} className="w-8 h-8 object-contain flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>{team.name}</div>
        <div className="text-xs font-mono" style={{ color: 'var(--text)' }}>{team.abbrev}</div>
      </div>
      {hasRecord && (
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-mono font-semibold" style={{ color: 'var(--text-bright)' }}>
            {wins}–{losses}{otLosses != null ? `–${otLosses}` : ''}
          </div>
          {points !== null && (
            <div className="text-xs font-mono" style={{ color: 'var(--neon)' }}>{points} pts</div>
          )}
        </div>
      )}
    </Link>
  );
}
