import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Lock, Leaf, ArrowRight, CheckCircle2 } from 'lucide-react';

import { useTheme } from '@/context/ThemeContext';

const LOGIN_ACCENT = {
  dark: {
    color: '#4ade80', // Green-400
    colorAlt: '#22c55e', // Green-500
    surface: 'rgba(74, 222, 128, 0.15)',
    border: 'rgba(74, 222, 128, 0.5)',
    glow: 'rgba(74, 222, 128, 0.32)',
  },
  light: {
    color: '#16a34a', // Green-600
    colorAlt: '#15803d', // Green-700
    surface: 'rgba(22, 163, 74, 0.1)',
    border: 'rgba(22, 163, 74, 0.4)',
    glow: 'rgba(22, 163, 74, 0.25)',
  },
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const isLight = theme === 'light';
  const accent = isLight ? LOGIN_ACCENT.light : LOGIN_ACCENT.dark;
  const contrast = isLight ? '#f8fafc' : '#0b1323';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      setSuccess(true);
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      console.error(err);
      let errorMsg = 'Falha no login';

      if (err.response?.data?.error) {
        const backendErr = err.response.data.error;
        if (typeof backendErr === 'object') {
          errorMsg = backendErr.message || JSON.stringify(backendErr);
        } else {
          errorMsg = String(backendErr);
        }
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
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-y-auto supports-[min-height:100dvh]:min-h-[100dvh]"
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
            className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-2 mb-6"
            style={{
              backgroundImage: 'linear-gradient(135deg, var(--login-accent), var(--login-accent-2))',
              boxShadow: '0 18px 35px var(--login-accent-glow)',
            }}
          >
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-theme-text-primary tracking-wide">EcoPlay</h1>
          <p className="mt-2 text-sm text-theme-text-tertiary font-mono uppercase tracking-tighter">Login</p>
        </div>

        {/* Success State */}
        {success ? (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-theme-text-primary mb-2">Conectado!</h3>
            <p className="text-sm text-theme-text-secondary">Redirecionando...</p>
          </MotionDiv>
        ) : (
          <>
            {/* Login Form */}
            <form className="mt-8 space-y-6" onSubmit={handleSubmit} autoComplete="off">
              {error && (
                <MotionDiv
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center font-medium flex items-center justify-center gap-2"
                  role="alert"
                >
                  <Lock className="w-4 h-4" />
                  <span>{error}</span>
                </MotionDiv>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email-address" className="text-sm font-semibold text-theme-text-secondary">
                    Email
                  </label>
                  <div className="relative group">
                    <KeyRound className="absolute left-3 top-3.5 text-theme-text-tertiary group-focus-within:text-[color:var(--login-accent)] transition-colors w-5 h-5" />
                    <input
                      id="email-address"
                      name="ecoplay_login_email"
                      type="email"
                      autoComplete="off"
                      required
                      className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-theme-input-bg border border-theme-input-border placeholder-theme-text-tertiary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--login-accent)] focus:border-[color:var(--login-accent)] transition-all font-medium"
                      placeholder="Seu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-semibold text-theme-text-secondary">
                    Senha
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3.5 text-theme-text-tertiary group-focus-within:text-[color:var(--login-accent)] transition-colors w-5 h-5" />
                    <input
                      id="password"
                      name="ecoplay_login_password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-theme-input-bg border border-theme-input-border placeholder-theme-text-tertiary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--login-accent)] focus:border-[color:var(--login-accent)] transition-all font-medium"
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-slate-900 bg-[color:var(--login-accent)] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--login-accent)] transition-all shadow-lg hover:shadow-[0_0_20px_var(--login-accent-glow)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'ENTRANDO...' : 'ENTRAR'}
              </button>
            </form>

            {/* Register Link */}
            <div className="text-center border-t border-theme-border pt-6 mt-6">
              <p className="text-xs text-theme-text-tertiary mb-3">
                Primeira vez por aqui?
              </p>
              <Link
                to="/register"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-[11px] uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300"
              >
                Criar Conta Completa <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </MotionDiv>
    </div>
  );
};

export default Login;
