// Everything the four profile tabs show, prepared by the page. The panels
// only draw it.
import type { Character, Column, Ladder, Nationality, Step, Total } from '@/lib/profile-v3';
import type { MiniHeaderProps } from './MiniHeader';

export type Result = 'W' | 'L' | null;

export type ProfileV3View = {
  goalie: boolean;
  hero: { first: string; last: string; number: number | null; position: string; team: string; teamName: string; photo: string | null };
  mini: MiniHeaderProps;
  bio: { value: string; sub: string }[]; // four tiles
  verdict: string;
  status: { text: string; sub: string; tone: 'amber' | 'red' } | null; // replaces the next game on Now
  next: string | null;
  energy: { value: number; note: string | null } | null;
  // Heat for skaters, save % for goalies: after each game this season.
  metric: {
    label: 'HEAT' | 'SAVE %'; current: number | null; delta: number | null; deltaNote: string | null;
    series: number[]; lo: number; hi: number; avg: number | null; have: number; need: number; firstLabel: string;
  };
  last5: { top: string; opp: string; result: Result }[];
  role: { kind: 'ladder'; ladder: Ladder; teamName: string } | { kind: 'starts'; rows: { name: string; starts: number; me: boolean }[] };
  character: Character;
  axisLabels: string[]; // drawn greyed when there are no axes yet
  emptyNote: { have: number; need: number } | null;
  career: { columns: Column[]; timeline: Step[]; events: { name: string; years: number[] }[]; country: Nationality | null };
  games: {
    totals: Total[]; note: string; columns: string[];
    rows: { date: string; opp: string; result: Result; cells: string[]; strong: boolean[]; heat: number | null }[]; // newest first
  };
};
