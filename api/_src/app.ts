import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { query } from './db.js';
import userRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import gamesRouter from './routes/games.js';
import feedbackRouter from './routes/feedback.js';
import quizRouter from './routes/quiz.js';
import progressRouter from './routes/progress.js';
import debugRouter from './routes/debug.js';


dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: '*', // Allow Vercel frontend to access
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Middleware to debug Vercel paths
app.use((req, res, next) => {
    console.log(`[API Request] ${req.method} ${req.originalUrl}`);
    next();
});

// Routes - adjusted paths for Vercel
// We mount on /api explicitly.
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/games', gamesRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/progress', progressRouter);

app.use('/api/debug-db', debugRouter);

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const result = await query('SELECT NOW()');
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            db_time: result.rows[0].now
        });
    } catch (error: any) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            details: error.message,
            code: error.code
        });
    }
});

// Root Route
app.get('/api', (req, res) => {
    res.json({
        message: 'EcoPlay API está rodando na Vercel 🚀',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth'
        }
    });
});

export default app;
