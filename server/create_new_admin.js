const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const isSupabase = connectionString && connectionString.includes('supabase');

const pool = new Pool({
    connectionString,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined
});

async function createAdmin() {
    try {
        const email = 'admin@ecoplay.com';
        const password = 'admin'; // Simpler password for dev

        console.log(`Creating admin user: ${email}`);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (checkUser.rows.length > 0) {
            console.log('User already exists. Updating to ADMIN role...');
            await pool.query(
                `UPDATE users 
                 SET password_hash = $1, role = 'ADMIN', full_name = 'Admin User'
                 WHERE email = $2`,
                [hashedPassword, email]
            );
        } else {
            await pool.query(
                `INSERT INTO users (email, password_hash, full_name, role)
                 VALUES ($1, $2, $3, 'ADMIN')`,
                [email, hashedPassword, 'Admin User']
            );
        }

        console.log('✅ Admin user ready!');
        console.log('Email: ' + email);
        console.log('Password: ' + password);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

createAdmin();
