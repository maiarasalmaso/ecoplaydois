import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function run() {
    try {
        // 1. Apply Migration
        console.log('🔄 Applying migration 004_cascade_delete_users.sql...');
        const migrationPath = join(process.cwd(), 'database', 'migrations', '004_cascade_delete_users.sql');
        const sql = readFileSync(migrationPath, 'utf-8');
        await pool.query(sql);
        console.log('✅ Migration applied successfully.');

        // 2. Delete Users
        console.log('🗑️ Deleting users with ID 2 and 3...');
        const result = await pool.query('DELETE FROM users WHERE id IN (2, 3)');
        console.log(`✅ Successfully deleted ${result.rowCount} users.`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

run();
