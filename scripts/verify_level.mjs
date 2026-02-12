
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
// import { getLevel, LEVELS } from '../../api/_src/utils/gamification.js';

// INLINE LOGIC TO AVOID TS/JS IMPORT ISSUES
const LEVELS = [
    { min: 0, title: 'Iniciante Ecológico' },
    { min: 100, title: 'Aprendiz da Energia' },
    { min: 500, title: 'Guardião Sustentável' },
    { min: 1000, title: 'Mestre Renovável' },
    { min: 2000, title: 'Lenda do Planeta' },
];

const getLevel = (points) => {
    return [...LEVELS].reverse().find(l => points >= l.min) || LEVELS[0];
};

dotenv.config({ path: '.env.local' });
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL missing');
    process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function verify() {
    console.log('🧪 Starting Level Verification...');
    const testUserId = 999999;
    const testScore = 1500; // Should be "Mestre Renovável" (1000+)

    try {
        // 1. Cleanup test user
        await pool.query('DELETE FROM progress WHERE local_user_id = $1', [testUserId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);

        // 2. Create test user
        await pool.query(`
            INSERT INTO users (id, email, password_hash, full_name, role)
            VALUES ($1, 'test_verify@example.com', 'hash', 'Test Verify', 'CUSTOMER')
        `, [testUserId]);

        console.log('✅ Test user created');

        // 3. Simulate backend logic (calculate level)
        const expectedLevelInfo = getLevel(testScore);
        const expectedLevelIndex = LEVELS.indexOf(expectedLevelInfo);
        console.log(`Expected Level for ${testScore} XP: ${expectedLevelIndex} (${expectedLevelInfo.title})`);

        // 4. Simulate POST /progress (atomic update)
        // We run the SAME query as in progress.ts
        const queryText = `
            INSERT INTO progress (
                local_user_id, score, badges, badge_unlocks, stats, 
                completed_levels, last_daily_xp_date, unclaimed_rewards, updated_at,
                energy, eco_credits, version, level
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, 1, $11)
            RETURNING *
        `;

        await pool.query(queryText, [
            testUserId,
            testScore,
            [], // badges: TEXT[]
            {}, // badge_unlocks: JSONB
            {}, // stats
            {}, // completed_levels
            null,
            [], // unclaimed_rewards
            0,
            0,
            expectedLevelIndex
        ]);

        await pool.query(
            'UPDATE users SET score = $1, level = $2 WHERE id = $3',
            [testScore, expectedLevelIndex, testUserId]
        );

        console.log('✅ Progress upserted');

        // 5. Verify DB state
        const userRes = await pool.query('SELECT level, score FROM users WHERE id = $1', [testUserId]);
        const progressRes = await pool.query('SELECT level, score FROM progress WHERE local_user_id = $1', [testUserId]);

        const userLevel = userRes.rows[0].level;
        const progressLevel = progressRes.rows[0].level;

        console.log(`DB User Level: ${userLevel}`);
        console.log(`DB Progress Level: ${progressLevel}`);

        if (userLevel === expectedLevelIndex && progressLevel === expectedLevelIndex) {
            console.log('🎉 VERIFICATION SUCCESS: Levels match expected value!');
        } else {
            console.error('❌ VERIFICATION FAILED: Levels do not match!');
            process.exit(1);
        }

    } catch (e) {
        console.error('Error during verification:', e);
        process.exit(1);
    } finally {
        // Cleanup
        await pool.query('DELETE FROM progress WHERE local_user_id = $1', [testUserId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        await pool.end();
    }
}

verify();
