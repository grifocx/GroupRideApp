-- Drop existing constraint if any
ALTER TABLE rides ALTER COLUMN difficulty DROP DEFAULT;

-- Change column type to VARCHAR
ALTER TABLE rides ALTER COLUMN difficulty TYPE VARCHAR(2) USING difficulty::VARCHAR(2);

-- Add back the default
ALTER TABLE rides ALTER COLUMN difficulty SET DEFAULT 'C';
