import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Lock, LogIn, ShieldCheck } from 'lucide-react';

import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

const DEFAULT_LOGIN = '';
const DEFAULT_PASSWORD = '';

const ADMIN_SESSION_KEY = 'ecoplay.admin.session';
const ADMIN_REMEMBER_KEY = 'ecoplay.admin.remember';
const ADMIN_RATE_KEY = 'ecoplay.admin.rate';
const ADMIN_AUDIT_KEY = 'ecoplay.admin.audit';

const ADMIN_ACCENT = {
  dark: {
    color: '#fb923c', // Orange-400
    colorAlt: '#f97316', // Orange-500
    surface: 'rgba(251,146,60,0.2)',
    border: 'rgba(251,146,60,0.6)',
    glow: 'rgba(251,146,60,0.32)',
  },
  light: {
    color: '#f97316', // Orange-500
    colorAlt: '#ea580c', // Orange-600
    surface: 'rgba(249,115,22,0.18)',
    border: 'rgba(249,115,22,0.5)',
    glow: 'rgba(249,115,22,0.28)',
  },
};

const normalize = (value) => String(value || '').trim();

const nowMs = () => Date.now();

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const readJson = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

const appendAudit = (action, meta) => {
  const entry = { ts: new Date().toISOString(), action, meta: meta || null };
  const existing = readJson(ADMIN_AUDIT_KEY);
  const next = Array.isArray(existing) ? [entry, ...existing].slice(0, 200) : [entry];
  writeJson(ADMIN_AUDIT_KEY, next);
};

const getRateState = () => {
  const state = readJson(ADMIN_RATE_KEY) || {};
  return {
    failedCount: Number.isFinite(state.failedCount) ? state.failedCount : 0,
    firstFailedAt: Number.isFinite(state.firstFailedAt) ? state.firstFailedAt : 0,
    lockedUntil: Number.isFinite(state.lockedUntil) ? state.lockedUntil : 0,
    lockLevel: Number.isFinite(state.lockLevel) ? state.lockLevel : 0,
  };
};

const saveRateState = (state) => writeJson(ADMIN_RATE_KEY, state);

const clearRateIfWindowExpired = (state, now) => {
  const windowMs = 10 * 60 * 1000;
  if (!state.firstFailedAt) return state;
  if (now - state.firstFailedAt <= windowMs) return state;
  return { failedCount: 0, firstFailedAt: 0, lockedUntil: state.lockedUntil, lockLevel: state.lockLevel };
};

