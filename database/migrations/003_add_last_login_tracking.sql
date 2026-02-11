-- Migration: Add last_login tracking and improve time tracking
-- Date: 2026-02-11
-- Purpose: Track user login times for better analytics and session management

-- Add last_login column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for better query performance on last_login
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC);

-- Update function to auto-update last_login on successful auth
-- This will be called from the application layer, but we can also create a helper function

CREATE OR REPLACE FUNCTION update_user_last_login(user_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET last_login = NOW()
    WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('last_login', 'streak', 'time_spent')
ORDER BY column_name;
