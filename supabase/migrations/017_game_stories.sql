-- One AI-written story per finished game, shown on the game's page (written by
-- /api/ingest/game-stories after the night recap). The night recap stays the
-- hub and links here.
create table if not exists game_stories (
  game_id      bigint primary key,
  game_date    date not null,
  headline     text not null,
  dek          text not null default '',
  body         text not null,
  generated_at timestamptz not null default now()
);

create index if not exists game_stories_date_idx on game_stories (game_date);

alter table game_stories enable row level security;
create policy "public_read" on game_stories for select using (true);
