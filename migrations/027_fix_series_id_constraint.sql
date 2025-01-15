-- Fix series_id constraint to handle auto-incrementing IDs properly
BEGIN;

-- First remove the existing constraint if it exists
ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_series_id_fkey;

-- Update series_id to be bigint to match auto-incrementing IDs
ALTER TABLE rides ALTER COLUMN series_id TYPE bigint USING series_id::bigint;

-- Add the constraint back with proper type
ALTER TABLE rides 
  ADD CONSTRAINT rides_series_id_fkey 
  FOREIGN KEY (series_id) 
  REFERENCES rides(id) 
  ON DELETE SET NULL;

COMMIT;
