import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Gamepad2, User, Menu as MenuIcon, X, LogOut, Star, Trophy } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useGameState } from '@/context/GameStateContext';
import { playClick, playNavigation } from '@/utils/soundEffects';

const MobileDock = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { score } = useGameState();

    // Helper check if path is active
    const isActive = (path) => location.pathname === path;

    // Minimal routes check not strictly needed as layout wraps content, 
    // but we might want to hide dock on some pages? 
    // For now, show on all pages handled by Layout.

    const handleLogout = () => {
        logout();
        setIsOpen(false);
        navigate('/');
    };

    const navItemClass = (path) => `
    flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors relative
    ${isActive(path) ? 'text-green-400' : 'text-theme-text-tertiary hover:text-theme-text-secondary'}
  `;

    return (
        <>
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] h-16 bg-theme-bg-secondary/95 backdrop-blur-xl border-t border-theme-border flex items-center justify-between px-6 pb-1">
                <Link
                    to="/"
                    onClick={playNavigation}
                    className={navItemClass('/')}
                >
                    <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">Início</span>
                    {isActive('/') && (
                        <motion.div layoutId="dock-active" className="absolute -bottom-2 w-1 h-1 bg-green-400 rounded-full" />
                    )}
                </Link>

                <Link
                    to="/games"
                    onClick={playNavigation}
                    className={navItemClass('/games')}
                >
                    <Gamepad2 size={24} strokeWidth={isActive('/games') ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">Jogos</span>
                    {isActive('/games') && (
                        <motion.div layoutId="dock-active" className="absolute -bottom-2 w-1 h-1 bg-green-400 rounded-full" />
                    )}
                </Link>

                <Link
                    to={user ? "/dashboard" : "/login"}
                    onClick={playNavigation}
                    className={navItemClass(user ? '/dashboard' : '/login')}
                >
                    <User size={24} strokeWidth={isActive('/dashboard') ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">{user ? "Perfil" : "Entrar"}</span>
                    {isActive(user ? '/dashboard' : '/login') && (
                        <motion.div layoutId="dock-active" className="absolute -bottom-2 w-1 h-1 bg-green-400 rounded-full" />
                    )}
                </Link>

                <button
                    onClick={() => { setIsOpen(true); playClick(); }}
                    className="flex flex-col items-center justify-center w-14 h-full gap-1 text-theme-text-tertiary hover:text-theme-text-secondary transition-colors"
                >
                    <MenuIcon size={24} />
                    <span className="text-[10px] font-bold">Mais</span>
                </button>
            </div>

            {/* Full Screen Menu Portal */}
            <AnimatePresence>
                {isOpen && createPortal(
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[200] bg-theme-bg-primary/95 backdrop-blur-2xl md:hidden overflow-y-auto flex flex-col px-6 py-8"
                    >
                        {/* Header of Menu */}
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-xl font-display font-bold text-white">Menu</span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 bg-theme-bg-tertiary rounded-full hover:bg-theme-bg-secondary transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col gap-4">
                            <Link to="/" onClick={() => setIsOpen(false)} className="p-4 bg-theme-bg-tertiary/50 rounded-xl border border-theme-border flex items-center gap-3 font-bold text-theme-text-primary">
                                <Home className="text-green-400" size={20} /> Início
                            </Link>
                            <Link to="/games" onClick={() => setIsOpen(false)} className="p-4 bg-theme-bg-tertiary/50 rounded-xl border border-theme-border flex items-center gap-3 font-bold text-theme-text-primary">
                                <Gamepad2 className="text-green-400" size={20} /> Jogos
                            </Link>
                            <Link to="/about" onClick={() => setIsOpen(false)} className="p-4 bg-theme-bg-tertiary/50 rounded-xl border border-theme-border flex items-center gap-3 font-bold text-theme-text-primary">
                                <Star className="text-yellow-400" size={20} /> Sobre o Projeto
                            </Link>

                            {user && (
                                <div className="mt-4 p-4 bg-theme-bg-secondary rounded-xl border border-theme-border">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-theme-bg-tertiary overflow-hidden">
                                            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`} alt="Avatar" />
                                        </div>
                                        <div>
                                            <div className="font-bold">{user.name}</div>
                                            <div className="text-xs text-green-400">{score} XP</div>
                                        </div>
                                    </div>
                                    <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block w-full py-2 text-center bg-theme-bg-tertiary rounded-lg mb-2 font-bold text-sm">
                                        Painel Completo
                                    </Link>
                                    <button onClick={handleLogout} className="block w-full py-2 text-center bg-red-500/10 text-red-400 rounded-lg font-bold text-sm">
                                        Sair da Conta
                                    </button>
                                </div>
                            )}

                            {!user && (
                                <Link to="/login" onClick={() => setIsOpen(false)} className="mt-4 p-4 bg-green-500 text-black font-bold text-center rounded-xl shadow-lg shadow-green-500/20">
                                    Entrar / Cadastrar
                                </Link>
                            )}
                        </div>

                        {/* Footer Info */}
                        <div className="mt-auto pt-8 text-center text-xs text-theme-text-tertiary">
                            EcoPlay v2.0 - Mobile Edition
                        </div>

                    </motion.div>,
                    document.body
                )}
            </AnimatePresence>
        </>
    );
};

export default MobileDock;
