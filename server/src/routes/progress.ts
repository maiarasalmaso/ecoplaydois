import { Router, Response } from 'express';
import { query } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get Progress
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;
        const result = await query('SELECT * FROM progress WHERE local_user_id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.json(null);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Upsert Progress
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;
        const {
            score,
            badges,
            badge_unlocks, // Frontend sends camelCase 'badgeUnlocks' usually, need to check adapter
            stats,
            completed_levels,
            last_daily_xp_date,
            unclaimed_rewards
        } = req.body;

        // Note: The frontend adapter needs to map keys to snake_case or we handle it here.
        // Let's assume the frontend sends what the DB expects or we map it.
        // The adapter I plan to write will send snake_case to match the Supabase row structure.

        const queryText = `
            INSERT INTO progress (
                local_user_id, score, badges, badge_unlocks, stats, 
                completed_levels, last_daily_xp_date, unclaimed_rewards, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            ON CONFLICT (local_user_id) DO UPDATE SET
                score = EXCLUDED.score,
                badges = EXCLUDED.badges,
                badge_unlocks = EXCLUDED.badge_unlocks,
                stats = EXCLUDED.stats,
                completed_levels = EXCLUDED.completed_levels,
                last_daily_xp_date = EXCLUDED.last_daily_xp_date,
                unclaimed_rewards = EXCLUDED.unclaimed_rewards,
                updated_at = NOW()
            RETURNING *
        `;

        const values = [
            userId,
            score || 0,
            badges || [],
            badge_unlocks || {},
            stats || {},
            completed_levels || {},
            last_daily_xp_date || null,
            unclaimed_rewards || []
        ];

        const result = await query(queryText, values);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving progress:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
