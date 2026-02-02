import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Filter, X } from 'lucide-react';

const GAMES = [
  {
    id: 'eco-memory',
    title: 'Eco Memória',
    path: '/games/memory',
    icon: '🎴',
    description: 'Encontre os pares de energias renováveis e evite as bombas de poluição! Treine sua memória e aprenda sobre fontes limpas.',
    color: 'yellow',
    category: 'Memória',
    minAge: 10,
    maxAge: 14
  },
  {
    id: 'eco-swipe',
    title: 'EcoSwipe',
    path: '/games/eco-swipe',
    icon: '⚡',
    description: 'Arraste as cartas para separar energias renováveis e não renováveis.',
    color: 'emerald',
    category: 'Arrasto',
    minAge: 10,
    maxAge: 14
  },
  {
    id: 'eco-snake',
    title: 'Eco Snake',
    path: '/games/eco-snake',
    icon: '🐍',
    description: 'Colete orgânicos, ative energia solar e complete desafios de reciclagem sem cair na poluição.',
    color: 'emerald',
    category: 'Arcade',
    minAge: 10,
    maxAge: 14
  },
  {
    id: 'sudoku',
    title: 'Eco Sudoku',
    path: '/games/sudoku',
    icon: '🧩',
    description: 'Organize os ícones de energia renovável na grade sem repetições. Um desafio clássico de lógica com um toque sustentável.',
    color: 'indigo',
    category: 'Lógica',
    minAge: 12,
    maxAge: 14
  },
  {
    id: 'eco-platformer',
    title: 'Eco Platformer',
    path: '/games/eco-platformer',
    icon: '🦸',
    description: 'Pule, corra e agache para coletar energias limpas, manter eficiência e derrotar o chefe fóssil.',
    color: 'eco-green',
    category: 'Plataforma',
    minAge: 10,
    maxAge: 14
  },
  {
    id: 'eco-math',
    title: 'Eco Math',
    path: '/games/eco-math',
    icon: '🧮',
    description: 'Resolva desafios matemáticos reais sobre energia renovável.',
    color: 'indigo',
    category: 'Educativo',
    minAge: 10,
    maxAge: 14
  },
  {
    id: 'quiz',
    title: 'Eco Quiz',
    path: '/games/quiz',
    icon: '🧠',
    description: 'Teste seus conhecimentos sobre sustentabilidade. Perguntas adaptadas para idades de 10 a 14 anos.',
    color: 'green',
    category: 'Educativo',
    minAge: 10,
    maxAge: 14
  },
  {
    id: 'passa-repassa',
    title: 'Passa ou Repassa',
    path: '/games/passa-repassa',
    icon: '🤝',
    description: 'Jogo em dupla online com perguntas rápidas de sustentabilidade e energia renovável.',
    color: 'cyan',
    category: 'Multiplayer',
    minAge: 10,
    maxAge: 14
  },
  {
    id: 'hangman',
    title: 'Jogo da Forca',
    path: '/games/hangman',
    icon: '🎯',
    description: 'Adivinhe palavras sobre energia renovável antes que a forca se complete!',
    color: 'green',
    category: 'Palavras',
    minAge: 10,
    maxAge: 14
  }
];

const AGE_RANGES = [
  { label: 'Todas', min: 0, max: 100 },
  { label: '10 anos', min: 10, max: 10 },
  { label: '11 anos', min: 11, max: 11 },
  { label: '12 anos', min: 12, max: 12 },
  { label: '13 anos', min: 13, max: 13 },
  { label: '14 anos', min: 14, max: 14 },
];

