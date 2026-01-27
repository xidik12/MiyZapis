/**
 * Animation utilities for React Native
 * Reusable animations using react-native-reanimated
 */
import { withSpring, withTiming, withDelay, Easing } from 'react-native-reanimated';

/**
 * Spring animation configuration
 */
export const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
};

/**
 * Timing animation configuration
 */
export const TIMING_CONFIG = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

/**
 * Staggered entrance animation for list items
 * @param index - Item index in the list
 * @param delay - Base delay in ms (default: 50ms)
 * @returns Animation value
 */
export const staggeredEnterAnimation = (index: number, delay: number = 50) => {
  'worklet';
  return {
    opacity: withDelay(
      index * delay,
      withTiming(1, { duration: 400, easing: Easing.ease })
    ),
    transform: [
      {
        translateY: withDelay(
          index * delay,
          withSpring(0, SPRING_CONFIG)
        ),
      },
    ],
  };
};

/**
 * Fade in animation
 */
export const fadeIn = (duration: number = 300) => {
  'worklet';
  return {
    opacity: withTiming(1, { duration, easing: Easing.ease }),
  };
};

/**
 * Fade out animation
 */
export const fadeOut = (duration: number = 300) => {
  'worklet';
  return {
    opacity: withTiming(0, { duration, easing: Easing.ease }),
  };
};

/**
 * Slide in from bottom animation
 */
export const slideInFromBottom = (distance: number = 50) => {
  'worklet';
  return {
    opacity: withTiming(1, { duration: 400, easing: Easing.ease }),
    transform: [
      {
        translateY: withSpring(0, SPRING_CONFIG),
      },
    ],
  };
};

/**
 * Slide in from right animation
 */
export const slideInFromRight = (distance: number = 50) => {
  'worklet';
  return {
    opacity: withTiming(1, { duration: 400, easing: Easing.ease }),
    transform: [
      {
        translateX: withSpring(0, SPRING_CONFIG),
      },
    ],
  };
};

/**
 * Scale in animation (bouncy entrance)
 */
export const scaleIn = () => {
  'worklet';
  return {
    opacity: withTiming(1, { duration: 300, easing: Easing.ease }),
    transform: [
      {
        scale: withSpring(1, { ...SPRING_CONFIG, damping: 10 }),
      },
    ],
  };
};

/**
 * Rotate in animation
 */
export const rotateIn = () => {
  'worklet';
  return {
    opacity: withTiming(1, { duration: 400, easing: Easing.ease }),
    transform: [
      {
        rotate: withSpring('0deg', SPRING_CONFIG),
      },
    ],
  };
};

/**
 * Initial values for animations
 */
export const ANIMATION_INITIAL_VALUES = {
  staggeredEnter: {
    opacity: 0,
    transform: [{ translateY: 20 }],
  },
  fadeIn: {
    opacity: 0,
  },
  slideInFromBottom: {
    opacity: 0,
    transform: [{ translateY: 50 }],
  },
  slideInFromRight: {
    opacity: 0,
    transform: [{ translateX: 50 }],
  },
  scaleIn: {
    opacity: 0,
    transform: [{ scale: 0.8 }],
  },
  rotateIn: {
    opacity: 0,
    transform: [{ rotate: '-10deg' }],
  },
};
