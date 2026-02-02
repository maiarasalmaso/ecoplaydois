import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Calendar, Star, Zap } from 'lucide-react';
import { useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { recordFeedbackCtaClick } from '@/utils/feedbackStore';
import { isRemoteDbEnabled } from '@/services/remoteDb';
import { getLevel } from '@/utils/gamification';
import { playNavigation } from '@/utils/soundEffects';
import ThemeToggle from '@/components/ui/ThemeToggle';

const Header = () => {
  const location = useLocation();
  const { score } = useGameState();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const minimalRoutes = new Set(['/', '/login', '/register', '/admin']);
  const isMinimal = minimalRoutes.has(location.pathname);
  const canShowFeedbackCta = Boolean(user) && !isMinimal;
  const isOfflineMode = !isRemoteDbEnabled();

  // Mock de nível e XP para visualização
  const level = Math.floor(score / 1000) + 1;
  const xpPercentage = (score % 1000) / 10;
  const streak = user?.streak || 0;

  // Obter nível dinâmico (sincronizado com Dashboard)
  const currentLevel = getLevel(score);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleFeedbackClick = () => {
    recordFeedbackCtaClick({ pathname: location.pathname });
  };

  if (isMinimal) {
    return (
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 gap-3">
            <div className="w-1/3 flex items-center gap-2">
              {/* Server Status Indicator (Minimal Header) */}

            </div>
            <Link to="/" className="flex items-center gap-3 group relative">
              <div className="absolute inset-0 bg-eco-green/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-2.5 rounded-xl border border-slate-700 shadow-lg group-hover:scale-105 transition-transform relative z-10 flex items-center justify-center">
                <span className="terra-girando text-2xl leading-none">
                  🌍
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-2xl tracking-wide text-white leading-none">
                  ECO<span className="text-eco-green">PLAY</span>
                </span>
              </div>
            </Link>
            <div className="w-1/3 flex justify-end items-center gap-3">
              {canShowFeedbackCta && (
                <Link
                  to="/avaliacao"
                  onClick={handleFeedbackClick}
                  className="inline-flex items-center gap-2 bg-slate-800/60 hover:bg-slate-700/70 text-slate-100 px-4 py-2 rounded-xl font-display font-bold transition-all border border-slate-700 shadow-lg"
                >
                  <Star className="w-4 h-4 text-yellow-400" />
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
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo HUD Style */}
          <Link to="/" className="flex items-center gap-3 group relative">
            <div className="absolute inset-0 bg-eco-green/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-2.5 rounded-xl border border-slate-700 shadow-lg group-hover:scale-105 transition-transform relative z-10 flex items-center justify-center">
              <span className="terra-girando text-2xl leading-none">
                🌍
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-2xl tracking-wide text-white leading-none">
                ECO<span className="text-eco-green">PLAY</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav HUD */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1.5 rounded-full border border-slate-700/50 backdrop-blur-md">
            <Link to="/" className="px-5 py-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 hover:shadow-lg hover:shadow-eco-green/10 font-medium transition-all duration-300 text-sm font-display relative group overflow-hidden">
              <span className="relative z-10">BASE</span>
              <div className="absolute inset-0 bg-gradient-to-r from-eco-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <Link to="/games" className="px-5 py-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 hover:shadow-lg hover:shadow-eco-green/10 font-medium transition-all duration-300 text-sm font-display relative group overflow-hidden">
              <span className="relative z-10">JOGOS</span>
              <div className="absolute inset-0 bg-gradient-to-r from-eco-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            {canShowFeedbackCta && (
              <Link
                to="/avaliacao"
                onClick={handleFeedbackClick}
                className="px-5 py-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 hover:shadow-lg hover:shadow-eco-green/10 font-medium transition-all duration-300 text-sm font-display relative group overflow-hidden"
              >
                <span className="relative z-10">NOS AVALIE</span>
                <div className="absolute inset-0 bg-gradient-to-r from-eco-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            )}
            {user && (
              <Link
                to="/dashboard"
                className="sound-hover px-5 py-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 hover:shadow-lg hover:shadow-eco-green/10 font-medium transition-all duration-300 text-sm font-display relative group overflow-hidden"
              >
                <span className="relative z-10">PAINEL</span>
                <div className="absolute inset-0 bg-gradient-to-r from-eco-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            )}
          </nav>

          {/* User Stats & Auth Buttons */}
          <div className="flex items-center gap-4">
            {/* Server Status Indicator */}


            {user ? (
              <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <div className="hidden md:flex items-center">
                  <ThemeToggle />
                </div>

                {/* HUD Stats Panel */}
                <div className="hidden lg:flex items-center gap-4 bg-slate-900/50 text-white px-4 py-2 rounded-xl border border-slate-700/50 backdrop-blur-md shadow-lg">

                  {/* Streak */}
                  <div className="flex items-center gap-2 border-r border-slate-700 pr-4" title="Dias seguidos">
                    <Calendar className="w-5 h-5 text-orange-500 fill-orange-500/20" />
                    <span className="font-display font-bold text-orange-400">{streak}</span>
                  </div>

                  {/* Level & XP */}
                  <div className="flex flex-col w-32 gap-1">
                    <div className="flex justify-between text-[10px] font-mono uppercase text-slate-400">
                      <span>Lvl {level}</span>
                      <span className="text-eco-green">{score} XP</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${xpPercentage}%` }}
                        className="h-full bg-gradient-to-r from-eco-green to-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Avatar Profile */}
                <div className="flex items-center gap-3 pl-2 border-l border-slate-700">
                  <div className="text-right hidden md:block">
                    <div className="text-sm font-bold text-white font-display">{user.name}</div>
                    <div className="text-xs text-eco-green font-medium">{currentLevel.title}</div>
                  </div>
                  <Link to="/dashboard" className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-eco-green rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white border-2 border-slate-700 shadow-md relative z-10 overflow-hidden">
                      <img
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-red-500"
                    title="Desconectar"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => playNavigation()}
                className="hidden md:flex items-center gap-2 bg-eco-green hover:bg-eco-green-dark text-slate-900 px-6 py-2.5 rounded-xl font-display font-bold transition-all shadow-lg hover:shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:-translate-y-0.5"
              >
                <Zap className="w-4 h-4 text-slate-900 fill-slate-900" />
                ACESSAR SISTEMA
              </Link>
            )}

            <button
              className="md:hidden p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
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
            className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
          >
            <nav className="flex flex-col p-4 gap-4">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium font-display">BASE</Link>
              <Link to="/games" onClick={() => setIsMenuOpen(false)} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium font-display">JOGOS</Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium font-display">SOBRE</Link>
              {canShowFeedbackCta && (
                <Link
                  to="/avaliacao"
                  onClick={() => {
                    handleFeedbackClick();
                    setIsMenuOpen(false);
                  }}
                  className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium font-display"
                >
                  NOS AVALIE
                </Link>
              )}

              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium font-display">PAINEL</Link>
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-500 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`} alt="Avatar" />
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-white font-display">{user.name}</span>
                    </div>
                    <button onClick={handleLogout} className="text-red-500 text-sm font-medium hover:text-red-400">SAIR</button>
                  </div>
                  {/* Offline mode indicator removed */}
                  <div className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white p-3 rounded-lg mt-2 flex justify-between items-center border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${!isOfflineMode ? 'bg-emerald-500' : 'bg-red-500'}`} />

                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span className="font-mono text-sm">{streak} dias</span>
                    </div>
                    <span className="font-mono text-eco-green text-sm">{score} XP</span>
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => {
                    setIsMenuOpen(false);
                    playNavigation();
                  }}
                  className="bg-eco-green text-slate-900 text-center py-3 rounded-lg font-display font-bold hover:bg-eco-green-light transition-colors"
                >
                  ACESSAR SISTEMA
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
