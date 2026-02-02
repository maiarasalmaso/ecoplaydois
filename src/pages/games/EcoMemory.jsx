import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, HelpCircle, Trophy, Zap, Brain, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useGameState } from '../../context/GameStateContext';
import { playSelect, playSuccess, playError, playWin } from '../../utils/soundEffects';
import api from '../../services/api';
import FeedbackToast from '@/components/ui/FeedbackToast';
const pickRandomItem = (items) => items[Math.floor(Math.random() * items.length)];

// Emojis e Knowledge Base
const EMOJIS = ['☀️', '☀️', '🌬️', '🌬️', '💧', '💧', '🌊', '🌊', '🌱', '🌱', '⚡', '⚡', '🌍', '🌍', '♻️', '♻️', '🔋', '🔋', '🌿', '🌿', '💣', '💣', '💣', '💣'];
const KNOWLEDGE_BASE = [
  // Solar
  { q: "O que a energia solar utiliza?", a: ["Luz do Sol", "Calor do núcleo", "Vento"], c: 0, e: "O Sol brilha forte e seus raios nos dão luz e calor para criar energia!" },
  { q: "Painéis solares geram eletricidade via:", a: ["Efeito Fotovoltaico", "Combustão", "Fissão"], c: 0, e: "Os painéis absorvem a luz do sol e a transformam em energia elétrica magicamente!" },
  { q: "Vantagem da energia solar:", a: ["Renovável e limpa", "Funciona à noite", "Gera lixo nuclear"], c: 0, e: "É uma energia limpinha que nunca acaba e não polui nosso planeta!" },

  // Eólica
  { q: "O que move as turbinas eólicas?", a: ["Vento", "Água", "Vapor"], c: 0, e: "O vento sopra forte e gira as pás gigantes das turbinas para criar energia." },
  { q: "Qual tecnologia otimiza eólica?", a: ["RNNs sequenciais", "Carvão", "Sorte"], c: 0, e: "Computadores super espertos usam matemática (RNNs) para prever o vento!" },
  { q: "Melhor local para parque eólico:", a: ["Costa ventosa", "Floresta densa", "Caverna"], c: 0, e: "Lugares abertos com muito vento, como a beira do mar, são perfeitos!" },

  // Hidrelétrica
  { q: "Fonte da energia hidrelétrica:", a: ["Água em movimento", "Fogo", "Urânio"], c: 0, e: "A força da água dos rios correndo move as turbinas e gera eletricidade." },
  { q: "Maior usina do Brasil:", a: ["Itaipu", "Angra 1", "Belo Monte"], c: 0, e: "Itaipu é uma usina gigante e famosa que gera muita energia com a água!" },
  { q: "Impacto negativo de grandes represas:", a: ["Alagamento de áreas", "Emissão de fumaça", "Resíduos tóxicos"], c: 0, e: "Para fazer a represa, precisamos inundar grandes áreas, o que muda a casa dos animais." },

  // Biomassa
  { q: "Bioenergia usa como combustível:", a: ["Matéria orgânica", "Plástico", "Vidro"], c: 0, e: "Usamos restos de plantas e madeira para queimar e gerar energia!" },
  { q: "Exemplo de biomassa:", a: ["Bagaço de cana", "Pneu velho", "Areia"], c: 0, e: "O bagaço da cana-de-açúcar é um ótimo combustível natural." },
  { q: "Vantagem da biomassa:", a: ["Reaproveita resíduos", "Não gera energia", "É infinita"], c: 0, e: "Ela ajuda a limpar o lixo orgânico transformando-o em energia útil!" },

  // Geotérmica
  { q: "Energia geotérmica vem de onde?", a: ["Calor da Terra", "Ondas do mar", "Raios lunares"], c: 0, e: "Vem lá do fundo da terra! O calor do nosso planeta gera essa energia." },
  { q: "Onde é comum usar geotérmica?", a: ["Áreas vulcânicas", "Desertos gelados", "No espaço"], c: 0, e: "Perto de vulcões a terra é bem quentinha, ideal para gerar essa energia!" },

  // Maré/Ondas
  { q: "Energia maremotriz usa:", a: ["Movimento das marés", "Sal da água", "Peixes"], c: 0, e: "Usa o sobe e desce das ondas do mar para mover geradores." },
  { q: "Vantagem da maré:", a: ["Previsível", "Aleatória", "Poluente"], c: 0, e: "Sabemos sempre quando a maré vai subir ou descer, então é fácil prever a energia!" },

  // Tecnologias Avançadas (Pinheiro 2025)
  { q: "Como IA ajuda na energia solar?", a: ["Prevendo nuvens", "Limpando painéis", "Pintando o sol"], c: 0, e: "A Inteligência Artificial avisa quando as nuvens vêm para ajudar a controlar a energia!" },
  { q: "Como solar reduz CO2?", a: ["Substituindo fósseis", "Absorvendo fumaça", "Congelando o ar"], c: 0, e: "Usando o sol, não precisamos queimar combustíveis sujos que poluem o ar." },
  { q: "O que são Smart Grids?", a: ["Redes inteligentes", "Jogos de tabuleiro", "Cabos coloridos"], c: 0, e: "São redes de energia super espertas que conversam entre si para não faltar luz!" }
];

