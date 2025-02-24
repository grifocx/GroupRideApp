BEGIN;

-- First, create a parent table for rides that will be partitioned
CREATE TABLE rides_partitioned (
  id SERIAL,
  title TEXT NOT NULL,
  date_time TIMESTAMP NOT NULL,
  distance INTEGER NOT NULL,
  difficulty VARCHAR(2) NOT NULL,
  max_riders INTEGER NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  address TEXT NOT NULL,
  latitude TEXT NOT NULL,
  longitude TEXT NOT NULL,
  ride_type TEXT NOT NULL,
  pace REAL NOT NULL,
  terrain TEXT NOT NULL,
  route_url TEXT,
  description TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_type TEXT CHECK (recurring_type IN ('weekly', 'monthly') OR recurring_type IS NULL),
  recurring_day INTEGER CHECK (recurring_day >= 0 AND recurring_day <= 31 OR recurring_day IS NULL),
  recurring_time TEXT,
  recurring_end_date TIMESTAMP,
  series_id BIGINT REFERENCES rides(id),
  status TEXT NOT NULL DEFAULT 'active',
  completed BOOLEAN DEFAULT FALSE,
  actual_distance REAL,
  actual_duration INTEGER,
  elevation_gain INTEGER,
  average_speed REAL,
  CONSTRAINT rides_partitioned_pkey PRIMARY KEY (id, date_time)
) PARTITION BY RANGE (date_time);

-- Create partitions for different time periods
-- Past year partitions
CREATE TABLE rides_y2024_q1 PARTITION OF rides_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE rides_y2024_q2 PARTITION OF rides_partitioned
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

CREATE TABLE rides_y2024_q3 PARTITION OF rides_partitioned
  FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');

CREATE TABLE rides_y2024_q4 PARTITION OF rides_partitioned
  FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');

-- Current year partitions
CREATE TABLE rides_y2025_q1 PARTITION OF rides_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

CREATE TABLE rides_y2025_q2 PARTITION OF rides_partitioned
  FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');

CREATE TABLE rides_y2025_q3 PARTITION OF rides_partitioned
  FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');

CREATE TABLE rides_y2025_q4 PARTITION OF rides_partitioned
  FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- Create default partition for any future dates
CREATE TABLE rides_future PARTITION OF rides_partitioned
  FOR VALUES FROM ('2026-01-01') TO (MAXVALUE);

-- Create indexes on the partitioned table
CREATE INDEX idx_rides_partitioned_date_time ON rides_partitioned(date_time);
CREATE INDEX idx_rides_partitioned_owner_status ON rides_partitioned(owner_id, status);

-- Create a function to automatically create new partitions
CREATE OR REPLACE FUNCTION create_rides_partition()
RETURNS trigger AS $$
DECLARE
    partition_date timestamp;
    partition_name text;
    start_date timestamp;
    end_date timestamp;
BEGIN
    partition_date := date_trunc('quarter', NEW.date_time);
    partition_name := 'rides_y' || extract(year from partition_date) || 
                     '_q' || extract(quarter from partition_date);
    start_date := partition_date;
    end_date := partition_date + interval '3 months';

    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = partition_name) THEN
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF rides_partitioned
             FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );

        RAISE NOTICE 'Created new partition: %', partition_name;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically create partitions
CREATE TRIGGER create_rides_partition_trigger
    BEFORE INSERT ON rides_partitioned
    FOR EACH ROW
    EXECUTE FUNCTION create_rides_partition();

COMMIT;