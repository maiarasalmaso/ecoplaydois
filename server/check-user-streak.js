
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://admin:password@localhost:5433/ecoplay'
});

async function checkUsers() {
    try {
        const res = await pool.query('SELECT id, email, streak, score FROM users');
        console.log('Users in DB:');
        res.rows.forEach(user => {
            console.log(`Email: ${user.email}, Streak: ${user.streak}, Score: ${user.score}`);
        });
    } catch (err) {
        console.error('Error fetching users:', err);
    } finally {
        pool.end();
    }
}

checkUsers();
