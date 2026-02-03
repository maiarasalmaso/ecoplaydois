import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
// Vercel Postgres/Neon uses POSTGRES_URL, Supabase/Render uses DATABASE_URL
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const isSupabase = connectionString?.includes('supabase');
const isNeon = connectionString?.includes('neon.tech');

const pool = new Pool({
    connectionString,
    // Neon and Supabase both require SSL in production
    ssl: (isProduction || isSupabase || isNeon) ? { rejectUnauthorized: false } : undefined,
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
