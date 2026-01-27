/**
 * AnalyticsScreen - Redesigned with Panhaha design system
 * Comprehensive analytics with stats, popular services, and trends
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { specialistService } from '../../services/specialist.service';
import { SpecialistAnalytics } from '../../types';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Divider } from '../../components/ui/Divider';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  SUCCESS_COLOR,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../utils/design';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

export const AnalyticsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<SpecialistAnalytics | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await specialistService.getAnalytics(period);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={[SECONDARY_COLORS[500], SECONDARY_COLORS[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        {/* Decorative orbs */}
        <View style={styles.decorativeOrbs}>
          <View style={[styles.orb, styles.orb1, { backgroundColor: PRIMARY_COLORS[400] + '20' }]} />
          <View style={[styles.orb, styles.orb2, { backgroundColor: ACCENT_COLORS[500] + '15' }]} />
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroIcon}>📈</Text>
          <Text style={styles.heroTitle}>{t('analytics.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('analytics.subtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderPeriodSelector = () => (
    <View style={[styles.periodSelector, { backgroundColor: isDark ? colors.surface : colors.border }]}>
      {(['week', 'month', 'year'] as const).map((p) => (
        <TouchableOpacity
          key={p}
          style={[
            styles.periodButton,
            period === p && [styles.periodButtonActive, { backgroundColor: colors.background }],
          ]}
          onPress={() => setPeriod(p)}
        >
          <Text
            style={[
              styles.periodButtonText,
              { color: colors.textSecondary },
              period === p && [styles.periodButtonTextActive, { color: SECONDARY_COLORS[500] }],
            ]}
          >
            {t(`analytics.period.${p}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStatsGrid = () => {
    if (!analytics) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('analytics.overview')}
        </Text>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard} borderVariant="subtle" elevation="sm">
            <Text style={styles.statIcon}>📅</Text>
            <Text style={[styles.statValue, { color: SECONDARY_COLORS[500] }]}>
              {analytics.totalBookings || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('analytics.totalBookings')}
            </Text>
          </Card>
          <Card style={styles.statCard} borderVariant="subtle" elevation="sm">
            <Text style={styles.statIcon}>💰</Text>
            <Text style={[styles.statValue, { color: ACCENT_COLORS[500] }]}>
              {formatPrice(analytics.totalRevenue || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('analytics.revenue')}
            </Text>
          </Card>
          <Card style={styles.statCard} borderVariant="subtle" elevation="sm">
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={[styles.statValue, { color: ACCENT_COLORS[600] }]}>
              {(analytics.averageRating || 0).toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('analytics.rating')}
            </Text>
          </Card>
          <Card style={styles.statCard} borderVariant="subtle" elevation="sm">
            <Text style={styles.statIcon}>✅</Text>
            <Text style={[styles.statValue, { color: SUCCESS_COLOR }]}>
              {analytics.completionRate || 0}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('analytics.completionRate')}
            </Text>
          </Card>
        </View>
      </View>
    );
  };

  const renderPopularServices = () => {
    if (!analytics?.popularServices || analytics.popularServices.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('analytics.popularServices')}
        </Text>
        <Card borderVariant="subtle" elevation="sm">
          {analytics.popularServices.map((service, index) => (
            <View key={index}>
              <View style={styles.serviceRow}>
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceName, { color: colors.text }]}>
                    {service.name}
                  </Text>
                  <Text style={[styles.serviceBookings, { color: colors.textSecondary }]}>
                    {service.count} {t('analytics.bookings')}
                  </Text>
                </View>
                <View style={styles.serviceRank}>
                  <Text style={[styles.rankNumber, { color: SECONDARY_COLORS[500] }]}>
                    #{index + 1}
                  </Text>
                </View>
              </View>
              {index < analytics.popularServices!.length - 1 && (
                <Divider spacing={SPACING.sm} />
              )}
            </View>
          ))}
        </Card>
      </View>
    );
  };

  const renderMonthlyTrends = () => {
    if (!analytics?.monthlyTrends || analytics.monthlyTrends.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('analytics.monthlyTrends')}
        </Text>
        <Card borderVariant="subtle" elevation="sm">
          {analytics.monthlyTrends.map((trend, index) => (
            <View key={index}>
              <View style={styles.trendRow}>
                <Text style={[styles.trendMonth, { color: colors.text }]}>
                  {trend.month}
                </Text>
                <View style={styles.trendData}>
                  <View style={styles.trendItem}>
                    <Text style={[styles.trendLabel, { color: colors.textSecondary }]}>
                      {t('analytics.bookings')}
                    </Text>
                    <Text style={[styles.trendValue, { color: SECONDARY_COLORS[500] }]}>
                      {trend.bookings}
                    </Text>
                  </View>
                  <View style={styles.trendItem}>
                    <Text style={[styles.trendLabel, { color: colors.textSecondary }]}>
                      {t('analytics.revenue')}
                    </Text>
                    <Text style={[styles.trendValue, { color: ACCENT_COLORS[500] }]}>
                      {formatPrice(trend.revenue)}
                    </Text>
                  </View>
                </View>
              </View>
              {index < analytics.monthlyTrends!.length - 1 && (
                <Divider spacing={SPACING.sm} />
              )}
            </View>
          ))}
        </Card>
      </View>
    );
  };

  if (loading && !analytics) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton variant="rectangular" width="100%" height={50} style={{ marginBottom: SPACING.lg }} />
          <View style={styles.section}>
            <Skeleton variant="text" width="40%" height={24} style={{ marginBottom: SPACING.md }} />
            <View style={styles.statsGrid}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rectangular" width="48%" height={100} />
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Skeleton variant="text" width="50%" height={24} style={{ marginBottom: SPACING.md }} />
            <Skeleton variant="rectangular" width="100%" height={200} />
          </View>
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
            tintColor={SECONDARY_COLORS[500]}
            colors={[SECONDARY_COLORS[500]]}
          />
        }
      >
        {renderPeriodSelector()}
        {renderStatsGrid()}
        {renderPopularServices()}
        {renderMonthlyTrends()}
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
  periodSelector: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  periodButtonActive: {},
  periodButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  periodButtonTextActive: {
    fontWeight: FONT_WEIGHTS.bold,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight as any,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  serviceInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  serviceName: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  serviceBookings: {
    fontSize: FONT_SIZES.sm,
  },
  serviceRank: {
    marginLeft: SPACING.md,
  },
  rankNumber: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  trendRow: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  trendMonth: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.sm,
  },
  trendData: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  trendItem: {
    flex: 1,
    gap: SPACING.xs,
  },
  trendLabel: {
    fontSize: FONT_SIZES.xs,
  },
  trendValue: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
