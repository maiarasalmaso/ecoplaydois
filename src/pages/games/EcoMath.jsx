import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calculator, Sun, Wind, Droplets, Zap, CheckCircle2, XCircle, ZoomIn, ZoomOut, Contrast, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGameState } from '../../context/GameStateContext';
import { playClick, playSuccess, playError } from '../../utils/soundEffects';
import api from '../../services/api';
import confetti from 'canvas-confetti';

// --- Dados de Aprendizagem e Contexto ---
const TOPICS = {
  solar: {
    icon: <Sun className="w-8 h-8 text-yellow-400" />,
    color: 'from-yellow-400 to-orange-500',
    title: 'Energia Solar',
    fact: 'Um painel solar de 1m² pode gerar cerca de 150W de potência em um dia ensolarado.',
    unit: 'kWh'
  },
  wind: {
    icon: <Wind className="w-8 h-8 text-cyan-400" />,
    color: 'from-cyan-400 to-blue-500',
    title: 'Energia Eólica',
    fact: 'Uma turbina eólica moderna pode abastecer cerca de 1.500 casas por mês.',
    unit: 'MW'
  },
  hydro: {
    icon: <Droplets className="w-8 h-8 text-blue-400" />,
    color: 'from-blue-400 to-indigo-500',
    title: 'Energia Hidrelétrica',
    fact: 'A energia potencial da água caindo é convertida em energia cinética para girar turbinas.',
    unit: 'MW'
  },
  biomass: {
    icon: <Zap className="w-8 h-8 text-green-400" />,
    color: 'from-green-400 to-green-600',
    title: 'Biomassa',
    fact: 'Resíduos orgânicos como bagaço de cana podem gerar eletricidade limpa.',
    unit: 'toneladas'
  }
};

// --- Gerador de Problemas Matemáticos ---
const generateProblem = (difficulty) => {
  const types = ['solar', 'wind', 'hydro', 'biomass'];
  const type = types[Math.floor(Math.random() * types.length)];
  const topic = TOPICS[type];

  let q, a, explanation;

  // Dificuldade 1: Adição/Subtração simples (Fundamental I)
  if (difficulty === 1) {
    const val1 = Math.floor(Math.random() * 20) + 5;
    const val2 = Math.floor(Math.random() * 10) + 1;

    switch (type) {
      case 'solar': {
        q = `Um sistema solar gerou ${val1} kWh de manhã e ${val2} kWh à tarde. Qual o total gerado no dia?`;
        a = val1 + val2;
        explanation = `Soma: ${val1} + ${val2} = ${a} kWh. O sol trabalha o dia todo!`;
        break;
      }
      case 'wind': {
        q = `Um parque eólico gera ${val1} MW, mas perdeu ${val2} MW por ventos fracos. Quanto está gerando agora?`;
        a = val1 - val2;
        explanation = `Subtração: ${val1} - ${val2} = ${a} MW. O vento varia, mas é limpo!`;
        break;
      }
      case 'hydro': {
        q = `Uma turbina hidrelétrica gera ${val1} MW e uma segunda gera ${val2} MW. Juntas, quanto geram?`;
        a = val1 + val2;
        explanation = `Soma: ${val1} + ${val2} = ${a} MW. A força da água somada é poderosa.`;
        break;
      }
      case 'biomass': {
        q = `Uma usina recebeu ${val1} toneladas de resíduos e depois mais ${val2} toneladas. Qual o total recebido?`;
        a = val1 + val2;
        explanation = `Soma: ${val1} + ${val2} = ${a} toneladas. Menos lixo no aterro!`;
        break;
      }
    }
  }
  // Dificuldade 2: Multiplicação/Divisão básica (Fundamental I/II)
  else if (difficulty === 2) {
    const val1 = Math.floor(Math.random() * 10) + 2; // Quantidade (painéis, turbinas, dias)
    const val2 = Math.floor(Math.random() * 50) + 10; // Valor unitário (kWh, MW, toneladas)

    switch (type) {
      case 'solar': {
        q = `Se cada painel solar gera ${val2} kWh por mês, quanto geram ${val1} painéis?`;
        a = val1 * val2;
        explanation = `Multiplicação: ${val1} painéis x ${val2} kWh = ${a} kWh.`;
        break;
      }
      case 'wind': {
        q = `Um parque tem ${val1} turbinas, cada uma gerando ${val2} MW. Qual a geração total?`;
        a = val1 * val2;
        explanation = `Multiplicação: ${val1} turbinas x ${val2} MW = ${a} MW.`;
        break;
      }
      case 'hydro': {
        const totalMW = val1 * val2; // val1 turbinas * val2 MW
        q = `Uma hidrelétrica tem ${val1} turbinas iguais e gera um total de ${totalMW} MW. Quanto gera cada turbina?`;
        a = val2;
        explanation = `Divisão: ${totalMW} MW ÷ ${val1} turbinas = ${val2} MW por turbina.`;
        break;
      }
      case 'biomass': {
        const totalTons = val1 * val2; // val1 dias * val2 tons/dia
        q = `Uma usina processou ${totalTons} toneladas de biomassa em ${val1} dias iguais. Quanto processou por dia?`;
        a = val2;
        explanation = `Divisão: ${totalTons} ÷ ${val1} = ${val2} toneladas por dia.`;
        break;
      }
    }
  }
  // Dificuldade 3: Porcentagem e Proporção (Fundamental II/Médio)
  else {
    const total = Math.floor(Math.random() * 500) + 100;
    const percent = [10, 20, 25, 50][Math.floor(Math.random() * 4)];

    switch (type) {
      case 'solar': {
        q = `Uma casa consome ${total} kWh. Se ${percent}% é suprido por painéis solares, quantos kWh vêm do sol?`;
        a = (total * percent) / 100;
        explanation = `Porcentagem: ${percent}% de ${total} = ${a} kWh. Economia na conta de luz!`;
        break;
      }
      case 'wind': {
        q = `A capacidade total da rede é ${total} MW. A energia eólica representa ${percent}%. Quantos MW são eólicos?`;
        a = (total * percent) / 100;
        explanation = `Porcentagem: ${percent}% de ${total} = ${a} MW.`;
        break;
      }
      case 'hydro': {
        const produced = total * (percent / 100);
        q = `Uma represa tem capacidade de ${total} MW e está operando a ${percent}% da capacidade (${Math.round(produced)} MW). Quantos MW está gerando?`;
        a = (total * percent) / 100;
        explanation = `Cálculo: ${percent}% de ${total} MW = ${a} MW.`;
        break;
      }
      case 'biomass': {
        q = `De ${total} toneladas de lixo coletado, ${percent}% é biomassa aproveitável. Quantas toneladas podem virar energia?`;
        a = (total * percent) / 100;
        explanation = `Porcentagem: ${percent}% de ${total} = ${a} toneladas. Reciclagem energética!`;
        break;
      }
    }
  }

  // Gera opções de resposta (1 correta, 3 erradas próximas)
  const options = new Set([a]);
  while (options.size < 4) {
    const noise = Math.floor(Math.random() * 10) - 5;
    const wrong = a + noise;
    if (wrong > 0 && wrong !== a) options.add(wrong);
  }

  return {
    type,
    topic,
    question: q,
    answer: a,
    options: Array.from(options).sort(() => Math.random() - 0.5),
    explanation
  };
};

