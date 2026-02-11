import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Leaf, CheckCircle2, ArrowRight } from 'lucide-react';

import { useTheme } from '@/context/ThemeContext';

const REGISTER_ACCENT = {
  dark: {
    color: '#10b981', // Emerald-500
    colorAlt: '#059669', // Emerald-600
    surface: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.5)',
    glow: 'rgba(16, 185, 129, 0.32)',
  },
  light: {
    color: '#059669', // Emerald-600
    colorAlt: '#047857', // Emerald-700
    surface: 'rgba(5, 150, 105, 0.1)',
    border: 'rgba(5, 150, 105, 0.4)',
    glow: 'rgba(5, 150, 105, 0.25)',
  },
};

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const isLight = theme === 'light';
  const accent = isLight ? REGISTER_ACCENT.light : REGISTER_ACCENT.dark;
  const contrast = isLight ? '#f8fafc' : '#0b1323';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(fullName, email, password);
      setSuccess(true);
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      console.error(err);
      let errorMsg = 'Erro ao criar conta.';

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
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-y-auto supports-[min-height:100dvh]:min-h-[100dvh] bg-theme-bg-primary"
      style={{
        '--reg-accent': accent.color,
        '--reg-accent-2': accent.colorAlt,
        '--reg-accent-surface': accent.surface,
        '--reg-accent-border': accent.border,
        '--reg-accent-glow': accent.glow,
        '--reg-contrast': contrast,
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
            className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 mb-6"
            style={{
              backgroundImage: 'linear-gradient(135deg, var(--reg-accent), var(--reg-accent-2))',
              boxShadow: '0 18px 35px var(--reg-accent-glow)',
            }}
          >
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-theme-text-primary tracking-wide">EcoPlay</h1>
          <p className="mt-2 text-sm text-theme-text-tertiary font-mono uppercase tracking-tighter">Criar Conta</p>
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
            <h3 className="text-lg font-bold text-theme-text-primary mb-2">Conta Criada!</h3>
            <p className="text-sm text-theme-text-secondary">Seja bem-vindo...</p>
          </MotionDiv>
        ) : (
          <>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                  <label htmlFor="fullName" className="text-sm font-semibold text-theme-text-secondary pl-1">
                    Nome Completo
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-4 text-theme-text-tertiary group-focus-within:text-[color:var(--reg-accent)] transition-colors w-5 h-5 pointer-events-none" />
                    <input
                      id="fullName"
                      type="text"
                      required
                      className="appearance-none rounded-xl relative block w-full pl-11 px-4 py-4 text-base bg-theme-input-bg border-2 border-theme-input-border placeholder-theme-text-tertiary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--reg-accent)] focus:border-[color:var(--reg-accent)] transition-all font-medium touch-manipulation"
                      placeholder="Como podemos te chamar?"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-semibold text-theme-text-secondary pl-1">
                    Seu Melhor Email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-4 text-theme-text-tertiary group-focus-within:text-[color:var(--reg-accent)] transition-colors w-5 h-5 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      className="appearance-none rounded-xl relative block w-full pl-11 px-4 py-4 text-base bg-theme-input-bg border-2 border-theme-input-border placeholder-theme-text-tertiary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--reg-accent)] focus:border-[color:var(--reg-accent)] transition-all font-medium touch-manipulation"
                      placeholder="exemplo@vibe.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-semibold text-theme-text-secondary pl-1">
                    Crie uma Senha Forte
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-4 text-theme-text-tertiary group-focus-within:text-[color:var(--reg-accent)] transition-colors w-5 h-5 pointer-events-none" />
                    <input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="appearance-none rounded-xl relative block w-full pl-11 px-4 py-4 text-base bg-theme-input-bg border-2 border-theme-input-border placeholder-theme-text-tertiary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--reg-accent)] focus:border-[color:var(--reg-accent)] transition-all font-medium touch-manipulation"
                      placeholder="Mínimo 8 caracteres"
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
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-bold rounded-xl text-slate-900 bg-[color:var(--reg-accent)] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--reg-accent)] transition-all shadow-lg hover:shadow-[0_0_20px_var(--reg-accent-glow)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation mt-4"
              >
                {submitting ? 'CRIANDO CONTA...' : 'CRIAR CONTA AGORA'}
              </button>
            </form>

            <div className="text-center pt-6">
              <p className="text-sm text-theme-text-tertiary">
                Já faz parte da comunidade?{' '}
                <Link to="/login" className="font-bold text-[color:var(--reg-accent)] hover:text-[color:var(--reg-accent-2)] transition-colors inline-flex items-center gap-1 group">
                  Faça Login <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </p>
            </div>
          </>
        )}
      </MotionDiv>
    </div>
  );
};

export default Register;
