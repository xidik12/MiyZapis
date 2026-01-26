/**
 * Skeleton component for loading states
 * Animated shimmer effect for React Native
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, Easing } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { BORDER_RADIUS } from '../../utils/design';

type Variant = 'text' | 'circular' | 'rectangular';

interface SkeletonProps {
  variant?: Variant;
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  animated?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width = '100%',
  height = 20,
  style,
  animated = true,
}) => {
  const { colors, isDark } = useTheme();
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    shimmer.start();

    return () => shimmer.stop();
  }, [animated, shimmerAnimation]);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'text':
        return {
          borderRadius: BORDER_RADIUS.sm,
          height: height || 16,
        };
      case 'circular':
        return {
          borderRadius: BORDER_RADIUS.full,
          width: height || 40,
          height: height || 40,
        };
      case 'rectangular':
        return {
          borderRadius: BORDER_RADIUS.md,
          height: height || 100,
        };
      default:
        return {};
    }
  };

  const baseColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.11)';

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          backgroundColor: baseColor,
          opacity: animated ? opacity : 0.5,
        },
        getVariantStyles(),
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});

export default Skeleton;
