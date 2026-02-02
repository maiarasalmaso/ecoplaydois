import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { playLightSwitch } from '@/utils/soundEffects';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const handleToggle = () => {
    playLightSwitch(!isDark);
    toggleTheme();
  };

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      className={`relative w-14 h-7 rounded-full p-1 bg-theme-bg-tertiary/80 border border-theme-border transition-all duration-300 hover:border-emerald-400/50 hover:shadow-[0_0_10px_rgba(52,211,153,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${className}`}
      aria-label={`Alternar para tema ${isDark ? 'claro' : 'escuro'}`}
      title={`Alternar para tema ${isDark ? 'claro' : 'escuro'}`}
      whileTap={{ scale: 0.95 }}
      initial={false}
    >
      <motion.div
        className="relative w-5 h-5 rounded-full bg-theme-bg-primary flex items-center justify-center shadow-md z-10"
        initial={false}
        animate={{ x: isDark ? 28 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <motion.div
          initial={false}
          animate={{
            opacity: isDark ? 0 : 1,
            scale: isDark ? 0 : 1,
            rotate: isDark ? 180 : 0,
          }}
          transition={{ duration: 0.2 }}
          className="absolute"
        >
          <Sun className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
        </motion.div>

        <motion.div
          initial={false}
          animate={{
            opacity: isDark ? 1 : 0,
            scale: isDark ? 1 : 0,
            rotate: isDark ? 0 : -180,
          }}
          transition={{ duration: 0.2 }}
          className="absolute"
        >
          <Moon className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
        </motion.div>
      </motion.div>

      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <motion.div
          initial={false}
          animate={{ opacity: isDark ? 0.3 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <Sun className="w-3.5 h-3.5 text-yellow-600/30" />
        </motion.div>
        <motion.div
          initial={false}
          animate={{ opacity: isDark ? 1 : 0.3 }}
          transition={{ duration: 0.2 }}
        >
          <Moon className="w-3.5 h-3.5 text-emerald-600/30" />
        </motion.div>
      </div>
    </motion.button>
  );
};

export default ThemeToggle;
