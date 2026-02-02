const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function addTimeSpentColumn() {
    try {
        console.log('Connecting to database...');

        console.log('Adding time_spent column to users table...');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS time_spent INTEGER DEFAULT 0;');

        console.log('Column added successfully.');

    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        await pool.end();
    }
}

addTimeSpentColumn();
