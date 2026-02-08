-- Architecture Hardening - Strong Consistency & Security

-- 1. Version Control for Optimistic Locking
ALTER TABLE users ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE progress ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 2. Idempotency Key Table
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key TEXT PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_payload JSONB, -- Store the successful response to return on retry
    locked_until TIMESTAMP WITH TIME ZONE -- For short-term locking
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_idempotency_created_at ON idempotency_keys(created_at);

-- 3. Row Level Security (RLS)
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Create Policies (Assuming 'app.current_user_id' is set in session)

-- USERS Table
CREATE POLICY users_isolation_policy ON users
    USING (id = current_setting('app.current_user_id', true)::integer);

-- PROGRESS Table
CREATE POLICY progress_isolation_policy ON progress
    USING (local_user_id = current_setting('app.current_user_id', true)::integer);

-- 4. Triggers for Version Increment
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_version ON users;
CREATE TRIGGER trg_users_version
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS trg_progress_version ON progress;
CREATE TRIGGER trg_progress_version
    BEFORE UPDATE ON progress
    FOR EACH ROW
    EXECUTE FUNCTION increment_version();
