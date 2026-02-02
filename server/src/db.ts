import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;
const isSupabase = connectionString?.includes('supabase');

const pool = new Pool({
    connectionString,
    ssl: (isProduction || isSupabase) ? { rejectUnauthorized: false } : undefined,
});

pool.on('connect', () => {
    console.log('Connected to the Database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;
