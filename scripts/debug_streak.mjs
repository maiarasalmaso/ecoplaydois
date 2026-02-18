import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const pool = new Pool({ connectionString: DATABASE_URL });

async function debugStreak() {
    try {
        // Fetch Admin
        const res = await pool.query("SELECT id, email, streak, last_login FROM users WHERE email = 'admin@gmail.com'");
        const user = res.rows[0];
        console.log('User:', user);

        if (!user) return;

        // Simulate Logic
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const lastLoginDate = user.last_login ? new Date(user.last_login) : null;
        const lastLoginStr = lastLoginDate ? lastLoginDate.toISOString().split('T')[0] : 'NULL';

        console.log(`Now (UTC): ${now.toISOString()}`);
        console.log(`TodayStr: ${todayStr}`);
        console.log(`LastLogin in DB: ${user.last_login}`);
        console.log(`LastLoginStr: ${lastLoginStr}`);

        // Yesterday Calc
        const yesterday = new Date(now);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        console.log(`YesterdayStr: ${yesterdayStr}`);

        if (lastLoginStr === todayStr) {
            console.log('Result: Same Day Login');
        } else if (lastLoginStr === yesterdayStr) {
            console.log('Result: Consecutive Day (Streak++)');
        } else {
            console.log('Result: Reset (Streak = 1)');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

debugStreak();
