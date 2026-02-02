import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TiltContainer from '@/components/ui/TiltContainer';
import {
  Trophy,
  Lock,
  FlaskConical,
  Award,
  Shield,
  Home,
  Wind,
  Sun,
  Sprout,
  Droplets,
  TreeDeciduous,
  Flame,
  ArrowRight,
  Trash2,
  BookOpen,
  Zap,
  BatteryCharging,
  Unlock,
  HelpCircle,
  Coins,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGameState } from '../context/GameStateContext';
import { BADGES, getLevel, getNextLevel } from '../utils/gamification';
import { playHover } from '@/utils/soundEffects';
import { useTheme } from '@/context/ThemeContext';
import EmptyState from '@/components/ui/EmptyState';
import EnergySourceCard from '@/components/dashboard/EnergySourceCard';
import AvatarSelectionModal from '@/components/dashboard/AvatarSelectionModal';
import { getLeaderboard } from '@/services/remoteDb';

const USERS_KEY = 'ecoplay_users_db';
const PROGRESS_PREFIX = 'ecoplay_progress_';

const ACCENTS = {
  sky: {
    dark: '#38bdf8',
    light: '#0284c7', // sky-600 (was 500)
    surfaceDark: 'rgba(56, 189, 248, 0.1)',
    surfaceLight: 'rgba(2, 132, 199, 0.1)',
    borderDark: 'rgba(56, 189, 248, 0.4)',
    borderLight: 'rgba(2, 132, 199, 0.3)',
    glowDark: 'rgba(56, 189, 248, 0.2)',
    glowLight: 'rgba(2, 132, 199, 0.2)',
  },
  blue: {
    dark: '#3b82f6',
    light: '#2563eb', // blue-600
    surfaceDark: 'rgba(59, 130, 246, 0.1)',
    surfaceLight: 'rgba(37, 99, 235, 0.1)',
    borderDark: 'rgba(59, 130, 246, 0.4)',
    borderLight: 'rgba(37, 99, 235, 0.3)',
    glowDark: 'rgba(59, 130, 246, 0.2)',
    glowLight: 'rgba(37, 99, 235, 0.2)',
  },
  cyan: {
    dark: '#22d3ee',
    light: '#0891b2', // cyan-600
    surfaceDark: 'rgba(34, 211, 238, 0.1)',
    surfaceLight: 'rgba(8, 145, 178, 0.1)',
    borderDark: 'rgba(34, 211, 238, 0.4)',
    borderLight: 'rgba(8, 145, 178, 0.3)',
    glowDark: 'rgba(34, 211, 238, 0.2)',
    glowLight: 'rgba(8, 145, 178, 0.2)',
  },
  indigo: {
    dark: '#818cf8',
    light: '#4f46e5', // indigo-600
    surfaceDark: 'rgba(129, 140, 248, 0.1)',
    surfaceLight: 'rgba(79, 70, 229, 0.1)',
    borderDark: 'rgba(129, 140, 248, 0.4)',
    borderLight: 'rgba(79, 70, 229, 0.3)',
    glowDark: 'rgba(129, 140, 248, 0.2)',
    glowLight: 'rgba(79, 70, 229, 0.2)',
  },
  violet: {
    dark: '#a78bfa',
    light: '#7c3aed', // violet-600
    surfaceDark: 'rgba(167,139,250,0.1)',
    surfaceLight: 'rgba(124,58,237,0.1)',
    borderDark: 'rgba(167,139,250,0.4)',
    borderLight: 'rgba(124,58,237,0.3)',
    glowDark: 'rgba(167,139,250,0.2)',
    glowLight: 'rgba(124,58,237,0.2)',
  },
  rose: {
    dark: '#fb7185',
    light: '#e11d48', // rose-600
    surfaceDark: 'rgba(251,113,133,0.1)',
    surfaceLight: 'rgba(225,29,72,0.1)',
    borderDark: 'rgba(251,113,133,0.4)',
    borderLight: 'rgba(225,29,72,0.3)',
    glowDark: 'rgba(251,113,133,0.2)',
    glowLight: 'rgba(225,29,72,0.2)',
  },
  emerald: {
    dark: '#4ade80',
    light: '#059669', // emerald-600
    surfaceDark: 'rgba(74, 222, 128, 0.1)',
    surfaceLight: 'rgba(5, 150, 105, 0.1)',
    borderDark: 'rgba(74, 222, 128, 0.4)',
    borderLight: 'rgba(5, 150, 105, 0.4)',
    glowDark: 'rgba(74, 222, 128, 0.2)',
    glowLight: 'rgba(5, 150, 105, 0.2)',
  },
  teal: {
    dark: '#2dd4bf',
    light: '#0d9488', // teal-600
    surfaceDark: 'rgba(45,212,191,0.1)',
    surfaceLight: 'rgba(13,148,136,0.1)',
    borderDark: 'rgba(45,212,191,0.4)',
    borderLight: 'rgba(13,148,136,0.3)',
    glowDark: 'rgba(45,212,191,0.2)',
    glowLight: 'rgba(13,148,136,0.2)',
  },
  lime: {
    dark: '#a3e635',
    light: '#65a30d', // lime-600
    surfaceDark: 'rgba(163,230,53,0.1)',
    surfaceLight: 'rgba(101,163,13,0.1)',
    borderDark: 'rgba(163,230,53,0.4)',
    borderLight: 'rgba(101,163,13,0.3)',
    glowDark: 'rgba(163,230,53,0.2)',
    glowLight: 'rgba(101,163,13,0.2)',
  },
  amber: {
    dark: '#fbbf24',
    light: '#d97706', // amber-600
    surfaceDark: 'rgba(251,191,36,0.1)',
    surfaceLight: 'rgba(217,119,6,0.1)',
    borderDark: 'rgba(251,191,36,0.4)',
    borderLight: 'rgba(217,119,6,0.3)',
    glowDark: 'rgba(251,191,36,0.2)',
    glowLight: 'rgba(217,119,6,0.2)',
  },
  yellow: {
    dark: '#facc15',
    light: '#ca8a04', // yellow-600
    surfaceDark: 'rgba(250,204,21,0.1)',
    surfaceLight: 'rgba(202,138,4,0.1)',
    borderDark: 'rgba(250,204,21,0.4)',
    borderLight: 'rgba(202,138,4,0.3)',
    glowDark: 'rgba(250,204,21,0.2)',
    glowLight: 'rgba(202,138,4,0.2)',
  },
  orange: {
    dark: '#fb923c',
    light: '#ea580c', // orange-600
    surfaceDark: 'rgba(251,146,60,0.1)',
    surfaceLight: 'rgba(234,88,12,0.1)',
    borderDark: 'rgba(251,146,60,0.4)',
    borderLight: 'rgba(234,88,12,0.3)',
    glowDark: 'rgba(251,146,60,0.2)',
    glowLight: 'rgba(234,88,12,0.2)',
  },
  red: {
    dark: '#f87171',
    light: '#dc2626', // red-600
    surfaceDark: 'rgba(248,113,113,0.1)',
    surfaceLight: 'rgba(220,38,38,0.1)',
    borderDark: 'rgba(248,113,113,0.4)',
    borderLight: 'rgba(220,38,38,0.3)',
    glowDark: 'rgba(248,113,113,0.2)',
    glowLight: 'rgba(220,38,38,0.2)',
  },
  pink: {
    dark: '#f472b6',
    light: '#db2777', // pink-600
    surfaceDark: 'rgba(244,114,182,0.1)',
    surfaceLight: 'rgba(219,39,119,0.1)',
    borderDark: 'rgba(244,114,182,0.4)',
    borderLight: 'rgba(219,39,119,0.3)',
    glowDark: 'rgba(244,114,182,0.2)',
    glowLight: 'rgba(219,39,119,0.2)',
  },
  purple: {
    dark: '#c084fc',
    light: '#9333ea', // purple-600
    surfaceDark: 'rgba(192,132,252,0.1)',
    surfaceLight: 'rgba(147,51,234,0.1)',
    borderDark: 'rgba(192,132,252,0.4)',
    borderLight: 'rgba(147,51,234,0.3)',
    glowDark: 'rgba(192,132,252,0.2)',
    glowLight: 'rgba(147,51,234,0.2)',
  },
  fuchsia: {
    dark: '#e879f9',
    light: '#c026d3', // fuchsia-600
    surfaceDark: 'rgba(232,121,249,0.1)',
    surfaceLight: 'rgba(192,38,211,0.1)',
    borderDark: 'rgba(232,121,249,0.4)',
    borderLight: 'rgba(192,38,211,0.3)',
    glowDark: 'rgba(232,121,249,0.2)',
    glowLight: 'rgba(192,38,211,0.2)',
  },
  green: {
    dark: '#4ade80',
    light: '#16a34a', // green-600
    surfaceDark: 'rgba(74,222,128,0.1)',
    surfaceLight: 'rgba(22,163,74,0.1)',
    borderDark: 'rgba(74,222,128,0.4)',
    borderLight: 'rgba(22,163,74,0.3)',
    glowDark: 'rgba(74,222,128,0.2)',
    glowLight: 'rgba(22,163,74,0.2)',
  },
};

