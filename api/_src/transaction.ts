import { Request, Response } from 'express';
import { PoolClient } from 'pg';
import { getPool, getClient } from './db.js';
import { AuthRequest } from './middleware/auth.js';

interface SubTransactionResult {
    status: number;
    data: any;
}

export const withTransaction = async (
    req: AuthRequest,
    res: Response,
    handler: (client: PoolClient) => Promise<SubTransactionResult>
) => {
    const userId = req.user?.userId;
    const idempotencyKey = req.headers['idempotency-key'] as string;

    let client: PoolClient | null = null;

    try {
        client = await getClient();

        // 1. Check Idempotency (if key provided)
        if (idempotencyKey) {
            // Check if processed
            const existing = await client.query(
                'SELECT response_payload FROM idempotency_keys WHERE key = $1 AND user_id = $2',
                [idempotencyKey, userId]
            );

            if (existing.rows.length > 0 && existing.rows[0].response_payload) {
                console.log(`[Idempotency] Returning cached response for key: ${idempotencyKey}`);
                const cached = existing.rows[0].response_payload;
                return res.status(cached.status).json(cached.data);
            }

            // If key exists but no payload, it might be in-progress (locked) or failed.
            // For simplicity, we'll assume if it's there without payload, it's a stale lock or failed try. 
            // In rigorous systems, you'd check 'locked_until'.
            // Here, we'll proceed to re-try processing or insert the key.
        }

        // 2. Start Transaction
        await client.query('BEGIN');

        // 3. Set RLS Context
        if (userId) {
            // Safe parameter injection for RLS context
            await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [userId.toString()]);
        }

        // 4. Insert Idempotency Lock (if key provided)
        if (idempotencyKey) {
            await client.query(
                `INSERT INTO idempotency_keys (key, user_id, locked_until) 
                 VALUES ($1, $2, NOW() + INTERVAL '1 minute')
                 ON CONFLICT (key) DO UPDATE SET locked_until = NOW() + INTERVAL '1 minute'`,
                [idempotencyKey, userId]
            );
        }

        // 5. Execute Business Logic
        const result = await handler(client);

        // 6. Store Response for Idempotency
        if (idempotencyKey) {
            await client.query(
                `UPDATE idempotency_keys 
                 SET response_payload = $1, locked_until = NULL 
                 WHERE key = $2`,
                [JSON.stringify(result), idempotencyKey]
            );
        }

        // 7. Commit
        await client.query('COMMIT');

        // 8. Send Response
        return res.status(result.status).json(result.data);

    } catch (error: any) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rbError) {
                console.error('Rollback failed:', rbError);
            }
        }

        // Handle specific errors
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'Conflict', message: error.detail });
        }

        // Manual Conflict Check (custom error thrown by handler)
        if (error.message === 'Version Mismatch') {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Data has changed since last read. Please refresh.'
            });
        }

        console.error('Transaction Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (client) {
            client.release();
        }
    }
};
