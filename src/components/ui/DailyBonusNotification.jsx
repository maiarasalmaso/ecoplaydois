import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Calendar, X } from 'lucide-react';
import { useGameState } from '@/context/GameStateContext';
import confetti from 'canvas-confetti';

const DailyBonusNotification = () => {
  const { dailyBonus, setDailyBonus } = useGameState();

  useEffect(() => {
    if (dailyBonus) {
      // Som de sucesso ou confete
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.1 }, // Topo da tela
        colors: ['#facc15', '#4ade80', '#22d3ee']
      });

      // Auto-dismiss após 5 segundos
      const timer = setTimeout(() => {
        setDailyBonus(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [dailyBonus, setDailyBonus]);

  return (
    <AnimatePresence>
      {dailyBonus && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-4"
        >
          <div className="bg-theme-bg-secondary/95 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-4 shadow-2xl flex items-center gap-4 relative overflow-hidden">
            {/* Brilho de fundo */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-transparent" />

            {/* Barra de progresso do timer */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-1 bg-yellow-500/50"
            />

            <div className="relative w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0 ring-2 ring-yellow-500/30">
              <Calendar className="w-5 h-5 text-yellow-400" />
            </div>

            <div className="flex-grow relative">
              <h3 className="font-bold text-theme-text-primary text-sm flex items-center gap-2">
                Login Diário
                <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full border border-yellow-500/30 uppercase tracking-wide">
                  Dia {dailyBonus.streak}
                </span>
              </h3>
              <p className="text-theme-text-secondary text-xs">
                Você ganhou <span className="font-bold text-yellow-400">+{dailyBonus.amount} XP</span> hoje.
              </p>
            </div>

            <button
              onClick={() => setDailyBonus(null)}
              className="relative p-1.5 text-theme-text-tertiary hover:text-theme-text-primary transition-colors rounded-lg hover:bg-theme-bg-tertiary/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DailyBonusNotification;
