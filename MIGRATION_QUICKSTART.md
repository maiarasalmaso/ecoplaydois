# 🚀 Aplicar Migration no Neon - GUIA RÁPIDO

## ⚡ Método Automatizado (Recomendado)

### Passo 1: Obter Token de API do Neon

1. Acesse: https://console.neon.tech/app/settings/api-keys
2. Clique em **"Create API Key"** ou **"Generate New Token"**
3. Copie o token gerado

### Passo 2: Configurar Token

Adicione o token no arquivo `.env`:

```bash
NEON_API_KEY=neon_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Passo 3: Executar Script

```bash
node apply_neon_migration.mjs
```

**Pronto!** ✅ A migration será aplicada automaticamente.

---

## 📋 Método Manual (Alternativo)

Se preferir aplicar manualmente no console:

### 1. Acesse o SQL Editor do Neon
🔗 https://console.neon.tech/

### 2. Execute este SQL:

```sql
ALTER TABLE progress 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

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
```

---

## ✅ Verificação

Após executar (por script ou manualmente), verifique se funcionou:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'progress' 
AND column_name = 'version';
```

**Deve retornar:**
```
column_name | data_type | column_default
version     | integer   | 1
```

---

## 🎯 Resumo

| Método | Vantagem | Tempo |
|--------|----------|-------|
| **Script Automatizado** | Rápido, automático, com verificação | ~30 segundos |
| **Manual no Console** | Não precisa de token API | ~2 minutos |

**Recomendação:** Use o método automatizado se tiver acesso às API Keys do Neon.

---

## 📊 Status Geral do Deploy

| Item | Status |
|------|--------|
| ✅ Código Backend | Corrigido |
| ✅ Código Frontend | Corrigido |
| ✅ Deploy Vercel | Concluído |
| ⏳ Migration Neon | **Aguardando execução** |

Após executar a migration, o sistema estará 100% funcional com isolamento de dados garantido! 🎉
