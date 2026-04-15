-- Add three_stars and team_game_stats to games table
-- three_stars: array of up to 3 objects {star, playerId, teamAbbrev, name, headshot, position, goals, assists, points, goalsAgainstAverage, savePctg}
-- team_game_stats: array of {category, awayValue, homeValue} — shots, hits, faceoffs, PP, giveaways, takeaways

alter table games
  add column if not exists three_stars    jsonb,
  add column if not exists team_game_stats jsonb;
