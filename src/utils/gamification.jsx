import { Award, Sun, Wind, Droplets, Zap, Star, BookOpen, Brain, Leaf, Shield, FileText, Calculator } from 'lucide-react';

export const LEVELS = [
  // Níveis Iniciais (Tutorial)
  { min: 0, title: 'Iniciante Ecológico', color: 'text-green-700 dark:text-green-400' },
  { min: 100, title: 'Aprendiz da Energia', color: 'text-green-700 dark:text-green-400' },
  { min: 500, title: 'Guardião Sustentável', color: 'text-green-700 dark:text-green-400' },
  { min: 1000, title: 'Mestre Renovável', color: 'text-orange-700 dark:text-orange-400' },
  { min: 2000, title: 'Lenda do Planeta', color: 'text-purple-700 dark:text-purple-400' },

  // Níveis 6-10: Vanguarda Solar (+1500 XP)
  { min: 3500, title: 'Vanguarda Solar I', color: 'text-yellow-600 dark:text-yellow-400' },
  { min: 5000, title: 'Vanguarda Solar II', color: 'text-yellow-600 dark:text-yellow-400' },
  { min: 6500, title: 'Vanguarda Solar III', color: 'text-yellow-600 dark:text-yellow-400' },
  { min: 8000, title: 'Vanguarda Solar IV', color: 'text-yellow-600 dark:text-yellow-400' },
  { min: 9500, title: 'Vanguarda Solar V', color: 'text-yellow-600 dark:text-yellow-400' },

  // Níveis 11-15: Titã da Terra (+2000 XP)
  { min: 11500, title: 'Titã da Terra I', color: 'text-emerald-700 dark:text-emerald-400' },
  { min: 13500, title: 'Titã da Terra II', color: 'text-emerald-700 dark:text-emerald-400' },
  { min: 15500, title: 'Titã da Terra III', color: 'text-emerald-700 dark:text-emerald-400' },
  { min: 17500, title: 'Titã da Terra IV', color: 'text-emerald-700 dark:text-emerald-400' },
  { min: 19500, title: 'Titã da Terra V', color: 'text-emerald-700 dark:text-emerald-400' },

  // Níveis 16-20: Sábio dos Oceanos (+2500 XP)
  { min: 22000, title: 'Sábio dos Oceanos I', color: 'text-cyan-700 dark:text-cyan-400' },
  { min: 24500, title: 'Sábio dos Oceanos II', color: 'text-cyan-700 dark:text-cyan-400' },
  { min: 27000, title: 'Sábio dos Oceanos III', color: 'text-cyan-700 dark:text-cyan-400' },
  { min: 29500, title: 'Sábio dos Oceanos IV', color: 'text-cyan-700 dark:text-cyan-400' },
  { min: 32000, title: 'Sábio dos Oceanos V', color: 'text-cyan-700 dark:text-cyan-400' },

  // Níveis 21-25: Guardião da Galáxia (+3000 XP)
  { min: 35000, title: 'Guardião da Galáxia I', color: 'text-indigo-700 dark:text-indigo-400' },
  { min: 38000, title: 'Guardião da Galáxia II', color: 'text-indigo-700 dark:text-indigo-400' },
  { min: 41000, title: 'Guardião da Galáxia III', color: 'text-indigo-700 dark:text-indigo-400' },
  { min: 44000, title: 'Guardião da Galáxia IV', color: 'text-indigo-700 dark:text-indigo-400' },
  { min: 47000, title: 'Guardião da Galáxia V', color: 'text-indigo-700 dark:text-indigo-400' },

  // Níveis 26-30: Entidade Cósmica (+3500 XP)
  { min: 50500, title: 'Entidade Cósmica I', color: 'text-fuchsia-700 dark:text-fuchsia-400' },
  { min: 54000, title: 'Entidade Cósmica II', color: 'text-fuchsia-700 dark:text-fuchsia-400' },
  { min: 57500, title: 'Entidade Cósmica III', color: 'text-fuchsia-700 dark:text-fuchsia-400' },
  { min: 61000, title: 'Entidade Cósmica IV', color: 'text-fuchsia-700 dark:text-fuchsia-400' },
  { min: 64500, title: 'Entidade Cósmica V', color: 'text-fuchsia-700 dark:text-fuchsia-400' },

  // Níveis 31-40: Mestre dos Elementos (+4000 XP)
  { min: 68500, title: 'Mestre dos Elementos I', color: 'text-rose-700 dark:text-rose-400' },
  { min: 72500, title: 'Mestre dos Elementos II', color: 'text-rose-700 dark:text-rose-400' },
  { min: 76500, title: 'Mestre dos Elementos III', color: 'text-rose-700 dark:text-rose-400' },
  { min: 80500, title: 'Mestre dos Elementos IV', color: 'text-rose-700 dark:text-rose-400' },
  { min: 84500, title: 'Mestre dos Elementos V', color: 'text-rose-700 dark:text-rose-400' },
  { min: 88500, title: 'Mestre dos Elementos VI', color: 'text-rose-700 dark:text-rose-400' },
  { min: 92500, title: 'Mestre dos Elementos VII', color: 'text-rose-700 dark:text-rose-400' },
  { min: 96500, title: 'Mestre dos Elementos VIII', color: 'text-rose-700 dark:text-rose-400' },
  { min: 100500, title: 'Mestre dos Elementos IX', color: 'text-rose-700 dark:text-rose-400' },
  { min: 104500, title: 'Mestre dos Elementos X', color: 'text-rose-700 dark:text-rose-400' },

  // Níveis 41-50: Lenda Viva & Eterno (+5000 XP)
  { min: 109500, title: 'Lenda Viva I', color: 'text-amber-600 dark:text-amber-400' },
  { min: 114500, title: 'Lenda Viva II', color: 'text-amber-600 dark:text-amber-400' },
  { min: 119500, title: 'Lenda Viva III', color: 'text-amber-600 dark:text-amber-400' },
  { min: 124500, title: 'Lenda Viva IV', color: 'text-amber-600 dark:text-amber-400' },
  { min: 129500, title: 'Lenda Viva V', color: 'text-amber-600 dark:text-amber-400' },
  { min: 134500, title: 'Eterno I', color: 'text-slate-700 dark:text-slate-200' },
  { min: 139500, title: 'Eterno II', color: 'text-slate-700 dark:text-slate-200' },
  { min: 144500, title: 'Eterno III', color: 'text-slate-700 dark:text-slate-200' },
  { min: 149500, title: 'Eterno IV', color: 'text-slate-700 dark:text-slate-200' },
  { min: 154500, title: 'Eterno V', color: 'text-slate-700 dark:text-slate-200' },

  // Níveis 51-60: Soberano do Sistema (+8000 XP media)
  // Progression gets steeper to reach 1M
  { min: 162000, title: 'Soberano do Sistema I', color: 'text-cyan-600 dark:text-cyan-300' },
  { min: 170000, title: 'Soberano do Sistema II', color: 'text-cyan-600 dark:text-cyan-300' },
  { min: 178000, title: 'Soberano do Sistema III', color: 'text-cyan-600 dark:text-cyan-300' },
  { min: 186000, title: 'Soberano do Sistema IV', color: 'text-cyan-600 dark:text-cyan-300' },
  { min: 194000, title: 'Soberano do Sistema V', color: 'text-cyan-600 dark:text-cyan-300' },
  { min: 202000, title: 'Soberano do Sistema VI', color: 'text-cyan-600 dark:text-cyan-300' },
  { min: 210000, title: 'Soberano do Sistema VII', color: 'text-cyan-600 dark:text-cyan-300' },
  { min: 218000, title: 'Soberano do Sistema VIII', color: 'text-cyan-600 dark:text-cyan-300' },
  { min: 226000, title: 'Soberano do Sistema IX', color: 'text-cyan-600 dark:text-cyan-300' },
  { min: 234000, title: 'Soberano do Sistema X', color: 'text-cyan-600 dark:text-cyan-300' },

  // Níveis 61-70: Vigilante Universal (+12000 XP media -> 246k start)
  { min: 246000, title: 'Vigilante Universal I', color: 'text-blue-600 dark:text-blue-300' },
  { min: 258000, title: 'Vigilante Universal II', color: 'text-blue-600 dark:text-blue-300' },
  { min: 270000, title: 'Vigilante Universal III', color: 'text-blue-600 dark:text-blue-300' },
  { min: 282000, title: 'Vigilante Universal IV', color: 'text-blue-600 dark:text-blue-300' },
  { min: 294000, title: 'Vigilante Universal V', color: 'text-blue-600 dark:text-blue-300' },
  { min: 306000, title: 'Vigilante Universal VI', color: 'text-blue-600 dark:text-blue-300' },
  { min: 318000, title: 'Vigilante Universal VII', color: 'text-blue-600 dark:text-blue-300' },
  { min: 330000, title: 'Vigilante Universal VIII', color: 'text-blue-600 dark:text-blue-300' },
  { min: 342000, title: 'Vigilante Universal IX', color: 'text-blue-600 dark:text-blue-300' },
  { min: 354000, title: 'Vigilante Universal X', color: 'text-blue-600 dark:text-blue-300' },

  // Níveis 71-80: Arquiteto Estelar (+20k XP jump -> 374k start)
  { min: 374000, title: 'Arquiteto Estelar I', color: 'text-indigo-600 dark:text-indigo-300' },
  { min: 394000, title: 'Arquiteto Estelar II', color: 'text-indigo-600 dark:text-indigo-300' },
  { min: 414000, title: 'Arquiteto Estelar III', color: 'text-indigo-600 dark:text-indigo-300' },
  { min: 434000, title: 'Arquiteto Estelar IV', color: 'text-indigo-600 dark:text-indigo-300' },
  { min: 454000, title: 'Arquiteto Estelar V', color: 'text-indigo-600 dark:text-indigo-300' },
  { min: 474000, title: 'Arquiteto Estelar VI', color: 'text-indigo-600 dark:text-indigo-300' },
  { min: 494000, title: 'Arquiteto Estelar VII', color: 'text-indigo-600 dark:text-indigo-300' },
  { min: 514000, title: 'Arquiteto Estelar VIII', color: 'text-indigo-600 dark:text-indigo-300' },
  { min: 534000, title: 'Arquiteto Estelar IX', color: 'text-indigo-600 dark:text-indigo-300' },
  { min: 554000, title: 'Arquiteto Estelar X', color: 'text-indigo-600 dark:text-indigo-300' },

  // Níveis 81-90: Arauto da Luz (+30k XP jump -> 584k start)
  { min: 584000, title: 'Arauto da Luz I', color: 'text-yellow-400 dark:text-yellow-200' },
  { min: 614000, title: 'Arauto da Luz II', color: 'text-yellow-400 dark:text-yellow-200' },
  { min: 644000, title: 'Arauto da Luz III', color: 'text-yellow-400 dark:text-yellow-200' },
  { min: 674000, title: 'Arauto da Luz IV', color: 'text-yellow-400 dark:text-yellow-200' },
  { min: 704000, title: 'Arauto da Luz V', color: 'text-yellow-400 dark:text-yellow-200' },
  { min: 734000, title: 'Arauto da Luz VI', color: 'text-yellow-400 dark:text-yellow-200' },
  { min: 764000, title: 'Arauto da Luz VII', color: 'text-yellow-400 dark:text-yellow-200' },
  { min: 794000, title: 'Arauto da Luz VIII', color: 'text-yellow-400 dark:text-yellow-200' },
  { min: 824000, title: 'Arauto da Luz IX', color: 'text-yellow-400 dark:text-yellow-200' },
  { min: 854000, title: 'Arauto da Luz X', color: 'text-yellow-400 dark:text-yellow-200' },

  // Níveis 91-99: Entidade Primordial (+40k XP jump -> 894k start)
  { min: 894000, title: 'Entidade Primordial I', color: 'text-pink-600 dark:text-pink-300' },
  { min: 934000, title: 'Entidade Primordial II', color: 'text-pink-600 dark:text-pink-300' },
  { min: 940000, title: 'Entidade Primordial III', color: 'text-pink-600 dark:text-pink-300' }, // Adjusted
  { min: 950000, title: 'Entidade Primordial IV', color: 'text-pink-600 dark:text-pink-300' },
  { min: 960000, title: 'Entidade Primordial V', color: 'text-pink-600 dark:text-pink-300' },
  { min: 970000, title: 'Entidade Primordial VI', color: 'text-pink-600 dark:text-pink-300' },
  { min: 980000, title: 'Entidade Primordial VII', color: 'text-pink-600 dark:text-pink-300' },
  { min: 990000, title: 'Entidade Primordial VIII', color: 'text-pink-600 dark:text-pink-300' },
  { min: 995000, title: 'Entidade Primordial IX', color: 'text-pink-600 dark:text-pink-300' },

  // Level 100
  { min: 1000000, title: 'Deus do Ecoverso', color: 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 font-black' },
];

/**
 * Definição dos Badges com lógica de validação encapsulada
 */
export const BADGES = [
  {
    id: 'first_login',
    title: 'Primeiros Passos',
    description: 'Entrou no EcoPlay pela primeira vez.',
    icon: <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />,
    color: 'bg-yellow-600/10 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-600/50 dark:border-yellow-500/50 shadow-yellow-600/10 dark:shadow-yellow-500/10',
    theme: 'yellow',
    reward: 50,
    target: 1,
    metric: 'logins',
    check: (stats) => (stats.logins || 0) >= 1,
    getProgress: (stats) => Math.min(100, ((stats.logins || 0) / 1) * 100)
  },
  {
    id: 'feedback_responder',
    title: 'Validador(a) da Proposta',
    description: 'Enviou uma avaliação pelo formulário.',
    icon: <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />,
    color: 'bg-green-600/10 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-600/50 dark:border-green-500/50 shadow-green-600/10 dark:shadow-green-500/10',
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
    icon: <Zap className="w-8 h-8 text-orange-600 dark:text-orange-400" />,
    color: 'bg-orange-600/10 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-600/50 dark:border-orange-500/50 shadow-orange-600/10 dark:shadow-orange-500/10',
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
    icon: <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
    color: 'bg-purple-600/10 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-600/50 dark:border-purple-500/50 shadow-purple-600/10 dark:shadow-purple-500/10',
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
    icon: <Sun className="w-8 h-8 text-green-600 dark:text-green-400" />,
    color: 'bg-green-600/10 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-600/50 dark:border-green-500/50 shadow-green-600/10 dark:shadow-green-500/10',
    theme: 'green',
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
    icon: <Wind className="w-8 h-8 text-lime-600 dark:text-lime-400" />,
    color: 'bg-lime-600/10 dark:bg-lime-500/10 text-lime-700 dark:text-lime-400 border-lime-600/50 dark:border-lime-500/50 shadow-lime-600/10 dark:shadow-lime-500/10',
    theme: 'lime',
    reward: 100,
    target: 1,
    metric: 'quiz_completions',
    check: (stats) => (stats.quiz_completions || 0) >= 1,
    getProgress: (stats) => Math.min(100, ((stats.quiz_completions || 0) / 1) * 100)
  },
  {
    id: 'xp_300',
    title: 'Energia em Potencial',
    description: 'Alcançou 300 XP.',
    icon: <Droplets className="w-8 h-8 text-teal-600 dark:text-teal-400" />,
    color: 'bg-teal-600/10 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-600/50 dark:border-teal-500/50 shadow-teal-600/10 dark:shadow-teal-500/10',
    theme: 'teal',
    reward: 200,
    target: 300,
    metric: 'xp',
    check: (stats) => (stats.xp || 0) >= 300,
    getProgress: (stats) => Math.min(100, ((stats.xp || 0) / 300) * 100)
  },
  {
    id: 'memory_master',
    title: 'Memória de Elefante',
    description: 'Venceu o Jogo da Memória.',
    icon: <Brain className="w-8 h-8 text-pink-600 dark:text-pink-400" />,
    color: 'bg-pink-600/10 dark:bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-600/50 dark:border-pink-500/50 shadow-pink-600/10 dark:shadow-pink-500/10',
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
    icon: <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />,
    color: 'bg-emerald-600/10 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-600/50 dark:border-emerald-500/50 shadow-emerald-600/10 dark:shadow-emerald-500/10',
    theme: 'emerald',
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
    icon: <Zap className="w-8 h-8 text-red-600 dark:text-red-400" />,
    color: 'bg-red-600/10 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-600/50 dark:border-red-500/50 shadow-red-600/10 dark:shadow-red-500/10',
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
    icon: <BookOpen className="w-8 h-8 text-teal-600 dark:text-teal-400" />,
    color: 'bg-teal-600/10 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-600/50 dark:border-teal-500/50 shadow-teal-600/10 dark:shadow-teal-500/10',
    theme: 'teal',
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
    icon: <Sun className="w-8 h-8 text-green-600 dark:text-green-400" />,
    color: 'bg-green-600/10 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-600/50 dark:border-green-500/50 shadow-green-600/10 dark:shadow-green-500/10',
    theme: 'green',
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
    icon: <Brain className="w-8 h-8 text-fuchsia-600 dark:text-fuchsia-400" />,
    color: 'bg-fuchsia-600/10 dark:bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-600/50 dark:border-fuchsia-500/50 shadow-fuchsia-600/10 dark:shadow-fuchsia-500/10',
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
    icon: <Leaf className="w-8 h-8 text-rose-600 dark:text-rose-400" />,
    color: 'bg-rose-600/10 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-600/50 dark:border-rose-500/50 shadow-rose-600/10 dark:shadow-rose-500/10',
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
    icon: <Calculator className="w-8 h-8 text-green-600 dark:text-green-400" />,
    color: 'bg-green-600/10 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-600/50 dark:border-green-500/50 shadow-green-600/10 dark:shadow-green-500/10',
    theme: 'emerald',
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
    icon: <Calculator className="w-8 h-8 text-violet-600 dark:text-violet-400" />,
    color: 'bg-violet-600/10 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-600/50 dark:border-violet-500/50 shadow-violet-600/10 dark:shadow-violet-500/10',
    theme: 'violet',
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
    icon: <Calculator className="w-8 h-8 text-amber-600 dark:text-amber-400" />,
    color: 'bg-amber-600/10 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-600/50 dark:border-amber-500/50 shadow-amber-600/10 dark:shadow-amber-500/10',
    theme: 'amber',
    reward: 500,
    target: 50,
    metric: 'eco_math_correct',
    check: (stats) => (stats.eco_math_correct || 0) >= 50,
    getProgress: (stats) => Math.min(100, ((stats.eco_math_correct || 0) / 50) * 100)
  },
  {
    id: 'word_search_first_win',
    title: 'Caçador de Mitos',
    description: 'Venceu o Caça-Mitos pela primeira vez.',
    icon: <Star className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />,
    color: 'bg-indigo-600/10 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-600/50 dark:border-indigo-500/50 shadow-indigo-600/10 dark:shadow-indigo-500/10',
    theme: 'indigo',
    reward: 100,
    target: 1,
    metric: 'word_search_wins',
    check: (stats) => (stats.word_search_wins || 0) >= 1,
    getProgress: (stats) => Math.min(100, ((stats.word_search_wins || 0) / 1) * 100)
  },
  {
    id: 'hangman_hero',
    title: 'Herói da Palavra',
    description: 'Salvou o jogo da Forca.',
    icon: <Award className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />,
    color: 'bg-cyan-600/10 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-600/50 dark:border-cyan-500/50 shadow-cyan-600/10 dark:shadow-cyan-500/10',
    theme: 'cyan',
    reward: 100,
    target: 1,
    metric: 'hangman_wins',
    check: (stats) => (stats.hangman_wins || 0) >= 1,
    getProgress: (stats) => Math.min(100, ((stats.hangman_wins || 0) / 1) * 100)
  },
  {
    id: 'city_builder',
    title: 'Prefeito Verde',
    description: 'Completou uma missão no EcoGuardian.',
    icon: <Sun className="w-8 h-8 text-amber-500 dark:text-amber-400" />,
    color: 'bg-amber-500/10 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 border-amber-500/50 dark:border-amber-400/50 shadow-amber-500/10 dark:shadow-amber-400/10',
    theme: 'amber',
    reward: 200,
    target: 1,
    metric: 'eco_guardian_wins',
    check: (stats) => (stats.eco_guardian_wins || 0) >= 1,
    getProgress: (stats) => Math.min(100, ((stats.eco_guardian_wins || 0) / 1) * 100)
  },
  {
    id: 'snake_charmer',
    title: 'Encantador de Cobras',
    description: 'Venceu no Eco Snake.',
    icon: <Leaf className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />,
    color: 'bg-emerald-600/10 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-600/50 dark:border-emerald-500/50 shadow-emerald-600/10 dark:shadow-emerald-500/10',
    theme: 'emerald',
    reward: 100,
    target: 1,
    metric: 'eco_snake_wins',
    check: (stats) => (stats.eco_snake_wins || 0) >= 1,
    getProgress: (stats) => Math.min(100, ((stats.eco_snake_wins || 0) / 1) * 100)
  },
  {
    id: 'swipe_pro',
    title: 'Separador Veloz',
    description: 'Venceu no Eco Swipe.',
    icon: <Wind className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
    color: 'bg-blue-600/10 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-600/50 dark:border-blue-500/50 shadow-blue-600/10 dark:shadow-blue-500/10',
    theme: 'blue',
    reward: 100,
    target: 1,
    metric: 'eco_swipe_wins',
    check: (stats) => (stats.eco_swipe_wins || 0) >= 1,
    getProgress: (stats) => Math.min(100, ((stats.eco_swipe_wins || 0) / 1) * 100)
  },
  {
    id: 'platform_runner',
    title: 'Corredor Ecológico',
    description: 'Completou o Eco Platformer.',
    icon: <Zap className="w-8 h-8 text-rose-600 dark:text-rose-400" />,
    color: 'bg-rose-600/10 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-600/50 dark:border-rose-500/50 shadow-rose-600/10 dark:shadow-rose-500/10',
    theme: 'rose',
    reward: 150,
    target: 1,
    metric: 'eco_platformer_wins',
    check: (stats) => (stats.eco_platformer_wins || 0) >= 1,
    getProgress: (stats) => Math.min(100, ((stats.eco_platformer_wins || 0) / 1) * 100)
  }
];

export const getLevel = (points) => {
  // 1. Try to find in static levels
  const staticLevelMatch = LEVELS.slice().reverse().find(l => points >= l.min);

  if (staticLevelMatch) {
    // Check if it's the last static level, and if we should go beyond
    const index = LEVELS.indexOf(staticLevelMatch);
    if (index === LEVELS.length - 1 && points >= staticLevelMatch.min + 50000) { // If exceeding last level buffer
      // Fallthrough to dynamic calculation below
    } else {
      return { ...staticLevelMatch, levelNumber: index + 1 };
    }
  } else {
    // Should not happen as level 0 is min 0
    return { ...LEVELS[0], levelNumber: 1 };
  }

  // 2. Dynamic Level Calculation (Infinite)
  // Base: Last static level (Level 100 at 1,000,000 XP)
  const lastStaticLevel = LEVELS[LEVELS.length - 1];
  const lastStaticIndex = LEVELS.length; // e.g. 100
  const xpOverCap = points - lastStaticLevel.min;

  // Dynamic scaling: e.g. 100k XP per level after 1M
  const xpPerDynamicLevel = 100000;
  const extraLevels = Math.floor(xpOverCap / xpPerDynamicLevel);
  const totalLevel = lastStaticIndex + extraLevels;

  return {
    min: lastStaticLevel.min + (extraLevels * xpPerDynamicLevel),
    title: `Deus do Ecoverso`,
    color: lastStaticLevel.color,
    levelNumber: totalLevel
  };
};

export const getNextLevel = (points) => {
  const current = getLevel(points);

  // If we are within static levels...
  if (current.levelNumber < LEVELS.length) {
    const next = LEVELS[current.levelNumber]; // index = levelNumber because 0-based index vs 1-based level
    return { ...next, levelNumber: current.levelNumber + 1 };
  }

  // Dynamic Next Level
  const xpPerDynamicLevel = 100000;
  return {
    min: current.min + xpPerDynamicLevel,
    title: `Deus do Ecoverso`,
    color: current.color,
    levelNumber: current.levelNumber + 1
  };
};

export const getLevelProgress = (xp) => {
  const safeXp = Number.isFinite(Number(xp)) ? Number(xp) : 0;
  const currentLevel = getLevel(safeXp);
  const nextLevel = getNextLevel(safeXp);

  const levelStartXp = currentLevel.min;
  const nextLevelXp = nextLevel.min;
  const inLevel = safeXp - levelStartXp;
  const need = nextLevelXp - levelStartXp;
  const rawPercent = (inLevel / need) * 100;
  const percent = Math.min(100, Math.max(0, rawPercent));

  return {
    currentLevel,
    nextLevel,
    levelStartXp,
    nextLevelXp,
    inLevel,
    need,
    percent,
    isMaxLevel: false // Never max out
  };
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
