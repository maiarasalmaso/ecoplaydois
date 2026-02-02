# Guia de Deploy 100% Gratuito do EcoPlay 🚀

Este guia explica como colocar seu projeto EcoPlay no ar usando serviços gratuitos de alta qualidade.
Esta arquitetura é profissional e separada em três partes:

1.  **Frontend (O Site)**: Hospedado na **Vercel**.
2.  **Backend (A API e Servidor)**: Hospedado no **Render**.
3.  **Banco de Dados**: Hospedado no **Supabase** (Postgres).

---

## Passo 1: Banco de Dados (Supabase)

Como seu projeto usa PostgreSQL (`pg`), o **Supabase** é a melhor opção gratuita.

1.  Acesse [database.new](https://database.new/) (Crie uma conta se não tiver).
2.  Crie um novo projeto. Anote a **senha** do banco de dados.
3.  Após criar, vá em **Project Settings** -> **Database** -> **Connection String** -> **URI**.
4.  Copie a string que começa com `postgresql://...` e substitua `[YOUR-PASSWORD]` pela senha que você criou.
    *   *Esta será sua `DATABASE_URL`.*
5.  Vá no **SQL Editor** do Supabase (ícone ⚡ na esquerda).
6.  Copie o conteúdo do arquivo `server/database_init.sql` (e `server/seeds.sql` se quiser dados iniciais) e cole no editor. Clique em **RUN** para criar as tabelas.

---

## Passo 2: Backend (Render)

O Render vai hospedar sua API Node.js/Express.

1.  Crie uma conta no [Render](https://render.com/).
2.  Clique em **New +** -> **Web Service**.
3.  Conecte seu repositório GitHub (onde está o código do projeto).
4.  Configure:
    *   **Root Directory**: `server` (Importante! O servidor está nesta pasta).
    *   **Environment**: Node.
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
    *   **Instance Type**: Free.
5.  Em **Environment Variables** (Advanced), adicione:
    *   Key: `DATABASE_URL`
    *   Value: (Cole a string do Supabase do Passo 1)
    *   Key: `JWT_SECRET`
    *   Value: (Crie uma senha longa e segura qualquer, ex: `super-secreta-eco-play-2026`)
    *   Key: `NODE_ENV`
    *   Value: `production`
6.  Clique em **Create Web Service**.
7.  Aguarde o deploy. Quando finalizar, copie a URL gerada (ex: `https://ecoplay-api.onrender.com`).

*Nota: O plano gratuito do Render hiberna após 15min inativo. A primeira requisição pode demorar uns 50 segundos para "acordar".*

---

## Passo 3: Frontend (Vercel)

A Vercel vai hospedar o site React.

1.  Crie uma conta na [Vercel](https://vercel.com/).
2.  Clique em **Add New...** -> **Project**.
3.  Importe o mesmo repositório do GitHub.
4.  Configure:
    *   **Framework Preset**: Vite (deve detectar automático).
    *   **Root Directory**: `.` (Deixe o padrão, raiz).
5.  Em **Environment Variables**, adicione:
    *   Key: `VITE_API_URL`
    *   Value: (Cole a URL do seu Backend no Render, ex: `https://ecoplay-api.onrender.com`)
        *   *Importante: Não coloque a barra `/` no final.*
6.  Clique em **Deploy**.

---

## Passo 4: Testar

1.  Acesse a URL que a Vercel gerou (ex: `https://ecoplay.vercel.app`).
2.  Tente fazer login ou cadastro.
    *   *Se demorar na primeira vez, é o Render acordando.*
3.  Pronto! Seu jogo está online e 100% gratuito.
