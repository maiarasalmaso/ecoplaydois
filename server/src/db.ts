import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

// Lazy initialization wrapper
const getSql = () => {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
        throw new Error("DATABASE_URL environment variable is not defined");
    }

    return neon(connectionString);
};

export const query = async (text: string, params?: any[]) => {
    try {
        const sql = getSql();
        const start = Date.now();

        // Neon driver supports parameterized queries directly: sql(query, params)
        // Adjust for template literal usage if needed by library versions, but standard usage is function call
        const rows = await sql(text, params || []);

        return { rows, rowCount: rows.length };
    } catch (error) {
        console.error('Database Error:', error);
        // Throw error to be caught by route handler
        throw error;
    }
};

export default { query };
