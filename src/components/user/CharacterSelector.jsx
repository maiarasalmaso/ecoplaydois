import { X, Check, Dices } from 'lucide-react'; // Casino icon replaced by Dices
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import TiltContainer from '@/components/ui/TiltContainer';
import { playRouletteTick, playRouletteWin } from '@/utils/soundEffects';

const AVATAR_SEEDS = [
    'Felix', 'Aneka', 'Zoe', 'Max', 'Luna',
    'Sky', 'Pixel', 'Echo', 'Nova', 'Titan',
    'Leo', 'Maya', 'Rix', 'Jinx', 'Volt'
];

const CharacterSelector = ({ isOpen, onClose }) => {
    const { user, updateProfile } = useAuth();
    const [selectedSeed, setSelectedSeed] = useState(user?.avatar || 'default');

    const [isRolling, setIsRolling] = useState(false);

    if (!isOpen) return null;

    const handleSelect = (seed) => {
        setSelectedSeed(seed);
        // Manual confirmation now required
    };

    const handleConfirm = async () => {
        if (selectedSeed) {
            await updateProfile({ avatar: selectedSeed });
            onClose();
        }
    };

    const handleRandom = () => {
        if (isRolling) return;
        setIsRolling(true);

        // Roulette animation
        let rolls = 0;
        const maxRolls = 25; // More rolls
        const interval = setInterval(() => {
            rolls++;
            playRouletteTick(); // New fun tick
            const randomIdx = Math.floor(Math.random() * AVATAR_SEEDS.length);
            setSelectedSeed(AVATAR_SEEDS[randomIdx]);

            if (rolls >= maxRolls) {
                clearInterval(interval);
                setIsRolling(false);
                playRouletteWin(); // Happy finish
            }
        }, 80); // Faster (80ms)
    };

    return createPortal(
        isOpen ? (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                <div
                    className="relative bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 mt-16"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0">
                        <div className="flex justify-between items-start mb-1">
                            <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="text-2xl">🛡️</span> Escolha seu Guardião
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500 dark:text-white" />
                            </button>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Selecione um avatar e confirme para salvar.
                        </p>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 p-6 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 justify-items-center bg-slate-100 dark:bg-slate-900/50">

                        {/* Random Option */}
                        <button
                            onClick={handleRandom}
                            disabled={isRolling}
                            className={`aspect-square w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-400 flex flex-col items-center justify-center gap-1 group transition-colors bg-white dark:bg-slate-800/50 ${isRolling ? 'opacity-50 cursor-wait' : ''}`}
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                                <Dices className="w-5 h-5 text-slate-400 dark:text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
                            </div>
                            <span className="font-bold text-xs text-slate-500 dark:text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400">Aleatório</span>
                        </button>

                        {AVATAR_SEEDS.map((seed) => (
                            <div key={seed} onClick={() => handleSelect(seed)} className="cursor-pointer">
                                <div
                                    className={`aspect-square w-20 h-20 rounded-xl border-2 p-1.5 transition-all duration-300 relative overflow-hidden group flex items-center justify-center
                    ${selectedSeed === seed
                                            ? 'border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(74,222,128,0.4)] scale-105'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-green-400 hover:shadow-lg'
                                        }`}
                                >
                                    <img
                                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`}
                                        alt={seed}
                                        className="w-16 h-16 object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                                    />
                                    {selectedSeed === seed && (
                                        <div className="absolute top-1 right-1 bg-green-500 text-white p-0.5 rounded-full shadow-lg z-10">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-0.5 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[9px] font-mono font-bold bg-white/90 dark:bg-black/60 text-slate-800 dark:text-white border border-slate-200 dark:border-transparent px-2 py-0.5 rounded-full backdrop-blur-md shadow-sm">
                                            {seed}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer with Buttons */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3 shrink-0">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold rounded-xl text-sm transition-all"
                        >
                            Fechar
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        ) : null,
        document.body
    );
};

export default CharacterSelector;
