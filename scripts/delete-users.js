import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.development.local') });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

async function deleteAllUsers() {
    console.log("🧹 Iniciando a exclusão de todos os usuários...");
    const pool = new Pool({ connectionString });

    try {
        // Devido ao ON DELETE CASCADE no schema, deletar de 'users'
        // limpará automaticamente 'progress', 'game_scores', etc.
        const result = await pool.query('DELETE FROM users');

        console.log(`✅ Sucesso! ${result.rowCount} usuário(s) removido(s).`);
        console.log("Reiniciando a contagem de IDs (SERIAL)...");

        await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');

        console.log("✨ O banco de dados está limpo para novos testes.");
    } catch (error) {
        console.error("❌ Falha ao excluir usuários:", error);
    } finally {
        await pool.end();
    }
}

deleteAllUsers();
