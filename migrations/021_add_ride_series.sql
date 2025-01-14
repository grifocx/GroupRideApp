-- Add fields for ride series management
BEGIN;

ALTER TABLE rides ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS recurring_type TEXT CHECK (recurring_type IN ('weekly', 'monthly') OR recurring_type IS NULL);
ALTER TABLE rides ADD COLUMN IF NOT EXISTS recurring_day INTEGER CHECK (recurring_day >= 0 AND recurring_day <= 31 OR recurring_day IS NULL);
ALTER TABLE rides ADD COLUMN IF NOT EXISTS series_id INTEGER REFERENCES rides(id);

COMMIT;
