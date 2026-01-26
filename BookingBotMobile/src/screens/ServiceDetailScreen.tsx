/**
 * ServiceDetailScreen - Redesigned with Panhaha design system
 * Conversion-optimized service detail page with hero image, specialist info, and booking CTA
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchService, selectCurrentService } from '../store/slices/serviceSlice';
import { addServiceToFavorites, removeServiceFromFavorites, selectIsServiceFavorited } from '../store/slices/favoritesSlice';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Service } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Divider } from '../components/ui/Divider';
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
} from '../utils/design';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ServiceDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const serviceId = (route.params as any)?.serviceId;
  const service = useAppSelector(selectCurrentService);
  const isFavorited = useAppSelector((state) =>
    serviceId ? selectIsServiceFavorited(serviceId)(state) : false
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serviceId) {
      loadService();
    }
  }, [serviceId]);

  const loadService = async () => {
    try {
      setLoading(true);
      await dispatch(fetchService(serviceId)).unwrap();
    } catch (error) {
      console.error('Failed to load service:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!serviceId) return;

    try {
      if (isFavorited) {
        await dispatch(removeServiceFromFavorites(serviceId)).unwrap();
      } else {
        await dispatch(addServiceToFavorites(serviceId)).unwrap();
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleBookNow = () => {
    if (!service) return;
    navigation.navigate('BookingFlow' as never, { serviceId: service.id } as never);
  };

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.loadingContent}>
          <Skeleton variant="rectangular" width={SCREEN_WIDTH} height={300} />
          <View style={styles.details}>
            <Skeleton variant="text" width="80%" height={32} style={{ marginBottom: SPACING.md }} />
            <Skeleton variant="text" width="40%" height={40} style={{ marginBottom: SPACING.lg }} />
            <Skeleton variant="rectangular" width="100%" height={120} style={{ marginBottom: SPACING.lg }} />
            <Skeleton variant="rectangular" width="100%" height={100} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centerContainer}>
          <EmptyState
            emoji="🔍"
            title={t('service.notFound')}
            description={t('service.notFoundDesc')}
            actionLabel={t('common.goBack')}
            onAction={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Image with Gradient Overlay */}
        <View style={styles.heroContainer}>
          {service.imageUrl ? (
            <Image source={{ uri: service.imageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: isDark ? PRIMARY_COLORS[900] : PRIMARY_COLORS[50] }]}>
              <Text style={styles.placeholderEmoji}>🎯</Text>
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.gradientOverlay}
          />

          {/* Favorite Button */}
          <TouchableOpacity
            style={[styles.favoriteButton, { backgroundColor: colors.surface + 'DD' }]}
            onPress={handleToggleFavorite}
          >
            <Text style={styles.favoriteIcon}>{isFavorited ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.details}>
          {/* Title and Category */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{service.name}</Text>
            {service.category && (
              <Badge
                label={service.category}
                variant="secondary"
                size="md"
                style={{ alignSelf: 'flex-start', marginTop: SPACING.sm }}
              />
            )}
          </View>

          {/* Price and Rating Row */}
          <View style={styles.priceRatingRow}>
            <View>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                {t('service.price')}
              </Text>
              <Text style={[styles.price, { color: PRIMARY_COLORS[500] }]}>
                {formatPrice(service.price || 0)}
              </Text>
            </View>
            {service.rating && (
              <Card style={styles.ratingCard} borderVariant="subtle" elevation="sm">
                <Text style={styles.ratingValue}>⭐ {service.rating.toFixed(1)}</Text>
                <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
                  {service.reviewCount || 0} {t('service.reviews')}
                </Text>
              </Card>
            )}
          </View>

          {/* Quick Info Cards */}
          <View style={styles.quickInfoGrid}>
            {service.duration && (
              <Card style={styles.quickInfoCard} borderVariant="subtle">
                <Text style={styles.quickInfoIcon}>⏱️</Text>
                <Text style={[styles.quickInfoLabel, { color: colors.textSecondary }]}>
                  {t('service.duration')}
                </Text>
                <Text style={[styles.quickInfoValue, { color: colors.text }]}>
                  {service.duration} {t('common.minutes')}
                </Text>
              </Card>
            )}
            <Card style={styles.quickInfoCard} borderVariant="subtle">
              <Text style={styles.quickInfoIcon}>📍</Text>
              <Text style={[styles.quickInfoLabel, { color: colors.textSecondary }]}>
                {t('service.location')}
              </Text>
              <Text style={[styles.quickInfoValue, { color: colors.text }]} numberOfLines={1}>
                {service.location || t('service.onSite')}
              </Text>
            </Card>
          </View>

          <Divider spacing={SPACING.lg} />

          {/* Description */}
          {service.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('service.description')}
              </Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {service.description}
              </Text>
            </View>
          )}

          {/* Specialist Card */}
          {service.specialist && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('service.specialist')}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('SpecialistProfile' as never, { specialistId: service.specialist?.id } as never)}
              >
                <Card style={styles.specialistCard} borderVariant="accent" elevation="md">
                  <View style={styles.specialistHeader}>
                    {service.specialist.user?.avatar ? (
                      <Image
                        source={{ uri: service.specialist.user.avatar }}
                        style={styles.specialistAvatar}
                      />
                    ) : (
                      <View style={[styles.specialistAvatar, { backgroundColor: isDark ? SECONDARY_COLORS[900] : SECONDARY_COLORS[50] }]}>
                        <Text style={[styles.avatarText, { color: SECONDARY_COLORS[500] }]}>
                          {service.specialist.user?.firstName?.[0]?.toUpperCase() ||
                            service.specialist.businessName?.[0]?.toUpperCase() ||
                            'S'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.specialistInfo}>
                      <Text style={[styles.specialistName, { color: colors.text }]}>
                        {service.specialist.user?.firstName || ''} {service.specialist.user?.lastName || ''}
                      </Text>
                      {service.specialist.businessName && (
                        <Text style={[styles.businessName, { color: colors.textSecondary }]}>
                          {service.specialist.businessName}
                        </Text>
                      )}
                      {service.specialist.rating && (
                        <View style={styles.specialistRatingRow}>
                          <Text style={[styles.specialistRating, { color: ACCENT_COLORS[500] }]}>
                            ⭐ {service.specialist.rating.toFixed(1)}
                          </Text>
                          <Text style={[styles.specialistReviews, { color: colors.textSecondary }]}>
                            ({service.specialist.totalReviews || 0} {t('service.reviews')})
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            </View>
          )}

          {/* Book Now CTA */}
          <Button
            variant="primary"
            size="lg"
            onPress={handleBookNow}
            style={styles.bookButton}
          >
            📅 {t('service.bookNow')}
          </Button>
        </View>
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
  content: {
    paddingBottom: SPACING.xl,
  },
  loadingContent: {
    padding: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  favoriteButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 24,
  },
  details: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  header: {
    gap: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight as any,
  },
  priceRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  price: {
    fontSize: TYPOGRAPHY.h1.fontSize,
    fontWeight: TYPOGRAPHY.h1.fontWeight as any,
  },
  ratingCard: {
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ratingValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  reviewCount: {
    fontSize: FONT_SIZES.xs,
  },
  quickInfoGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  quickInfoCard: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  quickInfoIcon: {
    fontSize: 24,
  },
  quickInfoLabel: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
  quickInfoValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'center',
  },
  section: {
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  description: {
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  specialistCard: {
    padding: SPACING.md,
  },
  specialistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  specialistAvatar: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.bold,
  },
  specialistInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  specialistName: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  businessName: {
    fontSize: FONT_SIZES.sm,
  },
  specialistRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  specialistRating: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  specialistReviews: {
    fontSize: FONT_SIZES.xs,
  },
  chevron: {
    fontSize: 24,
    color: PRIMARY_COLORS[500],
    fontWeight: FONT_WEIGHTS.bold,
  },
  bookButton: {
    marginTop: SPACING.md,
  },
});
