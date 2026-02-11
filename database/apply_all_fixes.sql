-- ========================================
-- APPLY ALL CORRECTIONS TO NEON DATABASE
-- Execute este SQL no Neon SQL Editor
-- ========================================

-- 1. Add last_login column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Create index for better query performance on last_login
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC);

-- 3. Verify all user tracking columns exist
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('score', 'streak', 'time_spent', 'last_login', 'created_at')
ORDER BY column_name;

-- Expected result:
-- created_at   | timestamp with time zone | now()     | NO
-- last_login   | timestamp with time zone | NULL      | YES
-- score        | integer                  | 0         | YES
-- streak       | integer                  | 0         | YES
-- time_spent   | integer                  | 0         | YES
