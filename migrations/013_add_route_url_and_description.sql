-- Add route_url and description columns to rides table
ALTER TABLE rides ADD COLUMN IF NOT EXISTS route_url TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS description TEXT;
