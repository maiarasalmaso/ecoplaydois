import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameState } from '../../context/GameStateContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Wind, Droplets, Zap, Battery, AlertTriangle,
  Play, RotateCcw, CheckCircle, XCircle, Backpack,
  ArrowUp, ArrowDown, Map as MapIcon, Info, HelpCircle,
  Cpu, Filter, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { playBuild, playCollect, playWarning, playSuccess, playError } from '../../utils/soundEffects';
import api from '../../services/api';

// --- CONSTANTS & CONFIG ---
const TICK_RATE = 1000; // 1 second per tick
const DAY_DURATION = 60; // 60 ticks per day (1 minute)
const MAX_ENERGY = 1000;
const MAX_POLLUTION = 100;
const WIN_SUSTAINABILITY_TIME = 30; // Seconds to hold 100% sustainability

const BUILDINGS = {
  solar: {
    id: 'solar',
    name: 'Painel Solar',
    cost: 50,
    production: 10,
    type: 'generation',
    icon: Sun,
    description: 'Gera energia durante o dia.',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/20'
  },
  wind: {
    id: 'wind',
    name: 'Turbina Eólica',
    cost: 120,
    production: 8,
    type: 'generation',
    icon: Wind,
    description: 'Gera energia dia e noite, mas varia com o vento.',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/20'
  },
  battery: {
    id: 'battery',
    name: 'Bateria',
    cost: 80,
    capacity: 200,
    type: 'storage',
    icon: Battery,
    description: 'Armazena excesso de energia para a noite.',
    color: 'text-green-400',
    bgColor: 'bg-green-400/20'
  },
  biomass: {
    id: 'biomass',
    name: 'Usina Biomassa',
    cost: 200,
    production: 15,
    type: 'generation',
    icon: Droplets,
    description: 'Queima resíduos. Constante, mas gera um pouco de poluição se não filtrada.',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/20'
  }
};

const UPGRADES = {
  smartGrid: {
    id: 'smartGrid',
    name: 'Smart Grid',
    cost: 300,
    icon: Cpu,
    description: 'Gerencia automaticamente a mochila de energia.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/20'
  },
  biomassFilter: {
    id: 'biomassFilter',
    name: 'Eco-Filtro',
    cost: 150,
    icon: Filter,
    description: 'Reduz a poluição da biomassa em 80%.',
    color: 'text-teal-400',
    bgColor: 'bg-teal-400/20'
  }
};

const ACTS = [
  { id: 1, title: 'Ato 1: O Despertar da Vila', target: 500, description: 'Instale painéis solares e sobreviva à primeira noite.' },
  { id: 2, title: 'Ato 2: O Vale das Águas', target: 1500, description: 'Use a água e biomassa para expandir. Cuidado com a chuva!' },
  { id: 3, title: 'Ato 3: A Metrópole do Futuro', target: 3000, description: 'Demanda alta! Use a mochila e baterias para estabilizar a rede.' }
];

// --- COMPONENTS ---

const AgeGate = ({ onConfirm }) => {
  /* ... componente removido temporariamente ... */
  return null;
};

const TutorialModal = ({ act, onStart }) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-slate-800 border border-green-500/30 p-8 rounded-3xl max-w-lg w-full relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-blue-500" />
      <h2 className="text-3xl font-display font-bold text-white mb-2">{act.title}</h2>
      <p className="text-slate-300 text-lg mb-6 leading-relaxed">{act.description}</p>

      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Objetivo para Vencer</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-400 font-bold text-lg">
            <CheckCircle className="w-5 h-5" />
            <span>Reduzir Poluição para 0%</span>
          </div>
          <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
            <Zap className="w-4 h-4" />
            <span>Manter Energia acima de {Math.floor(act.target * 0.8)} MW</span>
          </div>
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full bg-gradient-to-r from-green-400 to-green-500 hover:from-green-300 hover:to-green-400 text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 transform transition-all hover:scale-[1.02]"
      >
        Começar
      </button>
    </motion.div>
  </div>
);