const EcoMemory = () => {
  const { addScore, updateStat } = useGameState();
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [score, setScore] = useState(100);
  const [turns, setTurns] = useState(0);
  const [lock, setLock] = useState(false);
  const [matches, setMatches] = useState(0);
  const [quiz, setQuiz] = useState(null); // { type, question, reward }
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shaking, setShaking] = useState([]); // Indices das cartas tremendo
  const [feedback, setFeedback] = useState(null); // { type, text }
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(isMuted);

  // Sync mute ref
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const playSound = useCallback((soundFn) => {
    if (!isMutedRef.current) soundFn();
  }, []);

  // Shuffle Function
  const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Init Game
  const initGame = useCallback(() => {
    const shuffledEmojis = shuffle([...EMOJIS]);
    const newCards = shuffledEmojis.map((val, i) => ({
      id: i,
      val,
      isFlipped: false,
      isMatched: false
    }));
    setCards(newCards);
    setFlipped([]);
    setScore(100);
    setTurns(0);
    setMatches(0);
    setLock(false);
    setQuiz(null);
    setGameWon(false);
    setGameOver(false);
    setShaking([]);
    setFeedback(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Handle Card Click
  const handleCardClick = (index) => {
    if (lock || cards[index].isFlipped || cards[index].isMatched || turns >= 60) return;

    playSound(playSelect);

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setLock(true);
      setTurns(t => t + 1);
      checkMatch(newFlipped, newCards);
    }
  };

  // Check Match Logic
  const checkMatch = (currentFlipped, currentCards) => {
    const [idx1, idx2] = currentFlipped;
    const card1 = currentCards[idx1];
    const card2 = currentCards[idx2];
    const isBomb1 = card1.val === '💣';
    const isBomb2 = card2.val === '💣';

    // Normal-Normal Match
    if (card1.val === card2.val && !isBomb1) {
      setScore(s => s + 10);
      setMatches(m => m + 1);
      playSound(playSuccess);
      // Provide positive feedback
      setFeedback({ type: 'success', text: 'Acertou! +10 pontos' });
      if (navigator.vibrate) { navigator.vibrate([50]); }
      setTimeout(() => {
        setCards(prev => prev.map((c, i) =>
          (i === idx1 || i === idx2) ? { ...c, isMatched: true, isFlipped: false } : c
        ));
        resetTurn();
        checkWin(matches + 1);
        setFeedback(null);
      }, 1000);
    }
    // Bomb-Bomb (Chaos)
    else if (isBomb1 && isBomb2) {
      setScore(0);
      playSound(playError);
      triggerShake([idx1, idx2]);
      setFeedback({ type: 'danger', text: '💣 CAOS TOTAL! Pontos zerados! Responda para salvar.' });
      setTimeout(() => {
        setFeedback(null);
        showQuiz(50, true);
      }, 2000);
    }
    // Normal-Bomb (Penalty)
    else if (isBomb1 || isBomb2) {
      setScore(s => s - 10);
      playSound(playError);
      triggerShake([idx1, idx2]);
      setFeedback({ type: 'warning', text: '⚠️ POLUIÇÃO! -10 pontos. As cartas vão mudar!' });
      setTimeout(() => {
        setFeedback(null);
        showQuiz(5, true);
      }, 2000);
    }
    // Mismatch Normal
    else {
      // Mismatch
      setFeedback({ type: 'warning', text: 'Não foi dessa vez! Tente novamente.' });
      setTimeout(() => {
        setCards(prev => prev.map((c, i) =>
          (i === idx1 || i === idx2) ? { ...c, isFlipped: false } : c
        ));
        resetTurn();
      }, 1000);
    }
  };

  const triggerShake = (indices) => {
    setShaking(indices);
    setTimeout(() => setShaking([]), 800);
  };

  const showQuiz = (reward, needsReshuffle) => {
    const q = pickRandomItem(KNOWLEDGE_BASE);
    setQuiz({ ...q, reward, needsReshuffle });
  };

  const handleQuizAnswer = (index) => {
    if (!quiz) return;

    if (index === quiz.c) {
      setScore(s => s + quiz.reward);
      playSound(playSuccess);

      const actionText = quiz.needsReshuffle ? " As cartas foram reembaralhadas!" : "";
      setFeedback({
        type: 'success',
        text: `Correto! +${quiz.reward} pontos.${actionText} O mundo agradece!`,
        persistent: false
      });

      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    } else {
      setScore(s => s - 5);
      playSound(playError);
      setFeedback({ type: 'danger', text: `Ops! ${quiz.e || 'Tente novamente!'}`, persistent: true });
      if (navigator.vibrate) navigator.vibrate([200]);
    }

    // Hide cards
    setCards(prev => prev.map(c =>
      flipped.includes(c.id) ? { ...c, isFlipped: false } : c
    ));

    if (quiz.needsReshuffle) {
      reshuffleBoard();
    } else {
      resetTurn();
    }
    setQuiz(null);
  };

  const reshuffleBoard = () => {
    // 1. Identify unmatched card INDICES
    const unmatchedIndices = cards.reduce((acc, card, index) => {
      if (!card.isMatched) acc.push(index);
      return acc;
    }, []);

    // 2. Extract the actual card OBJECTS at those positions
    const unmatchedCards = unmatchedIndices.map(index => cards[index]);

    // 3. Shuffle the array of OBJECTS
    const shuffledCards = shuffle([...unmatchedCards]);

    // 4. Update the state by placing shuffled objects back into the correct indices
    setCards(prev => {
      const newCards = [...prev];
      unmatchedIndices.forEach((originalIndex, i) => {
        // Place the card from the shuffled list into this position
        // We also ensure it's not flipped so the player has to find them again
        newCards[originalIndex] = {
          ...shuffledCards[i],
          isFlipped: false
        };
      });
      return newCards;
    });

    resetTurn();
  };

  const resetTurn = () => {
    setFlipped([]);
    setLock(false);
  };

  const checkWin = (currentMatches) => {
    if (currentMatches === 10) { // 10 pairs of normal cards
      setGameWon(true);
      playSound(playWin);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4CAF50', '#81C784', '#FFD54F']
      });
      addScore(score); // Add to global context
      updateStat('memory_wins', 1);
      updateStat('memory_wins', 1);
      updateStat('total_games_played', 1);

      // Save score
      api.post('/games/score', {
        gameId: 'memory',
        score: score
      }).catch(err => console.error('Failed to save score:', err));
    }
  };

  useEffect(() => {
    if (turns >= 60 && !gameWon) {
      setGameOver(true);
    }
  }, [turns, gameWon]);

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary p-4 pb-24">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
        <Link to="/games" className="flex items-center gap-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </Link>
        <div className="flex gap-4">
          <div className="bg-theme-bg-secondary px-4 py-2 rounded-lg flex items-center gap-2 border border-theme-border text-theme-text-primary">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-mono text-xl">{score}</span>
          </div>
          <div className="bg-theme-bg-secondary px-4 py-2 rounded-lg flex items-center gap-2 border border-theme-border text-theme-text-primary">
            <span className="text-sm font-bold text-blue-400 uppercase tracking-wider">Jogadas:</span>
            <span className="font-mono text-xl">{turns}/60</span>
          </div>
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="bg-theme-bg-secondary px-4 py-2 rounded-lg flex items-center gap-2 border border-theme-border text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary transition-colors"
            aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-eco-green-light" />}
          </button>
        </div>
      </div>

      {/* Feedback Message */}
      <FeedbackToast feedback={feedback} setFeedback={setFeedback} />

      {/* Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-4 sm:grid-cols-6 gap-3 sm:gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.id}
            layout // Enables auto-animation when position changes in the Grid
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`aspect-[3/4] relative cursor-pointer group ${shaking.includes(i) ? 'animate-shake' : ''}`}
            onClick={() => handleCardClick(i)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ perspective: '1000px' }}
          >
            <div
              className={`w-full h-full transition-all duration-500 ${card.isMatched ? 'opacity-0 pointer-events-none' : ''}`}
              style={{
                transformStyle: 'preserve-3d',
                transform: card.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* Front (Green Pattern - "Back" of deck) */}
              <div
                className="absolute inset-0 bg-eco-green rounded-xl flex items-center justify-center border-2 border-green-600 shadow-lg"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  zIndex: 2
                }}
              >
                <span className="text-2xl sm:text-3xl">🌱</span>
              </div>

              {/* Back (Content/Emoji - "Face" of card) */}
              <div
                className="absolute inset-0 bg-white rounded-xl flex items-center justify-center border-2 border-eco-green shadow-lg"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  zIndex: 1
                }}
              >
                <span className="text-3xl sm:text-4xl">{card.val}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {quiz && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-theme-bg-secondary border border-theme-border p-6 rounded-2xl max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4 text-amber-500">
                <AlertTriangle className="w-8 h-8" />
                <h2 className="text-2xl font-bold">{quiz.needsReshuffle ? 'PERIGO!' : 'Quiz'}</h2>
              </div>
              <p className="text-lg mb-6 text-theme-text-primary">{quiz.q}</p>
              <div className="space-y-3">
                {quiz.a.map((ans, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuizAnswer(idx)}
                    className="w-full p-4 bg-theme-bg-tertiary hover:bg-eco-green hover:text-white rounded-xl transition-all text-left font-medium text-theme-text-secondary"
                  >
                    {ans}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win Modal */}
      <AnimatePresence>
        {gameWon && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              className="bg-theme-bg-secondary border border-eco-green p-8 rounded-2xl max-w-md w-full text-center shadow-2xl"
            >
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-theme-text-primary mb-2">Vitória!</h2>
              <p className="text-theme-text-secondary mb-6">Você energizou o futuro com {score} pontos!</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={initGame}
                  className="px-6 py-3 bg-eco-green hover:bg-green-600 text-white rounded-full font-bold transition-all"
                >
                  Jogar Novamente
                </button>
                <Link
                  to="/games"
                  className="px-6 py-3 bg-theme-bg-tertiary hover:bg-theme-bg-primary text-theme-text-primary border border-theme-border rounded-full font-bold transition-all"
                >
                  Sair
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver && !gameWon && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              className="bg-theme-bg-secondary border border-red-500 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl"
            >
              <VolumeX className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-theme-text-primary mb-2">Fim de Jogo!</h2>
              <p className="text-theme-text-secondary mb-6">Seus turnos acabaram. A energia se esgotou!</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={initGame}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold transition-all"
                >
                  Tentar Novamente
                </button>
                <Link
                  to="/games"
                  className="px-6 py-3 bg-theme-bg-tertiary hover:bg-theme-bg-primary text-theme-text-primary border border-theme-border rounded-full font-bold transition-all"
                >
                  Sair
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default EcoMemory;
