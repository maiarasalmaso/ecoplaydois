const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function updateAdmin() {
    try {
        console.log('Connecting to database...');

        const oldEmail = 'adminecoplay';
        const newEmail = 'ecoplayutfpr@gmail.com';
        const password = 'admin';
        const hashedPassword = await bcrypt.hash(password, 12);

        console.log(`Updating admin user to: ${newEmail}`);

        // Check if old admin exists
        const checkOld = await pool.query('SELECT * FROM users WHERE email = $1', [oldEmail]);

        if (checkOld.rows.length > 0) {
            console.log('Renaming old admin user...');
            await pool.query(
                `UPDATE users 
                 SET email = $1, password_hash = $2, role = 'ADMIN' 
                 WHERE email = $3`,
                [newEmail, hashedPassword, oldEmail]
            );
            console.log('Admin user updated successfully.');
        } else {
            // Check if new email already exists
            const checkNew = await pool.query('SELECT * FROM users WHERE email = $1', [newEmail]);

            if (checkNew.rows.length > 0) {
                console.log('User with new email already exists. Promoting to ADMIN and updating password...');
                await pool.query(
                    `UPDATE users 
                     SET password_hash = $1, role = 'ADMIN' 
                     WHERE email = $2`,
                    [hashedPassword, newEmail]
                );
            } else {
                console.log('Creating new admin user...');
                await pool.query(
                    `INSERT INTO users (email, password_hash, full_name, role)
                     VALUES ($1, $2, $3, 'ADMIN')`,
                    [newEmail, hashedPassword, 'Admin EcoPlay']
                );
            }
            console.log('Admin user ensured.');
        }

    } catch (err) {
        console.error('Error updating admin:', err);
    } finally {
        await pool.end();
    }
}

updateAdmin();
