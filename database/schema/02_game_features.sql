-- 7. Game Scores (Gamification)
CREATE TABLE IF NOT EXISTS game_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    game_id VARCHAR(50) NOT NULL, -- e.g., 'sudoku', 'quiz'
    score INTEGER NOT NULL DEFAULT 0,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game ON game_scores(game_id);
-- Index for Leaderboards
CREATE INDEX IF NOT EXISTS idx_game_scores_leaderboard ON game_scores(game_id, score DESC);

-- 8. Feedback / Reviews
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id), -- Nullable if anonymous feedback allowed
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE feedback IS 'Stores user reviews and feedback for the platform.';