const GamesHub = () => {
  const [selectedRange, setSelectedRange] = useState(AGE_RANGES[0]);
  const MotionDiv = motion.div;

  // Filtrar jogos baseado na faixa etária selecionada
  const filteredGames = GAMES.filter(game => {
    const gameMin = game.minAge;
    const gameMax = game.maxAge;
    const filterMin = selectedRange.min;
    const filterMax = selectedRange.max;

    // Se "Todas" estiver selecionada, mostrar todos os jogos
    if (selectedRange.label === 'Todas') return true;

    // Verificar intersecção entre faixas etárias
    return Math.max(gameMin, filterMin) <= Math.min(gameMax, filterMax);
  });

  const getColorClasses = (color) => {
    const map = {
      yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', groupText: 'group-hover:text-yellow-300', groupBg: 'group-hover:bg-yellow-500/20', border: 'hover:border-yellow-500/50', dot: 'bg-yellow-500', grad: 'from-yellow-500/20 to-orange-600/20' },
      emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', groupText: 'group-hover:text-emerald-300', groupBg: 'group-hover:bg-emerald-500/20', border: 'hover:border-emerald-500/50', dot: 'bg-emerald-500', grad: 'from-teal-500/20 to-emerald-600/20' },
      indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', groupText: 'group-hover:text-indigo-300', groupBg: 'group-hover:bg-indigo-500/20', border: 'hover:border-indigo-500/50', dot: 'bg-indigo-500', grad: 'from-indigo-500/20 to-purple-600/20' },
      'eco-green': { bg: 'bg-green-500/10', text: 'text-green-400', groupText: 'group-hover:text-green-300', groupBg: 'group-hover:bg-green-500/20', border: 'hover:border-green-500/50', dot: 'bg-green-500', grad: 'from-green-500/20 to-lime-500/20' },
      green: { bg: 'bg-green-500/10', text: 'text-green-400', groupText: 'group-hover:text-green-300', groupBg: 'group-hover:bg-green-500/20', border: 'hover:border-green-500/50', dot: 'bg-green-500', grad: 'from-green-500/20 to-teal-600/20' },
      cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', groupText: 'group-hover:text-cyan-300', groupBg: 'group-hover:bg-cyan-500/20', border: 'hover:border-cyan-500/50', dot: 'bg-cyan-500', grad: 'from-cyan-500/20 to-amber-500/20' },
    };
    return map[color] || map['emerald'];
  };

  const handleAgeFilterClick = (range) => {
    setSelectedRange(range);
  };

  return (
    <div className="min-h-screen pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <MotionDiv 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
          Centro de <span className="text-transparent bg-clip-text bg-gradient-to-r from-eco-green to-teal-400">Simulação</span>
        </h1>
        
        <p className="text-slate-400 max-w-2xl mx-auto text-lg mb-8">
          Selecione uma missão para iniciar seu treinamento. Cada simulação completada gera recursos reais para sua base.
        </p>

        {/* Filtro de Idade */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-slate-800/50 p-2 rounded-2xl border border-slate-700 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-3 text-slate-400 font-bold uppercase text-xs tracking-wider mr-2">
            <Filter className="w-4 h-4" />
            <span>Filtrar por Idade:</span>
          </div>
          {AGE_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => handleAgeFilterClick(range)}
              className={`
                px-4 py-2 rounded-xl text-sm font-bold transition-all
                ${selectedRange.label === range.label 
                  ? 'bg-eco-green text-white shadow-lg shadow-green-900/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'}
              `}
            >
              {range.label}
            </button>
          ))}
        </div>
      </MotionDiv>

      {/* Jogos Acessíveis */}
      {filteredGames.length > 0 && (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
        >
          <AnimatePresence mode="popLayout">
            {filteredGames.map((game) => {
              const colors = getColorClasses(game.color);
              return (
                <motion.div
                  key={game.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link to={game.path} className="sound-hover group relative block h-full">
                    <div className={`absolute inset-0 bg-gradient-to-br ${colors.grad} rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100`} />
                    <div className={`relative h-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 flex flex-col ${colors.border} transition-all duration-300 group-hover:translate-y-[-4px]`}>
                      <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-4 ${colors.text} ${colors.groupText} ${colors.groupBg} transition-colors`}>
                        <span className="text-3xl">{game.icon}</span>
                      </div>
                      
                      <h3 className={`text-xl font-display font-bold text-white mb-2 ${colors.groupText} transition-colors`}>
                        {game.title}
                      </h3>
                      
                      <p className="text-slate-400 text-sm mb-6 flex-grow">
                        {game.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-500 mt-auto">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
                            {game.category}
                          </span>
                          <span className="text-[10px] opacity-70">
                            {game.minAge === 0 ? 'Livre' : (game.minAge === game.maxAge ? `${game.minAge} Anos` : `${game.minAge} Anos`)}
                          </span>
                        </div>
                        <span className={`${colors.text} ${colors.groupText}`}>Iniciar &rarr;</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Mensagem quando não há jogos */}
      {filteredGames.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p>Nenhum jogo encontrado para esta faixa etária.</p>
          <button 
            onClick={() => setSelectedRange(AGE_RANGES[0])}
            className="mt-4 text-eco-green hover:underline"
          >
            Ver todos os jogos
          </button>
        </div>
      )}
    </div>
  );
};

export default GamesHub;
