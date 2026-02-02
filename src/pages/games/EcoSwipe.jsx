import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Trophy, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useGameState } from '@/context/GameStateContext';
import api from '../../services/api';

const GAME_DURATION = 300; // 5 minutos em segundos

const ENERGY_CARDS = [
  // Renováveis
  { name: 'Solar', renewable: true, emoji: '☀️' },
  { name: 'Eólica', renewable: true, emoji: '🌬️' },
  { name: 'Hidrelétrica', renewable: true, emoji: '💧' },
  { name: 'Biomassa', renewable: true, emoji: '🌱' },
  { name: 'Geotérmica', renewable: true, emoji: '🌋' },
  { name: 'Maremotriz', renewable: true, emoji: '🌊' },

  // Não Renováveis
  { name: 'Carvão', renewable: false, emoji: '⚫' },
  { name: 'Petróleo', renewable: false, emoji: '🛢️' },
  { name: 'Gás Natural', renewable: false, emoji: '🔥' },
  { name: 'Nuclear', renewable: false, emoji: '☢️' },
  { name: 'Óleo Diesel', renewable: false, emoji: '⛽' },
  { name: 'Xisto Betuminoso', renewable: false, emoji: '🪨' },
];

const shuffle = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const EcoSwipe = () => {
  const { addScore, updateStat } = useGameState();
  const [deck, setDeck] = useState(shuffle(ENERGY_CARDS));
  const [index, setIndex] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState(null); // {type: 'correct'/'wrong', message: string}
  const [difficulty, setDifficulty] = useState(1);
  const [cardLimit, setCardLimit] = useState(10); // Tempo inicial por carta
  const timerRef = useRef(null);

  const current = deck[index];

  const getDifficulty = (timeRemaining) => {
    const timeElapsed = GAME_DURATION - timeRemaining;
    return Math.min(5, Math.floor(timeElapsed / 60) + 1);
  };

  const getCardTimeLimit = (diff) => {
    return Math.max(5, 10 - (diff - 1) * 1.5);
  };

  // Usando useCallback para poder colocar nas dependências
  const answer = useCallback((choiceRenewable) => {
    console.log('Answer called with choice:', choiceRenewable);
    if (!current || finished) {
      console.log('Answer blocked: no current or finished');
      return;
    }

    let isCorrect = false;
    if (choiceRenewable && current.renewable) {
      isCorrect = true;
    } else if (!choiceRenewable && !current.renewable) {
      isCorrect = true;
    }

    if (isCorrect) {
      setAcertos((prev) => prev + 1);
      setFeedback({ type: 'correct', message: 'Correto! +10 XP' });
      addScore(10);
    } else {
      setErros((prev) => prev + 1);
      setFeedback({ type: 'wrong', message: 'Errado! -5 XP' });
      addScore(-5);
    }

    // Avança para próxima carta
    setIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= deck.length) {
        // Reinicia o deck com shuffle
        setDeck(shuffle(ENERGY_CARDS));
        return 0;
      }
      return nextIndex;
    });

    // Limpa feedback após 1s
    setTimeout(() => setFeedback(null), 1000);
  }, [current, finished, deck.length, addScore]);

  // Temporizador do jogo
  useEffect(() => {
    if (!isPlaying || finished) return;
    console.log('Timer started');
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setFinished(true);
          console.log('Timer ended');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      clearInterval(timer);
      console.log('Timer cleaned up');
    };
  }, [isPlaying, finished]);

  // Atualiza dificuldade
  useEffect(() => {
    if (!isPlaying || finished) return;

    const diff = getDifficulty(timeLeft);
    setDifficulty(diff);
    setCardLimit(getCardTimeLimit(diff));
  }, [timeLeft, isPlaying, finished]);

  // Temporizador por carta
  useEffect(() => {
    if (!isPlaying || finished || !current || feedback) return;

    timerRef.current = setTimeout(() => {
      setErros((prev) => prev + 1);
      setFeedback({ type: 'timeout', message: 'Tempo esgotado! -5 XP' });
      addScore(-5);

      setTimeout(() => {
        setFeedback(null);
        setIndex((prev) => (prev + 1) % deck.length);
      }, 1000);
    }, cardLimit * 1000);

    return () => clearTimeout(timerRef.current);
  }, [isPlaying, finished, current, cardLimit, feedback, deck.length, addScore, answer]);

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
    if (finished) {
      setIsPlaying(false);
      const total = acertos + erros;
      const win = acertos > erros && acertos / total > 0.5;
      if (win) {
        updateStat('games_won', 1);
        addScore(50); // Bônus de vitória

        // Save score
        api.post('/games/score', {
          gameId: 'swipe',
          score: acertos * 10
        }).catch(err => console.error('Failed to save score:', err));
      }
      updateStat('total_games', 1);
    }
  }, [finished, acertos, erros, updateStat, addScore]);

  const startGame = () => {
    setDeck(shuffle(ENERGY_CARDS));
    setIndex(0);
    setAcertos(0);
    setErros(0);
    setTimeLeft(GAME_DURATION);
    setIsPlaying(true);
    setFinished(false);
    setFeedback(null);
    setDifficulty(1);
    setCardLimit(10);
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary p-4 md:p-8 transition-colors duration-300">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/games" className="flex items-center gap-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-theme-bg-secondary/50 px-4 py-2 rounded-full border border-theme-border text-theme-text-secondary">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>

            <div className="flex items-center gap-2 bg-theme-bg-secondary/50 px-4 py-2 rounded-full border border-theme-border text-theme-text-secondary">
              <Trophy className="w-4 h-4 text-purple-500" />
              <span className="font-mono">Nível {difficulty}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-theme-bg-secondary/50 p-4 rounded-xl border border-green-500/30">
            <div className="text-green-600 dark:text-green-400 font-bold mb-2">Acertos</div>
            <div className="text-3xl font-mono text-theme-text-primary">{acertos}</div>
          </div>
          <div className="bg-theme-bg-secondary/50 p-4 rounded-xl border border-red-500/30">
            <div className="text-red-600 dark:text-red-400 font-bold mb-2">Erros</div>
            <div className="text-3xl font-mono text-theme-text-primary">{erros}</div>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex flex-row gap-4 md:gap-8 justify-between items-stretch h-[60vh] md:h-auto overflow-hidden relative">

          {/* Zona Não Renovável (Esquerda) */}
          <div className="w-12 md:w-1/3 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-xl p-1 md:p-4 flex flex-col items-center justify-center min-h-[300px] z-10 transition-colors duration-300">
            <XCircle className="w-6 h-6 md:w-8 md:h-8 text-red-500 dark:text-red-400 mb-2" />
            <h2 className="hidden md:block text-xl font-bold text-red-700 dark:text-red-400 mb-4 text-center">Não Renovável</h2>
            <p className="hidden md:block text-red-600/70 dark:text-red-400/70 text-center mb-4 text-xs md:text-base">Arraste para cá fontes finitas</p>
            <button
              type="button"
              onClick={() => answer(false)}
              className="mt-auto w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl py-4 font-bold transition-colors uppercase tracking-wider text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed hidden md:block"
              disabled={!current || finished || feedback}
            >
              Soltar Aqui
            </button>
          </div>

          {/* Carta Central (Draggable) */}
          <div className="flex-1 flex items-center justify-center relative z-20 overflow-visible">
            <AnimatePresence mode="wait" custom={feedback?.type === 'wrong' ? 0 : 1}>
              {current && !finished && (
                <motion.div
                  key={index}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.7}
                  onDragEnd={(e, { offset }) => {
                    const swipeThreshold = 80; // Reduzido para facilitar no mobile
                    if (offset.x < -swipeThreshold) {
                      answer(false); // Esquerda -> Não Renovável
                    } else if (offset.x > swipeThreshold) {
                      answer(true); // Direita -> Renovável
                    }
                  }}
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                    x: feedback?.type ? 0 : (index % 2 === 0 ? 200 : -200), // Alterna direção de saída (determinístico)
                    transition: { duration: 0.2 }
                  }}
                  whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
                  className="w-full max-w-[300px] bg-theme-bg-secondary border border-theme-border rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center aspect-[3/4] shadow-xl cursor-grab active:cursor-grabbing touch-none"
                >
                  <div className="text-6xl md:text-8xl mb-4 md:mb-6 select-none pointer-events-none">{current.emoji}</div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2 text-center select-none pointer-events-none text-theme-text-primary">{current.name}</h3>
                  <p className="text-theme-text-secondary text-center text-xs md:text-sm mb-6 select-none pointer-events-none">Arraste para classificar</p>

                  {/* Setas indicativas Mobile */}
                  <div className="flex justify-between w-full text-xs font-bold uppercase tracking-wider opacity-50 md:hidden select-none pointer-events-none mt-auto">
                    <div className="flex flex-col items-center text-red-400">
                      <span>← Não</span>
                      <XCircle className="w-4 h-4 mt-1" />
                    </div>
                    <div className="flex flex-col items-center text-green-400">
                      <span>Sim →</span>
                      <CheckCircle className="w-4 h-4 mt-1" />
                    </div>
                  </div>

                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`absolute top-4 px-4 py-2 rounded-full text-sm font-bold shadow-lg z-30 ${feedback.type === 'correct' ? 'bg-green-500 text-white' :
                        feedback.type === 'wrong' ? 'bg-red-500 text-white' :
                          'bg-amber-500 text-white'
                        }`}
                    >
                      {feedback.message}
                    </motion.div>
                  )}

                  {/* Barra de progresso da carta */}
                  <div className="w-full mt-4 bg-theme-bg-tertiary rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="bg-amber-500 h-2 rounded-full"
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: cardLimit, ease: 'linear' }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Zona Renovável (Direita) */}
          <div className="w-12 md:w-1/3 bg-green-500/5 dark:bg-green-500/10 border border-green-500/20 rounded-xl p-1 md:p-4 flex flex-col items-center justify-center min-h-[300px] z-10 transition-colors duration-300">
            <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-500 dark:text-green-400 mb-2" />
            <h2 className="hidden md:block text-xl font-bold text-green-700 dark:text-green-400 mb-4 text-center">Renovável</h2>
            <p className="hidden md:block text-green-600/70 dark:text-green-400/70 text-center mb-4 text-xs md:text-base">Arraste para cá fontes sustentáveis</p>
            <button
              type="button"
              onClick={() => answer(true)}
              className="mt-auto w-full bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-600 dark:text-green-400 rounded-xl py-4 font-bold transition-colors uppercase tracking-wider text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed hidden md:block"
              disabled={!current || finished || feedback}
            >
              Soltar Aqui
            </button>
          </div>
        </div>

        {/* Botão Iniciar */}
        {!isPlaying && !finished && (
          <button
            onClick={startGame}
            className="mt-8 px-8 py-4 bg-eco-green hover:bg-green-600 text-white rounded-full font-bold transition-all mx-auto block"
          >
            Iniciar Jogo
          </button>
        )}

        {/* Modal de Fim de Jogo */}
        <AnimatePresence>
          {finished && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-theme-bg-secondary border border-theme-border p-8 rounded-2xl max-w-md w-full text-center shadow-2xl"
              >
                <div className="mb-6">
                  {acertos > erros ? (
                    <Trophy className="w-16 h-16 text-eco-green mx-auto mb-4" />
                  ) : (
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  )}
                  <h2 className="text-3xl font-bold mb-2 text-theme-text-primary">
                    {acertos > erros ? 'Vitória!' : 'Derrota!'}
                  </h2>
                  <p className="text-theme-text-secondary">
                    Acertos: {acertos} | Erros: {erros}
                  </p>
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={startGame}
                    className="px-6 py-3 bg-eco-green hover:bg-green-600 text-white rounded-full font-bold transition-all"
                  >
                    Jogar Novamente
                  </button>
                  <Link
                    to="/games"
                    className="px-6 py-3 bg-theme-bg-tertiary hover:bg-theme-bg-primary text-theme-text-primary rounded-full font-bold transition-all"
                  >
                    Sair
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EcoSwipe;