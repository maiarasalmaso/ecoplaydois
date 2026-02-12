-- 004_add_level_column.sql
-- Add level column to users and progress tables to persist level server-side

-- 1. Add level to users if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'level') THEN
        ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Add level to progress if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'progress' AND column_name = 'level') THEN
        ALTER TABLE progress ADD COLUMN level INTEGER DEFAULT 0;
    END IF;
END $$;
