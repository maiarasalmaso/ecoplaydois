import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Zap, ThumbsUp, ThumbsDown, Lightbulb, X } from 'lucide-react';
import { ENERGY_SOURCES } from '@/data/energySources';
import { useGameState } from '@/context/GameStateContext';
import { useTheme } from '@/context/ThemeContext';

import { playStamp } from '@/utils/soundEffects';

const getDayOfYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
};

const EnergySourceCard = () => {
    const { addScore } = useGameState();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    // Default to day-based rotation
    const dayOfYear = getDayOfYear();
    const initialSourceIndex = dayOfYear % ENERGY_SOURCES.length;

    const [currentIndex, setCurrentIndex] = useState(initialSourceIndex);
    const [isOpen, setIsOpen] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);

    // Persist collected IDs to allow collecting each source once
    const [collectedIds, setCollectedIds] = useState(() => {
        try {
            const saved = localStorage.getItem('ecoplay_collected_energies');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const currentSource = ENERGY_SOURCES[currentIndex];
    const hasCollected = collectedIds.includes(currentSource.id);

    useEffect(() => {
        localStorage.setItem('ecoplay_collected_energies', JSON.stringify(collectedIds));
    }, [collectedIds]);

    const handleCollect = (e) => {
        e.stopPropagation();
        if (!hasCollected) {
            playStamp();
            setCollectedIds(prev => [...prev, currentSource.id]);
            addScore(50);
        }
    };

    // Theme-aware color mapping
    const colorMap = {
        amber: {
            bg: 'bg-amber-600/10 dark:bg-amber-500/10',
            border: 'border-amber-600/30 dark:border-amber-500/30',
            text: 'text-amber-600 dark:text-amber-500',
            title: 'text-amber-700 dark:text-amber-400',
            iconBg: 'bg-amber-600/20 dark:bg-amber-500/20',
            shadow: 'hover:shadow-amber-600/20 dark:hover:shadow-amber-500/20'
        },
        cyan: {
            bg: 'bg-cyan-600/10 dark:bg-cyan-500/10',
            border: 'border-cyan-600/30 dark:border-cyan-500/30',
            text: 'text-cyan-600 dark:text-cyan-500',
            title: 'text-cyan-700 dark:text-cyan-400',
            iconBg: 'bg-cyan-600/20 dark:bg-cyan-500/20',
            shadow: 'hover:shadow-cyan-600/20 dark:hover:shadow-cyan-500/20'
        },
        blue: {
            bg: 'bg-blue-600/10 dark:bg-blue-500/10',
            border: 'border-blue-600/30 dark:border-blue-500/30',
            text: 'text-blue-600 dark:text-blue-500',
            title: 'text-blue-700 dark:text-blue-400',
            iconBg: 'bg-blue-600/20 dark:bg-blue-500/20',
            shadow: 'hover:shadow-blue-600/20 dark:hover:shadow-blue-500/20'
        },
        green: {
            bg: 'bg-green-600/10 dark:bg-green-500/10',
            border: 'border-green-600/30 dark:border-green-500/30',
            text: 'text-green-600 dark:text-green-500',
            title: 'text-green-700 dark:text-green-400',
            iconBg: 'bg-green-600/20 dark:bg-green-500/20',
            shadow: 'hover:shadow-green-600/20 dark:hover:shadow-green-500/20'
        },
        rose: {
            bg: 'bg-rose-600/10 dark:bg-rose-500/10',
            border: 'border-rose-600/30 dark:border-rose-500/30',
            text: 'text-rose-600 dark:text-rose-500',
            title: 'text-rose-700 dark:text-rose-400',
            iconBg: 'bg-rose-600/20 dark:bg-rose-500/20',
            shadow: 'hover:shadow-rose-600/20 dark:hover:shadow-rose-500/20'
        },
    };

    const colors = colorMap[currentSource.color] || colorMap.green;

    const handleNext = () => {
        setIsSpinning(true);
        setTimeout(() => setIsSpinning(false), 500);
        // Rotate to next
        setCurrentIndex((prev) => (prev + 1) % ENERGY_SOURCES.length);
    };

    return (
        <>
            {/* MINI CARD (TRIGGER) */}
            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className={`bg-theme-bg-tertiary/70 p-4 rounded-3xl border border-theme-border cursor-pointer min-w-[180px] h-[130px] flex flex-col items-center justify-center gap-2 group relative overflow-hidden shadow-lg ${colors.shadow} transition-all`}
            >
                {/* Hover Glow */}
                <div className={`absolute inset-0 ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                <div className={`p-2.5 rounded-full ${colors.iconBg} relative z-10`}>
                    <currentSource.icon className={`w-6 h-6 ${colors.text} ${hasCollected ? '' : 'animate-pulse'}`} />
                </div>
                <div className="text-center relative z-10 leading-tight">
                    <span className="text-[10px] font-mono uppercase text-theme-text-tertiary block mb-1 tracking-wider">Energia do Dia</span>
                    <span className={`text-base font-display font-bold ${colors.title}`}>{currentSource.title.split(' ')[1] || currentSource.title.slice(0, 10)}</span>
                </div>
            </motion.div>

            {/* FULL CONTENT MODAL (PORTAL) */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="absolute inset-0 bg-theme-backdrop backdrop-blur-sm"
                            />

                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className={`relative w-full max-w-4xl bg-theme-bg-secondary border ${colors.border} rounded-3xl p-6 shadow-2xl overflow-hidden`}
                            >
                                {/* Modal Header */}
                                <div className="flex items-start justify-between mb-6 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-xl ${colors.iconBg}`}>
                                            <currentSource.icon className={`w-8 h-8 ${colors.text}`} />
                                        </div>
                                        <div>
                                            <span className="text-xs font-mono uppercase text-theme-text-tertiary">Fonte Renovável</span>
                                            <h2 className={`text-2xl font-display font-bold ${colors.title}`}>
                                                {currentSource.title}
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleNext}
                                            className="p-2 rounded-full hover:bg-theme-bg-tertiary text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
                                            title="Ver outra"
                                        >
                                            <RefreshCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
                                        </button>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="p-2 rounded-full hover:bg-theme-bg-tertiary text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="space-y-8 relative z-10">
                                    {/* Summary - Full Width */}
                                    <p className="text-theme-text-secondary leading-relaxed text-lg">
                                        {currentSource.summary}
                                    </p>

                                    {/* 3-Column Grid for Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Pros */}
                                        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl h-full">
                                            <h4 className="flex items-center gap-2 text-sm font-bold text-green-700 dark:text-green-400 mb-3">
                                                <ThumbsUp className="w-4 h-4" /> Vantagens
                                            </h4>
                                            <ul className="space-y-2">
                                                {currentSource.pros.map((pro, idx) => (
                                                    <li key={idx} className="text-sm text-theme-text-secondary font-medium flex items-start gap-2">
                                                        <span className="text-green-400 mt-1.5 min-w-[6px] h-[6px] rounded-full bg-green-400 block"></span>
                                                        <span>{pro}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Cons */}
                                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl h-full">
                                            <h4 className="flex items-center gap-2 text-sm font-bold text-red-500 mb-3">
                                                <ThumbsDown className="w-4 h-4" /> Desafios
                                            </h4>
                                            <ul className="space-y-2">
                                                {currentSource.cons.map((con, idx) => (
                                                    <li key={idx} className="text-sm text-theme-text-secondary font-medium flex items-start gap-2">
                                                        <span className="text-red-400 mt-1.5 min-w-[6px] h-[6px] rounded-full bg-red-400 block"></span>
                                                        <span>{con}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Fact */}
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 h-full flex flex-col">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Lightbulb className="w-4 h-4 text-yellow-500" />
                                                <span className="text-sm font-bold text-yellow-500">Curiosidade</span>
                                            </div>
                                            <p className="text-sm text-theme-text-secondary font-medium italic flex-grow">
                                                "{currentSource.fact}"
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Interaction: Collect XP */}
                                <div className="flex justify-center pt-2">
                                    <motion.button
                                        whileHover={!hasCollected ? { scale: 1.05 } : {}}
                                        whileTap={!hasCollected ? { scale: 0.95 } : {}}
                                        onClick={handleCollect}
                                        disabled={hasCollected}
                                        className={`px-8 py-3 rounded-xl font-bold font-display shadow-lg flex items-center gap-2 transition-all relative overflow-hidden ${hasCollected
                                            ? 'bg-slate-700 text-slate-400 cursor-default'
                                            : `bg-theme-primary text-theme-text-primary hover:shadow-green-500/40 hover:ring-2 hover:ring-green-400/50`
                                            }`}
                                    >
                                        {/* Shimmer Effect */}
                                        {!hasCollected && (
                                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
                                        )}

                                        <div className="relative z-10 flex items-center gap-2">
                                            <Zap className={`w-5 h-5 ${hasCollected ? '' : 'fill-white'}`} />
                                            {hasCollected ? 'Pontos Coletados!' : 'Coletar Conhecimento (+50 PC)'}
                                        </div>
                                    </motion.button>
                                </div>

                                {/* Background Decoration & Reflections - Removed for cleaner look */}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default EnergySourceCard;
