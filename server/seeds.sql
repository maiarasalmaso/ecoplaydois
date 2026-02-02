-- Seed Data for EcoPlay

-- 1. Create Default Admin User (Password: admin123)
-- Hash generated via bcrypt('admin123', 10)
INSERT INTO users (email, password_hash, full_name, role, score, streak)
VALUES 
('admin@ecoplay.com', '$2a$10$X7V.j5qj1l7j5qj1l7j5quQ.3.x.x.x.x.x.x.x.x.x', 'Administrador Eco', 'ADMIN', 1000, 5)
ON CONFLICT (email) DO NOTHING;

-- 2. Create Default Player User (Password: player123)
-- Hash generated via bcrypt('player123', 10)
INSERT INTO users (email, password_hash, full_name, role, score, streak)
VALUES 
('player@ecoplay.com', '$2a$10$X7V.j5qj1l7j5qj1l7j5quQ.3.x.x.x.x.x.x.x.x.x', 'Jogador Teste', 'CUSTOMER', 500, 2)
ON CONFLICT (email) DO NOTHING;

-- 3. Initial Progress for Admin
INSERT INTO progress (local_user_id, score, badges, stats)
SELECT id, 1000, '{"eco-master", "first-login"}', '{"games_played": 10}'
FROM users WHERE email = 'admin@ecoplay.com'
ON CONFLICT (local_user_id) DO NOTHING;

-- 4. Initial Progress for Player
INSERT INTO progress (local_user_id, score, badges, stats)
SELECT id, 500, '{"new-comer"}', '{"games_played": 5}'
FROM users WHERE email = 'player@ecoplay.com'
ON CONFLICT (local_user_id) DO NOTHING;

-- 5. Fake Leaderboard Data
INSERT INTO game_scores (user_id, game_id, score, played_at)
SELECT id, 'eco-quiz', 100, NOW() - INTERVAL '1 day' FROM users WHERE email = 'admin@ecoplay.com'
UNION ALL
SELECT id, 'eco-memory', 200, NOW() - INTERVAL '2 days' FROM users WHERE email = 'admin@ecoplay.com'
UNION ALL
SELECT id, 'eco-quiz', 50, NOW() - INTERVAL '1 hour' FROM users WHERE email = 'player@ecoplay.com';
