
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LogIn, Play, Zap, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { playClick, playHover } from '@/utils/soundEffects';

const WelcomeHero = () => {
  const { user } = useAuth();



  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-100, 100], [10, -10]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-10, 10]), { stiffness: 150, damping: 20 });

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <section className="relative overflow-hidden backdrop-blur-2xl bg-theme-bg-secondary/70 text-theme-text-primary min-h-[460px] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-12 rounded-3xl mx-4 mt-5 mb-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)] border border-theme-border/70">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--theme-accent-rgb),0.18),transparent_50%)] opacity-90" />


      <div className="relative z-10 w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
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
              repeatType: 'reverse',
              repeatDelay: 2,
            }}
            className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest mb-6 border border-green-500/50 shadow-[0_0_16px_rgba(74,222,128,0.4)]"
          >
            <Zap className="w-3 h-3 text-green-400 fill-green-400" />
            <span>MISSÃO DETECTADA</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-display font-bold mb-5 leading-tight text-theme-text-primary">
            Sua Missão: <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-lime-400 filter drop-shadow-[0_0_18px_rgba(74,222,128,0.3)]">
              Salvar o Futuro
            </span>
          </h1>

          <p className="text-base md:text-lg text-theme-text-secondary mb-8 max-w-lg leading-relaxed font-sans">
            Jogue missões divertidas, aprenda energias renováveis e ganhe XP para virar um{' '}
            <strong className="text-green-400 font-bold">Guardião Planetário</strong> que salva o futuro da Terra.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              to={user ? '/dashboard' : '/login'}

              onClick={() => playClick()}
              className="relative group flex items-center gap-3 bg-gradient-to-r from-orange-400 to-orange-500 text-black px-8 py-4 rounded-xl font-display font-bold text-base md:text-lg shadow-[0_10px_24px_rgba(249,115,22,0.4)] hover:shadow-[0_14px_30px_rgba(249,115,22,0.6)] transform hover:scale-[1.02] transition-all"
              aria-label={user ? 'Acessar painel' : 'Entrar no sistema'}
            >
              {user ? <Play className="w-5 h-5 fill-black text-black" /> : <LogIn className="w-5 h-5 text-black" />}
              {user ? 'ACESSAR PAINEL' : 'ENTRAR NO SISTEMA'}
            </Link>
            <Link
              to={user ? '/games' : '/saiba-mais'}

              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-orange-500/50 text-orange-400 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-500/10 transition-all text-sm md:text-base font-semibold"
              aria-label={user ? 'Ver jogos' : 'Conhecer a missão'}
            >
              {user ? 'Ver jogos' : 'Conhecer a missão'}
              <ArrowRight className="w-4 h-4 text-orange-500" />
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative hidden md:flex justify-center items-center perspective-1000"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ perspective: 1000 }}
        >
          <div className="absolute w-[80vw] h-[80vw] max-w-[400px] max-h-[400px] border border-green-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
          <div className="absolute w-[70vw] h-[70vw] max-w-[350px] max-h-[350px] border border-dashed border-green-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

          <motion.div
            style={{ rotateX, rotateY }}
            className="relative z-10 w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 bg-gradient-to-b from-theme-bg-secondary to-theme-bg-tertiary rounded-3xl border border-theme-border shadow-2xl flex items-center justify-center animate-float group cursor-pointer"
          >
            <div className="absolute -top-6 -right-6 md:-top-8 md:-right-8 lg:-top-10 lg:-right-10 bg-green-500 text-white font-bold p-3 md:p-4 rounded-2xl shadow-xl transform rotate-12 group-hover:rotate-6 transition-transform z-20 border-2 border-green-400 flex items-center justify-center">
              <Shield className="w-8 h-8 md:w-10 md:h-10 text-white fill-white/20" />
            </div>

            <div className="relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <span className="text-[80px] md:text-[120px] lg:text-[150px] leading-none drop-shadow-[0_12px_24px_rgba(74,222,128,0.5)]">
                🌍
              </span>
            </div>

            <div className="absolute -bottom-4 -left-4 md:-bottom-5 md:-left-5 lg:-bottom-6 lg:-left-6 bg-theme-bg-tertiary/70 backdrop-blur border border-theme-border/70 p-2 md:p-3 rounded-lg shadow-xl text-xs font-mono z-20 transform translate-z-10 group-hover:translate-y-[-5px] transition-transform">
              <div className="text-theme-text-tertiary text-[10px] md:text-xs">ALVO</div>
              <div className="text-green-400 font-bold flex items-center gap-1 text-[10px] md:text-xs">
                TERRA
                <span className="animate-pulse w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 inline-block" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default WelcomeHero;
