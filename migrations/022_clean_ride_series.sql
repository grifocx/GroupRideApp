-- Clean implementation of ride series functionality
BEGIN;

-- First remove any existing columns to ensure clean state
ALTER TABLE rides DROP COLUMN IF EXISTS is_recurring;
ALTER TABLE rides DROP COLUMN IF EXISTS recurring_type;
ALTER TABLE rides DROP COLUMN IF EXISTS recurring_day;
ALTER TABLE rides DROP COLUMN IF EXISTS series_id;

-- Now add the columns with proper constraints
ALTER TABLE rides 
  ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
  ADD COLUMN recurring_type TEXT CHECK (recurring_type IN ('weekly', 'monthly') OR recurring_type IS NULL),
  ADD COLUMN recurring_day INTEGER CHECK (recurring_day >= 0 AND recurring_day <= 31 OR recurring_day IS NULL),
  ADD COLUMN series_id INTEGER REFERENCES rides(id);

COMMIT;
