# 🔐 INSTRUÇÕES DE SEGURANÇA - ECPLAY

## ⚠️ IMPORTANTE: Nunca commit credenciais reais!

### 🔑 Configuração Segura de Variáveis de Ambiente

1. **Copie o arquivo exemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Preencha com suas credenciais reais:**
   - Obtenha suas credenciais do [Supabase](https://supabase.com)
   - Obtenha sua API key do [Google AI Studio](https://makersuite.google.com/app/apikey)

3. **Mantenha o .env fora do versionamento:**
   ```bash
   echo ".env" >> .gitignore
   ```

### 🚨 Credenciais Comprometidas

**As seguintes credenciais foram encontradas expostas e devem ser consideradas comprometidas:**

- `VITE_SUPABASE_URL=https://uhhjyeuirbqlespanftj.supabase.co`
- `VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- `VITE_GEMINI_API_KEY=AIzaSyAYzSLORXEzZLvNRAonjP6gJcjbpoTvVu4`

### 🔄 Ações Necessárias

1. **Revogar imediatamente** as credenciais no Supabase e Google AI Studio
2. **Gerar novas credenciais** e configurar no .env local
3. **Verificar logs de acesso** para atividades suspeitas
4. **Implementar rotação regular** de credenciais

### 🔒 Boas Práticas de Segurança

- **Nunca** commite arquivos .env com credenciais reais
- **Use** variáveis de ambiente do servidor em produção
- **Implemente** rate limiting nas APIs
- **Monitore** uso de credenciais
- **Use** HTTPS sempre em produção

### 📞 Em Caso de Dúvidas

Consulte a documentação de segurança do Supabase e Google Cloud para orientações específicas sobre proteção de credenciais.