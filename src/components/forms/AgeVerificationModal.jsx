import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X } from 'lucide-react';
import { useAgeFilter } from '@/context/AgeFilterContext';

const AgeVerificationModal = ({ isOpen, onClose, onVerify }) => {
  const { ageRestrictions, verifyAge } = useAgeFilter();
  const [selectedAge, setSelectedAge] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (selectedAge) {
      setIsVerifying(true);
      const success = verifyAge(selectedAge);
      setIsVerifying(false);

      if (success && onVerify) {
        onVerify(selectedAge);
      }

      if (onClose) {
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Verificação de Idade
              </h2>
              <p className="text-slate-400">
                Por favor, selecione sua idade para acessar o conteúdo apropriado.
              </p>
            </div>

            <div className="grid grid-cols-5 gap-3 mb-6">
              {Object.entries(ageRestrictions).map(([age, restriction]) => (
                <motion.button
                  key={age}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedAge(parseInt(age))}
                  className={`aspect-square rounded-xl font-bold text-lg transition-all ${selectedAge === parseInt(age)
                      ? `${restriction.color} text-white shadow-lg`
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                >
                  {age}
                </motion.button>
              ))}
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleVerify}
                disabled={!selectedAge || isVerifying}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:text-slate-400 text-white rounded-xl font-medium transition-colors"
              >
                {isVerifying ? 'Verificando...' : 'Confirmar'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AgeVerificationModal;