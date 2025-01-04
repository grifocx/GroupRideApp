
-- Drop the existing column and recreate it as text
ALTER TABLE rides DROP COLUMN difficulty;
ALTER TABLE rides ADD COLUMN difficulty text NOT NULL DEFAULT 'C';
