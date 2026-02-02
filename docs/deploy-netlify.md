# Deploy no Netlify e Conexão com Banco de Dados

Para que o site hospedado no Netlify consiga acessar seu banco de dados (Supabase), você não configura o banco "dentro" do Netlify, mas sim ensina o Netlify a "conversar" com ele através das **Variáveis de Ambiente**.

## Passo 1: Conectar o Repositório

1.  Acesse [app.netlify.com](https://app.netlify.com) e faça login.
2.  Clique em **Add new site** > **Import an existing project**.
3.  Escolha seu provedor Git (GitHub, GitLab, etc.) e selecione o repositório do `ecoplay`.

## Passo 2: Configurar Variáveis de Ambiente (A "Conexão")

Antes de clicar em "Deploy", ou após o deploy falhar/terminar:

1.  Vá em **Site configuration** > **Environment variables**.
2.  Clique em **Add a variable** > **Add a single variable**.
3.  Adicione as mesmas chaves que você configurou no seu arquivo `.env` local:

| Key (Chave) | Value (Valor) | Descrição |
| :--- | :--- | :--- |
| `VITE_DB_PROVIDER` | `supabase` | Ativa o modo online |
| `VITE_SUPABASE_URL` | `https://seu-projeto.supabase.co` | URL do seu projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | `sua-chave-publica-longa` | Chave anon/public do Supabase |
| `VITE_GEMINI_API_KEY` | `sua-chave-do-google` | Para a IA (Dicas e Quiz) |

> **Importante:** Sem essas variáveis, o site no Netlify funcionará em "Modo Local" ou apresentará erros ao tentar logar.

### Opção Alternativa: Usando a Extensão Supabase do Netlify

Se você instalou a **Supabase Extension** no Netlify:

1.  Ela criará variáveis como `SUPABASE_URL` e `SUPABASE_ANON_KEY` automaticamente.
2.  O projeto já foi configurado para reconhecer essas variáveis também (sem o prefixo `VITE_`).
3.  O sistema detectará automaticamente a presença dessas chaves e ativará o modo online. **Não é necessário** configurar nada manualmente.
4.  (Opcional) Você ainda pode definir `VITE_DB_PROVIDER=local` se quiser forçar o modo offline mesmo com a extensão instalada.

## Passo 3: Configurações de Build

O Netlify deve detectar automaticamente, mas confirme se está assim:

*   **Build command:** `npm run build`
*   **Publish directory:** `dist`

## Passo 4: Finalizar

1.  Clique em **Deploy site** (ou **Trigger deploy** se já tiver feito antes).
2.  Aguarde o processo terminar.
3.  Acesse a URL gerada (ex: `https://ecopllay.netlify.app`).
4.  O indicador "Local" deve ter sumido do cabeçalho.

## Configuração de Redirecionamento (SPA)

O projeto já inclui um arquivo `netlify.toml` na raiz que garante que, ao atualizar a página em uma rota como `/games`, o site não quebre (Erro 404). Não é necessário configurar isso manualmente.

