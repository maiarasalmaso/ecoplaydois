import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, Home, RotateCcw, Sun, Wind, Droplets, TreeDeciduous, Flame, Waves, Zap, Timer, Gauge, Trophy, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useGameState } from '../../context/GameStateContext';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const ENERGY_CARDS = [
  {
    id: 'solar',
    title: 'Solar',
    description: 'Painéis captam a luz do sol para gerar eletricidade.',
    renewable: true,
    icon: Sun,
    accent: 'text-yellow-400',
    ring: 'ring-yellow-500/30',
    bg: 'bg-yellow-500/15'
  },
  {
    id: 'wind',
    title: 'Eólica',
    description: 'Turbinas usam o vento para gerar energia.',
    renewable: true,
    icon: Wind,
    accent: 'text-cyan-400',
    ring: 'ring-cyan-500/30',
    bg: 'bg-cyan-500/15'
  },
  {
    id: 'hydro',
    title: 'Hidrelétrica',
    description: 'A força da água movimenta turbinas e gera energia.',
    renewable: true,
    icon: Droplets,
    accent: 'text-blue-400',
    ring: 'ring-blue-500/30',
    bg: 'bg-blue-500/15'
  },
  {
    id: 'biomass',
    title: 'Biomassa',
    description: 'Resíduos orgânicos viram energia.',
    renewable: true,
    icon: TreeDeciduous,
    accent: 'text-green-400',
    ring: 'ring-green-500/30',
    bg: 'bg-green-500/15'
  },
  {
    id: 'geothermal',
    title: 'Geotérmica',
    description: 'Calor da Terra é convertido em energia.',
    renewable: true,
    icon: Flame,
    accent: 'text-orange-400',
    ring: 'ring-orange-500/30',
    bg: 'bg-orange-500/15'
  },
  {
    id: 'tidal',
    title: 'Maremotriz',
    description: 'Movimento das marés ajuda a gerar energia.',
    renewable: true,
    icon: Waves,
    accent: 'text-indigo-300',
    ring: 'ring-indigo-500/30',
    bg: 'bg-indigo-500/15'
  },
  {
    id: 'coal',
    title: 'Carvão',
    description: 'Queima de carvão para gerar energia.',
    renewable: false,
    icon: Flame,
    accent: 'text-red-400',
    ring: 'ring-red-500/30',
    bg: 'bg-red-500/15'
  },
  {
    id: 'oil',
    title: 'Petróleo',
    description: 'Combustíveis fósseis derivados do petróleo.',
    renewable: false,
    icon: Droplets,
    accent: 'text-rose-400',
    ring: 'ring-rose-500/30',
    bg: 'bg-rose-500/15'
  },
  {
    id: 'gas',
    title: 'Gás Natural',
    description: 'Combustível fóssil usado em usinas termelétricas.',
    renewable: false,
    icon: Zap,
    accent: 'text-amber-400',
    ring: 'ring-amber-500/30',
    bg: 'bg-amber-500/15'
  }
];

const SWIPE_THRESHOLD = 120;
const GAME_DURATION = 300; // 5 minutos em segundos

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getDifficulty = (timeRemaining) => {
  const timeElapsed = GAME_DURATION - timeRemaining;
  // Aumenta nível a cada 1 minuto (60s)
  return Math.min(5, Math.floor(timeElapsed / 60) + 1);
};

const getCardTimeLimit = (level) => {
  switch (level) {
    case 1: return null; // Sem limite
    case 2: return 15;
    case 3: return 10;
    case 4: return 7;
    case 5: return 5;
    default: return 15;
  }
};

