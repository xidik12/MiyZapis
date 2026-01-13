import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingAnimation, LoadingAnimationType } from './LoadingAnimation';

interface FullScreenLoaderProps {
  isOpen?: boolean;
  title?: string;
  subtitle?: string;
  animationType?: LoadingAnimationType;
  showProgress?: boolean;
  progress?: number;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  isOpen = true,
  title = 'Loading',
  subtitle,
  animationType = 'spinner',
  showProgress = false,
  progress = 0,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm"
          role="dialog"
          aria-busy="true"
          aria-live="polite"
          aria-label={title}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Gradient orbs */}
            <motion.div
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 dark:bg-primary-400/5 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                x: [0, 50, 0],
                y: [0, 30, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 dark:bg-secondary-400/5 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                x: [0, -50, 0],
                y: [0, -30, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="relative flex flex-col items-center text-center px-6 py-8 max-w-md"
          >
            {/* Loading animation */}
            <LoadingAnimation type={animationType} size="xl" color="primary" />

            {/* Text */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-8 space-y-2"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {subtitle.includes('.') ? 'Please wait...' : subtitle}
                </p>
              )}
            </motion.div>

            {/* Progress bar */}
            {showProgress && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 w-full max-w-xs"
              >
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-500 text-center">
                  {Math.round(progress)}%
                </p>
              </motion.div>
            )}

            {/* Loading dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 flex gap-1.5"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullScreenLoader;
