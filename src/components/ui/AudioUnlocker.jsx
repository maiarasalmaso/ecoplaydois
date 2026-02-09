import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, MousePointer2, Smartphone } from 'lucide-react';
import { playStart } from '@/utils/soundEffects';

const AudioUnlocker = () => {
    const [locked, setLocked] = useState(true);

    const handleUnlock = () => {
        // Tenta iniciar/desbloquear o áudio com uma interação direta do usuário
        try {
            playStart();
            // Opcionalmente, podemos tentar desbloquear outros contextos se houver
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                ctx.resume();
                ctx.close(); // Apenas para "acordar" o navegador se necessário, mas o playStart é o principal
            }
        } catch (e) {
            console.warn('Audio unlock failed', e);
        }
        setLocked(false);
    };

    return (
        <AnimatePresence>
            {locked && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/95 backdrop-blur-md"
                    onClick={handleUnlock}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center p-8 max-w-sm mx-4"
                    >
                        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                            <div className="absolute inset-0 bg-eco-green/20 rounded-full animate-ping" />
                            <div className="relative bg-eco-green rounded-full p-5 text-slate-900 shadow-[0_0_30px_rgba(74,222,128,0.4)]">
                                <MousePointer2 className="w-8 h-8 hidden md:block" />
                                <Smartphone className="w-8 h-8 md:hidden" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-display font-bold text-white mb-2">
                            Toque para Iniciar
                        </h2>
                        <p className="text-slate-400 mb-8">
                            Clique em qualquer lugar para ativar o som e a experiência completa.
                        </p>

                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-eco-green text-sm font-mono tracking-widest uppercase"
                        >
                            • Sistema Pronto •
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AudioUnlocker;
