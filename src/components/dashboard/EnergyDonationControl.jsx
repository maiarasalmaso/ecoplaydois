import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertTriangle, Check, X } from 'lucide-react';
import { playClick, playSuccess } from '@/utils/soundEffects';

const EnergyDonationControl = ({ energy, onDonate }) => {
    const [isConfirmingMax, setIsConfirmingMax] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
    const [isDonating, setIsDonating] = useState(false);

    const handleDonateClick = () => {
        playClick();
        setIsConfirmingMax(true);
    };

    const executeDonation = async () => {
        if (energy <= 0 || isDonating) return;

        setIsDonating(true);
        const amount = energy; // Donate everything

        const success = await onDonate(amount);

        if (success) {
            playSuccess();
            setFeedback({ type: 'success', message: `+${Math.floor(amount / 100)} XP` });
            setTimeout(() => setFeedback(null), 2000);
        } else {
            setFeedback({ type: 'error', message: 'Erro ao doar' });
        }

        setIsDonating(false);
        setIsConfirmingMax(false);
    };

    // Safe XP calculation for preview
    const xpPreview = Math.floor(energy / 100);

    return (
        <div className="bg-gradient-to-r from-theme-bg-tertiary/30 to-theme-bg-secondary border border-theme-border p-5 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">

            {/* Header/Info */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 shrink-0">
                    <Zap className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-theme-text-primary">Estabilizar Rede</h3>
                    <p className="text-xs text-theme-text-tertiary">
                        Doe energia para ganhar XP (100e = 1 XP).
                    </p>
                </div>
            </div>

            {/* Main Button */}
            <div className="relative">
                <button
                    onClick={handleDonateClick}
                    disabled={energy < 100 || isDonating}
                    className="relative px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-bold text-sm shadow-lg shadow-yellow-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center gap-2 min-w-[160px] justify-center"
                >
                    {isDonating ? 'Enviando...' : `Doar Tudo (${Intl.NumberFormat('pt-BR', { notation: "compact" }).format(energy)})`}
                    {!isDonating && <Zap className="w-4 h-4 fill-yellow-950" />}
                </button>

                {/* Feedback Float */}
                <AnimatePresence>
                    {feedback && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: -40 }}
                            exit={{ opacity: 0 }}
                            className="absolute left-1/2 -translate-x-1/2 -top-2 whitespace-nowrap bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg pointer-events-none z-20"
                        >
                            {feedback.message}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Confirmation Modal - PORTAL to escape overflow-hidden */}
            {createPortal(
                <AnimatePresence>
                    {isConfirmingMax && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setIsConfirmingMax(false)}
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="relative bg-theme-bg-tertiary border border-theme-border rounded-2xl p-6 shadow-2xl w-full max-w-sm text-center z-20"
                            >
                                <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                                <h4 className="font-bold text-xl text-theme-text-primary mb-2">Doar Tudo?</h4>
                                <p className="text-sm text-theme-text-secondary mb-6 leading-relaxed">
                                    Você vai doar <strong className="text-yellow-400">{Intl.NumberFormat('pt-BR').format(energy)}</strong> de energia e ganhar <strong className="text-green-400">+{xpPreview} XP</strong>.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => setIsConfirmingMax(false)}
                                        className="px-4 py-2 rounded-xl bg-theme-bg-primary border border-theme-border text-sm font-bold text-theme-text-secondary hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" /> Cancelar
                                    </button>
                                    <button
                                        onClick={executeDonation}
                                        className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-yellow-950 text-sm font-bold shadow-lg shadow-yellow-500/20 transition-colors flex items-center gap-2"
                                    >
                                        <Check className="w-4 h-4" /> Confirmar
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default EnergyDonationControl;
