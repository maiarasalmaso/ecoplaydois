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
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                />

                <div
                    className="relative bg-theme-bg-secondary/95 backdrop-blur-xl w-full max-w-3xl rounded-3xl border border-theme-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 mt-16 animate-in fade-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-theme-border bg-theme-bg-tertiary/30 shrink-0 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-theme-text-primary flex items-center gap-3">
                                <span className="text-3xl filter drop-shadow-md">🛡️</span>
                                <span>Escolha seu Guardião</span>
                            </h2>
                            <p className="text-theme-text-tertiary text-sm mt-1 font-medium">
                                Selecione um avatar para sua identidade na base.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-theme-bg-tertiary rounded-full transition-colors group"
                        >
                            <X className="w-6 h-6 text-theme-text-tertiary group-hover:text-red-400 transition-colors" />
                        </button>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-theme-bg-primary/50">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 justify-items-center">

                            {/* Random Option */}
                            <button
                                onClick={handleRandom}
                                disabled={isRolling}
                                className={`aspect-square w-24 h-24 rounded-2xl border-2 border-dashed border-theme-border hover:border-green-500/50 flex flex-col items-center justify-center gap-2 group transition-all duration-300 bg-theme-bg-tertiary/30 ${isRolling ? 'opacity-50 cursor-wait' : 'hover:bg-theme-bg-tertiary hover:-translate-y-1'}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-theme-bg-secondary flex items-center justify-center group-hover:bg-green-500/20 transition-colors shadow-sm">
                                    <Dices className="w-5 h-5 text-theme-text-secondary group-hover:text-green-400 transition-colors" />
                                </div>
                                <span className="font-bold text-xs uppercase tracking-wide text-theme-text-tertiary group-hover:text-green-400 transition-colors">Aleatório</span>
                            </button>

                            {AVATAR_SEEDS.map((seed) => {
                                const isSelected = selectedSeed === seed;
                                return (
                                    <div key={seed} onClick={() => handleSelect(seed)} className="cursor-pointer relative group">
                                        <div
                                            className={`aspect-square w-24 h-24 rounded-2xl border-2 p-1.5 transition-all duration-300 relative overflow-hidden flex items-center justify-center bg-theme-bg-secondary
                                            ${isSelected
                                                    ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-105 z-10'
                                                    : 'border-theme-border opacity-80 hover:opacity-100 hover:border-theme-border/80 hover:scale-105 hover:shadow-lg'
                                                }`}
                                        >
                                            <div className="w-full h-full rounded-xl overflow-hidden bg-theme-bg-tertiary relative">
                                                <img
                                                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`}
                                                    alt={seed}
                                                    className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}
                                                />
                                            </div>

                                            {isSelected && (
                                                <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg z-20 animate-in zoom-in spin-in-90 duration-300">
                                                    <Check className="w-3 h-3 stroke-[3]" />
                                                </div>
                                            )}
                                        </div>
                                        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 transition-all duration-300 z-20 ${isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}`}>
                                            <span className="text-[10px] font-mono font-bold bg-theme-bg-secondary/90 border border-theme-border text-theme-text-primary px-3 py-1 rounded-full shadow-xl backdrop-blur-md whitespace-nowrap">
                                                {seed}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer with Buttons */}
                    <div className="p-6 border-t border-theme-border bg-theme-bg-tertiary/30 flex justify-end gap-3 shrink-0">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-2xl border border-theme-border text-theme-text-secondary hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 font-bold text-sm transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-2xl shadow-lg shadow-green-500/20 text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border border-green-400/20"
                        >
                            <Check className="w-4 h-4 stroke-[3]" />
                            Confirmar Guardião
                        </button>
                    </div>
                </div>
            </div>
        ) : null,
        document.body
    );
};

export default CharacterSelector;
