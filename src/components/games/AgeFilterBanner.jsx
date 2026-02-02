import { motion } from 'framer-motion';
import { Shield, RotateCcw } from 'lucide-react';
import { useAgeFilter } from "@/context/AgeFilterContext";

const AgeFilterBanner = () => {
  const { selectedAge, isAgeVerified, resetAgeFilter } = useAgeFilter();

  if (!isAgeVerified) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-4 mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">
              Filtro de Idade Ativado
            </h3>
            <p className="text-blue-300 text-sm">
              Mostrando conteúdo para {selectedAge} anos
            </p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetAgeFilter}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Alterar
        </motion.button>
      </div>
    </motion.div>
  );
};

export default AgeFilterBanner;