import { Router, Response } from 'express';
import { query } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = Router();

// Submit Feedback (Protected)
// Submit Feedback (Protected)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;
        const {
            id,
            score,
            level,
            badges,
            ux,
            learning,
            meta
        } = req.body;

        const queryText = `
            INSERT INTO feedback_responses (
                id, local_user_id, score, level, badges, ux, learning, meta, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            ON CONFLICT (id) DO UPDATE SET
                score = EXCLUDED.score,
                level = EXCLUDED.level,
                badges = EXCLUDED.badges,
                ux = EXCLUDED.ux,
                learning = EXCLUDED.learning,
                meta = EXCLUDED.meta,
                local_user_id = EXCLUDED.local_user_id
            RETURNING *
        `;

        const values = [
            id,
            userId,
            score || 0,
            level || null,
            badges || [],
            ux || {},
            learning || {},
            meta || {}
        ];

        const result = await query(queryText, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get Feedback (Admin only)
router.get('/', authenticateToken, adminMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const result = await query(
            `SELECT f.id, f.score, f.level, f.ux, f.learning, f.meta, f.created_at, u.full_name, u.email 
       FROM feedback_responses f 
       LEFT JOIN users u ON f.local_user_id = u.id 
       ORDER BY f.created_at DESC 
       LIMIT 50`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
