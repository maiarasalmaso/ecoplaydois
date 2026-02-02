import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { useGameState } from '@/context/GameStateContext';
import confetti from 'canvas-confetti';
import { playCelebration } from '@/utils/soundEffects';

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
    border: 'border-green-500/50',
    shadow: 'shadow-green-500/40',
    iconBg: 'bg-green-500/20',
    iconRing: 'ring-green-500/30',
    text: 'text-green-400',
    button: 'bg-green-500 hover:bg-green-400 shadow-green-500/20',
    gradient: 'from-green-500/10'
  },
  cyan: {
    border: 'border-green-500/50',
    shadow: 'shadow-green-500/40',
    iconBg: 'bg-green-500/20',
    iconRing: 'ring-green-500/30',
    text: 'text-green-400',
    button: 'bg-green-500 hover:bg-green-400 shadow-green-500/20',
    gradient: 'from-green-500/10'
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
  const { newBadge, claimReward, badgeUnlocks } = useGameState();

  const handleCollect = () => {
    claimReward();
  };

  useEffect(() => {
    if (newBadge) {
      // Verificar quando foi desbloqueado para evitar spam de confete em logins futuros
      const unlockedAt = badgeUnlocks?.[newBadge?.id];
      const isValidDate = unlockedAt && !isNaN(new Date(unlockedAt).getTime());

      // Se não tiver data (legado) ou for recente (< 10s), considera "fresco" para evitar falha
      // Mas para evitar spam de legado, se não tiver data, melhor NÃO tocar.
      // Assumindo que novos unlocks sempre tem data.

      const isFresh = isValidDate && (Date.now() - new Date(unlockedAt).getTime() < 10000); // 10s fresh

      // Prevent spamming confetti for the same badge session
      const hasPlayed = sessionStorage.getItem(`confetti_${newBadge.id}`);

      if (isFresh && !hasPlayed) {
        sessionStorage.setItem(`confetti_${newBadge.id}`, 'true');
        playCelebration();
        // Confete dourado para celebrar
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#FFD700', '#FFA500', '#FFFFFF']
        });
      }

      // Auto-dismiss + Auto-claim após 10 segundos
      const timer = setTimeout(() => {
        claimReward();
      }, 10000); // 10 segundos para ler

      return () => clearTimeout(timer);
    }
  }, [newBadge, claimReward]);

  if (!newBadge) return null;

  const theme = THEME_STYLES[newBadge.theme] || THEME_STYLES.yellow;
  const rewardAmount = newBadge.reward || 50;

  return (
    <AnimatePresence>
      {newBadge && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed bottom-8 right-8 z-[100] max-w-sm w-full"
        >
          <div className={`bg-theme-bg-secondary border ${theme.border} rounded-2xl p-5 ${theme.shadow} flex items-center gap-4 relative overflow-hidden shadow-2xl`}>
            {/* Efeitos de fundo */}
            <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} to-transparent pointer-events-none opacity-50`} />

            {/* Timer Bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 10, ease: 'linear' }}
              className={`absolute bottom-0 left-0 h-1 bg-current opacity-30 ${theme.text}`}
            />

            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className={`relative w-12 h-12 shrink-0 ${theme.iconBg} rounded-xl flex items-center justify-center ring-1 ${theme.iconRing}`}
            >
              <div className={`${theme.text} [&>svg]:w-6 [&>svg]:h-6`}>
                {newBadge.icon || <Trophy className="w-6 h-6" />}
              </div>
            </motion.div>

            <div className="flex-grow min-w-0">
              <h3 className={`font-display font-bold ${theme.text} text-[10px] tracking-wider uppercase mb-0.5`}>Conquista Desbloqueada</h3>
              <h2 className="font-bold text-theme-text-primary text-sm truncate">{newBadge.title}</h2>
              <p className="text-theme-text-secondary text-xs truncate">
                +{rewardAmount} XP
              </p>
            </div>

            <button
              onClick={handleCollect}
              className="relative p-2 text-theme-text-tertiary hover:text-theme-text-primary transition-colors cursor-pointer rounded-lg hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TrophyNotification;
