import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, HelpCircle, Trophy, Zap, Brain, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useGameState } from '../../context/GameStateContext';
import { playSelect, playSuccess, playError, playWin } from '../../utils/soundEffects';

const pickRandomItem = (items) => items[Math.floor(Math.random() * items.length)];

// Emojis e Knowledge Base
const EMOJIS = ['☀️','☀️','🌬️','🌬️','💧','💧','🌊','🌊','🌱','🌱','⚡','⚡','🌍','🌍','♻️','♻️','🔋','🔋','🌿','🌿','💣','💣','💣','💣'];
const KNOWLEDGE_BASE = [
  // Solar
  {q:"O que a energia solar utiliza?", a:["Luz do Sol","Calor do núcleo","Vento"], c:0},
  {q:"Painéis solares geram eletricidade via:", a:["Efeito Fotovoltaico","Combustão","Fissão"], c:0},
  {q:"Vantagem da energia solar:", a:["Renovável e limpa","Funciona à noite","Gera lixo nuclear"], c:0},
  
  // Eólica
  {q:"O que move as turbinas eólicas?", a:["Vento","Água","Vapor"], c:0},
  {q:"Qual tecnologia otimiza eólica?", a:["RNNs sequenciais","Carvão","Sorte"], c:0},
  {q:"Melhor local para parque eólico:", a:["Costa ventosa","Floresta densa","Caverna"], c:0},

  // Hidrelétrica
  {q:"Fonte da energia hidrelétrica:", a:["Água em movimento","Fogo","Urânio"], c:0},
  {q:"Maior usina do Brasil:", a:["Itaipu","Angra 1","Belo Monte"], c:0},
  {q:"Impacto negativo de grandes represas:", a:["Alagamento de áreas","Emissão de fumaça","Resíduos tóxicos"], c:0},

  // Biomassa
  {q:"Bioenergia usa como combustível:", a:["Matéria orgânica","Plástico","Vidro"], c:0},
  {q:"Exemplo de biomassa:", a:["Bagaço de cana","Pneu velho","Areia"], c:0},
  {q:"Vantagem da biomassa:", a:["Reaproveita resíduos","Não gera energia","É infinita"], c:0},

  // Geotérmica
  {q:"Energia geotérmica vem de onde?", a:["Calor da Terra","Ondas do mar","Raios lunares"], c:0},
  {q:"Onde é comum usar geotérmica?", a:["Áreas vulcânicas","Desertos gelados","No espaço"], c:0},

  // Maré/Ondas
  {q:"Energia maremotriz usa:", a:["Movimento das marés","Sal da água","Peixes"], c:0},
  {q:"Vantagem da maré:", a:["Previsível","Aleatória","Poluente"], c:0},

  // Tecnologias Avançadas (Pinheiro 2025)
  {q:"Como IA ajuda na energia solar?", a:["Prevendo nuvens","Limpando painéis","Pintando o sol"], c:0},
  {q:"Como solar reduz CO2?", a:["Substituindo fósseis","Absorvendo fumaça","Congelando o ar"], c:0},
  {q:"O que são Smart Grids?", a:["Redes inteligentes","Jogos de tabuleiro","Cabos coloridos"], c:0}
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
    for(let i=arr.length-1; i>0; i--){ 
      const j=Math.floor(Math.random()*(i+1)); 
      [arr[i],arr[j]]=[arr[j],arr[i]]; 
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
      setTimeout(() => {
        setCards(prev => prev.map((c, i) => 
          (i === idx1 || i === idx2) ? { ...c, isMatched: true, isFlipped: false } : c
        ));
        resetTurn();
        checkWin(matches + 1);
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
      // alert(`Correto! +${quiz.reward}`);
    } else {
      setScore(s => s - 5);
      // alert("Errado! -5");
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
    // Only reshuffle unmatched cards
    const unmatchedIndices = cards.map((c, i) => !c.isMatched ? i : -1).filter(i => i !== -1);
    const unmatchedValues = unmatchedIndices.map(i => cards[i].val);
    const shuffledValues = shuffle(unmatchedValues);
    
    setCards(prev => {
      const newCards = [...prev];
      unmatchedIndices.forEach((idx, i) => {
        newCards[idx].val = shuffledValues[i];
        newCards[idx].isFlipped = false;
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
      updateStat('total_games_played', 1);
    }
  };

  useEffect(() => {
    if (turns >= 60 && !gameWon) {
      setGameOver(true);
    }
  }, [turns, gameWon]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-24">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
        <Link to="/games" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </Link>
        <div className="flex gap-4">
            <div className="bg-slate-800 px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-700">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-mono text-xl">{score}</span>
            </div>
            <div className="bg-slate-800 px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-700">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                <span className="font-mono text-xl">{turns}/60</span>
            </div>
            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              className="bg-slate-800 px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-eco-green-light" />}
            </button>
        </div>
      </div>

      {/* Feedback Message */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-xl font-bold text-lg flex items-center gap-2 ${
              feedback.type === 'danger' ? 'bg-red-500 text-white' : 
              feedback.type === 'warning' ? 'bg-amber-500 text-black' : 
              'bg-blue-500 text-white'
            }`}
          >
            {feedback.type === 'danger' && <AlertTriangle className="w-6 h-6" />}
            {feedback.type === 'warning' && <AlertTriangle className="w-6 h-6" />}
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-4 sm:grid-cols-6 gap-3 sm:gap-4 perspective-1000">
        {cards.map((card, i) => (
          <motion.div
            key={card.id}
            className={`aspect-[3/4] relative cursor-pointer group ${shaking.includes(i) ? 'animate-shake' : ''}`}
            onClick={() => handleCardClick(i)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className={`w-full h-full transition-all duration-500 transform-style-3d ${card.isFlipped ? 'rotate-y-180' : ''} ${card.isMatched ? 'opacity-0 pointer-events-none' : ''}`}>
              {/* Front (Back of card visually) */}
              <div className="absolute inset-0 backface-hidden bg-eco-green rounded-xl flex items-center justify-center border-2 border-green-600 shadow-lg">
                <span className="text-2xl sm:text-3xl">🌱</span>
              </div>
              {/* Back (Face of card visually) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-xl flex items-center justify-center border-2 border-eco-green shadow-lg">
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
              className="bg-slate-800 border border-slate-700 p-6 rounded-2xl max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4 text-amber-500">
                <AlertTriangle className="w-8 h-8" />
                <h2 className="text-2xl font-bold">{quiz.needsReshuffle ? 'PERIGO!' : 'Quiz'}</h2>
              </div>
              <p className="text-lg mb-6 text-slate-200">{quiz.q}</p>
              <div className="space-y-3">
                {quiz.a.map((ans, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuizAnswer(idx)}
                    className="w-full p-4 bg-slate-700 hover:bg-eco-green hover:text-white rounded-xl transition-all text-left font-medium"
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
              className="bg-slate-800 border border-eco-green p-8 rounded-2xl max-w-md w-full text-center shadow-2xl"
            >
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Vitória!</h2>
              <p className="text-slate-400 mb-6">Você energizou o futuro com {score} pontos!</p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={initGame}
                  className="px-6 py-3 bg-eco-green hover:bg-green-600 text-white rounded-full font-bold transition-all"
                >
                  Jogar Novamente
                </button>
                <Link 
                  to="/games"
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold transition-all"
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
              className="bg-slate-800 border border-red-500 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl"
            >
              <VolumeX className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Fim de Jogo!</h2>
              <p className="text-slate-400 mb-6">Seus turnos acabaram. A energia se esgotou!</p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={initGame}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold transition-all"
                >
                  Tentar Novamente
                </button>
                <Link 
                  to="/games"
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold transition-all"
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
