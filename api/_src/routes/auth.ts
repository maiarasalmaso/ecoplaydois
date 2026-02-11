import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { comparePassword } from '../utils/security.js';

import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_please_change';

// Get Current User
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
    // 1. Kill Zombie Cache
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        const userId = req.user.userId;
        const result = await query('SELECT id, email, full_name, role, streak, score, avatar FROM users WHERE id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update Current User
router.patch('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;
        const { full_name, avatar } = req.body;

        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (full_name !== undefined) {
            updates.push(`full_name = $${paramCount++}`);
            values.push(full_name);
        }

        if (avatar !== undefined) {
            updates.push(`avatar = $${paramCount++}`);
            values.push(avatar);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(userId); // Add userId as last param

        const queryText = `
            UPDATE users 
            SET ${updates.join(', ')} 
            WHERE id = $${paramCount}
            RETURNING id, email, full_name, role, streak, score, avatar
        `;

        const result = await query(queryText, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Login Route
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find User
        const result = await query('SELECT id, email, password_hash, full_name, role, streak, score, avatar FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify Password
        const isMatch = await comparePassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // ========== STREAK LOGIC ==========
        // Get the user's progress to check last_daily_xp_date
        const progressResult = await query('SELECT last_daily_xp_date FROM progress WHERE local_user_id = $1', [user.id]);
        const lastDailyXpDate = progressResult.rows[0]?.last_daily_xp_date;

        // Calculate today and yesterday in Londrina timezone (Brazil)
        const now = new Date();
        const londrinaOffset = -3 * 60; // UTC-3
        const localNow = new Date(now.getTime() + (londrinaOffset + now.getTimezoneOffset()) * 60000);
        const today = localNow.toISOString().split('T')[0]; // YYYY-MM-DD

        const yesterday = new Date(localNow);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = user.streak || 0;

        if (lastDailyXpDate === today) {
            // Same day login - ensure streak is at least 1
            if (newStreak === 0) {
                newStreak = 1;
                console.log(`[Auth] User ${user.id} streak initialized to 1 (first count today)`);
            } else {
                console.log(`[Auth] User ${user.id} logged in again today. Streak remains: ${newStreak}`);
            }
        } else if (lastDailyXpDate === yesterdayStr) {
            // Consecutive day - increment streak
            newStreak = (user.streak || 0) + 1;
            console.log(`[Auth] User ${user.id} logged in consecutively! Streak: ${user.streak} -> ${newStreak}`);
        } else {
            // Gap or first login ever - reset to 1
            newStreak = 1;
            console.log(`[Auth] User ${user.id} streak reset to 1 (was: ${user.streak}, last: ${lastDailyXpDate})`);
        }

        // Update streak in database
        if (newStreak !== user.streak) {
            try {
                await query('UPDATE users SET streak = $1, last_login = NOW() WHERE id = $2', [newStreak, user.id]);
            } catch (error) {
                // Fallback if last_login column doesn't exist yet
                console.warn('[Auth] last_login column may not exist, updating only streak');
                await query('UPDATE users SET streak = $1 WHERE id = $2', [newStreak, user.id]);
            }
            user.streak = newStreak;
        } else {
            // Update last_login even if streak didn't change
            try {
                await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
            } catch (error) {
                // Silently fail if last_login column doesn't exist yet
                console.warn('[Auth] last_login column does not exist yet, skipping update');
            }
        }
        // ========== END STREAK LOGIC ==========

        // Generate Token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                streak: user.streak,
                score: user.score,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Sync/Fast Login Route (Option A)
router.post('/sync', async (req: Request, res: Response) => {
    try {
        const { username } = req.body;

        if (!username || typeof username !== 'string') {
            return res.status(400).json({ error: 'Nome de usuário é obrigatório' });
        }

        const normalized = username.trim();
        if (normalized.length < 2) {
            return res.status(400).json({ error: 'Nome muito curto' });
        }

        // Tenta encontrar por full_name ou email
        let result = await query(
            'SELECT id, email, full_name, role, streak, score, avatar FROM users WHERE LOWER(full_name) = LOWER($1) OR LOWER(email) = LOWER($1)',
            [normalized]
        );

        let user;
        if (result.rows.length === 0) {
            // Se não existe, cria um novo "usuário rápido"
            const dummyEmail = `${normalized.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}@ecoplay.sync`;
            const dummyPass = 'sync_account_no_password';

            const insertResult = await query(
                `INSERT INTO users (email, password_hash, full_name, role)
                 VALUES ($1, $2, $3, 'CUSTOMER')
                 RETURNING id, email, full_name, role, streak, score, avatar`,
                [dummyEmail, dummyPass, normalized]
            );
            user = insertResult.rows[0];
            console.log(`[Sync] Novo usuário criado: ${normalized}`);
        } else {
            user = result.rows[0];
            console.log(`[Sync] Usuário existente sincronizado: ${normalized}`);
        }

        // Gera token (expiração longa para conveniência cross-device)
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            message: 'Sincronização realizada',
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                streak: user.streak,
                score: user.score,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Erro interno ao sincronizar' });
    }
});

export default router;
