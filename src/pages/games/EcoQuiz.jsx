import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Brain, CheckCircle2, XCircle, Trophy, Star, ChevronRight, AlertCircle, Menu, X, RotateCcw, LogOut, Sparkles, Leaf, Zap, Droplets, Heart, HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useGameState } from '../../context/GameStateContext';
import { loadManualQuestions, recordManualQuestionOutcome } from '../../utils/quizData';
import { recordQuestionOutcome } from '../../services/gemini';
import api from '../../services/api';
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

  const [isAiMode, setIsAiMode] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('sustentabilidade');

  // Seleção de Idade
  const handleAgeSelect = async (age) => {
    playSelect();
    setSelectedAge(age);

    if (isAiMode) {
      setLoadingAi(true);
      console.log('Iniciando geração de quiz IA...', { age, topic: selectedTopic });

      try {
        const response = await api.post('/quiz/generate', {
          age,
          topic: selectedTopic || 'sustentabilidade e energia renovável',
          count: 3
        });

        console.log('Resposta da IA recebida:', response.status);

        if (response.data && Array.isArray(response.data)) {
          setQuestions(response.data);
        } else {
          console.error('Resposta inválida da IA:', response.data);
          throw new Error('Formato inválido da IA');
        }
      } catch (error) {
        console.error('Erro DETALHADO ao gerar quiz com IA:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });

        playError();
        const serverMsg = error.response?.data?.message || error.message;
        alert(`O Professor Eco teve um probleminha técnico! 😅\nErro: ${serverMsg}\nCarregando perguntas manuais...`);

        // Fallback to manual questions
        const qs = loadManualQuestions(age);
        setQuestions(qs);
      } finally {
        setLoadingAi(false);
        resetQuiz();
      }
    } else {
      // Standard Mode
      const qs = loadManualQuestions(age);
      setQuestions(qs);
      resetQuiz();
    }
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

  // ... (rest of logic handles)

  const handleOptionClick = (optionIndex) => {
    if (showExplanation) return;

    setSelectedOption(optionIndex);
    setShowExplanation(true);

    // Check if correct
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return; // safety

    const correct = optionIndex === currentQ.correct;
    setIsCorrect(correct);

    if (correct) {
      playSuccess(); // or playWin()
      setScore(prev => prev + 1);
      updateStat('questionsAnswered', 1);
      addScore(100);
    } else {
      playError();
    }

    // Record outcome appropriately
    if (isAiMode) {
      // AI mode tracking if needed, or generic
      recordManualQuestionOutcome({ questionId: currentQ.id, age: selectedAge, correct });
    } else {
      recordManualQuestionOutcome({ questionId: currentQ.id, age: selectedAge, correct });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setQuizCompleted(true);
    if (score >= 4) {
      playWin();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      completeLevel(1); // Exemplo de nível
    } else {
      // playLose() or similar
    }
  };

  // Renderização da Tela Inicial (Seleção de Idade)
  if (!selectedAge) {
    return (
      <div className="min-h-screen pt-20 px-4 flex flex-col items-center max-w-4xl mx-auto">
        <Link to="/games" className="self-start mb-8 flex items-center gap-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar ao Arcade</span>
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 w-full"
        >
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-indigo-500/30">
            <Brain className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-4xl font-display font-bold text-theme-text-primary mb-4">EcoQuiz</h1>
          <p className="text-theme-text-secondary text-lg max-w-lg mx-auto mb-8">
            Escolha sua idade para começar o desafio de conhecimentos sustentáveis!
          </p>

          {/* AI Toggle Section */}
          <div className="flex items-center justify-center gap-3 mb-8 w-full relative z-40">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                playSelect();
                setIsAiMode(!isAiMode);
              }}
              className={`
                px-6 py-3 rounded-xl border flex items-center gap-2 transition-all font-bold shadow-lg
                ${isAiMode
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-transparent text-white ring-2 ring-indigo-500/50'
                  : 'bg-theme-bg-secondary border-theme-border text-theme-text-secondary hover:border-indigo-500 hover:text-indigo-500'
                }
              `}
            >
              <Sparkles className={`w-5 h-5 ${isAiMode ? 'text-yellow-300 animate-pulse' : ''}`} />
              <span>
                {isAiMode ? 'Modo IA Ativado!' : 'Ativar Modo IA'}
              </span>
              {isAiMode && <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-xs">BETA</span>}
            </motion.button>

            {/* Help Button with Tooltip */}
            <div className="relative group">
              <button
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-theme-bg-secondary border border-theme-border text-theme-text-secondary hover:text-indigo-500 hover:border-indigo-500 transition-colors shadow-sm cursor-help"
                aria-label="Sobre o modo IA"
              >
                <HelpCircle className="w-6 h-6" />
              </button>

              {/* Tooltip Content */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-72 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-indigo-100 dark:border-indigo-900/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-bottom scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto">
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 border-b border-r border-indigo-100 dark:border-indigo-900/50 rotate-45"></div>

                <h3 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Diferença dos Modos
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex gap-3 items-start">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-200">Modo IA</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                        Perguntas infinitas e inéditas criadas na hora pelo Professor Eco!
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700/50"></div>

                  <div className="flex gap-3 items-start">
                    <div className="p-1.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-slate-500 shrink-0 mt-0.5">
                      <Leaf className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-200">Modo Clássico</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                        Perguntas selecionadas especialmente para você aprender brincando.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </motion.div>

        {/* Age Selection Input */}
        {/* Age Selection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
          {[10, 11, 12, 13, 14].map((age) => (
            <motion.button
              key={age}
              whileHover={{ scale: 1.05, translateY: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAgeSelect(age)}
              className="aspect-square backdrop-blur-md rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 group bg-theme-bg-secondary/80 border-theme-border hover:bg-theme-bg-tertiary hover:border-indigo-500"
            >
              <span className="text-4xl font-bold transition-colors text-theme-text-primary group-hover:text-indigo-400">{age}</span>
              <span className="text-sm text-theme-text-tertiary uppercase tracking-wider">Anos</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // Loading State
  if (loadingAi) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xl font-bold text-theme-text-primary animate-pulse">
          Professor Eco está criando seu desafio... 🌿⚡
        </p>
        <p className="text-theme-text-secondary text-sm">Isso pode levar alguns segundos.</p>
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
          className="bg-theme-bg-secondary/80 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-theme-border shadow-2xl relative overflow-hidden text-center"
        >
          <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${isVictory ? 'from-indigo-500 via-purple-500 to-pink-500' : 'from-red-500 via-orange-500 to-yellow-500'}`} />

          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ${isVictory ? 'bg-yellow-100 dark:bg-yellow-500/10 ring-yellow-500/20' : 'bg-red-100 dark:bg-red-500/10 ring-red-500/20'}`}>
            {isVictory ? (
              <Trophy className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            )}
          </div>

          <h2 className="text-3xl font-display font-bold text-theme-text-primary mb-2">
            {isVictory ? 'Quiz Completado!' : 'Que pena!'}
          </h2>
          <p className="text-theme-text-secondary mb-8 leading-loose">
            {isVictory
              ? <>Você acertou <span className="inline-flex items-center justify-center px-3 py-1 bg-slate-200 dark:bg-white/10 backdrop-blur-md border border-slate-300 dark:border-white/20 rounded-lg text-slate-800 dark:text-white font-bold mx-1">{score}</span> de <span className="inline-flex items-center justify-center px-3 py-1 bg-slate-200 dark:bg-white/10 backdrop-blur-md border border-slate-300 dark:border-white/20 rounded-lg text-slate-800 dark:text-white font-bold mx-1">{totalQuestions}</span> perguntas.</>
              : <>Você acertou apenas <span className="inline-flex items-center justify-center px-3 py-1 bg-red-100 dark:bg-red-500/10 backdrop-blur-md border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 font-bold mx-1">{score}</span>. Precisa de <span className="inline-flex items-center justify-center px-3 py-1 bg-green-100 dark:bg-green-500/10 backdrop-blur-md border border-green-200 dark:border-green-500/20 rounded-lg text-green-600 dark:text-green-400 font-bold mx-1">4</span> para vencer.</>
            }
          </p>

          <div className="bg-theme-bg-tertiary/50 p-6 rounded-xl border border-theme-border/50 mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-theme-text-tertiary">XP Ganho</span>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] font-bold ${isVictory ? 'bg-yellow-100 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20 text-yellow-700 dark:text-yellow-400' : 'bg-theme-bg-tertiary border-theme-border text-theme-text-tertiary'}`}>
                <Star className={`w-5 h-5 ${isVictory ? 'fill-yellow-600 dark:fill-yellow-400 text-yellow-600 dark:text-yellow-400' : 'text-theme-text-tertiary'}`} />
                <span>+{isVictory ? score * 100 : 0}</span>
              </div>
            </div>
            <div className="w-full bg-theme-bg-tertiary h-2 rounded-full overflow-hidden">
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
              className="w-full py-3 bg-theme-bg-tertiary hover:bg-theme-bg-secondary text-theme-text-secondary rounded-xl font-bold transition-all border border-theme-border"
            >
              Voltar ao Arcade
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Renderização do Jogo (Pergunta Atual)
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-theme-text-primary text-xl">Erro ao carregar perguntas. Tente recarregar.</div>
        <button onClick={() => setSelectedAge(null)} className="mt-4 text-indigo-400">Voltar</button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-theme-text-primary text-xl">Pergunta não encontrada.</div>
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-theme-backdrop z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute top-20 right-4 z-50 w-64 bg-theme-bg-secondary rounded-2xl border border-theme-border shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-theme-border">
                <h3 className="text-theme-text-primary font-bold font-display">Op{'\u00E7'}{'\u00F5'}es</h3>
              </div>
              <div className="p-2 flex flex-col gap-1">
                <button
                  onClick={resetQuiz}
                  className="w-full flex items-center gap-3 p-3 text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary rounded-xl transition-all text-left"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Reiniciar Quiz</span>
                </button>
                <button
                  onClick={handleBackToAgeSelection}
                  className="w-full flex items-center gap-3 p-3 text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary rounded-xl transition-all text-left"
                >
                  <Brain className="w-5 h-5" />
                  <span>Trocar Idade</span>
                </button>
                <button
                  onClick={() => navigate('/games')}
                  className="w-full flex items-center gap-3 p-3 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sair do Jogo</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="w-full flex justify-between items-center mb-8 relative z-30">
        <button
          onClick={handleBackToAgeSelection}
          className="flex items-center gap-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Trocar Idade</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-theme-bg-secondary/50 backdrop-blur-md border border-theme-border/50 rounded-xl text-theme-text-secondary font-mono font-bold shadow-sm">
            Questão <span className="text-theme-text-primary">{currentQuestionIndex + 1}</span><span className="text-theme-text-tertiary mx-1">/</span><span className="text-theme-text-tertiary">{questions.length}</span>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 rounded-lg transition-colors ${isMenuOpen ? 'bg-theme-bg-tertiary text-theme-text-primary' : 'text-theme-text-tertiary hover:text-theme-text-primary hover:bg-theme-bg-tertiary'}`}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Card da Pergunta */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <div className="bg-theme-bg-secondary/80 backdrop-blur-md rounded-2xl p-8 border border-theme-border shadow-xl mb-6">
            <h2 className="text-2xl font-bold text-theme-text-primary mb-8 leading-relaxed">
              {currentQuestion.question}
            </h2>

            <div className="flex flex-col gap-3">
              {currentQuestion.options.map((option, index) => {
                let buttonStyle = "bg-theme-bg-tertiary/50 hover:bg-theme-bg-tertiary border-theme-border";
                let icon = null;

                if (showExplanation) {
                  if (index === currentQuestion.correct) {
                    buttonStyle = "bg-green-100 dark:bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-400";
                    icon = <CheckCircle2 className="w-5 h-5" />;
                  } else if (index === selectedOption) {
                    buttonStyle = "bg-red-100 dark:bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-500";
                    icon = <XCircle className="w-5 h-5" />;
                  } else {
                    buttonStyle = "bg-theme-bg-primary/50 border-theme-border opacity-50";
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
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`
                  rounded-xl p-6 border mb-6 backdrop-blur-md
                  ${isCorrect
                    ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'
                    : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isCorrect ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400'}`}>
                    {isAiMode ? <Sparkles className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className={`font-bold mb-1 ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-indigo-700 dark:text-indigo-400'}`}>
                      {isCorrect ? 'Muito bem!' : 'Sabia dessa?'}
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {isAiMode && <span className="text-indigo-800 dark:text-indigo-300 font-bold mr-2 text-xs uppercase tracking-wider">Dica da IA:</span>}
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {showExplanation && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleNextQuestion}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <span>{currentQuestionIndex + 1 === questions.length ? 'Ver Resultado' : 'Próxima Pergunta'}</span>
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default EcoQuiz;
