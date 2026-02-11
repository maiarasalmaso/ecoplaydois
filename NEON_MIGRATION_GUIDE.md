# 🔧 Guia: Aplicar Migration no Banco Neon

## ⚠️ IMPORTANTE: Migration Necessária para Isolamento de Dados

As correções de isolamento de dados requerem uma coluna `version` na tabela `progress` para controle de concorrência.

---

## 📋 Opção 1: Aplicar via Console Neon (RECOMENDADO)

### Passo 1: Acessar o Console Neon
1. Acesse: https://console.neon.tech/
2. Selecione seu projeto **EcoPlay**
3. Clique em **SQL Editor**

### Passo 2: Copiar e Executar o SQL

Copie o SQL abaixo e cole no SQL Editor:

```sql
-- Add version column if it doesn't exist
ALTER TABLE progress 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

-- Create trigger to auto-increment version on UPDATE
CREATE OR REPLACE FUNCTION increment_progress_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (to make this idempotent)
DROP TRIGGER IF EXISTS trg_progress_version ON progress;

-- Create the trigger
CREATE TRIGGER trg_progress_version
    BEFORE UPDATE ON progress
    FOR EACH ROW
    EXECUTE FUNCTION increment_progress_version();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_progress_version ON progress(local_user_id, version);
```

### Passo 3: Verificar
Execute este query para confirmar:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'progress' 
AND column_name = 'version';
```

**Resultado Esperado:**
| column_name | data_type | column_default |
|-------------|-----------|----------------|
| version     | integer   | 1              |

---

## 📋 Opção 2: Aplicar via Script (Se tiver DATABASE_URL local)

### Passo 1: Configurar .env
Adicione a DATABASE_URL do Neon no arquivo `.env`:

```bash
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Passo 2: Executar Migration
```bash
node database/migrations/run_migration.mjs
```

---

## ✅ Validação Pós-Migration

Execute este query para verificar a estrutura completa:

```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'progress'
ORDER BY ordinal_position;
```

**Colunas Esperadas:**
- ✅ `local_user_id` - INTEGER
- ✅ `score` - INTEGER
- ✅ `badges` - ARRAY
- ✅ `badge_unlocks` - JSONB
- ✅ `stats` - JSONB
- ✅ `completed_levels` - JSONB
- ✅ `last_daily_xp_date` - TEXT
- ✅ `unclaimed_rewards` - ARRAY
- ✅ `updated_at` - TIMESTAMP
- ✅ `energy` - BIGINT
- ✅ `eco_credits` - BIGINT
- ✅ `version` - INTEGER ← **NOVA**

---

## 🔍 Verificar Registros Existentes

Para ver se há registros que precisam de atenção:

```sql
SELECT 
    local_user_id,
    score,
    energy,
    eco_credits,
    version,
    updated_at
FROM progress
ORDER BY local_user_id
LIMIT 10;
```

---

## 🚨 Troubleshooting

### Erro: "column 'version' already exists"
✅ **Seguro ignorar** - A migration usa `IF NOT EXISTS`

### Erro: "function increment_progress_version already exists"
✅ **Seguro ignorar** - A migration usa `CREATE OR REPLACE`

### Erro: "trigger already exists"
✅ **Seguro ignorar** - A migration usa `DROP TRIGGER IF EXISTS`

---

## 📊 Impacto da Migration

- ✅ **Zero Downtime** - Adiciona colunas sem bloquear tabela
- ✅ **Backward Compatible** - Valores padrão para registros existentes
- ✅ **Idempotente** - Pode ser executada múltiplas vezes sem erro

---

## 🎯 Por Que Esta Migration é Necessária?

A coluna `version` implementa **Optimistic Locking** (bloqueio otimista):

1. **Previne Conflitos**: Detecta quando dois usuários tentam salvar ao mesmo tempo
2. **Garante Consistência**: Versão é incrementada automaticamente a cada atualização
3. **Habilita Retry**: Frontend pode retry automático em caso de conflito

**Sem esta coluna:**
- ❌ Dados de um usuário podem sobrescrever dados de outro
- ❌ Salvamentos simultâneos causam perda de dados

**Com esta coluna:**
- ✅ Conflitos são detectados e rejeitados
- ✅ Cliente é notificado para recarregar dados atualizados
- ✅ Isolamento de dados garantido

---

## 📝 Próximos Passos Após Migration

1. ✅ Executar a migration no Neon
2. ✅ Verificar que a coluna `version` existe
3. ✅ Redeployar a aplicação (já feito!)
4. ✅ Testar criação de novo usuário
5. ✅ Validar isolamento de dados

---

**Status:** ⏳ **AGUARDANDO EXECUÇÃO DA MIGRATION**  
**Prioridade:** 🔴 **ALTA** (Necessária para isolamento de dados funcionar)  
**Tempo Estimado:** 2 minutos
