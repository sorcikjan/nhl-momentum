import { fetchRankings } from '@/lib/data';
import { ppmToHeat } from '@/lib/heat';
import { fallbackImage, heatColor, listImage, OG_SIZE } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Heat Index: the hottest NHL players right now';
export const revalidate = 1800;

// "Heat Index" — the top five by Heat, ready to post.
export default async function Image() {
  const r = await fetchRankings().catch(() => null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const top = ((r?.momentumLeaders?.skaters ?? []) as any[]).slice(0, 5);
  if (!top.length) return fallbackImage('HEAT INDEX', 'Who’s burning right now.');
  return listImage('HEAT INDEX · LAST 5 GAMES', 'Hottest in the NHL right now.', top.map(s => {
    const heat = ppmToHeat(s.momentum_ppm);
    return {
      photo: s.players?.headshot_url ?? null, team: s.players?.teams?.abbrev ?? '',
      label: `${s.players?.first_name ?? ''} ${s.players?.last_name ?? ''}`.trim(), sub: s.players?.teams?.abbrev ?? '',
      value: String(heat), valueColor: heatColor(heat),
    };
  }));
}
