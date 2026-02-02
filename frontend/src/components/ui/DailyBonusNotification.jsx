import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Calendar, X } from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
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

      // Auto dismiss após 5 segundos
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
          className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
          <div className="bg-slate-800/90 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-4 shadow-2xl flex items-center gap-4 relative overflow-hidden">
            {/* Brilho de fundo */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-transparent" />
            
            <div className="relative w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0 ring-2 ring-yellow-500/30">
              <Calendar className="w-6 h-6 text-yellow-400" />
            </div>

            <div className="flex-grow relative">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                Login Diário!
                <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full border border-yellow-500/30">
                  Dia {dailyBonus.streak}
                </span>
              </h3>
              <p className="text-slate-300 text-sm">
                Você ganhou <span className="font-bold text-yellow-400">+{dailyBonus.amount} XP</span> hoje.
              </p>
            </div>

            <button 
              onClick={() => setDailyBonus(null)}
              className="relative p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DailyBonusNotification;
