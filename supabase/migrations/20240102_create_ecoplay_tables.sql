-- Criação das tabelas principais do EcoPlay
-- Executar este script no Supabase SQL Editor

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    local_user_id TEXT NOT NULL UNIQUE,
    username TEXT,
    username_lower TEXT GENERATED ALWAYS AS (LOWER(username)) STORED,
    name TEXT,
    email TEXT,
    email_lower TEXT GENERATED ALWAYS AS (LOWER(email)) STORED,
    avatar TEXT,
    streak INTEGER DEFAULT 0,
    last_login_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de progresso do usuário
CREATE TABLE IF NOT EXISTS progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    local_user_id TEXT NOT NULL UNIQUE,
    score INTEGER DEFAULT 0,
    badges TEXT[] DEFAULT '{}',
    badge_unlocks JSONB DEFAULT '{}',
    stats JSONB DEFAULT '{}',
    completed_levels JSONB DEFAULT '{}',
    last_daily_xp_date TIMESTAMPTZ,
    unclaimed_rewards JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de respostas de feedback
CREATE TABLE IF NOT EXISTS feedback_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    local_user_id TEXT,
    user_name TEXT,
    user_email TEXT,
    user_type TEXT,
    score INTEGER DEFAULT 0,
    level TEXT,
    badges TEXT[] DEFAULT '{}',
    ux JSONB DEFAULT '{}',
    learning JSONB DEFAULT '{}',
    meta JSONB DEFAULT '{}'
);

