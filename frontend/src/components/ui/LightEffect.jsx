import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Power, Zap, Sun, Moon } from 'lucide-react';

const LightSwitch = ({ isOn, onToggle, _variant = 'modern' }) => {
  const variants = {
    modern: {
      on: {
        backgroundColor: '#10b981',
        boxShadow: '0 0 20px #10b981, 0 0 40px #10b981, 0 0 60px #10b981',
      },
      off: {
        backgroundColor: '#374151',
        boxShadow: '0 0 0px transparent',
      }
    },
    classic: {
      on: {
        backgroundColor: '#fbbf24',
        boxShadow: '0 0 30px #fbbf24, 0 0 60px #fbbf24',
      },
      off: {
        backgroundColor: '#1f2937',
        boxShadow: '0 0 0px transparent',
      }
    },
    neon: {
      on: {
        backgroundColor: '#06b6d4',
        boxShadow: '0 0 25px #06b6d4, 0 0 50px #06b6d4, 0 0 75px #06b6d4',
      },
      off: {
        backgroundColor: '#0f172a',
        boxShadow: '0 0 0px transparent',
      }
    }
  };

  const selectedVariant = variants[_variant] || variants.modern;

  return (
    <motion.button
      onClick={onToggle}
      className="relative w-24 h-12 rounded-full p-1 cursor-pointer transition-all duration-300"
      animate={isOn ? 'on' : 'off'}
      variants={selectedVariant}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="w-10 h-10 bg-white rounded-full shadow-lg"
        animate={{
          x: isOn ? 48 : 0,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <div className="w-full h-full flex items-center justify-center">
          {isOn ? (
            <Zap className="w-5 h-5 text-gray-800" />
          ) : (
            <Power className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </motion.div>
    </motion.button>
  );
};

const LightEffect = ({ 
  isOn = true, 
  _variant = 'modern',
  showParticles = true,
  intensity = 'medium',
  color = '#10b981',
  className = ''
}) => {
  const intensities = {
    low: { opacity: 0.3, scale: 1.2 },
    medium: { opacity: 0.6, scale: 1.5 },
    high: { opacity: 0.9, scale: 2.0 }
  };

  const currentIntensity = intensities[intensity] || intensities.medium;

  const particleVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: [0, 0.8, 0],
      scale: [0, 1, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatDelay: 0.5
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Luz principal */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          opacity: isOn ? currentIntensity.opacity : 0,
          scale: isOn ? currentIntensity.scale : 1,
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{
          background: `radial-gradient(circle, ${color} 0%, ${color}80 30%, transparent 70%)`,
          filter: isOn ? `blur(20px)` : 'blur(0px)',
        }}
      />

      {/* Brilho adicional */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          opacity: isOn ? 0.8 : 0,
          scale: isOn ? 1.1 : 1,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          background: `radial-gradient(circle, ${color}40 0%, transparent 50%)`,
        }}
      />

      {/* Partículas de luz */}
      {showParticles && (
        <AnimatePresence>
          {isOn && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: color,
                    left: `${20 + (i * 10)}%`,
                    top: `${20 + (i * 8)}%`,
                    boxShadow: `0 0 10px ${color}`
                  }}
                  variants={particleVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{
                    delay: i * 0.3,
                    duration: 2 + (i * 0.2),
                    repeat: Infinity,
                    repeatDelay: 1 + (i * 0.3)
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      )}

      {/* Ícone central */}
      <motion.div
        className="relative z-10 flex items-center justify-center w-full h-full"
        animate={{
          scale: isOn ? 1.1 : 1,
          rotate: isOn ? 0 : 180,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {isOn ? (
          <Sun className="w-8 h-8 text-white drop-shadow-lg" />
        ) : (
          <Moon className="w-8 h-8 text-gray-400" />
        )}
      </motion.div>
    </div>
  );
};

const InteractiveLightDemo = () => {
  const [isLightOn, setIsLightOn] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#10b981');
  const [intensity, setIntensity] = useState('medium');
  const [showParticles, setShowParticles] = useState(true);

  const colors = [
    '#10b981', // eco-green
    '#06b6d4', // cyan
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ef4444', // red
    '#3b82f6', // blue
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-eco-green to-cyan-400 bg-clip-text text-transparent">
            Efeito Visual de Luz
          </h1>
          <p className="text-xl text-slate-300">
            Demonstração interativa de efeitos de iluminação realista
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Área de demonstração */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700"
          >
            <h2 className="text-2xl font-bold mb-6 text-center">
              Demonstração
            </h2>
            
            <div className="flex justify-center mb-8">
              <div className="relative w-32 h-32">
                <LightEffect
                  isOn={isLightOn}
                  intensity={intensity}
                  color={selectedColor}
                  showParticles={showParticles}
                  className="w-full h-full"
                />
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <LightSwitch
                isOn={isLightOn}
                onToggle={() => setIsLightOn(!isLightOn)}
              />
            </div>

            <div className="text-center">
              <p className="text-lg font-medium">
                Luz {isLightOn ? 'Acesa' : 'Apagada'}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Clique no interruptor para alternar
              </p>
            </div>
          </motion.div>

          {/* Controles */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700"
          >
            <h2 className="text-2xl font-bold mb-6">
              Controles
            </h2>

            {/* Cores */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Cor da Luz</h3>
              <div className="flex flex-wrap justify-center gap-8">
                {colors.slice(0, 6).map((lightColor) => (
                  <div key={lightColor} className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-3">
                      <LightEffect
                        isOn={true}
                        color={lightColor}
                        intensity="medium"
                        showParticles={false}
                        className="w-full h-full"
                      />
                    </div>
                    <button
                      onClick={() => setSelectedColor(lightColor)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        selectedColor === lightColor
                          ? 'bg-eco-green text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Selecionar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Intensidade */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Intensidade</h3>
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setIntensity(level)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                      intensity === level
                        ? 'bg-eco-green text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {level === 'low' && 'Baixa'}
                    {level === 'medium' && 'Média'}
                    {level === 'high' && 'Alta'}
                  </button>
                ))}
              </div>
            </div>

            {/* Partículas */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Partículas</h3>
              <button
                onClick={() => setShowParticles(!showParticles)}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  showParticles
                    ? 'bg-eco-green text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                {showParticles ? 'Partículas Ativadas' : 'Partículas Desativadas'}
              </button>
            </div>

            {/* Informações */}
            <div className="bg-slate-800/30 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Características</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Animação suave de transição</li>
                <li>• Efeito de iluminação realista</li>
                <li>• Controle interativo</li>
                <li>• Design responsivo</li>
                <li>• Performance otimizada</li>
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Demonstração em diferentes contextos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 bg-slate-800/50 p-8 rounded-2xl border border-slate-700"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">
            Diferentes Contextos
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Luz ambiente */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Ambiente</h3>
              <div className="relative w-20 h-20 mx-auto mb-4">
                <LightEffect
                  isOn={true}
                  color="#f59e0b"
                  intensity="low"
                  showParticles={false}
                  className="w-full h-full"
                />
              </div>
              <p className="text-sm text-slate-400">
                Iluminação ambiente suave
              </p>
            </div>

            {/* Luz de destaque */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Destaque</h3>
              <div className="relative w-20 h-20 mx-auto mb-4">
                <LightEffect
                  isOn={true}
                  color="#8b5cf6"
                  intensity="high"
                  showParticles={true}
                  className="w-full h-full"
                />
              </div>
              <p className="text-sm text-slate-400">
                Luz intensa com partículas
              </p>
            </div>

            {/* Luz noturna */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Noturna</h3>
              <div className="relative w-20 h-20 mx-auto mb-4">
                <LightEffect
                  isOn={true}
                  color="#06b6d4"
                  intensity="medium"
                  showParticles={true}
                  className="w-full h-full"
                />
              </div>
              <p className="text-sm text-slate-400">
                Iluminação noturna moderna
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export { LightEffect, LightSwitch, InteractiveLightDemo };