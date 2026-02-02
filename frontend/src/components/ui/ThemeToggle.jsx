import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';
import { playToggle } from '@/utils/soundEffects';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    playToggle();
    toggleTheme();
  };

  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={handleToggle}
      className="relative w-12 h-6 rounded-full p-1 bg-theme-bg-tertiary border border-theme-border transition-all duration-300 hover:border-theme-border-hover focus:outline-none focus:ring-2 focus:ring-eco-green/50"
      aria-label={`Alternar para tema ${isDark ? 'claro' : 'escuro'}`}
      title={`Alternar para tema ${isDark ? 'claro' : 'escuro'}`}
      whileTap={{ scale: 0.95 }}
      initial={false}
      animate={{ 
        backgroundColor: isDark ? 'var(--theme-bg-tertiary)' : 'var(--theme-bg-tertiary)',
        borderColor: isDark ? 'var(--theme-border)' : 'var(--theme-border)'
      }}
    >
      {/* Track background */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-eco-green/20 to-eco-blue/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      {/* Toggle handle */}
      <motion.div
        className="relative w-4 h-4 rounded-full bg-theme-text-primary flex items-center justify-center shadow-lg"
        initial={false}
        animate={{ 
          x: isDark ? 24 : 0,
          backgroundColor: isDark ? 'var(--theme-text-primary)' : 'var(--theme-text-primary)'
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {/* Icons */}
        <motion.div
          initial={false}
          animate={{ 
            opacity: isDark ? 0 : 1,
            scale: isDark ? 0 : 1,
            rotate: isDark ? 90 : 0
          }}
          transition={{ duration: 0.2 }}
          className="absolute"
        >
          <Sun className="w-2.5 h-2.5 text-yellow-400" />
        </motion.div>
        
        <motion.div
          initial={false}
          animate={{ 
            opacity: isDark ? 1 : 0,
            scale: isDark ? 1 : 0,
            rotate: isDark ? 0 : -90
          }}
          transition={{ duration: 0.2 }}
          className="absolute"
        >
          <Moon className="w-2.5 h-2.5 text-blue-400" />
        </motion.div>
      </motion.div>
      
      {/* Background indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-1.5">
        <motion.div
          initial={false}
          animate={{ opacity: isDark ? 0.3 : 0.7 }}
          transition={{ duration: 0.2 }}
        >
          <Sun className="w-3 h-3 text-yellow-500" />
        </motion.div>
        
        <motion.div
          initial={false}
          animate={{ opacity: isDark ? 0.7 : 0.3 }}
          transition={{ duration: 0.2 }}
        >
          <Moon className="w-3 h-3 text-blue-500" />
        </motion.div>
      </div>
    </motion.button>
  );
};

export default ThemeToggle;