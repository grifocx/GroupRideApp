-- Remove recurring ride fields
ALTER TABLE rides DROP COLUMN IF EXISTS is_recurring;
ALTER TABLE rides DROP COLUMN IF EXISTS recurring_type;
ALTER TABLE rides DROP COLUMN IF EXISTS recurring_day;
