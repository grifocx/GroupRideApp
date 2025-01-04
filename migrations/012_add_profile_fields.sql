
-- Drop columns if they exist
ALTER TABLE users DROP COLUMN IF EXISTS display_name;
ALTER TABLE users DROP COLUMN IF EXISTS zip_code;
ALTER TABLE users DROP COLUMN IF EXISTS club;
ALTER TABLE users DROP COLUMN IF EXISTS home_bike_shop;
ALTER TABLE users DROP COLUMN IF EXISTS gender;
ALTER TABLE users DROP COLUMN IF EXISTS birthdate;

-- Add new profile fields
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN zip_code TEXT;
ALTER TABLE users ADD COLUMN club TEXT;
ALTER TABLE users ADD COLUMN home_bike_shop TEXT;
ALTER TABLE users ADD COLUMN gender TEXT;
ALTER TABLE users ADD COLUMN birthdate TIMESTAMP;
