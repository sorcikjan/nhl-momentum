// AI-generated insights using Gemini.
// Results are cached via Next.js unstable_cache:
//   - Player bio:        per player, 48h TTL (career/identity info changes rarely)
//   - Player perf eval:  per player, 6h TTL (current form changes daily)
//   - Nightly stories:   per date,   24h TTL

import { GoogleGenerativeAI } from '@google/generative-ai';
import { unstable_cache } from 'next/cache';

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

async function ask(prompt: string): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text() ?? null;
  } catch {
    return null;
  }
}

// ─── Shared player input ──────────────────────────────────────────────────────

export interface PlayerAIInput {
  name: string;
  team: string;
  position: string;      // C / LW / RW / D / G
  rank: number | null;   // global momentum rank
  // Bio fields
  birthCity: string | null;
  birthCountry: string | null;
  age: number | null;
  heightInches: number | null;
  weightPounds: number | null;
  shootsCatches: string | null;  // 'L' | 'R'
  draftYear: number | null;
  draftRound: number | null;
  draftPick: number | null;
  draftTeam: string | null;
  careerGames: number;
  careerGoals: number;
  careerAssists: number;
  careerPlusMinus: number | null;
  // Season stats
  seaGames: number;
  seaGoals: number;
  seaAssists: number;
  seaPoints: number;
  seaPpm: number;
  seaShootPct: number;   // 0-1 fraction
  seaToiMin: number;
  // Momentum (last 5 games)
  momGames: number;
  momGoals: number;
  momAssists: number;
  momPpm: number;
  momShootPct: number;   // 0-1 fraction
  momToiMin: number;
  energyBar: number;
  breakoutDelta: number;
  // Last 5 game log
  recentGames: Array<{
    date: string;
    opponent: string;
    goals: number;
    assists: number;
    plusMinus: number;
    toiMin: number;
  }>;
}

// ─── Player bio / character ───────────────────────────────────────────────────
// Who is this player? Background, archetype, defining style of play.

async function _generatePlayerBio(input: PlayerAIInput): Promise<string | null> {
  const goalsPerGame = input.careerGames > 0 ? (input.careerGoals / input.careerGames).toFixed(2) : '—';
  const assistsPerGame = input.careerGames > 0 ? (input.careerAssists / input.careerGames).toFixed(2) : '—';
  const careerPoints = input.careerGoals + input.careerAssists;
  const heightFt = input.heightInches ? `${Math.floor(input.heightInches / 12)}′${input.heightInches % 12}″` : null;

  const draftLine = input.draftYear
    ? `Drafted ${input.draftYear}, Round ${input.draftRound}, Pick #${input.draftPick}${input.draftTeam ? ` by ${input.draftTeam}` : ''}`
    : 'Undrafted';

  const prompt = `You are an NHL scout writing a player identity card for an analytics platform. Your job is to characterize who this player IS as a hockey player — their archetype, style, and role — based on the data.

Player: ${input.name} (${input.team}, ${input.position})
${input.age ? `Age: ${input.age}` : ''}${input.birthCity ? ` · From: ${input.birthCity}, ${input.birthCountry}` : ''}
${heightFt ? `Size: ${heightFt}${input.weightPounds ? `, ${input.weightPounds} lbs` : ''}` : ''}
Shoots: ${input.shootsCatches === 'L' ? 'Left' : input.shootsCatches === 'R' ? 'Right' : '—'}
${draftLine}

Career (${input.careerGames} GP): ${input.careerGoals}G ${input.careerAssists}A ${careerPoints}pts | ${goalsPerGame} G/game | ${assistsPerGame} A/game${input.careerPlusMinus != null ? ` | ${input.careerPlusMinus > 0 ? '+' : ''}${input.careerPlusMinus} +/-` : ''}
Current season (${input.seaGames} GP): ${input.seaGoals}G ${input.seaAssists}A | ${input.seaToiMin.toFixed(1)} min/game

Write 2–3 sentences describing who this player is. What type of player is he — a sniper, a playmaker, a two-way forward, a physical presence, a power play specialist, a shutdown defender? Let the goals/assists ratio, ice time, career production rate, and physical profile guide the characterization. Be direct and specific. No generic praise. Third person.`;

  return ask(prompt);
}

export const generatePlayerBio = unstable_cache(
  _generatePlayerBio,
  ['player-ai-bio'],
  { revalidate: 60 * 60 * 48 }, // 48 hours — career data changes rarely
);

// ─── Player performance evaluation ───────────────────────────────────────────
// How is he playing RIGHT NOW vs who he typically is?

async function _generatePlayerPerfEval(input: PlayerAIInput): Promise<string | null> {
  const sign = (n: number) => n >= 0 ? `+${n}` : String(n);
  const ppmDeltaPct = input.seaPpm > 0
    ? ((input.momPpm - input.seaPpm) / input.seaPpm * 100).toFixed(0)
    : null;
  const shootDeltaPpt = ((input.momShootPct - input.seaShootPct) * 100).toFixed(1);
  const toiDelta = (input.momToiMin - input.seaToiMin).toFixed(1);

  const gameLogLines = input.recentGames.slice(0, 5).map(g =>
    `  ${g.date}: vs ${g.opponent} — ${g.goals}G ${g.assists}A (${sign(g.plusMinus)}), ${g.toiMin.toFixed(1)} min`
  ).join('\n');

  // Derive a plain-language season context for the model
  const careerPpm = input.careerGames > 0
    ? ((input.careerGoals + input.careerAssists) / input.careerGames / (input.seaToiMin > 0 ? input.seaToiMin : 18) * 60).toFixed(4)
    : null;

  const prompt = `You are an NHL performance analyst. Your job is to evaluate a player's current form relative to their season baseline and their identity as a player.

Player: ${input.name} (${input.team}, ${input.position})${input.rank ? ` · Global rank #${input.rank}` : ''}

Season baseline (${input.seaGames} games): ${input.seaGoals}G ${input.seaAssists}A ${input.seaPoints}pts | PPM ${input.seaPpm.toFixed(4)} | Shot% ${(input.seaShootPct * 100).toFixed(1)}% | ${input.seaToiMin.toFixed(1)} min/game
${careerPpm ? `Career PPM (est.): ~${careerPpm}` : ''}

Last ${input.momGames} games (momentum window): ${input.momGoals}G ${input.momAssists}A | PPM ${input.momPpm.toFixed(4)}${ppmDeltaPct ? ` (${Number(ppmDeltaPct) >= 0 ? '+' : ''}${ppmDeltaPct}% vs season)` : ''} | Shot% ${(input.momShootPct * 100).toFixed(1)}% (${Number(shootDeltaPpt) >= 0 ? '+' : ''}${shootDeltaPpt}pp) | ${input.momToiMin.toFixed(1)} min/game (${Number(toiDelta) >= 0 ? '+' : ''}${toiDelta} vs season)

Energy bar: ${input.energyBar}/100
Breakout delta: ${sign(Number(input.breakoutDelta.toFixed(4)))} PPM

Recent game log:
${gameLogLines || '  No recent games'}

Evaluate this player's current form in 2–3 sentences. Answer: is he playing above or below his season baseline right now? Is this a surge, a slump, or consistency? Connect it to the type of player he is — if he's a scorer in a cold streak, say so; if an assist-first player is suddenly finishing, say so. Be direct, data-backed, no fluff. Third person.`;

  return ask(prompt);
}

export const generatePlayerPerfEval = unstable_cache(
  _generatePlayerPerfEval,
  ['player-ai-perf-eval'],
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
  date: string;
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
  { revalidate: 60 * 60 * 24 },
);
