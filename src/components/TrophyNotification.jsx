import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import confetti from 'canvas-confetti';
import { playCelebration } from '../utils/soundEffects';

const THEME_STYLES = {
  yellow: {
    border: 'border-yellow-500/50',
    shadow: 'shadow-yellow-500/40',
    iconBg: 'bg-yellow-500/20',
    iconRing: 'ring-yellow-500/30',
    text: 'text-yellow-400',
    button: 'bg-yellow-500 hover:bg-yellow-400 shadow-yellow-500/20',
    gradient: 'from-yellow-500/10'
  },
  orange: {
    border: 'border-orange-500/50',
    shadow: 'shadow-orange-500/40',
    iconBg: 'bg-orange-500/20',
    iconRing: 'ring-orange-500/30',
    text: 'text-orange-400',
    button: 'bg-orange-500 hover:bg-orange-400 shadow-orange-500/20',
    gradient: 'from-orange-500/10'
  },
  purple: {
    border: 'border-purple-500/50',
    shadow: 'shadow-purple-500/40',
    iconBg: 'bg-purple-500/20',
    iconRing: 'ring-purple-500/30',
    text: 'text-purple-400',
    button: 'bg-purple-500 hover:bg-purple-400 shadow-purple-500/20',
    gradient: 'from-purple-500/10'
  },
  blue: {
    border: 'border-blue-500/50',
    shadow: 'shadow-blue-500/40',
    iconBg: 'bg-blue-500/20',
    iconRing: 'ring-blue-500/30',
    text: 'text-blue-400',
    button: 'bg-blue-500 hover:bg-blue-400 shadow-blue-500/20',
    gradient: 'from-blue-500/10'
  },
  green: {
    border: 'border-green-500/50',
    shadow: 'shadow-green-500/40',
    iconBg: 'bg-green-500/20',
    iconRing: 'ring-green-500/30',
    text: 'text-green-400',
    button: 'bg-green-500 hover:bg-green-400 shadow-green-500/20',
    gradient: 'from-green-500/10'
  },
  teal: {
    border: 'border-teal-500/50',
    shadow: 'shadow-teal-500/40',
    iconBg: 'bg-teal-500/20',
    iconRing: 'ring-teal-500/30',
    text: 'text-teal-400',
    button: 'bg-teal-500 hover:bg-teal-400 shadow-teal-500/20',
    gradient: 'from-teal-500/10'
  },
  pink: {
    border: 'border-pink-500/50',
    shadow: 'shadow-pink-500/40',
    iconBg: 'bg-pink-500/20',
    iconRing: 'ring-pink-500/30',
    text: 'text-pink-400',
    button: 'bg-pink-500 hover:bg-pink-400 shadow-pink-500/20',
    gradient: 'from-pink-500/10'
  },
  indigo: {
    border: 'border-indigo-500/50',
    shadow: 'shadow-indigo-500/40',
    iconBg: 'bg-indigo-500/20',
    iconRing: 'ring-indigo-500/30',
    text: 'text-indigo-400',
    button: 'bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/20',
    gradient: 'from-indigo-500/10'
  },
  red: {
    border: 'border-red-500/50',
    shadow: 'shadow-red-500/40',
    iconBg: 'bg-red-500/20',
    iconRing: 'ring-red-500/30',
    text: 'text-red-400',
    button: 'bg-red-500 hover:bg-red-400 shadow-red-500/20',
    gradient: 'from-red-500/10'
  },
  emerald: {
    border: 'border-emerald-500/50',
    shadow: 'shadow-emerald-500/40',
    iconBg: 'bg-emerald-500/20',
    iconRing: 'ring-emerald-500/30',
    text: 'text-emerald-400',
    button: 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20',
    gradient: 'from-emerald-500/10'
  },
  cyan: {
    border: 'border-cyan-500/50',
    shadow: 'shadow-cyan-500/40',
    iconBg: 'bg-cyan-500/20',
    iconRing: 'ring-cyan-500/30',
    text: 'text-cyan-400',
    button: 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/20',
    gradient: 'from-cyan-500/10'
  },
  fuchsia: {
    border: 'border-fuchsia-500/50',
    shadow: 'shadow-fuchsia-500/40',
    iconBg: 'bg-fuchsia-500/20',
    iconRing: 'ring-fuchsia-500/30',
    text: 'text-fuchsia-400',
    button: 'bg-fuchsia-500 hover:bg-fuchsia-400 shadow-fuchsia-500/20',
    gradient: 'from-fuchsia-500/10'
  },
  rose: {
    border: 'border-rose-500/50',
    shadow: 'shadow-rose-500/40',
    iconBg: 'bg-rose-500/20',
    iconRing: 'ring-rose-500/30',
    text: 'text-rose-400',
    button: 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/20',
    gradient: 'from-rose-500/10'
  }
};

const TrophyNotification = () => {
  const { newBadge, claimReward } = useGameState();

  const handleCollect = () => {
    claimReward();
  };

  useEffect(() => {
    if (newBadge) {
      playCelebration();
      // Confete dourado para celebrar
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FFA500', '#FFFFFF']
      });

      // Sem auto-dismiss: O usuário deve clicar para coletar
    }
  }, [newBadge]);

  if (!newBadge) return null;

  const theme = THEME_STYLES[newBadge.theme] || THEME_STYLES.yellow;
  const rewardAmount = newBadge.reward || 50;

  return (
    <AnimatePresence>
      {newBadge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Overlay Escuro */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          />

          <div className={`bg-slate-800 border-2 ${theme.border} rounded-3xl p-8 ${theme.shadow} max-w-sm w-full text-center relative pointer-events-auto transform overflow-hidden`}>
            {/* Efeitos de fundo */}
            <div className={`absolute inset-0 bg-gradient-to-b ${theme.gradient} to-transparent pointer-events-none`} />
            
            <motion.div 
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className={`relative w-24 h-24 mx-auto mb-6 ${theme.iconBg} rounded-full flex items-center justify-center ring-4 ${theme.iconRing} shadow-lg`}
            >
              <div className={`${theme.text} [&>svg]:w-12 [&>svg]:h-12`}>
                 {newBadge.icon || <Trophy className="w-12 h-12" />}
              </div>
            </motion.div>

            <h3 className={`font-display font-bold ${theme.text} text-xs tracking-[0.2em] uppercase mb-2`}>Conquista Desbloqueada</h3>
            <h2 className="text-2xl font-bold text-white mb-3">{newBadge.title}</h2>
            <p className="text-slate-300 text-sm mb-8 leading-relaxed">
              {newBadge.description}
            </p>

            <button 
              onClick={handleCollect}
              className={`${theme.button} relative z-10 cursor-pointer text-slate-900 font-bold py-3 px-8 rounded-xl transition-all w-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95`}
            >
              Coletar +{rewardAmount} XP
            </button>

            <button 
              onClick={handleCollect}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors cursor-pointer z-20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TrophyNotification;
