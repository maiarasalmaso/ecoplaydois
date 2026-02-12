import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Lock, LogIn, ShieldCheck } from 'lucide-react';

import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

const ADMIN_REMEMBER_KEY = 'ecoplay.admin.remember';
const ADMIN_RATE_KEY = 'ecoplay.admin.rate';

// Cores originais vibrantes
const ADMIN_ACCENT = {
  dark: {
    color: '#fb923c', // Orange-400
    colorAlt: '#f97316', // Orange-500
    surface: 'rgba(251,146,60,0.15)',
    border: 'rgba(251,146,60,0.5)',
    glow: 'rgba(251,146,60,0.3)',
    text: '#ffffff'
  },
  light: {
    color: '#f97316', // Orange-500
    colorAlt: '#ea580c', // Orange-600
    surface: 'rgba(249,115,22,0.1)',
    border: 'rgba(249,115,22,0.3)',
    glow: 'rgba(249,115,22,0.25)',
    text: '#ffffff'
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

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lockedUntil, setLockedUntil] = useState(() => getRateState().lockedUntil || 0);

  const isLight = theme === 'light';
  const accent = isLight ? ADMIN_ACCENT.light : ADMIN_ACCENT.dark;

  // Cores de fundo consistentes com o app
  const bgStyle = isLight
    ? 'bg-amber-50' // Fundo quente claro
    : 'bg-[#0b1323]'; // Azul noturno profundo

  const cardBg = isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.8)';
  const cardBorder = isLight ? 'rgba(253, 186, 116, 0.3)' : 'rgba(30, 41, 59, 0.5)';
  const cardShadow = `0 20px 60px -15px ${isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0,0,0,0.5)'}`;

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
      className={`min-h-screen flex items-center justify-center py-12 px-4 relative overflow-y-auto transition-colors duration-500 ${bgStyle}`}
      style={{
        '--admin-accent': accent.color,
        '--admin-accent-alt': accent.colorAlt,
        '--admin-accent-glow': accent.glow,
        '--admin-surface': accent.surface,
        '--admin-border': accent.border,
      }}
    >
      {/* Background Stars & Dots - Consistente com o App */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {isLight ? (
          // Estrelas Amarelas Sutis (Modo Claro)
          <>
            <div className="absolute top-[15%] left-[10%] w-3 h-3 text-yellow-400 opacity-60 animate-pulse">✦</div>
            <div className="absolute top-[45%] right-[15%] w-4 h-4 text-yellow-500 opacity-40 animate-pulse delay-700">★</div>
            <div className="absolute bottom-[20%] left-[20%] w-2 h-2 text-amber-400 opacity-50 animate-bounce delay-1000">●</div>
            <div className="absolute top-[10%] right-[30%] w-2 h-2 text-yellow-300 opacity-60">✦</div>
            <div className="absolute bottom-[10%] right-[10%] w-3 h-3 text-amber-500 opacity-40 animate-pulse delay-500">★</div>
          </>
        ) : (
          // Estrelas e Pontos Sutis (Modo Escuro)
          <>
            <div className="absolute top-[20%] left-[20%] w-1 h-1 bg-white/20 rounded-full animate-pulse"></div>
            <div className="absolute top-[60%] right-[20%] w-1.5 h-1.5 bg-white/10 rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-[30%] left-[10%] w-1 h-1 bg-orange-400/20 rounded-full"></div>
            <div className="absolute top-[10%] right-[40%] text-orange-400/20 text-xs">✦</div>
          </>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-8 sm:p-10 rounded-[40px] relative z-10 backdrop-blur-xl border"
        style={{
          backgroundColor: cardBg,
          borderColor: cardBorder,
          boxShadow: cardShadow
        }}
      >
        {/* Header Icon */}
        <div className="flex justify-center mb-8">
          <div
            className="w-20 h-20 rounded-[28px] flex items-center justify-center transform hover:rotate-3 transition-transform duration-300 bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/30"
          >
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-black tracking-tight mb-2 uppercase transition-colors" style={{ color: isLight ? '#451a03' : '#f8fafc' }}>
            ADMIN
          </h1>
          <p className="font-medium tracking-tight transition-colors" style={{ color: isLight ? '#78350f' : '#94a3b8' }}>
            Acesso restrito à administração.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm font-bold text-center animate-shake">
              {error}
            </div>
          )}

          {/* Email field */}
          <div className="space-y-2">
            <label className="text-sm font-bold ml-1 transition-colors" style={{ color: isLight ? '#78350f' : '#cbd5e1' }}>Email</label>
            <div className="relative group">
              <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors pointer-events-none z-10" style={{ color: isLight ? '#b45309' : '#64748b' }} />
              <input
                type="email"
                inputMode="email"
                required
                className="w-full h-14 pl-14 pr-5 rounded-2xl border-2 text-base focus:outline-none transition-all duration-300 font-medium bg-transparent"
                style={{
                  borderColor: isLight ? '#fed7aa' : '#334155',
                  color: isLight ? '#451a03' : '#f1f5f9',
                  backgroundColor: isLight ? '#fff7ed' : '#1e293b'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = accent.color;
                  e.target.style.backgroundColor = isLight ? '#ffffff' : '#0f172a';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isLight ? '#fed7aa' : '#334155';
                  e.target.style.backgroundColor = isLight ? '#fff7ed' : '#1e293b';
                }}
                placeholder="admin@gmail.com"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label className="text-sm font-bold ml-1 transition-colors" style={{ color: isLight ? '#78350f' : '#cbd5e1' }}>Senha</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors pointer-events-none z-10" style={{ color: isLight ? '#b45309' : '#64748b' }} />
              <input
                type="password"
                required
                className="w-full h-14 pl-14 pr-5 rounded-2xl border-2 text-base focus:outline-none transition-all duration-300 font-medium bg-transparent"
                style={{
                  borderColor: isLight ? '#fed7aa' : '#334155',
                  color: isLight ? '#451a03' : '#f1f5f9',
                  backgroundColor: isLight ? '#fff7ed' : '#1e293b'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = accent.color;
                  e.target.style.backgroundColor = isLight ? '#ffffff' : '#0f172a';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isLight ? '#fed7aa' : '#334155';
                  e.target.style.backgroundColor = isLight ? '#fff7ed' : '#1e293b';
                }}
                placeholder="••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Helper links */}
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-3 cursor-pointer group select-none">
              <input
                type="checkbox"
                className="w-5 h-5 rounded-lg border-2 bg-transparent"
                style={{ borderColor: isLight ? '#fdba74' : '#475569', accentColor: accent.color }}
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span className="text-sm font-bold transition-colors" style={{ color: isLight ? '#9a3412' : '#94a3b8' }}>Lembrar</span>
            </label>
            <a href="#" className="text-sm font-bold transition-colors hover:opacity-80" style={{ color: isLight ? '#ea580c' : '#cbd5e1' }}>Esqueci a senha</a>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={submitting || lockSeconds > 0}
            className="w-full h-16 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 shadow-lg"
            style={{
              background: `linear-gradient(to right, ${accent.color}, ${accent.colorAlt})`,
              boxShadow: `0 10px 25px -5px ${accent.glow}`
            }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">ENTRANDO...</span>
            ) : (
              <>
                <LogIn className="w-6 h-6" />
                <span>ENTRAR</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center" style={{ borderColor: isLight ? '#fed7aa' : '#1e293b' }}>
          <Link to="/privacy" className="text-sm font-bold transition-colors hover:opacity-80" style={{ color: isLight ? '#9a3412' : '#94a3b8' }}>
            Segurança e Privacidade
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
