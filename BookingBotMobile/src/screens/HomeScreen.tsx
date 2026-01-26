/**
 * HomeScreen - Redesigned with Panhaha design system
 * Full implementation matching web version UI/UX
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSelector } from '../store/hooks';
import { selectIsAuthenticated, selectUser } from '../store/slices/authSlice';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { serviceService } from '../services/service.service';
import { Service } from '../types';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
} from '../utils/design';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const [services, cats] = await Promise.all([
        serviceService.getFeaturedServices(10),
        serviceService.getCategories().catch(() => []),
      ]);
      setFeaturedServices(services);
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const quickActions = [
    { id: 'search', icon: '🔍', label: t('hero.searchButton'), route: 'Search' },
    { id: 'bookings', icon: '📅', label: t('nav.bookings'), route: 'Bookings' },
    { id: 'favorites', icon: '⭐', label: t('nav.favorites'), route: 'Favorites' },
    { id: 'profile', icon: '👤', label: t('nav.profile'), route: 'Profile' },
  ];

  const renderHeroSection = () => (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={[PRIMARY_COLORS[500], PRIMARY_COLORS[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        {/* Decorative orbs */}
        <View style={styles.decorativeOrbs}>
          <View style={[styles.orb, styles.orb1, { backgroundColor: ACCENT_COLORS[500] + '20' }]} />
          <View style={[styles.orb, styles.orb2, { backgroundColor: SECONDARY_COLORS[300] + '15' }]} />
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            {isAuthenticated && user?.firstName
              ? t('hero.welcomeBack').replace('{name}', user.firstName)
              : t('hero.title1')}
          </Text>
          <Text style={styles.heroSubtitle}>
            {t('hero.subtitle')}
          </Text>
          <Button
            variant="accent"
            size="lg"
            onPress={() => navigation.navigate('Search' as never)}
            style={styles.heroButton}
          >
            {t('cta.browseServices')}
          </Button>
        </View>
      </LinearGradient>
    </View>
  );

  const renderQuickActions = () => {
    if (!isAuthenticated) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('dashboard.quickActions')}
        </Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              onPress={() => navigation.navigate(action.route as never)}
              activeOpacity={0.7}
            >
              <Card style={styles.quickActionCard} elevation="sm" borderVariant="subtle">
                <View style={[styles.quickActionIconContainer, { backgroundColor: PRIMARY_COLORS[500] + '15' }]}>
                  <Text style={styles.quickActionIcon}>{action.icon}</Text>
                </View>
                <Text style={[styles.quickActionText, { color: colors.text }]} numberOfLines={2}>
                  {action.label}
                </Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderCategories = () => {
    if (categories.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('categories.title')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => navigation.navigate('Search' as never, { category: category.id } as never)}
            >
              <Badge
                variant="secondary"
                size="lg"
                styleType="soft"
                style={styles.categoryBadge}
              >
                {category.icon} {category.name}
              </Badge>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderFeaturedServices = () => {
    if (loading) {
      return (
        <View style={styles.section}>
          <Skeleton variant="text" width="40%" height={24} style={{ marginBottom: SPACING.md }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.serviceCardSkeleton}>
                <Skeleton variant="rectangular" width={CARD_WIDTH - 32} height={180} />
                <Skeleton variant="text" width="80%" height={20} style={{ marginTop: SPACING.md }} />
                <Skeleton variant="text" width="50%" height={16} style={{ marginTop: SPACING.sm }} />
              </View>
            ))}
          </ScrollView>
        </View>
      );
    }

    if (featuredServices.length === 0) {
      return (
        <EmptyState
          emoji="🔍"
          title={t('services.noFeatured')}
          description={t('services.noFeaturedDesc')}
          actionLabel={t('services.explore')}
          onAction={() => navigation.navigate('Search' as never)}
        />
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('services.featured')}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Search' as never)}>
            <Text style={[styles.viewAllLink, { color: PRIMARY_COLORS[500] }]}>
              {t('common.viewAll')} →
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.servicesScroll}
        >
          {featuredServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              onPress={() => navigation.navigate('ServiceDetail' as never, { serviceId: service.id } as never)}
              activeOpacity={0.9}
            >
              <Card style={styles.serviceCard} elevation="md" borderVariant="none">
                {service.imageUrl ? (
                  <Image
                    source={{ uri: service.imageUrl }}
                    style={styles.serviceImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.servicePlaceholder, { backgroundColor: colors.border }]}>
                    <Text style={styles.servicePlaceholderIcon}>📸</Text>
                  </View>
                )}
                <View style={styles.serviceContent}>
                  <Text style={[styles.serviceTitle, { color: colors.text }]} numberOfLines={2}>
                    {service.name}
                  </Text>
                  <View style={styles.serviceFooter}>
                    <Text style={[styles.servicePrice, { color: PRIMARY_COLORS[500] }]}>
                      ${service.price?.toFixed(2) || '0.00'}
                    </Text>
                    {service.rating && (
                      <View style={styles.ratingContainer}>
                        <Text style={styles.ratingStar}>⭐</Text>
                        <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                          {service.rating.toFixed(1)} ({service.reviewCount || 0})
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY_COLORS[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeroSection()}
        {renderQuickActions()}
        {renderCategories()}
        {renderFeaturedServices()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl * 2,
  },
  heroContainer: {
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  heroGradient: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING['3xl'],
    borderBottomLeftRadius: BORDER_RADIUS['3xl'],
    borderBottomRightRadius: BORDER_RADIUS['3xl'],
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeOrbs: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    width: 200,
    height: 200,
    top: -80,
    right: -60,
  },
  orb2: {
    width: 150,
    height: 150,
    bottom: -40,
    left: -40,
  },
  heroContent: {
    zIndex: 1,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.displaySm.fontSize,
    fontWeight: TYPOGRAPHY.displaySm.fontWeight,
    color: '#FFFFFF',
    marginBottom: SPACING.md,
  },
  heroSubtitle: {
    fontSize: TYPOGRAPHY.h5.fontSize,
    color: '#FFFFFF',
    opacity: 0.95,
    marginBottom: SPACING.xl,
    lineHeight: 28,
  },
  heroButton: {
    alignSelf: 'flex-start',
  },
  section: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.h3.fontSize,
    fontWeight: TYPOGRAPHY.h3.fontWeight,
    marginBottom: SPACING.lg,
  },
  viewAllLink: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  quickActionCard: {
    width: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md) / 2,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.md,
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 28,
  },
  quickActionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'center',
  },
  categoriesScroll: {
    gap: SPACING.sm,
    paddingRight: SPACING.lg,
  },
  categoryBadge: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  servicesScroll: {
    gap: SPACING.md,
    paddingRight: SPACING.lg,
  },
  serviceCard: {
    width: CARD_WIDTH,
    padding: 0,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 200,
  },
  servicePlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servicePlaceholderIcon: {
    fontSize: 48,
    opacity: 0.3,
  },
  serviceContent: {
    padding: SPACING.lg,
  },
  serviceTitle: {
    fontSize: TYPOGRAPHY.h5.fontSize,
    fontWeight: TYPOGRAPHY.h5.fontWeight,
    marginBottom: SPACING.md,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: TYPOGRAPHY.h4.fontSize,
    fontWeight: TYPOGRAPHY.h4.fontWeight,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ratingStar: {
    fontSize: 14,
  },
  ratingText: {
    fontSize: FONT_SIZES.sm,
  },
  serviceCardSkeleton: {
    width: CARD_WIDTH,
    marginRight: SPACING.md,
  },
});
