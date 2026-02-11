import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Lock, LogIn, ShieldCheck } from 'lucide-react';

import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

const DEFAULT_LOGIN = '';
const DEFAULT_PASSWORD = '';

const ADMIN_REMEMBER_KEY = 'ecoplay.admin.remember';
const ADMIN_RATE_KEY = 'ecoplay.admin.rate';

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
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const writeJson = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
};

const getRateState = () => {
  const state = readJson(ADMIN_RATE_KEY) || {};
  return {
    failedCount: Number(state.failedCount) || 0,
    lockedUntil: Number(state.lockedUntil) || 0,
  };
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { theme } = useTheme();

  const [login, setLogin] = useState(DEFAULT_LOGIN);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lockedUntil, setLockedUntil] = useState(() => getRateState().lockedUntil || 0);

  const isLight = theme === 'light';
  const accent = isLight ? ADMIN_ACCENT.light : ADMIN_ACCENT.dark;
  const contrast = isLight ? '#f8fafc' : '#0b1323';

  const lockSeconds = useMemo(() => {
    if (!lockedUntil) return 0;
    const diff = lockedUntil - nowMs();
    return diff > 0 ? Math.ceil(diff / 1000) : 0;
  }, [lockedUntil]);

  useEffect(() => {
    const state = getRateState();
    if (state.lockedUntil > nowMs()) {
      setLockedUntil(state.lockedUntil);
      const timer = setInterval(() => {
        const remaining = state.lockedUntil - nowMs();
        if (remaining <= 0) {
          setLockedUntil(0);
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || lockSeconds > 0) return;

    setError('');
    const l = normalize(login);
    const p = normalize(password);

    if (!l || !p) {
      setError('Preencha login e senha.');
      return;
    }

    if (!isEmail(l)) {
      setError('Informe um email válido.');
      return;
    }

    setSubmitting(true);

    try {
      await authLogin(l, p);

      // Validar role ADMIN diretamente do localStorage após login sucesso
      const token = localStorage.getItem('ecoplay_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'ADMIN') {
          throw new Error('Acesso negado: Apenas administradores.');
        }
        navigate('/admin/painel', { replace: true });
      }
    } catch (err) {
      console.error('[AdminLogin] Error:', err);
      const msg = err.response?.data?.error || err.message || 'Falha no login.';
      setError(msg);

      // Lógica simples de brute-force
      const state = getRateState();
      const newFailed = state.failedCount + 1;
      if (newFailed >= 5) {
        const lockTime = nowMs() + 30000;
        setLockedUntil(lockTime);
        writeJson(ADMIN_RATE_KEY, { failedCount: 0, lockedUntil: lockTime });
      } else {
        writeJson(ADMIN_RATE_KEY, { failedCount: newFailed, lockedUntil: 0 });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-y-auto bg-theme-bg-primary"
      style={{
        '--admin-accent': accent.color,
        '--admin-accent-2': accent.colorAlt,
        '--admin-accent-glow': accent.glow,
        '--admin-contrast': contrast,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
          <h1 className="text-3xl font-display font-bold text-theme-text-primary">ADMIN</h1>
          <p className="mt-2 text-sm text-theme-text-tertiary font-mono">Painel de Controle</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl text-sm text-center font-medium flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {lockSeconds > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/50 text-orange-500 p-3 rounded-xl text-sm text-center font-medium">
              Bloqueado por segurança. Tente em {lockSeconds}s.
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-theme-text-secondary pl-1 uppercase tracking-wider">Email Admin</label>
              <div className="relative group">
                <KeyRound className="absolute left-3.5 top-4 text-theme-text-tertiary group-focus-within:text-[color:var(--admin-accent)] transition-colors w-5 h-5 pointer-events-none" />
                <input
                  type="email"
                  inputMode="email"
                  required
                  className="appearance-none rounded-xl block w-full pl-11 px-4 py-4 text-base bg-theme-input-bg border-2 border-theme-input-border text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)] focus:border-[color:var(--admin-accent)] transition-all font-medium touch-manipulation"
                  placeholder="admin@ecoplay.com"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-theme-text-secondary pl-1 uppercase tracking-wider">Senha Secreta</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-4 text-theme-text-tertiary group-focus-within:text-[color:var(--admin-accent)] transition-colors w-5 h-5 pointer-events-none" />
                <input
                  type="password"
                  required
                  className="appearance-none rounded-xl block w-full pl-11 px-4 py-4 text-base bg-theme-input-bg border-2 border-theme-input-border text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)] focus:border-[color:var(--admin-accent)] transition-all font-medium touch-manipulation"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || lockSeconds > 0}
            className="group relative w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent text-base font-bold rounded-xl text-white bg-[color:var(--admin-accent)] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--admin-accent)] transition-all shadow-lg hover:shadow-[0_0_20px_var(--admin-accent-glow)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {submitting ? (
              <span className="flex items-center gap-2">ENTRANDO...</span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>ACESSAR PAINEL</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-4">
          <Link to="/login" className="text-sm font-semibold text-theme-text-tertiary hover:text-theme-text-primary transition-colors">
            Voltar para o App
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
