-- Add address column to rides table
ALTER TABLE rides ADD COLUMN IF NOT EXISTS address TEXT;

-- Make address column required after adding it
ALTER TABLE rides ALTER COLUMN address SET NOT NULL DEFAULT '';

-- Remove the default after setting it
ALTER TABLE rides ALTER COLUMN address DROP DEFAULT;
