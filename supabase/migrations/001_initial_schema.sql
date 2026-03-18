-- ─────────────────────────────────────────────────────────────────────────────
-- NHL Momentum Analytics — Initial Schema
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── Reference Data ───────────────────────────────────────────────────────────

create table teams (
  id            integer primary key,
  name          text not null,
  abbrev        text not null unique,
  logo_url      text,
  conference    text,
  division      text,
  updated_at    timestamptz default now()
);

create table players (
  id              integer primary key,
  first_name      text not null,
  last_name       text not null,
  full_name       text generated always as (first_name || ' ' || last_name) stored,
  position_code   text not null,   -- C, L, R, D, G
  sweater_number  integer,
  team_id         integer references teams(id),
  headshot_url    text,
  is_active       boolean default true,
  injury_status   text,            -- null = healthy
  updated_at      timestamptz default now()
);

-- ─── Raw Game Data ─────────────────────────────────────────────────────────────

create table games (
  id              integer primary key,
  game_date       date not null,
  start_time_utc  timestamptz,
  home_team_id    integer references teams(id),
  away_team_id    integer references teams(id),
  home_score      integer,         -- null until game ends
  away_score      integer,
  game_state      text not null,   -- FUT, PRE, LIVE, FINAL, OFF
  venue           text,
  season          text not null,   -- e.g. "20252026"
  updated_at      timestamptz default now()
);

create index games_date_idx on games(game_date);
create index games_state_idx on games(game_state);

-- Raw per-player-per-game stats (skaters)
create table game_player_stats (
  id                    uuid primary key default uuid_generate_v4(),
  game_id               integer references games(id),
  player_id             integer references players(id),
  team_id               integer references teams(id),
  goals                 integer default 0,
  assists               integer default 0,
  points                integer generated always as (goals + assists) stored,
  plus_minus            integer default 0,
  hits                  integer default 0,
  blocked_shots         integer default 0,
  shots_on_goal         integer default 0,
  toi_seconds           integer default 0,
  pp_goals              integer default 0,
  pp_points             integer default 0,
  pp_toi_seconds        integer default 0,
  sh_goals              integer default 0,
  sh_points             integer default 0,
  sh_toi_seconds        integer default 0,
  recorded_at           timestamptz default now(),
  unique(game_id, player_id)
);

create index gps_player_idx on game_player_stats(player_id);
create index gps_game_idx   on game_player_stats(game_id);

-- Raw per-goalie-per-game stats
create table game_goalie_stats (
  id              uuid primary key default uuid_generate_v4(),
  game_id         integer references games(id),
  player_id       integer references players(id),
  team_id         integer references teams(id),
  shots_against   integer default 0,
  goals_against   integer default 0,
  save_pct        numeric(5,4) default 0,
  decision        text,            -- W, L, O, null
  toi_seconds     integer default 0,
  recorded_at     timestamptz default now(),
  unique(game_id, player_id)
);

create index ggs_player_idx on game_goalie_stats(player_id);

-- ─── Computed Metrics (Snapshots) ─────────────────────────────────────────────
-- Stored after each calculation run so we can track metric evolution over time

create table player_metric_snapshots (
  id                    uuid primary key default uuid_generate_v4(),
  player_id             integer references players(id),
  -- Momentum layer (last 5 games)
  momentum_games        integer,
  momentum_goals        integer,
  momentum_assists      integer,
  momentum_points       integer,
  momentum_toi_sec      integer,
  momentum_ppm          numeric(8,4),
  momentum_shooting_pct numeric(5,4),
  momentum_sh_toi_sec   integer,
  -- Season layer
  season_games          integer,
  season_goals          integer,
  season_assists        integer,
  season_points         integer,
  season_toi_sec        integer,
  season_ppm            numeric(8,4),
  season_shooting_pct   numeric(5,4),
  -- Career layer
  career_games          integer,
  career_ppm            numeric(8,4),
  -- Composite (weighted)
  composite_ppm         numeric(8,4),
  sos_coefficient       numeric(4,3),
  energy_bar            integer,
  momentum_rank         integer,
  breakout_delta        numeric(8,4),   -- momentum_ppm - season_ppm
  calculated_at         timestamptz default now()
);

create index pms_player_idx   on player_metric_snapshots(player_id);
create index pms_calc_idx     on player_metric_snapshots(calculated_at desc);

-- ─── Predictions & Outcomes ───────────────────────────────────────────────────

create table model_versions (
  version         text primary key,             -- e.g. "v1.0", "v1.1-sos-fix"
  description     text,
  formula_spec    jsonb,                        -- full formula parameters stored as JSON
  created_at      timestamptz default now(),
  is_active       boolean default false
);

-- Seed the first model version
insert into model_versions (version, description, is_active) values
  ('v1.0', 'Initial statistical model — PRD formula, SOS 0.8-1.2, Energy Bar linear penalty', true);

create table predictions (
  id                          uuid primary key default uuid_generate_v4(),
  game_id                     integer references games(id),
  model_version               text references model_versions(version),
  predicted_home_score        numeric(4,2),
  predicted_away_score        numeric(4,2),
  home_win_probability        numeric(4,3),
  away_win_probability        numeric(4,3),
  ot_probability              numeric(4,3),
  -- Factor breakdown (for auditability)
  home_offensive_potential    numeric(8,4),
  away_offensive_potential    numeric(8,4),
  home_defensive_filter       numeric(8,4),
  away_defensive_filter       numeric(8,4),
  home_sos_multiplier         numeric(4,3),
  away_sos_multiplier         numeric(4,3),
  home_energy_bar             integer,
  away_energy_bar             integer,
  discipline_penalty_applied  boolean default false,
  injured_players_excluded    integer[],        -- array of player_ids
  input_snapshot              jsonb not null,   -- full input state for full auditability
  created_at                  timestamptz default now(),
  unique(game_id, model_version)
);

create index pred_game_idx  on predictions(game_id);
create index pred_model_idx on predictions(model_version);

create table prediction_outcomes (
  id                  uuid primary key default uuid_generate_v4(),
  prediction_id       uuid references predictions(id),
  game_id             integer references games(id),
  actual_home_score   integer not null,
  actual_away_score   integer not null,
  home_score_error    numeric(4,2) not null,  -- populated by app: abs(actual - predicted)
  away_score_error    numeric(4,2) not null,
  correct_winner      boolean,
  recorded_at         timestamptz default now(),
  unique(game_id)
);

create index po_pred_idx on prediction_outcomes(prediction_id);

-- ─── Accuracy View ────────────────────────────────────────────────────────────
-- Query this to compare model versions

create view model_accuracy as
select
  p.model_version,
  count(*)                              as total_predictions,
  round(avg(po.home_score_error), 3)    as avg_home_error,
  round(avg(po.away_score_error), 3)    as avg_away_error,
  round(avg(po.home_score_error + po.away_score_error), 3) as avg_total_error,
  round(100.0 * sum(case when po.correct_winner then 1 else 0 end) / count(*), 1) as winner_accuracy_pct
from predictions p
join prediction_outcomes po on po.prediction_id = p.id
group by p.model_version
order by p.model_version;
