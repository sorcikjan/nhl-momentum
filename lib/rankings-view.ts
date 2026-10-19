// Rankings table rows (docs/design/redesign-2026 DesktopRankings / MobileRankings).
import { ppmToHeat } from '@/lib/heat';
import { playerUrl } from '@/lib/urls';

export type Pos = 'ALL' | 'C' | 'L' | 'R' | 'D' | 'G';
export type Sort = 'heat' | 'points' | 'goals' | 'assists';
export type RankRow = {
  rank: number; playerId: number; href: string; name: string; team: string; pos: string;
  g: number; a: number; pts: number; heat: number; spark: number[]; delta: string | null;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function rankingRows(skaters: any[], f: { pos: Pos; sort: Sort }, sparks: { player_id: number; calculated_at: string; momentum_ppm: number }[]): RankRow[] {
  const byPlayer = new Map<number, { t: string; v: number }[]>();
  for (const s of sparks) {
    const a = byPlayer.get(s.player_id) ?? [];
    a.push({ t: s.calculated_at, v: ppmToHeat(s.momentum_ppm) });
    byPlayer.set(s.player_id, a);
  }
  const key: Record<Sort, (r: RankRow) => number> = { heat: r => r.heat, points: r => r.pts, goals: r => r.g, assists: r => r.a };
  return skaters
    .filter(s => f.pos === 'ALL' || s.players?.position_code === f.pos)
    .map(s => {
      const sea = Number(s.season_ppm ?? 0), mom = Number(s.momentum_ppm ?? 0);
      const g = Number(s.season_goals ?? 0), a = Number(s.season_assists ?? 0);
      const d = sea > 0 ? Math.round(((mom - sea) / sea) * 100) : null;
      return {
        rank: 0,
        playerId: s.player_id,
        href: playerUrl(s.player_id, s.players?.first_name ?? '', s.players?.last_name ?? ''),
        name: `${s.players?.first_name ?? ''} ${s.players?.last_name ?? ''}`.trim(),
        team: s.players?.teams?.abbrev ?? '',
        pos: s.players?.position_code ?? '',
        g, a, pts: Number(s.season_points ?? g + a),
        heat: ppmToHeat(mom),
        spark: (byPlayer.get(s.player_id) ?? []).sort((x, y) => x.t.localeCompare(y.t)).map(x => x.v),
        delta: d == null ? null : `${d > 0 ? '+' : ''}${d}%`,
      };
    })
    .sort((x, y) => key[f.sort](y) - key[f.sort](x) || y.heat - x.heat)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// Client-side view of the static rankings: filter + re-sort the server-built rows.
export function viewRows(rows: RankRow[], f: { pos: Pos; sort: Sort }): RankRow[] {
  const key: Record<Sort, (r: RankRow) => number> = { heat: r => r.heat, points: r => r.pts, goals: r => r.g, assists: r => r.a };
  return rows
    .filter(r => f.pos === 'ALL' || r.pos === f.pos)
    .sort((x, y) => key[f.sort](y) - key[f.sort](x) || y.heat - x.heat)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
