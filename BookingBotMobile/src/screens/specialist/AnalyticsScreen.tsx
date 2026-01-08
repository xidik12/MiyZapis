// Analytics Screen - Specialist analytics and insights (matching web version)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { specialistService } from '../../services/specialist.service';
import { SpecialistAnalytics } from '../../types';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

export const AnalyticsScreen: React.FC = () => {
  const { colors } = useTheme();
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    header: {
      marginBottom: 24,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    periodSelector: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 4,
      marginBottom: 20,
    },
    periodButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
    },
    periodButtonActive: {
      backgroundColor: colors.primary,
    },
    periodButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    periodButtonTextActive: {
      color: '#FFFFFF',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      width: (width - 52) / 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statIcon: {
      fontSize: 24,
      marginBottom: 8,
    },
    statValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    serviceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    serviceRowLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    serviceName: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    serviceCount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
    },
    trendRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    trendRowLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    trendMonth: {
      fontSize: 16,
      color: colors.text,
      width: 60,
    },
    trendData: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    trendValue: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading && !analytics) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Analytics</Text>
              <Text style={styles.subtitle}>
                Track your performance and business growth
              </Text>
            </View>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                period === p && styles.periodButtonActive,
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  period === p && styles.periodButtonTextActive,
                ]}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {analytics && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>📅</Text>
                <Text style={styles.statValue}>
                  {analytics.totalBookings || 0}
                </Text>
                <Text style={styles.statLabel}>Total Bookings</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>💰</Text>
                <Text style={styles.statValue}>
                  {formatPrice(analytics.totalRevenue || 0)}
                </Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={styles.statValue}>
                  {(analytics.averageRating || 0).toFixed(1)}
                </Text>
                <Text style={styles.statLabel}>Average Rating</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>✅</Text>
                <Text style={styles.statValue}>
                  {analytics.completionRate || 0}%
                </Text>
                <Text style={styles.statLabel}>Completion Rate</Text>
              </View>
            </View>

            {analytics.popularServices && analytics.popularServices.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Popular Services</Text>
                <View style={styles.card}>
                  {analytics.popularServices.map((service, index) => (
                    <View
                      key={index}
                      style={[
                        styles.serviceRow,
                        index === analytics.popularServices!.length - 1 &&
                          styles.serviceRowLast,
                      ]}
                    >
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.serviceCount}>
                        {service.count} bookings
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {analytics.monthlyTrends && analytics.monthlyTrends.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Monthly Trends</Text>
                <View style={styles.card}>
                  {analytics.monthlyTrends.map((trend, index) => (
                    <View
                      key={index}
                      style={[
                        styles.trendRow,
                        index === analytics.monthlyTrends!.length - 1 &&
                          styles.trendRowLast,
                      ]}
                    >
                      <Text style={styles.trendMonth}>{trend.month}</Text>
                      <View style={styles.trendData}>
                        <Text style={styles.trendValue}>
                          {trend.bookings} bookings
                        </Text>
                        <Text style={styles.trendValue}>
                          {formatPrice(trend.revenue)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
