/**
 * Skeleton component for loading states
 * Enhanced gradient shimmer effect for React Native
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 1500,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    );

    shimmer.start();

    return () => shimmer.stop();
  }, [animated, shimmerAnimation]);

  // Translate from -100% to 100% for shimmer effect
  const translateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '100%'],
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
  const highlightColor = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.04)';

  if (!animated) {
    // Static skeleton without animation
    return (
      <View
        style={[
          styles.skeleton,
          {
            width,
            backgroundColor: baseColor,
          },
          getVariantStyles(),
          style,
        ]}
      />
    );
  }

  // Animated skeleton with gradient shimmer
  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          backgroundColor: baseColor,
        },
        getVariantStyles(),
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});

export default Skeleton;
