BEGIN;

-- Add indexes for frequently accessed columns
CREATE INDEX IF NOT EXISTS idx_rides_date_time ON rides(date_time);
CREATE INDEX IF NOT EXISTS idx_rides_owner_status ON rides(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_ride_participants_composite ON ride_participants(ride_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_monthly_stats_lookup ON user_monthly_stats(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_ride_comments_ride ON ride_comments(ride_id);

-- Add proper constraints for numerical values
ALTER TABLE rides 
  ADD CONSTRAINT check_positive_distance CHECK (distance > 0),
  ADD CONSTRAINT check_positive_max_riders CHECK (max_riders > 0),
  ADD CONSTRAINT check_valid_pace CHECK (pace > 0),
  ADD CONSTRAINT check_valid_elevation CHECK (elevation_gain >= 0),
  ADD CONSTRAINT check_valid_actual_distance CHECK (actual_distance > 0);

-- Add constraints for activity stats
ALTER TABLE user_activity_stats
  ADD CONSTRAINT check_positive_total_distance CHECK (total_distance >= 0),
  ADD CONSTRAINT check_positive_elevation CHECK (total_elevation_gain >= 0),
  ADD CONSTRAINT check_positive_ride_time CHECK (total_ride_time >= 0),
  ADD CONSTRAINT check_positive_total_rides CHECK (total_rides >= 0);

-- Enable Row Level Security
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_monthly_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Rides policies
CREATE POLICY rides_owner_all ON rides TO PUBLIC
  USING (owner_id = current_user_id());

CREATE POLICY rides_participant_view ON rides TO PUBLIC
  USING (
    id IN (
      SELECT ride_id 
      FROM ride_participants 
      WHERE user_id = current_user_id()
    )
  );

-- Comments policies
CREATE POLICY comments_owner_all ON ride_comments TO PUBLIC
  USING (user_id = current_user_id());

CREATE POLICY comments_ride_participant_view ON ride_comments TO PUBLIC
  USING (
    ride_id IN (
      SELECT id FROM rides WHERE owner_id = current_user_id()
      UNION
      SELECT ride_id FROM ride_participants WHERE user_id = current_user_id()
    )
  );

-- Activity stats policies
CREATE POLICY stats_owner_only ON user_activity_stats TO PUBLIC
  USING (user_id = current_user_id());

CREATE POLICY monthly_stats_owner_only ON user_monthly_stats TO PUBLIC
  USING (user_id = current_user_id());

-- Add trigger for updating user activity stats
CREATE OR REPLACE FUNCTION update_user_activity_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND OLD.completed = false THEN
    -- Update or insert user activity stats
    INSERT INTO user_activity_stats (
      user_id, 
      total_distance,
      total_elevation_gain,
      total_ride_time,
      total_rides,
      avg_speed,
      last_calculated_at
    )
    VALUES (
      NEW.owner_id,
      COALESCE(NEW.actual_distance, 0),
      COALESCE(NEW.elevation_gain, 0),
      COALESCE(NEW.actual_duration, 0),
      1,
      COALESCE(NEW.average_speed, 0),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      total_distance = user_activity_stats.total_distance + COALESCE(NEW.actual_distance, 0),
      total_elevation_gain = user_activity_stats.total_elevation_gain + COALESCE(NEW.elevation_gain, 0),
      total_ride_time = user_activity_stats.total_ride_time + COALESCE(NEW.actual_duration, 0),
      total_rides = user_activity_stats.total_rides + 1,
      avg_speed = (user_activity_stats.avg_speed * user_activity_stats.total_rides + COALESCE(NEW.average_speed, 0)) / (user_activity_stats.total_rides + 1),
      last_calculated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_activity_stats
  AFTER UPDATE ON rides
  FOR EACH ROW
  WHEN (NEW.completed = true AND OLD.completed = false)
  EXECUTE FUNCTION update_user_activity_stats();

COMMIT;
