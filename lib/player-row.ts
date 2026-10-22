// One row shape for every player list on the homepage — Heat leaders, heating
// up, cooling off, goalies, rookies — so they all read the same way:
// mark · photo · name / team · pos · last-5 line · chip · number.
import { ppmToHeat } from '@/lib/heat';
import { playerUrl } from '@/lib/urls';

export type RowTone = 'rise' | 'cold' | 'muted';
export type PlayerRowData = {
  playerId: number; href: string; name: string; photo: string | null; team: string;
  mark: string; markTone: RowTone | null;
  pos: string;
  l5: string;
  chip: { text: string; tone: RowTone } | null;
  value: string;
  // Heat colours the number; null = not a Heat number (goalie SV%).
  valueHeat: number | null;
};

const POS: Record<string, string> = { C: 'C', L: 'LW', R: 'RW', D: 'D', G: 'G' };
export const posLabel = (code: string | null | undefined) => POS[code ?? ''] ?? code ?? '';

export function pacePct(momentumPpm: number | null | undefined, seasonPpm: number | null | undefined): number | null {
  const sea = Number(seasonPpm ?? 0);
  return sea > 0 ? Math.round(((Number(momentumPpm ?? 0) - sea) / sea) * 100) : null;
}

export const l5Line = (goals: number, assists: number) => `L5 ${goals}G ${assists}A`;

// W–L–OTL from last-5 decisions ('W', 'L', 'O').
export function record(decisions: string[]): string {
  const n = (d: string) => decisions.filter(x => x === d).length;
  return `${n('W')}–${n('L')}–${n('O')}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// A player_metric_snapshots row with players(...) joined (fetchRankings).
export function skaterRow(s: any, mark: string, kind: 'rank' | 'up' | 'cool'): PlayerRowData {
  const p = s.players ?? {};
  const heat = ppmToHeat(s.momentum_ppm);
  const pace = pacePct(s.momentum_ppm, s.season_ppm);
  const line = l5Line(s.momentum_goals ?? 0, s.momentum_assists ?? 0);
  return {
    playerId: s.player_id,
    href: playerUrl(s.player_id, p.first_name ?? '', p.last_name ?? ''),
    name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
    photo: p.headshot_url ?? null,
    team: p.teams?.abbrev ?? '',
    mark, markTone: kind === 'up' ? 'rise' : kind === 'cool' ? 'cold' : null,
    pos: posLabel(p.position_code),
    // Cooling off: where they fell from.
    l5: kind === 'cool' ? `${line} · season ${ppmToHeat(s.season_ppm)}` : line,
    chip: pace == null ? null : { text: `${pace > 0 ? '+' : pace < 0 ? '−' : ''}${Math.abs(pace)}%`, tone: kind === 'cool' ? 'cold' : pace > 0 ? 'rise' : 'muted' },
    value: String(heat),
    valueHeat: heat,
  };
}

// fetchGoalieRankings() row: ranked by save % over the last five starts.
export function goalieRow(g: any, rank: number): PlayerRowData {
  return {
    playerId: g.id,
    href: playerUrl(g.id, g.first_name ?? '', g.last_name ?? ''),
    name: `${g.first_name ?? ''} ${g.last_name ?? ''}`.trim(),
    photo: g.headshot_url ?? null,
    team: g.teams?.abbrev ?? '',
    mark: String(rank), markTone: null,
    pos: 'G',
    l5: `L${g.gamesPlayed ?? 5} ${record(g.decisions ?? [])}`,
    chip: g.avgGAA != null ? { text: `${Number(g.avgGAA).toFixed(2)} GAA`, tone: 'muted' } : null,
    value: Number(g.avgSavePct ?? 0).toFixed(3).replace(/^0/, ''),
    valueHeat: null,
  };
}

// fetchNewcomerWatch() row: ranked by Heat.
export function rookieRow(r: any, rank: number): PlayerRowData {
  const p = r.players ?? {};
  const heat = ppmToHeat(r.momentum_ppm);
  return {
    playerId: r.player_id,
    href: playerUrl(r.player_id, p.first_name ?? '', p.last_name ?? ''),
    name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
    photo: p.headshot_url ?? null,
    team: p.teams?.abbrev ?? '',
    mark: String(rank), markTone: null,
    pos: posLabel(p.position_code),
    l5: l5Line(r.momentum_goals ?? 0, r.momentum_assists ?? 0),
    chip: null,
    value: String(heat),
    valueHeat: heat,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
