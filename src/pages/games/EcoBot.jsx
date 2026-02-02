import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sun, Wind, Droplets, Zap, Battery,
  RotateCcw, ArrowLeft, Info, Activity,
  Thermometer, RotateCcw as RotateIcon,
  Zap as Lightning, Droplets as WaterDrop
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playClick, playSuccess, playError } from '../../utils/soundEffects';

// --- CONFIGURAÇÃO ---
const TICK_RATE = 2000; // Loop a cada 2 segundos
const MAX_ENERGY = 100;
const ENERGY_DRAIN = 1.5; // Por tick

const ENERGY_TYPES = {
  solar: {
    name: 'Solar',
    icon: Sun,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    ring: 'ring-yellow-400',
    glow: 'rgba(250, 204, 21, 0.35)',
    rechargeTime: 4000, // 4s
    rechargeAmount: 30,
    effect: '☀️',
    description: 'Energia do Sol. Rápida, mas depende do clima.'
  },
  wind: {
    name: 'Eólica',
    icon: Wind,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    ring: 'ring-cyan-400',
    glow: 'rgba(34, 211, 238, 0.35)',
    rechargeTime: 3000, // 3s
    rechargeAmount: 20,
    effect: '💨',
    description: 'Força do vento. Constante, mas varia com o clima.'
  },
  hydro: {
    name: 'Hidro',
    icon: Droplets,
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    ring: 'ring-blue-400',
    glow: 'rgba(59, 130, 246, 0.35)',
    rechargeTime: 5000, // 5s
    rechargeAmount: 40,
    effect: '🌊',
    description: 'Energia da água. Poderosa, mas lenta para carregar.'
  },
  geothermal: {
    name: 'Geotérmica',
    icon: Thermometer,
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
    ring: 'ring-orange-400',
    glow: 'rgba(251, 146, 60, 0.35)',
    rechargeTime: 6000, // 6s
    rechargeAmount: 50,
    effect: '🌋',
    description: 'Calor da Terra. Muito poderosa, mas demora.'
  }
};

