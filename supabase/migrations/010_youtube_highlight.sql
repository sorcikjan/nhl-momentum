-- Add youtube_highlight_id to games table
-- Stores the YouTube video ID for the game's highlight reel (NHL channel)
-- e.g. "sxLlpSYBrm0" → https://www.youtube.com/watch?v=sxLlpSYBrm0

alter table games
  add column if not exists youtube_highlight_id text;
