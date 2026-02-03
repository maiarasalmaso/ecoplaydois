// Super Monolithic API Entry Point (JS)
// This file consolidates the critical backend logic to avoid Vercel module resolution issues.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pg from 'pg';
import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken'; // Add when Login is implemented here

const { Pool } = pg;

// --- Database Connection ---
const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const isSupabase = connectionString?.includes('supabase');
const isNeon = connectionString?.includes('neon.tech');

const pool = new Pool({
    connectionString,
    ssl: (isProduction || isSupabase || isNeon) ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => console.error('Unexpected error on idle client', err));

const query = (text, params) => pool.query(text, params);

// --- Express App Setup ---
const app = express();

app.use(helmet());
app.use(cors({ origin: '*', allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(morgan('dev'));
app.use(express.json());

// --- Routes ---

// 1. Health Check
app.get('/api/health', async (req, res) => {
    try {
        const result = await query('SELECT NOW()');
        res.json({ status: 'ok', db_time: result.rows[0].now });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({ status: 'error', message: 'DB Connection Failed' });
    }
});

// 2. Users / Register
app.post('/api/users', async (req, res) => {
    try {
        const { email, password, full_name, role = 'CUSTOMER' } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check user exists
        const userCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert
        const result = await query(
            `INSERT INTO users (email, password_hash, full_name, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, email, full_name, role, created_at`,
            [email, password_hash, full_name, role]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// 3. Hello (Test)
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from Monolith API!' });
});

export default app;
