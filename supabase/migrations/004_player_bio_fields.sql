-- Add biographical fields to the players table.
-- Data sourced from NHL API /v1/player/{id}/landing

alter table players
  add column if not exists birth_date          date,
  add column if not exists birth_city          text,
  add column if not exists birth_state_province text,
  add column if not exists birth_country       text,
  add column if not exists height_inches       integer,
  add column if not exists weight_pounds       integer,
  add column if not exists shoots_catches      text,   -- 'L' or 'R'
  add column if not exists draft_year          integer,
  add column if not exists draft_round         integer,
  add column if not exists draft_pick          integer,  -- overall pick number
  add column if not exists draft_team_abbrev   text,
  add column if not exists career_games        integer,
  add column if not exists career_goals        integer,
  add column if not exists career_assists      integer,
  add column if not exists career_points       integer,
  add column if not exists career_plus_minus   integer;
