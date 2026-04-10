import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getGamesByDate } from '@/lib/nhl-api';
import { requireIngestAuth } from '@/lib/ingest-auth';
import { calculatePlayerEnergy, GOALIE_DRAIN_PER_MIN, type GameRecord } from '@/lib/energy';
import { MODEL_REGISTRY } from '@/lib/prediction-models';
import type { NHLScheduledGame } from '@/types';

// ─── Daily Pipeline ────────────────────────────────────────────────────────────
// Run this every day via cron (or manually) to:
//
//   Phase 1 — Record outcomes for yesterday's games
//   Phase 2 — Fetch today's scheduled games, build team snapshots + predictions
//
// This is the core data collection loop that enables retrospective model
// comparison. Every day's raw team state is permanently stored in
// game_team_snapshots so any future model version can be backtested against it.
//
// GET /api/ingest/daily?date=YYYY-MM-DD&phase=outcomes|snapshots|energy
//   phase=outcomes   → Phase 1 only (record yesterday's results) — fast, ~2s
//   phase=snapshots  → Phase 2 only (build today's snapshots + predictions) — slower
//   phase=energy     → Phase 3 only (recalculate energy bars for active players)
//                      Supports &offset=N&limit=N (default 0/150) for pagination
//   (no phase param) → both phases (may timeout on large game slates)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authError = requireIngestAuth(req);
  if (authError) return authError;

  const dateParam = req.nextUrl.searchParams.get('date');
  const phaseParam = req.nextUrl.searchParams.get('phase') ?? 'all';
  const gameOffset = Math.max(0, Number(req.nextUrl.searchParams.get('game_offset') ?? '0'));
  const gameLimit  = Math.min(10, Math.max(1, Number(req.nextUrl.searchParams.get('game_limit') ?? '2')));

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (dateParam && !DATE_RE.test(dateParam)) {
    return NextResponse.json({ data: null, error: 'Invalid date format' }, { status: 400 });
  }

  const VALID_PHASES = new Set(['all', 'outcomes', 'snapshots', 'energy']);
  if (!VALID_PHASES.has(phaseParam)) {
    return NextResponse.json({ data: null, error: 'Invalid phase' }, { status: 400 });
  }

  // phase=outcomes  → only Phase 1 (record yesterday's results)
  // phase=snapshots → only Phase 2 (build today's snapshots + predictions)
  // (default)       → both phases (may timeout on large game slates)
  const phase = phaseParam;

  const today = dateParam ?? new Date().toISOString().slice(0, 10);
  const yesterday = new Date(new Date(today + 'T12:00:00Z').getTime() - 86400000)
    .toISOString().slice(0, 10);

  const log: string[] = [];
  let outcomesRecorded = 0;
  let snapshotsSaved = 0;
  let predictionsStored = 0;
  let energyUpdated = 0;
  let totalUpcomingGames = 0;

  try {
    // ── Phase 1: Record outcomes for yesterday's completed games ───────────────
    if (phase === 'snapshots' || phase === 'energy') {
      log.push(`Phase 1: skipped (phase=${phase})`);
    } else {
    log.push(`Phase 1: recording outcomes for ${yesterday}`);

    const yesterdayGames = (await getGamesByDate(yesterday)) as NHLScheduledGame[];
    const completedGames = yesterdayGames.filter(
      g => g.gameState === 'FINAL' || g.gameState === 'OFF'
    );

    // Upsert game results into games table
    for (const g of completedGames) {
      await supabaseAdmin
        .from('games')
        .upsert({
          id: g.id,
          game_date: g.gameDate ?? yesterday,
          start_time_utc: g.startTimeUTC,
          home_team_id: g.homeTeam.id,
          away_team_id: g.awayTeam.id,
          home_score: g.homeTeam.score ?? null,
          away_score: g.awayTeam.score ?? null,
          game_state: g.gameState,
          venue: g.venue?.default ?? null,
          season: '20252026',
        }, { onConflict: 'id' });
    }

    // Score any existing predictions against actual outcomes
    for (const g of completedGames) {
      if (g.homeTeam.score === undefined || g.awayTeam.score === undefined) continue;

      const { data: preds } = await supabaseAdmin
        .from('predictions')
        .select('id, predicted_home_score, predicted_away_score, home_win_probability, away_win_probability')
        .eq('game_id', g.id);

      for (const pred of preds ?? []) {
        const correctWinner =
          (pred.home_win_probability > pred.away_win_probability) ===
          (g.homeTeam.score > g.awayTeam.score);

        const { error } = await supabaseAdmin
          .from('prediction_outcomes')
          .upsert({
            prediction_id: pred.id,
            game_id: g.id,
            actual_home_score: g.homeTeam.score,
            actual_away_score: g.awayTeam.score,
            home_score_error: Math.abs(g.homeTeam.score - Number(pred.predicted_home_score)),
            away_score_error: Math.abs(g.awayTeam.score - Number(pred.predicted_away_score)),
            correct_winner: correctWinner,
          }, { onConflict: 'game_id,prediction_id' });

        if (!error) outcomesRecorded++;
      }
    }

    log.push(`Outcomes recorded: ${outcomesRecorded} from ${completedGames.length} completed games`);
    } // end phase 1

    // ── Phase 2: Capture team snapshots + predictions for today's games ────────
    if (phase === 'outcomes' || phase === 'energy') {
      log.push(`Phase 2: skipped (phase=${phase})`);
    } else {
    log.push(`Phase 2: capturing snapshots + predictions for ${today}`);


    const todayGames = (await getGamesByDate(today)) as NHLScheduledGame[];
    const upcomingGames = todayGames.filter(
      g => g.gameState === 'FUT' || g.gameState === 'PRE'
    );
    totalUpcomingGames = upcomingGames.length;

    // Upsert today's games into games table
    for (const g of upcomingGames) {
      await supabaseAdmin
        .from('games')
        .upsert({
          id: g.id,
          game_date: g.gameDate ?? today,
          start_time_utc: g.startTimeUTC,
          home_team_id: g.homeTeam.id,
          away_team_id: g.awayTeam.id,
          home_score: null,
          away_score: null,
          game_state: g.gameState,
          venue: g.venue?.default ?? null,
          season: '20252026',
        }, { onConflict: 'id' });
    }

    const gamesToProcess = upcomingGames.slice(gameOffset, gameOffset + gameLimit);

    for (const game of gamesToProcess) {
      // Build home + away snapshots in parallel — they're fully independent
      await Promise.all([
        { teamId: game.homeTeam.id, isHome: true },
        { teamId: game.awayTeam.id, isHome: false },
      ].map(async ({ teamId, isHome }) => {
        // Get latest snapshot for each active player on this team
        const { data: players } = await supabaseAdmin
          .from('players')
          .select('id, position_code')
          .eq('team_id', teamId)
          .eq('is_active', true);

        if (!players?.length) return;

        const skaterIds = players.filter(p => p.position_code !== 'G').map(p => p.id).slice(0, 20);
        const goalieIds = players.filter(p => p.position_code === 'G').map(p => p.id).slice(0, 3);

        // Batch fetch all skater snapshots in one query, then deduplicate to latest per player
        const { data: allSkaterSnaps } = await supabaseAdmin
          .from('player_metric_snapshots')
          .select(`
            player_id, momentum_ppm, season_ppm, career_ppm, composite_ppm,
            energy_bar, sos_coefficient,
            players!inner(first_name, last_name, position_code, injury_status)
          `)
          .in('player_id', skaterIds)
          .order('calculated_at', { ascending: false });

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

        // Fetch last 5 games (momentum) and full season for goalies in parallel
        const [{ data: allGoalieStats }, { data: seasonGoalieStats }, { data: goalieNames }] = await Promise.all([
          supabaseAdmin
            .from('game_goalie_stats')
            .select('player_id, shots_against, goals_against, save_pct, toi_seconds')
            .in('player_id', goalieIds)
            .order('recorded_at', { ascending: false })
            .limit(goalieIds.length * 5),
          supabaseAdmin
            .from('game_goalie_stats')
            .select('player_id, shots_against, goals_against, save_pct')
            .in('player_id', goalieIds),
          supabaseAdmin
            .from('players')
            .select('id, first_name, last_name')
            .in('id', goalieIds),
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

        // Fetch goalie energy from their latest snapshot
        const { data: goalieEnergySnaps } = await supabaseAdmin
          .from('player_metric_snapshots')
          .select('player_id, energy_bar')
          .in('player_id', goalieIds)
          .order('calculated_at', { ascending: false });
        const goalieEnergyMap = new Map<number, number>();
        for (const snap of goalieEnergySnaps ?? []) {
          if (!goalieEnergyMap.has(snap.player_id)) goalieEnergyMap.set(snap.player_id, snap.energy_bar ?? 100);
        }

        // Build goalie snapshot from first goalie with sufficient data
        let goalieSnap: { playerId: number; playerName: string; momentumShotsPerGoal: number; seasonShotsPerGoal: number; momentumSavePct: number; seasonSavePct: number; energyBar: number; teamRecentForm?: number; isBackToBack?: boolean } = { playerId: 0, playerName: 'Unknown', momentumShotsPerGoal: 22, seasonShotsPerGoal: 22, momentumSavePct: 0.905, seasonSavePct: 0.905, energyBar: 100 };
        for (const gid of goalieIds) {
          const momentum = goalieStatsMap.get(gid);
          if (momentum?.length) {
            // Momentum: last 5 games
            const mShots = momentum.reduce((s, r) => s + r.shots_against, 0);
            const mGoals = momentum.reduce((s, r) => s + r.goals_against, 0);
            const momentumSpg = mGoals > 0 ? Math.min(40, mShots / mGoals) : 22;
            const momentumSavePct = momentum.reduce((s, r) => s + (r.save_pct ?? 0), 0) / momentum.length;

            // Season: all available game_goalie_stats for this goalie
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

        // Team energy bar = average of active skaters
        const teamEnergy = skaterSnaps.length
          ? Math.round(skaterSnaps.reduce((s, sk) => s + sk.energyBar, 0) / skaterSnaps.length)
          : 100;

        // Compute SOS and back-to-back from completed games up to today
        const { data: teamGames } = await supabaseAdmin
          .from('games')
          .select('game_date, home_team_id, away_team_id, home_score, away_score')
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .eq('season', '20252026')
          .not('home_score', 'is', null)
          .lt('game_date', today)
          .order('game_date', { ascending: true });

        const completedGamesForTeam = (teamGames ?? []).filter(
          g => g.home_score !== null && g.away_score !== null
        );

        // SOS — GF/GA ratio (v1.7+). More granular than binary win%.
        // Formula: 1.0 + (gfPerGame/gaPerGame - 1.0) × 0.3
        let goalsFor = 0, goalsAgainst = 0;
        for (const g of completedGamesForTeam) {
          const isHomeTeam = g.home_team_id === teamId;
          goalsFor += (isHomeTeam ? g.home_score! : g.away_score!);
          goalsAgainst += (isHomeTeam ? g.away_score! : g.home_score!);
        }
        const gfPerGame = completedGamesForTeam.length >= 5 ? goalsFor / completedGamesForTeam.length : 3.0;
        const gaPerGame = completedGamesForTeam.length >= 5 && goalsAgainst > 0 ? goalsAgainst / completedGamesForTeam.length : 3.0;
        const sosMultiplier = Math.round((1.0 + (gfPerGame / gaPerGame - 1.0) * 0.3) * 1000) / 1000;

        // Back-to-back detection
        const yesterday = new Date(today + 'T12:00:00Z');
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        const isBackToBack = completedGamesForTeam.some(g => g.game_date === yesterdayStr);

        // Recent form — last 5 games win%
        const last5 = completedGamesForTeam.slice(-5);
        let recentWins = 0;
        for (const g of last5) {
          const isHomeTeam = g.home_team_id === teamId;
          if ((isHomeTeam ? g.home_score! : g.away_score!) > (isHomeTeam ? g.away_score! : g.home_score!)) recentWins++;
        }
        const recentWinPct = last5.length >= 3 ? recentWins / last5.length : 0.5;
        const recentFormMultiplier = Math.round((1.0 + (recentWinPct - 0.5) * 0.3) * 1000) / 1000;

        // teamRecentForm, isBackToBack stored inside goalie_snapshot JSON
        goalieSnap = { ...goalieSnap, teamRecentForm: recentFormMultiplier, isBackToBack };

        // Save the model-agnostic team snapshot
        const { error: snapErr } = await supabaseAdmin
          .from('game_team_snapshots')
          .upsert({
            game_id: game.id,
            team_id: teamId,
            is_home: isHome,
            team_energy_bar: teamEnergy,
            sos_multiplier: sosMultiplier,
            sh_toi_percentile: 0.5,
            skater_snapshots: skaterSnaps,
            goalie_snapshot: goalieSnap,
          }, { onConflict: 'game_id,team_id' });

        if (!snapErr) snapshotsSaved++;
      })); // end Promise.all home+away

      // Build predictions for ALL model versions using the stored snapshots
      const { data: homeSnap } = await supabaseAdmin
        .from('game_team_snapshots')
        .select('*')
        .eq('game_id', game.id)
        .eq('is_home', true)
        .single();

      const { data: awaySnap } = await supabaseAdmin
        .from('game_team_snapshots')
        .select('*')
        .eq('game_id', game.id)
        .eq('is_home', false)
        .single();

      if (!homeSnap || !awaySnap) continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hSkaters = (homeSnap.skater_snapshots as any[]) ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aSkaters = (awaySnap.skater_snapshots as any[]) ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hGoalie = (homeSnap.goalie_snapshot as any) ?? {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aGoalie = (awaySnap.goalie_snapshot as any) ?? {};

      // Build TeamSnap shape that MODEL_REGISTRY expects
      const homeTeamSnap = {
        energyBar: homeSnap.team_energy_bar ?? 100,
        sosMultiplier: Number(homeSnap.sos_multiplier ?? 1),
        shToiPercentile: homeSnap.sh_toi_percentile ?? 0.5,
        skaters: hSkaters,
        goalie: hGoalie,
      };
      const awayTeamSnap = {
        energyBar: awaySnap.team_energy_bar ?? 100,
        sosMultiplier: Number(awaySnap.sos_multiplier ?? 1),
        shToiPercentile: awaySnap.sh_toi_percentile ?? 0.5,
        skaters: aSkaters,
        goalie: aGoalie,
      };

      // Run all models in parallel, one upsert per model version
      const modelResults = await Promise.all(
        Object.entries(MODEL_REGISTRY).map(async ([version, runModel]) => {
          const r = runModel(homeTeamSnap, awayTeamSnap);
          const { error } = await supabaseAdmin
            .from('predictions')
            .upsert({
              game_id: game.id,
              model_version: version,
              predicted_home_score: Math.round(r.homeXG * 10) / 10,
              predicted_away_score: Math.round(r.awayXG * 10) / 10,
              home_win_probability: Math.round(r.homeWin * 1000) / 1000,
              away_win_probability: Math.round(r.awayWin * 1000) / 1000,
              ot_probability: 0,
              home_energy_bar: homeSnap.team_energy_bar,
              away_energy_bar: awaySnap.team_energy_bar,
              home_sos_multiplier: homeSnap.sos_multiplier,
              away_sos_multiplier: awaySnap.sos_multiplier,
              home_offensive_potential: r.homeOff != null ? Math.round(r.homeOff * 10) / 10 : null,
              away_offensive_potential: r.awayOff != null ? Math.round(r.awayOff * 10) / 10 : null,
              home_defensive_filter: r.homeDef ?? null,
              away_defensive_filter: r.awayDef ?? null,
              input_snapshot: {
                captured_at: new Date().toISOString(),
                home: { energyBar: homeSnap.team_energy_bar, skaterCount: hSkaters.length, goalie: hGoalie.playerName },
                away: { energyBar: awaySnap.team_energy_bar, skaterCount: aSkaters.length, goalie: aGoalie.playerName },
              },
            }, { onConflict: 'game_id,model_version' });
          return !error;
        })
      );
      predictionsStored += modelResults.filter(Boolean).length;
    }

    log.push(`Team snapshots saved: ${snapshotsSaved}`);
    log.push(`Predictions stored: ${predictionsStored} for ${gamesToProcess.length} games (offset ${gameOffset}/${upcomingGames.length})`);
    } // end phase 2

    // ── Phase 3: Recalculate energy bars for ALL active players ───────────────
    // Strategy: fetch recent game stats once (no player filter), process all
    // players in memory. Players with no recent games → 100 instantly.
    // Updates run at 50 concurrent to stay within Netlify's 10s budget.
    let energyInserted = 0;
    if (phase === 'energy') {
      const GAME_DURATION_MS = 2.5 * 3_600_000;
      const now       = new Date();
      const since     = new Date(now.getTime() - 72 * 3_600_000);
      const sinceDate = since.toISOString().slice(0, 10);

      log.push(`Phase 3: recalculating energy for all active players (since ${sinceDate})`);

      // Fetch active players and recent games first, then use game IDs for stats
      const [
        { data: ePlayers, error: epErr },
        { data: recentGames },
      ] = await Promise.all([
        supabaseAdmin.from('players').select('id, position_code').eq('is_active', true).order('id'),
        supabaseAdmin.from('games').select('id, game_date, start_time_utc').gte('game_date', sinceDate).in('game_state', ['FINAL', 'OFF']),
      ]);

      const recentGameIds = (recentGames ?? []).map(g => g.id);

      // Filter stats by game_id (not recorded_at) — recorded_at is only set on INSERT,
      // never updated on upsert conflict, so it reflects original ingest time, not game date.
      const [{ data: eSkaterStats }, { data: eGoalieStats }] = await Promise.all([
        recentGameIds.length
          ? supabaseAdmin.from('game_player_stats').select('player_id, game_id, toi_seconds').in('game_id', recentGameIds)
          : Promise.resolve({ data: [] }),
        recentGameIds.length
          ? supabaseAdmin.from('game_goalie_stats').select('player_id, game_id, toi_seconds').in('game_id', recentGameIds)
          : Promise.resolve({ data: [] }),
      ]);

      if (epErr) throw epErr;

      if (ePlayers?.length) {
        const ePlayerIds = ePlayers.map(p => p.id);

        const eGameMap = new Map((recentGames ?? []).map(g => [g.id, g]));

        // Build game records per player from stats
        const recordsByPlayer = new Map<number, GameRecord[]>();
        for (const row of [...(eSkaterStats ?? []), ...(eGoalieStats ?? [])]) {
          const game = eGameMap.get(row.game_id);
          if (!game) continue;
          const startUtc = game.start_time_utc
            ? new Date(game.start_time_utc)
            : new Date(`${game.game_date}T20:00:00Z`);
          const gameEnd = new Date(startUtc.getTime() + GAME_DURATION_MS);
          if (!recordsByPlayer.has(row.player_id)) recordsByPlayer.set(row.player_id, []);
          recordsByPlayer.get(row.player_id)!.push({ game_end_utc: gameEnd, toi_seconds: row.toi_seconds ?? 0 });
        }

        // Fetch latest snapshot ID + current energy per player.
        // Limit to 2× player count — rows are newest-first so first occurrence per player is latest.
        const { data: latestSnaps } = await supabaseAdmin
          .from('player_metric_snapshots')
          .select('id, player_id, energy_bar')
          .in('player_id', ePlayerIds)
          .order('calculated_at', { ascending: false })
          .limit(ePlayerIds.length * 2);

        const latestSnapByPlayer = new Map<number, { id: string; energy_bar: number }>();
        for (const snap of latestSnaps ?? []) {
          if (!latestSnapByPlayer.has(snap.player_id)) latestSnapByPlayer.set(snap.player_id, { id: snap.id, energy_bar: snap.energy_bar ?? 100 });
        }

        const eUpdates: { id: string; energy_bar: number }[] = [];
        const eInserts: { player_id: number; energy_bar: number; momentum_rank: number }[] = [];
        for (const player of ePlayers) {
          const drainRate = player.position_code === 'G' ? GOALIE_DRAIN_PER_MIN : undefined;
          const energy    = calculatePlayerEnergy(recordsByPlayer.get(player.id) ?? [], now, drainRate);
          const existing  = latestSnapByPlayer.get(player.id);
          if (existing) {
            // Skip if value unchanged — avoids unnecessary DB writes for recovered players
            if (existing.energy_bar !== energy) eUpdates.push({ id: existing.id, energy_bar: energy });
          } else {
            eInserts.push({ player_id: player.id, energy_bar: energy, momentum_rank: 0 });
          }
        }

        // 50 concurrent updates — only changed values, typically ~60-120 players who played recently
        const CONCURRENT = 50;
        for (let i = 0; i < eUpdates.length; i += CONCURRENT) {
          const results = await Promise.all(
            eUpdates.slice(i, i + CONCURRENT).map(({ id, energy_bar }) =>
              supabaseAdmin.from('player_metric_snapshots').update({ energy_bar }).eq('id', id)
            )
          );
          energyUpdated += results.filter(r => !r.error).length;
        }

        if (eInserts.length) {
          const { error: insErr } = await supabaseAdmin.from('player_metric_snapshots').insert(eInserts);
          if (!insErr) energyInserted += eInserts.length;
        }

        log.push(`Energy updated: ${energyUpdated} changed, ${ePlayers.length - eUpdates.length - eInserts.length} already correct, inserted: ${energyInserted} (${ePlayers.length} total active players)`);
      }
    } // end phase 3

    return NextResponse.json({
      data: {
        date: today,
        outcomes_recorded: outcomesRecorded,
        snapshots_saved: snapshotsSaved,
        predictions_stored: predictionsStored,
        energy_updated: energyUpdated,
        energy_inserted: energyInserted,
        has_more: phase === 'snapshots' && gameOffset + gameLimit < totalUpcomingGames,
        log,
      },
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: (err as Error).message, log },
      { status: 500 }
    );
  }
}
