import { Router, Request, Response } from 'express';
import { query } from '../db';
import { hashPassword } from '../utils/security';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

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
            `SELECT id, full_name, score, avatar 
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

export default router;
