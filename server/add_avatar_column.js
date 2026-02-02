const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    try {
        console.log('Adding avatar column...');
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS avatar VARCHAR(255) DEFAULT 'default';
        `);
        console.log('Column avatar added successfully!');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await pool.end();
    }
}

migrate();
