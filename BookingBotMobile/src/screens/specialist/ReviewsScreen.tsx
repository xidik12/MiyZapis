/**
 * ReviewsScreen - Redesigned with Panhaha design system
 * Customer reviews with stats, filters, and response functionality
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { format, formatDistanceToNow } from 'date-fns';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Divider } from '../../components/ui/Divider';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  SUCCESS_COLOR,
  WARNING_COLOR,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../utils/design';

const { width } = Dimensions.get('window');

interface Review {
  id: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  serviceName: string;
  date: string;
  response?: string;
  responseDate?: string;
  isVerified?: boolean;
}

type FilterType = 'all' | 'responded' | 'pending';

export const ReviewsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockReviews: Review[] = [
        {
          id: '1',
          customerName: 'John Doe',
          rating: 5,
          comment: 'Excellent service! Very professional and friendly. I had a wonderful experience and will definitely recommend to my friends.',
          serviceName: 'Haircut',
          date: new Date().toISOString(),
          isVerified: true,
        },
        {
          id: '2',
          customerName: 'Jane Smith',
          rating: 4,
          comment: 'Great experience, will come back again.',
          serviceName: 'Massage',
          date: new Date(Date.now() - 86400000).toISOString(),
          response: 'Thank you for your feedback!',
          responseDate: new Date(Date.now() - 43200000).toISOString(),
        },
        {
          id: '3',
          customerName: 'Mike Johnson',
          rating: 5,
          comment: 'Best service in town! Highly recommend.',
          serviceName: 'Manicure',
          date: new Date(Date.now() - 172800000).toISOString(),
        },
      ];
      setReviews(mockReviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const toggleExpanded = (reviewId: string) => {
    setExpandedReviews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Text key={i} style={styles.star}>
        {i < rating ? '⭐' : '☆'}
      </Text>
    ));
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'responded') return review.response;
    if (filter === 'pending') return !review.response;
    return true;
  });

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
      : 0;

  const responseRate =
    reviews.length > 0
      ? ((reviews.filter((r) => r.response).length / reviews.length) * 100)
      : 0;

  const renderHeader = () => (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={[ACCENT_COLORS[500], ACCENT_COLORS[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        {/* Decorative orbs */}
        <View style={styles.decorativeOrbs}>
          <View style={[styles.orb, styles.orb1, { backgroundColor: PRIMARY_COLORS[400] + '20' }]} />
          <View style={[styles.orb, styles.orb2, { backgroundColor: SECONDARY_COLORS[300] + '15' }]} />
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroIcon}>⭐</Text>
          <Text style={styles.heroTitle}>{t('reviews.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('reviews.subtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderStatsCard = () => (
    <Card style={styles.statsCard} borderVariant="accent" elevation="md">
      <LinearGradient
        colors={
          isDark
            ? [ACCENT_COLORS[900] + '40', ACCENT_COLORS[800] + '20']
            : [ACCENT_COLORS[50], ACCENT_COLORS[100]]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statsGradient}
      >
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: ACCENT_COLORS[600] }]}>
              {averageRating.toFixed(1)}
            </Text>
            <View style={styles.starsRow}>
              {renderStars(Math.round(averageRating))}
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('reviews.averageRating')}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: SECONDARY_COLORS[500] }]}>
              {reviews.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('reviews.totalReviews')}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: SUCCESS_COLOR }]}>
              {responseRate.toFixed(0)}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('reviews.responseRate')}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Card>
  );

  const renderFilterTabs = () => (
    <View style={[styles.filterContainer, { backgroundColor: isDark ? colors.surface : colors.border }]}>
      {(['all', 'pending', 'responded'] as FilterType[]).map((f) => (
        <TouchableOpacity
          key={f}
          style={[
            styles.filterButton,
            filter === f && [styles.filterButtonActive, { backgroundColor: colors.background }],
          ]}
          onPress={() => setFilter(f)}
        >
          <Text
            style={[
              styles.filterText,
              { color: colors.textSecondary },
              filter === f && [styles.filterTextActive, { color: ACCENT_COLORS[500] }],
            ]}
          >
            {t(`reviews.filter.${f}`)}
          </Text>
          {f === 'pending' && (
            <Badge
              label={String(reviews.filter((r) => !r.response).length)}
              variant="warning"
              size="sm"
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderReviewCard = ({ item }: { item: Review }) => {
    const isExpanded = expandedReviews.has(item.id);
    const commentMaxLength = 100;
    const needsExpansion = item.comment.length > commentMaxLength;
    const displayComment = needsExpansion && !isExpanded
      ? item.comment.slice(0, commentMaxLength) + '...'
      : item.comment;

    return (
      <Card style={styles.reviewCard} borderVariant="subtle" elevation="sm">
        {/* Customer Header */}
        <View style={styles.reviewHeader}>
          <View style={[styles.avatar, { backgroundColor: isDark ? SECONDARY_COLORS[900] : SECONDARY_COLORS[50] }]}>
            <Text style={[styles.avatarText, { color: SECONDARY_COLORS[500] }]}>
              {item.customerName[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.customerInfo}>
            <View style={styles.customerNameRow}>
              <Text style={[styles.customerName, { color: colors.text }]}>
                {item.customerName}
              </Text>
              {item.isVerified && (
                <Text style={styles.verifiedBadge}>✓</Text>
              )}
            </View>
            <Text style={[styles.serviceName, { color: colors.textSecondary }]}>
              {item.serviceName}
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            <View style={styles.starsRow}>
              {renderStars(item.rating)}
            </View>
          </View>
        </View>

        {/* Comment */}
        <TouchableOpacity
          onPress={() => needsExpansion && toggleExpanded(item.id)}
          activeOpacity={needsExpansion ? 0.7 : 1}
        >
          <Text style={[styles.comment, { color: colors.text }]}>
            {displayComment}
          </Text>
          {needsExpansion && (
            <Text style={[styles.readMore, { color: ACCENT_COLORS[500] }]}>
              {isExpanded ? t('reviews.readLess') : t('reviews.readMore')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Response Section */}
        {item.response && (
          <View style={[styles.responseSection, { backgroundColor: isDark ? colors.surface : colors.border }]}>
            <View style={styles.responseHeader}>
              <Text style={[styles.responseLabel, { color: SECONDARY_COLORS[500] }]}>
                💬 {t('reviews.yourResponse')}
              </Text>
              {item.responseDate && (
                <Text style={[styles.responseDate, { color: colors.textSecondary }]}>
                  {formatDistanceToNow(new Date(item.responseDate), { addSuffix: true })}
                </Text>
              )}
            </View>
            <Text style={[styles.responseText, { color: colors.text }]}>
              {item.response}
            </Text>
          </View>
        )}

        <Divider spacing={SPACING.sm} />

        {/* Footer */}
        <View style={styles.reviewFooter}>
          <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>
            {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
          </Text>
          {!item.response && (
            <TouchableOpacity
              style={[styles.respondButton, { backgroundColor: SECONDARY_COLORS[500] }]}
            >
              <Text style={styles.respondButtonText}>
                {t('reviews.respond')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton variant="rectangular" width="100%" height={120} style={{ marginBottom: SPACING.lg }} />
          <Skeleton variant="rectangular" width="100%" height={50} style={{ marginBottom: SPACING.lg }} />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={200} style={{ marginBottom: SPACING.md }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT_COLORS[500]}
            colors={[ACCENT_COLORS[500]]}
          />
        }
      >
        {renderStatsCard()}
        {renderFilterTabs()}

        <View style={styles.section}>
          {filteredReviews.length > 0 ? (
            <FlatList
              data={filteredReviews}
              renderItem={renderReviewCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
            />
          ) : (
            <EmptyState
              emoji="💭"
              title={t('reviews.noReviews')}
              description={t('reviews.noReviewsDesc')}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    height: 160,
    overflow: 'hidden',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  decorativeOrbs: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 140,
    height: 140,
    top: -30,
    right: -30,
    opacity: 0.3,
  },
  orb2: {
    width: 110,
    height: 110,
    bottom: -20,
    left: -20,
    opacity: 0.2,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  heroIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight as any,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  statsCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  statsGradient: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight as any,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  filterButtonActive: {},
  filterText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  filterTextActive: {
    fontWeight: FONT_WEIGHTS.bold,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  reviewCard: {
    padding: SPACING.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.bold,
  },
  customerInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  customerName: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  verifiedBadge: {
    fontSize: 16,
    color: SUCCESS_COLOR,
  },
  serviceName: {
    fontSize: FONT_SIZES.sm,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  comment: {
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.5,
    marginBottom: SPACING.xs,
  },
  readMore: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.md,
  },
  responseSection: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: SECONDARY_COLORS[500],
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  responseLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  responseDate: {
    fontSize: FONT_SIZES.xs,
  },
  responseText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.4,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: FONT_SIZES.xs,
  },
  respondButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  respondButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
});
