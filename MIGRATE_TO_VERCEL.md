# Deploy do Backend (API) na Vercel ⚡

Você escolheu migrar o backend para a Vercel! Ótima escolha: é mais rápido e 100% gratuito.

Siga estes passos exatos:

1.  Acesse o [Dashboard da Vercel](https://vercel.com/dashboard).
2.  Clique em **Add New...** -> **Project**.
3.  Escolha o repositório **`ecoplaydois`** novamente.
4.  **IMPORTANTE:** Na configuração do projeto, edite o **Root Directory**:
    *   Clique em "Edit" ao lado de Root Directory.
    *   Selecione a pasta `server`.
    *   *(Isso diz para a Vercel que este projeto é SÓ o backend).*
5.  Adicione as Variáveis de Ambiente (Environment Variables):
    *   `DATABASE_URL` = `postgresql://postgres:MaiaraSalmaso2026%25@db.dbgrgcgzlqlmszlvqlek.supabase.co:5432/postgres`
    *   `JWT_SECRET` = (Crie uma senha, ex: `segredo-vercel-2026`)
    *   `GEMINI_API_KEY` = `AIzaSyB0yHE_jhOjNIkow9DQfjaJ_fJqaSGm9rw`
6.  Clique em **Deploy**.

---

### Depois de Pronto:
1.  A Vercel vai te dar um novo link (ex: `https://ecoplaydois-server.vercel.app`).
2.  Vá no seu projeto **Frontend** (o site do jogo) lá na Vercel.
3.  Vá em **Settings** -> **Environment Variables**.
4.  Atualize a `VITE_API_URL` com esse novo link do backend.
5.  Vá em **Deployments** -> **Redeploy**.

Pronto! Agora seu jogo é 100% Vercel + Supabase. Rápido e de graça. 🚀