const SideTutorial = ({ onClose }) => (
  <motion.div
    initial={{ x: 300, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: 300, opacity: 0 }}
    className="absolute top-16 right-4 z-40 w-64 sm:w-72 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xl"
  >
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-bold text-white flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-green-400" />
        Como Jogar
      </h3>
      <button onClick={onClose} className="text-slate-400 hover:text-white">
        <XCircle className="w-5 h-5" />
      </button>
    </div>
    <ul className="space-y-3 text-sm text-slate-300">
      <li className="flex gap-2">
        <span className="text-yellow-400 font-bold">1.</span>
        <span>Construa <strong>Painéis Solares</strong> para gerar energia de dia.</span>
      </li>
      <li className="flex gap-2">
        <span className="text-cyan-400 font-bold">2.</span>
        <span>Use <strong>Baterias</strong> para guardar energia para a noite.</span>
      </li>
      <li className="flex gap-2">
        <span className="text-green-400 font-bold">3.</span>
        <span>Mantenha a barra verde cheia para evitar <strong>Apagões</strong>!</span>
      </li>
      <li className="flex gap-2">
        <span>Use a <strong>Mochila</strong> para salvar energia extra ou socorrer a rede.</span>
      </li>
      <li className="flex gap-2">
        <span className="text-red-500 font-bold">5.</span>
        <span>Cuidado: Se a <strong>Poluição</strong> chegar a 100%, você perde o jogo!</span>
      </li>
      <li className="flex gap-2 mt-2 pt-2 border-t border-slate-700">
        <span className="text-yellow-400 font-bold">Dica:</span>
        <span>Energia positiva evita que geradores sujos liguem. <strong>Energia = Ar Limpo!</strong></span>
      </li>
    </ul>
  </motion.div>
);

// --- MAIN GAME COMPONENT ---

