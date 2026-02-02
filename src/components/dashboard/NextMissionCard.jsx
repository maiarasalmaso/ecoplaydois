import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Map, ArrowRight, Play, Star } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const NextMissionCard = () => {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    // In a real app, this would come from GameState
    const nextMission = {
        title: 'Eco Guardian',
        subtitle: 'Nível 2: Limpeza Costeira',
        reward: '150 XP',
        path: '/games',
        color: isLight ? '#2563eb' : '#3b82f6', // blue-600/500
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-3xl p-8 shadow-2xl border border-theme-border relative overflow-hidden group"
        >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6 text-center md:text-left">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg relative z-10 transform group-hover:rotate-6 transition-transform duration-300">
                            <Map className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                            <span className="text-xs font-mono uppercase tracking-wider text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full bg-blue-500/10">
                                Próxima Missão
                            </span>
                            <span className="flex items-center gap-1 text-xs font-bold text-amber-500 dark:text-yellow-400">
                                <Star className="w-3 h-3 fill-amber-500 dark:fill-yellow-400" />
                                {nextMission.reward}
                            </span>
                        </div>
                        <h3 className="text-2xl font-display font-bold text-theme-text-primary mb-1">
                            {nextMission.title}
                        </h3>
                        <p className="text-theme-text-secondary">
                            {nextMission.subtitle}
                        </p>
                    </div>
                </div>

                <Link
                    to={nextMission.path}
                    className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold font-display shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300 group/btn"
                >
                    <Play className="w-5 h-5 fill-current" />
                    INICIAR JOGO
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
            </div>
        </motion.div>
    );
};

export default NextMissionCard;
