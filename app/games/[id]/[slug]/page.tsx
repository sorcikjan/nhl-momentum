import type { Metadata } from 'next';
import Link from 'next/link';
import {
  fetchMatch, fetchAccuracy, fetchRecap, fetchSeriesStandings, fetchTeamSpecialTeams,
  fetchPostGameHeat, isPlayoffGameId, parsePlayoffGameId, teamLogoUrl,
} from '@/lib/data';
import { teamUrl, playerUrl, recapUrl } from '@/lib/urls';
import { decimalToNormProb, formatBookmaker } from '@/lib/odds-api';
import { ppmToHeat } from '@/lib/heat';
import { periodScoresFromMomentum } from '@/lib/play-by-play';

import ShareButton from '@/components/ui/ShareButton';
import GameHero from '@/components/games/GameHero';
import MomentumTracker from '@/components/games/MomentumTracker';
import RecentActionFeed from '@/components/games/RecentActionFeed';
import WinProbabilityCard from '@/components/games/WinProbabilityCard';
import HeatingUpCard, { type HeatPlayerRow } from '@/components/games/HeatingUpCard';
import LiveStatsGrid from '@/components/games/LiveStatsGrid';
import ThreeStarsRow from '@/components/games/ThreeStarsRow';
import PredictionCard from '@/components/games/PredictionCard';
import HeatImpactCard, { type Mover } from '@/components/games/HeatImpactCard';
import RecapCard from '@/components/games/RecapCard';
import HighlightsCard from '@/components/games/HighlightsCard';
import SeriesTrackerCard from '@/components/games/SeriesTrackerCard';
import GoalieMatchupCard from '@/components/games/GoalieMatchupCard';
import PlayersToWatchCard from '@/components/games/PlayersToWatchCard';
import SpecialTeamsCard from '@/components/games/SpecialTeamsCard';
import HeadToHeadCard from '@/components/games/HeadToHeadCard';
import LineupContextCard from '@/components/games/LineupContextCard';

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { game } = await fetchMatch(id).catch(() => ({ game: null }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const away = (game?.away_team as any)?.abbrev ?? 'Away';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const home = (game?.home_team as any)?.abbrev ?? 'Home';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awayName = (game?.away_team as any)?.name ?? away;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeName = (game?.home_team as any)?.name ?? home;
  const dateLabel = game?.game_date
    ? new Date(game.game_date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  const isFinalGame = ['FINAL', 'OFF'].includes(game?.game_state ?? '');
  const title = `${awayName} vs ${homeName}${dateLabel ? ' — ' + dateLabel : ''}`;
  const desc = isFinalGame
    ? `${awayName} vs ${homeName} recap${dateLabel ? ' — ' + dateLabel : ''}: final score, top performers, expected goals, and AI prediction result.`
    : `${awayName} vs ${homeName} prediction${dateLabel ? ' — ' + dateLabel : ''}: AI win probability, expected goals, lineup momentum, and betting odds comparison.`;
  return {
    title,
    description: desc,
    openGraph: {
      title: `${awayName} vs ${homeName} — momentum.`,
      description: desc,
      images: [{ url: teamLogoUrl(home), width: 80, height: 80, alt: home }],
    },
    twitter: { card: 'summary', title: `${awayName} vs ${homeName}`, description: desc },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normPlayers(teamPlayers: any, teamId: number): any[] {
  return [
    ...(teamPlayers?.forwards ?? []),
    ...(teamPlayers?.defense ?? []),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ].map((p: any) => {
    const full: string = p.name?.default ?? '';
    const sp = full.indexOf(' ');
    return {
      player_id: p.playerId,
      team_id: teamId,
      goals: p.goals ?? 0,
      assists: p.assists ?? 0,
      plus_minus: p.plusMinus ?? 0,
      players: {
        first_name: sp > 0 ? full.slice(0, sp) : '',
        last_name: sp > 0 ? full.slice(sp + 1) : full,
        position_code: p.position,
      },
    };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }).sort((a: any, b: any) => (b.goals + b.assists) - (a.goals + a.assists));
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normGoalie(goalies: any[], teamId: number): any | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = (goalies ?? []).find((x: any) => x.starter) ?? goalies?.[0] ?? null;
  if (!g) return null;
  const full: string = g.name?.default ?? '';
  const sp = full.indexOf(' ');
  return {
    player_id: g.playerId,
    team_id: teamId,
    shots_against: g.shotsAgainst ?? 0,
    goals_against: g.goalsAgainst ?? 0,
    save_pct: (g.shotsAgainst ?? 0) > 0 ? (g.saves ?? 0) / g.shotsAgainst : null,
    players: { first_name: sp > 0 ? full.slice(0, sp) : '', last_name: sp > 0 ? full.slice(sp + 1) : full },
  };
}

export default async function MatchPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  const {
    game, liveData, predictions, snapshots, playerStats, goalieStats, externalOdds,
    playByPlay, headToHead, restDays, goalieSeasonStats,
  } = await fetchMatch(id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const live = liveData as any;
  const homeAbbrev: string = live?.homeTeam?.abbrev ?? game?.home_team?.abbrev ?? '?';
  const awayAbbrev: string = live?.awayTeam?.abbrev ?? game?.away_team?.abbrev ?? '?';
  const homeName: string   = live?.homeTeam?.name?.default ?? game?.home_team?.name ?? homeAbbrev;
  const awayName: string   = live?.awayTeam?.name?.default ?? game?.away_team?.name ?? awayAbbrev;
  const homeLogo = live?.homeTeam?.logo ?? teamLogoUrl(homeAbbrev);
  const awayLogo = live?.awayTeam?.logo ?? teamLogoUrl(awayAbbrev);
  const homeId   = game?.home_team_id ?? live?.homeTeam?.id;
  const awayId   = game?.away_team_id ?? live?.awayTeam?.id;

  const homeScore = live?.homeTeam?.score ?? game?.home_score ?? null;
  const awayScore = live?.awayTeam?.score ?? game?.away_score ?? null;
  const gameState = live?.gameState ?? game?.game_state ?? 'FUT';
  const isLive    = gameState === 'LIVE' || gameState === 'CRIT';
  const isFinal   = gameState === 'FINAL' || gameState === 'OFF';
  const gameDate  = game?.game_date ?? live?.gameDate ?? '';
  const dateLabel = gameDate
    ? new Date(gameDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Scheduled';

  const prediction = predictions?.[0] ?? null;
  const outcome    = prediction?.prediction_outcomes?.[0] ?? null;
  const favoredIsHome = prediction ? prediction.home_win_probability >= prediction.away_win_probability : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const threeStars: any[] = (game as any)?.three_stars ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamGameStats: any[] = (game as any)?.team_game_stats ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const youtubeId: string | null = (game as any)?.youtube_highlight_id ?? null;

  const nhlUrl = game?.id && gameDate
    ? `https://www.nhl.com/gamecenter/${awayAbbrev.toLowerCase()}-vs-${homeAbbrev.toLowerCase()}/${gameDate.replaceAll('-', '/')}/${game.id}`
    : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeSnap = (snapshots ?? []).find((s: any) => s.is_home);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awaySnap = (snapshots ?? []).find((s: any) => !s.is_home);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeSkaters = (homeSnap?.skater_snapshots as any[]) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awaySkaters = (awaySnap?.skater_snapshots as any[]) ?? [];

  const homeStats = (playerStats ?? []).filter((p: { team_id: number }) => p.team_id === homeId);
  const awayStats = (playerStats ?? []).filter((p: { team_id: number }) => p.team_id === awayId);
  const homeGoalie = (goalieStats ?? []).find((g: { team_id: number }) => g.team_id === homeId);
  const awayGoalie = (goalieStats ?? []).find((g: { team_id: number }) => g.team_id === awayId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const liveBoxscore = (live?.playerByGameStats as any) ?? null;
  const hasBoxscore = liveBoxscore != null;
  const homeBoxPlayers = hasBoxscore ? normPlayers(liveBoxscore.homeTeam, homeId) : null;
  const awayBoxPlayers = hasBoxscore ? normPlayers(liveBoxscore.awayTeam, awayId) : null;
  const homeBoxGoalie  = hasBoxscore ? normGoalie(liveBoxscore.homeTeam?.goalies ?? [], homeId) : null;
  const awayBoxGoalie  = hasBoxscore ? normGoalie(liveBoxscore.awayTeam?.goalies ?? [], awayId) : null;

  // ── Period breakdown (real, from play-by-play goal sequence) ──────────────
  const currentPeriod = live?.periodDescriptor?.number ?? (isFinal ? Math.max(3, ...playByPlay.momentum.map(m => m.period)) : 1);
  const periodScores = (isLive || isFinal) ? periodScoresFromMomentum(playByPlay.momentum, currentPeriod) : undefined;
  const clockLabel = isLive ? `${periodScores?.find(p => p.isCurrent)?.label ?? ''} · ${live?.clock?.timeRemaining ?? ''}`.trim() : null;

  // ── Heating Up Tonight / Players to Watch — top real Heat scores in this game ──
  const heatRoster: HeatPlayerRow[] = [...awaySkaters, ...homeSkaters]
    .map(s => ({
      playerId: s.playerId,
      href: playerUrl(s.playerId, ...(splitName(s.playerName))),
      name: s.playerName,
      teamAbbrev: awaySkaters.includes(s) ? awayAbbrev : homeAbbrev,
      heat: ppmToHeat(s.momentumPpm ?? s.compositePpm),
      delta: ppmToHeat(s.momentumPpm ?? s.compositePpm) - ppmToHeat(s.seasonPpm ?? s.compositePpm),
      line: `${s.position ?? ''} · Energy ${s.energyBar ?? 100}`,
    }))
    .sort((a, b) => b.heat - a.heat)
    .slice(0, 4);

  function splitName(full: string): [string, string] {
    const sp = full.indexOf(' ');
    return sp > 0 ? [full.slice(0, sp), full.slice(sp + 1)] : [full, ''];
  }

  // ── Live stats grid (real per-game team stats, once the pipeline has captured them) ──
  const statCategory = (cat: string) => teamGameStats.find(s => s.category === cat);
  const liveStatsRows = (() => {
    if (!(isLive || isFinal) || teamGameStats.length === 0) return [];
    const rows: { label: string; away: string | number; home: string | number }[] = [];
    const sog = statCategory('sog');
    if (sog) rows.push({ label: 'Shots', away: sog.awayValue, home: sog.homeValue });
    const hits = statCategory('hits');
    if (hits) rows.push({ label: 'Hits', away: hits.awayValue, home: hits.homeValue });
    const blocked = statCategory('blockedShots');
    if (blocked) rows.push({ label: 'Blocks', away: blocked.awayValue, home: blocked.homeValue });
    const fo = statCategory('faceoffWinningPctg');
    if (fo) rows.push({ label: 'Faceoff %', away: Math.round(fo.awayValue * 100), home: Math.round(fo.homeValue * 100) });
    const give = statCategory('giveaways');
    if (give) rows.push({ label: 'Giveaways', away: give.awayValue, home: give.homeValue });
    const pp = statCategory('powerPlay');
    if (pp) rows.push({ label: 'Power play', away: pp.awayValue, home: pp.homeValue });
    return rows;
  })();

  // ── Prediction card chips (real, derived from the model's own factor inputs) ──
  const predictionChips: string[] = [];
  if (prediction) {
    const favAbbrev = favoredIsHome ? homeAbbrev : awayAbbrev;
    const favEnergy = favoredIsHome ? prediction.home_energy_bar : prediction.away_energy_bar;
    const oppEnergy = favoredIsHome ? prediction.away_energy_bar : prediction.home_energy_bar;
    if (favEnergy != null && oppEnergy != null && favEnergy - oppEnergy >= 8) predictionChips.push(`${favAbbrev} energy edge`);
    const favSos = favoredIsHome ? prediction.home_sos_multiplier : prediction.away_sos_multiplier;
    const oppSos = favoredIsHome ? prediction.away_sos_multiplier : prediction.home_sos_multiplier;
    if (favSos != null && oppSos != null && favSos - oppSos >= 0.1) predictionChips.push(`${favAbbrev} easier schedule`);
    const favRoster = favoredIsHome ? homeSkaters : awaySkaters;
    const topStar = [...favRoster].sort((a, b) => (b.compositePpm ?? 0) - (a.compositePpm ?? 0))[0];
    if (topStar) predictionChips.push(`${topStar.playerName} Heat ${ppmToHeat(topStar.compositePpm)}`);
  }

  // ── Prediction factors (two-sided comparison strip) ─────────────────────────
  // Built entirely from data already computed and displayed elsewhere on this
  // page (skater snapshot Heat, prediction snapshot energy bars) — never from
  // the model's internal weights. Deliberately narrow: two rows, not a new
  // analytics surface.
  type PredictionFactor = { label: string; away: { name?: string; value: number | null }; home: { name?: string; value: number | null } };
  const predictionFactors: PredictionFactor[] = [];
  if (prediction) {
    const awayTopStar = [...awaySkaters].sort((a, b) => (b.compositePpm ?? 0) - (a.compositePpm ?? 0))[0];
    const homeTopStar = [...homeSkaters].sort((a, b) => (b.compositePpm ?? 0) - (a.compositePpm ?? 0))[0];
    if (awayTopStar && homeTopStar) {
      predictionFactors.push({
        label: 'Top Heat',
        away: { name: awayTopStar.playerName, value: ppmToHeat(awayTopStar.compositePpm) },
        home: { name: homeTopStar.playerName, value: ppmToHeat(homeTopStar.compositePpm) },
      });
    }
    if (prediction.away_energy_bar != null && prediction.home_energy_bar != null) {
      predictionFactors.push({
        label: 'Energy',
        away: { value: prediction.away_energy_bar },
        home: { value: prediction.home_energy_bar },
      });
    }
  }

  // ── Accuracy for the "Our Pick" card ──────────────────────────────────────
  let accuracyYtd: number | null = null;
  if (prediction) {
    const accuracy = await fetchAccuracy().catch(() => null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active = (accuracy?.modelStats as any[])?.find((m: any) => m.version === prediction.model_version);
    accuracyYtd = active?.winnerAccuracyPct ?? null;
  }

  // ── Heat Impact (FINAL only): pre-game snapshot Heat vs. most recent Heat ──
  let heatImpactUp: Mover[] = [];
  let heatImpactDown: Mover[] = [];
  if (isFinal) {
    const allSkaters = [...awaySkaters.map(s => ({ ...s, teamAbbrev: awayAbbrev })), ...homeSkaters.map(s => ({ ...s, teamAbbrev: homeAbbrev }))];
    const postHeat = await fetchPostGameHeat(allSkaters.map(s => s.playerId)).catch(() => new Map<number, number>());
    const movers: Mover[] = allSkaters
      .filter(s => postHeat.has(s.playerId))
      .map(s => {
        const before = ppmToHeat(s.compositePpm);
        const after = ppmToHeat(postHeat.get(s.playerId));
        return { playerId: s.playerId, href: playerUrl(s.playerId, ...splitName(s.playerName)), name: s.playerName, teamAbbrev: s.teamAbbrev, before, after, delta: after - before };
      })
      .filter(m => m.delta !== 0);
    heatImpactUp = movers.filter(m => m.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 3);
    heatImpactDown = movers.filter(m => m.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 3);
  }

  // ── Recap (FINAL only): factual, templated from real box-score data ────────
  let recapHeadline = '';
  let recapBody = '';
  let recapHref: string | null = null;
  if (isFinal) {
    const winnerAbbrev = (homeScore ?? 0) > (awayScore ?? 0) ? homeAbbrev : awayAbbrev;
    const loserAbbrev = winnerAbbrev === homeAbbrev ? awayAbbrev : homeAbbrev;
    const topStar = threeStars[0];
    recapHeadline = topStar
      ? `${topStar.name?.default ?? 'Top performer'} leads ${winnerAbbrev} past ${loserAbbrev}`
      : `${winnerAbbrev} defeats ${loserAbbrev} ${Math.max(homeScore ?? 0, awayScore ?? 0)}–${Math.min(homeScore ?? 0, awayScore ?? 0)}`;
    const statLine = topStar
      ? topStar.position === 'G'
        ? `${topStar.savePctg !== undefined ? (topStar.savePctg * 100).toFixed(1) + '% save percentage' : 'strong night in net'}`
        : `${topStar.points ?? 0} points (${topStar.goals ?? 0}G ${topStar.assists ?? 0}A)`
      : '';
    const pp = statCategory('powerPlay');
    const ppNote = pp ? ` Power play went ${awayAbbrev} ${pp.awayValue} and ${homeAbbrev} ${pp.homeValue}.` : '';
    recapBody = topStar
      ? `${topStar.name?.default} finished with ${statLine}. Final score: ${awayAbbrev} ${awayScore}–${homeScore} ${homeAbbrev}.${ppNote}`
      : `Final score: ${awayAbbrev} ${awayScore}–${homeScore} ${homeAbbrev}.${ppNote}`;

    const dailyRecap = await fetchRecap(gameDate).catch(() => null);
    if (dailyRecap) recapHref = recapUrl(gameDate, dailyRecap.title);
  }

  // ── Series tracker (playoff games only) ────────────────────────────────────
  let seriesInfo = null;
  if (isPlayoffGameId(Number(id))) {
    const gameSeasonYear = Math.floor(Number(id) / 1000000);
    const allSeries = await fetchSeriesStandings(gameSeasonYear).catch(() => new Map());
    const { round, series } = parsePlayoffGameId(Number(id));
    seriesInfo = allSeries.get(`${round}-${series}`) ?? null;
  }
  const seriesLabel = seriesInfo ? `R${seriesInfo.round} G${(seriesInfo.seriesGames.length || 0) + (seriesInfo.isComplete ? 0 : 1)}` : null;

  // ── Pregame-only context: goalie matchup, players to watch, special teams ──
  const isUpcoming = !isLive && !isFinal;
  type SpecialTeamsSide = { powerPlayPct: number | null; penaltyKillPct: number | null };
  let specialTeams: { home: SpecialTeamsSide; away: SpecialTeamsSide } | null = null;
  if (isUpcoming && homeId && awayId) {
    const [homeST, awayST] = await Promise.all([
      fetchTeamSpecialTeams(homeId).catch(() => ({ powerPlayPct: null, penaltyKillPct: null })),
      fetchTeamSpecialTeams(awayId).catch(() => ({ powerPlayPct: null, penaltyKillPct: null })),
    ]);
    specialTeams = { home: homeST, away: awayST };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeGoalieSnap = (homeSnap?.goalie_snapshot as any) ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awayGoalieSnap = (awaySnap?.goalie_snapshot as any) ?? null;

  const homeOutCount = homeSkaters.filter(s => s.injuryStatus).length;
  const awayOutCount = awaySkaters.filter(s => s.injuryStatus).length;

  return (
    <div className="max-w-6xl mx-auto pb-20 md:pb-0">

      <GameHero
        state={isLive ? 'LIVE' : isFinal ? 'FINAL' : 'UPCOMING'}
        away={{ id: awayId, abbrev: awayAbbrev, name: awayName, logo: awayLogo, score: awayScore }}
        home={{ id: homeId, abbrev: homeAbbrev, name: homeName, logo: homeLogo, score: homeScore }}
        periodScores={periodScores}
        clock={clockLabel}
        dateLabel={dateLabel}
        seriesLabel={seriesLabel}
        pickResult={isFinal && outcome ? (outcome.correct_winner ? 'hit' : 'miss') : null}
        storyline={isFinal ? recapBody.split('.')[0] + '.' : null}
        favoredIsHome={favoredIsHome}
      />

      <div className="flex justify-end mb-4">
        <ShareButton title={`${awayName} vs ${homeName} — momentum.`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-4">
          {isLive && (
            <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text)' }}>Momentum Tracker · Live</div>
              <h2 className="text-lg font-bold font-editorial mb-2" style={{ color: 'var(--text-bright)' }}>Who&apos;s pushing right now.</h2>
              <MomentumTracker momentum={playByPlay.momentum} homeAbbrev={homeAbbrev} awayAbbrev={awayAbbrev} />
            </div>
          )}

          {isLive && (
            <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text)' }}>Play-by-Play</div>
              <h2 className="text-lg font-bold font-editorial mb-2" style={{ color: 'var(--text-bright)' }}>Recent action.</h2>
              <RecentActionFeed plays={playByPlay.recentPlays} />
            </div>
          )}

          {isFinal && (
            <>
              <ThreeStarsRow stars={threeStars} heatByPlayerId={new Map([...awaySkaters, ...homeSkaters].map(s => [s.playerId as number, ppmToHeat(s.momentumPpm ?? s.compositePpm)]))} />
              {prediction && (
                <PredictionCard
                  mode="final"
                  favoredAbbrev={favoredIsHome ? homeAbbrev : awayAbbrev}
                  favoredPct={Math.round(Math.max(prediction.home_win_probability, prediction.away_win_probability) * 100)}
                  correct={outcome?.correct_winner ?? null}
                  accuracyYtd={accuracyYtd}
                  chips={predictionChips}
                  factors={predictionFactors}
                  awayAbbrev={awayAbbrev}
                  homeAbbrev={homeAbbrev}
                />
              )}
              <HeatImpactCard up={heatImpactUp} down={heatImpactDown} />
            </>
          )}

          {isUpcoming && prediction && (
            <PredictionCard
              mode="pregame"
              favoredAbbrev={favoredIsHome ? homeAbbrev : awayAbbrev}
              favoredPct={Math.round(Math.max(prediction.home_win_probability, prediction.away_win_probability) * 100)}
              accuracyYtd={accuracyYtd}
              chips={predictionChips}
              factors={predictionFactors}
              awayAbbrev={awayAbbrev}
              homeAbbrev={homeAbbrev}
            />
          )}

          {isUpcoming && (homeGoalieSnap || awayGoalieSnap) && (
            <GoalieMatchupCard
              away={{
                name: awayGoalieSnap?.playerName ?? 'TBD',
                abbrev: awayAbbrev,
                savePct: goalieSeasonStats.get(awayGoalieSnap?.playerId)?.savePct ?? awayGoalieSnap?.seasonSavePct ?? null,
                gaa: goalieSeasonStats.get(awayGoalieSnap?.playerId)?.gaa ?? null,
                gamesPlayed: goalieSeasonStats.get(awayGoalieSnap?.playerId)?.gamesPlayed ?? 0,
              }}
              home={{
                name: homeGoalieSnap?.playerName ?? 'TBD',
                abbrev: homeAbbrev,
                savePct: goalieSeasonStats.get(homeGoalieSnap?.playerId)?.savePct ?? homeGoalieSnap?.seasonSavePct ?? null,
                gaa: goalieSeasonStats.get(homeGoalieSnap?.playerId)?.gaa ?? null,
                gamesPlayed: goalieSeasonStats.get(homeGoalieSnap?.playerId)?.gamesPlayed ?? 0,
              }}
            />
          )}

          {isUpcoming && (
            <PlayersToWatchCard
              players={heatRoster.map(p => ({ playerId: p.playerId, href: p.href, name: p.name, teamAbbrev: p.teamAbbrev, position: p.line.split(' · ')[0] || null, heat: p.heat, line: p.line }))}
            />
          )}

          {isUpcoming && specialTeams && (
            <SpecialTeamsCard away={specialTeams.away} home={specialTeams.home} />
          )}

          {isUpcoming && headToHead.length > 0 && (
            <HeadToHeadCard meetings={headToHead} homeAbbrev={homeAbbrev} awayAbbrev={awayAbbrev} />
          )}

          {isUpcoming && (
            <LineupContextCard
              homeAbbrev={homeAbbrev} awayAbbrev={awayAbbrev}
              homeOutCount={homeOutCount} awayOutCount={awayOutCount}
              restDays={restDays}
            />
          )}
        </div>

        {/* ── Side column ── */}
        <div className="space-y-4">
          {heatRoster.length > 0 && (isLive || isFinal) && <HeatingUpCard players={heatRoster} />}
          {prediction && (isLive || isFinal) && (
            <WinProbabilityCard
              title={isLive ? 'Live Win Probability' : 'Win Probability'}
              homeAbbrev={homeAbbrev} awayAbbrev={awayAbbrev}
              homeWinPct={Math.round(prediction.home_win_probability * 100)}
              awayWinPct={Math.round(prediction.away_win_probability * 100)}
            />
          )}
          {liveStatsRows.length > 0 && <LiveStatsGrid rows={liveStatsRows} awayAbbrev={awayAbbrev} homeAbbrev={homeAbbrev} />}
          {isFinal && <RecapCard headline={recapHeadline} body={recapBody} recapHref={recapHref} />}
          {isFinal && <HighlightsCard youtubeId={youtubeId} nhlUrl={nhlUrl} awayAbbrev={awayAbbrev} homeAbbrev={homeAbbrev} />}
          {isFinal && seriesInfo && <SeriesTrackerCard series={seriesInfo} />}
          {isUpcoming && seriesInfo && <SeriesTrackerCard series={seriesInfo} />}
        </div>
      </div>

      {/* ── Market Odds (unchanged — already real, no-vig, multi-book) ── */}
      {externalOdds && externalOdds.length > 0 && (() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allRows = externalOdds as any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = allRows.filter((o: any) => o.home_odds && o.away_odds);
        if (!rows.length) return null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pinnacle = rows.find((o: any) => o.bookmaker === 'pinnacle') ?? rows[0];
        const pinProb  = decimalToNormProb(pinnacle.home_odds, pinnacle.away_odds, pinnacle.draw_odds);
        const pinH  = Math.round(pinProb.home * 100);
        const pinA  = Math.round(pinProb.away * 100);
        const pinOT = pinProb.draw ? Math.round(pinProb.draw * 100) : 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const otherBooks = rows.filter((o: any) => o.bookmaker !== pinnacle.bookmaker);

        const ProbBar = ({ a, h, opacity = 1 }: { a: number; h: number; opacity?: number }) => (
          <div className="flex h-3 rounded-full overflow-hidden" style={{ opacity }}>
            <div style={{ flexGrow: Math.round(a * 1000), background: 'var(--silver)' }} />
            <div style={{ flexGrow: Math.round(h * 1000), background: 'var(--heat)' }} />
          </div>
        );

        return (
          <div className="rounded-xl border p-4 mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Betting Markets</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text)', opacity: 0.6 }}>For reference — {rows.length} bookmaker{rows.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                  <span style={{ color: 'var(--amber)', opacity: 0.7 }}>◆</span>
                  {formatBookmaker(pinnacle.bookmaker)}
                  {pinnacle.bookmaker === 'pinnacle' && (
                    <span className="font-mono px-1 rounded" style={{ background: 'var(--border)', color: 'var(--text)', fontSize: '10px' }}>sharpest</span>
                  )}
                </span>
                <span className="text-xs font-mono" style={{ color: 'var(--text)', opacity: 0.5 }}>hover for odds</span>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <img src={awayLogo} alt={awayAbbrev} className="w-5 h-5 object-contain flex-shrink-0" />
                <div className="flex-1"><ProbBar a={pinA} h={pinH} opacity={0.6} /></div>
                <img src={homeLogo} alt={homeAbbrev} className="w-5 h-5 object-contain flex-shrink-0" />
              </div>
              <div className="flex justify-between text-xs font-mono cursor-default"
                title={`${awayAbbrev} ${pinnacle.away_odds.toFixed(2)}${pinnacle.draw_odds ? ` · OT ${pinnacle.draw_odds.toFixed(2)}` : ''} · ${homeAbbrev} ${pinnacle.home_odds.toFixed(2)}`}>
                <span style={{ color: pinA >= pinH ? 'var(--heat)' : 'var(--text)', opacity: pinA >= pinH ? 1 : 0.4, fontWeight: pinA >= pinH ? 600 : 400 }}>{awayAbbrev} {pinA}%</span>
                {pinOT > 0 && <span style={{ color: 'var(--text)', opacity: 0.5 }}>OT {pinOT}%</span>}
                <span style={{ color: pinH > pinA ? 'var(--heat)' : 'var(--text)', opacity: pinH > pinA ? 1 : 0.4, fontWeight: pinH > pinA ? 600 : 400 }}>{homeAbbrev} {pinH}%</span>
              </div>
            </div>
            {otherBooks.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {otherBooks.map((o: any) => {
                  const op = decimalToNormProb(o.home_odds, o.away_odds, o.draw_odds);
                  const oH = Math.round(op.home * 100);
                  const oA = Math.round(op.away * 100);
                  return (
                    <div key={o.id} className="rounded-lg p-2.5 flex flex-col gap-1 cursor-default"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                      title={`${awayAbbrev} ${o.away_odds.toFixed(2)}${o.draw_odds ? ` · OT ${o.draw_odds.toFixed(2)}` : ''} · ${homeAbbrev} ${o.home_odds.toFixed(2)}`}>
                      <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{formatBookmaker(o.bookmaker)}</span>
                      <div className="flex justify-between text-xs font-mono">
                        <span style={{ color: oA >= oH ? 'var(--heat)' : 'var(--text)', opacity: oA >= oH ? 1 : 0.4, fontWeight: oA >= oH ? 600 : 400 }}>{awayAbbrev} {oA}%</span>
                        <span style={{ color: oH > oA ? 'var(--heat)' : 'var(--text)', opacity: oH > oA ? 1 : 0.4, fontWeight: oH > oA ? 600 : 400 }}>{homeAbbrev} {oH}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs mt-3" style={{ color: 'var(--text)', opacity: 0.4 }}>Win % removes bookmaker margin · hover for decimal odds</p>
          </div>
        );
      })()}

      {/* ── Full lineups — depth on demand ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <LineupCard
          abbrev={awayAbbrev} teamName={awayName} logo={awayLogo}
          skaters={isLive ? (awayBoxPlayers ?? awaySkaters) : isFinal ? (awayStats.length ? awayStats : (awayBoxPlayers ?? awaySkaters)) : awaySkaters}
          goalie={isLive ? awayBoxGoalie : isFinal ? (awayGoalie ?? awayBoxGoalie) : awayGoalieSnap ? { players: { first_name: '', last_name: awayGoalieSnap.playerName }, shots_against: null, goals_against: null, save_pct: awayGoalieSnap.seasonSavePct } : null}
          isLive={isLive || isFinal}
          teamId={awayId}
        />
        <LineupCard
          abbrev={homeAbbrev} teamName={homeName} logo={homeLogo}
          skaters={isLive ? (homeBoxPlayers ?? homeSkaters) : isFinal ? (homeStats.length ? homeStats : (homeBoxPlayers ?? homeSkaters)) : homeSkaters}
          goalie={isLive ? homeBoxGoalie : isFinal ? (homeGoalie ?? homeBoxGoalie) : homeGoalieSnap ? { players: { first_name: '', last_name: homeGoalieSnap.playerName }, shots_against: null, goals_against: null, save_pct: homeGoalieSnap.seasonSavePct } : null}
          isLive={isLive || isFinal}
          teamId={homeId}
        />
      </div>
    </div>
  );
}

function LineupCard({
  abbrev, teamName, logo, skaters, goalie, isLive, teamId,
}: {
  abbrev: string;
  teamName: string;
  logo: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  skaters: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  goalie: any;
  isLive: boolean;
  teamId: number;
}) {
  if (!skaters?.length) return null;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <div className="px-4 py-3 border-b flex items-center gap-2" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <img src={logo} alt={abbrev} className="w-6 h-6 object-contain" />
        <Link href={teamId ? teamUrl(teamId, teamName) : '#'} className="text-sm font-semibold hover:opacity-80" style={{ color: 'var(--text-bright)' }}>{abbrev}</Link>
        <span className="text-xs" style={{ color: 'var(--text)' }}>{isLive ? 'Game Stats' : 'Momentum Inputs'}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--bg-card)' }}>
            <tr>
              <th className="px-3 py-1.5 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>Player</th>
              {isLive
                ? <>
                    <th className="px-3 py-1.5 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>G</th>
                    <th className="px-3 py-1.5 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>A</th>
                    <th className="px-3 py-1.5 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>Pts</th>
                    <th className="px-3 py-1.5 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>+/-</th>
                  </>
                : <>
                    <th className="px-3 py-1.5 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>cPPM</th>
                    <th className="px-3 py-1.5 text-right text-xs font-semibold uppercase" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>Nrg</th>
                  </>
              }
            </tr>
          </thead>
          <tbody>
            {skaters.slice(0, 12).map((p, i) => {
              const name = isLive ? `${p.players?.first_name?.[0]}. ${p.players?.last_name}` : `${p.playerName ?? ''}`;
              const playerId = isLive ? p.player_id : p.playerId;
              const playerHref = isLive && p.player_id && p.players?.first_name
                ? playerUrl(p.player_id, p.players.first_name, p.players.last_name)
                : playerId ? `/players/${playerId}` : '#';
              return (
                <tr key={i} className="border-t" style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)' }}>
                  <td className="px-3 py-1.5">
                    <Link href={playerHref} className="text-xs hover:opacity-80 flex items-center gap-1" style={{ color: 'var(--text-bright)' }}>
                      {name}
                      {p.injuryStatus && (
                        <span className="text-xs px-1 py-0.5 rounded font-bold" style={{ background: 'rgba(239,68,68,0.18)', color: 'var(--red)' }}>INJURED</span>
                      )}
                    </Link>
                  </td>
                  {isLive
                    ? <>
                        <td className="px-3 py-1.5 text-right font-mono text-xs" style={{ color: 'var(--text-bright)' }}>{p.goals ?? 0}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-xs" style={{ color: 'var(--text-bright)' }}>{p.assists ?? 0}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-xs font-bold" style={{ color: 'var(--heat)' }}>{(p.goals ?? 0) + (p.assists ?? 0)}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-xs" style={{ color: Number(p.plus_minus) > 0 ? 'var(--rise)' : Number(p.plus_minus) < 0 ? 'var(--red)' : 'var(--text)' }}>
                          {Number(p.plus_minus) > 0 ? `+${p.plus_minus}` : p.plus_minus ?? 0}
                        </td>
                      </>
                    : <>
                        <td className="px-3 py-1.5 text-right font-mono text-xs" style={{ color: 'var(--heat)' }}>{Number(p.compositePpm ?? 0).toFixed(4)}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-xs" style={{ color: 'var(--amber)' }}>{p.energyBar ?? 100}</td>
                      </>
                  }
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {goalie && (
        <div className="px-4 py-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <span className="text-xs" style={{ color: 'var(--text)' }}>G: {goalie.players?.first_name?.[0]}. {goalie.players?.last_name}</span>
          <span className="text-xs font-mono" style={{ color: 'var(--silver)' }}>
            {goalie.shots_against != null && goalie.goals_against != null ? `${goalie.shots_against - goalie.goals_against}/${goalie.shots_against} SV · ` : ''}
            {goalie.save_pct ? (Number(goalie.save_pct) * 100).toFixed(1) : '—'}%
          </span>
        </div>
      )}
    </div>
  );
}
