import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Filter, SearchX } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { playClick } from '@/utils/soundEffects';
import EmptyState from '@/components/ui/EmptyState';

const ACCENTS = {
  sky: {
    dark: '#00B0FF', // Deep Sky Neon
    light: '#0ea5e9',
    surfaceDark: 'rgba(0, 176, 255, 0.15)',
    surfaceLight: 'rgba(14,165,233,0.1)',
    borderDark: 'rgba(0, 176, 255, 0.5)',
    borderLight: 'rgba(14,165,233,0.3)',
    glowDark: 'rgba(0, 176, 255, 0.3)',
    glowLight: 'rgba(14,165,233,0.2)',
  },
  green: {
    dark: '#4ade80', // Green 400
    light: '#22c55e',
    surfaceDark: 'rgba(74, 222, 128, 0.15)',
    surfaceLight: 'rgba(34, 197, 94, 0.1)',
    borderDark: 'rgba(74, 222, 128, 0.4)',
    borderLight: 'rgba(34, 197, 94, 0.4)',
    glowDark: 'rgba(74, 222, 128, 0.25)',
    glowLight: 'rgba(34, 197, 94, 0.2)',
  },
  blue: {
    dark: '#2979FF', // Electric Blue
    light: '#3b82f6',
    surfaceDark: 'rgba(41, 121, 255, 0.15)',
    surfaceLight: 'rgba(59,130,246,0.1)',
    borderDark: 'rgba(41, 121, 255, 0.5)',
    borderLight: 'rgba(59,130,246,0.3)',
    glowDark: 'rgba(41, 121, 255, 0.3)',
    glowLight: 'rgba(59,130,246,0.2)',
  },
  indigo: {
    dark: '#651FFF', // Deep Indigo Neon
    light: '#6366f1',
    surfaceDark: 'rgba(101, 31, 255, 0.15)',
    surfaceLight: 'rgba(99,102,241,0.1)',
    borderDark: 'rgba(101, 31, 255, 0.5)',
    borderLight: 'rgba(99,102,241,0.3)',
    glowDark: 'rgba(101, 31, 255, 0.3)',
    glowLight: 'rgba(99,102,241,0.2)',
  },
  violet: {
    dark: '#D500F9', // Neon Violet/Magenta
    light: '#a855f7',
    surfaceDark: 'rgba(213, 0, 249, 0.15)',
    surfaceLight: 'rgba(168,85,247,0.1)',
    borderDark: 'rgba(213, 0, 249, 0.5)',
    borderLight: 'rgba(168,85,247,0.3)',
    glowDark: 'rgba(213, 0, 249, 0.3)',
    glowLight: 'rgba(168,85,247,0.2)',
  },
  emerald: {
    dark: '#4ade80', // Green 400
    light: '#22c55e',
    surfaceDark: 'rgba(74, 222, 128, 0.15)',
    surfaceLight: 'rgba(34, 197, 94, 0.1)',
    borderDark: 'rgba(74, 222, 128, 0.5)',
    borderLight: 'rgba(34, 197, 94, 0.3)',
    glowDark: 'rgba(74, 222, 128, 0.3)',
    glowLight: 'rgba(34, 197, 94, 0.2)',
  },
  teal: {
    dark: '#1DE9B6', // Neon Teal
    light: '#14b8a6',
    surfaceDark: 'rgba(29, 233, 182, 0.15)',
    surfaceLight: 'rgba(20,184,166,0.1)',
    borderDark: 'rgba(29, 233, 182, 0.5)',
    borderLight: 'rgba(20,184,166,0.3)',
    glowDark: 'rgba(29, 233, 182, 0.3)',
    glowLight: 'rgba(20,184,166,0.2)',
  },
  lime: {
    dark: '#C6FF00', // Neon Lime
    light: '#84cc16',
    surfaceDark: 'rgba(198, 255, 0, 0.15)',
    surfaceLight: 'rgba(132,204,22,0.1)',
    borderDark: 'rgba(198, 255, 0, 0.5)',
    borderLight: 'rgba(132,204,22,0.3)',
    glowDark: 'rgba(198, 255, 0, 0.3)',
    glowLight: 'rgba(132,204,22,0.2)',
  },
  amber: {
    dark: '#FFD600', // Neon Gold
    light: '#f59e0b',
    surfaceDark: 'rgba(255, 214, 0, 0.15)',
    surfaceLight: 'rgba(245,158,11,0.1)',
    borderDark: 'rgba(255, 214, 0, 0.5)',
    borderLight: 'rgba(245,158,11,0.3)',
    glowDark: 'rgba(255, 214, 0, 0.3)',
    glowLight: 'rgba(245,158,11,0.2)',
  },
  rose: {
    dark: '#FF4081', // Neon Pink
    light: '#e11d48',
    surfaceDark: 'rgba(255, 64, 129, 0.15)',
    surfaceLight: 'rgba(225,29,72,0.1)',
    borderDark: 'rgba(255, 64, 129, 0.5)',
    borderLight: 'rgba(225,29,72,0.3)',
    glowDark: 'rgba(255, 64, 129, 0.3)',
    glowLight: 'rgba(225,29,72,0.2)',
  },
};

