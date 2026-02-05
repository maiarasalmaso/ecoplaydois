
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try to load .env.development.local from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env.development.local') });
dotenv.config();

console.log('DEBUG: Env path:', path.resolve(__dirname, '../../.env.development.local'));
console.log('DEBUG: POSTGRES_URL exists?', !!process.env.POSTGRES_URL);

async function initDb() {
    // Dynamic import to ensure env is loaded before DB connection is initialized
    const { query } = require('../src/db');
    console.log('🔄 Inicializando banco de dados...');

    try {
        const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at ${schemaPath}`);
        }

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('📜 Executando schema.sql...');
        await query(schemaSql);

        console.log('✅ Banco de dados inicializado com sucesso!');
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Erro ao inicializar DB:', error);
        process.exit(1);
    }
}

initDb();
