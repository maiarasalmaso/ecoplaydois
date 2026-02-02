import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { playHover, playClick } from '@/utils/soundEffects';

const AVATAR_SEEDS = [
    'Felix', 'Aneka', 'Zoe', 'Marc', 'Veronika', 'Trouble', 'Brian', 'Barbara',
    'George', 'Boots', 'Midnight', 'Garfield', 'Whiskers', 'Shadow', 'Simba'
];

const AvatarSelectionModal = ({ isOpen, onClose }) => {
    const { user, updateProfile } = useAuth();

    if (!isOpen) return null;

    const handleSelect = async (seed) => {
        try {
            playClick();
            await updateProfile({ ...user, avatar: seed });
            onClose();
        } catch (error) {
            console.error("Avatar update failed", error);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-2xl w-full shadow-2xl overflow-hidden"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-display font-bold text-white">Escolha seu Avatar</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                        {AVATAR_SEEDS.map((seed) => {
                            const isSelected = user?.avatar === seed;
                            return (
                                <motion.button
                                    key={seed}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSelect(seed)}
                                    onMouseEnter={() => playHover()}
                                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${isSelected
                                        ? 'border-eco-green ring-4 ring-eco-green/20'
                                        : 'border-slate-700 hover:border-slate-500'
                                        }`}
                                >
                                    <img
                                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`}
                                        alt={seed}
                                        className="w-full h-full object-cover bg-slate-800"
                                    />
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-eco-green/20 flex items-center justify-center">
                                            <div className="bg-eco-green text-slate-900 rounded-full p-1">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        </div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AvatarSelectionModal;
