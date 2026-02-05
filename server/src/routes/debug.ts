
import { Router } from 'express';
import { query } from '../db';

const router = Router();

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

export default router;
