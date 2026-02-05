
Write-Host "🔄 Sincronizando variáveis de ambiente da Vercel..."
npx vercel env pull .env.development.local

Write-Host "`n🚀 Testando conexão com o banco..."
cd server
npx ts-node scripts/validate-db.ts
cd ..
