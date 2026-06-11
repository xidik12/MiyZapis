import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface InlineLoaderProps {
  size?: 'xs' | 'sm' | 'md';
  color?: 'current' | 'primary' | 'white' | 'gray';
  className?: string;
}

/**
 * InlineLoader - Compact loading indicator for buttons and inline contexts
 * Perfect for button loading states and tight spaces
 */
export const InlineLoader: React.FC<InlineLoaderProps> = ({
  size = 'sm',
  color = 'current',
  className,
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  const colorClasses = {
    current: 'text-current',
    primary: 'text-primary-600 dark:text-primary-400',
    white: 'text-white',
    gray: 'text-gray-600 dark:text-gray-300',
  };

  return (
    <motion.svg
      className={clsx('inline-block', sizeClasses[size], colorClasses[color], className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
      role="status"
      animate={{ rotate: 360 }}
      transition={{ rotate: { duration: 0.9, repeat: Infinity, ease: 'linear' } }}
      style={{ transformOrigin: 'center' }}
    >
      {/* faint full-circle track */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      {/* solid leading arc (≈ quarter turn) */}
      <path
        d="M12 2 a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </motion.svg>
  );
};

export default InlineLoader;
