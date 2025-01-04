ALTER TABLE rides ALTER COLUMN difficulty DROP DEFAULT;
ALTER TABLE rides ALTER COLUMN difficulty TYPE text USING difficulty::text;
ALTER TABLE rides ALTER COLUMN difficulty SET DEFAULT 'C';