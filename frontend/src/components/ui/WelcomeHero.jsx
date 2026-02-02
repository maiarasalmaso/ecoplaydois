import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LogIn, Play, Zap, Shield, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AnimatedBackground from '../layout/AnimatedBackground';

const WelcomeHero = () => {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden bg-slate-900 text-white min-h-[500px] flex items-center justify-center px-4 sm:px-6 lg:px-8 rounded-3xl mx-4 mt-6 mb-6 shadow-2xl border border-slate-800">
      <AnimatedBackground />
      
      <div className="relative z-10 w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Coluna Texto */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-left"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.5,
              repeat: Infinity,
              repeatType: "reverse",
              repeatDelay: 2
            }}
            className="inline-flex items-center gap-2 bg-yellow-400/10 text-yellow-400 px-3 py-1 rounded-full text-xs font-mono mb-6 border border-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.3)]"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>MISSÃO DETECTADA</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-tight glow-text">
            Sua Missão: <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-eco-green to-teal-400 filter drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]">
              Salvar o Futuro
            </span>
          </h1>
          
          <p className="text-lg text-slate-300 mb-8 max-w-lg font-light leading-relaxed">
            Jogue missões divertidas, aprenda energias renováveis e ganhe XP para virar um <strong className="text-white">Guardião Planetário</strong> que salva o futuro da Terra.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap gap-4"
          >
            <Link 
              to={user ? "/dashboard" : "/login"}
              className="relative group flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 px-8 py-4 rounded-xl font-display font-bold text-lg shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:shadow-[0_0_30px_rgba(250,204,21,0.6)] hover:brightness-110 transform hover:scale-105 transition-all"
            >
              {user ? <Play className="w-5 h-5 fill-current" /> : <LogIn className="w-5 h-5" />}
              {user ? "ACESSAR PAINEL" : "ENTRAR NO SISTEMA"}
              <div className="absolute inset-0 rounded-xl ring-2 ring-white/50 animate-pulse-glow" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Coluna Avatar / Visual */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative hidden md:flex justify-center items-center"
        >
          {/* Círculo Tech Atrás */}
          <div className="absolute w-[80vw] h-[80vw] max-w-[400px] max-h-[400px] border border-eco-green/20 rounded-full animate-[spin_10s_linear_infinite]" />
          <div className="absolute w-[70vw] h-[70vw] max-w-[350px] max-h-[350px] border border-dashed border-blue-400/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
          
          {/* Avatar / Personagem (Planeta Terra) */}
          <div className="relative z-10 w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl border border-slate-700 shadow-2xl flex items-center justify-center animate-float group">
             <div className="absolute -top-6 -right-6 md:-top-8 md:-right-8 lg:-top-10 lg:-right-10 bg-eco-green text-slate-900 font-bold p-2 md:p-3 rounded-xl shadow-lg transform rotate-12 group-hover:rotate-6 transition-transform z-20">
                <Shield className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" />
             </div>
             
             {/* Planeta Terra Customizado (Emoji) */}
             <div className="relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <span className="text-[80px] md:text-[120px] lg:text-[150px] leading-none filter drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                  🌍
                </span>
             </div>
             
             {/* Stats Card Flutuante */}
             <div className="absolute -bottom-4 -left-4 md:-bottom-5 md:-left-5 lg:-bottom-6 lg:-left-6 bg-slate-800/90 backdrop-blur border border-slate-600 p-2 md:p-3 rounded-lg shadow-xl text-xs font-mono z-20">
                <div className="text-slate-400 text-[10px] md:text-xs">ALVO</div>
                <div className="text-blue-400 font-bold flex items-center gap-1 text-[10px] md:text-xs">
                  TERRA <span className="animate-pulse w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-500 inline-block"></span>
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WelcomeHero;
