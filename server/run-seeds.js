const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function seed() {
    try {
        console.log('🌱 Seeding database...');

        // Password hashing needs to be dynamic to match bcrypt version/salt
        const adminPass = await bcrypt.hash('admin123', 10);
        const playerPass = await bcrypt.hash('player123', 10);

        const sqlTemplate = fs.readFileSync(path.join(__dirname, 'seeds.sql'), 'utf8');

        // Simple replacement (not ideal for production but works for dev scripts)
        // We replace the placeholder hashes in the SQL with real generated ones
        // OR we can just execute queries directly here. Let's do direct queries for users to be safe.

        await pool.query('BEGIN');

        // 1. Upsert Users
        const adminRes = await pool.query(`
            INSERT INTO users (email, password_hash, full_name, role, score, streak)
            VALUES ($1, $2, 'Administrador Eco', 'ADMIN', 1000, 5)
            ON CONFLICT (email) DO UPDATE SET password_hash = $2
            RETURNING id;
        `, ['admin@ecoplay.com', adminPass]);

        const playerRes = await pool.query(`
            INSERT INTO users (email, password_hash, full_name, role, score, streak)
            VALUES ($1, $2, 'Jogador Teste', 'CUSTOMER', 500, 2)
            ON CONFLICT (email) DO UPDATE SET password_hash = $2
            RETURNING id;
        `, ['player@ecoplay.com', playerPass]);

        const adminId = adminRes.rows[0].id;
        const playerId = playerRes.rows[0].id;

        console.log(`User IDs: Admin=${adminId}, Player=${playerId}`);

        // 2. Upsert Progress
        await pool.query(`
            INSERT INTO progress (local_user_id, score, badges, stats)
            VALUES ($1, 1000, '{"eco-master", "first-login"}', '{"games_played": 10}')
            ON CONFLICT (local_user_id) DO NOTHING;
        `, [adminId]);

        await pool.query(`
            INSERT INTO progress (local_user_id, score, badges, stats)
            VALUES ($1, 500, '{"new-comer"}', '{"games_played": 5}')
            ON CONFLICT (local_user_id) DO NOTHING;
        `, [playerId]);

        // 3. Insert Scores (Clean old scores for these users first to avoid duplicates if re-run)
        await pool.query('DELETE FROM game_scores WHERE user_id IN ($1, $2)', [adminId, playerId]);

        await pool.query(`
            INSERT INTO game_scores (user_id, game_id, score, played_at) VALUES 
            ($1, 'eco-quiz', 100, NOW() - INTERVAL '1 day'),
            ($1, 'eco-memory', 200, NOW() - INTERVAL '2 days'),
            ($2, 'eco-quiz', 50, NOW() - INTERVAL '1 hour');
        `, [adminId, playerId]);

        await pool.query('COMMIT');
        console.log('✅ Database seeded successfully!');

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('❌ Limit seeding error:', err);
    } finally {
        await pool.end();
    }
}

seed();
