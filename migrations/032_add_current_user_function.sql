BEGIN;

-- Create the current_user_id function that RLS policies will use
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS INTEGER AS $$
DECLARE
    user_id INTEGER;
BEGIN
    -- Get the user_id from the session
    -- This assumes the session variable is set during authentication
    user_id := current_setting('app.current_user_id', true)::INTEGER;
    RETURN user_id;
EXCEPTION WHEN OTHERS THEN
    -- If no user_id is set, return null (effectively blocking access)
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on required tables
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_monthly_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Rides policies
CREATE POLICY rides_owner_all ON rides
    USING (owner_id = current_user_id());

CREATE POLICY rides_participant_view ON rides
    USING (
        id IN (
            SELECT ride_id 
            FROM ride_participants 
            WHERE user_id = current_user_id()
        )
    );

-- Comments policies
CREATE POLICY comments_owner_all ON ride_comments
    USING (user_id = current_user_id());

CREATE POLICY comments_ride_participant_view ON ride_comments
    USING (
        ride_id IN (
            SELECT id FROM rides WHERE owner_id = current_user_id()
            UNION
            SELECT ride_id FROM ride_participants WHERE user_id = current_user_id()
        )
    );

-- Activity stats policies
CREATE POLICY stats_owner_only ON user_activity_stats
    USING (user_id = current_user_id());

CREATE POLICY monthly_stats_owner_only ON user_monthly_stats
    USING (user_id = current_user_id());

COMMIT;