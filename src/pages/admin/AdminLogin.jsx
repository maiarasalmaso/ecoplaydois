import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Lock, LogIn, ShieldCheck } from 'lucide-react';

import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

const DEFAULT_LOGIN = '';
const DEFAULT_PASSWORD = '';

// ... (keep constants)

const AdminLogin = () => {
  // ... (keep hooks)

  const [login, setLogin] = useState(DEFAULT_LOGIN);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  // ... (keep props)

  // ... (keep useEffects)

  return (
    <div
      className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{
        '--admin-accent': accent.color,
        '--admin-accent-2': accent.colorAlt,
        '--admin-accent-surface': accent.surface,
        '--admin-accent-border': accent.border,
        '--admin-accent-glow': accent.glow,
        '--admin-contrast': contrast,
      }}
    >


      <MotionDiv
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-theme-card-bg/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-theme-border relative z-10"
      >
        <div className="text-center">
          <div
            className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg transform rotate-2 mb-6"
            style={{
              backgroundImage: 'linear-gradient(135deg, var(--admin-accent), var(--admin-accent-2))',
              boxShadow: '0 18px 35px var(--admin-accent-glow)',
            }}
          >
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-theme-text-primary tracking-wide">ADMIN</h1>
          <p className="mt-2 text-sm text-theme-text-tertiary font-mono">Acesso restrito à administração.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} aria-label="Formulário de login do administrador" autoComplete="off">
          {/* Dummy inputs to trick browser autofill */}
          <div style={{ display: 'none' }}>
            <input type="text" autoComplete="new-password" name="fake_admin_email" />
            <input type="password" autoComplete="new-password" name="fake_admin_password" />
          </div>

          {error && (
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center font-medium flex items-center justify-center gap-2"
              role="alert"
              aria-live="polite"
            >
              <Lock className="w-4 h-4" />
              <span>{error}</span>
            </MotionDiv>
          )}

          {locked && (
            <div className="bg-[color:var(--admin-accent-surface)] border border-[color:var(--admin-accent-border)] text-[color:var(--admin-accent)] p-3 rounded-lg text-sm text-center font-medium">
              Proteção ativada. Tente novamente em <span className="font-mono">{lockSeconds}s</span>.
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-login" className="text-sm font-semibold text-theme-text-secondary">
                Email
              </label>
              <div className="relative group">
                <KeyRound className="absolute left-3 top-3.5 text-theme-text-tertiary group-focus-within:text-[color:var(--admin-accent)] transition-colors w-5 h-5" />
                <input
                  id="admin-login"
                  name="ecoplay_admin_unique_login"
                  type="email"
                  inputMode="email"
                  autoComplete="new-password"
                  readOnly={!login}
                  onFocus={(e) => e.target.removeAttribute('readonly')}
                  className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-theme-input-bg border border-theme-input-border placeholder-theme-text-tertiary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)] focus:border-[color:var(--admin-accent)] transition-all font-medium"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-sm font-semibold text-theme-text-secondary">
                Senha
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-theme-text-tertiary group-focus-within:text-[color:var(--admin-accent)] transition-colors w-5 h-5" />
                <input
                  id="admin-password"
                  name="ecoplay_admin_unique_password"
                  type="password"
                  autoComplete="new-password"
                  readOnly={!password}
                  onFocus={(e) => e.target.removeAttribute('readonly')}
                  className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-theme-input-bg border border-theme-input-border placeholder-theme-text-tertiary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)] focus:border-[color:var(--admin-accent)] transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-theme-text-secondary select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-theme-border bg-theme-input-bg text-[color:var(--admin-accent)] focus:ring-[color:var(--admin-accent)] focus:ring-2"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Lembrar credenciais
            </label>
            <a
              href="mailto:ecoplayutfpr@gmail.com?subject=Recupera%C3%A7%C3%A3o%20de%20senha%20(admin)%20-%20EcoPlay"
              className="text-sm font-semibold text-theme-text-secondary hover:text-theme-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--admin-accent)] rounded"
            >
              Esqueci a senha
            </a>
          </div>

          <button
            type="submit"
            disabled={submitting || locked}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-[color:var(--admin-contrast)] bg-[color:var(--admin-accent)] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--admin-accent)] transition-all shadow-lg hover:shadow-[0_0_20px_var(--admin-accent-glow)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <LogIn className="h-5 w-5 text-[color:var(--admin-contrast)] group-hover:brightness-110 transition-colors" />
            </span>
            {submitting ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>

        <div className="text-center border-t border-theme-border pt-6">
          <p className="text-xs text-theme-text-tertiary">
            <Link
              to="/privacy"
              aria-label="Abrir política de privacidade"
              className="font-semibold text-theme-text-secondary hover:text-theme-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--admin-accent)] rounded"
            >
              Segurança e Privacidade
            </Link>
          </p>
        </div>
      </MotionDiv>
    </div>
  );
};

export default AdminLogin;
