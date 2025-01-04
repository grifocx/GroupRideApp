
BEGIN;

DROP TABLE IF EXISTS ride_participants CASCADE;
DROP TABLE IF EXISTS rides CASCADE;

CREATE TABLE rides (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date_time TIMESTAMP NOT NULL,
  distance INTEGER NOT NULL,
  difficulty VARCHAR(2) NOT NULL,
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

CREATE TABLE ride_participants (
  id SERIAL PRIMARY KEY,
  ride_id INTEGER NOT NULL REFERENCES rides(id),
  user_id INTEGER NOT NULL REFERENCES users(id)
);

COMMIT;
