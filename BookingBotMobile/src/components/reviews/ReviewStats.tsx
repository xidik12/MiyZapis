/**
 * ReviewStats Component for React Native
 * Displays review statistics with average rating and distribution bars
 * Based on web ReviewStats with Panhaha design system
 */
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis } from 'victory-native';
import { useTheme } from '../../contexts/ThemeContext';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  SUCCESS_COLOR,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
} from '../../utils/design';
import { Card } from '../ui/Card';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ReviewStatsData {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verifiedReviewsCount: number;
  recommendationRate: number;
}

interface ReviewStatsProps {
  stats: ReviewStatsData;
}

export const ReviewStats: React.FC<ReviewStatsProps> = ({ stats }) => {
  const { colors, isDark } = useTheme();

  const verifiedPercentage = stats.totalReviews > 0
    ? Math.round((stats.verifiedReviewsCount / stats.totalReviews) * 100)
    : 0;

  const statCards = [
    {
      icon: '⭐',
      label: 'Average',
      value: stats.averageRating.toFixed(1),
      unit: '★',
      bgColor: ACCENT_COLORS[500] + '15',
      iconBg: ACCENT_COLORS[500] + '20',
    },
    {
      icon: '📊',
      label: 'Total Reviews',
      value: stats.totalReviews.toString(),
      unit: '',
      bgColor: SECONDARY_COLORS[500] + '15',
      iconBg: SECONDARY_COLORS[500] + '20',
    },
    {
      icon: '✓',
      label: 'Verified',
      value: `${verifiedPercentage}%`,
      unit: '',
      bgColor: SUCCESS_COLOR + '15',
      iconBg: SUCCESS_COLOR + '20',
    },
    {
      icon: '💬',
      label: 'Responses',
      value: '0', // Placeholder
      unit: '',
      bgColor: PRIMARY_COLORS[500] + '15',
      iconBg: PRIMARY_COLORS[500] + '20',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Stat Cards */}
      <View style={styles.statsGrid}>
        {statCards.map((stat, index) => (
          <View
            key={stat.label}
            style={[
              styles.statCard,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: stat.iconBg }]}>
              <Text style={styles.iconText}>{stat.icon}</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {stat.label}
            </Text>
            <View style={styles.statValueRow}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stat.value}
              </Text>
              {stat.unit && (
                <Text style={[styles.statUnit, { color: colors.textSecondary }]}>
                  {stat.unit}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Rating Distribution */}
      <Card
        style={styles.distributionCard}
        borderVariant="subtle"
        elevation="sm"
      >
        <Text style={[styles.distributionTitle, { color: colors.text }]}>
          Rating Distribution
        </Text>

        <View style={styles.distributionBars}>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating] || 0;
            const percentage = stats.totalReviews > 0
              ? (count / stats.totalReviews) * 100
              : 0;

            const barColor =
              rating >= 4
                ? SUCCESS_COLOR
                : rating === 3
                ? ACCENT_COLORS[500]
                : PRIMARY_COLORS[500];

            return (
              <View key={rating} style={styles.distributionRow}>
                {/* Star Label */}
                <View style={styles.ratingLabel}>
                  <Text style={[styles.ratingNumber, { color: colors.text }]}>
                    {rating}
                  </Text>
                  <Text style={styles.ratingStar}>★</Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.barContainer}>
                  <View style={[styles.barBackground, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: barColor,
                          width: `${percentage}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Count and Percentage */}
                <View style={styles.countContainer}>
                  <Text style={[styles.countValue, { color: colors.text }]}>
                    {count}
                  </Text>
                  <Text style={[styles.countPercentage, { color: colors.textSecondary }]}>
                    ({percentage.toFixed(0)}%)
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: (SCREEN_WIDTH - SPACING.lg * 3 - SPACING.md) / 2,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight,
  },
  statUnit: {
    fontSize: TYPOGRAPHY.h5.fontSize,
    marginLeft: SPACING.xs,
  },
  distributionCard: {
    padding: SPACING.lg,
  },
  distributionTitle: {
    fontSize: TYPOGRAPHY.h4.fontSize,
    fontWeight: TYPOGRAPHY.h4.fontWeight,
    marginBottom: SPACING.lg,
  },
  distributionBars: {
    gap: SPACING.md,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  ratingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 50,
  },
  ratingNumber: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  ratingStar: {
    fontSize: 14,
    color: ACCENT_COLORS[500],
  },
  barContainer: {
    flex: 1,
  },
  barBackground: {
    height: 12,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  countContainer: {
    width: 80,
    alignItems: 'flex-end',
  },
  countValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  countPercentage: {
    fontSize: FONT_SIZES.xs,
  },
});

export default ReviewStats;
