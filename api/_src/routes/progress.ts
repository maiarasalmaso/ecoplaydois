import { Router, Response } from 'express';
import { query } from '../db.js';
import { withTransaction } from '../transaction.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

import { calculateProduction } from '../utils/gameRules.js';
import { getLevel, LEVELS } from '../utils/gamification.js';

const router = Router();

// Get Progress
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    // 1. Kill Zombie Cache
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        const userId = req.user.userId;
        console.log(`[API] Fetching progress for user ${userId}...`);
        const result = await query('SELECT * FROM progress WHERE local_user_id = $1', [userId]);

        if (result.rows.length === 0) {
            console.log(`[API] No progress found for user ${userId}. Creating initial zeroed record...`);

            // Create initial zeroed progress for new user
            const initialProgress = {
                score: 0,
                badges: [],
                badge_unlocks: {},
                stats: {
                    xp: 0,
                    logins: 1,
                    streak: 0,
                    timeSpentSeconds: 0,
                    saved_energy: 0,
                    saved_credits: 0,
                    saved_modules: {}
                },
                completed_levels: {},
                last_daily_xp_date: null,
                unclaimed_rewards: [],
                energy: 0,
                eco_credits: 0
            };

            const insertResult = await query(`
                INSERT INTO progress (
                    local_user_id, score, badges, badge_unlocks, stats, 
                    completed_levels, last_daily_xp_date, unclaimed_rewards, 
                    energy, eco_credits, version, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, NOW())
                RETURNING *
            `, [
                userId,
                initialProgress.score,
                JSON.stringify(initialProgress.badges),
                JSON.stringify(initialProgress.badge_unlocks),
                JSON.stringify(initialProgress.stats),
                JSON.stringify(initialProgress.completed_levels),
                initialProgress.last_daily_xp_date,
                JSON.stringify(initialProgress.unclaimed_rewards),
                initialProgress.energy,
                initialProgress.eco_credits
            ]);

            console.log(`[API] Initial progress created for user ${userId}`);
            return res.json(insertResult.rows[0]);
        }

        const row = result.rows[0];

        // 2. Server-side Offline Calculation (Anti-Cheat)
        // We rely on server timestamp 'updated_at' instead of client trust
        const lastUpdate = new Date(row.updated_at).getTime();
        const now = Date.now();
        const secondsOffline = Math.max(0, Math.floor((now - lastUpdate) / 1000));

        if (secondsOffline > 10) { // Only calculate if significant time passed
            const savedModules = row.stats?.saved_modules || {};
            const productionPerSec = calculateProduction(savedModules);

            if (productionPerSec > 0) {
                // 🔒 CAP: Maximum 24 hours of offline production
                const MAX_OFFLINE_SECONDS = 24 * 60 * 60; // 24 hours
                const cappedOfflineTime = Math.min(secondsOffline, MAX_OFFLINE_SECONDS);

                const earnedEnergy = Math.floor(productionPerSec * cappedOfflineTime);
                const earnedCredits = Math.floor(earnedEnergy * 0.1); // 10% rate

                // Update the response object (not DB yet, client will sync back)
                // We use the new dedicated columns preferentially
                const currentEnergy = Number(row.energy || row.stats?.saved_energy || 0);
                const currentCredits = Number(row.eco_credits || row.stats?.saved_credits || 0);

                // 🔒 CAP: Maximum reasonable values
                const MAX_ENERGY = 1_000_000_000; // 1 billion
                const MAX_CREDITS = 100_000_000; // 100 million

                row.energy = Math.min(currentEnergy + earnedEnergy, MAX_ENERGY);
                row.eco_credits = Math.min(currentCredits + earnedCredits, MAX_CREDITS);

                // Update the stats JSON too for compatibility with older frontends
                if (row.stats) {
                    row.stats.saved_energy = row.energy;
                    row.stats.saved_credits = row.eco_credits;
                }

                console.log(`[API] Server calculated offline gains for user ${userId}: +${earnedEnergy} Energy (Offline for ${cappedOfflineTime}s, capped from ${secondsOffline}s)`);
            }
        }

        console.log(`[API] Progress found and returning for user ${userId}`);
        res.json(row);
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Upsert Progress
// Upsert Progress (Transactional & Idempotent)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    return withTransaction(req, res, async (client) => {
        const userId = req.user.userId;
        const {
            score,
            badges,
            badge_unlocks,
            stats,
            completed_levels,
            last_daily_xp_date,
            unclaimed_rewards,
            version // Client must send the version it has
        } = req.body;

        const energy = Number(stats?.saved_energy) || 0;
        const ecoCredits = Number(stats?.saved_credits) || 0;

        console.log(`[API] Processing progress save for user ${userId} (ver: ${version || '?'})...`);

        // 1. Check for current version to prevent conflicts (Optimistic Locking)
        // We use FOR UPDATE to lock the row if it exists, ensuring serialization for this user.
        const currentRes = await client.query(
            'SELECT version FROM progress WHERE local_user_id = $1 FOR UPDATE',
            [userId]
        );

        if (currentRes.rows.length > 0) {
            const currentVersion = currentRes.rows[0].version;

            // If client sent a version, strictly check it.
            // If client didn't send version, we might allow overwrite OR fail. 
            // Given "Consistência Forte", we should assume strictness, but for migration safety:
            if (version !== undefined && version !== null && version !== currentVersion) {
                console.warn(`[API] Version Mismatch for user ${userId}. Client: ${version}, DB: ${currentVersion}`);
                throw new Error('Version Mismatch');
            }
        }

        // 2. Upsert Logic
        // Calculate Level Server-Side
        const finalScore = score || 0;
        const currentLevelInfo = getLevel(finalScore);
        const levelIndex = LEVELS.indexOf(currentLevelInfo); // 0-based index or actual level number depending on logic. 
        // Frontend 'LEVELS' doesn't have an ID, just index. 
        // Let's use the index as the level number (0 = Iniciante, 1 = Aprendiz...)
        // OR better, let's just use the index for now as "level".
        const currentLevel = LEVELS.indexOf(currentLevelInfo);

        const queryText = `
            INSERT INTO progress (
                local_user_id, score, badges, badge_unlocks, stats, 
                completed_levels, last_daily_xp_date, unclaimed_rewards, updated_at,
                energy, eco_credits, version, level
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, 1, $11)
            ON CONFLICT (local_user_id) DO UPDATE SET
                score = EXCLUDED.score,
                badges = EXCLUDED.badges,
                badge_unlocks = EXCLUDED.badge_unlocks,
                stats = EXCLUDED.stats,
                completed_levels = EXCLUDED.completed_levels,
                last_daily_xp_date = EXCLUDED.last_daily_xp_date,
                unclaimed_rewards = EXCLUDED.unclaimed_rewards,
                updated_at = NOW(),
                energy = EXCLUDED.energy,
                eco_credits = EXCLUDED.eco_credits,
                level = EXCLUDED.level
                -- version is auto-incremented by trigger
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
            unclaimed_rewards || [],
            energy,
            ecoCredits,
            currentLevel
        ];

        const result = await client.query(queryText, values);

        // 3. Sync User Score and Time Spent (User Table) - Atomic with this transaction
        const timeSpent = Number(stats?.timeSpentSeconds) || 0;
        await client.query(
            'UPDATE users SET score = $1, time_spent = $2, level = $3 WHERE id = $4',
            [score || 0, timeSpent, currentLevel, userId]
        );

        console.log(`[API] Progress saved successfully for user ${userId} (New Version: ${result.rows[0].version}, Time: ${timeSpent}s)`);

        return { status: 200, data: result.rows[0] };
    });
});

export default router;
