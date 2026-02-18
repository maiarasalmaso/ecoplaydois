import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
    console.error('DATABASE_URL not found');
    process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

const SALT_ROUNDS = 12;

async function resetPassword() {
    try {
        const hashedPassword = await bcrypt.hash('admin', SALT_ROUNDS);

        const result = await pool.query(
            "UPDATE users SET password_hash = $1 WHERE email = 'admin@gmail.com' RETURNING email, full_name, role",
            [hashedPassword]
        );

        if (result.rowCount > 0) {
            console.log('✅ Password reset successfully for:', result.rows[0].email);
        } else {
            console.log('❌ Admin user not found.');
        }

    } catch (err) {
        console.error('Error resetting password:', err);
    } finally {
        await pool.end();
    }
}

resetPassword();
