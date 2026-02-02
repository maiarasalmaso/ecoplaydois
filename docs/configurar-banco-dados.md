# Guia de Configuração do Banco de Dados (Supabase)

O EcoPlay vem configurado por padrão no **Modo Local (Offline)**, onde os dados de login e progresso são salvos apenas no navegador do usuário. Para habilitar a sincronização entre dispositivos, é necessário conectar o projeto ao Supabase.

## Passo 1: Criar Projeto no Supabase

1.  Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita.
2.  Crie um novo projeto ("New Project").
3.  Defina um nome (ex: `ecoplay-db`) e uma senha segura para o banco de dados.
4.  Escolha a região mais próxima (ex: `South America (São Paulo)`).

## Passo 2: Configurar Variáveis de Ambiente

1.  No painel do Supabase, vá em **Project Settings** (ícone de engrenagem) > **API**.
2.  Copie a **Project URL** e a chave **anon public**.
3.  No seu projeto local, abra (ou crie) o arquivo `.env` na raiz.
4.  Atualize as variáveis:

```env
# Mude de 'local' para 'supabase'
VITE_DB_PROVIDER=supabase

# Cole suas credenciais do Supabase
VITE_SUPABASE_URL=sua_project_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_anon_public_aqui
```

## Passo 3: Configurar o Banco de Dados (SQL)

Vá no **SQL Editor** no painel do Supabase e execute o seguinte script para criar as tabelas necessárias:

```sql
-- Habilita UUIDs
create extension if not exists "uuid-ossp";

-- Tabela de Perfis Públicos (Sincronizada com Auth)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  local_user_id bigint unique, -- ID usado para sync com localStorage
  email text unique not null,
  name text,
  username text unique,
  avatar text default 'default',
  streak int default 0,
  last_login_date text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Progresso e Gamificação
create table progress (
  user_id uuid references profiles(id) on delete cascade not null primary key,
  local_user_id bigint unique, -- ID usado para sync com localStorage
  score int default 0,
  level int default 1,
  badges jsonb default '[]'::jsonb,
  completed_levels jsonb default '{}'::jsonb,
  stats jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Políticas de Segurança (RLS)
alter table profiles enable row level security;
alter table progress enable row level security;

-- Quem pode ver perfis? (Todo mundo pode ver nome/avatar, mas só dono edita)
create policy "Perfis são públicos" on profiles for select using (true);
create policy "Usuários editam próprio perfil" on profiles for update using (auth.uid() = id);
create policy "Usuários criam próprio perfil" on profiles for insert with check (auth.uid() = id);

-- Quem pode ver progresso? (Público para rankings, edição restrita)
create policy "Progresso é público" on progress for select using (true);
create policy "Usuários editam próprio progresso" on progress for all using (auth.uid() = user_id);

-- Função RPC para registro seguro (usada pelo front-end)
create or replace function ecoplay_register_profile(
  p_local_user_id bigint,
  p_username text,
  p_name text,
  p_email text,
  p_avatar text
)
returns void as $$
declare
  new_user_id uuid;
begin
  -- Busca o ID do usuário criado no auth.users (pelo email)
  select id into new_user_id from auth.users where email = p_email limit 1;

  if new_user_id is null then
    raise exception 'User not found in auth.users';
  end if;

  -- Insere ou atualiza no profiles
  insert into public.profiles (id, local_user_id, username, name, email, avatar, streak, last_login_date)
  values (
    new_user_id,
    p_local_user_id,
    p_username,
    p_name,
    p_email,
    p_avatar,
    1,
    to_char(now(), 'YYYY-MM-DD')
  )
  on conflict (id) do update
  set
    local_user_id = excluded.local_user_id,
    username = excluded.username,
    name = excluded.name,
    avatar = excluded.avatar,
    last_login_date = excluded.last_login_date;

  -- Garante registro no progress
  insert into public.progress (user_id, local_user_id)
  values (new_user_id, p_local_user_id)
  on conflict (user_id) do update
  set local_user_id = excluded.local_user_id;

end;
$$ language plpgsql security definer;

-- Trigger para criar perfil automaticamente (fallback se RPC falhar)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, name, username)
  values (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;
  
  insert into public.progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Passo 4: Configurar URLs de Autenticação

Para garantir que o login funcione tanto no seu computador (desenvolvimento) quanto no site online, configure os redirecionamentos no painel do Supabase:

1.  Vá em **Authentication** > **URL Configuration**.
2.  **Site URL**: Defina como a URL principal do seu site em produção (ex: `https://ecopllay.netlify.app`).
    *   *Se ainda não tiver o site publicado, pode deixar temporariamente como `http://localhost:5173`*.
3.  **Redirect URLs**: Adicione as seguintes URLs na lista (uma por linha):
    *   `http://localhost:5173` (Para login local via Vite)
    *   `http://localhost:5173/**` (Para links profundos locais)
    *   `https://ecopllay.netlify.app` (Para produção)
    *   `https://ecopllay.netlify.app/**` (Para links profundos em produção)

**Atenção**: Evite usar `localhost:3000` a menos que tenha alterado a porta padrão do Vite. O padrão é `5173`.

## Passo 5: Reiniciar o Projeto

Após salvar o arquivo `.env` e configurar o banco, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

O indicador "Modo Local" desaparecerá do cabeçalho e os logins passarão a funcionar em qualquer dispositivo conectado a este banco de dados.
