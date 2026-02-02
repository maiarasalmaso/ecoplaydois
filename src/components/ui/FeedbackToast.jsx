import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

/**
 * FeedbackToast displays a temporary toast based on feedback state.
 * Props:
 *   - feedback: { type: 'success' | 'danger' | 'warning', text: string } | null
 *   - setFeedback: function to clear the feedback after display
 */
const FeedbackToast = ({ feedback, setFeedback }) => {
  if (!feedback) return null;

  const bgClass =
    feedback.type === 'danger'
      ? 'bg-red-500 text-white'
      : feedback.type === 'warning'
        ? 'bg-amber-500 text-black'
        : 'bg-green-500 text-white'; // success

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-xl font-bold text-lg flex items-center gap-2 ${bgClass}`}
        onAnimationComplete={() => {
          // Only auto-hide if NOT persistent
          if (!feedback.persistent) {
            setTimeout(() => setFeedback(null), 1500);
          }
        }}
      >
        {feedback.type === 'danger' && <AlertTriangle className="w-6 h-6" />}
        {feedback.type === 'warning' && <AlertTriangle className="w-6 h-6" />}
        <span className="mr-2">{feedback.text}</span>

        {feedback.persistent && (
          <button
            onClick={() => setFeedback(null)}
            className="ml-2 p-1 hover:bg-black/20 rounded-full transition-colors"
          >
            <div className="text-sm font-bold">✕</div>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default FeedbackToast;
