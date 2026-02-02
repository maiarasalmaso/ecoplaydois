const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function cleanupUsers() {
    try {
        console.log('Connecting to database...');

        const adminEmail = 'ecoplayutfpr@gmail.com';

        console.log(`Keeping admin user: ${adminEmail}`);
        console.log('Deleting all other users...');

        const result = await pool.query(
            `DELETE FROM users 
             WHERE email != $1`,
            [adminEmail]
        );

        console.log(`Successfully deleted ${result.rowCount} users.`);

        // Verify remaining users
        const remaining = await pool.query('SELECT email, role FROM users');
        console.log('Remaining users:', remaining.rows);

    } catch (err) {
        console.error('Error cleaning up users:', err);
    } finally {
        await pool.end();
    }
}

cleanupUsers();