-- Tabela de configurações de filtro de idade
CREATE TABLE IF NOT EXISTS age_filter_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    local_user_id TEXT NOT NULL UNIQUE,
    age INTEGER NOT NULL CHECK (age >= 10 AND age <= 14),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_local_user_id ON profiles(local_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON profiles(email_lower);
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles(username_lower);
CREATE INDEX IF NOT EXISTS idx_progress_local_user_id ON progress(local_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_local_user_id ON feedback_responses(local_user_id);
CREATE INDEX IF NOT EXISTS idx_age_filter_settings_local_user_id ON age_filter_settings(local_user_id);
CREATE INDEX IF NOT EXISTS idx_age_filter_settings_age ON age_filter_settings(age);

-- Função para registrar perfil com validação
CREATE OR REPLACE FUNCTION ecoplay_register_profile(
    p_local_user_id TEXT,
    p_username TEXT,
    p_name TEXT,
    p_email TEXT,
    p_avatar TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    profile_id UUID
) AS $$
DECLARE
    v_profile_id UUID;
    v_username_lower TEXT;
    v_email_lower TEXT;
BEGIN
    -- Normalizar dados
    v_username_lower := LOWER(TRIM(COALESCE(p_username, '')));
    v_email_lower := LOWER(TRIM(COALESCE(p_email, '')));
    
    -- Verificar se já existe um perfil com este local_user_id
    SELECT id INTO v_profile_id FROM profiles WHERE local_user_id = p_local_user_id;
    
    IF v_profile_id IS NOT NULL THEN
        -- Atualizar perfil existente
        UPDATE profiles SET
            username = COALESCE(p_username, username),
            name = COALESCE(p_name, name),
            email = COALESCE(p_email, email),
            avatar = COALESCE(p_avatar, avatar),
            updated_at = NOW()
        WHERE id = v_profile_id;
        
        RETURN QUERY SELECT TRUE, 'Profile updated successfully', v_profile_id;
    ELSE
        -- Criar novo perfil
        INSERT INTO profiles (
            local_user_id,
            username,
            name,
            email,
            avatar
        ) VALUES (
            p_local_user_id,
            p_username,
            p_name,
            p_email,
            p_avatar
        ) RETURNING id INTO v_profile_id;
        
        RETURN QUERY SELECT TRUE, 'Profile created successfully', v_profile_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para sincronizar progresso
CREATE OR REPLACE FUNCTION ecoplay_sync_progress(
    p_local_user_id TEXT,
    p_score INTEGER,
    p_badges TEXT[],
    p_badge_unlocks JSONB,
    p_stats JSONB,
    p_completed_levels JSONB,
    p_last_daily_xp_date TIMESTAMPTZ,
    p_unclaimed_rewards JSONB
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_progress_id UUID;
BEGIN
    -- Verificar se já existe progresso para este usuário
    SELECT id INTO v_progress_id FROM progress WHERE local_user_id = p_local_user_id;
    
    IF v_progress_id IS NOT NULL THEN
        -- Atualizar progresso existente (merge de dados)
        UPDATE progress SET
            score = GREATEST(score, COALESCE(p_score, score)),
            badges = COALESCE(p_badges, badges),
            badge_unlocks = COALESCE(p_badge_unlocks, badge_unlocks),
            stats = COALESCE(p_stats, stats),
            completed_levels = COALESCE(p_completed_levels, completed_levels),
            last_daily_xp_date = COALESCE(p_last_daily_xp_date, last_daily_xp_date),
            unclaimed_rewards = COALESCE(p_unclaimed_rewards, unclaimed_rewards),
            updated_at = NOW()
        WHERE id = v_progress_id;
        
        RETURN QUERY SELECT TRUE, 'Progress updated successfully';
    ELSE
        -- Criar novo progresso
        INSERT INTO progress (
            local_user_id,
            score,
            badges,
            badge_unlocks,
            stats,
            completed_levels,
            last_daily_xp_date,
            unclaimed_rewards
        ) VALUES (
            p_local_user_id,
            COALESCE(p_score, 0),
            COALESCE(p_badges, '{}'),
            COALESCE(p_badge_unlocks, '{}'),
            COALESCE(p_stats, '{}'),
            COALESCE(p_completed_levels, '{}'),
            p_last_daily_xp_date,
            COALESCE(p_unclaimed_rewards, '[]')
        );
        
        RETURN QUERY SELECT TRUE, 'Progress created successfully';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para definir configuração de filtro de idade
CREATE OR REPLACE FUNCTION ecoplay_set_age_filter(
    p_local_user_id TEXT,
    p_age INTEGER,
    p_is_verified BOOLEAN
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    setting_id UUID
) AS $$
DECLARE
    v_setting_id UUID;
BEGIN
    -- Validar idade
    IF p_age < 10 OR p_age > 14 THEN
        RETURN QUERY SELECT FALSE, 'Age must be between 10 and 14', NULL;
        RETURN;
    END IF;
    
    -- Verificar se já existe configuração para este usuário
    SELECT id INTO v_setting_id FROM age_filter_settings WHERE local_user_id = p_local_user_id;
    
    IF v_setting_id IS NOT NULL THEN
        -- Atualizar configuração existente
        UPDATE age_filter_settings SET
            age = p_age,
            is_verified = p_is_verified,
            verified_at = CASE WHEN p_is_verified THEN NOW() ELSE verified_at END,
            updated_at = NOW()
        WHERE id = v_setting_id;
        
        RETURN QUERY SELECT TRUE, 'Age filter updated successfully', v_setting_id;
    ELSE
        -- Criar nova configuração
        INSERT INTO age_filter_settings (
            local_user_id,
            age,
            is_verified,
            verified_at
        ) VALUES (
            p_local_user_id,
            p_age,
            p_is_verified,
            CASE WHEN p_is_verified THEN NOW() ELSE NULL END
        ) RETURNING id INTO v_setting_id;
        
        RETURN QUERY SELECT TRUE, 'Age filter created successfully', v_setting_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter configuração de filtro de idade
CREATE OR REPLACE FUNCTION ecoplay_get_age_filter(p_local_user_id TEXT)
RETURNS TABLE (
    id UUID,
    local_user_id TEXT,
    age INTEGER,
    is_verified BOOLEAN,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY SELECT * FROM age_filter_settings WHERE local_user_id = p_local_user_id LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões básicas para anon e authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON progress TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON feedback_responses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON age_filter_settings TO anon, authenticated;
GRANT EXECUTE ON FUNCTION ecoplay_register_profile TO anon, authenticated;
GRANT EXECUTE ON FUNCTION ecoplay_sync_progress TO anon, authenticated;
GRANT EXECUTE ON FUNCTION ecoplay_set_age_filter TO anon, authenticated;
GRANT EXECUTE ON FUNCTION ecoplay_get_age_filter TO anon, authenticated;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_age_filter_settings_updated_at BEFORE UPDATE ON age_filter_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();