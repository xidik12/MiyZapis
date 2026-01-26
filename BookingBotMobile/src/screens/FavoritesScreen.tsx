/**
 * FavoritesScreen - Redesigned with Panhaha design system
 * Saved services and specialists with tab navigation and remove functionality
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchFavorites,
  removeServiceFromFavorites,
  removeSpecialistFromFavorites,
  selectFavorites,
  selectFavoritesLoading,
} from '../store/slices/favoritesSlice';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Service, Specialist } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../utils/design';

export const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const favorites = useAppSelector(selectFavorites);
  const loading = useAppSelector(selectFavoritesLoading);

  const [activeTab, setActiveTab] = useState<'services' | 'specialists'>('services');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      await dispatch(fetchFavorites()).unwrap();
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleRemoveService = async (serviceId: string) => {
    try {
      await dispatch(removeServiceFromFavorites(serviceId)).unwrap();
    } catch (error) {
      console.error('Failed to remove service:', error);
    }
  };

  const handleRemoveSpecialist = async (specialistId: string) => {
    try {
      await dispatch(removeSpecialistFromFavorites(specialistId)).unwrap();
    } catch (error) {
      console.error('Failed to remove specialist:', error);
    }
  };

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const renderHeader = () => (
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
          <Text style={styles.heroIcon}>❤️</Text>
          <Text style={styles.heroTitle}>{t('favorites.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('favorites.subtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderTabBar = () => {
    const services = favorites.services || [];
    const specialists = favorites.specialists || [];

    return (
      <View style={[styles.tabContainer, { backgroundColor: isDark ? colors.surface : colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'services' && [styles.tabActive, { backgroundColor: colors.background }],
          ]}
          onPress={() => setActiveTab('services')}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.textSecondary },
              activeTab === 'services' && [styles.tabTextActive, { color: PRIMARY_COLORS[500] }],
            ]}
          >
            {t('favorites.services')} ({services.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'specialists' && [styles.tabActive, { backgroundColor: colors.background }],
          ]}
          onPress={() => setActiveTab('specialists')}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.textSecondary },
              activeTab === 'specialists' && [styles.tabTextActive, { color: PRIMARY_COLORS[500] }],
            ]}
          >
            {t('favorites.specialists')} ({specialists.length})
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderServiceCard = ({ item }: { item: Service }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ServiceDetail' as never, { serviceId: item.id } as never)}
    >
      <Card style={styles.card} borderVariant="subtle" elevation="sm">
        <View style={styles.cardContent}>
          {/* Image */}
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.imagePlaceholder, { backgroundColor: isDark ? PRIMARY_COLORS[900] : PRIMARY_COLORS[50] }]}>
              <Text style={styles.placeholderEmoji}>🎯</Text>
            </View>
          )}

          {/* Content */}
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
              {item.name}
            </Text>
            {item.description && (
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View style={styles.cardFooter}>
              {item.category && (
                <Badge label={item.category} variant="secondary" size="sm" />
              )}
              <Text style={[styles.cardPrice, { color: ACCENT_COLORS[500] }]}>
                {formatPrice(item.price || 0)}
              </Text>
            </View>
          </View>

          {/* Remove Button */}
          <TouchableOpacity
            onPress={() => handleRemoveService(item.id)}
            style={[styles.removeButton, { backgroundColor: PRIMARY_COLORS[50] }]}
          >
            <Text style={[styles.removeIcon, { color: PRIMARY_COLORS[500] }]}>💔</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderSpecialistCard = ({ item }: { item: Specialist }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('SpecialistProfile' as never, { specialistId: item.id } as never)}
    >
      <Card style={styles.card} borderVariant="subtle" elevation="sm">
        <View style={styles.cardContent}>
          {/* Avatar */}
          {item.user?.avatar ? (
            <Image source={{ uri: item.user.avatar }} style={styles.specialistAvatar} />
          ) : (
            <View style={[styles.specialistAvatar, styles.avatarPlaceholder, { backgroundColor: isDark ? SECONDARY_COLORS[900] : SECONDARY_COLORS[50] }]}>
              <Text style={[styles.avatarText, { color: SECONDARY_COLORS[500] }]}>
                {item.user?.firstName?.[0]?.toUpperCase() || item.businessName?.[0]?.toUpperCase() || 'S'}
              </Text>
            </View>
          )}

          {/* Content */}
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {item.user?.firstName || ''} {item.user?.lastName || ''}
            </Text>
            {item.businessName && (
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.businessName}
              </Text>
            )}
            <View style={styles.specialistMeta}>
              {item.rating && (
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingText}>⭐ {item.rating.toFixed(1)}</Text>
                  <Text style={[styles.reviewsText, { color: colors.textSecondary }]}>
                    ({item.totalReviews || 0})
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Remove Button */}
          <TouchableOpacity
            onPress={() => handleRemoveSpecialist(item.id)}
            style={[styles.removeButton, { backgroundColor: PRIMARY_COLORS[50] }]}
          >
            <Text style={[styles.removeIcon, { color: PRIMARY_COLORS[500] }]}>💔</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const services = favorites.services || [];
  const specialists = favorites.specialists || [];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {renderHeader()}
        {renderTabBar()}
        <ScrollView contentContainerStyle={styles.content}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={120} style={{ marginBottom: SPACING.md }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}
      {renderTabBar()}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY_COLORS[500]}
            colors={[PRIMARY_COLORS[500]]}
          />
        }
      >
        {activeTab === 'services' ? (
          services.length === 0 ? (
            <EmptyState
              emoji="⭐"
              title={t('favorites.noServices')}
              description={t('favorites.noServicesDesc')}
              actionLabel={t('favorites.browseServices')}
              onAction={() => navigation.navigate('Search' as never)}
            />
          ) : (
            <FlatList
              data={services}
              renderItem={renderServiceCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
            />
          )
        ) : (
          specialists.length === 0 ? (
            <EmptyState
              emoji="👤"
              title={t('favorites.noSpecialists')}
              description={t('favorites.noSpecialistsDesc')}
              actionLabel={t('favorites.browseSpecialists')}
              onAction={() => navigation.navigate('Search' as never)}
            />
          ) : (
            <FlatList
              data={specialists}
              renderItem={renderSpecialistCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
            />
          )
        )}
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
  tabContainer: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  tabActive: {},
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  tabTextActive: {
    fontWeight: FONT_WEIGHTS.bold,
  },
  card: {
    padding: SPACING.md,
  },
  cardContent: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
  },
  specialistAvatar: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: FONT_WEIGHTS.bold,
  },
  cardInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  cardTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  cardDescription: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  cardPrice: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  specialistMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ratingText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  reviewsText: {
    fontSize: FONT_SIZES.xs,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    fontSize: 20,
  },
});
