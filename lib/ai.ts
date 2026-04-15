// AI-generated insights using Gemini.
//
// Caching strategy:
//   - Player bio + perf_eval: stored in Supabase `ai_player_insights` table
//       bio refreshes every 48h, perf_eval every 6h
//   - Nightly stories: Next.js unstable_cache, 24h TTL per date
//
// Using gemini-2.5-flash-lite — higher free-tier quota than gemini-2.5-flash.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

async function ask(prompt: string): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent(prompt);
    return result.response.text()?.trim() ?? null;
  } catch {
    return null;
  }
}

// ─── Shared player input ──────────────────────────────────────────────────────

export interface PlayerAIInput {
  name: string;
  team: string;
  position: string;
  rank: number | null;
  birthCity: string | null;
  birthCountry: string | null;
  age: number | null;
  heightInches: number | null;
  weightPounds: number | null;
  shootsCatches: string | null;
  draftYear: number | null;
  draftRound: number | null;
  draftPick: number | null;
  draftTeam: string | null;
  careerGames: number;
  careerGoals: number;
  careerAssists: number;
  careerPlusMinus: number | null;
  seaGames: number;
  seaGoals: number;
  seaAssists: number;
  seaPoints: number;
  seaPpm: number;
  seaShootPct: number;
  seaToiMin: number;
  momGames: number;
  momGoals: number;
  momAssists: number;
  momPpm: number;
  momShootPct: number;
  momToiMin: number;
  energyBar: number;
  breakoutDelta: number;
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

function buildBioPrompt(input: PlayerAIInput): string {
  const goalsPerGame = input.careerGames > 0 ? (input.careerGoals / input.careerGames).toFixed(2) : '—';
  const assistsPerGame = input.careerGames > 0 ? (input.careerAssists / input.careerGames).toFixed(2) : '—';
  const careerPoints = input.careerGoals + input.careerAssists;
  const heightFt = input.heightInches ? `${Math.floor(input.heightInches / 12)}′${input.heightInches % 12}″` : null;
  const draftLine = input.draftYear
    ? `Drafted ${input.draftYear}, Round ${input.draftRound}, Pick #${input.draftPick}${input.draftTeam ? ` by ${input.draftTeam}` : ''}`
    : 'Undrafted';

  return `You are an NHL scout writing a player identity card for an analytics platform. Characterize who this player IS as a hockey player — their archetype, style, and role — based on the data.

Player: ${input.name} (${input.team}, ${input.position})
${input.age ? `Age: ${input.age}` : ''}${input.birthCity ? ` · From: ${input.birthCity}, ${input.birthCountry}` : ''}
${heightFt ? `Size: ${heightFt}${input.weightPounds ? `, ${input.weightPounds} lbs` : ''}` : ''}
Shoots: ${input.shootsCatches === 'L' ? 'Left' : input.shootsCatches === 'R' ? 'Right' : '—'}
${draftLine}

Career (${input.careerGames} GP): ${input.careerGoals}G ${input.careerAssists}A ${careerPoints}pts | ${goalsPerGame} G/game | ${assistsPerGame} A/game${input.careerPlusMinus != null ? ` | ${input.careerPlusMinus > 0 ? '+' : ''}${input.careerPlusMinus} +/-` : ''}
Current season (${input.seaGames} GP): ${input.seaGoals}G ${input.seaAssists}A | ${input.seaToiMin.toFixed(1)} min/game

Write 2–3 sentences describing who this player is. What type of contributor — sniper, playmaker, two-way forward, physical presence, power play specialist, shutdown defender? Let the goals/assists ratio, ice time, and career rate guide the characterization. Direct and specific. No generic praise. Third person.`;
}

// ─── Player performance eval ──────────────────────────────────────────────────

function buildPerfEvalPrompt(input: PlayerAIInput): string {
  const sign = (n: number) => n >= 0 ? `+${n}` : String(n);
  const ppmDeltaPct = input.seaPpm > 0
    ? ((input.momPpm - input.seaPpm) / input.seaPpm * 100).toFixed(0)
    : null;
  const shootDeltaPpt = ((input.momShootPct - input.seaShootPct) * 100).toFixed(1);
  const toiDelta = (input.momToiMin - input.seaToiMin).toFixed(1);

  const gameLogLines = input.recentGames.slice(0, 5).map(g =>
    `  ${g.date}: vs ${g.opponent} — ${g.goals}G ${g.assists}A (${sign(g.plusMinus)}), ${g.toiMin.toFixed(1)} min`
  ).join('\n');

  return `You are an NHL performance analyst evaluating a player's current form vs their season baseline and identity.

Player: ${input.name} (${input.team}, ${input.position})${input.rank ? ` · Global rank #${input.rank}` : ''}

Season baseline (${input.seaGames} games): ${input.seaGoals}G ${input.seaAssists}A ${input.seaPoints}pts | PPM ${input.seaPpm.toFixed(4)} | Shot% ${(input.seaShootPct * 100).toFixed(1)}% | ${input.seaToiMin.toFixed(1)} min/game

Last ${input.momGames} games: ${input.momGoals}G ${input.momAssists}A | PPM ${input.momPpm.toFixed(4)}${ppmDeltaPct ? ` (${Number(ppmDeltaPct) >= 0 ? '+' : ''}${ppmDeltaPct}% vs season)` : ''} | Shot% ${(input.momShootPct * 100).toFixed(1)}% (${Number(shootDeltaPpt) >= 0 ? '+' : ''}${shootDeltaPpt}pp) | ${input.momToiMin.toFixed(1)} min/game (${Number(toiDelta) >= 0 ? '+' : ''}${toiDelta} vs season)

Energy bar: ${input.energyBar}/100
Breakout delta: ${sign(Number(input.breakoutDelta.toFixed(4)))} PPM

Recent game log:
${gameLogLines || '  No recent games'}

Evaluate this player's current form in 2–3 sentences. Is he above or below his season baseline? Surge or slump? Connect it to the type of player he is — if a scorer is cold, say so; if a playmaker is suddenly finishing, say so. Direct, data-backed. Third person.`;
}

// ─── Supabase-cached player insights ─────────────────────────────────────────
// Reads from ai_player_insights; generates + stores if stale or missing.

export async function getPlayerInsights(
  playerId: number,
  input: PlayerAIInput,
): Promise<{ bio: string | null; perfEval: string | null }> {
  const BIO_TTL_H   = 48;
  const PERF_TTL_H  = 6;

  // Load existing row
  const { data: row } = await supabaseAdmin
    .from('ai_player_insights')
    .select('bio, perf_eval, generated_at')
    .eq('player_id', playerId)
    .single();

  const now = Date.now();
  const ageH = row?.generated_at
    ? (now - new Date(row.generated_at).getTime()) / 3_600_000
    : Infinity;

  const needsBio  = !row?.bio  || ageH > BIO_TTL_H;
  const needsPerf = !row?.perf_eval || ageH > PERF_TTL_H;

  if (!needsBio && !needsPerf) {
    return { bio: row!.bio, perfEval: row!.perf_eval };
  }

  // Generate only what's stale — run in parallel if both needed
  const [newBio, newPerf] = await Promise.all([
    needsBio  ? ask(buildBioPrompt(input))      : Promise.resolve(null),
    needsPerf ? ask(buildPerfEvalPrompt(input)) : Promise.resolve(null),
  ]);

  const upsertData = {
    player_id:    playerId,
    bio:          needsBio  ? (newBio  ?? row?.bio  ?? null) : row?.bio,
    perf_eval:    needsPerf ? (newPerf ?? row?.perf_eval ?? null) : row?.perf_eval,
    generated_at: new Date().toISOString(),
  };

  await supabaseAdmin
    .from('ai_player_insights')
    .upsert(upsertData, { onConflict: 'player_id' });

  return {
    bio:      upsertData.bio,
    perfEval: upsertData.perf_eval,
  };
}

// Keep old exports for backwards compat (used in page.tsx)
export const generatePlayerBio = async (input: PlayerAIInput) => ask(buildBioPrompt(input));
export const generatePlayerPerfEval = async (input: PlayerAIInput) => ask(buildPerfEvalPrompt(input));

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
  ['nightly-stories-v2'],
  { revalidate: 60 * 60 * 24 },
);