const EcoBot = () => {
  const [bot, setBot] = useState(() => {
    try {
      const saved = localStorage.getItem('ecobot_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Valida estrutura dos dados salvos
        if (parsed && typeof parsed.energy === 'number' && parsed.impact && typeof parsed.lastUpdate === 'number') {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estado do EcoBot:', error);
      localStorage.removeItem('ecobot_state');
    }

    return {
      name: 'EcoBot',
      energy: 100,
      activeSource: null,
      impact: { solar: 0, wind: 0, hydro: 0, geothermal: 0 },
      lastUpdate: Date.now()
    };
  });

  const [isRecharging, setIsRecharging] = useState(false);
  const [rechargeProgress, setRechargeProgress] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);

  // Persistência
  useEffect(() => {
    localStorage.setItem('ecobot_state', JSON.stringify(bot));
  }, [bot]);

  // Loop de energia
  useEffect(() => {
    const interval = setInterval(() => {
      if (isRecharging) return;

      setBot(prev => {
        const newEnergy = Math.max(0, prev.energy - ENERGY_DRAIN);

        // Impacto ambiental baseado na fonte ativa
        const impactChange = newEnergy < 30 ? -0.5 : 0.1;
        const newImpact = { ...prev.impact };
        if (prev.activeSource) {
          newImpact[prev.activeSource] = Math.max(0, (newImpact[prev.activeSource] || 0) + impactChange);
        }

        // Aplica impacto negativo adicional quando energia está baixa
        if (newEnergy < 30 && prev.activeSource) {
          newImpact[prev.activeSource] = Math.max(0, newImpact[prev.activeSource] - 0.2);
        }

        return {
          ...prev,
          energy: newEnergy,
          impact: newImpact
        };
      });
    }, TICK_RATE);

    return () => clearInterval(interval);
  }, [isRecharging]);

  // Ref para animação de progresso
  const rechargeStartTimeRef = useRef(null);

  // Ações
  const startRecharge = (source) => {
    if (isRecharging || bot.energy >= MAX_ENERGY) {
      if (bot.energy >= MAX_ENERGY) {
        playError();
      }
      return;
    }

    const sourceConfig = ENERGY_TYPES[source];
    setSelectedSource(source);
    setIsRecharging(true);
    playClick();

    // Inicia animação de progresso - usa setTimeout para evitar chamada impura no render
    setTimeout(() => {
      rechargeStartTimeRef.current = Date.now();
    }, 0);

    const updateProgress = () => {
      const elapsed = Date.now() - rechargeStartTimeRef.current;
      const progress = Math.min(100, (elapsed / sourceConfig.rechargeTime) * 100);
      setRechargeProgress(progress);

      if (progress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        // Recarga completa
        setBot(prev => ({
          ...prev,
          energy: Math.min(MAX_ENERGY, prev.energy + sourceConfig.rechargeAmount),
          activeSource: source,
          impact: {
            ...prev.impact,
            [source]: prev.impact[source] + 1
          }
        }));
        playSuccess();

        // Efeito visual de conclusão
        confetti({
          particleCount: 50,
          spread: 60,
          colors: [sourceConfig.color.replace('text-', ''), '#ffffff'],
          origin: { y: 0.7 }
        });

        setTimeout(() => {
          setIsRecharging(false);
          setRechargeProgress(0);
          setSelectedSource(null);
        }, 500);
      }
    };

    requestAnimationFrame(updateProgress);
  };

  // Renderização
  const getBotEmoji = () => {
    if (bot.energy > 70) return '🤖✨';
    if (bot.energy > 40) return '🤖';
    if (bot.energy > 20) return '🤖😴';
    return '🤖💀';
  };

  const getBackgroundStyle = () => {
    const bgPrimary = 'var(--theme-bg-primary)';
    const bgSecondary = 'var(--theme-bg-secondary)';
    if (isRecharging && selectedSource) {
      const source = ENERGY_TYPES[selectedSource];
      return {
        background: `radial-gradient(ellipse at center, ${source.glow} 0%, ${bgPrimary} 70%)`,
        transition: 'background 0.5s ease'
      };
    }
    return { background: `linear-gradient(to bottom, ${bgPrimary}, ${bgSecondary})` };
  };

  return (
    <div
      className="min-h-screen text-white font-sans flex flex-col items-center relative overflow-hidden"
      style={getBackgroundStyle()}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {isRecharging && selectedSource && (
          <motion.div
            key={selectedSource}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2, opacity: 0.4 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className={`w-96 h-96 rounded-full ${ENERGY_TYPES[selectedSource].bg} blur-3xl`} />
          </motion.div>
        )}
      </div>

      {/* Header */}
      <header className="w-full max-w-md p-4 z-10 flex justify-between items-center">
        <Link to="/games" className="p-2 bg-slate-800/50 rounded-xl hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="text-center">
          <h1 className="font-display font-bold text-xl">{bot.name}</h1>
          <span className="text-xs text-slate-400">Fonte Ativa: {bot.activeSource ? ENERGY_TYPES[bot.activeSource].name : 'Nenhuma'}</span>
        </div>
        <button onClick={() => setShowInfo(!showInfo)} className="p-2 bg-slate-800/50 rounded-xl hover:bg-slate-700">
          <Info className="w-6 h-6" />
        </button>
      </header>

      {/* Main Display */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative z-10">

        {/* The Bot */}
        <motion.div
          animate={{
            y: bot.energy < 20 ? [0, -5, 0] : 0,
            scale: isRecharging ? 1.05 : 1,
            rotate: isRecharging ? [0, 2, -2, 0] : 0
          }}
          transition={{
            y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
            rotate: { repeat: Infinity, duration: 2, ease: "easeInOut" }
          }}
          className="relative mb-8"
        >
          {/* Aura Effect */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className={`absolute -inset-8 rounded-full ${bot.activeSource ? ENERGY_TYPES[bot.activeSource].bg : 'bg-slate-700'} blur-2xl`}
          />

          <div className="relative text-9xl select-none">
            {getBotEmoji()}
            {/* Charging Effect */}
            {isRecharging && selectedSource && (
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="text-6xl">{ENERGY_TYPES[selectedSource].effect}</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Energy Bar */}
        <div className="w-full max-w-sm mb-6">
          <div className="flex justify-between text-sm font-bold uppercase mb-2">
            <span className="text-slate-400">Energia</span>
            <span className={bot.energy > 70 ? 'text-green-400' : bot.energy > 40 ? 'text-yellow-400' : 'text-red-400'}>
              {Math.round(bot.energy)}%
            </span>
          </div>
          <div className="h-6 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
            <motion.div
              animate={{ width: `${bot.energy}%` }}
              className={`h-full ${bot.energy > 70 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                  bot.energy > 40 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                    'bg-gradient-to-r from-red-500 to-orange-500'
                }`}
            />
            {isRecharging && (
              <motion.div
                animate={{ width: `${rechargeProgress}%` }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 opacity-70"
              />
            )}
          </div>
          {isRecharging && (
            <div className="text-center mt-2 text-xs text-slate-400">
              Recarregando... {Math.round(rechargeProgress)}%
            </div>
          )}
        </div>

        {/* Impact Meter */}
        <div className="w-full max-w-sm mb-8">
          <h3 className="text-sm font-bold uppercase text-slate-400 mb-3">Impacto Energético</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(ENERGY_TYPES).map(([key, source]) => (
              <div key={key} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <source.icon className={`w-5 h-5 ${source.color}`} />
                  <span className="text-xs font-bold">{source.name}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${Math.min(100, bot.impact[key] * 10)}%` }}
                    className={`h-full ${source.bg.replace('/20', '')}`}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">{bot.impact[key]} usos</div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Control Panel */}
      <footer className="w-full max-w-md p-6 z-20">
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-3xl p-4 grid grid-cols-2 gap-3 shadow-xl">
          {Object.entries(ENERGY_TYPES).map(([key, source]) => (
            <button
              key={key}
              onClick={() => startRecharge(key)}
              disabled={isRecharging || bot.energy >= MAX_ENERGY}
              className={`
                p-4 rounded-2xl border transition-all flex flex-col items-center gap-2
                ${isRecharging || bot.energy >= MAX_ENERGY
                  ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-50'
                  : `bg-slate-900 hover:bg-slate-800 border-slate-600 hover:border-slate-500 ${source.color}`}
              `}
            >
              <source.icon className="w-8 h-8" />
              <span className="text-sm font-bold">{source.name}</span>
              <div className="text-xs text-slate-400">
                +{source.rechargeAmount}% em {source.rechargeTime / 1000}s
              </div>
            </button>
          ))}
        </div>
      </footer>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowInfo(false)}
          >
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-3xl max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-400" />
                Guia do EcoBot
              </h2>
              <ul className="space-y-3 text-slate-300 text-sm">
                {Object.entries(ENERGY_TYPES).map(([key, source]) => (
                  <li key={key} className="flex items-start gap-3">
                    <source.icon className={`w-5 h-5 mt-0.5 shrink-0 ${source.color}`} />
                    <div>
                      <strong className={source.color}>{source.name}:</strong>
                      <span className="text-slate-400"> {source.description}</span>
                    </div>
                  </li>
                ))}
                <li className="pt-2 border-t border-slate-700 text-green-400">
                  <strong>Dica:</strong> Alterne entre fontes para maximizar o impacto positivo!
                </li>
              </ul>
              <button
                onClick={() => setShowInfo(false)}
                className="mt-6 w-full py-3 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-500"
              >
                Entendi!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default EcoBot;
