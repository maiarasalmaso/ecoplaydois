import { Pool, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import ws from 'ws';

// Load environment variables from .env.development.local if available, otherwise .env
dotenv.config({ path: '.env.development.local' });
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    dotenv.config(); // fallback to .env
}

neonConfig.webSocketConstructor = ws;

async function testConnection() {
    console.log("Testing Neon DB connection...");
    
    let connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;

    if (!connectionString) {
        console.error("❌ No DATABASE_URL or POSTGRES_URL found in environment variables.");
        // Try to find any variable ending in URL
        const foundKey = Object.keys(process.env).find(key => key.endsWith('POSTGRES_URL') || key.endsWith('DATABASE_URL'));
        if (foundKey) {
            console.log(`Using fallback key: ${foundKey}`);cd Documents\trae_projects\ecoplay
            
            connectionString = process.env[foundKey];
        } else {
            console.log("Available env keys:", Object.keys(process.env).filter(k => k.includes('DB') || k.includes('URL') || k.includes('POSTGRES')));
            process.exit(1);
        }
    }

    console.log(`Using connection string: ${connectionString.replace(/:[^:]*@/, ':****@')}`); // Mask password

    const pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 30000, // 30 seconds timeout
        idleTimeoutMillis: 30000,
    });

    try {
        const client = await pool.connect();
        console.log("✅ Successfully connected to Neon DB!");
        
        const result = await client.query('SELECT NOW()');
        console.log("Database time:", result.rows[0].now);
        
        client.release();
    } catch (error) {
        console.error("❌ Connection failed:", error);
        if (error.message.includes("Compute is suspended")) {
            console.log("⚠️ The database was suspended. It should be waking up now. Please try again in a few seconds.");
        }
    } finally {
        await pool.end();
    }
}

testConnection();