const EcoMath = () => {
  const { addScore, updateStat } = useGameState();

  // Estados do Jogo
  const [gameState, setGameState] = useState('menu'); // menu, playing, result
  const [difficulty, setDifficulty] = useState(1);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null); // { type: 'correct' | 'wrong', msg }
  const [showLearning, setShowLearning] = useState(false);

  // Acessibilidade
  const [fontSize, setFontSize] = useState(1); // 1 = normal, 1.2 = large, 1.4 = xl
  const [highContrast, setHighContrast] = useState(false);

  // Iniciar Jogo
  const startGame = (level) => {
    setDifficulty(level);
    setScore(0);
    setStreak(0);
    setGameState('playing');
    nextProblem(level);
    playClick();
  };

  const nextProblem = (diff) => {
    setFeedback(null);
    setShowLearning(false);
    setCurrentProblem(generateProblem(diff));
  };

  const handleAnswer = (option) => {
    if (feedback) return;

    const isCorrect = Math.abs(option - currentProblem.answer) < 0.01;

    if (isCorrect) {
      playSuccess();
      const points = 10 * difficulty + (streak * 2);
      setScore(s => s + points);
      setStreak(s => s + 1);
      setFeedback({ type: 'correct', msg: 'Correto! Você é um gênio da energia!' });
      addScore(points);
      addScore(points);
      updateStat('eco_math_correct', 1);

      // Save score for this question (or accumulated game session logic could be better, but this works for arcade style)
      api.post('/games/score', {
        gameId: 'math',
        score: points
      }).catch(err => console.error('Failed to save score:', err));

      if (streak > 0 && streak % 3 === 0) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
    } else {
      playError();
      setStreak(0);
      setFeedback({ type: 'wrong', msg: `Ops! A resposta certa era ${currentProblem.answer}.` });
    }

    setShowLearning(true);
  };

  // Renderização
  const textSizeClass = fontSize === 1 ? 'text-base' : fontSize === 1.2 ? 'text-lg' : 'text-xl';
  // Use highContrast explicitly, otherwise use theme tokens
  const cardClass = highContrast
    ? 'bg-black text-yellow-300 border-yellow-300'
    : 'bg-theme-bg-secondary/80 backdrop-blur-md text-theme-text-primary border-theme-border shadow-xl';

  return (
    <div className={`min-h-screen pt-20 px-4 pb-8 flex flex-col items-center max-w-4xl mx-auto transition-colors duration-300`}>

      {/* Header e Controles de Acessibilidade */}
      <div className="w-full flex justify-between items-center mb-8 bg-theme-bg-secondary/50 p-4 rounded-2xl backdrop-blur-md border border-theme-border shadow-sm">
        <Link to="/games" className="flex items-center gap-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors">
          <ArrowLeft className="w-6 h-6" />
          <span className="hidden sm:inline">Voltar</span>
        </Link>

        <div className="flex items-center gap-4">


        </div>
      </div>

      {gameState === 'menu' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center w-full max-w-2xl"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
            <Calculator className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-theme-text-primary mb-4 sm:mb-6">Eco Math</h1>
          <p className={`text-theme-text-secondary mb-8 sm:mb-12 max-w-lg mx-auto ${textSizeClass} text-sm sm:text-base`}>
            Combine matemática e sustentabilidade! Resolva desafios reais sobre energia renovável para salvar o planeta.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { level: 1, label: 'Iniciante', desc: 'Adição e Subtração', icon: <Sun /> },
              { level: 2, label: 'Explorador', desc: 'Multiplicação Básica', icon: <Wind /> },
              { level: 3, label: 'Engenheiro', desc: 'Porcentagem e Razão', icon: <Zap /> }
            ].map((mode) => (
              <motion.button
                key={mode.level}
                whileHover={{ scale: 1.05, translateY: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startGame(mode.level)}
                className="bg-theme-bg-secondary border border-theme-border hover:border-green-500 p-6 rounded-2xl flex flex-col items-center gap-4 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 bg-theme-bg-tertiary rounded-full flex items-center justify-center text-green-600 dark:text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors">
                  {mode.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-theme-text-primary">{mode.label}</h3>
                  <p className="text-theme-text-tertiary text-sm">{mode.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {gameState === 'playing' && currentProblem && (
        <div className="w-full max-w-2xl">
          {/* Barra de Progresso e Score */}
          <div className="flex justify-between items-end mb-6 text-theme-text-primary">
            <div>
              <span className="text-theme-text-tertiary text-sm uppercase tracking-wider">Pontuação</span>
              <div className="text-3xl font-bold font-mono">{score}</div>
            </div>
            {streak > 1 && (
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1"
              >
                <Zap className="w-4 h-4 fill-current" /> {streak}x Combo
              </motion.div>
            )}
          </div>

          {/* Card da Questão */}
          <motion.div
            key={currentProblem.question}
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
            className={`rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl mb-6 relative overflow-hidden border-2 ${cardClass}`}
          >
            {/* Background Decorativo - opacity adjusted for light mode */}
            <div className={`absolute top-0 right-0 p-24 sm:p-32 opacity-10 dark:opacity-20 bg-gradient-to-br ${currentProblem.topic.color} rounded-full blur-xl -translate-y-1/2 translate-x-1/3`} />

            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-theme-bg-tertiary rounded-lg">{currentProblem.topic.icon}</div>
              <span className="font-bold text-xs sm:text-sm uppercase tracking-widest opacity-80 text-theme-text-secondary">{currentProblem.topic.title}</span>
            </div>

            <h2 className={`font-bold mb-6 sm:mb-8 leading-relaxed text-theme-text-primary ${fontSize > 1.2 ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}>
              {currentProblem.question}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 relative z-10">
              {currentProblem.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!feedback}
                  className={`
                    p-4 sm:p-6 rounded-xl font-bold text-lg border-2 transition-all
                    ${feedback
                      ? (Math.abs(opt - currentProblem.answer) < 0.01
                        ? 'bg-green-500 border-green-400 text-white'
                        : opt === feedback.selected ? 'bg-red-500 border-red-400 text-white' : 'bg-theme-bg-tertiary border-theme-border opacity-50 text-theme-text-secondary')
                      : 'bg-theme-bg-tertiary hover:bg-theme-bg-secondary border-theme-border hover:border-indigo-500 text-theme-text-primary hover:text-indigo-600 dark:hover:text-indigo-400'
                    }
                  `}
                >
                  {opt} {currentProblem.topic.unit && <span className="text-sm font-normal opacity-70 ml-1 text-theme-text-secondary">{currentProblem.topic.unit}</span>}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Feedback e Aprendizado */}
          <AnimatePresence>
            {showLearning && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-theme-bg-secondary/90 border border-theme-border rounded-2xl p-6 backdrop-blur-md shadow-xl"
              >
                <div className={`flex items-start gap-4 mb-4 ${feedback.type === 'correct' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {feedback.type === 'correct' ? <CheckCircle2 className="w-8 h-8 shrink-0" /> : <XCircle className="w-8 h-8 shrink-0" />}
                  <div>
                    <h3 className="text-xl font-bold">{feedback.msg}</h3>
                    <p className={`text-theme-text-secondary mt-2 ${textSizeClass}`}>{currentProblem.explanation}</p>
                  </div>
                </div>

                <div className="bg-theme-bg-tertiary rounded-xl p-4 flex gap-3 items-start border-l-4 border-yellow-400 shadow-inner">
                  <Lightbulb className="w-6 h-6 text-yellow-500 dark:text-yellow-400 shrink-0" />
                  <div>
                    <span className="text-yellow-600 dark:text-yellow-400 font-bold text-sm uppercase mb-1 block">Curiosidade Eco</span>
                    <p className="text-theme-text-secondary text-sm italic">"{currentProblem.topic.fact}"</p>
                  </div>
                </div>

                <button
                  onClick={() => nextProblem(difficulty)}
                  className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/25"
                >
                  Próximo Desafio <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default EcoMath;
