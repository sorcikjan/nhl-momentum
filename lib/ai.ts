// AI-generated insights using Claude.
// Results are cached via Next.js unstable_cache:
//   - Player summaries: per player_id, 6-hour TTL
//   - Nightly stories: per date, 24-hour TTL

import Anthropic from '@anthropic-ai/sdk';
import { unstable_cache } from 'next/cache';

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

async function ask(prompt: string): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });
    return (msg.content[0] as { type: string; text: string }).text ?? null;
  } catch {
    return null;
  }
}

// ─── Player summary ───────────────────────────────────────────────────────────

export interface PlayerAIInput {
  name: string;
  team: string;
  position: string;
  rank: number | null;
  seaGames: number;
  seaGoals: number;
  seaAssists: number;
  seaPoints: number;
  seaPpm: number;
  seaShootPct: number;  // 0-1 fraction
  seaToiMin: number;
  momGames: number;
  momGoals: number;
  momAssists: number;
  momPpm: number;
  momShootPct: number;  // 0-1 fraction
  momToiMin: number;
  energyBar: number;
  breakoutDelta: number;
  careerGames: number;
  careerGoals: number;
  careerAssists: number;
  // last 5 game log rows
  recentGames: Array<{
    date: string;
    opponent: string;
    goals: number;
    assists: number;
    plusMinus: number;
    toiMin: number;
  }>;
}

async function _generatePlayerSummary(input: PlayerAIInput): Promise<string | null> {
  const ppmDeltaPct = input.seaPpm > 0
    ? ((input.momPpm - input.seaPpm) / input.seaPpm * 100).toFixed(0)
    : '—';
  const sign = (n: number) => n >= 0 ? `+${n}` : String(n);

  const gameLogLines = input.recentGames.slice(0, 5).map(g =>
    `  ${g.date}: vs ${g.opponent} — ${g.goals}G ${g.assists}A (${sign(g.plusMinus)}), ${g.toiMin.toFixed(1)} min`
  ).join('\n');

  const prompt = `You are an NHL data analyst writing concise player profile summaries for a hockey analytics platform.

Player: ${input.name} (${input.team}, ${input.position})${input.rank ? ` · Global rank #${input.rank}` : ''}

Season (${input.seaGames} games): ${input.seaGoals}G ${input.seaAssists}A ${input.seaPoints}pts | PPM ${input.seaPpm.toFixed(4)} | Shot% ${(input.seaShootPct * 100).toFixed(1)}% | ${input.seaToiMin.toFixed(1)} min/game

Momentum — last ${input.momGames} games: ${input.momGoals}G ${input.momAssists}A | PPM ${input.momPpm.toFixed(4)} (${ppmDeltaPct}% vs season) | Shot% ${(input.momShootPct * 100).toFixed(1)}% | ${input.momToiMin.toFixed(1)} min/game

Energy bar: ${input.energyBar}/100
Breakout delta: ${sign(Number(input.breakoutDelta.toFixed(4)))} PPM (momentum surplus over season baseline)

Recent game log:
${gameLogLines || '  No recent games'}

Career: ${input.careerGames} games, ${input.careerGoals}G ${input.careerAssists}A

Write 2–3 sentences analyzing this player's current form and defining characteristics. Be specific with the numbers. Highlight what's genuinely interesting — momentum surge, consistency gap, usage trend, efficiency spike, etc. Avoid generic phrases. Third person. No headers or lists.`;

  return ask(prompt);
}

export const generatePlayerSummary = unstable_cache(
  _generatePlayerSummary,
  ['player-ai-summary'],
  { revalidate: 60 * 60 * 6 }, // 6 hours
);

// ─── Nightly stories ──────────────────────────────────────────────────────────

export interface NightlyGameResult {
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
}

export interface NightlyPerformer {
  name: string;
  team: string;
  position: string;
  goals: number;
  assists: number;
  plusMinus: number;
  toiMin: number;
}

export interface NightlyStoriesInput {
  date: string;       // YYYY-MM-DD
  games: NightlyGameResult[];
  topPerformers: NightlyPerformer[];
}

async function _generateNightlyStories(input: NightlyStoriesInput): Promise<string | null> {
  if (!input.games.length) return null;

  const gameLines = input.games
    .map(g => `  ${g.awayTeam} ${g.awayScore} @ ${g.homeTeam} ${g.homeScore}`)
    .join('\n');

  const sign = (n: number) => n >= 0 ? `+${n}` : String(n);
  const performerLines = input.topPerformers.slice(0, 8).map(p =>
    `  ${p.name} (${p.team}, ${p.position}): ${p.goals}G ${p.assists}A ${sign(p.plusMinus)}, ${p.toiMin.toFixed(1)} min`
  ).join('\n');

  const prompt = `You are an NHL analyst writing a sharp "last night in the NHL" brief for a data-driven hockey analytics platform. Readers are analytical fans who value insight over hype.

Date: ${input.date}

Final scores:
${gameLines}

Top performers:
${performerLines}

Write 3–5 sentences covering the most compelling stories from last night. Lead with the most dramatic or surprising result. Highlight standout individual performances with specific numbers. Note any interesting patterns (blowouts, tight games, scoring explosions). Do not use clichés like "lit the lamp" or "finding the back of the net". Be precise and analytical.`;

  return ask(prompt);
}

export const generateNightlyStories = unstable_cache(
  _generateNightlyStories,
  ['nightly-stories'],
  { revalidate: 60 * 60 * 24 }, // 24 hours
);
