import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: '.env.development.local' });
dotenv.config(); // Fallback to .env

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    const connectionString =
        process.env.POSTGRES_URL ||
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL_NON_POOLING;

    if (!connectionString) {
        console.error('❌ Error: POSTGRES_URL or DATABASE_URL not found in environment.');
        process.exit(1);
    }

    console.log(`🔌 Connecting to database...`);

    // Use non-pooling URL if available for migrations/DDL to avoid timeout issues with poolers
    // or just use the standard one.
    const pool = new Pool({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        const client = await pool.connect();
        try {
            const migrationPath = path.resolve(__dirname, '../database/migrations/001_architecture_hardening.sql');
            console.log(`Hz Reading migration file: ${migrationPath}`);

            const sql = fs.readFileSync(migrationPath, 'utf8');

            console.log('🚀 Executing migration...');
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('COMMIT');

            console.log('✅ Migration applied successfully!');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
