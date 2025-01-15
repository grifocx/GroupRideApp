-- Create the recurring_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE recurring_type_enum AS ENUM ('weekly', 'monthly');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Drop existing constraint if any
ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_recurring_type_check;

-- Update the column type to use the enum
ALTER TABLE rides 
  ALTER COLUMN recurring_type TYPE recurring_type_enum 
  USING recurring_type::recurring_type_enum;