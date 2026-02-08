import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.development.local') });
dotenv.config(); // Fallback

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL missing.");
    process.exit(1);
}

const sql = neon(connectionString);

async function checkTables() {
    try {
        console.log("🔍 Checking existing tables...");
        const result = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `;

        console.log("📊 Tables found in database:");
        if (result.length === 0) {
            console.log("⚠️ No tables found! (Database is empty)");
        } else {
            result.forEach(row => {
                console.log(` - ${row.table_name}`);
            });
        }
    } catch (error) {
        console.error("❌ Error checking tables:", error);
    }
}

checkTables();
