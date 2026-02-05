
import dotenv from 'dotenv';
import path from 'path';

// Try to load .env.development.local from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env.development.local') });
dotenv.config(); // Fallback to default .env

import { query } from '../src/db';

async function validateConnection() {
    console.log('🔄 Tentando conectar ao Banco de Dados (Vercel Postgres)...');

    try {
        const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        if (!connectionString) {
            console.error('❌ Erro: Nenhuma string de conexão encontrada.');
            console.error('   Verifique se POSTGRES_URL ou DATABASE_URL estão definidos no .env');
            console.error('   Execute "npx vercel env pull .env.development.local" após criar o banco.');
            process.exit(1);
        }

        const start = Date.now();
        const result = await query('SELECT NOW() as now, current_database() as db_name, version() as version');
        const duration = Date.now() - start;

        console.log('✅ Conexão bem sucedida!');
        console.log(`⏱️ Latência: ${duration}ms`);
        console.log(`📂 Database: ${result.rows[0].db_name}`);
        console.log(`ℹ️ Versão: ${result.rows[0].version}`);

        // Teste de tabela Users
        console.log('\n🔍 Verificando tabela Users...');
        try {
            const usersCount = await query('SELECT count(*) FROM users');
            console.log(`👥 Usuários cadastrados: ${usersCount.rows[0].count}`);
        } catch (err: any) {
            if (err.code === '42P01') {
                console.warn('⚠️ A tabela users não existe. Execute o schema.sql.');
            } else {
                console.error('❌ Erro ao consultar users:', err.message);
            }
        }

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Falha na conexão com o Banco de Dados:');
        console.error(error.message);
        if (error.message.includes('password authentication failed')) {
            console.error('\n💡 Dica: Verifique se suas credenciais no .env estão corretas.');
        }
        process.exit(1);
    }
}

validateConnection();