const GAMES = [
  {
    id: 'eco-guardian',
    title: 'EcoGuardian',
    path: '/games/eco-guardian',
    icon: '🏙️',
    description: 'Construa uma cidade sustentável! Gerencie energia solar, eólica e baterias para salvar o futuro.',
    accent: 'emerald',
    category: 'Simulação',
    minAge: 14,
    maxAge: 14,
  },
  {
    id: 'eco-memory',
    title: 'Eco Memória',
    path: '/games/memory',
    icon: '🧠',
    description: 'Encontre pares de energias renováveis e evite a poluição. Treine sua memória.',
    accent: 'violet',
    category: 'Memória',
    minAge: 10,
    maxAge: 10,
  },
  {
    id: 'eco-swipe',
    title: 'EcoSwipe',
    path: '/games/eco-swipe',
    icon: '🖐️',
    description: 'Arraste as cartas e separe energias renováveis e não renováveis.',
    accent: 'amber',
    category: 'Arrasto',
    minAge: 10,
    maxAge: 10,
  },
  {
    id: 'eco-snake',
    title: 'Eco Snake',
    path: '/games/eco-snake',
    icon: '🐍',
    description: 'Colete orgânicos, ative energia solar e complete desafios sem cair na poluição.',
    accent: 'lime',
    category: 'Arcade',
    minAge: 11,
    maxAge: 11,
  },
  {
    id: 'sudoku',
    title: 'Eco Sudoku',
    path: '/games/sudoku',
    icon: '🧩',
    description: 'Organize ícones de energia renovável na grade sem repetir.',
    accent: 'green',
    category: 'Lógica',
    minAge: 13,
    maxAge: 13,
  },
  {
    id: 'eco-platformer',
    title: 'Eco Platformer',
    path: '/games/eco-platformer',
    icon: '🏃',
    description: 'Corra e pule para coletar energias limpas e derrotar o chefe fóssil.',
    accent: 'rose',
    category: 'Plataforma',
    minAge: 12,
    maxAge: 12,
  },
  {
    id: 'eco-math',
    title: 'Eco Math',
    path: '/games/eco-math',
    icon: '🧮',
    description: 'Resolva desafios matemáticos sobre energia renovável.',
    accent: 'blue',
    category: 'Educativo',
    minAge: 13,
    maxAge: 13,
  },
  {
    id: 'quiz',
    title: 'Eco Quiz',
    path: '/games/quiz',
    icon: '❓',
    description: 'Teste seus conhecimentos sobre sustentabilidade.',
    accent: 'indigo',
    category: 'Educativo',
    minAge: 10,
    maxAge: 14,
  },
  {
    id: 'passa-repassa',
    title: 'Passa ou Repassa',
    path: '/games/passa-repassa',
    icon: '🤝',
    description: 'Jogo em dupla com perguntas rápidas de sustentabilidade.',
    accent: 'sky',
    category: 'Multiplayer',
    minAge: 11,
    maxAge: 11,
  },
  {
    id: 'hangman',
    title: 'Jogo da Forca',
    path: '/games/hangman',
    icon: '🪢',
    description: 'Adivinhe palavras sobre energia renovável antes de completar a forca.',
    category: 'Palavras',
    minAge: 12,
    maxAge: 12,
  },
  {
    id: 'word-search',
    title: 'Eco Word',
    path: '/games/word-search',
    icon: '🔍',
    description: 'Encontre palavras e desvende pegadinhas sobre energia sustentável.',
    accent: 'teal',
    category: 'Quebra-cabeça',
    minAge: 14,
    maxAge: 14,
  },

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
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const MotionDiv = motion.div;

  useEffect(() => {
    localStorage.removeItem('ecogotchi_state');
  }, []);

  const filteredGames = GAMES.filter((game) => {
    // Show all games when 'Todas' is selected
    if (selectedRange.label === 'Todas') return true;
    // Check if the selected age falls within the game's age range
    return selectedRange.min >= game.minAge && selectedRange.min <= game.maxAge;
  });

  const handleAgeFilterClick = (range) => {
    setSelectedRange(range);
  };

  return (
    <div className="min-h-screen pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
      <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-theme-text-primary mb-6">
          Centro de{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-lime-400">
            Simulaç<span className="font-sans">ã</span>o
          </span>
        </h1>

        <p className="text-theme-text-secondary max-w-2xl mx-auto text-base md:text-lg mb-8">
          Selecione uma missão para iniciar seu treinamento. Cada simulação completada gera recursos para sua base.
        </p>

        <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-theme-bg-secondary/70 p-2 rounded-2xl border border-theme-border">
          <div className="flex items-center gap-2 px-3 text-theme-text-tertiary font-bold uppercase text-xs tracking-wider mr-2">
            <Filter className="w-4 h-4 text-green-400" />
            <span>Filtrar por idade:</span>
          </div>
          {AGE_RANGES.map((range) => {
            const isActive = selectedRange.label === range.label;
            return (
              <button
                key={range.label}
                onClick={() => { handleAgeFilterClick(range); playClick(); }}
                onMouseEnter={() => playHover()}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-theme-bg-secondary ${isActive
                  ? 'bg-gradient-to-r from-green-500 to-green-400 text-slate-950 shadow-lg shadow-[0_0_15px_rgba(74,222,128,0.4)]'
                  : 'text-theme-text-tertiary hover:text-white hover:bg-white/5'
                  }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </MotionDiv>

      {filteredGames.length > 0 && (
        <motion.div
          key={selectedRange.label} // Force re-render on filter change
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1
              }
            }
          }}
        >
          {filteredGames.map((game) => {
            const palette = ACCENTS[game.accent] || ACCENTS.sky;
            const accent = isLight ? palette.light : palette.dark;
            const accentSurface = isLight ? palette.surfaceLight : palette.surfaceDark;
            const accentBorder = isLight ? palette.borderLight : palette.borderDark;
            const accentGlow = isLight ? palette.glowLight : palette.glowDark;

            return (
              <motion.div
                key={game.id}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { type: "spring", stiffness: 300, damping: 25 }
                  }
                }}
                className="h-full"
              >
                <Link
                  to={game.path}
                  onMouseEnter={() => playHover()}
                  className="sound-hover group relative block h-full"
                  style={{
                    '--card-accent': accent,
                    '--card-accent-surface': accentSurface,
                    '--card-accent-border': accentBorder,
                    '--card-accent-glow': accentGlow,
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at center, var(--card-accent-surface), transparent 70%)`
                    }}
                  />
                  <div className="relative h-full bg-theme-bg-secondary/70 border border-[color:var(--card-accent-border)] rounded-2xl p-6 flex flex-col transition-transform duration-200 group-hover:-translate-y-1">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 border border-[color:var(--card-accent-border)] bg-[color:var(--card-accent-surface)] shadow-sm">
                      <span
                        className="text-3xl filter drop-shadow-sm"
                        style={{ color: 'var(--card-accent)' }}
                      >
                        {game.icon}
                      </span>
                    </div>

                    <h3 className="text-xl font-display font-bold text-theme-text-primary mb-2 transition-colors group-hover:text-[color:var(--card-accent)]">
                      {game.title}
                    </h3>

                    <p className="text-theme-text-secondary text-sm mb-6 flex-grow leading-relaxed">{game.description}</p>

                    <div className="flex items-center justify-between text-xs font-mono uppercase text-theme-text-tertiary mt-auto">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 font-bold">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: 'var(--card-accent)' }}
                          />
                          {game.category}
                        </span>
                        <span className="text-[10px] opacity-70">
                          {game.minAge === 0
                            ? 'Livre'
                            : `${game.minAge} anos`}
                        </span>
                      </div>
                      <span className="text-[color:var(--card-accent)] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">Iniciar →</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {filteredGames.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="Nenhum jogo encontrado"
          description={'N\u00e3o existem jogos para a faixa et\u00e1ria selecionada.'}
          actionLabel="Ver todos os jogos"
          actionOnClick={() => setSelectedRange(AGE_RANGES[0])}
        />
      )}
    </div>
  );
};

export default GamesHub;
