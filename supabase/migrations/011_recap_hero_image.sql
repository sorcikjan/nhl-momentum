-- Add hero_image_url to daily_recaps table
-- Stores a Pixabay image URL fetched at recap generation time.
-- Pixabay License: free for commercial use, no attribution required.
-- https://pixabay.com/service/license-summary/

alter table daily_recaps
  add column if not exists hero_image_url text;
