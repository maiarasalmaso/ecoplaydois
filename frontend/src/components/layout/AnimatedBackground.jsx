import { motion } from 'framer-motion';

const seeded = (n) => (Math.sin(n) + 1) / 2;

const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Sol Sci-Fi Girando */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
        style={{
          background: 'conic-gradient(from 0deg, #fcd34d, #f97316, #fcd34d)',
        }}
      />

      {/* Nuvens Tecnológicas / Partículas Flutuantes */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`cloud-${i}`}
          initial={{ x: -100, opacity: 0 }}
          animate={{ 
            x: ['120vw'],
            opacity: [0, 0.4, 0]
          }}
          transition={{ 
            duration: 25 + i * 5, 
            repeat: Infinity, 
            ease: "linear",
            delay: i * 3
          }}
          className="absolute rounded-full bg-white blur-xl"
          style={{
            top: `${20 + (i * 15)}%`,
            height: `${50 + (i * 20)}px`,
            width: `${150 + (i * 40)}px`,
            opacity: 0.3
          }}
        />
      ))}

      {/* Partículas de Energia (Folhas/Luz) */}
      {[...Array(15)].map((_, i) => {
        const r1 = seeded(i * 42.42);
        const r2 = seeded(i * 133.7);
        const r3 = seeded(i * 7.7);
        const r4 = seeded(i * 19.19);
        return (
        <motion.div
          key={`particle-${i}`}
          animate={{ 
            y: [0, -100],
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5]
          }}
          transition={{ 
            duration: 4 + (r3 * 4), 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: r4 * 5
          }}
          className="absolute w-2 h-2 rounded-full bg-eco-green-light shadow-[0_0_10px_rgba(74,222,128,0.8)]"
          style={{
            left: `${r1 * 100}%`,
            top: `${r2 * 100}%`,
          }}
        />
        );
      })}

      {/* Grid Cibernética Sutil no Fundo */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
