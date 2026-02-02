import { Award, Sun, Wind, Droplets, Zap, Star, BookOpen, Brain, Leaf, Shield, FileText, Calculator } from 'lucide-react';

export const LEVELS = [
  { min: 0, title: 'Iniciante Ecológico', color: 'text-slate-600' },
  { min: 100, title: 'Aprendiz da Energia', color: 'text-green-600' },
  { min: 500, title: 'Guardião Sustentável', color: 'text-blue-600' },
  { min: 1000, title: 'Mestre Renovável', color: 'text-orange-600' },
  { min: 2000, title: 'Lenda do Planeta', color: 'text-purple-600' },
];

/**
 * Definição dos Badges com lógica de validação encapsulada
 */
export const BADGES = [
  {
    id: 'first_login',
    title: 'Primeiros Passos',
    description: 'Entrou no EcoPlay pela primeira vez.',
    icon: <Star className="w-8 h-8" />,
    color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50 shadow-yellow-500/10',
    theme: 'yellow',
    reward: 50,
    // Requisito: Apenas logar (stats.logins >= 1)
    target: 1,
    metric: 'logins',
    check: (stats) => (stats.logins || 0) >= 1,
    getProgress: (stats) => Math.min(100, ((stats.logins || 0) / 1) * 100)
  },
  {
    id: 'feedback_responder',
    title: 'Validador(a) da Proposta',
    description: 'Enviou uma avaliação pelo formulário.',
    icon: <FileText className="w-8 h-8" />,
    color: 'bg-eco-green/10 text-eco-green border-eco-green/40 shadow-eco-green/10',
    theme: 'green',
    reward: 150,
    target: 1,
    metric: 'feedback_submissions',
    check: (stats) => (stats.feedback_submissions || 0) >= 1,
    getProgress: (stats) => Math.min(100, ((stats.feedback_submissions || 0) / 1) * 100)
  },
  {
    id: 'daily_streak_3',
    title: 'Consistente',
    description: 'Acessou o sistema por 3 dias seguidos.',
    icon: <Zap className="w-8 h-8" />,
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/50 shadow-orange-500/10',
    theme: 'orange',
    reward: 100,
    target: 3,
    metric: 'streak',
    check: (stats) => (stats.streak || 0) >= 3,
    getProgress: (stats) => Math.min(100, ((stats.streak || 0) / 3) * 100)
  },
  {
    id: 'knowledge_seeker',
    title: 'Curioso',
    description: 'Explorou o painel de controle.',
    icon: <BookOpen className="w-8 h-8" />,
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/50 shadow-purple-500/10',
    theme: 'purple',
    reward: 50,
    target: 1,
    metric: 'dashboard_visits',
    check: (stats) => (stats.dashboard_visits || 0) >= 1,
    getProgress: (stats) => Math.min(100, ((stats.dashboard_visits || 0) / 1) * 100)
  },
  {
    id: 'sudoku_master',
    title: 'Mestre da Lógica',
    description: 'Completou um desafio de Eco Sudoku.',
    icon: <Sun className="w-8 h-8" />,
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/50 shadow-blue-500/10',
    theme: 'blue',
    reward: 100,
    target: 1,
    metric: 'sudoku_wins',
    check: (stats) => (stats.sudoku_wins || 0) >= 1,
    getProgress: (stats) => Math.min(100, ((stats.sudoku_wins || 0) / 1) * 100)
  },
  {
    id: 'quiz_genius',
    title: 'Gênio Ecológico',
    description: 'Finalizou um Eco Quiz.',
    icon: <Wind className="w-8 h-8" />,
    color: 'bg-green-500/10 text-green-400 border-green-500/50 shadow-green-500/10',
    theme: 'green',
    reward: 100,
    target: 1,
    metric: 'quiz_completions',
    check: (stats) => (stats.quiz_completions || 0) >= 1,
    getProgress: (stats) => Math.min(100, ((stats.quiz_completions || 0) / 1) * 100)
  },
  {
    id: 'xp_500',
    title: 'Energia Alta',
    description: 'Alcançou 500 XP.',
    icon: <Droplets className="w-8 h-8" />,
    color: 'bg-teal-500/10 text-teal-400 border-teal-500/50 shadow-teal-500/10',
    theme: 'teal',
    reward: 200,
    target: 500,
    metric: 'xp',
    check: (stats) => (stats.xp || 0) >= 500,
    getProgress: (stats) => Math.min(100, ((stats.xp || 0) / 500) * 100)
  },
  {
    id: 'memory_master',
    title: 'Memória de Elefante',
    description: 'Venceu o Jogo da Memória.',
    icon: <Brain className="w-8 h-8" />,
    color: 'bg-pink-500/10 text-pink-400 border-pink-500/50 shadow-pink-500/10',
    theme: 'pink',
    reward: 100,
    target: 1,
    metric: 'memory_wins',
    check: (stats) => (stats.memory_wins || 0) >= 1,
    getProgress: (stats) => Math.min(100, ((stats.memory_wins || 0) / 1) * 100)
  },
  {
    id: 'eco_warrior',
    title: 'Guerreiro Eco',
    description: 'Completou 10 jogos no total.',
    icon: <Shield className="w-8 h-8" />,
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50 shadow-indigo-500/10',
    theme: 'indigo',
    reward: 300,
    target: 10,
    metric: 'total_games_played',
    check: (stats) => {
      const total = (stats.sudoku_wins || 0) + (stats.quiz_completions || 0) + (stats.memory_wins || 0);
      return total >= 10;
    },
    getProgress: (stats) => {
      const total = (stats.sudoku_wins || 0) + (stats.quiz_completions || 0) + (stats.memory_wins || 0);
      return Math.min(100, (total / 10) * 100);
    }
  },
  {
    id: 'daily_streak_7',
    title: 'Semana Sustentável',
    description: 'Manteve uma sequência de 7 dias de acesso.',
    icon: <Zap className="w-8 h-8" />,
    color: 'bg-red-500/10 text-red-400 border-red-500/50 shadow-red-500/10',
    theme: 'red',
    reward: 250,
    target: 7,
    metric: 'streak',
    check: (stats) => (stats.streak || 0) >= 7,
    getProgress: (stats) => Math.min(100, ((stats.streak || 0) / 7) * 100)
  },
  {
    id: 'quiz_veteran',
    title: 'Guardião da Sabedoria',
    description: 'Completou 5 Eco Quizzes.',
    icon: <BookOpen className="w-8 h-8" />,
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-emerald-500/10',
    theme: 'emerald',
    reward: 200,
    target: 5,
    metric: 'quiz_completions',
    check: (stats) => (stats.quiz_completions || 0) >= 5,
    getProgress: (stats) => Math.min(100, ((stats.quiz_completions || 0) / 5) * 100)
  },
  {
    id: 'sudoku_veteran',
    title: 'Mente Brilhante',
    description: 'Venceu 5 desafios de Sudoku.',
    icon: <Sun className="w-8 h-8" />,
    color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-cyan-500/10',
    theme: 'cyan',
    reward: 200,
    target: 5,
    metric: 'sudoku_wins',
    check: (stats) => (stats.sudoku_wins || 0) >= 5,
    getProgress: (stats) => Math.min(100, ((stats.sudoku_wins || 0) / 5) * 100)
  },
  {
    id: 'memory_veteran',
    title: 'Mestre da Memória',
    description: 'Venceu 5 Jogos da Memória.',
    icon: <Brain className="w-8 h-8" />,
    color: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/50 shadow-fuchsia-500/10',
    theme: 'fuchsia',
    reward: 200,
    target: 5,
    metric: 'memory_wins',
    check: (stats) => (stats.memory_wins || 0) >= 5,
    getProgress: (stats) => Math.min(100, ((stats.memory_wins || 0) / 5) * 100)
  },
  {
    id: 'all_rounder',
    title: 'Polímata Ecológico',
    description: 'Venceu pelo menos 1 vez em cada jogo (Sudoku, Quiz, Memória).',
    icon: <Leaf className="w-8 h-8" />,
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/50 shadow-rose-500/10',
    theme: 'rose',
    reward: 500,
    target: 3,
    metric: 'special',
    check: (stats) => (stats.sudoku_wins || 0) >= 1 && (stats.quiz_completions || 0) >= 1 && (stats.memory_wins || 0) >= 1,
    getProgress: (stats) => {
      const s = (stats.sudoku_wins || 0) >= 1 ? 1 : 0;
      const q = (stats.quiz_completions || 0) >= 1 ? 1 : 0;
      const m = (stats.memory_wins || 0) >= 1 ? 1 : 0;
      return Math.min(100, ((s + q + m) / 3) * 100);
    }
  },
  {
    id: 'math_starter',
    title: 'Calculadora Verde',
    description: 'Acertou sua primeira questão no Eco Math.',
    icon: <Calculator className="w-8 h-8" />,
    color: 'bg-lime-500/10 text-lime-400 border-lime-500/50 shadow-lime-500/10',
    theme: 'lime',
    reward: 50,
    target: 1,
    metric: 'eco_math_correct',
    check: (stats) => (stats.eco_math_correct || 0) >= 1,
    getProgress: (stats) => Math.min(100, ((stats.eco_math_correct || 0) / 1) * 100)
  },
  {
    id: 'math_genius',
    title: 'Gênio da Matemática',
    description: 'Acertou 10 questões no Eco Math.',
    icon: <Calculator className="w-8 h-8" />,
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-emerald-500/10',
    theme: 'emerald',
    reward: 200,
    target: 10,
    metric: 'eco_math_correct',
    check: (stats) => (stats.eco_math_correct || 0) >= 10,
    getProgress: (stats) => Math.min(100, ((stats.eco_math_correct || 0) / 10) * 100)
  },
  {
    id: 'math_expert',
    title: 'Professor Pardal',
    description: 'Acertou 50 questões no Eco Math.',
    icon: <Calculator className="w-8 h-8" />,
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/50 shadow-amber-500/10',
    theme: 'amber',
    reward: 500,
    target: 50,
    metric: 'eco_math_correct',
    check: (stats) => (stats.eco_math_correct || 0) >= 50,
    getProgress: (stats) => Math.min(100, ((stats.eco_math_correct || 0) / 50) * 100)
  }
];

export const getLevel = (points) => {
  return LEVELS.slice().reverse().find(l => points >= l.min) || LEVELS[0];
};

export const getNextLevel = (points) => {
  const current = getLevel(points);
  const nextIndex = LEVELS.indexOf(current) + 1;
  return LEVELS[nextIndex] || null;
};

/**
 * Verifica novas conquistas com base nas estatísticas atuais
 * @param {Object} currentStats - Estatísticas atuais do jogador
 * @param {Array} ownedBadges - IDs das conquistas já obtidas
 * @returns {Array} - Lista de novas conquistas desbloqueadas (objetos completos)
 */
export const checkNewBadges = (currentStats, ownedBadges = []) => {
  const newUnlocked = [];
  
  BADGES.forEach(badge => {
    if (!ownedBadges.includes(badge.id)) {
      if (badge.check(currentStats)) {
        newUnlocked.push(badge);
      }
    }
  });
  
  return newUnlocked;
};