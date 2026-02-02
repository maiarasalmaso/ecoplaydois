import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Lock, LogIn, Sun } from 'lucide-react';
import AnimatedBackground from '../../../src/components/layout/AnimatedBackground';

const DEFAULT_LOGIN = 'admin@gmail.com';
const DEFAULT_PASSWORD = 'admin';

const ADMIN_SESSION_KEY = 'ecoplay.admin.session';
const ADMIN_REMEMBER_KEY = 'ecoplay.admin.remember';
const ADMIN_RATE_KEY = 'ecoplay.admin.rate';
const ADMIN_AUDIT_KEY = 'ecoplay.admin.audit';

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

const createSession = (remember) => {
  const now = nowMs();
  const ttlMs = remember ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
  const session = { createdAt: now, expiresAt: now + ttlMs };
  const storage = remember ? localStorage : sessionStorage;
  try {
    storage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
};

const isLocked = (state, now) => state.lockedUntil && now < state.lockedUntil;

const AdminLogin = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState(DEFAULT_LOGIN);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lockedUntil, setLockedUntil] = useState(() => getRateState().lockedUntil || 0);
  const lockTimerRef = useRef(null);

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
    await Promise.resolve();

    const isValid = values.login === DEFAULT_LOGIN && values.password === DEFAULT_PASSWORD;
    if (!isValid) {
      const next = registerFailure();
      setSubmitting(false);
      setLockedUntil(next.lockedUntil || 0);
      if (isLocked(next, nowMs())) {
        appendAudit('login_failure', { login: values.login, result: 'locked' });
        setError(`Acesso temporariamente bloqueado. Aguarde ${Math.ceil((next.lockedUntil - nowMs()) / 1000)}s.`);
      } else {
        appendAudit('login_failure', { login: values.login, result: 'invalid_credentials' });
        setError('Credenciais inválidas. Verifique login e senha.');
      }
      return;
    }

    if (remember) writeJson(ADMIN_REMEMBER_KEY, { login: values.login, remember: true });
    else writeJson(ADMIN_REMEMBER_KEY, { login: values.login, remember: false });

    createSession(remember);
    appendAudit('login_success', { login: values.login, remember });
    setSubmitting(false);
    navigate('/admin/painel', { replace: true });
  };

  const MotionDiv = motion.div;
  const locked = lockSeconds > 0;

  return (
    <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <AnimatedBackground />

      <MotionDiv
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700 relative z-10"
      >
        <div className="text-center">
          <div className="mx-auto relative w-24 h-24 mb-6 flex items-center justify-center">
            {/* Animated sun rays */}
            <MotionDiv
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-8 bg-gradient-to-b from-emerald-300 via-emerald-400 to-transparent rounded-full origin-bottom"
                    style={{
                      top: '0%',
                      left: '50%',
                      marginLeft: '-4px',
                      transform: `rotate(${i * 30}deg) translateY(-8px)`
                    }}
                  />
                ))}
              </div>
            </MotionDiv>
            {/* Sun core */}
            <div className="relative z-10 flex items-center justify-center">
              <MotionDiv
                className="absolute w-20 h-20 bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-600 rounded-full shadow-2xl"
                style={{
                  boxShadow: '0 0 30px rgba(16, 185, 129, 0.8), 0 0 60px rgba(13, 148, 136, 0.4)'
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <Sun className="relative z-20 h-10 w-10 text-emerald-900" />
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-wide">ADMIN</h1>
          <p className="mt-2 text-sm text-slate-400 font-mono">Acesso restrito à administração.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} aria-label="Formulário de login do administrador">
          {error && (
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center font-medium flex items-center justify-center gap-2"
              role="alert"
              aria-live="polite"
            >
              <Lock className="w-4 h-4" />
              <span>{error}</span>
            </MotionDiv>
          )}

          {locked && (
            <div className="bg-amber-500/10 border border-amber-500/40 text-amber-200 p-3 rounded-lg text-sm text-center font-medium">
              Proteção ativada. Tente novamente em <span className="font-mono">{lockSeconds}s</span>.
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-login" className="text-sm font-semibold text-slate-200">
                Email
              </label>
              <div className="relative group">
                <KeyRound className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-amber-400 transition-colors w-5 h-5" />
                <input
                  id="admin-login"
                  name="login"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-slate-900/50 border border-slate-600 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all font-medium"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-sm font-semibold text-slate-200">
                Senha
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-amber-400 transition-colors w-5 h-5" />
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-slate-900/50 border border-slate-600 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-300 select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-600 bg-slate-900/50 text-amber-400 focus:ring-amber-400 focus:ring-2"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Lembrar credenciais
            </label>
            <a
              href="mailto:ecoplayutfpr@gmail.com?subject=Recupera%C3%A7%C3%A3o%20de%20senha%20(admin)%20-%20EcoPlay"
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 rounded"
            >
              Esqueci a senha
            </a>
          </div>

          <button
            type="submit"
            disabled={submitting || locked}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-slate-900 bg-amber-400 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <LogIn className="h-5 w-5 text-amber-900 group-hover:text-amber-900 transition-colors" />
            </span>
            {submitting ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>

        <div className="text-center border-t border-slate-700 pt-6">
          <p className="text-xs text-slate-500">
            <Link
              to="/privacy"
              aria-label="Abrir política de privacidade"
              className="font-semibold text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 rounded"
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
