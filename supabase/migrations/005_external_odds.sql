-- External betting odds from The Odds API (https://the-odds-api.com)
-- One row per game × bookmaker — upserted daily before scheduled games tip off.
-- home_odds / away_odds are decimal format (e.g. 1.85 = -118 American).
-- draw_odds is the OT/SO period offered by European 3-way markets; null for 2-way lines.

create table if not exists external_odds (
  id          uuid        primary key default gen_random_uuid(),
  game_id     integer     not null,
  source      text        not null default 'the-odds-api',
  bookmaker   text        not null,          -- e.g. 'tipsport', 'pinnacle'
  home_odds   numeric(6,3),                  -- decimal odds for home regulation win
  away_odds   numeric(6,3),                  -- decimal odds for away regulation win
  draw_odds   numeric(6,3),                  -- OT/draw odds (3-way markets only)
  fetched_at  timestamptz not null default now(),

  unique (game_id, bookmaker)
);

create index if not exists eo_game_idx    on external_odds (game_id);
create index if not exists eo_fetched_idx on external_odds (fetched_at);
