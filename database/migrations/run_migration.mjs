import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config(); // Also load .env as fallback

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL (ou POSTGRES_URL) não encontrada nas variáveis de ambiente');
    process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function runMigration() {
    console.log('🔄 Conectando ao banco Neon...');

    try {
        // Ler o arquivo SQL
        const migrationPath = join(process.cwd(), 'database', 'migrations', '003_add_last_login_tracking.sql');
        const sql = readFileSync(migrationPath, 'utf-8');

        console.log('📋 Executando migration: 003_add_last_login_tracking.sql');

        // Executar a migration
        await pool.query(sql);

        console.log('✅ Migration executada com sucesso!');

        // Verificar as colunas da tabela users
        const result = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      AND column_name IN ('last_login', 'streak')
      ORDER BY ordinal_position;
    `);

        console.log('\n📊 Estrutura atual da tabela users (parcial):');
        console.table(result.rows);

        // Verificar stats de usuários
        const countResult = await pool.query(`
      SELECT COUNT(*) as total, 
             COUNT(last_login) as com_last_login,
             MAX(streak) as maior_streak
      FROM users;
    `);

        console.log('\n📈 Status dos registros:');
        console.table(countResult.rows);

    } catch (error) {
        console.error('❌ Erro ao executar migration:', error);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('\n👋 Conexão fechada');
    }
}

runMigration();
