
import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// Simple maintenance key (should match a secret you know)
const MAINTENANCE_KEY = 'ecoplay-maint-2026';

router.get('/', async (req, res) => {
    try {
        const start = Date.now();
        // Simple query to check connection
        const result = await query('SELECT NOW() as now');
        const duration = Date.now() - start;

        res.json({
            status: 'connected',
            timestamp: result.rows[0].now,
            latency_ms: duration,
            env_check: {
                has_database_url: !!process.env.DATABASE_URL,
                has_postgres_url: !!process.env.POSTGRES_URL,
                node_env: process.env.NODE_ENV
            }
        });
    } catch (error: any) {
        console.error('DB Connection Failed:', error);
        res.status(500).json({
            status: 'error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            env_check: {
                has_database_url: !!process.env.DATABASE_URL,
                has_postgres_url: !!process.env.POSTGRES_URL
            }
        });
    }
});

// ========== MAINTENANCE ROUTES (Protected by secret key) ==========

// GET /full - Full database state dump
router.get('/full', async (req, res) => {
    const key = req.query.key;
    if (key !== MAINTENANCE_KEY) {
        return res.status(403).json({ error: 'Invalid maintenance key' });
    }

    res.setHeader('Cache-Control', 'no-store');

    try {
        const users = await query('SELECT id, email, full_name, role, score, streak, avatar, created_at FROM users ORDER BY id');
        const progress = await query('SELECT * FROM progress ORDER BY local_user_id');
        const gameScores = await query('SELECT * FROM game_scores ORDER BY id DESC LIMIT 50');
        const feedback = await query('SELECT id, user_name, score, created_at FROM feedback_responses ORDER BY created_at DESC LIMIT 20');

        res.json({
            timestamp: new Date().toISOString(),
            tables: {
                users: { count: users.rows.length, data: users.rows },
                progress: { count: progress.rows.length, data: progress.rows },
                game_scores: { count: gameScores.rows.length, data: gameScores.rows },
                feedback: { count: feedback.rows.length, data: feedback.rows }
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Debug failed', details: error.message });
    }
});

// DELETE /cleanup - Remove all non-admin users
router.delete('/cleanup', async (req, res) => {
    const key = req.query.key;
    if (key !== MAINTENANCE_KEY) {
        return res.status(403).json({ error: 'Invalid maintenance key' });
    }

    try {
        console.log('[MAINTENANCE] Starting database cleanup...');

        const progressResult = await query(`
            DELETE FROM progress 
            WHERE local_user_id IN (SELECT id FROM users WHERE role != 'ADMIN')
        `);

        const scoresResult = await query(`
            DELETE FROM game_scores 
            WHERE user_id IN (SELECT id FROM users WHERE role != 'ADMIN')
        `);

        const feedbackResult = await query(`
            DELETE FROM feedback_responses 
            WHERE local_user_id IN (SELECT id FROM users WHERE role != 'ADMIN')
        `);

        const usersResult = await query(`
            DELETE FROM users WHERE role != 'ADMIN'
        `);

        res.json({
            success: true,
            message: 'Cleanup complete - All non-admin users removed',
            deleted: {
                users: usersResult.rowCount,
                progress: progressResult.rowCount,
                game_scores: scoresResult.rowCount,
                feedback: feedbackResult.rowCount
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Cleanup failed', details: error.message });
    }
});

// POST /migrate - Run pending migrations
router.post('/migrate', async (req, res) => {
    const key = req.query.key;
    if (key !== MAINTENANCE_KEY) {
        return res.status(403).json({ error: 'Invalid maintenance key' });
    }

    try {
        console.log('[MAINTENANCE] Running migrations...');

        // 1. Add Index
        await query('CREATE INDEX IF NOT EXISTS idx_users_score_desc ON users(score DESC)');

        // 2. Add Columns
        await query(`
            ALTER TABLE progress ADD COLUMN IF NOT EXISTS energy BIGINT DEFAULT 0;
            ALTER TABLE progress ADD COLUMN IF NOT EXISTS eco_credits BIGINT DEFAULT 0;
        `);

        // 3. Migrate Data
        await query(`
            UPDATE progress
            SET 
                energy = COALESCE((stats->>'saved_energy')::BIGINT, 0),
                eco_credits = COALESCE((stats->>'saved_credits')::BIGINT, 0)
            WHERE 
                stats IS NOT NULL 
                AND (energy = 0 AND eco_credits = 0);
        `);

        res.json({
            success: true,
            message: 'Migrations completed successfully'
        });
    } catch (error: any) {
        console.error('[MAINTENANCE] Migration error:', error);
        res.status(500).json({ error: 'Migration failed', details: error.message });
    }
});

export default router;
