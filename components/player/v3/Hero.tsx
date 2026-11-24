// Who he is: team colors, logo, jersey number, photo, name.
import { TEAMS } from '@/lib/team-colors';
import type { ProfileV3View } from './types';

export function Hero({ hero }: { hero: ProfileV3View['hero'] }) {
  const bg = TEAMS[hero.team]?.bg ?? '#252a38';
  return (
    <div className="relative h-[178px] overflow-hidden lg:h-[200px]" style={{ background: `linear-gradient(135deg, ${bg} 0%, color-mix(in srgb, ${bg} 50%, #000) 50%, #0d0f14 100%)` }}>
      {hero.number != null && <div className="absolute -right-1 -top-[22px] text-[160px] font-black leading-none lg:right-[150px] lg:-top-[34px] lg:text-[220px]" style={{ color: 'rgba(255,255,255,.08)' }}>{hero.number}</div>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {hero.photo && <img src={hero.photo} alt="" className="absolute bottom-0 right-0 h-[168px] lg:right-10 lg:h-[192px]" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {hero.team && <img src={`https://assets.nhle.com/logos/nhl/svg/${hero.team}_dark.svg`} alt="" className="absolute left-3.5 top-3 h-[54px] lg:left-6 lg:top-[18px] lg:h-[60px]" />}
      <div className="absolute bottom-3 left-4 lg:bottom-[18px] lg:left-[26px]">
        <div className="text-[15px] font-semibold lg:text-[17px]" style={{ color: 'rgba(255,255,255,.85)' }}>{hero.first}</div>
        <h1 className="text-[32px] font-black uppercase leading-none tracking-[-.5px] text-white lg:text-[40px]">{hero.last}</h1>
        <div className="mt-1 text-[11px] lg:text-[13px]" style={{ color: 'rgba(255,255,255,.75)' }}>{hero.number != null ? `#${hero.number} · ` : ''}{hero.position} · {hero.teamName}</div>
      </div>
    </div>
  );
}
