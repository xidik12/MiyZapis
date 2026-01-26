/**
 * SpecialistResponse Component for React Native
 * Shows specialist's response to a review with collapsible content
 * Based on web SpecialistResponse with Panhaha design system
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../../contexts/ThemeContext';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
  BORDER_RADIUS,
} from '../../utils/design';

interface SpecialistResponseData {
  id: string;
  responseText: string;
  createdAt: string;
  respondedBy: {
    id: string;
    businessName?: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  helpfulCount?: number;
  isHelpful?: boolean;
}

interface SpecialistResponseProps {
  response: SpecialistResponseData;
  onMarkHelpful?: (responseId: string, helpful: boolean) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const SpecialistResponse: React.FC<SpecialistResponseProps> = ({
  response,
  onMarkHelpful,
  isExpanded = true,
  onToggle,
}) => {
  const { colors, isDark } = useTheme();

  const businessName = response.respondedBy.businessName || `${response.respondedBy.firstName} ${response.respondedBy.lastName}`;
  const initial = response.respondedBy.firstName.charAt(0).toUpperCase();

  const handleHelpfulClick = () => {
    if (onMarkHelpful) {
      onMarkHelpful(response.id, !response.isHelpful);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.surface + '80' : colors.surface }]}>
      {/* Response Header */}
      <TouchableOpacity
        onPress={onToggle}
        style={[styles.header, { borderBottomColor: colors.border }]}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.briefcaseIcon}>💼</Text>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              SPECIALIST RESPONSE
            </Text>
            <Text style={[styles.headerTime, { color: colors.textSecondary }]}>
              {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
            </Text>
          </View>
        </View>
        <Text style={[styles.chevron, { color: colors.textSecondary }]}>
          {isExpanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {/* Response Content (collapsible) */}
      {isExpanded && (
        <View style={styles.content}>
          {/* Specialist Info */}
          <View style={styles.specialistInfo}>
            {response.respondedBy.avatar ? (
              <Image
                source={{ uri: response.respondedBy.avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: PRIMARY_COLORS[500] }]}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
            <View style={styles.specialistDetails}>
              <Text style={[styles.specialistName, { color: colors.text }]} numberOfLines={1}>
                {businessName}
              </Text>
              <Text style={[styles.specialistRole, { color: colors.textSecondary }]}>
                Specialist
              </Text>
            </View>
          </View>

          {/* Response Text */}
          <Text style={[styles.responseText, { color: colors.text }]}>
            {response.responseText}
          </Text>

          {/* Helpful Button */}
          {response.helpfulCount !== undefined && (
            <TouchableOpacity
              onPress={handleHelpfulClick}
              style={[
                styles.helpfulButton,
                {
                  backgroundColor: response.isHelpful
                    ? PRIMARY_COLORS[500] + '20'
                    : (isDark ? colors.surface : colors.border),
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.heartIcon}>{response.isHelpful ? '❤️' : '🤍'}</Text>
              <Text
                style={[
                  styles.helpfulText,
                  {
                    color: response.isHelpful ? PRIMARY_COLORS[500] : colors.textSecondary,
                    fontWeight: response.isHelpful ? FONT_WEIGHTS.semibold : FONT_WEIGHTS.normal,
                  },
                ]}
              >
                {response.helpfulCount} Helpful
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  briefcaseIcon: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: 0.5,
  },
  headerTime: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  chevron: {
    fontSize: 12,
  },
  content: {
    padding: SPACING.lg,
  },
  specialistInfo: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
  },
  specialistDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  specialistName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
  },
  specialistRole: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  responseText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignSelf: 'flex-start',
  },
  heartIcon: {
    fontSize: 14,
  },
  helpfulText: {
    fontSize: FONT_SIZES.xs,
  },
});

export default SpecialistResponse;
