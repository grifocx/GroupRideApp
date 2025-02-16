BEGIN;

-- Create rider preferences table
CREATE TABLE rider_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferred_ride_types TEXT[] NOT NULL,
  preferred_terrains TEXT[] NOT NULL,
  preferred_difficulties TEXT[] NOT NULL,
  min_pace REAL,
  max_pace REAL,
  preferred_distance INTEGER,
  available_days TEXT[],
  match_radius INTEGER DEFAULT 50,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create rider matches table
CREATE TABLE rider_matches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_score REAL NOT NULL,
  last_calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_hidden BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, matched_user_id)
);

-- Create indexes
CREATE INDEX idx_rider_preferences_user ON rider_preferences(user_id);
CREATE INDEX idx_rider_matches_score ON rider_matches(match_score);

-- Enable RLS
ALTER TABLE rider_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_matches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY rider_preferences_owner_only ON rider_preferences
  USING (user_id = current_user_id());

CREATE POLICY rider_matches_visible ON rider_matches
  USING (
    (user_id = current_user_id() OR matched_user_id = current_user_id())
    AND NOT is_hidden
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_rider_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER update_rider_preferences_timestamp
  BEFORE UPDATE ON rider_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_rider_preferences_timestamp();

COMMIT;
