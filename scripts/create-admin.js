import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.development.local') });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

async function createAdmin() {
    console.log("🛠️ Criando usuário administrador...");
    const pool = new Pool({ connectionString });

    try {
        const email = 'admin@gmail.com';
        const password = 'admin';
        const fullName = 'Administrador EcoPlay';
        const role = 'ADMIN';

        // Hash da senha
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Inserir no banco
        const queryText = `
            INSERT INTO users (email, password_hash, full_name, role)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (email) DO UPDATE SET
                role = 'ADMIN',
                password_hash = $2
            RETURNING id, email, role;
        `;

        const result = await pool.query(queryText, [email, hashedPassword, fullName, role]);

        console.log("✅ Administrador criado/atualizado com sucesso!");
        console.log(`📧 Email: ${result.rows[0].email}`);
        console.log(`🛡️ Role: ${result.rows[0].role}`);
        console.log(`🔑 Senha: ${password}`);

    } catch (error) {
        console.error("❌ Falha ao criar administrador:", error);
    } finally {
        await pool.end();
    }
}

createAdmin();
