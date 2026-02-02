const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://admin:password@localhost:5433/ecoplay' });

async function migrate() {
    try {
        console.log('Adding streak and score columns...');
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
        `);
        console.log('Columns added successfully!');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await pool.end();
    }
}

migrate();
