import React from 'react';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  senderName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ senderName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2 mb-2"
    >
      {/* Avatar placeholder */}
      <div className="w-8" />

      {/* Typing bubble */}
      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
};
