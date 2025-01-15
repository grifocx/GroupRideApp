-- Add missing recurring_time column
ALTER TABLE rides ADD COLUMN IF NOT EXISTS recurring_time TEXT;
