import { motion } from 'framer-motion';
import { Shield, Lock } from 'lucide-react';
import { useAgeFilter } from '@/context/AgeFilterContext';

const AgeRestrictedContent = ({ content, children, className = '' }) => {
  const { isContentAllowed, getAgeRestrictionMessage, isAgeVerified } = useAgeFilter();
  const isAllowed = isContentAllowed(content);
  const restrictionMessage = getAgeRestrictionMessage(content);

  if (isAllowed) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center ${className}`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
          {isAgeVerified ? (
            <Shield className="w-8 h-8 text-red-400" />
          ) : (
            <Lock className="w-8 h-8 text-red-400" />
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-white mb-2">
            Conteúdo Restrito
          </h3>
          <p className="text-slate-400 text-sm">
            {restrictionMessage || 'Este conteúdo não está disponível para sua idade.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AgeRestrictedContent;