// ─── Daily recap article ──────────────────────────────────────────────────────

export interface RecapGame {
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
  predictedCorrectly: boolean | null;
  homeWinProbability: number | null;
}

export interface RecapPerformer {
  name: string;
  team: string;
  position: string;
  goals: number;
  assists: number;
  plusMinus: number;
  toiMin: number;
  momentumPpm: number | null;
  seasonPpm: number | null;
  momentumRank: number | null;
}

export interface RecapShutout {
  name: string;
  team: string;
  saves: number;
}

export interface DailyRecapInput {
  date: string;        // YYYY-MM-DD
  dateLabel: string;   // e.g. "Tuesday, April 15, 2026"
  games: RecapGame[];
  topPerformers: RecapPerformer[];
  shutouts: RecapShutout[];
}

export interface DailyRecapOutput {
  title: string;
  summary: string;
  content: string;
}

export async function generateDailyRecap(input: DailyRecapInput): Promise<DailyRecapOutput | null> {
  const sign = (n: number) => n >= 0 ? `+${n}` : String(n);

  const gameLines = input.games.map(g => {
    const winner = g.awayScore > g.homeScore ? g.awayTeam : g.homeTeam;
    const pred = g.predictedCorrectly === true ? '✓ (predicted)' : g.predictedCorrectly === false ? '✗ (upset)' : '';
    return `  ${g.awayTeam} ${g.awayScore} @ ${g.homeTeam} ${g.homeScore}${pred ? ' — ' + pred : ''}${g.homeWinProbability != null ? ` [model gave ${winner} ${g.awayScore > g.homeScore ? (100 - g.homeWinProbability * 100).toFixed(0) : (g.homeWinProbability * 100).toFixed(0)}% win probability]` : ''}`;
  }).join('\n');

  const performerLines = input.topPerformers.slice(0, 8).map(p => {
    const pts = p.goals + p.assists;
    const momContext = p.momentumPpm && p.seasonPpm && p.seasonPpm > 0
      ? ` [momentum PPM ${p.momentumPpm.toFixed(4)}, ${((p.momentumPpm - p.seasonPpm) / p.seasonPpm * 100).toFixed(0)}% ${p.momentumPpm > p.seasonPpm ? 'above' : 'below'} season avg]`
      : '';
    return `  ${p.name} (${p.team}, ${p.position}): ${p.goals}G ${p.assists}A = ${pts}pts, ${sign(p.plusMinus)}, ${p.toiMin.toFixed(1)} min${momContext}`;
  }).join('\n');

  const shutoutLines = input.shutouts.length
    ? '\nShutouts:\n' + input.shutouts.map(s => `  ${s.name} (${s.team}): ${s.saves} saves`).join('\n')
    : '';

  const modelAccuracy = input.games.filter(g => g.predictedCorrectly !== null);
  const correct = modelAccuracy.filter(g => g.predictedCorrectly === true).length;
  const modelLine = modelAccuracy.length > 0
    ? `\nModel accuracy last night: ${correct}/${modelAccuracy.length} games predicted correctly`
    : '';

  const prompt = `You are a sports writer for NHL Momentum, a hockey analytics platform known for data-driven insights. Write a daily NHL recap article for ${input.dateLabel}.

${input.games.length} games played:
${gameLines}
${shutoutLines}
${modelLine}

Top performers:
${performerLines}

Write a compelling, SEO-friendly recap article. The unique angle of NHL Momentum is momentum analytics — highlight when performers were already showing hot momentum data before the game, or call out any upsets where the model was wrong.

Respond with valid JSON (no markdown, no code blocks):
{
  "title": "NHL Recap [${input.dateLabel}]: [compelling headline mentioning top story, key player or upset — max 70 chars]",
  "summary": "One or two sentences for SEO meta description. Include date, key players, teams. Max 160 chars.",
  "content": "Full article with 4-6 paragraphs separated by \\n\\n. Open with the biggest story. Cover key games and standout performances with specific numbers. Include a 'Momentum Watch' paragraph noting players whose analytics data flagged before the game. Close with a forward-looking line about upcoming games. Analytical but accessible tone. No clichés."
}`;

  const raw = await ask(prompt);
  if (!raw) return null;

  try {
    // Strip any accidental markdown code fences
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned) as DailyRecapOutput;
    if (!parsed.title || !parsed.content) return null;
    return parsed;
  } catch {
    // Fallback: treat whole response as content
    const lines = raw.trim().split('\n');
    return {
      title: lines[0]?.replace(/^#+\s*/, '').slice(0, 100) ?? `NHL Recap — ${input.dateLabel}`,
      summary: lines[1]?.slice(0, 160) ?? '',
      content: raw,
    };
  }
}
