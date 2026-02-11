-- ========================================
-- ECOPLAY DATABASE SCHEMA - FULL SETUP
-- ========================================
-- This script creates all tables with the version column included
-- Safe to run multiple times (uses IF NOT EXISTS)

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'CUSTOMER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    avatar VARCHAR(255) DEFAULT NULL,
    score INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0
);

-- 2. PROGRESS TABLE (with version column included)
CREATE TABLE IF NOT EXISTS progress (
    local_user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    badges TEXT[] DEFAULT '{}',
    badge_unlocks JSONB DEFAULT '{}',
    stats JSONB DEFAULT '{}',
    completed_levels JSONB DEFAULT '{}',
    last_daily_xp_date TEXT,
    unclaimed_rewards TEXT[] DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    energy BIGINT DEFAULT 0,
    eco_credits BIGINT DEFAULT 0,
    version INTEGER DEFAULT 1 NOT NULL
);

-- 3. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS feedback_responses (
    id TEXT PRIMARY KEY,
    created_at VARCHAR(255),
    local_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL UNIQUE,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    user_type VARCHAR(50),
    score INTEGER DEFAULT 0,
    level VARCHAR(50),
    badges TEXT[] DEFAULT '{}',
    ux JSONB DEFAULT '{}',
    learning JSONB DEFAULT '{}',
    meta JSONB DEFAULT '{}'
);

-- 4. GAME SCORES TABLE
CREATE TABLE IF NOT EXISTS game_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    game_id VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game ON game_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_users_score_desc ON users(score DESC);
CREATE INDEX IF NOT EXISTS idx_progress_version ON progress(local_user_id, version);

-- 6. VERSION AUTO-INCREMENT TRIGGER
CREATE OR REPLACE FUNCTION increment_progress_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_progress_version ON progress;

CREATE TRIGGER trg_progress_version
    BEFORE UPDATE ON progress
    FOR EACH ROW
    EXECUTE FUNCTION increment_progress_version();

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check progress table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'progress'
ORDER BY ordinal_position;
