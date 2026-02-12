import { Router, Request, Response } from 'express';
import { query } from '../db.js';
import { hashPassword } from '../utils/security.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = Router();

// Create User (Registration)
router.post('/', async (req: Request, res: Response) => {
    try {
        const { email, password, full_name, role = 'CUSTOMER' } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user exists
        const userCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const hashedPassword = await hashPassword(password);

        const result = await query(
            `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role, created_at`,
            [email, hashedPassword, full_name, role]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) });
    }
});


// Public Leaderboard
router.get('/leaderboard', async (req: Request, res: Response) => {
    try {
        const result = await query(
            `SELECT id, full_name, score, avatar, level 
             FROM users 
             ORDER BY score DESC 
             LIMIT 10`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get Users (Admin only)
router.get('/', authenticateToken, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT id, email, full_name, role, created_at, score, time_spent FROM users LIMIT 100');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ========== DEBUG & CLEANUP ROUTES (ADMIN ONLY) ==========

// DELETE /users/cleanup - Remove all non-admin users and their data
router.delete('/cleanup', authenticateToken, adminMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        console.log('[ADMIN] Starting database cleanup...');

        // 1. Delete progress for non-admin users (CASCADE should handle this, but explicit is safer)
        const progressResult = await query(`
            DELETE FROM progress 
            WHERE local_user_id IN (SELECT id FROM users WHERE role != 'ADMIN')
        `);
        console.log(`[ADMIN] Deleted ${progressResult.rowCount} progress records`);

        // 2. Delete game_scores for non-admin users
        const scoresResult = await query(`
            DELETE FROM game_scores 
            WHERE user_id IN (SELECT id FROM users WHERE role != 'ADMIN')
        `);
        console.log(`[ADMIN] Deleted ${scoresResult.rowCount} game_scores records`);

        // 3. Delete feedback from non-admin users
        const feedbackResult = await query(`
            DELETE FROM feedback_responses 
            WHERE local_user_id IN (SELECT id FROM users WHERE role != 'ADMIN')
        `);
        console.log(`[ADMIN] Deleted ${feedbackResult.rowCount} feedback records`);

        // 4. Delete non-admin users
        const usersResult = await query(`
            DELETE FROM users WHERE role != 'ADMIN'
        `);
        console.log(`[ADMIN] Deleted ${usersResult.rowCount} user records`);

        res.json({
            success: true,
            message: 'Database cleanup complete',
            deleted: {
                users: usersResult.rowCount,
                progress: progressResult.rowCount,
                game_scores: scoresResult.rowCount,
                feedback: feedbackResult.rowCount
            }
        });
    } catch (error) {
        console.error('[ADMIN] Cleanup error:', error);
        res.status(500).json({ error: 'Cleanup failed', details: error instanceof Error ? error.message : String(error) });
    }
});

// GET /users/debug - Full database state dump for debugging
router.get('/debug', authenticateToken, adminMiddleware, async (req: AuthRequest, res: Response) => {
    // Kill cache
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        console.log('[DEBUG] Admin requested full database state...');

        const users = await query('SELECT id, email, full_name, role, score, streak, avatar, created_at FROM users ORDER BY id');
        const progress = await query('SELECT * FROM progress ORDER BY local_user_id');
        const gameScores = await query('SELECT * FROM game_scores ORDER BY id DESC LIMIT 50');
        const feedback = await query('SELECT id, user_name, score, created_at FROM feedback_responses ORDER BY created_at DESC LIMIT 20');

        res.json({
            timestamp: new Date().toISOString(),
            tables: {
                users: {
                    count: users.rows.length,
                    data: users.rows
                },
                progress: {
                    count: progress.rows.length,
                    data: progress.rows
                },
                game_scores: {
                    count: gameScores.rows.length,
                    data: gameScores.rows
                },
                feedback: {
                    count: feedback.rows.length,
                    data: feedback.rows
                }
            }
        });
    } catch (error) {
        console.error('[DEBUG] Error fetching database state:', error);
        res.status(500).json({ error: 'Debug failed', details: error instanceof Error ? error.message : String(error) });
    }
});

export default router;