const registerFailure = () => {
  const now = nowMs();
  const baseLockMs = 30 * 1000;
  const threshold = 5;
  let state = clearRateIfWindowExpired(getRateState(), now);

  if (state.lockedUntil && now < state.lockedUntil) return state;

  const nextFailedCount = state.failedCount + 1;
  const firstFailedAt = state.firstFailedAt || now;

  if (nextFailedCount >= threshold) {
    const nextLockLevel = Math.min(6, state.lockLevel + 1);
    const lockMs = baseLockMs * 2 ** (nextLockLevel - 1);
    const lockedUntil = now + lockMs;
    state = { failedCount: 0, firstFailedAt: 0, lockedUntil, lockLevel: nextLockLevel };
    saveRateState(state);
    console.debug('[admin-login] bloqueio ativado', { lockMs, lockLevel: nextLockLevel });
    return state;
  }

  state = { ...state, failedCount: nextFailedCount, firstFailedAt };
  saveRateState(state);
  console.debug('[admin-login] tentativa inválida', { failedCount: state.failedCount });
  return state;
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { theme } = useTheme();

  const [login, setLogin] = useState(DEFAULT_LOGIN);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lockedUntil, setLockedUntil] = useState(() => getRateState().lockedUntil || 0);
  const lockTimerRef = useRef(null);

  const isLight = theme === 'light';
  const accent = isLight ? ADMIN_ACCENT.light : ADMIN_ACCENT.dark;
  const contrast = isLight ? '#f8fafc' : '#0b1323';

  const lockSeconds = useMemo(() => {
    if (!lockedUntil) return 0;
    const diff = lockedUntil - nowMs();
    return diff > 0 ? Math.ceil(diff / 1000) : 0;
  }, [lockedUntil]);

  useEffect(() => {
    const remembered = readJson(ADMIN_REMEMBER_KEY);
    if (remembered?.login) setLogin(String(remembered.login));
    if (remembered?.remember === true) setRemember(true);
  }, []);

  useEffect(() => {
    const state = getRateState();
    setLockedUntil(state.lockedUntil || 0);

    if (lockTimerRef.current) {
      clearInterval(lockTimerRef.current);
      lockTimerRef.current = null;
    }

    if (!state.lockedUntil) return undefined;

    lockTimerRef.current = setInterval(() => {
      const next = getRateState().lockedUntil || 0;
      setLockedUntil(next);
      if (!next || nowMs() >= next) {
        clearInterval(lockTimerRef.current);
        lockTimerRef.current = null;
      }
    }, 250);

    return () => {
      if (lockTimerRef.current) clearInterval(lockTimerRef.current);
      lockTimerRef.current = null;
    };
  }, []);

  const validate = () => {
    const l = normalize(login);
    const p = normalize(password);
    if (!l || !p) {
      setError('Preencha login e senha.');
      return null;
    }
    if (!isEmail(l)) {
      setError('Informe um email válido.');
      return null;
    }
    return { login: l, password: p };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const state = getRateState();
    const now = nowMs();
    if (isLocked(state, now)) {
      setLockedUntil(state.lockedUntil);
      appendAudit('login_rate_limited', { login: normalize(login) });
      setError(`Muitas tentativas. Aguarde ${Math.ceil((state.lockedUntil - now) / 1000)}s.`);
      return;
    }

    const values = validate();
    if (!values) {
      appendAudit('login_validation_error', { login: normalize(login) });
      return;
    }

    setSubmitting(true);

    try {
      await authLogin(values.login, values.password);

      const token = localStorage.getItem('ecoplay_token');
      if (token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));

        if (payload.role !== 'ADMIN') {
          throw new Error('Acesso negado: Apenas administradores.');
        }

        appendAudit('login_success', { login: values.login });
        navigate('/admin/painel', { replace: true });
      }
    } catch (err) {
      console.error(err);
      const next = registerFailure();
      setLockedUntil(next.lockedUntil || 0);
      const msg = err.response?.data?.error || err.message || 'Falha no login.';
      setError(msg);
      appendAudit('login_failure', { login: values.login, error: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const MotionDiv = motion.div;
  const locked = lockSeconds > 0;

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-y-auto supports-[min-height:100dvh]:min-h-[100dvh]"
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
              <label htmlFor="admin-login" className="text-sm font-semibold text-theme-text-secondary pl-1">
                Email
              </label>
              <div className="relative group">
                <KeyRound className="absolute left-3.5 top-4 text-theme-text-tertiary group-focus-within:text-[color:var(--admin-accent)] transition-colors w-5 h-5 pointer-events-none" />
                <input
                  id="admin-login"
                  name="ecoplay_admin_unique_login"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-xl relative block w-full pl-11 px-4 py-4 text-base bg-theme-input-bg border-2 border-theme-input-border placeholder-theme-text-tertiary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)] focus:border-[color:var(--admin-accent)] transition-all font-medium touch-manipulation"
                  placeholder="Seu email de admin"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-sm font-semibold text-theme-text-secondary pl-1">
                Senha
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-4 text-theme-text-tertiary group-focus-within:text-[color:var(--admin-accent)] transition-colors w-5 h-5 pointer-events-none" />
                <input
                  id="admin-password"
                  name="ecoplay_admin_unique_password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-xl relative block w-full pl-11 px-4 py-4 text-base bg-theme-input-bg border-2 border-theme-input-border placeholder-theme-text-tertiary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)] focus:border-[color:var(--admin-accent)] transition-all font-medium touch-manipulation"
                  placeholder="Sua senha de admin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-theme-text-secondary select-none cursor-pointer">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-theme-border bg-theme-input-bg text-[color:var(--admin-accent)] focus:ring-[color:var(--admin-accent)] focus:ring-2 transition-all"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Lembrar
            </label>
            <a
              href="mailto:ecoplayutfpr@gmail.com?subject=Recupera%C3%A7%C3%A3o%20de%20senha%20(admin)%20-%20EcoPlay"
              className="text-sm font-semibold text-theme-text-secondary hover:text-theme-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--admin-accent)] rounded p-1"
            >
              Esqueci a senha
            </a>
          </div>

          <button
            type="submit"
            disabled={submitting || locked}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-bold rounded-xl text-[color:var(--admin-contrast)] bg-[color:var(--admin-accent)] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--admin-accent)] transition-all shadow-lg hover:shadow-[0_0_20px_var(--admin-accent-glow)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <LogIn className="h-5 w-5 text-[color:var(--admin-contrast)] group-hover:scale-110 transition-transform" />
            </span>
            {submitting ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>

        <div className="text-center border-t border-theme-border pt-6">
          <p className="text-xs text-theme-text-tertiary">
            <Link
              to="/privacy"
              aria-label="Abrir política de privacidade"
              className="font-semibold text-theme-text-secondary hover:text-theme-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--admin-accent)] rounded p-2"
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
