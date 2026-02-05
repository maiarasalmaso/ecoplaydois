import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Calendar, Star, Zap, DoorOpen, Trophy, Flame, Volume2, VolumeX } from 'lucide-react';
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
import DbStatus from '@/components/ui/DbStatus';

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
            <div className="w-1/3 flex items-center gap-2">
              {/* Server Status Indicator (Minimal Header) */}
              <DbStatus />
              {/* Theme Toggle minimal header */}

            </div>
            <Link to="/" className="flex items-center gap-3 group relative">
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
            <div className="w-1/3 flex justify-end items-center gap-3">
              <ThemeToggle className="shrink-0" />
              {canShowFeedbackCta && (
                <Link
                  to="/avaliacao"
                  onClick={handleFeedbackClick}
                >
                  <Star className="w-4 h-4 text-green-400" />
                  Nos avalie
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className="bg-[var(--theme-backdrop)] backdrop-blur-md border-b border-theme-border sticky top-0 z-50 transition-all duration-300"
      style={headerStyle}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo HUD Style */}
          <Link to="/" className="flex items-center gap-3 group relative">
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
          <nav className="hidden md:grid grid-flow-col auto-cols-fr gap-2 bg-theme-bg-tertiary p-1.5 rounded-full border border-theme-border backdrop-blur-md">
            <Link to="/" className="flex items-center justify-center px-6 py-2 rounded-full text-theme-text-primary hover:text-green-400 hover:bg-green-500/10 hover:shadow-lg hover:shadow-[0_0_18px_rgba(74,222,128,0.3)] font-medium transition-all duration-300 text-sm font-display relative group overflow-hidden whitespace-nowrap">
              <span className="relative z-10">BASE</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <Link to="/games" className="flex items-center justify-center px-6 py-2 rounded-full text-theme-text-primary hover:text-green-400 hover:bg-green-500/10 hover:shadow-lg hover:shadow-[0_0_18px_rgba(74,222,128,0.3)] font-medium transition-all duration-300 text-sm font-display relative group overflow-hidden whitespace-nowrap">
              <span className="relative z-10">JOGOS</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            {user && (
              <Link
                to="/dashboard"


                className="flex items-center justify-center px-6 py-2 rounded-full text-theme-text-primary hover:text-green-400 hover:bg-green-500/10 hover:shadow-lg hover:shadow-[0_0_18px_rgba(74,222,128,0.3)] font-medium transition-all duration-300 text-sm font-display relative group overflow-hidden whitespace-nowrap"
              >
                <span className="relative z-10">PAINEL</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            )}
            {canShowFeedbackCta && (
              <Link
                to="/avaliacao"
                onClick={() => { handleFeedbackClick(); playClick(); }}

                className="flex items-center justify-center px-6 py-2 rounded-full text-theme-text-primary hover:text-green-400 hover:bg-green-500/10 hover:shadow-lg hover:shadow-[0_0_18px_rgba(74,222,128,0.3)] font-medium transition-all duration-300 text-sm font-display relative group overflow-hidden whitespace-nowrap"
              >
                <span className="relative z-10">AVALIE</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            )}
          </nav>

          {/* User Stats & Auth Buttons */}
          <div className="flex items-center gap-4">
            <ThemeToggle className="shrink-0" />
            {/* Server Status Indicator */}
            {user && <DbStatus />}

            {user ? (
              <div className="flex items-center gap-4">
                {/* HUD Stats Panel */}
                <motion.div
                  className="hidden lg:flex items-center gap-4 bg-theme-bg-tertiary hover:bg-theme-bg-secondary text-theme-text-primary px-4 py-2 rounded-xl border border-theme-border hover:border-green-500/30 backdrop-blur-md shadow-lg cursor-default transition-colors duration-300"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >



                  {/* Streak */}
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
                    <motion.div
                      className="flex items-center gap-2 border-r border-theme-border pr-4 cursor-pointer group/flame"
                      title="Sequência de 🔥 (Streak)"
                      whileHover={{ scale: 1.1 }}
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.15, 0.95, 1],
                          rotate: [0, -3, 3, 0],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="relative"
                      >
                        <Flame
                          className={`w-5 h-5 ${dailyBonus ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'text-orange-500 fill-orange-500/20 group-hover/flame:fill-orange-500 group-hover/flame:drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]'} transition-all duration-300`}
                        />
                      </motion.div>
                      <span className={`font-display font-bold ${dailyBonus ? 'text-yellow-400' : 'text-theme-text-secondary group-hover/flame:text-orange-500'} transition-colors`}>{streak}</span>
                    </motion.div>
                  </div>

                  {/* Level & XP */}
                  <motion.div
                    className="flex flex-col w-32 gap-1 cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    title={`${score} XP Total`}
                  >
                    <div className="flex justify-between text-[10px] font-mono uppercase text-theme-text-tertiary">
                      <span className="font-bold text-theme-text-primary">Lvl {level}</span>
                      <span className="text-green-400 font-bold">{userScore} XP</span>
                    </div>
                    <div className="h-1.5 w-full bg-theme-bg-secondary rounded-full overflow-hidden border border-theme-border">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${xpPercentage}%` }}
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                      />
                    </div>
                  </motion.div>
                </motion.div>

                {/* Avatar Profile with XP Ring */}
                <div className="flex items-center gap-3 pl-2 border-l border-theme-border/50">
                  <div className="text-right hidden md:block">
                    <div className="text-sm font-bold text-theme-text-primary font-display">{user.name}</div>
                    <div className="text-xs text-green-400 font-medium">{currentLevel.title}</div>
                  </div>

                  <div
                    onClick={() => setIsCharacterSelectorOpen(true)}
                    className="relative group cursor-pointer"
                    title="Clique para trocar de personagem"
                  >
                    {/* Glowing Background */}
                    <div className="absolute inset-0 bg-green-500 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-500" />

                    {/* XP Progress Ring Container */}
                    <div className="relative w-[52px] h-[52px] flex items-center justify-center">
                      {/* Pulsing SVG Ring */}
                      <motion.svg
                        className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none overflow-visible"
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.8, 1, 0.8],
                          filter: [`drop-shadow(0 0 2px ${aura.middle})`, `drop-shadow(0 0 6px ${aura.middle})`, `drop-shadow(0 0 2px ${aura.middle})`]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        {/* Track */}
                        <circle
                          cx="26" cy="26" r="24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="text-theme-border opacity-30"
                        />
                        {/* Solid Progress Line */}
                        <motion.circle
                          cx="26" cy="26" r="24"
                          fill="none"
                          stroke={aura.middle}
                          strokeWidth="3"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: xpPercentage / 100 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </motion.svg>

                      {/* Avatar Image */}
                      <TiltContainer intensity={20} className="w-10 h-10 z-10">
                        <div
                          className="w-full h-full bg-theme-bg-secondary rounded-full flex items-center justify-center overflow-hidden border-2 shadow-inner relative transition-colors duration-500"
                          style={{ borderColor: aura.middle }}
                        >
                          <img
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.avatar !== 'default' ? user.avatar : user.name}`}
                            alt="Avatar"
                            className="w-full h-full object-cover transform scale-110"
                          />
                        </div>
                      </TiltContainer>

                      {/* Level Badge Pill */}
                      <div className="absolute -bottom-1 z-20 bg-theme-bg-tertiary text-[9px] font-black px-1.5 py-px rounded-full border border-theme-border text-theme-text-primary shadow-lg leading-none backdrop-blur-md">
                        {level}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { handleLogout(); playClick(); }}

                    className="p-2 rounded-lg hover:bg-red-500/10 text-theme-text-secondary hover:text-red-500 transition-all duration-300 group ml-1"
                    title="Sair"
                  >
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => { playClick(); }}

                className="hidden md:flex items-center gap-2 btn-neon-primary"
              >
                <Zap className="w-4 h-4 text-[color:var(--header-contrast)] fill-[color:var(--header-contrast)]" />
                ACESSAR SISTEMA
              </Link>
            )}

            <button
              className="md:hidden p-2 hover:bg-theme-bg-tertiary rounded-lg transition-colors text-theme-text-secondary"
              onClick={() => { setIsMenuOpen(!isMenuOpen); playClick(); }}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-theme-bg-primary border-t border-theme-border"
          >
            <nav className="flex flex-col p-4 gap-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-theme-text-secondary text-sm font-mono uppercase">Menu</span>
              </div>
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-theme-text-primary hover:text-green-400 font-medium font-display">BASE</Link>
              <Link to="/games" onClick={() => setIsMenuOpen(false)} className="text-theme-text-primary hover:text-green-400 font-medium font-display">JOGOS</Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-theme-text-primary hover:text-green-400 font-medium font-display">SOBRE</Link>
              {canShowFeedbackCta && (
                <Link
                  to="/avaliacao"
                  onClick={() => {
                    handleFeedbackClick();
                    setIsMenuOpen(false);
                  }}
                  className="text-theme-text-primary hover:text-green-400 font-medium font-display"
                >
                  NOS AVALIE
                </Link>
              )}

              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="text-theme-text-primary hover:text-green-400 font-medium font-display">PAINEL</Link>
                  <div className="border-t border-theme-border pt-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-theme-bg-tertiary rounded-full overflow-hidden border border-theme-border">
                        <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`} alt="Avatar" />
                      </div>
                      <span className="font-semibold text-theme-text-primary font-display">{user.name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-1.5 rounded-lg font-black tracking-widest uppercase text-[11px] transition-all"
                      style={{
                        backgroundColor: '#ff0000',
                        color: '#ffffff',
                        boxShadow: '0 0 15px rgba(255, 0, 0, 0.6)',
                        border: 'none'
                      }}
                    >
                      Sair
                    </button>
                  </div>
                  {/* Offline mode indicator removed */}
                  <div className="bg-theme-bg-secondary text-theme-text-primary p-3 rounded-lg mt-2 flex justify-between items-center border border-theme-border">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${!isOfflineMode ? 'bg-[color:var(--header-accent)]' : 'bg-red-500'}`} />

                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-[color:var(--header-accent-2)]" />
                      <span className="font-mono text-sm">{streak} dias</span>
                    </div>
                    <span className="font-mono text-[color:var(--header-accent)] text-sm">{score} XP</span>
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => {
                    setIsMenuOpen(false);
                    playNavigation();
                  }}
                  className="bg-[color:var(--header-accent)] text-[color:var(--header-contrast)] text-center py-3 rounded-lg font-display font-bold hover:brightness-110 transition-colors"
                >
                  ACESSAR SISTEMA
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <CharacterSelector
        isOpen={isCharacterSelectorOpen}
        onClose={() => setIsCharacterSelectorOpen(false)}
      />
    </header>
  );
};

export default Header;
