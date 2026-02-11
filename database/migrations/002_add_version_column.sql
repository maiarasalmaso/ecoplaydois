-- Migration: Add version column to progress table for optimistic locking
-- Date: 2026-02-11
-- Purpose: Support data isolation fixes and prevent concurrent update conflicts

-- Add version column if it doesn't exist
ALTER TABLE progress 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

-- Create trigger to auto-increment version on UPDATE
CREATE OR REPLACE FUNCTION increment_progress_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (to make this idempotent)
DROP TRIGGER IF EXISTS trg_progress_version ON progress;

-- Create the trigger
CREATE TRIGGER trg_progress_version
    BEFORE UPDATE ON progress
    FOR EACH ROW
    EXECUTE FUNCTION increment_progress_version();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_progress_version ON progress(local_user_id, version);

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'progress' 
AND column_name = 'version';
