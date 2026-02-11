import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL não encontrada nas variáveis de ambiente');
    process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function runMigration() {
    console.log('🔄 Conectando ao banco Neon...');

    try {
        // Ler o arquivo SQL
        const migrationPath = join(process.cwd(), 'database', 'migrations', '002_add_version_column.sql');
        const sql = readFileSync(migrationPath, 'utf-8');

        console.log('📋 Executando migration: 002_add_version_column.sql');

        // Executar a migration
        await pool.query(sql);

        console.log('✅ Migration executada com sucesso!');

        // Verificar as colunas da tabela progress
        const result = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'progress'
      ORDER BY ordinal_position;
    `);

        console.log('\n📊 Estrutura atual da tabela progress:');
        console.table(result.rows);

        // Verificar se há registros sem version
        const countResult = await pool.query(`
      SELECT COUNT(*) as total, 
             COUNT(version) as com_version,
             COUNT(*) - COUNT(version) as sem_version
      FROM progress;
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
