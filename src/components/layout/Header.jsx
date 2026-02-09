import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Menu, X, LogOut, Calendar, Star, Zap, DoorOpen, Trophy, Flame, Volume2, VolumeX, Home, Gamepad2, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useGameState } from '@/context/GameStateContext';
import { useAuth } from '@/context/AuthContext';

import { motion, AnimatePresence } from 'framer-motion';
import { recordFeedbackCtaClick } from '@/utils/feedbackStore';
import { isRemoteDbEnabled } from '@/services/remoteDb';
import { getLevel } from '@/utils/gamification';
import { playNavigation, playClick, playStart } from '@/utils/soundEffects';
import TiltContainer from '@/components/ui/TiltContainer';
import CharacterSelector from '@/components/user/CharacterSelector';

const Header = () => {
  const location = useLocation();
  const { score } = useGameState();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCharacterSelectorOpen, setIsCharacterSelectorOpen] = useState(false);
  const navigate = useNavigate();
  const headerStyle = {
    '--header-accent': 'var(--theme-accent)',
    '--header-accent-2': 'var(--theme-accent-2)',
    '--header-accent-surface': 'var(--theme-accent-surface)',
    '--header-accent-border': 'var(--theme-accent-border)',
    '--header-accent-glow': 'var(--theme-accent-glow)',
    '--header-contrast': 'var(--theme-accent-contrast)',
  };

  const minimalRoutes = new Set(['/', '/login', '/register', '/admin']);
  const isMinimal = minimalRoutes.has(location.pathname);
  const canShowFeedbackCta = Boolean(user) && !isMinimal;
  const isOfflineMode = !isRemoteDbEnabled();

  // Mock de nivel e XP para visualizacao
  // Mock de nivel e XP para visualizacao
  // Prioritize real-time score from GameState, fall back to user.score only if score is 0 and user has data
  const userScore = score > 0 ? score : (user?.score || 0);
  const userLevel = getLevel(userScore);

  // Level calculation matching Dashboard/Gamification utils
  const level = Math.floor(userScore / 1000) + 1;
  const xpPercentage = (userScore % 1000) / 10;
  const streak = user?.streak || 0;

  // Obter nivel dinamico (sincronizado com Dashboard)
  const currentLevel = userLevel;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleFeedbackClick = () => {
    recordFeedbackCtaClick({ pathname: location.pathname });
  };

  // Auto-dismiss daily bonus notification
  const { dailyBonus, setDailyBonus } = useGameState();

  useEffect(() => {
    if (dailyBonus) {
      const timer = setTimeout(() => {
        setDailyBonus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [dailyBonus, setDailyBonus]);

  const isActive = (path) => location.pathname === path;

  // Fixed Neon Green Aura
  const aura = { middle: '#00ff41' };

  if (isMinimal) {
    return (
      <header
        className="bg-[var(--theme-backdrop)] backdrop-blur-md border-b border-theme-border sticky top-0 z-50 transition-all duration-300"
        style={headerStyle}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="terra-girando text-2xl leading-none">&#x1F30D;</span>
              <span className="font-display font-bold text-xl tracking-wide text-theme-text-primary leading-none">
                ECO<span className="text-green-400">PLAY</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle className="shrink-0" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Helper Styles for Mobile
  const mobileBtnClass = "p-2 rounded-lg text-theme-text-secondary hover:bg-theme-bg-tertiary transition-colors relative";

  return (
    <header
      className="bg-[var(--theme-backdrop)] backdrop-blur-md border-b border-theme-border sticky top-0 z-50 transition-all duration-300"
      style={headerStyle}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

        {/* --- MOBILE LAYOUT (md:hidden) --- */}
        <div className="flex md:hidden items-center h-16 w-full px-2 gap-2">

          {/* 1. Logo (Full, Leftmost) */}
          <Link to="/" className="flex items-center gap-2 shrink-0 mr-auto">
            <div className="w-9 h-9 bg-gradient-to-br from-theme-bg-tertiary to-theme-bg-secondary rounded-xl border border-theme-border flex items-center justify-center shadow-sm">
              <span className="terra-girando text-xl leading-none">&#x1F30D;</span>
            </div>
            <span className="font-display font-bold text-lg text-theme-text-primary leading-none block">
              ECO<span className="text-green-400">PLAY</span>
            </span>
          </Link>

          {/* 2. Middle/Right Group: Theme, Avatar, Logout */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="scale-90">
              <ThemeToggle />
            </div>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-theme-border/50">
                <div className="w-8 h-8 rounded-full bg-theme-bg-tertiary border border-theme-border overflow-hidden shrink-0 shadow-sm">
                  <img
                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.avatar !== 'default' ? user.avatar : user.name}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-sm font-bold text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors ml-2">
                ENTRAR
              </Link>
            )}
          </div>

          {/* 3. Menu Button (Far Right, after Logout) */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-lg text-theme-text-secondary hover:bg-theme-bg-tertiary transition-colors relative shrink-0 ml-1"
            aria-label="Abrir menu"
          >
            <Menu className="w-7 h-7" />
          </button>
        </div>

        {/* --- DESKTOP LAYOUT (hidden md:flex) --- */}
        <div className="hidden md:flex justify-between items-center h-20">
          {/* Logo HUD Style */}
          <Link to="/" className="flex items-center gap-3 group relative shrink-0">
            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="bg-gradient-to-br from-theme-bg-tertiary to-theme-bg-secondary p-2.5 rounded-xl border border-theme-border shadow-lg group-hover:scale-105 transition-transform relative z-10 flex items-center justify-center">
              <span className="terra-girando text-2xl leading-none">&#x1F30D;</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-2xl tracking-wide text-theme-text-primary leading-none">
                ECO<span className="text-green-400">PLAY</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav HUD */}
          <nav className="grid grid-flow-col auto-cols-fr gap-2 bg-theme-bg-tertiary p-1.5 rounded-full border border-theme-border backdrop-blur-md">
            <Link to="/" className="flex items-center justify-center px-6 py-2 rounded-full text-theme-text-primary hover:text-green-400 hover:bg-green-500/10 hover:shadow-lg hover:shadow-[0_0_18px_rgba(74,222,128,0.3)] font-medium transition-all duration-300 text-sm font-display relative group overflow-hidden whitespace-nowrap">
              <span className="relative z-10">BASE</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <Link to="/games" className="flex items-center justify-center px-6 py-2 rounded-full text-theme-text-primary hover:text-green-400 hover:bg-green-500/10 hover:shadow-lg hover:shadow-[0_0_18px_rgba(74,222,128,0.3)] font-medium transition-all duration-300 text-sm font-display relative group overflow-hidden whitespace-nowrap">
              <span className="relative z-10">JOGOS</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            {user && (
              <Link to="/dashboard" className="flex items-center justify-center px-6 py-2 rounded-full text-theme-text-primary hover:text-green-400 hover:bg-green-500/10 hover:shadow-lg hover:shadow-[0_0_18px_rgba(74,222,128,0.3)] font-medium transition-all duration-300 text-sm font-display relative group overflow-hidden whitespace-nowrap">
                <span className="relative z-10">PAINEL</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            )}
            {canShowFeedbackCta && (
              <Link to="/avaliacao" onClick={() => { handleFeedbackClick(); playClick(); }} className="flex items-center justify-center px-6 py-2 rounded-full text-theme-text-primary hover:text-green-400 hover:bg-green-500/10 hover:shadow-lg hover:shadow-[0_0_18px_rgba(74,222,128,0.3)] font-medium transition-all duration-300 text-sm font-display relative group overflow-hidden whitespace-nowrap">
                <span className="relative z-10">AVALIE</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            )}
          </nav>

          {/* User Stats & Auth Buttons */}
          <div className="flex items-center gap-4">
            <ThemeToggle className="shrink-0" />
            {user ? (
              <div className="flex items-center gap-4">
                {/* HUD Stats Panel */}
                <motion.div
                  className="hidden lg:flex items-center gap-4 bg-theme-bg-tertiary hover:bg-theme-bg-secondary text-theme-text-primary px-4 py-2 rounded-xl border border-theme-border hover:border-green-500/30 backdrop-blur-md shadow-lg cursor-default transition-colors duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="relative">
                    <AnimatePresence>
                      {dailyBonus && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.5 }}
                          animate={{ opacity: 1, y: -20, scale: 1 }}
                          exit={{ opacity: 0, y: -30 }}
                          className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-lg z-50 whitespace-nowrap pointer-events-none"
                        >
                          +{dailyBonus.amount} XP
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="flex items-center gap-2 border-r border-theme-border pr-4 cursor-pointer group/flame" title="Sequência de 🔥">
                      <Flame className={`w-5 h-5 ${dailyBonus ? 'text-yellow-400 fill-yellow-400' : 'text-orange-500 fill-orange-500/20'} transition-all`} />
                      <span className="font-display font-bold">{streak}</span>
                    </div>
                  </div>

                  <div className="flex flex-col w-32 gap-1 cursor-pointer" title={`${score} XP Total`}>
                    <div className="flex justify-between text-[10px] font-mono uppercase text-theme-text-tertiary">
                      <span className="font-bold text-theme-text-primary">Lvl {level}</span>
                      <span className="text-green-400 font-bold">{userScore} XP</span>
                    </div>
                    <div className="h-1.5 w-full bg-theme-bg-secondary rounded-full overflow-hidden border border-theme-border">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${xpPercentage}%` }} className="h-full bg-gradient-to-r from-green-500 to-green-400" />
                    </div>
                  </div>
                </motion.div>

                {/* Avatar Profile */}
                <div className="flex items-center gap-3 pl-2 border-l border-theme-border/50">
                  <div className="text-right hidden xl:block">
                    <div className="text-sm font-bold text-theme-text-primary font-display">{user.name}</div>
                    <div className="text-xs text-green-400 font-medium">{currentLevel.title}</div>
                  </div>
                  <div onClick={() => setIsCharacterSelectorOpen(true)} className="relative group cursor-pointer w-[52px] h-[52px] flex items-center justify-center">
                    <TiltContainer intensity={20} className="w-10 h-10 z-10">
                      <div className="w-full h-full bg-theme-bg-secondary rounded-full border-2 border-green-500 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.avatar !== 'default' ? user.avatar : user.name}`} alt="Avatar" className="w-full h-full object-cover scale-110" />
                      </div>
                    </TiltContainer>
                    <div className="absolute -bottom-1 z-20 bg-theme-bg-tertiary text-[9px] font-black px-1.5 py-px rounded-full border border-theme-border">{level}</div>
                  </div>
                  <button onClick={() => { handleLogout(); playClick(); }} className="p-2 rounded-lg hover:bg-red-500/10 text-theme-text-secondary hover:text-red-500 transition-all group ml-1" title="Sair">
                    <LogOut className="w-5 h-5 group-hover:scale-110" />
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 btn-neon-primary">
                <Zap className="w-4 h-4" /> ACESSAR
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* --- SIDE DRAWER MENU (Mobile) --- */}
      {createPortal(
        <AnimatePresence>
          {isMenuOpen && (
            <div className="fixed inset-0 z-[9999] flex md:hidden" key="mobile-menu-container">
              {/* 1. Backdrop Overlay (Dark & Blur) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              {/* 2. Side Panel (Slide In) */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-[80%] max-w-sm h-full bg-theme-bg-tertiary border-r border-theme-border shadow-2xl overflow-y-auto flex flex-col"
              >
                {/* Header of Drawer */}
                <div className="p-6 border-b border-theme-border/50 bg-theme-bg-secondary/50">
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-display font-bold text-xl text-theme-text-primary">Menu</span>
                    <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-theme-bg-primary rounded-full hover:bg-red-500/10 hover:text-red-400 transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Player Status (Highlight) */}
                  {user && (
                    <div className="flex gap-4">
                      {/* Streak Box */}
                      <div className="flex-1 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-3 flex flex-col items-center justify-center">
                        <Flame className="w-6 h-6 text-orange-500 mb-1" />
                        <span className="text-xs text-theme-text-secondary font-bold uppercase">Sequência</span>
                        <span className="text-lg font-black text-theme-text-primary">{streak} Dias</span>
                      </div>
                      {/* XP Box */}
                      <div className="flex-1 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-3 flex flex-col items-center justify-center">
                        <Trophy className="w-6 h-6 text-green-400 mb-1" />
                        <span className="text-xs text-theme-text-secondary font-bold uppercase">Nível {level}</span>
                        <span className="text-lg font-black text-theme-text-primary">{score} XP</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-6 space-y-3">
                  <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-xl bg-theme-bg-primary border border-theme-border font-bold text-theme-text-primary hover:border-green-400/50 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-theme-bg-secondary flex items-center justify-center group-hover:bg-green-500/10 group-hover:text-green-400 transition-colors">
                      <Home size={20} />
                    </div>
                    <span className="text-lg">Início</span>
                  </Link>

                  <Link to="/games" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-xl bg-theme-bg-primary border border-theme-border font-bold text-theme-text-primary hover:border-green-400/50 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-theme-bg-secondary flex items-center justify-center group-hover:bg-green-500/10 group-hover:text-green-400 transition-colors">
                      <Gamepad2 size={20} />
                    </div>
                    <span className="text-lg">Jogos</span>
                  </Link>

                  <Link to="/leaderboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-xl bg-theme-bg-primary border border-theme-border font-bold text-theme-text-primary hover:border-green-400/50 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-theme-bg-secondary flex items-center justify-center group-hover:bg-green-500/10 group-hover:text-green-400 transition-colors">
                      <Trophy size={20} />
                    </div>
                    <span className="text-lg">Ranking</span>
                  </Link>

                  {user && (
                    <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-xl bg-theme-bg-primary border border-theme-border font-bold text-theme-text-primary hover:border-green-400/50 transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-theme-bg-secondary flex items-center justify-center group-hover:bg-green-500/10 group-hover:text-green-400 transition-colors">
                        <User size={20} />
                      </div>
                      <span className="text-lg">Meu Perfil</span>
                    </Link>
                  )}
                </nav>

                {/* Drawer Footer */}
                <div className="p-6 border-t border-theme-border bg-theme-bg-secondary/30">
                  {canShowFeedbackCta && (
                    <Link to="/avaliacao" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-500/10 text-green-400 font-bold border border-green-500/20 hover:bg-green-500/20 transition-colors">
                      <Star size={18} /> Nos Avalie
                    </Link>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <CharacterSelector
        isOpen={isCharacterSelectorOpen}
        onClose={() => setIsCharacterSelectorOpen(false)}
      />
    </header>
  );
};

export default Header;
