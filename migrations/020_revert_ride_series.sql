-- Revert ride series related columns
ALTER TABLE rides DROP COLUMN IF EXISTS is_recurring;
ALTER TABLE rides DROP COLUMN IF EXISTS recurring_type;
ALTER TABLE rides DROP COLUMN IF EXISTS recurring_day;
ALTER TABLE rides DROP COLUMN IF EXISTS series_id;
