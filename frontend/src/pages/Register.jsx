import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, UserPlus, ArrowLeft, Zap, CloudOff } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/layout/AnimatedBackground';
// import { isRemoteDbEnabled } from '../services/remoteDb'; // Removido - não utilizado

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  // const isOfflineMode = !isRemoteDbEnabled(); // Removido - não utilizado

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSubmitting(true);
    const result = await register(name, email, password);
    setSubmitting(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
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
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-eco-blue to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 mb-6">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white tracking-wide">
            RECRUTAMENTO
          </h2>
          <p className="mt-2 text-sm text-slate-400 font-mono">
            Junte-se ao esquadrão EcoPlay hoje.
          </p>

          {/* Offline indicator removed */}
        </div>
        
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
          
          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-eco-blue transition-colors w-5 h-5" />
              <input
                type="text"
                required
                className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-slate-900/50 border border-slate-600 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-eco-blue focus:border-transparent transition-all font-medium"
                placeholder="Codinome (Nome)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-eco-blue transition-colors w-5 h-5" />
              <input
                type="email"
                required
                className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-slate-900/50 border border-slate-600 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-eco-blue focus:border-transparent transition-all font-medium"
                placeholder="Email de Contato"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-eco-blue transition-colors w-5 h-5" />
              <input
                type="password"
                required
                className="appearance-none rounded-xl relative block w-full pl-10 px-4 py-3 bg-slate-900/50 border border-slate-600 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-eco-blue focus:border-transparent transition-all font-medium"
                placeholder="Senha (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-eco-blue hover:bg-eco-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eco-blue transition-all shadow-lg hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:-translate-y-0.5"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <UserPlus className="h-5 w-5 text-eco-blue-light group-hover:text-white transition-colors" />
              </span>
              {submitting ? 'CADASTRANDO...' : 'CONFIRMAR ALISTAMENTO'}
            </button>
          </div>
        </form>

        <div className="text-center border-t border-slate-700 pt-6">
          <p className="text-sm text-slate-400">
            Já é um Guardião?{' '}
            <Link to="/login" className="font-bold text-eco-blue hover:text-eco-blue-light flex items-center justify-center gap-1 mt-2 group transition-colors">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Acessar Base
            </Link>
          </p>
          <p className="text-xs text-slate-500 mt-5">
            <Link
              to="/privacy"
              aria-label="Abrir página de Segurança e Privacidade"
              className="font-semibold text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-blue/60 rounded"
            >
              Segurança e Privacidade
            </Link>
          </p>
        </div>
      </MotionDiv>
    </div>
  );
};

export default Register;
