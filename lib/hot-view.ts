// Heat page view (docs/design/redesign-2026 DesktopHotPlayers / MobileHotPlayers).
import { ppmToHeat } from '@/lib/heat';
import { playerUrl } from '@/lib/urls';

export type HotPlayer = {
  playerId: number; href: string; first: string; last: string; team: string; pos: string;
  heat: number; prev: number; sub: string; story: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const pace = (s: any) => {
  const sea = Number(s.season_ppm ?? 0);
  return sea > 0 ? Math.round(((Number(s.momentum_ppm ?? 0) - sea) / sea) * 100) : null;
};

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

function toHot(s: any): HotPlayer {
  const p = pace(s);
  const g = s.momentum_goals ?? 0, a = s.momentum_assists ?? 0, n = s.momentum_games ?? 0;
  return {
    playerId: s.player_id,
    href: playerUrl(s.player_id, s.players?.first_name ?? '', s.players?.last_name ?? ''),
    first: s.players?.first_name ?? '',
    last: s.players?.last_name ?? '',
    team: s.players?.teams?.abbrev ?? '',
    pos: s.players?.position_code ?? '',
    heat: ppmToHeat(s.momentum_ppm),
    prev: ppmToHeat(s.season_ppm),
    sub: p == null ? `${g + a} pts last ${n}` : `${p > 0 ? '+' : ''}${p}% vs season pace`,
    story: `${plural(g, 'goal')} and ${plural(a, 'assist')} in his last ${n === 1 ? 'game' : `${n} games`}${p != null && p > 0 ? ` — ${p}% above his season pace` : ''}.`,
  };
}

export function hotView(r: { momentumLeaders?: { skaters?: any[] }; breakoutWatch?: any[]; coolingWatch?: any[] } | null) {
  const leaders = (r?.momentumLeaders?.skaters ?? []).map(toHot);
  return {
    top: leaders[0] ?? null,
    rest: leaders.slice(1, 9),
    breakouts: (r?.breakoutWatch ?? []).filter(s => (pace(s) ?? 0) > 0).slice(0, 4).map(toHot),
    cooling: (r?.coolingWatch ?? []).slice(0, 3).map(toHot),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
export type HotView = ReturnType<typeof hotView>;
