import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Shield, Check, AlertCircle, Copy, Terminal, ExternalLink, Save } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const Setup = () => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    url: '',
    key: ''
  });
  const [status, setStatus] = useState('idle'); // idle, testing, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load existing config if available
    try {
      const stored = localStorage.getItem('ecoplay-db-config');
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfig({ url: parsed.url || '', key: parsed.key || '' });
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleTestConnection = async () => {
    setStatus('testing');
    setMessage('Tentando conectar ao Supabase...');

    try {
      if (!config.url || !config.key) {
        throw new Error('URL e Chave são obrigatórias');
      }

      if (!config.url.startsWith('https://')) {
        throw new Error('A URL deve começar com https://');
      }

      const client = createClient(config.url, config.key);

      // Try a simple query (even if table doesn't exist, auth should work)
      const { error } = await client.from('users').select('count', { count: 'exact', head: true });

      // If error is 404 or similar, it means connection works but table missing
      // If error is 401, auth failed
      // If network error, connection failed

      if (error && (error.code === 'PGRST301' || error.message?.includes('JWT'))) {
        throw new Error('Chave inválida ou expirada');
      }

      // If we get here, connection is likely okay even if tables missing
      setStatus('success');
      setMessage('Conexão bem-sucedida! O Supabase está acessível.');

      // Save to localStorage for immediate use
      localStorage.setItem('ecoplay-db-config', JSON.stringify({
        provider: 'supabase',
        url: config.url,
        key: config.key
      }));

    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || 'Falha na conexão. Verifique a URL e a Chave.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Simple alert or toast could be added here
  };

  const sqlScript = `-- Copie e cole este SQL no Editor do Supabase para criar as tabelas

-- 1. Tabela de Perfis Públicos (Vinculada ao Auth do Supabase)
create table profiles (
  id uuid references auth.users not null primary key,
  local_user_id text unique, -- Para migração de usuários locais
  username text unique,
  username_lower text unique generated always as (lower(username)) stored,
  name text,
  email text,
  email_lower text generated always as (lower(email)) stored,
  avatar text,
  streak integer default 0,
  last_login_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de Progresso
create table progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  local_user_id text unique, -- Para sincronia
  score integer default 0,
  level integer default 1,
  badges jsonb default '[]'::jsonb,
  badge_unlocks jsonb default '{}'::jsonb,
  stats jsonb default '{}'::jsonb,
  completed_levels jsonb default '{}'::jsonb,
  last_daily_xp_date date,
  unclaimed_rewards jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Habilitar Row Level Security (RLS)
alter table profiles enable row level security;
alter table progress enable row level security;

-- 4. Políticas de Acesso (Policies)
-- Profiles: Todos podem ver (para rankings), apenas o dono pode editar
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Progress: Apenas o dono pode ver e editar
create policy "Users can view own progress." on progress
  for select using (auth.uid() = user_id);

create policy "Users can insert own progress." on progress
  for insert with check (auth.uid() = user_id);

create policy "Users can update own progress." on progress
  for update using (auth.uid() = user_id);

-- 5. Função RPC para registro seguro (opcional mas recomendado)
create or replace function ecoplay_register_profile(
  p_local_user_id text,
  p_username text,
  p_name text,
  p_email text,
  p_avatar text
)
returns void
language plpgsql
security definer
as $$
begin
  insert into profiles (id, local_user_id, username, name, email, avatar)
  values (auth.uid(), p_local_user_id, p_username, p_name, p_email, p_avatar)
  on conflict (id) do update
  set 
    username = excluded.username,
    name = excluded.name,
    avatar = excluded.avatar,
    updated_at = now();
end;
$$;
`;

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl bg-theme-bg-secondary/50 backdrop-blur-xl rounded-3xl border border-theme-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-theme-bg-tertiary/80 p-6 border-b border-theme-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-eco-green" />
            <h1 className="text-xl font-bold font-display text-theme-text-primary">Configuração do Banco de Dados</h1>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${step >= i ? 'bg-eco-green' : 'bg-theme-bg-primary'}`}
              />
            ))}
          </div>
        </div>

        <div className="p-8">
          {/* Step 1: Create Account */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-theme-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-theme-text-primary mb-2">1. Criar Projeto no Supabase</h2>
                <p className="text-theme-text-secondary max-w-lg mx-auto">
                  O Supabase é um banco de dados gratuito e seguro. Vamos criar um projeto para salvar seus dados na nuvem.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <a
                  href="https://supabase.com/dashboard/projects"
                  target="_blank"
                  rel="noreferrer"
                  className="group block bg-theme-bg-tertiary/50 hover:bg-theme-bg-tertiary p-6 rounded-2xl border border-theme-border hover:border-eco-green transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <ExternalLink className="w-6 h-6 text-theme-text-tertiary group-hover:text-eco-green" />
                    <span className="text-xs font-mono bg-theme-bg-primary px-2 py-1 rounded text-theme-text-tertiary">Passo 1</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-theme-text-primary">Criar Conta/Projeto</h3>
                  <p className="text-sm text-theme-text-secondary">Acesse supabase.com, crie uma conta e clique em "New Project".</p>
                </a>

                <div className="bg-theme-bg-tertiary/50 p-6 rounded-2xl border border-theme-border">
                  <div className="flex items-center justify-between mb-4">
                    <Copy className="w-6 h-6 text-theme-text-tertiary" />
                    <span className="text-xs font-mono bg-theme-bg-primary px-2 py-1 rounded text-theme-text-tertiary">Passo 2</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-theme-text-primary">Copiar Chaves</h3>
                  <p className="text-sm text-theme-text-secondary">
                    Vá em <strong>Settings &gt; API</strong>. Copie a "Project URL" e a chave "anon public".
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                  Já tenho as chaves
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Configure Keys */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-theme-text-primary mb-2">2. Conectar ao Projeto</h2>
                <p className="text-theme-text-secondary">Cole as chaves do seu projeto Supabase abaixo.</p>
              </div>

              <div className="space-y-4 max-w-xl mx-auto">
                <div>
                  <label className="block text-sm font-medium text-theme-text-secondary mb-2">Project URL</label>
                  <input
                    type="text"
                    value={config.url}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    placeholder="https://xxxxxxxx.supabase.co"
                    className="w-full bg-theme-bg-primary border border-theme-border rounded-xl px-4 py-3 text-theme-text-primary focus:ring-2 focus:ring-eco-green focus:border-transparent outline-none font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text-secondary mb-2">Anon Public Key</label>
                  <input
                    type="text"
                    value={config.key}
                    onChange={(e) => setConfig({ ...config, key: e.target.value })}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-theme-bg-primary border border-theme-border rounded-xl px-4 py-3 text-theme-text-primary focus:ring-2 focus:ring-eco-green focus:border-transparent outline-none font-mono text-sm"
                  />
                </div>

                {status === 'error' && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{message}</span>
                  </div>
                )}

                {status === 'success' && (
                  <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-xl flex items-center gap-3">
                    <Check className="w-5 h-5 shrink-0" />
                    <span>{message}</span>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-theme-bg-tertiary hover:bg-theme-bg-secondary text-theme-text-secondary px-6 py-3 rounded-xl font-bold transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleTestConnection}
                    disabled={status === 'testing' || !config.url || !config.key}
                    className="flex-1 bg-eco-green hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 px-6 py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2"
                  >
                    {status === 'testing' ? 'Testando...' : 'Testar Conexão'}
                  </button>
                </div>

                {status === 'success' && (
                  <button
                    onClick={() => setStep(3)}
                    className="w-full mt-4 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 animate-pulse"
                  >
                    Continuar para Banco de Dados
                    <Database className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Run SQL */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">3. Criar Tabelas</h2>
                <p className="text-slate-400">
                  Copie o código SQL abaixo e execute no <strong>SQL Editor</strong> do Supabase para criar a estrutura do banco.
                </p>
              </div>

              <div className="relative bg-theme-bg-primary rounded-xl border border-theme-border p-4 overflow-hidden group">
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => copyToClipboard(sqlScript)}
                    className="bg-theme-bg-tertiary hover:bg-theme-bg-secondary text-theme-text-secondary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-theme-border transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar SQL
                  </button>
                </div>
                <pre className="font-mono text-xs text-theme-text-tertiary overflow-x-auto h-64 p-2 custom-scrollbar">
                  <code>{sqlScript}</code>
                </pre>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl text-sm text-yellow-200 flex gap-3">
                <Terminal className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold mb-1">Como executar:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-yellow-200/80">
                    <li>No Supabase, clique no ícone <strong>SQL Editor</strong> (barra lateral esquerda).</li>
                    <li>Cole o código copiado acima.</li>
                    <li>Clique no botão <strong>RUN</strong> no canto inferior direito.</li>
                    <li>Se aparecer "Success", seu banco está pronto!</li>
                  </ol>
                </div>
              </div>

              <div className="flex justify-center gap-4 pt-6">
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-eco-green hover:bg-green-400 text-slate-900 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-eco-green/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Finalizar Configuração
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Setup;