import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Brain, CheckCircle2, XCircle, Trophy, Star, Home, ChevronRight, AlertCircle, Menu, X, RotateCcw, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useGameState } from '../../context/GameStateContext';
import { loadManualQuestions, recordManualQuestionOutcome } from '../../utils/quizData';
import confetti from 'canvas-confetti';
import { playClick, playSelect, playError, playWin, playSuccess } from '../../utils/soundEffects';

const EcoQuiz = () => {
  const navigate = useNavigate();
  const { addScore, completeLevel, updateStat } = useGameState();
  
  // Estados do Jogo
  const [selectedAge, setSelectedAge] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [questions, setQuestions] = useState([]);

  const MotionDiv = motion.div;
  const MotionButton = motion.button;

  // Seleção de Idade
  const handleAgeSelect = async (age) => {
    playSelect();
    setSelectedAge(age);
    const qs = loadManualQuestions(age);
    setQuestions(qs);
    resetQuiz();
  };
  
  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowExplanation(false);
    setSelectedOption(null);
    setIsCorrect(null);
    setQuizCompleted(false);
    setIsMenuOpen(false);
  };

  const handleBackToAgeSelection = () => {
    setSelectedAge(null);
    setIsMenuOpen(false);
    setQuestions([]); // Limpa perguntas anteriores
  };

  // Lógica de Resposta
  const handleOptionClick = (optionIndex) => {
    if (showExplanation) return; // Evita duplo clique

    playClick();
    setSelectedOption(optionIndex);
    
    // CORREÇÃO: Usar o estado 'questions' em vez de QUIZ_DATA
    const currentQuestion = questions[currentQuestionIndex];
    const correct = optionIndex === currentQuestion.correct;
    
    setIsCorrect(correct);
    setShowExplanation(true);

    recordManualQuestionOutcome({
      questionId: currentQuestion.id,
      age: selectedAge,
      correct
    });

    if (correct) {
      playSuccess();
      setScore(prev => prev + 1);
    } else {
      playError();
    }
  };

  // Próxima Pergunta
  const handleNextQuestion = () => {
    playClick();
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setShowExplanation(false);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      finishQuiz();
    }
  };

  // Finalizar Quiz
  const finishQuiz = () => {
    setQuizCompleted(true);
    updateStat('quiz_completions', 1);
    updateStat('total_games_played', 1);
    
    const isVictory = score >= 4;

    if (isVictory) {
      playWin();
      
      // Calcula XP baseado no acerto (100XP por acerto)
      const xpEarned = score * 100;
      if (xpEarned > 0) {
        addScore(xpEarned);
        completeLevel('quiz', 1);
      }

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#22d3ee', '#facc15']
      });
    } else {
      // Som de derrota (opcional, usando playError por enquanto se não houver playDefeat)
      // playError(); 
      // Não adiciona XP em caso de derrota
    }
  };

  // Renderização da Tela Inicial (Seleção de Idade)
  if (!selectedAge) {
    return (
      <div className="min-h-screen pt-20 px-4 flex flex-col items-center max-w-4xl mx-auto">
        <Link to="/games" className="self-start mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar ao Arcade</span>
        </Link>

        <MotionDiv 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-indigo-500/30">
            <Brain className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-4">EcoQuiz</h1>
          <p className="text-slate-400 text-lg max-w-lg mx-auto">
            Escolha sua idade para começar o desafio de conhecimentos sustentáveis!
          </p>
        </MotionDiv>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
          {[10, 11, 12, 13, 14].map((age) => (
            <MotionButton
              key={age}
              whileHover={{ scale: 1.05, translateY: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAgeSelect(age)}
              className="aspect-square bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 hover:border-indigo-500 hover:bg-slate-700/80 transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <span className="text-4xl font-bold text-white group-hover:text-indigo-400 transition-colors">{age}</span>
              <span className="text-sm text-slate-400 uppercase tracking-wider">Anos</span>
            </MotionButton>
          ))}
        </div>
      </div>
    );
  }

  // Renderização do Resultado Final
  if (quizCompleted) {
    const isVictory = score >= 4;
    const totalQuestions = questions.length;
    const percentage = (score / totalQuestions) * 100;

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-slate-700 shadow-2xl relative overflow-hidden text-center"
        >
          <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${isVictory ? 'from-indigo-500 via-purple-500 to-pink-500' : 'from-red-500 via-orange-500 to-yellow-500'}`} />
          
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ${isVictory ? 'bg-yellow-500/10 ring-yellow-500/20' : 'bg-red-500/10 ring-red-500/20'}`}>
            {isVictory ? (
              <Trophy className="w-12 h-12 text-yellow-400" />
            ) : (
              <XCircle className="w-12 h-12 text-red-400" />
            )}
          </div>

          <h2 className="text-3xl font-display font-bold text-white mb-2">
            {isVictory ? 'Quiz Completado!' : 'Que pena!'}
          </h2>
          <p className="text-slate-400 mb-8 leading-loose">
            {isVictory 
              ? <>Você acertou <span className="inline-flex items-center justify-center px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] text-white font-bold mx-1">{score}</span> de <span className="inline-flex items-center justify-center px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] text-white font-bold mx-1">{totalQuestions}</span> perguntas.</>
              : <>Você acertou apenas <span className="inline-flex items-center justify-center px-3 py-1 bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,50,50,0.2)] text-red-400 font-bold mx-1">{score}</span>. Precisa de <span className="inline-flex items-center justify-center px-3 py-1 bg-green-500/10 backdrop-blur-md border border-green-500/20 rounded-lg shadow-[inset_0_1px_0_0_rgba(50,255,50,0.2)] text-green-400 font-bold mx-1">4</span> para vencer.</>
            }
          </p>

          <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50 mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400">XP Ganho</span>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] font-bold ${isVictory ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-slate-700/30 border-slate-700/50 text-slate-500'}`}>
                <Star className={`w-5 h-5 ${isVictory ? 'fill-yellow-400' : 'text-slate-600'}`} />
                <span>+{isVictory ? score * 100 : 0}</span>
              </div>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${isVictory ? 'bg-yellow-400' : 'bg-red-400'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setSelectedAge(null)}
              className={`w-full py-3 text-white rounded-xl font-bold transition-all ${isVictory ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-red-600 hover:bg-red-500'}`}
            >
              {isVictory ? 'Escolher Outra Idade' : 'Tentar Novamente'}
            </button>
            <button
              onClick={() => navigate('/games')}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold transition-all"
            >
              Voltar ao Arcade
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Renderização do Jogo (Pergunta Atual)
  // questions já é obtido do state
  
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Erro ao carregar perguntas. Tente recarregar.</div>
        <button onClick={() => setSelectedAge(null)} className="mt-4 text-indigo-400">Voltar</button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
     return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Pergunta não encontrada.</div>
        <button onClick={() => setSelectedAge(null)} className="mt-4 text-indigo-400">Voltar</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-12 pb-12 px-4 flex flex-col items-center max-w-3xl mx-auto relative">
      {/* Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <MotionDiv 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            <MotionDiv
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute top-20 right-4 z-50 w-64 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-white font-bold font-display">Opções</h3>
              </div>
              <div className="p-2 flex flex-col gap-1">
                <button 
                  onClick={resetQuiz}
                  className="w-full flex items-center gap-3 p-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-all text-left"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Reiniciar Quiz</span>
                </button>
                <button 
                  onClick={handleBackToAgeSelection}
                  className="w-full flex items-center gap-3 p-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-all text-left"
                >
                  <Brain className="w-5 h-5" />
                  <span>Trocar Idade</span>
                </button>
                <button 
                  onClick={() => navigate('/games')}
                  className="w-full flex items-center gap-3 p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sair do Jogo</span>
                </button>
              </div>
            </MotionDiv>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="w-full flex justify-between items-center mb-8 relative z-30">
        <button 
          onClick={handleBackToAgeSelection}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Trocar Idade</span>
        </button>
        
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl text-slate-200 font-mono font-bold shadow-sm">
            Questão <span className="text-white">{currentQuestionIndex + 1}</span><span className="text-slate-500 mx-1">/</span><span className="text-slate-400">{questions.length}</span>
          </div>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 rounded-lg transition-colors ${isMenuOpen ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Card da Pergunta */}
      <AnimatePresence mode="wait">
        <MotionDiv
          key={currentQuestion.id}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-8 border border-slate-700 shadow-xl mb-6">
            <h2 className="text-2xl font-bold text-white mb-8 leading-relaxed">
              {currentQuestion.question}
            </h2>

            <div className="flex flex-col gap-3">
              {currentQuestion.options.map((option, index) => {
                let buttonStyle = "bg-slate-700/50 hover:bg-slate-600/50 border-slate-600";
                let icon = null;

                if (showExplanation) {
                  if (index === currentQuestion.correct) {
                    buttonStyle = "bg-green-500/20 border-green-500/50 text-green-400";
                    icon = <CheckCircle2 className="w-5 h-5" />;
                  } else if (index === selectedOption) {
                    buttonStyle = "bg-red-500/20 border-red-500/50 text-red-400";
                    icon = <XCircle className="w-5 h-5" />;
                  } else {
                    buttonStyle = "bg-slate-800/50 border-slate-700 opacity-50";
                  }
                } else if (selectedOption === index) {
                  buttonStyle = "bg-indigo-600 border-indigo-500 text-white";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleOptionClick(index)}
                    disabled={showExplanation}
                    className={`
                      w-full p-4 rounded-xl border-2 text-left font-medium transition-all flex justify-between items-center
                      ${buttonStyle}
                    `}
                  >
                    <span>{option}</span>
                    {icon}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explicação e Próxima Pergunta */}
          <AnimatePresence>
            {showExplanation && (
              <MotionDiv
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`
                  rounded-xl p-6 border mb-6 backdrop-blur-md
                  ${isCorrect 
                    ? 'bg-green-500/10 border-green-500/20' 
                    : 'bg-indigo-500/10 border-indigo-500/20'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-6 h-6 shrink-0 ${isCorrect ? 'text-green-400' : 'text-indigo-400'}`} />
                  <div>
                    <h3 className={`font-bold mb-1 ${isCorrect ? 'text-green-400' : 'text-indigo-400'}`}>
                      {isCorrect ? 'Muito bem!' : 'Sabia dessa?'}
                    </h3>
                    <p className="text-slate-300 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
                </MotionDiv>
            )}
          </AnimatePresence>

          {showExplanation && (
            <MotionButton
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleNextQuestion}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <span>{currentQuestionIndex + 1 === questions.length ? 'Ver Resultado' : 'Próxima Pergunta'}</span>
              <ChevronRight className="w-5 h-5" />
            </MotionButton>
          )}
        </MotionDiv>
      </AnimatePresence>
    </div>
  );
};

export default EcoQuiz;
