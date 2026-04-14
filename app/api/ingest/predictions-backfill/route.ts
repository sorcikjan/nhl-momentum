import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getGamesByDate } from '@/lib/nhl-api';
import { requireIngestAuth } from '@/lib/ingest-auth';
import { MODEL_REGISTRY } from '@/lib/prediction-models';
import type { NHLScheduledGame } from '@/types';

// GET /api/ingest/predictions-backfill?days=3
// GET /api/ingest/predictions-backfill?date=YYYY-MM-DD
//
// Generates missing predictions for any game (regardless of game state).
// Safe to re-run — predictions use upsert with onConflict: 'game_id,model_version'.
//
// For each game:
//   1. If game_team_snapshots already exist → run MODEL_REGISTRY against them directly
//   2. If snapshots are missing → build from current player metrics, then run MODEL_REGISTRY
//
// Use this to backfill any date where the daily pipeline failed or predictions are missing.

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const dateParam = req.nextUrl.searchParams.get('date');
  const daysParam = Math.min(14, Math.max(1, Number(req.nextUrl.searchParams.get('days') ?? '1')));

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (dateParam && !DATE_RE.test(dateParam)) {
    return NextResponse.json({ data: null, error: 'Invalid date format' }, { status: 400 });
  }

  // Build list of dates to process
  const dates: string[] = [];
  if (dateParam) {
    dates.push(dateParam);
  } else {
    for (let i = 0; i < daysParam; i++) {
      dates.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
    }
  }

  const log: string[] = [];
  let totalPredictions = 0;
  let totalSnapshots = 0;

  for (const date of dates) {
    try {
      const dayGames = (await getGamesByDate(date)) as NHLScheduledGame[];
      if (!dayGames.length) { log.push(`${date}: no games`); continue; }

      // Upsert game records (preserve existing scores for completed games)
      for (const g of dayGames) {
        const isFinal = g.gameState === 'FINAL' || g.gameState === 'OFF';
        await supabaseAdmin.from('games').upsert({
          id: g.id,
          game_date: g.gameDate ?? date,
          start_time_utc: g.startTimeUTC,
          home_team_id: g.homeTeam.id,
          away_team_id: g.awayTeam.id,
          ...(isFinal ? {
            home_score: g.homeTeam.score ?? null,
            away_score: g.awayTeam.score ?? null,
          } : {}),
          game_state: g.gameState,
          venue: g.venue?.default ?? null,
          season: '20252026',
        }, { onConflict: 'id' });
      }

      let dayPreds = 0, daySnaps = 0;

      for (const game of dayGames) {
        // Check if snapshots already exist (fast path)
        const [{ data: homeSnap }, { data: awaySnap }] = await Promise.all([
          supabaseAdmin.from('game_team_snapshots').select('*').eq('game_id', game.id).eq('is_home', true).single(),
          supabaseAdmin.from('game_team_snapshots').select('*').eq('game_id', game.id).eq('is_home', false).single(),
        ]);

        let hSnap = homeSnap;
        let aSnap = awaySnap;

        // If either snapshot is missing, build both from current player metrics
        if (!hSnap || !aSnap) {
          await Promise.all([
            { teamId: game.homeTeam.id, isHome: true },
            { teamId: game.awayTeam.id, isHome: false },
          ].map(async ({ teamId, isHome }) => {
            const { data: players } = await supabaseAdmin
              .from('players')
              .select('id, position_code')
              .eq('team_id', teamId)
              .eq('is_active', true);

            if (!players?.length) return;

            const skaterIds = players.filter(p => p.position_code !== 'G').map(p => p.id).slice(0, 20);
            const goalieIds = players.filter(p => p.position_code === 'G').map(p => p.id).slice(0, 3);

            const { data: allSkaterSnaps } = await supabaseAdmin
              .from('player_metric_snapshots')
              .select(`
                player_id, momentum_ppm, season_ppm, career_ppm, composite_ppm,
                energy_bar, sos_coefficient,
                players!inner(first_name, last_name, position_code, injury_status)
              `)
              .in('player_id', skaterIds)
              .order('calculated_at', { ascending: false })
              .limit(skaterIds.length * 3);

            const seenSkaters = new Set<number>();
            const skaterSnaps = [];
            for (const data of allSkaterSnaps ?? []) {
              if (seenSkaters.has(data.player_id)) continue;
              seenSkaters.add(data.player_id);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const p = data.players as any;
              skaterSnaps.push({
                playerId: data.player_id,
                playerName: `${p.first_name} ${p.last_name}`,
                position: p.position_code,
                compositePpm: Number(data.composite_ppm ?? 0),
                momentumPpm: Number(data.momentum_ppm ?? 0),
                seasonPpm: Number(data.season_ppm ?? 0),
                careerPpm: Number(data.career_ppm ?? 0),
                energyBar: data.energy_bar ?? 100,
                injuryStatus: p.injury_status ?? null,
              });
            }

            const [{ data: allGoalieStats }, { data: seasonGoalieStats }, { data: goalieNames }] = await Promise.all([
              supabaseAdmin.from('game_goalie_stats').select('player_id, shots_against, goals_against, save_pct, toi_seconds').in('player_id', goalieIds).order('recorded_at', { ascending: false }).limit(goalieIds.length * 5),
              supabaseAdmin.from('game_goalie_stats').select('player_id, shots_against, goals_against, save_pct').in('player_id', goalieIds),
              supabaseAdmin.from('players').select('id, first_name, last_name').in('id', goalieIds),
            ]);

            const goalieNameMap = new Map((goalieNames ?? []).map(g => [g.id, g]));
            const goalieStatsMap = new Map<number, typeof allGoalieStats>();
            for (const row of allGoalieStats ?? []) {
              if (!goalieStatsMap.has(row.player_id)) goalieStatsMap.set(row.player_id, []);
              goalieStatsMap.get(row.player_id)!.push(row);
            }
            const goalieSeasonMap = new Map<number, typeof seasonGoalieStats>();
            for (const row of seasonGoalieStats ?? []) {
              if (!goalieSeasonMap.has(row.player_id)) goalieSeasonMap.set(row.player_id, []);
              goalieSeasonMap.get(row.player_id)!.push(row);
            }

            const { data: goalieEnergySnaps } = await supabaseAdmin.from('player_metric_snapshots').select('player_id, energy_bar').in('player_id', goalieIds).order('calculated_at', { ascending: false });
            const goalieEnergyMap = new Map<number, number>();
            for (const snap of goalieEnergySnaps ?? []) {
              if (!goalieEnergyMap.has(snap.player_id)) goalieEnergyMap.set(snap.player_id, snap.energy_bar ?? 100);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let goalieSnap: any = { playerId: 0, playerName: 'Unknown', momentumShotsPerGoal: 22, seasonShotsPerGoal: 22, momentumSavePct: 0.905, seasonSavePct: 0.905, energyBar: 100 };
            for (const gid of goalieIds) {
              const momentum = goalieStatsMap.get(gid);
              if (momentum?.length) {
                const mShots = momentum.reduce((s, r) => s + r.shots_against, 0);
                const mGoals = momentum.reduce((s, r) => s + r.goals_against, 0);
                const momentumSpg = mGoals > 0 ? Math.min(40, mShots / mGoals) : 22;
                const momentumSavePct = momentum.reduce((s, r) => s + (r.save_pct ?? 0), 0) / momentum.length;
                const season = goalieSeasonMap.get(gid) ?? momentum;
                const sShots = season.reduce((s, r) => s + r.shots_against, 0);
                const sGoals = season.reduce((s, r) => s + r.goals_against, 0);
                const seasonSpg = sGoals > 0 ? Math.min(40, sShots / sGoals) : 22;
                const seasonSavePct = season.reduce((s, r) => s + (r.save_pct ?? 0), 0) / season.length;
                const gp = goalieNameMap.get(gid);
                goalieSnap = {
                  playerId: gid,
                  playerName: gp ? `${gp.first_name} ${gp.last_name}` : 'Unknown',
                  momentumShotsPerGoal: Math.round(momentumSpg * 10) / 10,
                  seasonShotsPerGoal: Math.round(seasonSpg * 10) / 10,
                  momentumSavePct,
                  seasonSavePct,
                  energyBar: goalieEnergyMap.get(gid) ?? 100,
                };
                break;
              }
            }

            const teamEnergy = skaterSnaps.length
              ? Math.round(skaterSnaps.reduce((s, sk) => s + sk.energyBar, 0) / skaterSnaps.length)
              : 100;

            const { data: teamGames } = await supabaseAdmin
              .from('games')
              .select('game_date, home_team_id, away_team_id, home_score, away_score')
              .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
              .eq('season', '20252026')
              .not('home_score', 'is', null)
              .lt('game_date', date)
              .order('game_date', { ascending: true });

            const completedGamesForTeam = (teamGames ?? []).filter(g => g.home_score !== null && g.away_score !== null);
            let goalsFor = 0, goalsAgainst = 0;
            for (const g of completedGamesForTeam) {
              const isHomeTeam = g.home_team_id === teamId;
              goalsFor += isHomeTeam ? g.home_score! : g.away_score!;
              goalsAgainst += isHomeTeam ? g.away_score! : g.home_score!;
            }
            const gfPerGame = completedGamesForTeam.length >= 5 ? goalsFor / completedGamesForTeam.length : 3.0;
            const gaPerGame = completedGamesForTeam.length >= 5 && goalsAgainst > 0 ? goalsAgainst / completedGamesForTeam.length : 3.0;
            const sosMultiplier = Math.round((1.0 + (gfPerGame / gaPerGame - 1.0) * 0.3) * 1000) / 1000;

            const yesterday = new Date(date + 'T12:00:00Z');
            yesterday.setUTCDate(yesterday.getUTCDate() - 1);
            const yesterdayStr = yesterday.toISOString().slice(0, 10);
            const isBackToBack = completedGamesForTeam.some(g => g.game_date === yesterdayStr);

            const last5 = completedGamesForTeam.slice(-5);
            let recentWins = 0;
            for (const g of last5) {
              const isHomeTeam = g.home_team_id === teamId;
              if ((isHomeTeam ? g.home_score! : g.away_score!) > (isHomeTeam ? g.away_score! : g.home_score!)) recentWins++;
            }
            const recentWinPct = last5.length >= 3 ? recentWins / last5.length : 0.5;
            const recentFormMultiplier = Math.round((1.0 + (recentWinPct - 0.5) * 0.3) * 1000) / 1000;

            goalieSnap = { ...goalieSnap, teamRecentForm: recentFormMultiplier, isBackToBack };

            const { error: snapErr } = await supabaseAdmin.from('game_team_snapshots').upsert({
              game_id: game.id,
              team_id: teamId,
              is_home: isHome,
              team_energy_bar: teamEnergy,
              sos_multiplier: sosMultiplier,
              sh_toi_percentile: 0.5,
              skater_snapshots: skaterSnaps,
              goalie_snapshot: goalieSnap,
            }, { onConflict: 'game_id,team_id' });

            if (!snapErr) daySnaps++;
          }));

          // Re-fetch after building
          const [{ data: h2 }, { data: a2 }] = await Promise.all([
            supabaseAdmin.from('game_team_snapshots').select('*').eq('game_id', game.id).eq('is_home', true).single(),
            supabaseAdmin.from('game_team_snapshots').select('*').eq('game_id', game.id).eq('is_home', false).single(),
          ]);
          hSnap = h2;
          aSnap = a2;
        }

        if (!hSnap || !aSnap) {
          log.push(`${date} game ${game.id}: snapshots still missing after build, skipping`);
          continue;
        }

        // Run MODEL_REGISTRY against snapshots
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hSkaters = (hSnap.skater_snapshots as any[]) ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const aSkaters = (aSnap.skater_snapshots as any[]) ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hGoalie = (hSnap.goalie_snapshot as any) ?? {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const aGoalie = (aSnap.goalie_snapshot as any) ?? {};

        const homeTeamSnap = {
          energyBar: hSnap.team_energy_bar ?? 100,
          sosMultiplier: Number(hSnap.sos_multiplier ?? 1),
          shToiPercentile: hSnap.sh_toi_percentile ?? 0.5,
          skaters: hSkaters,
          goalie: hGoalie,
        };
        const awayTeamSnap = {
          energyBar: aSnap.team_energy_bar ?? 100,
          sosMultiplier: Number(aSnap.sos_multiplier ?? 1),
          shToiPercentile: aSnap.sh_toi_percentile ?? 0.5,
          skaters: aSkaters,
          goalie: aGoalie,
        };

        const modelResults = await Promise.all(
          Object.entries(MODEL_REGISTRY).map(async ([version, runModel]) => {
            const r = runModel(homeTeamSnap, awayTeamSnap);
            const { error } = await supabaseAdmin.from('predictions').upsert({
              game_id: game.id,
              model_version: version,
              predicted_home_score: Math.round(r.homeXG * 10) / 10,
              predicted_away_score: Math.round(r.awayXG * 10) / 10,
              home_win_probability: Math.round(r.homeWin * 1000) / 1000,
              away_win_probability: Math.round(r.awayWin * 1000) / 1000,
              ot_probability: 0,
              home_energy_bar: hSnap.team_energy_bar,
              away_energy_bar: aSnap.team_energy_bar,
              home_sos_multiplier: hSnap.sos_multiplier,
              away_sos_multiplier: aSnap.sos_multiplier,
              home_offensive_potential: r.homeOff != null ? Math.round(r.homeOff * 10) / 10 : null,
              away_offensive_potential: r.awayOff != null ? Math.round(r.awayOff * 10) / 10 : null,
              home_defensive_filter: r.homeDef ?? null,
              away_defensive_filter: r.awayDef ?? null,
              input_snapshot: {
                captured_at: new Date().toISOString(),
                source: 'backfill',
                home: { energyBar: hSnap.team_energy_bar, skaterCount: hSkaters.length, goalie: hGoalie.playerName },
                away: { energyBar: aSnap.team_energy_bar, skaterCount: aSkaters.length, goalie: aGoalie.playerName },
              },
            }, { onConflict: 'game_id,model_version' });
            return !error;
          })
        );

        const stored = modelResults.filter(Boolean).length;
        dayPreds += stored;

        // Score outcomes for completed games
        const isFinal = game.gameState === 'FINAL' || game.gameState === 'OFF';
        if (isFinal && game.homeTeam.score !== undefined && game.awayTeam.score !== undefined) {
          const { data: preds } = await supabaseAdmin
            .from('predictions')
            .select('id, predicted_home_score, predicted_away_score, home_win_probability, away_win_probability')
            .eq('game_id', game.id);

          for (const pred of preds ?? []) {
            const correctWinner =
              (pred.home_win_probability > pred.away_win_probability) ===
              (game.homeTeam.score > game.awayTeam.score);
            await supabaseAdmin.from('prediction_outcomes').upsert({
              prediction_id: pred.id,
              game_id: game.id,
              actual_home_score: game.homeTeam.score,
              actual_away_score: game.awayTeam.score,
              home_score_error: Math.abs(game.homeTeam.score - Number(pred.predicted_home_score)),
              away_score_error: Math.abs(game.awayTeam.score - Number(pred.predicted_away_score)),
              correct_winner: correctWinner,
            }, { onConflict: 'game_id,prediction_id' });
          }
        }
      }

      totalPredictions += dayPreds;
      totalSnapshots += daySnaps;
      log.push(`${date}: ${dayGames.length} games, ${daySnaps} new snapshots, ${dayPreds} predictions stored`);
    } catch (err) {
      log.push(`${date}: error — ${(err as Error).message}`);
    }
  }

  return NextResponse.json({
    data: { dates, total_predictions: totalPredictions, total_snapshots: totalSnapshots, log },
    error: null,
  });
}
