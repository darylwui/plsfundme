-- Add optional image to reward tiers
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS image_url text;
