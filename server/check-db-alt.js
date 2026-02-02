const { Pool } = require('pg');

// Try standard credentials
const connectionString = 'postgres://admin:password@localhost:5433/ecoplay';

const pool = new Pool({
    connectionString: connectionString,
});

async function check() {
    try {
        console.log('Connecting to:', connectionString.split('@')[1]);
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.log('Columns in users:', res.rows);
    } catch (err) {
        console.error('Connection error:', err.message);
    } finally {
        await pool.end();
    }
}

check();