const EcoGuardian = () => {
  const { completeLevel } = useGameState();
  // Game State
  const [age, setAge] = useState(null);
  const [gameState, setGameState] = useState('tutorial'); // tutorial, playing, victory, gameover
  const [act, setAct] = useState(1);
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const [upgrades, setUpgrades] = useState({ smartGrid: false, biomassFilter: false });

  // Resources
  const [energy, setEnergy] = useState(100);
  const [demand, setDemand] = useState(20);
  const [pollution, setPollution] = useState(0);
  const [money, setMoney] = useState(450); // Increased starting money
  const [backpack, setBackpack] = useState(0); // Backpack energy storage
  const [showSideTutorial, setShowSideTutorial] = useState(true); // Tutorial visibility
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // World State
  const [grid, setGrid] = useState(Array(12).fill(null)); // 12 slots for buildings
  const [dayTime, setDayTime] = useState(0); // 0-100 (0=dawn, 50=noon, 100=night)
  const [weather, setWeather] = useState('sunny'); // sunny, rainy, windy

  // Refs for intervals
  const gameLoopRef = useRef(null);

  // --- LOGIC ---

  const isDay = dayTime > 20 && dayTime < 80;

  // Calculate Generation
  const calculateGeneration = useCallback(() => {
    let totalGen = 0;
    grid.forEach(slot => {
      if (!slot) return;
      const b = BUILDINGS[slot.type];
      if (b.type === 'generation') {
        let efficiency = 1.0;

        if (slot.type === 'solar') {
          efficiency = isDay ? (weather === 'rainy' ? 0.4 : 1.0) : 0;
        } else if (slot.type === 'wind') {
          efficiency = weather === 'windy' ? 1.5 : (Math.random() * 0.5 + 0.5);
        }

        totalGen += b.production * efficiency;
      }
    });
    return totalGen;
  }, [grid, isDay, weather]);

  const countBiomass = useCallback(() => {
    return grid.filter(s => s && s.type === 'biomass').length;
  }, [grid]);

  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing' || paused) return;

    gameLoopRef.current = setInterval(() => {
      setTick(t => t + 1);
      setDayTime(prev => (prev + 1) % 100);

      // Weather Change Randomly
      if (Math.random() < 0.05) {
        const weathers = ['sunny', 'rainy', 'windy'];
        setWeather(weathers[Math.floor(Math.random() * weathers.length)]);
      }

      // Demand Fluctuation based on Act
      const baseDemand = act * 15;
      const timeFactor = (dayTime > 70 || dayTime < 30) ? 1.5 : 1.0; // Higher demand at night
      const currentDemand = baseDemand * timeFactor + (Math.random() * 5);
      setDemand(currentDemand);

      // Generation & Consumption
      const gen = calculateGeneration();

      // Net Energy
      const net = gen - currentDemand;

      // Smart Grid Logic (Auto Backpack)
      let smartGridAdjustment = 0;
      if (upgrades.smartGrid) {
        // Se sobrar energia muito além da demanda (e rede cheia), guarda
        const projectedEnergy = energy + net;

        if (projectedEnergy > MAX_ENERGY && backpack < 100) {
          // Guarda excedente
          const toStore = Math.min(projectedEnergy - MAX_ENERGY, 5, 100 - backpack);
          setBackpack(b => b + toStore);
          smartGridAdjustment = -toStore;
        } else if (projectedEnergy < 0 && backpack > 0) {
          // Usa mochila para evitar apagão
          const toUse = Math.min(Math.abs(projectedEnergy), 5, backpack);
          setBackpack(b => b - toUse);
          smartGridAdjustment = toUse;
        }
      }

      setEnergy(prev => {
        const next = prev + net + smartGridAdjustment;

        if (next <= 0) {
          setPollution(p => Math.min(p + 2, MAX_POLLUTION)); // Blackout Penalty
          return 0;
        }
        if (next > MAX_ENERGY) {
          return MAX_ENERGY;
        }

        // Natural recovery (improved if no pollution)
        setPollution(p => Math.max(p - 0.1, 0));
        return next;
      });

      // Biomass Pollution Logic
      const biomassCount = countBiomass();
      if (biomassCount > 0) {
        const pollutionPerPlant = upgrades.biomassFilter ? 0.02 : 0.1; // Reduced if filtered
        setPollution(p => Math.min(p + (biomassCount * pollutionPerPlant), MAX_POLLUTION));
      }

      // Money generation (Sustainability grants grants)
      const income = pollution < 30 ? 5 : 1; // 30% tolerance, base income 1
      setMoney(m => m + income);

      // Win Condition Check
      if (energy > ACTS[act - 1].target * 0.8 && pollution < 1) {
        // Simple progress check
        if (energy >= MAX_ENERGY * 0.9) {
          setGameState('victory');
          playSuccess();
          completeLevel('eco-guardian', 1);

          // Save score
          api.post('/games/score', {
            gameId: 'guardian',
            score: Math.floor(energy + money - pollution * 10)
          }).catch(err => console.error('Failed to save score:', err));
        }
      }

      // Lose Condition
      if (pollution >= MAX_POLLUTION) {
        setGameState('gameover');
      }

    }, TICK_RATE / (act === 3 ? 2 : 1)); // Faster in later acts

    return () => clearInterval(gameLoopRef.current);
  }, [gameState, paused, act, dayTime, calculateGeneration, pollution, energy, upgrades, backpack, countBiomass]);

  // Victory Effect
  useEffect(() => {
    if (gameState === 'victory') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [gameState]);

  // --- ACTIONS ---

  const handleBuild = (type) => {
    const building = BUILDINGS[type];
    if (money >= building.cost) {
      const emptySlot = grid.findIndex(s => s === null);
      if (emptySlot !== -1) {
        playBuild();
        setMoney(m => m - building.cost);
        const newGrid = [...grid];
        newGrid[emptySlot] = { type, id: Date.now() };
        setGrid(newGrid);

        // Dica contextual após primeira construção
        if (type === 'solar' && !localStorage.getItem('eco_hint_solar')) {
          showToast('Painéis solares precisam de SOL! À noite eles param.', 'info');
          localStorage.setItem('eco_hint_solar', 'true');
        }
      } else {
        playError();
        showToast('Sem espaço! Remova uma construção antiga.', 'error');
      }
    } else {
      playError();
    }
  };

  const handleBuyUpgrade = (key) => {
    const upgrade = UPGRADES[key];
    if (upgrades[key]) return; // Já possui

    if (money >= upgrade.cost) {
      playBuild();
      setMoney(m => m - upgrade.cost);
      setUpgrades(u => ({ ...u, [key]: true }));
      showToast(`${upgrade.name} adquirido!`, 'success');
    } else {
      playError();
      showToast(`Você precisa de R$ ${upgrade.cost}!`, 'error');
    }
  };

  const handleBackpackClick = () => {
    // Collect from grid if surplus, or discharge to grid if deficit
    const net = calculateGeneration() - demand;

    if (net > 0 && backpack < 100) {
      // Collect surplus
      playCollect();
      setBackpack(b => Math.min(b + 20, 100));
      setEnergy(e => Math.max(e - 20, 0)); // Take from grid
    } else if (net < 0 && backpack > 0) {
      // Discharge to grid
      playCollect();
      setBackpack(b => Math.max(b - 20, 0));
      setEnergy(e => Math.min(e + 20, MAX_ENERGY));
    } else {
      playError();
    }
  };

  const handleRemove = (index) => {
    const newGrid = [...grid];
    const slot = newGrid[index];

    if (slot) {
      const building = BUILDINGS[slot.type];
      if (building) {
        playBuild();
        setMoney(m => m + building.cost * 0.5);
      }

      // Remove anyway to ensure no stuck items
      newGrid[index] = null;
      setGrid(newGrid);
    }
  };

  // --- RENDER HELPERS ---

  const getSkyColor = () => {
    if (dayTime < 20) return 'from-indigo-900 to-slate-900'; // Night
    if (dayTime < 30) return 'from-orange-400 to-indigo-800'; // Dawn
    if (dayTime < 70) return 'from-sky-400 to-blue-500'; // Day
    if (dayTime < 80) return 'from-orange-500 to-purple-900'; // Dusk
    return 'from-indigo-900 to-slate-900'; // Night
  };

  // --- RENDER ---

  /*
  if (gameState === 'gate') {
    return <AgeGate onConfirm={(a) => { setAge(a); setGameState('tutorial'); }} />;
  }
  */

  return (
    <div className={`min-h-screen bg-gradient-to-b ${getSkyColor()} transition-colors duration-1000 relative overflow-hidden font-sans text-white`}>
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {weather === 'rainy' && <div className="absolute inset-0 bg-slate-900/40 z-10 animate-pulse" />}
        {/* Sun/Moon */}
        <motion.div
          animate={{
            rotate: dayTime * 3.6,
            x: (dayTime / 100) * window.innerWidth - window.innerWidth / 2,
            y: Math.sin((dayTime / 100) * Math.PI) * -200 + 300
          }}
          className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-yellow-400 blur-xl opacity-80"
        />
      </div>

      {/* Tutorial / Act Intro */}
      {gameState === 'tutorial' && (
        <TutorialModal act={ACTS[act - 1]} onStart={() => setGameState('playing')} />
      )}

      {/* Victory Modal */}
      {gameState === 'victory' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="text-center relative">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 text-6xl animate-bounce">🏆</div>
            <h1 className="text-5xl font-bold text-yellow-400 mb-4 font-display">Vitória</h1>
            <p className="text-slate-300 mb-8 max-w-md mx-auto">
              Você equilibrou a rede e eliminou a poluição! A cidade do futuro agradece.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-slate-700 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-600 transition-colors"
              >
                Jogar Novamente
              </button>
              {act < 3 && (
                <button
                  onClick={() => {
                    setAct(a => a + 1);
                    setGameState('playing');
                    setEnergy(100); // Reset basics
                    setPollution(0);
                  }}
                  className="bg-green-500 text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-green-400 transition-colors shadow-lg shadow-green-500/20"
                >
                  Próximo Ato
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-red-500 mb-4">Apagão Total!</h1>
            <p className="text-slate-300 mb-8">A poluição tomou conta. Tente equilibrar melhor sua rede.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-slate-200"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border ${toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' : 'bg-blue-500/90 border-blue-400 text-white'
              }`}
          >
            {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            <span className="font-bold text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      <div className="relative z-20 p-2 sm:p-4 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 bg-slate-900/80 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-3">
              <Link to="/games" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              </Link>
              <div>
                <h1 className="font-display font-bold text-lg sm:text-xl">EcoGuardian</h1>
                <div className="text-[10px] sm:text-xs text-slate-400 font-mono">Ato {act}: {ACTS[act - 1].title.split(':')[0]}</div>
              </div>
            </div>
            {/* Mobile Money/Pollution moved here for better space usage */}
            <div className="flex md:hidden items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                <span className="text-yellow-400 font-bold text-xs">R$ {Math.round(money)}</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                <AlertTriangle className={`w-3 h-3 ${pollution > 50 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                <span className={`text-xs ${pollution > 50 ? 'text-red-400' : 'text-slate-400'}`}>{pollution.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Balance Meter */}
          <div className="w-full md:flex-1 max-w-md mx-2 sm:mx-4">
            <div className="flex justify-between text-[10px] sm:text-xs font-bold uppercase mb-1">
              <span className="text-red-400 flex items-center gap-1">
                <ArrowDown className="w-3 h-3" /> <span className="hidden sm:inline">Demanda:</span> {Math.round(demand)}
              </span>
              <span className="text-green-400 flex items-center gap-1">
                <span className="hidden sm:inline">Geração:</span> {Math.round(calculateGeneration())} <ArrowUp className="w-3 h-3" />
              </span>
            </div>
            <div className="h-4 sm:h-6 bg-slate-800 rounded-full overflow-hidden relative border border-slate-600 shadow-inner">
              {/* Center Marker */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/50 z-10" />
              {/* Bar */}
              <motion.div
                animate={{
                  width: `${Math.min((calculateGeneration() / (demand * 2 || 1)) * 50, 100)}%`,
                  backgroundColor: calculateGeneration() >= demand ? '#4ade80' : '#ef4444'
                }}
                className={`h-full transition-all duration-500 relative ${calculateGeneration() < demand ? 'animate-pulse' : ''}`}
              >
                {calculateGeneration() >= demand && (
                  <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                )}
              </motion.div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-yellow-400 font-bold">R$ {Math.round(money)}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <AlertTriangle className={`w-4 h-4 ${pollution > 50 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
              <span className={`${pollution > 50 ? 'text-red-400' : 'text-slate-400'}`}>{pollution.toFixed(1)}% Poluição</span>
            </div>
          </div>
        </header>
      </div>

      {/* Side Tutorial */}
      <AnimatePresence>
        {showSideTutorial && <SideTutorial onClose={() => setShowSideTutorial(false)} />}
      </AnimatePresence>

      {/* Main Game Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 flex flex-col lg:grid lg:grid-cols-4 gap-4 sm:gap-6 h-auto lg:h-[calc(100vh-140px)]">

        {/* Left: Stats & Info (Controls) */}
        <div className="order-2 lg:order-1 lg:col-span-1 space-y-4">
          <div className="bg-slate-900/80 backdrop-blur p-4 sm:p-5 rounded-2xl border border-slate-700">
            <h3 className="font-bold text-slate-200 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <MapIcon className="w-4 h-4" /> Status da Rede
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-slate-400">Armazenado</span>
                <span className="text-green-400 font-mono">{Math.round(energy)} / {MAX_ENERGY} MW</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: `${(energy / MAX_ENERGY) * 100}%` }} />
              </div>

              <div className="flex justify-between text-xs sm:text-sm pt-2 border-t border-slate-800">
                <span className="text-slate-400">Clima</span>
                <span className="text-blue-300 font-mono uppercase">{weather === 'sunny' ? 'Ensolarado' : weather === 'rainy' ? 'Chuvoso' : 'Ventando'}</span>
              </div>

              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-slate-400">Hora</span>
                <span className="text-yellow-300 font-mono">{isDay ? 'Dia' : 'Noite'} ({dayTime}%)</span>
              </div>
            </div>
          </div>

          {/* The Backpack */}
          <button
            onClick={handleBackpackClick}
            className={`w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all p-4 sm:p-5 rounded-2xl border-b-4 border-indigo-800 flex items-center justify-between group ${backpack >= 100 ? 'ring-4 ring-yellow-400 animate-pulse' : ''}`}
          >
            <div className="text-left">
              <div className="text-[10px] sm:text-xs text-indigo-200 font-bold uppercase tracking-wider">Mochila de Energia</div>
              <div className="text-xl sm:text-2xl font-black text-white">{backpack}%</div>
            </div>
            <div className={`p-2 sm:p-3 bg-indigo-500 rounded-xl ${backpack > 0 ? 'animate-bounce' : ''} relative`}>
              <Backpack className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              {upgrades.smartGrid && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center border border-white">
                  <Cpu className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
          </button>
          <p className="text-[10px] sm:text-xs text-center text-slate-300 opacity-80 mb-2 sm:mb-6">
            {calculateGeneration() > demand
              ? <span className="text-green-400 font-bold">SOBRA DE ENERGIA: Clique para GUARDAR!</span>
              : <span className="text-red-400 font-bold">FALTA DE ENERGIA: Clique para USAR!</span>
            }
          </p>

          {/* Building Menu (Fixed height on mobile to allow scroll) */}
          <div className="bg-slate-900/80 backdrop-blur p-3 sm:p-4 rounded-2xl border border-slate-700 flex flex-col gap-2 sm:gap-3 max-h-64 lg:h-full overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-slate-200 flex items-center gap-2 mb-1 sm:mb-2 text-sm sm:text-base sticky top-0 bg-slate-900/80 z-10 py-1">
              <Zap className="w-4 h-4 text-yellow-400" /> Construir
            </h3>
            {Object.values(BUILDINGS).map((b) => (
              <button
                key={b.id}
                onClick={() => handleBuild(b.id)}
                disabled={money < b.cost}
                className={`
                  flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3 rounded-xl border transition-all w-full
                  ${money >= b.cost
                    ? 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-green-400'
                    : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'}
                `}
              >
                <div className={`p-1.5 sm:p-2 rounded-lg ${b.bgColor} shrink-0`}>
                  <b.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${b.color}`} />
                </div>
                <div className="text-left overflow-hidden min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-slate-200 truncate">{b.name}</div>
                  <div className="text-[10px] sm:text-xs text-yellow-400 font-mono">R$ {b.cost}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Upgrades Menu */}
          <div className="bg-slate-900/80 backdrop-blur p-3 sm:p-4 rounded-2xl border border-slate-700 flex flex-col gap-2 sm:gap-3 h-auto max-h-48 overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-slate-200 flex items-center gap-2 mb-1 sm:mb-2 text-sm sm:text-base sticky top-0 bg-slate-900/80 z-10 py-1">
              <Sparkles className="w-4 h-4 text-purple-400" /> Tecnologias
            </h3>
            {Object.entries(UPGRADES).map(([key, u]) => (
              <button
                key={u.id}
                onClick={() => handleBuyUpgrade(key)}
                disabled={money < u.cost || upgrades[key]}
                className={`
                  flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3 rounded-xl border transition-all w-full
                  ${upgrades[key]
                    ? 'bg-purple-900/20 border-purple-500/50 cursor-default'
                    : money >= u.cost
                      ? 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-purple-400'
                      : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'}
                `}
              >
                <div className={`p-1.5 sm:p-2 rounded-lg ${u.bgColor} shrink-0`}>
                  <u.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${u.color}`} />
                </div>
                <div className="text-left overflow-hidden min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-slate-200 truncate flex items-center gap-2">
                    {u.name}
                    {upgrades[key] && <CheckCircle className="w-3 h-3 text-green-400" />}
                  </div>
                  {!upgrades[key] ? (
                    <div className="text-[10px] sm:text-xs text-yellow-400 font-mono">R$ {u.cost}</div>
                  ) : (
                    <div className="text-[10px] sm:text-xs text-purple-300 font-mono">ATIVO</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center: Grid Map (Game Board) */}
        <div className="order-1 lg:order-2 lg:col-span-3 flex flex-col gap-4 h-[50vh] lg:h-full">
          <div className="flex-1 bg-slate-900/60 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-4 sm:p-6 relative overflow-y-auto custom-scrollbar">
            {/* Isometric-ish Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 pb-12">
              {grid.map((slot, i) => (
                <div
                  key={i}
                  className={`
                     aspect-square rounded-xl sm:rounded-2xl border-2 border-dashed flex flex-col items-center justify-center relative group transition-all
                     ${slot
                      ? `border-solid border-slate-600 ${BUILDINGS[slot.type].bgColor}`
                      : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 cursor-pointer text-slate-700'}
                   `}
                  onClick={() => slot && handleRemove(i)}
                >
                  {slot ? (
                    <>
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 bg-black/20 rounded-lg opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                      </div>
                      {React.createElement(BUILDINGS[slot.type].icon, {
                        className: `w-8 h-8 sm:w-12 sm:h-12 mb-1 sm:mb-2 ${BUILDINGS[slot.type].color} drop-shadow-lg`
                      })}
                      <span className="text-[10px] sm:text-xs font-bold text-slate-200 text-center px-1 truncate w-full">{BUILDINGS[slot.type].name}</span>
                      {/* Status Dot */}
                      <div className={`absolute bottom-1 sm:bottom-3 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isDay || slot.type !== 'solar' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,1)]' : 'bg-red-500'}`} />
                    </>
                  ) : (
                    <span className="text-inherit font-mono text-[10px] sm:text-xs font-bold opacity-50">LIVRE</span>
                  )}
                </div>
              ))}
              {/* Ghost slots to maintain grid shape if needed or simply consistent */}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default EcoGuardian;
