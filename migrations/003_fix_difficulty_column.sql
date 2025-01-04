
DROP TABLE IF EXISTS rides CASCADE;
CREATE TABLE IF NOT EXISTS rides (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date_time TIMESTAMP NOT NULL,
  distance INTEGER NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'C',
  max_riders INTEGER NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  latitude TEXT NOT NULL,
  longitude TEXT NOT NULL,
  ride_type TEXT NOT NULL,
  pace REAL NOT NULL,
  terrain TEXT NOT NULL,
  route_url TEXT,
  description TEXT
);
