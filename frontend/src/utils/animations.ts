/**
 * Animation utilities and constants for consistent, smooth animations
 * across the application
 */

/**
 * Framer Motion animation variants for common UI patterns
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: 'easeOut' }
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: 'easeOut' }
};

export const slideInFromBottom = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50 },
  transition: { duration: 0.4, ease: 'easeOut' }
};

/**
 * Stagger children animation
 */
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

/**
 * Tailwind CSS animation classes for non-Framer Motion usage
 */
export const animationClasses = {
  // Page entrance
  pageEnter: 'animate-fade-in',

  // Smooth transitions
  smoothAll: 'transition-all duration-300 ease-out',
  smoothTransform: 'transition-transform duration-300 ease-out',
  smoothOpacity: 'transition-opacity duration-200 ease-out',
  smoothColors: 'transition-colors duration-200 ease-out',

  // Hover effects
  hoverLift: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-200',
  hoverScale: 'hover:scale-105 transition-transform duration-200',
  hoverBrightness: 'hover:brightness-110 transition-all duration-200',

  // Button animations
  buttonPress: 'active:scale-95 transition-transform duration-100',
  buttonHover: 'hover:scale-105 active:scale-95 transition-transform duration-200',

  // Card animations
  cardHover: 'hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-out',
  cardEnter: 'animate-fade-in-up',

  // Loading states
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',

  // Micro-interactions
  wiggle: 'hover:animate-wiggle',
  shake: 'animate-shake'
};

/**
 * Combine multiple animation classes
 */
export const combineAnimations = (...classes: string[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Duration constants (in milliseconds)
 */
export const ANIMATION_DURATION = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800
};

/**
 * Easing functions
 */
export const EASING = {
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
};

/**
 * Delay constants for staggered animations (in milliseconds)
 */
export const STAGGER_DELAY = {
  veryShort: 50,
  short: 100,
  normal: 150,
  long: 200
};

export default {
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  slideInFromBottom,
  staggerContainer,
  staggerItem,
  animationClasses,
  combineAnimations,
  ANIMATION_DURATION,
  EASING,
  STAGGER_DELAY
};
