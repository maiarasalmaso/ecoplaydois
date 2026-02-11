# Guia de Deploy 100% na Vercel (Frontend e Backend) 🚀

Este guia explica como colocar seu projeto EcoPlay no ar **usando apenas a Vercel** para tudo (Site e API), sem precisar do Render.

A arquitetura será:
1.  **Frontend + Backend**: Ambos na **Vercel** (Site React na raiz, API em Funções Serverless).
2.  **Banco de Dados**: Hospedado no **Supabase** ou **Neon** (Postgres).

---

## Passo 1: Banco de Dados (Postgres)

Você precisa de uma URL de conexão Postgres (`postgres://...`). Recomendamos **Supabase** ou **Neon**.

### Opção A: Supabase (Recomendado)
1.  Acesse [database.new](https://database.new/).
2.  Crie um projeto e anote a **senha**.
3.  Vá em **Project Settings** -> **Database** -> **Connection String**.
4.  Copie a string que começa com `postgresql://...` e substitua `[YOUR-PASSWORD]` pela sua senha.
    *   *Esta será sua `DATABASE_URL`.*
5.  No **SQL Editor**, rode o script de criação das tabelas (`server/database_init.sql` se houver).

---

## Passo 2: Configurar o Projeto na Vercel

1.  Crie uma conta na [Vercel](https://vercel.com/).
2.  Clique em **Add New...** -> **Project**.
3.  Importe seu repositório do GitHub.
4.  **Configurações de Build**:
    *   **Framework Preset**: Vite (deve detectar automático).
    *   **Root Directory**: `.` (Raiz).
    *   **Build Command**: `npm run build` (Padrão).

---

## Passo 3: Variáveis de Ambiente (MUITO IMPORTANTE)

Antes de clicar em "Deploy", vá na seção **Environment Variables** e adicione:

| Nome (Key) | Valor (Value) | Descrição |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | A URL do seu banco Supabase/Neon (Passo 1). |
| `JWT_SECRET` | `sua-senha-secreta-aqui` | Uma senha longa qualquer para segurança dos logins. |
| `GEMINI_API_KEY` | `AIza...` | Sua chave da API do Google (Para a IA do Quiz). |

**NOTA:** NÃO adicione `VITE_API_URL`.
*   Ao não definir essa variável, o site usará automaticamente o backend interno da Vercel (`/api`), o que é o correto.

---

## Passo 4: Deploy

1.  Clique em **Deploy**.
2.  Aguarde a finalização.
3.  Acesse a URL gerada (ex: `https://ecoplay.vercel.app`).
4.  Seu jogo (Frontend) e sua API (Backend na mesma URL) estarão funcionando juntos!

---

## Resolução de Problemas

**Erro na IA (Quiz)?**
*   Verifique se a variável `GEMINI_API_KEY` está correta na Vercel.

**Erro de Login/Banco?**
*   Verifique se a `DATABASE_URL` está correta.
*   Se estiver usando Supabase, certifique-se de desmarcar "Use connection pooling" ou usar a porta 5432 (Session mode) se tiver problemas de conexão, embora o driver `@neondatabase/serverless` que usamos lide bem com isso.
