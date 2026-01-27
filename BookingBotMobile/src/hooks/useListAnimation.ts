/**
 * Custom hook for animating list items
 * Provides staggered entrance animations for FlatList/ScrollView items
 */
import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, Easing } from 'react-native-reanimated';

interface UseListAnimationOptions {
  index: number;
  delay?: number;
  enabled?: boolean;
}

/**
 * Hook for staggered list item entrance animation
 * @param options - Animation options
 * @returns Animated style object
 */
export const useListAnimation = ({
  index,
  delay = 50,
  enabled = true,
}: UseListAnimationOptions) => {
  const opacity = useSharedValue(enabled ? 0 : 1);
  const translateY = useSharedValue(enabled ? 20 : 0);

  useEffect(() => {
    if (!enabled) return;

    // Staggered entrance with delay based on index
    opacity.value = withDelay(
      index * delay,
      withTiming(1, { duration: 400, easing: Easing.ease })
    );

    translateY.value = withDelay(
      index * delay,
      withSpring(0, {
        damping: 15,
        stiffness: 150,
        mass: 0.5,
      })
    );
  }, [index, delay, enabled, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return animatedStyle;
};

/**
 * Hook for fade-in animation
 * @param enabled - Whether animation is enabled
 * @param duration - Animation duration in ms
 * @returns Animated style object
 */
export const useFadeIn = (enabled: boolean = true, duration: number = 300) => {
  const opacity = useSharedValue(enabled ? 0 : 1);

  useEffect(() => {
    if (!enabled) return;

    opacity.value = withTiming(1, { duration, easing: Easing.ease });
  }, [enabled, duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return animatedStyle;
};

/**
 * Hook for slide-in animation
 * @param direction - Direction to slide from ('bottom', 'right', 'left', 'top')
 * @param enabled - Whether animation is enabled
 * @param distance - Distance to slide in from
 * @returns Animated style object
 */
export const useSlideIn = (
  direction: 'bottom' | 'right' | 'left' | 'top' = 'bottom',
  enabled: boolean = true,
  distance: number = 50
) => {
  const opacity = useSharedValue(enabled ? 0 : 1);
  const translateX = useSharedValue(
    enabled && (direction === 'right' || direction === 'left')
      ? direction === 'right' ? distance : -distance
      : 0
  );
  const translateY = useSharedValue(
    enabled && (direction === 'bottom' || direction === 'top')
      ? direction === 'bottom' ? distance : -distance
      : 0
  );

  useEffect(() => {
    if (!enabled) return;

    opacity.value = withTiming(1, { duration: 400, easing: Easing.ease });

    if (direction === 'right' || direction === 'left') {
      translateX.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
        mass: 0.5,
      });
    } else {
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
        mass: 0.5,
      });
    }
  }, [enabled, direction, distance, opacity, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  return animatedStyle;
};

/**
 * Hook for scale animation
 * @param enabled - Whether animation is enabled
 * @returns Animated style object
 */
export const useScaleIn = (enabled: boolean = true) => {
  const opacity = useSharedValue(enabled ? 0 : 1);
  const scale = useSharedValue(enabled ? 0.8 : 1);

  useEffect(() => {
    if (!enabled) return;

    opacity.value = withTiming(1, { duration: 300, easing: Easing.ease });
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 150,
      mass: 0.5,
    });
  }, [enabled, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return animatedStyle;
};
