import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
    console.error('DATABASE_URL not found');
    process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function listAdmins() {
    try {
        const result = await pool.query("SELECT id, email, full_name, role FROM users WHERE role = 'ADMIN'");
        console.table(result.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

listAdmins();