const BASE_MODULES = [
  {
    id: 'solar',
    title: 'Matriz Solar',
    description: 'Gera energia limpa passiva para a base.',
    howItWorks: 'Painéis solares captam a luz do sol e geram energia automaticamente a cada segundo. Quanto maior o nível, mais energia gerada.',
    minScore: 100,
    Icon: Sun,
    accent: 'amber',
  },
  {
    id: 'wind',
    title: 'Parque Eólico',
    description: 'Aumenta a eficiência das missões.',
    howItWorks: 'Turbinas eólicas aproveitam os ventos para reduzir o custo de energia das suas ações na base.',
    minScore: 1000,
    Icon: Wind,
    accent: 'sky',
  },
  {
    id: 'hydro',
    title: 'Recursos Hídricos',
    description: 'Estabiliza a rede com potência controlável.',
    howItWorks: 'A força da água fornece uma base de energia estável e aumenta o limite máximo de armazenamento.',
    minScore: 1800,
    Icon: Droplets,
    accent: 'blue',
  },
  {
    id: 'garden',
    title: 'Jardim Vertical',
    description: 'Melhora a qualidade do ar da base.',
    howItWorks: 'Plantas purificam o ar, aumentando o ganho de XP (reputação) em todas as suas atividades.',
    minScore: 2500,
    Icon: Sprout,
    accent: 'emerald',
  },
  {
    id: 'biomass',
    title: 'Biomassa',
    description: 'Transforma resíduos em energia e reduz impactos.',
    howItWorks: 'Processa material orgânico para gerar energia extra, muito útil durante a noite ou dias nublados.',
    minScore: 3800,
    Icon: TreeDeciduous,
    accent: 'lime',
  },
  {
    id: 'lab',
    title: 'Laboratório Eco',
    description: 'Desbloqueia novas tecnologias.',
    howItWorks: 'Centro de pesquisa que permite desbloquear melhorias avançadas e visualizações detalhadas da rede.',
    minScore: 5000,
    Icon: FlaskConical,
    accent: 'fuchsia',
  },
  {
    id: 'geothermal',
    title: 'Geotérmica',
    description: 'Fornece energia constante para manter a base ativa.',
    howItWorks: 'Usa o calor da terra para gerar grandes quantidades de energia 24 horas por dia, sem depender do clima.',
    minScore: 6500,
    Icon: Flame,
    accent: 'red',
  },
  {
    id: 'storage',
    title: 'Banco de Baterias',
    description: 'Armazena excesso de energia para picos de demanda.',
    howItWorks: 'Baterias de alta capacidade que guardam o excedente de energia para evitar apagões em momentos críticos.',
    minScore: 8000,
    Icon: BatteryCharging,
    accent: 'orange',
  },
];

