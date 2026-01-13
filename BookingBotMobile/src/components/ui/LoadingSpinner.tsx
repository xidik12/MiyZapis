/**
 * Smooth LoadingSpinner component
 * Elegant, minimal motion design
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, Easing } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { PRIMARY_COLORS, SECONDARY_COLORS, NEUTRAL_COLORS } from '../../utils/design';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  style?: ViewStyle;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  style,
}) => {
  const { colors, isDark } = useTheme();
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  const getColor = (): string => {
    switch (color) {
      case 'primary':
        return PRIMARY_COLORS[600];
      case 'secondary':
        return SECONDARY_COLORS[600];
      case 'white':
        return '#FFFFFF';
      case 'gray':
        return isDark ? NEUTRAL_COLORS[300] : NEUTRAL_COLORS[600];
      default:
        return PRIMARY_COLORS[600];
    }
  };

  useEffect(() => {
    // Smooth rotation animation - slower and with ease
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000, // Slower: 2 seconds per rotation
        easing: Easing.bezier(0.4, 0, 0.2, 1), // Smooth ease-in-out
        useNativeDriver: true,
      })
    );

    // Gentle breathing effect
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ])
    );

    spinAnimation.start();
    pulseAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, [spinValue, pulseValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinnerSize = sizeMap[size];
  const borderWidth = size === 'sm' ? 2 : size === 'md' ? 2.5 : size === 'lg' ? 3 : 4;

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: spinnerSize,
            height: spinnerSize,
            borderRadius: spinnerSize / 2,
            borderWidth,
            borderColor: `${getColor()}20`, // 20% opacity for subtle ring
            borderTopColor: getColor(),
            transform: [{ rotate: spin }, { scale: pulseValue }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    borderStyle: 'solid',
  },
});

export default LoadingSpinner;

