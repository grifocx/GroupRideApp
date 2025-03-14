-- Add fields for ride series
ALTER TABLE rides ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS recurring_type TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS recurring_day INTEGER;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS recurring_time TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS series_id INTEGER REFERENCES rides(id);
ALTER TABLE rides ADD COLUMN IF NOT EXISTS recurring_end_date TIMESTAMP;