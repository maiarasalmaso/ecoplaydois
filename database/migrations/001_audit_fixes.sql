-- 1. Performance: Create index for Leaderboard
CREATE INDEX IF NOT EXISTS idx_users_score_desc ON users(score DESC);

-- 2. Normalization: Add entries for Game Economy
-- These columns allow efficiently querying "Who has the most energy?" without parsing JSON
ALTER TABLE progress ADD COLUMN IF NOT EXISTS energy BIGINT DEFAULT 0;
ALTER TABLE progress ADD COLUMN IF NOT EXISTS eco_credits BIGINT DEFAULT 0;

-- 3. Data Migration (One-time fix)
-- Extract data buried in the JSONB 'stats' column to the new real columns
UPDATE progress
SET 
    energy = COALESCE((stats->>'saved_energy')::BIGINT, 0),
    eco_credits = COALESCE((stats->>'saved_credits')::BIGINT, 0)
WHERE 
    stats IS NOT NULL;
