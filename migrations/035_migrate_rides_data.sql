BEGIN;

-- Disable foreign key triggers temporarily
SET session_replication_role = 'replica';

-- Migrate data with proper type casting and NULL handling
INSERT INTO rides_partitioned (
  id, title, date_time, distance, difficulty, max_riders, owner_id,
  address, latitude, longitude, ride_type, pace, terrain,
  route_url, description, is_recurring, recurring_type, recurring_day,
  recurring_time, recurring_end_date, series_id, status, completed,
  actual_distance, actual_duration, elevation_gain, average_speed
)
SELECT 
  id, 
  title,
  date_time,
  distance,
  difficulty,
  max_riders,
  owner_id,
  COALESCE(address, '') as address,
  latitude,
  longitude,
  ride_type,
  CAST(COALESCE(NULLIF(pace::text, ''), '0') AS REAL) as pace,
  terrain,
  route_url,
  description,
  COALESCE(is_recurring, FALSE) as is_recurring,
  recurring_type,
  recurring_day,
  recurring_time,
  recurring_end_date,
  series_id,
  COALESCE(status, 'active') as status,
  COALESCE(completed, FALSE) as completed,
  CASE 
    WHEN actual_distance IS NOT NULL AND actual_distance::text != '' 
    THEN CAST(actual_distance AS REAL) 
    ELSE NULL 
  END as actual_distance,
  CASE 
    WHEN actual_duration IS NOT NULL AND actual_duration::text != '' 
    THEN CAST(actual_duration AS INTEGER) 
    ELSE NULL 
  END as actual_duration,
  CASE 
    WHEN elevation_gain IS NOT NULL AND elevation_gain::text != '' 
    THEN CAST(elevation_gain AS INTEGER) 
    ELSE NULL 
  END as elevation_gain,
  CASE 
    WHEN average_speed IS NOT NULL AND average_speed::text != '' 
    THEN CAST(average_speed AS REAL) 
    ELSE NULL 
  END as average_speed
FROM rides;

-- Verify data migration
DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_count FROM rides;
  SELECT COUNT(*) INTO new_count FROM rides_partitioned;
  
  IF old_count != new_count THEN
    RAISE EXCEPTION 'Data migration verification failed. Old count: %, New count: %', old_count, new_count;
  END IF;
END $$;

-- Update sequence to continue from the last value
SELECT setval('rides_partitioned_id_seq', (SELECT last_value FROM temp_sequence_value));

-- Re-enable foreign key triggers
SET session_replication_role = 'origin';

-- Backup the old rides table name
ALTER TABLE rides RENAME TO rides_old;

-- Rename the new partitioned table
ALTER TABLE rides_partitioned RENAME TO rides;

-- Update foreign key references in related tables
ALTER TABLE ride_participants 
  DROP CONSTRAINT IF EXISTS ride_participants_ride_id_fkey,
  ADD CONSTRAINT ride_participants_ride_id_fkey 
  FOREIGN KEY (ride_id) REFERENCES rides(id);

ALTER TABLE ride_comments 
  DROP CONSTRAINT IF EXISTS ride_comments_ride_id_fkey,
  ADD CONSTRAINT ride_comments_ride_id_fkey 
  FOREIGN KEY (ride_id) REFERENCES rides(id);

-- Verify foreign key references
DO $$
DECLARE
  orphaned_participants INTEGER;
  orphaned_comments INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_participants 
  FROM ride_participants rp 
  WHERE NOT EXISTS (SELECT 1 FROM rides r WHERE r.id = rp.ride_id);
  
  SELECT COUNT(*) INTO orphaned_comments 
  FROM ride_comments rc 
  WHERE NOT EXISTS (SELECT 1 FROM rides r WHERE r.id = rc.ride_id);
  
  IF orphaned_participants > 0 OR orphaned_comments > 0 THEN
    RAISE EXCEPTION 'Found orphaned records - Participants: %, Comments: %', 
      orphaned_participants, orphaned_comments;
  END IF;
END $$;

-- If all verifications pass, drop the old table
DROP TABLE rides_old;
DROP TABLE temp_sequence_value;
DROP TABLE temp_ride_refs;

COMMIT;
