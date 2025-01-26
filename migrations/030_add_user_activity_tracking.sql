BEGIN;

-- Add activity tracking to rides table
ALTER TABLE rides ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS actual_distance REAL;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS actual_duration INTEGER; -- in minutes
ALTER TABLE rides ADD COLUMN IF NOT EXISTS elevation_gain INTEGER; -- in feet
ALTER TABLE rides ADD COLUMN IF NOT EXISTS average_speed REAL; -- in mph

-- Create user activity stats table
CREATE TABLE user_activity_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_distance REAL DEFAULT 0,
    total_elevation_gain INTEGER DEFAULT 0,
    total_ride_time INTEGER DEFAULT 0, -- in minutes
    total_rides INTEGER DEFAULT 0,
    avg_speed REAL DEFAULT 0,
    favorite_ride_type TEXT,
    last_calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create monthly activity tracking
CREATE TABLE user_monthly_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    distance REAL DEFAULT 0,
    elevation_gain INTEGER DEFAULT 0,
    ride_time INTEGER DEFAULT 0, -- in minutes
    ride_count INTEGER DEFAULT 0,
    avg_speed REAL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, year, month)
);

COMMIT;
