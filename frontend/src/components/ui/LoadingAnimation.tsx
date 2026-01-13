import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export type LoadingAnimationType =
  | 'spinner'
  | 'sandwatch'
  | 'magnifying-glass'
  | 'dots'
  | 'pulse';

interface LoadingAnimationProps {
  type?: LoadingAnimationType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  text?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  type = 'spinner',
  size = 'md',
  color = 'primary',
  className,
  text,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const colorClasses = {
    primary: 'text-primary-600 dark:text-primary-400',
    secondary: 'text-secondary-600 dark:text-secondary-400',
    white: 'text-white',
    gray: 'text-gray-600 dark:text-gray-300',
  };

  const renderAnimation = () => {
    switch (type) {
      case 'sandwatch':
        return <SandwatchAnimation size={sizeClasses[size]} color={colorClasses[color]} />;
      case 'magnifying-glass':
        return <MagnifyingGlassAnimation size={sizeClasses[size]} color={colorClasses[color]} />;
      case 'dots':
        return <DotsAnimation size={sizeClasses[size]} color={colorClasses[color]} />;
      case 'pulse':
        return <PulseAnimation size={sizeClasses[size]} color={colorClasses[color]} />;
      case 'spinner':
      default:
        return <SpinnerAnimation size={sizeClasses[size]} color={colorClasses[color]} />;
    }
  };

  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3', className)} role="status">
      {renderAnimation()}
      {text && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-600 dark:text-gray-400 font-medium"
        >
          {text}
        </motion.p>
      )}
      <span className="sr-only">{text || 'Loading...'}</span>
    </div>
  );
};

// Modern Spinner Animation
const SpinnerAnimation: React.FC<{ size: string; color: string }> = ({ size, color }) => (
  <motion.div
    className={clsx('relative', size)}
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
  >
    <svg className="w-full h-full" viewBox="0 0 50 50">
      <motion.circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        strokeWidth="4"
        className={color}
        stroke="currentColor"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        initial={{ strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: [0, -62.8] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  </motion.div>
);

// Sandwatch Flipping Animation
const SandwatchAnimation: React.FC<{ size: string; color: string }> = ({ size, color }) => (
  <motion.div
    className={clsx('relative', size, color)}
    animate={{ rotateZ: [0, 0, 180, 180, 0] }}
    transition={{ duration: 2, repeat: Infinity, times: [0, 0.4, 0.5, 0.9, 1] }}
  >
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
      {/* Top half */}
      <path d="M6 2h12v6l-6 4-6-4V2z" opacity="0.3" />
      {/* Bottom half */}
      <path d="M6 22h12v-6l-6-4-6 4v6z" />
      {/* Sand particles */}
      <motion.circle
        cx="12"
        cy="12"
        r="1.5"
        fill="currentColor"
        initial={{ y: -4, opacity: 0 }}
        animate={{ y: [- 4, 4], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="10.5"
        cy="11"
        r="1"
        fill="currentColor"
        initial={{ y: -3, opacity: 0 }}
        animate={{ y: [-3, 5], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
      />
      <motion.circle
        cx="13.5"
        cy="11"
        r="1"
        fill="currentColor"
        initial={{ y: -3, opacity: 0 }}
        animate={{ y: [-3, 5], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />
      {/* Frame */}
      <path
        d="M6 2h12v6l-6 4-6-4V2zm0 20h12v-6l-6-4-6 4v6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  </motion.div>
);

// Magnifying Glass Searching Animation
const MagnifyingGlassAnimation: React.FC<{ size: string; color: string }> = ({ size, color }) => (
  <div className={clsx('relative', size)}>
    <motion.svg
      className={clsx('w-full h-full', color)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ x: [-2, 2, -2], y: [-2, 2, -2] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
      {/* Shine effect */}
      <motion.path
        d="M8 8l3 3"
        strokeWidth="1.5"
        opacity="0.5"
        animate={{ pathLength: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
    {/* Search particles */}
    <motion.div
      className="absolute inset-0"
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    >
      {[0, 120, 240].map((angle) => (
        <motion.div
          key={angle}
          className={clsx('absolute w-1 h-1 rounded-full', color.replace('text-', 'bg-'))}
          style={{
            left: '50%',
            top: '50%',
            transformOrigin: '0 0',
            rotate: angle,
          }}
          animate={{
            x: [0, 20, 0],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </motion.div>
  </div>
);

// Dots Animation
const DotsAnimation: React.FC<{ size: string; color: string }> = ({ size, color }) => {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -10 },
  };

  return (
    <div className={clsx('flex items-center gap-2', size)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={clsx('w-2.5 h-2.5 rounded-full', color.replace('text-', 'bg-'))}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: index * 0.15,
          }}
        />
      ))}
    </div>
  );
};

// Pulse Animation
const PulseAnimation: React.FC<{ size: string; color: string }> = ({ size, color }) => (
  <div className={clsx('relative', size)}>
    {[0, 1, 2].map((index) => (
      <motion.div
        key={index}
        className={clsx(
          'absolute inset-0 rounded-full border-2',
          color.replace('text-', 'border-')
        )}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: index * 0.6,
          ease: 'easeOut',
        }}
      />
    ))}
    <div
      className={clsx(
        'w-full h-full rounded-full',
        color.replace('text-', 'bg-')
      )}
    />
  </div>
);

export default LoadingAnimation;
