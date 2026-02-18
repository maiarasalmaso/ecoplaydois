
Write-Host "🔄 Sincronizando variáveis de ambiente da Vercel..."
npx vercel env pull .env.development.local

Write-Host "`n🚀 Testando conexão com o banco..."
node scripts/check-tables.js
