import Link from 'next/link';
import { SectionHeading, TeamChip } from '@/components/ds';
import { NEUTRAL_TINT, teamColor } from '@/lib/team-colors';
import type { StoryCard } from '@/lib/home';
import { MONO } from './format';

const tint = (team: string | null, alpha: string) =>
  `linear-gradient(155deg, ${team ? teamColor(team).bg : NEUTRAL_TINT}${alpha} 0%, var(--bg) 100%)`;

// Last night's recap as a lead story + its game stories (design ArticleGrid).
export function ArticleGrid({ stories, heroImageUrl }: { stories: StoryCard[]; heroImageUrl?: string | null }) {
  if (!stories.length) return null;
  const [lead, ...others] = stories;
  return (
    <section data-section="stories">
      <SectionHeading kicker="STORIES · LAST NIGHT" title="The night in stories." size="feature" />
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[1.4fr_1fr] lg:gap-4">
        <Link href={lead.href} className="flex flex-col overflow-hidden rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="relative aspect-video overflow-hidden" style={{ background: tint(lead.team, 'cc') }}>
            {heroImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
            )}
            {lead.team && <div className="absolute left-3.5 top-3.5"><TeamChip abbrev={lead.team} size={32} /></div>}
          </div>
          <div className="flex-1 px-4 pb-4 pt-3.5 lg:px-[22px] lg:pb-[22px] lg:pt-5">
            <div className="mb-2.5 text-[9px] font-bold lg:text-[10px]" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.4 }}>{lead.kicker}</div>
            <h3 className="mb-2.5 text-lg font-extrabold leading-tight lg:text-[26px]" style={{ color: 'var(--text-bright)', letterSpacing: -0.8, textWrap: 'pretty' }}>{lead.title}</h3>
            {lead.dek && <p className="text-xs leading-relaxed lg:text-sm" style={{ color: 'var(--text)' }}>{lead.dek}</p>}
            <div className="mt-4 text-xs font-bold" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 0.5 }}>READ MORE →</div>
          </div>
        </Link>
        {others.length > 0 && (
          <div className="flex flex-col gap-2 lg:gap-2.5">
            {others.map(s => (
              <Link key={s.title} href={s.href} className="flex flex-1 gap-3 rounded-[10px] border p-3 lg:p-3.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}>
                <div className="relative aspect-square w-14 shrink-0 self-start rounded-md lg:w-20 lg:rounded-lg" style={{ background: tint(s.team, 'aa') }}>
                  {s.team && <div className="absolute left-1.5 top-1.5"><TeamChip abbrev={s.team} size={18} /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 text-[8px] font-bold lg:text-[9px]" style={{ ...MONO, color: 'var(--heat)', letterSpacing: 1.2 }}>{s.kicker}</div>
                  <div className="mb-1 text-[13px] font-bold leading-tight lg:text-sm" style={{ color: 'var(--text-bright)' }}>{s.title}</div>
                  <div className="line-clamp-2 text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>{s.dek}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
