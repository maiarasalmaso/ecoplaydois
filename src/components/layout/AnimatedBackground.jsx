import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

const seeded = (n) => (Math.sin(n) + 1) / 2;

const AnimatedBackground = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const cloudClass = isLight ? 'bg-slate-200/60' : 'bg-white/20';
  const particleStyle = isLight
    ? {
      backgroundColor: 'rgba(var(--theme-accent-rgb), 0.75)', // Increased visibility for Light Mode
      boxShadow: '0 0 12px rgba(var(--theme-accent-rgb), 0.5)', // Stronger glow
    }
    : {
      backgroundColor: 'rgba(var(--theme-accent-rgb), 0.85)', // Much brighter
      boxShadow: '0 0 12px rgba(var(--theme-accent-rgb), 0.6)', // Stronger glow
    };

  const gridColor = isLight ? 'rgba(var(--theme-accent-rgb), 0.18)' : '#000';
  const gridOpacity = isLight ? 0.012 : 0.03;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
      {/* Grid Cibernética Sutil (Adaptive Mode) */}
      <div
        className="absolute inset-0"
        style={{
          opacity: gridOpacity,
          backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Partículas de Energia / Fótons (Adaptive Mode: Solar vs Galaxy) */}
      {[...Array(100)].map((_, i) => {
        // Simple seeded random color selection
        const colorSeed = seeded(i * 999);
        const sizeSeed = seeded(i);
        // Color & Size Logic
        let size = sizeSeed > 0.9 ? 3 : sizeSeed > 0.6 ? 2 : 1;
        let color = '#ffffff';
        let glowColor = '255, 255, 255';
        let opacityBase = 0.3;

        if (isLight) {
          // Solar Photons: Larger, softer, warmer
          size = sizeSeed > 0.8 ? 5 : sizeSeed > 0.5 ? 3 : 2; // Min 2px, Max 5px
          opacityBase = 0.6; // Much more visible

          if (colorSeed > 0.7) {
            color = '#f97316'; // Orange-500
            glowColor = '249, 115, 22';
          } else if (colorSeed > 0.4) {
            color = '#f59e0b'; // Amber-500
            glowColor = '245, 158, 11';
          } else {
            color = '#eab308'; // Yellow-500
            glowColor = '234, 179, 8';
          }
        } else {
          // Dark Mode Galaxy: Sharp, small, cool
          if (colorSeed > 0.85) {
            color = '#a78bfa'; // Purple
            glowColor = '167, 139, 250';
          } else if (colorSeed > 0.70) {
            color = '#22d3ee'; // Cyan
            glowColor = '34, 211, 238';
          } else if (colorSeed > 0.55) {
            color = '#4ade80'; // Green
            glowColor = '74, 222, 128';
          }
        }

        // Optimization: Only larger particles get expensive glow
        const boxShadow = size > 1
          ? `0 0 ${size * (isLight ? 4 : 2)}px rgba(${glowColor}, ${isLight ? 0.8 : 0.4})`
          : 'none';

        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              backgroundColor: color,
              boxShadow,
              left: `${seeded(i * 123) * 100}%`,
              top: `${seeded(i * 456) * 100}%`,
              width: size,
              height: size,
              opacity: seeded(i) * 0.5 + opacityBase,
              willChange: 'transform, opacity', // Hardware acceleration hint
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.9, 1.2, 0.9],
            }}
            transition={{
              duration: seeded(i) * 4 + 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: seeded(i * 789) * 5,
            }}
          />
        );
      })}
    </div>
  );
};

export default AnimatedBackground;
