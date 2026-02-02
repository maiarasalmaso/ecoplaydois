import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { query } from './db';
import userRouter from './routes/users';
import authRouter from './routes/auth';
import gamesRouter from './routes/games';
import feedbackRouter from './routes/feedback';
import quizRouter from './routes/quiz';
import progressRouter from './routes/progress';

dotenv.config();
// Trigger restart for env vars and changes

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/games', gamesRouter);
app.use('/feedback', feedbackRouter);
app.use('/quiz', quizRouter);
app.use('/progress', progressRouter); // New route

app.get('/health', async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT NOW()');
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            db_time: result.rows[0].now
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
});

// Root Route
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'EcoPlay API está rodando 🚀',
        endpoints: {
            health: '/health',
            auth: '/auth',
            users: '/users',
            games: '/games',
            feedback: '/feedback'
        }
    });
});

// Start Server
app.listen(PORT as number, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
