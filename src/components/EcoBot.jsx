import { motion } from 'framer-motion';
import { Bot, Sparkles, Zap } from 'lucide-react';

const EcoBot = ({ state = 'idle', message = '', className = '' }) => {
  // States: 'idle', 'thinking', 'happy', 'talking'

  const variants = {
    idle: { y: [0, -5, 0], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } },
    thinking: { rotate: [0, 5, -5, 0], transition: { repeat: Infinity, duration: 1 } },
    happy: { scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 0.5 } },
    talking: { y: [0, -2, 0], transition: { repeat: Infinity, duration: 0.2 } }
  };

  const glowColor = state === 'thinking' ? 'text-amber-400' : 'text-indigo-400';
  const bgColor = state === 'thinking' ? 'bg-amber-500/20' : 'bg-indigo-500/20';
  const borderColor = state === 'thinking' ? 'border-amber-500/30' : 'border-indigo-500/30';

  return (
    <div className={`flex items-start gap-4 ${className}`}>
      <motion.div
        animate={state}
        variants={variants}
        className={`relative w-12 h-12 rounded-2xl ${bgColor} ${borderColor} border flex items-center justify-center shadow-lg backdrop-blur-sm`}
      >
        <Bot className={`w-8 h-8 ${glowColor}`} />
        
        {/* Status Indicator */}
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${state === 'thinking' ? 'bg-amber-400' : 'bg-green-400'} border-2 border-slate-900`}
        />

        {/* Sparkles for AI magic */}
        {state === 'thinking' && (
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-2 -left-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
          </motion.div>
        )}
      </motion.div>

      {/* Speech Bubble */}
      {message && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-800/90 border border-slate-700 rounded-2xl rounded-tl-none p-3 shadow-xl max-w-xs relative"
        >
          <p className="text-sm text-slate-200 font-medium leading-relaxed">
            {message}
          </p>
          <div className="absolute top-0 left-0 -translate-x-[6px] -translate-y-[1px] w-3 h-3 bg-slate-800 border-l border-t border-slate-700 transform -rotate-45" />
        </motion.div>
      )}
    </div>
  );
};

export default EcoBot;
