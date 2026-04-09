-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 007: Extended player stats — standard NHL stat columns
-- Adds PIM, GWG, OTG to raw game logs and full aggregates to metric snapshots
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Raw game_player_stats: missing NHL stats ─────────────────────────────────

alter table game_player_stats
  add column if not exists pim               integer default 0,
  add column if not exists game_winning_goals integer default 0,
  add column if not exists ot_goals           integer default 0;

-- ─── player_metric_snapshots: season aggregates ───────────────────────────────

alter table player_metric_snapshots
  -- Standard counting stats (season)
  add column if not exists season_plus_minus      integer,
  add column if not exists season_pp_goals        integer,
  add column if not exists season_pp_points       integer,
  add column if not exists season_sh_goals        integer,
  add column if not exists season_sh_points       integer,
  add column if not exists season_pim             integer,
  add column if not exists season_gw_goals        integer,
  add column if not exists season_ot_goals        integer,
  add column if not exists season_shots           integer,
  add column if not exists season_hits            integer,
  add column if not exists season_blocked_shots   integer,
  -- Standard counting stats (momentum / last 5 games)
  add column if not exists momentum_plus_minus    integer,
  add column if not exists momentum_pp_goals      integer,
  add column if not exists momentum_pp_points     integer,
  add column if not exists momentum_pim           integer,
  add column if not exists momentum_shots         integer,
  add column if not exists momentum_hits          integer,
  add column if not exists momentum_blocked_shots integer;
