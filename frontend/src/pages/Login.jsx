import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck, CloudOff } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/layout/AnimatedBackground';
// import { isRemoteDbEnabled } from '../services/remoteDb'; // Removido - não utilizado

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [issuedCode, setIssuedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const { login, requestPasswordReset, confirmPasswordReset, updatePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // const isOfflineMode = !isRemoteDbEnabled(); // Removido - não utilizado

  const isRecovery = useMemo(() => {
    const rawHash = String(location.hash || '').replace(/^#/, '');
    const hashParams = new URLSearchParams(rawHash);
    const qParams = new URLSearchParams(String(location.search || '').replace(/^\?/, ''));
    const t = (hashParams.get('type') || qParams.get('type') || '').toLowerCase();
    return t === 'recovery';
  }, [location.hash, location.search]);

  useEffect(() => {
    if (isRecovery) setView('recovery');
  }, [isRecovery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);
    
    const result = await login(email, password);
    setSubmitting(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIssuedCode('');
    setSubmitting(true);

    const result = await requestPasswordReset(resetEmail);
    setSubmitting(false);
    if (!result?.success) {
      setError(result?.message || 'Não foi possível solicitar a recuperação.');
      return;
    }
    if (result?.method === 'local' && result?.resetCode) {
      setIssuedCode(String(result.resetCode));
      setView('confirm');
      setInfo('Código gerado. Use-o para definir uma nova senha.');
      return;
    }
    setInfo('Se existir uma conta com esse email, você receberá instruções para redefinir a senha.');
    setView('login');
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (newPassword !== newPassword2) {
      setError('As senhas não conferem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setSubmitting(true);
    const result = await confirmPasswordReset(resetEmail, resetCode, newPassword);
    setSubmitting(false);
    if (!result?.success) {
      setError(result?.message || 'Não foi possível redefinir a senha.');
      return;
    }
    setInfo('Senha atualizada. Você já pode entrar.');
    setResetCode('');
    setNewPassword('');
    setNewPassword2('');
    setIssuedCode('');
    setView('login');
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (newPassword !== newPassword2) {
      setError('As senhas não conferem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setSubmitting(true);
    const result = await updatePassword(newPassword);
    setSubmitting(false);
    if (!result?.success) {
      setError(result?.message || 'Não foi possível atualizar a senha.');
      return;
    }
    setInfo('Senha atualizada. Você já pode continuar.');
    navigate('/dashboard');
  };

  const MotionDiv = motion.div;
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
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-eco-green to-teal-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 mb-6">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white tracking-wide">
            IDENTIFICAÇÃO
          </h2>
          <p className="mt-2 text-sm text-slate-400 font-mono">
            Insira suas credenciais de Guardião.
          </p>
          
          {/* Offline indicator removed */}
        </div>
        
        {view === 'login' && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <MotionDiv 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center font-medium flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> {error}
            </MotionDiv>
          )}
          {info && (
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-eco-green/10 border border-eco-green/40 text-eco-green-light p-3 rounded-lg text-sm text-center font-medium"
            >
              {info}
            </MotionDiv>
          )}
          
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-eco-green transition-colors w-5 h-5" />
              <input
                type="email"
                required
                className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-slate-900/50 border border-slate-600 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent transition-all font-medium"
                placeholder="Email de Acesso"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-eco-green transition-colors w-5 h-5" />
              <input
                type="password"
                required
                className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-slate-900/50 border border-slate-600 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent transition-all font-medium"
                placeholder="Senha de Segurança"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setError('');
                setInfo('');
                setResetEmail(email);
                setView('request');
              }}
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-green/60 rounded"
            >
              Esqueci a senha
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-slate-900 bg-eco-green hover:bg-eco-green-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eco-green transition-all shadow-lg hover:shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:-translate-y-0.5"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-slate-800 group-hover:text-slate-900 transition-colors" />
              </span>
              {submitting ? 'ENTRANDO...' : 'ACESSAR SISTEMA'}
            </button>
          </div>

          <div className="pt-2">
            <Link
              to="/admin"
              aria-label="Acessar login administrativo"
              className="group relative w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-slate-900 bg-amber-400 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:-translate-y-0.5"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <ShieldCheck className="h-5 w-5 text-amber-900 transition-colors" />
              </span>
              ÁREA ADMINISTRATIVA
            </Link>
          </div>
        </form>
        )}

        {view === 'request' && (
          <form className="mt-8 space-y-6" onSubmit={handleRequestReset}>
            {error && (
              <MotionDiv
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center font-medium flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" /> {error}
              </MotionDiv>
            )}
            {info && (
              <MotionDiv
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-eco-green/10 border border-eco-green/40 text-eco-green-light p-3 rounded-lg text-sm text-center font-medium"
              >
                {info}
              </MotionDiv>
            )}
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-eco-green transition-colors w-5 h-5" />
                <input
                  type="email"
                  required
                  className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-slate-900/50 border border-slate-600 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent transition-all font-medium"
                  placeholder="Email de Acesso"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setInfo('');
                  setView('login');
                }}
                className="w-full py-3 px-4 text-sm font-bold rounded-xl text-slate-200 bg-slate-700/60 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 text-sm font-bold rounded-xl text-slate-900 bg-eco-green hover:bg-eco-green-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eco-green transition-all"
              >
                {submitting ? 'ENVIANDO...' : 'RECUPERAR'}
              </button>
            </div>
          </form>
        )}

        {view === 'confirm' && (
          <form className="mt-8 space-y-6" onSubmit={handleConfirmReset}>
            {error && (
              <MotionDiv
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center font-medium flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" /> {error}
              </MotionDiv>
            )}
            {issuedCode && (
              <MotionDiv
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900/50 border border-slate-600 text-slate-200 p-3 rounded-lg text-sm text-center font-semibold"
              >
                Código: {issuedCode}
              </MotionDiv>
            )}
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-eco-green transition-colors w-5 h-5" />
                <input
                  type="email"
                  required
                  className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-slate-900/50 border border-slate-600 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent transition-all font-medium"
                  placeholder="Email de Acesso"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-eco-green transition-colors w-5 h-5" />
                <input
                  type="text"
                  required
                  className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-slate-900/50 border border-slate-600 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent transition-all font-medium"
                  placeholder="Código de recuperação"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-eco-green transition-colors w-5 h-5" />
                <input
                  type="password"
                  required
                  className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-slate-900/50 border border-slate-600 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent transition-all font-medium"
                  placeholder="Nova senha (mín. 6 caracteres)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-eco-green transition-colors w-5 h-5" />
                <input
                  type="password"
                  required
                  className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-slate-900/50 border border-slate-600 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent transition-all font-medium"
                  placeholder="Confirmar nova senha"
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setInfo('');
                  setView('login');
                }}
                className="w-full py-3 px-4 text-sm font-bold rounded-xl text-slate-200 bg-slate-700/60 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 text-sm font-bold rounded-xl text-slate-900 bg-eco-green hover:bg-eco-green-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eco-green transition-all"
              >
                {submitting ? 'SALVANDO...' : 'ATUALIZAR'}
              </button>
            </div>
          </form>
        )}

        {view === 'recovery' && (
          <form className="mt-8 space-y-6" onSubmit={handleRecoverySubmit}>
            {error && (
              <MotionDiv
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center font-medium flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" /> {error}
              </MotionDiv>
            )}
            {info && (
              <MotionDiv
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-eco-green/10 border border-eco-green/40 text-eco-green-light p-3 rounded-lg text-sm text-center font-medium"
              >
                {info}
              </MotionDiv>
            )}
            <div className="space-y-4">
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-eco-green transition-colors w-5 h-5" />
                <input
                  type="password"
                  required
                  className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-slate-900/50 border border-slate-600 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent transition-all font-medium"
                  placeholder="Nova senha (mín. 6 caracteres)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-eco-green transition-colors w-5 h-5" />
                <input
                  type="password"
                  required
                  className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-slate-900/50 border border-slate-600 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-transparent transition-all font-medium"
                  placeholder="Confirmar nova senha"
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-slate-900 bg-eco-green hover:bg-eco-green-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eco-green transition-all shadow-lg hover:shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:-translate-y-0.5"
            >
              {submitting ? 'SALVANDO...' : 'ATUALIZAR SENHA'}
            </button>
          </form>
        )}

        <div className="text-center border-t border-slate-700 pt-6">
          <p className="text-sm text-slate-400">
            Novo no esquadrão?{' '}
            <Link to="/register" className="font-bold text-eco-green hover:text-eco-green-light flex items-center justify-center gap-1 mt-2 group transition-colors">
              Iniciar Recrutamento <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </p>
          <p className="text-xs text-slate-500 mt-5">
            <Link
              to="/privacy"
              aria-label="Abrir página de Segurança e Privacidade"
              className="font-semibold text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-green/60 rounded"
            >
              Segurança e Privacidade
            </Link>
          </p>
        </div>
      </MotionDiv>
    </div>
  );
};

export default Login;
