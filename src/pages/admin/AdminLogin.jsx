import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Lock, ShieldCheck, ArrowLeft } from 'lucide-react';

import { useTheme } from '@/context/ThemeContext';

const ADMIN_ACCENT = {
  dark: {
    color: '#fb923c', // Orange-400
    colorAlt: '#f97316', // Orange-500
    surface: 'rgba(251,146,60,0.15)',
    border: 'rgba(251,146,60,0.5)',
    glow: 'rgba(251,146,60,0.32)',
  },
  light: {
    color: '#f97316', // Orange-500
    colorAlt: '#ea580c', // Orange-600
    surface: 'rgba(249,115,22,0.1)',
    border: 'rgba(249,115,22,0.4)',
    glow: 'rgba(249,115,22,0.25)',
  },
};

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const isLight = theme === 'light';
  const accent = isLight ? ADMIN_ACCENT.light : ADMIN_ACCENT.dark;
  const contrast = isLight ? '#f8fafc' : '#0b1323';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await authLogin(email, password);

      const token = localStorage.getItem('ecoplay_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'ADMIN') {
          throw new Error('Acesso negado: Apenas administradores.');
        }
        navigate('/admin/painel', { replace: true });
      }
    } catch (err) {
      console.error(err);
      let errorMsg = 'Falha no login';
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const MotionDiv = motion.div;

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-y-auto bg-theme-bg-primary"
      style={{
        '--login-accent': accent.color,
        '--login-accent-2': accent.colorAlt,
        '--login-accent-surface': accent.surface,
        '--login-accent-border': accent.border,
        '--login-accent-glow': accent.glow,
        '--login-contrast': contrast,
      }}
    >
      <MotionDiv
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-theme-card-bg/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-theme-border relative z-10"
      >
        {/* Header */}
        <div className="text-center">
          <div
            className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg transform rotate-2 mb-6"
            style={{
              backgroundImage: 'linear-gradient(135deg, var(--login-accent), var(--login-accent-2))',
              boxShadow: '0 18px 35px var(--login-accent-glow)',
            }}
          >
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-theme-text-primary tracking-wide">ADMIN</h1>
          <p className="mt-2 text-sm text-theme-text-tertiary font-mono uppercase tracking-tighter">Acesso Restrito</p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} autoComplete="off">
          {error && (
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center font-medium flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{error}</span>
            </MotionDiv>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-theme-text-secondary pl-1">
                Email
              </label>
              <div className="relative group">
                <KeyRound className="absolute left-3.5 top-4 text-theme-text-tertiary group-focus-within:text-[color:var(--login-accent)] transition-colors w-5 h-5 pointer-events-none" />
                <input
                  type="email"
                  inputMode="email"
                  required
                  className="appearance-none rounded-xl relative block w-full pl-11 px-4 py-4 text-base bg-theme-input-bg border-2 border-theme-input-border placeholder-theme-text-tertiary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--login-accent)] focus:border-[color:var(--login-accent)] transition-all font-medium touch-manipulation"
                  placeholder="admin@ecoplay.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-theme-text-secondary pl-1">
                Senha
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-4 text-theme-text-tertiary group-focus-within:text-[color:var(--login-accent)] transition-colors w-5 h-5 pointer-events-none" />
                <input
                  type="password"
                  required
                  className="appearance-none rounded-xl relative block w-full pl-11 px-4 py-4 text-base bg-theme-input-bg border-2 border-theme-input-border placeholder-theme-text-tertiary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--login-accent)] focus:border-[color:var(--login-accent)] transition-all font-medium touch-manipulation"
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
            disabled={submitting}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-bold rounded-xl text-slate-900 bg-[color:var(--login-accent)] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--login-accent)] transition-all shadow-lg hover:shadow-[0_0_20px_var(--login-accent-glow)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {submitting ? 'VALIDANDO...' : 'ACESSAR PAINEL'}
          </button>
        </form>

        <div className="text-center pt-6 border-t border-theme-border mt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-theme-text-tertiary hover:text-[color:var(--login-accent)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para Login de Usuário
          </Link>
        </div>
      </MotionDiv>
    </div>
  );
};

export default AdminLogin;
