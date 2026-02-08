
-- 1. Cria a tabela de Usuários
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

-- 2. Tabela de Progresso (Badges, XP)
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
    eco_credits BIGINT DEFAULT 0
);

-- 3. Tabela de Feedback
CREATE TABLE IF NOT EXISTS feedback_responses (
    id TEXT PRIMARY KEY,
    created_at VARCHAR(255),
    local_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
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

-- 4. Tabela de Ranking (Scores)
CREATE TABLE IF NOT EXISTS game_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    game_id VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Índices para velocidade
CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game ON game_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_users_score_desc ON users(score DESC);
