import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.development.local') });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

async function resetSchema() {
    console.log("🔥 Resetting Database Schema...");
    const pool = new Pool({ connectionString });

    try {
        // Drop tables in correct order
        await pool.query('DROP TABLE IF EXISTS game_scores CASCADE');
        await pool.query('DROP TABLE IF EXISTS feedback_responses CASCADE');
        await pool.query('DROP TABLE IF EXISTS progress CASCADE');
        await pool.query('DROP TABLE IF EXISTS users CASCADE');

        console.log("🧹 Tables dropped.");

        // Users
        await pool.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'CUSTOMER',
                avatar VARCHAR(255) DEFAULT NULL,
                score INTEGER DEFAULT 0,
                streak INTEGER DEFAULT 0,
                time_spent INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Progress
        await pool.query(`
            CREATE TABLE progress (
                local_user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                score INTEGER DEFAULT 0,
                badges TEXT[] DEFAULT '{}',
                badge_unlocks JSONB DEFAULT '{}',
                stats JSONB DEFAULT '{}',
                completed_levels JSONB DEFAULT '{}',
                last_daily_xp_date TEXT,
                unclaimed_rewards TEXT[] DEFAULT '{}',
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Feedback
        await pool.query(`
            CREATE TABLE feedback_responses (
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
            )
        `);

        // Game Scores
        await pool.query(`
            CREATE TABLE game_scores (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                game_id VARCHAR(50) NOT NULL,
                score INTEGER NOT NULL DEFAULT 0,
                played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        console.log("✅ Schema recreated successfully with SERIAL IDs.");
    } catch (error) {
        console.error("❌ Reset failed:", error);
    } finally {
        await pool.end();
    }
}

resetSchema();
