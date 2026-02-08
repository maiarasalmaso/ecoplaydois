import { Pool, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import ws from 'ws';

// Importante para ambientes serverless como Vercel/Cloudflare 
// que usam WebSockets para o protocolo Postgres
neonConfig.webSocketConstructor = ws;

dotenv.config();

let pool: Pool | null = null;

export const getPool = () => {
    if (pool) return pool;

    let connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;

    if (!connectionString) {
        const foundKey = Object.keys(process.env).find(key => key.endsWith('POSTGRES_URL') || key.endsWith('DATABASE_URL'));
        if (foundKey) {
            connectionString = process.env[foundKey];
        }
    }

    if (!connectionString) {
        throw new Error("DATABASE_URL environment variable is not defined.");
    }

    const cleanUrl = connectionString.replace(/['"]/g, '').trim();

    pool = new Pool({
        connectionString: cleanUrl,
        max: 10, // Limite para evitar exaustão de conexões no Neon
        idleTimeoutMillis: 15000,
        connectionTimeoutMillis: 10000,
    });

    return pool;
};

export const getClient = async () => {
    const p = getPool();
    return await p.connect();
};

export const query = async (text: string, params?: any[]) => {
    const start = Date.now();
    try {
        const p = getPool();
        const client = await p.connect();
        try {
            const result = await client.query(text, params);
            const duration = Date.now() - start;
            console.log(`[DB Query SUCCESS] ${text.substring(0, 50)}... (${duration}ms)`);
            return result;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Database Error:', error);
        throw error;
    }
};

export default { query, getClient, getPool };
