import { Router, Response } from 'express';
import { query } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Submit Score (Protected)
router.post('/score', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { gameId, score } = req.body;
        const userId = req.user.userId;

        if (!gameId || score === undefined) {
            return res.status(400).json({ error: 'Missing gameId or score' });
        }

        const result = await query(
            `INSERT INTO game_scores (user_id, game_id, score) 
       VALUES ($1, $2, $3) 
       RETURNING id, game_id, score, played_at`,
            [userId, gameId, score]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error submitting score:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get Leaderboard (Public)
router.get('/:gameId/leaderboard', async (req: AuthRequest, res: Response) => {
    try {
        const { gameId } = req.params;

        const result = await query(
            `SELECT u.full_name, gs.score, gs.played_at 
       FROM game_scores gs 
       JOIN users u ON gs.user_id = u.id 
       WHERE gs.game_id = $1 
       ORDER BY gs.score DESC 
       LIMIT 10`,
            [gameId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
