import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Lock, LogIn, ShieldCheck } from 'lucide-react';

import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

const ADMIN_REMEMBER_KEY = 'ecoplay.admin.remember';
const ADMIN_RATE_KEY = 'ecoplay.admin.rate';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { theme } = useTheme();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lockedUntil, setLockedUntil] = useState(0);

  const isLight = theme === 'light';
  const orangeAccent = '#f97316'; // Laranja vibrante da imagem
  const accentGlow = 'rgba(249, 115, 22, 0.3)';

  const lockSeconds = useMemo(() => {
    const diff = lockedUntil - Date.now();
    return diff > 0 ? Math.ceil(diff / 1000) : 0;
  }, [lockedUntil]);

  useEffect(() => {
    const savedRate = localStorage.getItem(ADMIN_RATE_KEY);
    if (savedRate) {
      const state = JSON.parse(savedRate);
      if (state.lockedUntil > Date.now()) setLockedUntil(state.lockedUntil);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || lockSeconds > 0) return;

    setError('');
    try {
      setSubmitting(true);
      await authLogin(login.trim(), password.trim());

      const token = localStorage.getItem('ecoplay_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'ADMIN') throw new Error('Acesso negado: Apenas administradores.');
        navigate('/admin/painel', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Falha no login.';
      setError(msg);

      // Bloqueio simples
      const lockTime = Date.now() + 30000;
      setLockedUntil(lockTime);
      localStorage.setItem(ADMIN_RATE_KEY, JSON.stringify({ lockedUntil: lockTime }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#0b1323] px-4 py-12 transition-colors duration-500 overflow-y-auto">
      {/* Background Dots - Como na imagem */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-orange-400 rounded-full blur-[1px]"></div>
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-orange-500 rounded-full blur-[1px]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-orange-300 rounded-full blur-[1px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-slate-900/90 p-8 sm:p-10 rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-800 relative z-10"
      >
        {/* Header Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-[28px] bg-orange-600 flex items-center justify-center shadow-[0_15px_30px_rgba(234,88,12,0.4)] transform hover:rotate-3 transition-transform duration-300">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-black text-slate-800 dark:text-white tracking-tight mb-2 uppercase">ADMIN</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Acesso restrito à administração.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold text-center border border-red-100 animate-shake">
              {error}
            </div>
          )}

          {/* Email field */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 dark:text-slate-300 ml-1">Email</label>
            <div className="relative group">
              <input
                type="email"
                required
                className="w-full h-14 px-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base focus:border-orange-500 focus:outline-none transition-all duration-300 font-medium"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 dark:text-slate-300 ml-1">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                className="w-full h-14 pl-14 pr-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base focus:border-orange-500 focus:outline-none transition-all duration-300 font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Helper links */}
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="w-5 h-5 rounded-lg border-2 border-slate-300 text-orange-600 focus:ring-orange-500"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">Lembrar</span>
            </label>
            <a href="#" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors">Esqueci a senha</a>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={submitting || lockSeconds > 0}
            className="w-full h-16 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(249,115,22,0.3)] hover:shadow-[0_15px_35px_rgba(249,115,22,0.4)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 group"
          >
            {submitting ? (
              <span className="flex items-center gap-2">PROCESSANDO...</span>
            ) : (
              <>
                <LogIn className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" />
                <span>ENTRAR</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
          <Link to="/privacy" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-orange-600 transition-colors">
            Segurança e Privacidade
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
