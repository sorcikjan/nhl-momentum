import { fetchRankings } from '@/lib/data';
import { ppmToHeat } from '@/lib/heat';
import { brandImage, OG_SIZE } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = "momentum. — who's hot in the NHL right now";
export const revalidate = 1800;

// Default share image for the homepage and every page without its own.
// Never waits long on the database: brand-only after 8s.
export default async function Image() {
  const r = await Promise.race([
    fetchRankings().catch(() => null),
    new Promise<null>(resolve => setTimeout(() => resolve(null), 8_000)),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const top = ((r?.momentumLeaders?.skaters ?? []) as any[]).slice(0, 3).map(s => ({
    name: `${s.players?.first_name ?? ''} ${s.players?.last_name ?? ''}`.trim(),
    team: s.players?.teams?.abbrev ?? '',
    photo: s.players?.headshot_url ?? null,
    heat: ppmToHeat(s.momentum_ppm),
  }));
  return brandImage(top);
}
