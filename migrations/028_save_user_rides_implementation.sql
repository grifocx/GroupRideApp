-- Migration to save the state after implementing user rides functionality
BEGIN;

-- This migration serves as a save point after implementing:
-- 1. User owned rides endpoint
-- 2. User participating rides endpoint
-- 3. Combined rides display in profile

-- No schema changes were made, this is a savepoint migration
-- If you need to rollback, you can safely roll back to this point

COMMIT;
