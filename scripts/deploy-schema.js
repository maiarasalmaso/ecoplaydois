import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.development.local') });
dotenv.config(); // Fallback

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL missing. Run 'npx vercel env pull .env.development.local' first.");
    process.exit(1);
}

const sql = neon(connectionString);

async function runMigration() {
    try {
        console.log("🔌 Connecting to Neon...");

        const schemaPath = path.resolve(process.cwd(), 'database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("📝 Applying Schema...");

        // Split by semicolon to execute statements individually if needed, 
        // but neon driver might handle multiple statements. 
        // Safer to treat as one block or split.
        // For simplicity with neon http driver which is one shot, let's try sending it all.
        // Note: neon() returns a promise resolving to rows. It might not support multiple statements in one call depending on config.
        // Let's split strictly.

        // Remove comments
        const cleanSql = schemaSql.replace(/--.*$/gm, '');
        const statements = cleanSql.split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            console.log(`Running: ${statement.substring(0, 50)}...`);
            await sql(statement);
        }

        console.log("✅ Schema applied successfully!");

    } catch (error) {
        console.error("❌ Migration failed:", error);
    }
}

runMigration();