const EcoEnergySort = () => {
  const navigate = useNavigate();
  const { addScore, updateStat } = useGameState();
  const MotionDiv = motion.div;

  const arenaRef = useRef(null);
  const leftZoneRef = useRef(null);
  const rightZoneRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [activeZone, setActiveZone] = useState(null);

  const [deck, setDeck] = useState([]);

  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Game Logic States
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [finished, setFinished] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // Para iniciar o jogo apenas quando carregar ou usuário der start

  // Card Timer Logic
  const [cardTimeLeft, setCardTimeLeft] = useState(null);

  const difficulty = getDifficulty(timeLeft);
  const current = deck[index];
  const cardLimit = getCardTimeLimit(difficulty);

  const getZoneForPoint = (point) => {
    if (!point) return null;

    const leftRect = leftZoneRef.current?.getBoundingClientRect();
    if (
      leftRect &&
      point.x >= leftRect.left &&
      point.x <= leftRect.right &&
      point.y >= leftRect.top &&
      point.y <= leftRect.bottom
    ) {
      return 'left';
    }

    const rightRect = rightZoneRef.current?.getBoundingClientRect();
    if (
      rightRect &&
      point.x >= rightRect.left &&
      point.x <= rightRect.right &&
      point.y >= rightRect.top &&
      point.y <= rightRect.bottom
    ) {
      return 'right';
    }

    return null;
  };

  // Definindo answer antes de ser usado nos useEffects
  // Usando useCallback para poder colocar nas dependências
  const answer = useCallback((choiceRenewable) => {
    console.log('Answer called with choice:', choiceRenewable);
    if (!current || finished) {
      console.log('Answer blocked: no current or finished');
      return;
    }

    let isCorrect = false;
    let isTimeout = false;

    if (choiceRenewable === null) {
      // Timeout
      isTimeout = true;
      isCorrect = false;
    } else {
      isCorrect = Boolean(choiceRenewable) === Boolean(current.renewable);
    }

    setLastResult(isCorrect);

    if (isTimeout) {
      setFeedback({
        type: 'danger',
        title: 'Tempo Esgotado!',
        text: 'Seja mais rápido na próxima.'
      });
    } else {
      setFeedback({
        type: isCorrect ? 'success' : 'danger',
        title: isCorrect ? 'Boa!' : 'Errou!',
        text: isCorrect ? 'Classificação correta.' : 'Classificação incorreta.'
      });
    }

    if (isCorrect) {
      setCorrect((c) => c + 1);
      setStreak((s) => s + 1);
    } else {
      setWrong((w) => w + 1);
      setStreak(0);
    }

    // Avançar carta com pequeno delay para animação
    setTimeout(() => {
      setFeedback(null);
      setCardTimeLeft(null); // Reseta visualmente

      // Loop Infinito de Cartas
      setIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= deck.length) {
          // Reembaralha e começa do zero se acabar o deck
          setDeck(shuffle(ENERGY_CARDS));
          return 0;
        }
        return nextIndex;
      });
    }, 450);
  }, [current, finished, deck.length]); // Dependências de answer

  // Inicialização
  useEffect(() => {
    setDeck(shuffle(ENERGY_CARDS));
    setIsPlaying(true); // Começa automaticamente por enquanto
  }, []);

  // Timer Global
  useEffect(() => {
    if (!isPlaying || finished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, finished]);

  // Timer da Carta
  useEffect(() => {
    if (!isPlaying || finished || !current || cardLimit === null || isDragging) {
      setCardTimeLeft(null);
      return;
    }

    setCardTimeLeft(cardLimit);

    const timer = setInterval(() => {
      setCardTimeLeft((prev) => {
        if (prev <= 0.1) { // Usando 0.1 para evitar glitch visual no 0
          clearInterval(timer);
          // Chama answer com null para indicar timeout
          // Como answer é estável via useCallback mas depende de current, 
          // e current muda quando answer é chamado, isso funciona.
          answer(null);
          return 0;
        }
        return prev - 0.1; // Decremento mais suave para barra de progresso
      });
    }, 100); // Atualiza a cada 100ms

    return () => clearInterval(timer);
  }, [index, difficulty, isPlaying, finished, isDragging, cardLimit, current, answer]);

  const resetGame = () => {
    setDeck(shuffle(ENERGY_CARDS));
    setIndex(0);
    setCorrect(0);
    setWrong(0);
    setStreak(0);
    setLastResult(null);
    setFeedback(null);
    setTimeLeft(GAME_DURATION);
    setFinished(false);
    setIsPlaying(true);
  };

  // Navegação por Teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (finished || !current || feedback) return;

      if (e.key === 'ArrowLeft') {
        answer(false);
      } else if (e.key === 'ArrowRight') {
        answer(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finished, current, feedback, answer]);

  // Finalização do Jogo
  useEffect(() => {
    if (!finished) return;

    const isWin = correct > wrong;

    // Calcula XP
    const base = correct * 40;
    const penalty = wrong * 10;
    const streakBonus = clamp(streak, 0, 10) * 15;
    const xp = Math.max(0, base - penalty + streakBonus);

    if (xp > 0) addScore(xp);
    updateStat('total_games_played', 1);
    updateStat('energy_sort_plays', 1);
    if (isWin) updateStat('energy_sort_wins', 1);

    if (isWin) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#22d3ee', '#facc15']
      });
    }
  }, [finished, correct, wrong, streak, addScore, updateStat, timeLeft]); // Adicionei timeLeft para calar o warning, embora não use

  return (
    <div className="min-h-screen pt-6 pb-16 px-4 flex flex-col items-center max-w-6xl mx-auto bg-theme-bg-primary text-theme-text-primary">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <Link to="/games" className="flex items-center gap-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Sair</span>
        </Link>

        <div className="flex items-center gap-4">
          {/* Timer Display */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold border ${timeLeft < 60 ? 'bg-red-500/20 border-red-500/50 text-red-500 animate-pulse' : 'bg-theme-bg-secondary border-theme-border text-theme-text-primary'
            }`}>
            <Timer className="w-5 h-5" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            type="button"
            onClick={resetGame}
            className="p-2 bg-theme-bg-secondary backdrop-blur-sm rounded-lg text-theme-text-secondary hover:bg-theme-bg-tertiary hover:text-theme-text-primary transition-all border border-theme-border"
            title="Reiniciar"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="w-full mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-theme-bg-secondary border border-theme-border rounded-2xl p-4 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 text-theme-text-tertiary mb-1 text-xs uppercase tracking-wider font-mono">
            <Gauge className="w-4 h-4" /> Dificuldade
          </div>
          <div className="text-2xl font-display font-bold text-theme-text-primary">Nível {difficulty}</div>
          <div className="w-full h-1.5 bg-theme-bg-tertiary rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${(difficulty / 5) * 100}%` }} />
          </div>
        </div>

        <div className="bg-theme-bg-secondary border border-theme-border rounded-2xl p-4 flex flex-col items-center justify-center">
          <div className="text-xs uppercase tracking-wider font-mono text-theme-text-tertiary mb-1">Acertos</div>
          <div className="text-2xl font-display font-bold text-eco-green-light">{correct}</div>
        </div>

        <div className="bg-theme-bg-secondary border border-theme-border rounded-2xl p-4 flex flex-col items-center justify-center">
          <div className="text-xs uppercase tracking-wider font-mono text-theme-text-tertiary mb-1">Erros</div>
          <div className="text-2xl font-display font-bold text-red-500">{wrong}</div>
        </div>

        <div className="bg-theme-bg-secondary border border-theme-border rounded-2xl p-4 flex flex-col items-center justify-center">
          <div className="text-xs uppercase tracking-wider font-mono text-theme-text-tertiary mb-1">Streak</div>
          <div className="text-2xl font-display font-bold text-yellow-400">{streak}</div>
        </div>
      </div>

      {/* Game Arena */}
      <div ref={arenaRef} className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch flex-grow">
        {/* Left Zone */}
        <div
          ref={leftZoneRef}
          className={`border-2 border-dashed rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${isDragging && activeZone === 'left'
            ? 'bg-red-500/10 border-red-400 scale-[1.02]'
            : 'bg-theme-bg-secondary/30 border-theme-border hover:border-theme-text-secondary'
            }`}
        >
          <div className="text-center mt-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <Flame className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-display font-bold text-red-500 mb-2">Não Renovável</h2>
            <p className="text-theme-text-secondary text-sm">Fontes que se esgotam e poluem.</p>
          </div>
          <button
            type="button"
            onClick={() => answer(false)}
            className="mt-6 w-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-500 rounded-xl py-4 font-bold transition-colors uppercase tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!current || finished || feedback}
          >
            Soltar Aqui
          </button>
        </div>

        {/* Center Card Area */}
        <div className="relative flex flex-col items-center justify-center min-h-[400px]">
          <AnimatePresence mode="wait">
            {!finished && current && (
              <MotionDiv
                key={current.id + index} // Garante recriação do componente para resetar animações
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  x: lastResult === null ? 0 : (lastResult ? 200 : -200),
                  rotate: lastResult === null ? 0 : (lastResult ? 20 : -20),
                  transition: { duration: 0.2 }
                }}
                drag={!finished} // Desabilita drag se acabou
                dragConstraints={arenaRef}
                dragElastic={0.1}
                whileDrag={{ scale: 1.05, rotate: 0 }}
                onDragStart={() => {
                  setIsDragging(true);
                  setActiveZone(null);
                }}
                onDrag={(_, info) => {
                  const zone = getZoneForPoint(info.point);
                  setActiveZone((prev) => (prev === zone ? prev : zone));
                }}
                onDragEnd={(_, info) => {
                  const zone = getZoneForPoint(info.point);
                  setIsDragging(false);
                  setActiveZone(null);

                  if (zone === 'left') answer(false);
                  else if (zone === 'right') answer(true);
                  else if (info.offset.x > SWIPE_THRESHOLD) answer(true);
                  else if (info.offset.x < -SWIPE_THRESHOLD) answer(false);
                }}
                className="w-full max-w-sm cursor-grab active:cursor-grabbing touch-none z-10"
              >
                <div className="relative bg-theme-bg-secondary border border-theme-border rounded-3xl p-1 shadow-2xl overflow-hidden">
                  {/* Card Timer Bar */}
                  {cardLimit && (
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-theme-bg-tertiary z-20">
                      <motion.div
                        className={`h-full ${cardTimeLeft < 3 ? 'bg-red-500' : 'bg-blue-400'}`}
                        initial={{ width: '100%' }}
                        animate={{ width: `${(cardTimeLeft / cardLimit) * 100}%` }}
                        transition={{ ease: "linear", duration: 0.1 }}
                      />
                    </div>
                  )}

                  <div className="bg-theme-bg-primary/50 rounded-[22px] p-6 h-full border border-theme-border">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-3 rounded-2xl ${current.bg} ${current.ring} ring-1`}>
                        <current.icon className={`w-8 h-8 ${current.accent}`} />
                      </div>
                      {cardLimit && (
                        <div className={`font-mono font-bold text-sm ${cardTimeLeft < 3 ? 'text-red-500 animate-pulse' : 'text-theme-text-secondary'}`}>
                          {Math.ceil(cardTimeLeft)}s
                        </div>
                      )}
                    </div>

                    <h3 className="text-2xl font-display font-bold text-theme-text-primary mb-2">{current.title}</h3>
                    <p className="text-theme-text-secondary text-sm leading-relaxed mb-6">{current.description}</p>

                    <div className="flex items-center justify-center gap-2 text-xs font-mono text-theme-text-tertiary uppercase tracking-widest opacity-50">
                      <span>← Não Renovável</span>
                      <span>•</span>
                      <span>Renovável →</span>
                    </div>
                  </div>
                </div>
              </MotionDiv>
            )}
          </AnimatePresence>

          {/* Feedback Popup */}
          <AnimatePresence>
            {feedback && (
              <MotionDiv
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`absolute top-full mt-4 z-20 px-6 py-3 rounded-2xl border shadow-xl backdrop-blur-md flex items-center gap-3 ${feedback.type === 'success'
                  ? 'bg-green-500/20 border-green-500/30 text-green-300'
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
                  }`}
              >
                {feedback.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                <div>
                  <div className="font-bold text-sm uppercase tracking-wider">{feedback.title}</div>
                  <div className="text-xs opacity-90">{feedback.text}</div>
                </div>
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>

        {/* Right Zone */}
        <div
          ref={rightZoneRef}
          className={`border-2 border-dashed rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${isDragging && activeZone === 'right'
            ? 'bg-green-500/10 border-green-400 scale-[1.02]'
            : 'bg-theme-bg-secondary/30 border-theme-border hover:border-theme-text-secondary'
            }`}
        >
          <div className="text-center mt-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
              <TreeDeciduous className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-display font-bold text-green-500 mb-2">Renovável</h2>
            <p className="text-theme-text-secondary text-sm">Fontes limpas e inesgotáveis.</p>
          </div>
          <button
            type="button"
            onClick={() => answer(true)}
            className="mt-6 w-full bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-500 rounded-xl py-4 font-bold transition-colors uppercase tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!current || finished || feedback}
          >
            Soltar Aqui
          </button>
        </div>
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {finished && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-theme-backdrop"
          >
            <MotionDiv
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-theme-bg-secondary border border-theme-border rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              {/* Resultado Header */}
              <div className="text-center mb-8">
                {correct > wrong ? (
                  <div className="inline-flex p-4 rounded-full bg-green-500/20 text-green-500 mb-4 ring-4 ring-green-500/10">
                    <Trophy className="w-12 h-12" />
                  </div>
                ) : (
                  <div className="inline-flex p-4 rounded-full bg-red-500/20 text-red-500 mb-4 ring-4 ring-red-500/10">
                    <AlertTriangle className="w-12 h-12" />
                  </div>
                )}

                <h2 className="text-3xl font-display font-bold text-theme-text-primary mb-2">
                  {correct > wrong ? 'Vitória!' : 'Derrota'}
                </h2>
                <p className="text-theme-text-secondary">
                  {correct > wrong
                    ? 'Você dominou a classificação energética!'
                    : 'Você precisa de mais acertos para vencer.'}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-theme-bg-tertiary/50 p-4 rounded-2xl border border-theme-border/50 text-center">
                  <div className="text-xs font-mono uppercase text-theme-text-tertiary mb-1">Acertos</div>
                  <div className="text-3xl font-bold text-green-500">{correct}</div>
                </div>
                <div className="bg-theme-bg-tertiary/50 p-4 rounded-2xl border border-theme-border/50 text-center">
                  <div className="text-xs font-mono uppercase text-theme-text-tertiary mb-1">Erros</div>
                  <div className="text-3xl font-bold text-red-500">{wrong}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={resetGame}
                  className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Jogar Novamente
                </button>
                <button
                  onClick={() => navigate('/games')}
                  className="w-full py-4 bg-theme-bg-tertiary hover:bg-theme-bg-secondary text-theme-text-primary rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-theme-border"
                >
                  <Home className="w-5 h-5" />
                  Voltar ao Menu
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EcoEnergySort;
