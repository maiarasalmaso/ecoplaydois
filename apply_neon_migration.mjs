/**
 * Apply Migration via Neon REST API
 * Usage: node apply_neon_migration.mjs
 */

const NEON_REST_URL = 'https://ep-dark-truth-ai9rr66b.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1';

// Migration SQL
const MIGRATION_SQL = `
-- Add version column for optimistic locking
ALTER TABLE progress 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

-- Create auto-increment trigger
CREATE OR REPLACE FUNCTION increment_progress_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_progress_version ON progress;

CREATE TRIGGER trg_progress_version
    BEFORE UPDATE ON progress
    FOR EACH ROW
    EXECUTE FUNCTION increment_progress_version();

CREATE INDEX IF NOT EXISTS idx_progress_version ON progress(local_user_id, version);
`.trim();

async function applyMigration() {
    console.log('🔄 Aplicando migration via Neon REST API...\n');

    // Get auth token from environment or prompt
    const authToken = process.env.NEON_API_KEY || process.env.NEON_TOKEN;

    if (!authToken) {
        console.error('❌ Token de autenticação não encontrado!');
        console.log('\n📝 Para obter o token:');
        console.log('1. Acesse https://console.neon.tech/');
        console.log('2. Vá em Settings > API Keys');
        console.log('3. Copie o token e adicione no .env:');
        console.log('   NEON_API_KEY=seu_token_aqui\n');
        process.exit(1);
    }

    try {
        // Execute migration
        console.log('📋 Executando SQL...');
        const response = await fetch(`${NEON_REST_URL}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                query: MIGRATION_SQL
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`HTTP ${response.status}: ${error}`);
        }

        const result = await response.json();
        console.log('✅ Migration executada com sucesso!');
        console.log('📊 Resultado:', JSON.stringify(result, null, 2));

        // Verify version column exists
        console.log('\n🔍 Verificando coluna version...');
        const verifyResponse = await fetch(`${NEON_REST_URL}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                query: `
          SELECT column_name, data_type, column_default 
          FROM information_schema.columns 
          WHERE table_name = 'progress' 
          AND column_name = 'version';
        `
            })
        });

        if (verifyResponse.ok) {
            const verifyResult = await verifyResponse.json();
            console.log('✅ Verificação:', JSON.stringify(verifyResult, null, 2));
        }

        console.log('\n🎉 Migration concluída com sucesso!');
        console.log('✅ A coluna "version" foi adicionada à tabela "progress"');
        console.log('✅ O trigger de auto-incremento foi criado');
        console.log('✅ O índice foi criado para melhor performance\n');

    } catch (error) {
        console.error('❌ Erro ao aplicar migration:', error.message);
        console.error('\n🔧 Troubleshooting:');
        console.error('1. Verifique se o token NEON_API_KEY está correto');
        console.error('2. Verifique se a URL REST está acessível');
        console.error('3. Tente executar manualmente no console Neon\n');
        process.exit(1);
    }
}

applyMigration();
