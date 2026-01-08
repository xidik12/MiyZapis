/**
 * Avatar component matching web design
 * Adapted for React Native
 */
import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, ImageStyle, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { PRIMARY_COLORS, NEUTRAL_COLORS } from '../../utils/design';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackIcon?: boolean;
  onError?: () => void;
  onLoad?: () => void;
  style?: ViewStyle;
}

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  fallbackIcon = true,
  onError,
  onLoad,
  style,
}) => {
  const { colors } = useTheme();
  const [imageError, setImageError] = useState(false);
  const avatarSize = sizeMap[size];
  const initials = alt
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  const handleImageLoad = () => {
    setImageError(false);
    onLoad?.();
  };

  // Show fallback if no src or error
  if (!src || imageError) {
    return (
      <View
        style={[
          styles.container,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: PRIMARY_COLORS[500],
          },
          style,
        ]}
      >
        <Text
          style={[
            styles.initials,
            {
              fontSize: avatarSize * 0.4,
              color: '#FFFFFF',
            },
          ]}
        >
          {initials}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: src }}
      style={[
        styles.image,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        },
        style,
      ]}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '600',
  },
});

export default Avatar;

