# Banco de dados (Supabase)

O EcoPlay hoje funciona com dados locais (localStorage). Esta configuração adiciona um banco opcional no Supabase (Postgres) para sincronizar:

- Perfil do usuário (sem senha)
- Progresso (XP, conquistas, níveis concluídos, etc.)

## 1) Criar projeto no Supabase

1. Crie um projeto em https://supabase.com/
2. Abra o painel do projeto e copie:
   - Project URL
   - anon public key

## 2) Criar tabelas

No Supabase, abra **SQL Editor** e execute:

```sql
create table if not exists public.profiles (
  local_user_id bigint primary key,
  username text not null,
  name text not null,
  email text not null,
  username_lower text generated always as (lower(username)) stored,
  email_lower text generated always as (lower(email)) stored,
  avatar text,
  streak int not null default 0,
  last_login_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_unique_ci on public.profiles (username_lower);
create unique index if not exists profiles_email_unique_ci on public.profiles (email_lower);

create table if not exists public.progress (
  local_user_id bigint primary key references public.profiles(local_user_id) on delete cascade,
  score int not null default 0,
  badges jsonb not null default '[]'::jsonb,
  badge_unlocks jsonb not null default '{}'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  completed_levels jsonb not null default '{}'::jsonb,
  last_daily_xp_date date,
  unclaimed_rewards jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists progress_set_updated_at on public.progress;
create trigger progress_set_updated_at
before update on public.progress
for each row execute function public.set_updated_at();

create table if not exists public.debug_db_events (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  event_type text not null,
  table_name text,
  local_user_id bigint,
  username text,
  email text,
  details jsonb
);

create or replace function public.log_insert_debug()
returns trigger as $$
begin
  insert into public.debug_db_events (event_type, table_name, local_user_id, username, email, details)
  values (
    'insert',
    tg_table_name,
    coalesce(new.local_user_id, null),
    coalesce(new.username, null),
    coalesce(new.email, null),
    to_jsonb(new)
  );
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_log_insert_debug on public.profiles;
create trigger profiles_log_insert_debug
after insert on public.profiles
for each row execute function public.log_insert_debug();

drop trigger if exists progress_log_insert_debug on public.progress;
create trigger progress_log_insert_debug
after insert on public.progress
for each row execute function public.log_insert_debug();

create or replace function public.ecoplay_register_profile(
  p_local_user_id bigint,
  p_username text,
  p_name text,
  p_email text,
  p_avatar text
)
returns void as $$
declare
  v_username text := btrim(p_username);
  v_email text := lower(btrim(p_email));
  v_username_lower text := lower(v_username);
begin
  if v_username = '' then
    raise exception 'Nome de usuário é obrigatório.';
  end if;
  if v_email = '' then
    raise exception 'Email é obrigatório.';
  end if;

  if exists (select 1 from public.profiles where username_lower = v_username_lower) then
    insert into public.debug_db_events (event_type, table_name, local_user_id, username, email, details)
    values ('register_duplicate_username', 'profiles', p_local_user_id, v_username, v_email, jsonb_build_object('username_lower', v_username_lower));
    raise exception 'Este nome de usuário já está em uso.';
  end if;

  if exists (select 1 from public.profiles where email_lower = v_email) then
    insert into public.debug_db_events (event_type, table_name, local_user_id, username, email, details)
    values ('register_duplicate_email', 'profiles', p_local_user_id, v_username, v_email, jsonb_build_object('email_lower', v_email));
    raise exception 'Este email já está cadastrado.';
  end if;

  insert into public.profiles (local_user_id, username, name, email, avatar, streak, last_login_date)
  values (p_local_user_id, v_username, coalesce(nullif(btrim(p_name), ''), v_username), v_email, p_avatar, 1, current_date);

exception
  when unique_violation then
    insert into public.debug_db_events (event_type, table_name, local_user_id, username, email, details)
    values ('register_unique_violation', 'profiles', p_local_user_id, v_username, v_email, jsonb_build_object('sqlstate', sqlstate));
    raise;
end;
$$ language plpgsql;
```

### Atualização de projetos existentes

Se você já criou as tabelas com o modelo antigo, rode:

```sql
alter table public.profiles add column if not exists username text;
update public.profiles set username = coalesce(username, name) where username is null;
alter table public.profiles alter column username set not null;

alter table public.profiles drop constraint if exists profiles_email_key;
alter table public.profiles add column if not exists username_lower text generated always as (lower(username)) stored;
alter table public.profiles add column if not exists email_lower text generated always as (lower(email)) stored;
create unique index if not exists profiles_username_unique_ci on public.profiles (username_lower);
create unique index if not exists profiles_email_unique_ci on public.profiles (email_lower);
```

### Debug / Logs

- Ver eventos e tentativas de duplicidade:

```sql
select * from public.debug_db_events order by created_at desc limit 200;
```

## 3) Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto (mesmo nível do `package.json`) com:

```env
VITE_DB_PROVIDER=supabase
VITE_SUPABASE_URL=SEU_PROJECT_URL
VITE_SUPABASE_ANON_KEY=SUA_ANON_PUBLIC_KEY
```

Se quiser manter somente localStorage, use:

```env
VITE_DB_PROVIDER=local
```

## 4) Segurança (importante)

Para desenvolvimento/protótipo, você pode manter o RLS desativado nessas tabelas:

```sql
alter table public.profiles disable row level security;
alter table public.progress disable row level security;
```

Para produção, o recomendado é usar Supabase Auth e políticas RLS por usuário, em vez de liberar acesso anônimo.