const readJson = (storage, key) => {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const defaultProgress = () => ({
  score: 0,
  badges: [],
  badgeUnlocks: {},
  stats: { xp: 0, logins: 0, streak: 0, timeSpentSeconds: 0 },
  completedLevels: {},
  lastDailyXpDate: null,
  unclaimedRewards: [],
});

const readUsers = () => {
  const users = readJson(localStorage, USERS_KEY);
  return Array.isArray(users) ? users : [];
};

const readProgress = (userId) => {
  const key = `${PROGRESS_PREFIX}${userId}`;
  const progress = readJson(localStorage, key);
  if (!progress || typeof progress !== 'object') return defaultProgress();
  const baseline = defaultProgress();
  return { ...baseline, ...progress, stats: { ...baseline.stats, ...(progress.stats || {}) } };
};

const getAccent = (key, isLight) => {
  const palette = ACCENTS[key] || ACCENTS.sky;
  return {
    accent: isLight ? palette.light : palette.dark,
    surface: isLight ? palette.surfaceLight : palette.surfaceDark,
    border: isLight ? palette.borderLight : palette.borderDark,
    glow: isLight ? palette.glowLight : palette.glowDark,
  };
};

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { score, ecoCredits, badges = [], energy, MODULE_STATS, modules, upgradeModule, calculateProduction, setModules, convertEnergyToXp } = useGameState();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Safe Score Calculations
  const safeScore = Number.isFinite(Number(score)) ? Number(score) : 0;
  const currentLevel = getLevel(safeScore);
  const nextLevel = getNextLevel(safeScore);

  const rawProgress = nextLevel ? ((safeScore - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100;
  const progressToNext = Math.min(100, Math.max(0, Number.isFinite(rawProgress) ? rawProgress : 0));


  const [topPlayers, setTopPlayers] = useState([]);

  useEffect(() => {
    let mounted = true;
    getLeaderboard().then(data => {
      if (mounted) setTopPlayers(data);
    }).catch(err => console.error("Failed to fetch leaderboard", err));
    return () => { mounted = false; };
  }, [score]); // Refresh when score updates


  const MotionDiv = motion.div;

  if (loading) return null;
  if (!user) return <div className="p-8 text-center text-white">Usuário não encontrado</div>;

  return (
    <div className="min-h-screen relative overflow-hidden pb-20">


      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-theme-bg-secondary/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-theme-border mb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
        >
          {/* Decorative Blobs - Removed for cleaner look */}

          {/* Avatar Section */}
          <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
            {/* Removed background glow */}
            <TiltContainer intensity={15} className="w-32 h-32">
              <div className="w-full h-full bg-theme-bg-primary rounded-full flex items-center justify-center border-4 border-theme-border relative z-10 overflow-hidden">
                <img
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${(user?.avatar && user?.avatar !== 'default') ? user.avatar : (user?.name || 'User')}`}
                  alt="Avatar"
                  className="w-full h-full object-cover transform scale-110"
                />
              </div>
            </TiltContainer>
            <div className="absolute -bottom-2 -right-2 bg-theme-bg-primary border border-theme-border p-2 rounded-lg shadow-lg z-20">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
          </div>

          <AvatarSelectionModal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} />

          {/* Stats Section */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-4xl font-display font-bold text-theme-text-primary tracking-wide">{user?.name}</h1>
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-theme-bg-tertiary/60 border border-theme-border ${currentLevel.color}`}
            >
              <Trophy className={`w-4 h-4 ${currentLevel.color}`} />
              <span className="font-mono font-bold uppercase tracking-wider text-sm">{currentLevel.title}</span>
            </div>

            <div className="mt-6 max-w-lg">
              <div className="flex justify-between text-xs font-mono text-theme-text-tertiary mb-2 uppercase tracking-wider">
                <span>
                  XP Atual: <span className="text-theme-text-primary">{safeScore}</span>
                </span>
                {nextLevel && (
                  <span>
                    Próximo Nível: <span className="text-theme-text-primary">{nextLevel.min}</span>
                  </span>
                )}
              </div>
              <motion.div
                className="w-full bg-theme-bg-primary rounded-full h-4 overflow-hidden border border-theme-border p-0.5 cursor-pointer relative group"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {/* Enhanced Tooltip */}
                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-theme-bg-tertiary/90 backdrop-blur-md border border-theme-border text-theme-text-primary text-[10px] font-bold px-3 py-1 rounded-full shadow-xl">
                    Faltam {nextLevel ? nextLevel.min - safeScore : 0} XP para {nextLevel?.title || 'o Nível Máximo'}
                  </div>
                </div>

                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 1.5, ease: 'circOut' }}
                  className="bg-gradient-to-r from-green-500 via-emerald-400 to-lime-400 h-full rounded-full relative shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  {/* Inner Shine */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2 rounded-full" />
                </motion.div>
              </motion.div>
            </div>
          </div>


          {/* Energy Source Mini Card */}
          <EnergySourceCard />

          {/* Conquistas Block */}
          <div className="glass-card p-4 rounded-3xl text-center min-w-[180px] h-[130px] flex flex-col items-center justify-center gap-1 shadow-lg">
            <span className="block text-4xl font-display font-bold text-theme-text-primary">
              {badges ? badges.length : 0}
            </span>
            <span className="text-[10px] text-theme-text-tertiary font-mono uppercase tracking-wider">Conquistas</span>
          </div>

        </MotionDiv>

        <div className="grid md:grid-cols-1 gap-8">

          <section className="glass-card rounded-3xl p-8 shadow-2xl border border-theme-border">
            <div className="flex items-center justify-between mb-8 border-b border-theme-border pb-4">
              <h2 className="text-2xl font-display font-bold text-theme-text-primary flex items-center gap-3">
                <Trophy className="w-6 h-6 text-green-400" />
                TOP 3 JOGADORES
              </h2>
              <span className="text-xs font-mono uppercase text-theme-text-tertiary bg-theme-bg-tertiary px-3 py-1 rounded-full border border-theme-border">
                Ranking por XP
              </span>
            </div>

            {topPlayers.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="Nenhum jogador ranqueado"
                description={'Complete uma miss\u00e3o para aparecer no ranking.'}
                actionLabel="Ir para os jogos"
                actionTo="/games"
              />
            ) : (
              <motion.ol
                aria-label="Top 3 jogadores"
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.2, delayChildren: 0.3 }
                  }
                }}
              >
                {topPlayers.map((p, index) => {
                  const rank = index + 1;
                  const isMe = user?.id && p.id === user.id;

                  // Podium Colors: Gold, Silver, Bronze
                  const PODIUM_THEMES = {
                    1: {
                      color: '#fbbf24', // Gold (Amber-400)
                      surface: 'rgba(251, 191, 36, 0.1)',
                      border: 'rgba(251, 191, 36, 0.5)',
                      glow: 'rgba(251, 191, 36, 0.4)',
                      pulseOpacity: 0.3,
                    },
                    2: {
                      color: '#94a3b8', // Silver (Slate-400)
                      surface: 'rgba(148, 163, 184, 0.05)',
                      border: 'rgba(148, 163, 184, 0.3)',
                      glow: 'rgba(148, 163, 184, 0.15)',
                      pulseOpacity: 0.15,
                    },
                    3: {
                      color: '#d97706', // Bronze (Amber-600)
                      surface: 'rgba(217, 119, 6, 0.05)',
                      border: 'rgba(217, 119, 6, 0.3)',
                      glow: 'rgba(217, 119, 6, 0.1)',
                      pulseOpacity: 0.1,
                    }
                  };

                  const theme = PODIUM_THEMES[rank] || PODIUM_THEMES[3];
                  const { color: accent, surface, border, glow, pulseOpacity } = theme;

                  const isFirst = rank === 1;

                  return (
                    <motion.li
                      key={String(p.id ?? index)}
                      variants={{
                        hidden: { opacity: 0, y: 30, scale: 0.9 },
                        visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }
                      }}
                      whileHover={{
                        scale: 1.05,
                        y: -5,
                        boxShadow: `0 10px 30px ${glow}`,
                        zIndex: 10
                      }}
                      style={{
                        '--card-accent': accent,
                        '--card-accent-surface': surface,
                        '--card-accent-border': border,
                        '--card-accent-glow': glow,
                        '--pulse-opacity': pulseOpacity,
                      }}
                      className="relative rounded-2xl border border-[color:var(--card-accent-border)] bg-theme-bg-tertiary/60 p-5 flex items-center gap-4 group"
                    >
                      <div
                        className="absolute inset-0 rounded-2xl border-2 border-[color:var(--card-accent)] opacity-0 group-hover:opacity-[var(--pulse-opacity)] animate-pulse-glow pointer-events-none transition-opacity duration-500"
                      />

                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center border border-[color:var(--card-accent-border)] bg-[color:var(--card-accent-surface)] font-display font-black text-[color:var(--card-accent)] group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_var(--card-accent-surface)]"
                        aria-label={`Posição ${rank}`}
                      >
                        {rank}
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-theme-bg-primary border border-theme-border overflow-hidden shrink-0 relative group-hover:rotate-3 transition-transform duration-300">
                        <img
                          src={`https://api.dicebear.com/7.x/bottts/svg?seed=${p.name}`}
                          alt={`Avatar de ${p.name}`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`text-theme-text-primary font-bold truncate ${isFirst ? 'bg-gradient-to-r from-[color:var(--card-accent)] to-theme-text-primary bg-clip-text text-transparent' : ''}`}>
                            {p.name}
                          </div>
                          {isMe ? (
                            <span className="text-[10px] font-mono uppercase border border-[color:var(--card-accent-border)] bg-[color:var(--card-accent-surface)] text-[color:var(--card-accent)] px-2 py-0.5 rounded-full">
                              Você
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-theme-text-tertiary font-mono group-hover:text-[color:var(--card-accent)] transition-colors">
                          {Intl.NumberFormat('pt-BR').format(Number(p.xp || 0))} XP
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </motion.ol>
            )}
          </section>

          <section className="glass-card rounded-3xl p-8 shadow-2xl">
            {/* Base Header with Energy Stats */}
            {/* Base Header with Energy Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-theme-text-primary flex items-center gap-3">
                  <Home className="w-6 h-6 text-green-400" />
                  BASE DE OPERAÇÕES
                </h2>
                <p className="text-sm text-theme-text-tertiary">Gerencie e evolua sua base sustentável.</p>
              </div>

              <div className="flex flex-wrap items-center gap-4 bg-theme-bg-tertiary/50 p-3 rounded-2xl border border-theme-border">
                <div className="flex items-center gap-2 px-3">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="block text-xs font-mono uppercase text-theme-text-tertiary">EcoCredits</span>
                    <span className="font-display font-bold text-xl text-amber-400">{Math.floor(ecoCredits)}</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-theme-border"></div>
                <div className="flex items-center gap-2 px-3">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <div>
                    <span className="block text-xs font-mono uppercase text-theme-text-tertiary">Energia</span>
                    <span className="font-display font-bold text-xl text-yellow-400">{Math.floor(energy)}</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-theme-border"></div>
                <div className="flex items-center gap-2 px-3">
                  <BatteryCharging className="w-5 h-5 text-green-400" />
                  <div>
                    <span className="block text-xs font-mono uppercase text-theme-text-tertiary">Produção</span>
                    <span className="font-display font-bold text-xl text-green-400">+{calculateProduction()}/s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Energy Donation / Grid Stabilization */}
            <div className="mb-8 bg-gradient-to-r from-theme-bg-tertiary/30 to-theme-bg-secondary border border-theme-border p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-theme-text-primary">Estabilizar Rede Comunitária</h3>
                  <p className="text-xs text-theme-text-tertiary">Doe energia excedente para ganhar reputação (XP).</p>
                  <p className="text-[10px] font-mono text-theme-text-tertiary mt-1 opacity-70">100 Energia = 1 XP</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => convertEnergyToXp(100)}
                  disabled={energy < 100}
                  className="px-4 py-2 rounded-xl bg-theme-bg-tertiary hover:bg-theme-bg-primary border border-theme-border text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-theme-text-secondary hover:text-yellow-500"
                >
                  Doar 100
                </button>
                <button
                  onClick={() => convertEnergyToXp(1000)}
                  disabled={energy < 1000}
                  className="px-4 py-2 rounded-xl bg-theme-bg-tertiary hover:bg-theme-bg-primary border border-theme-border text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-theme-text-secondary hover:text-yellow-500"
                >
                  Doar 1000
                </button>
              </div>
            </div>

            {/* Base Modules Section */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05, delayChildren: 0.1 }
                }
              }}
            >
              {BASE_MODULES.map((module) => {
                const unlocked = safeScore >= module.minScore;
                const { accent, surface, border, glow } = getAccent(module.accent, isLight);
                const Icon = module.Icon;

                // Idle Stats
                const level = modules?.[module.id] || 0;
                const stats = MODULE_STATS?.[module.id];
                const isBuilt = level > 0;

                // Calculate upgrade cost
                const upgradeCost = stats ? Math.floor(stats.baseCost * Math.pow(stats.costFactor, level)) : 0;
                const production = stats ? stats.baseProd * level : 0;
                const nextProduction = stats ? stats.baseProd * (level + 1) : 0;
                const canAfford = ecoCredits >= upgradeCost; // Use EcoCredits to check affordability

                const handleBuild = (e) => {
                  e.stopPropagation();
                  // First build is free if unlocked via XP? Or costs energy? 
                  // Let's make first build FREE (0 cost) if we want, or just use the upgrade logic starting from level 0 cost.
                  // Current upgrade logic: level 0 -> cost = baseCost.
                  // If user has 0 energy, they can't start. That's a blocker.
                  // Fix: Grant some starter energy or make level 1 free/auto.
                  // Decision: "Claim" button for Level 1 is free.
                  if (!isBuilt) {
                    setModules(prev => ({ ...prev, [module.id]: 1 }));
                    playCelebration();
                  } else {
                    upgradeModule(module.id);
                  }
                };

                return (
                  <motion.div
                    key={module.id}

                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { type: "spring", stiffness: 300, damping: 25 }
                      }
                    }}
                    whileHover={{
                      scale: 1.03,
                      y: -5,
                      boxShadow: `0 10px 30px -10px ${glow}`
                    }}
                    style={{
                      '--card-accent': accent,
                      '--card-accent-surface': surface,
                      '--card-accent-border': border,
                      '--card-accent-glow': glow,
                    }}
                    className={`p-6 rounded-2xl border border-[color:var(--card-accent-border)] transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[220px] ${isLight
                      ? (unlocked ? 'glass-card cursor-pointer' : 'glass-card opacity-60')
                      : (unlocked
                        ? 'bg-gradient-to-br from-[color:var(--card-accent-surface)] to-transparent hover:from-[color:var(--card-accent-surface)] hover:to-[color:var(--card-accent-surface)] cursor-pointer'
                        : 'bg-theme-bg-tertiary/20 opacity-40 grayscale')
                      }`}
                    onClick={(e) => {
                      if (!unlocked) return;
                      // Se já construído e sem recurso, não faz nada (ou tocar som de erro)
                      if (isBuilt && !canAfford) return;
                      handleBuild(e);
                    }}
                  >
                    {!isLight && unlocked && (
                      <div className="absolute inset-0 bg-[color:var(--card-accent)] opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl blur-xl" />
                    )}

                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl border border-[color:var(--card-accent-border)] bg-[color:var(--card-accent-surface)] shadow-sm relative">
                          <Icon className="w-8 h-8 text-[color:var(--card-accent)]" />
                          {isBuilt && (
                            <div className="absolute -top-2 -right-2 bg-[color:var(--card-accent)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-theme-bg-primary">
                              Lvl {level}
                            </div>
                          )}
                        </div>
                        {!unlocked ? (
                          <Lock className="w-4 h-4 text-theme-text-tertiary" />
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="relative group/info">
                              <HelpCircle className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] cursor-help hover:scale-110 transition-transform" />
                              <div className="absolute right-0 top-full mt-2 w-48 p-3 bg-slate-900/95 border border-yellow-500/30 text-xs text-yellow-50 rounded-xl opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl backdrop-blur-md">
                                <div className="font-bold mb-1 text-yellow-400 flex items-center gap-1">
                                  <HelpCircle className="w-3 h-3" /> Como funciona
                                </div>
                                {module.howItWorks}
                              </div>
                            </div>
                            <Unlock className="w-4 h-4 text-[color:var(--card-accent)]" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-theme-text-primary mb-1 font-display">{module.title}</h3>
                      <p className="text-xs text-theme-text-tertiary mb-3 line-clamp-2">{module.description}</p>

                      {isBuilt && (
                        <div className="flex items-center gap-1 text-xs font-mono text-green-400 mb-4">
                          <Zap className="w-3 h-3" />
                          +{production}/s
                        </div>
                      )}
                    </div>

                    <div className="mt-auto">
                      {!unlocked ? (
                        <div className="text-xs font-mono text-theme-text-tertiary bg-theme-bg-primary/50 py-1.5 px-3 rounded-lg border border-theme-border inline-block">
                          Somente Nível {getLevel(module.minScore)?.title || 'Superior'}
                        </div>
                      ) : (
                        <button
                          onClick={handleBuild}
                          disabled={isBuilt && !canAfford}
                          className={`w-full py-2 px-3 rounded-xl font-bold text-xs font-display flex items-center justify-center gap-2 transition-all ${!isBuilt
                            ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20'
                            : canAfford
                              ? 'bg-[color:var(--card-accent)] hover:brightness-110 text-white shadow-lg'
                              : 'bg-theme-bg-tertiary text-theme-text-tertiary cursor-not-allowed border border-theme-border'
                            }`}
                        >
                          {!isBuilt ? (
                            <>
                              <Sprout className="w-3 h-3" />
                              Construir (Grátis)
                            </>
                          ) : (
                            <>
                              <ArrowRight className="w-3 h-3" />
                              Evoluir ({upgradeCost} <Coins className="w-2.5 h-2.5 inline text-amber-300" />)
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </section>

          <section className="glass-card rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-display font-bold text-theme-text-primary mb-8 flex items-center gap-3 border-b border-theme-border pb-4">
              <Award className="w-6 h-6 text-green-400" />
              GALERIA DE TROFÉUS
            </h2>

            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05, delayChildren: 0.1 }
                }
              }}
            >
              {BADGES.map((badge) => {
                const isUnlocked = badges && badges.includes(badge.id);
                const stats = user?.stats || {};
                const progress = !isUnlocked && badge.getProgress ? badge.getProgress(stats || {}) : 0;
                const { accent, surface, border, glow } = getAccent(badge.theme || 'sky', isLight);

                return (
                  <MotionDiv
                    key={badge.id}

                    variants={{
                      hidden: { opacity: 0, scale: 0.9, y: 15 },
                      visible: {
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        transition: { type: "spring", stiffness: 300, damping: 25 }
                      }
                    }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    style={{
                      '--card-accent': accent,
                      '--card-accent-surface': surface,
                      '--card-accent-border': border,
                      '--card-accent-glow': glow,
                    }}
                    className={`relative group p-6 rounded-2xl border text-center transition-all duration-300 flex flex-col items-center justify-between ${isUnlocked
                      ? 'bg-[color:var(--card-accent-surface)] border-[color:var(--card-accent-border)] hover:shadow-[0_0_20px_var(--card-accent-glow)]'
                      : 'bg-theme-bg-tertiary/60 border-theme-border opacity-60'
                      }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none" />

                    <div className="w-full">
                      <div className="flex justify-center mb-4 relative">
                        {isUnlocked ? (
                          <div className="relative text-[color:var(--card-accent)]" style={{ '--icon-color': 'inherit' }}>
                            <div className="absolute inset-0 bg-current opacity-20 blur-xl rounded-full" />
                            {badge.icon}
                          </div>
                        ) : (
                          <Lock className="w-10 h-10 text-theme-text-tertiary" />
                        )}
                      </div>

                      <h3
                        className={`font-bold text-sm mb-2 font-display ${isUnlocked ? 'text-[color:var(--card-accent)]' : 'text-theme-text-primary'
                          }`}
                      >
                        {badge.title}
                      </h3>

                      <p className="text-xs text-theme-text-tertiary leading-relaxed font-mono mb-3">
                        {badge.description}
                      </p>
                    </div>

                    {!isUnlocked && (
                      <div className="w-full mt-auto">
                        <div className="w-full bg-theme-bg-primary rounded-full h-1.5 overflow-hidden border border-theme-border">
                          <div
                            className="bg-[color:var(--card-accent)] h-full rounded-full transition-all duration-500 opacity-50"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {badge.target && (
                          <div className="text-[10px] text-theme-text-tertiary mt-1 font-mono text-right">
                            {Math.floor(stats?.[badge.metric] || 0)} / {badge.target}
                          </div>
                        )}
                      </div>
                    )}
                  </MotionDiv>
                );
              })}
            </motion.div>
          </section>
        </div>
      </div>
    </div>

  );
};

export default Dashboard;
