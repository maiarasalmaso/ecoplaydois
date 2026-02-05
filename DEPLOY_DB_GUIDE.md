
# Guia de Deploy do Banco de Dados EcoPlay

## ✅ Status Atual
- **Banco de Dados**: Configurado (Vercel Postgres / Neon)
- **Schema**: Inicializado (Tabelas: Users, Games, GameProgress)
- **Conexão Local**: Validada com sucesso

## 🚀 Como testar localmente
Seus scripts de teste estão em `server/scripts`:

1. **Validar conexão**:
   ```powershell
   cd server; npx ts-node scripts/validate-db.ts
   ```

2. **Reiniciar Banco (Apaga tudo e recria tabelas)**:
   ```powershell
   cd server; npx ts-node scripts/init-db.ts
   ```

## 📦 Como fazer Deploy
Para subir a aplicação completa para a Vercel com as novas configurações:

1. **Sincronizar Variáveis de Ambiente (Se necessário)**:
   ```powershell
   npx vercel env pull .env.development.local
   ```

2. **Deploy para Produção**:
   ```powershell
   npx vercel deploy --prod
   ```

## 🛠️ Detalhes da Implementação
- **Cliente**: Usamos `@vercel/postgres` para pooling automático.
- **Pooling**: O script `db.ts` usa variaveis de ambiente nativas da Vercel.
- **Edge Ready**: A configuração é compatível com Edge Functions se necessário no futuro.

---
**Observação**: O banco foi resetado para garantir que o Schema use UUIDs corretamente.
