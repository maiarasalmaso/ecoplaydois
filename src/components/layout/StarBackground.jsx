import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

const StarBackground = () => {
  const [stars, setStars] = useState([]);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    // Aumentei um pouco a quantidade para cobrir melhor telas grandes, mas mantendo performance
    const count = isLight ? 90 : 110; 
    const colors = isLight
      ? ['#60a5fa', '#93c5fd', '#bfdbfe']
      : ['#FFFFFF', '#BAE6FD', '#FEF08A']; // Branco, Azul Claro (sky-200), Dourado (yellow-200)

    const generatedStars = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${1 + Math.random() * 2}px`, // 1px a 3px
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: `${3 + Math.random() * 4}s`, // 3s a 7s para ser bem suave
      delay: `${Math.random() * 5}s`,
      opacity: isLight ? 0.45 : 0.6,
    }));
    setStars(generatedStars);
  }, [isLight]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden block">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full animate-twinkle"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            backgroundColor: star.color,
            '--twinkle-duration': star.duration,
            '--twinkle-delay': star.delay,
            opacity: star.opacity,
            boxShadow: `0 0 ${parseFloat(star.size) * 2}px ${star.color}`
          }}
        />
      ))}
    </div>
  );
};

export default StarBackground;
