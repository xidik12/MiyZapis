/**
 * SearchScreen - Redesigned with Panhaha design system
 * Service discovery with search, category filtering, and grid/list views
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { searchServices, selectSearchResults, selectServiceLoading } from '../store/slices/serviceSlice';
import { serviceService } from '../services/service.service';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Service } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md) / 2;

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const searchResults = useAppSelector(selectSearchResults);
  const isLoading = useAppSelector(selectServiceLoading);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const initialCategory = (route.params as any)?.category;

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
    loadCategories();
    performSearch();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const loadCategories = async () => {
    try {
      const cats = await serviceService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const performSearch = async () => {
    try {
      await dispatch(searchServices({
        query: searchQuery || undefined,
        category: selectedCategory || undefined,
      })).unwrap();
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await performSearch();
    setRefreshing(false);
  };

  const services = searchResults?.services || [];

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const renderServiceCard = ({ item }: { item: Service }) => {
    if (viewMode === 'grid') {
      return (
        <TouchableOpacity
          style={{ width: CARD_WIDTH }}
          onPress={() => navigation.navigate('ServiceDetail' as never, { serviceId: item.id } as never)}
        >
          <Card style={styles.gridCard} borderVariant="subtle" elevation="sm">
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
            ) : (
              <View style={[styles.gridImage, styles.imagePlaceholder, { backgroundColor: isDark ? PRIMARY_COLORS[900] : PRIMARY_COLORS[50] }]}>
                <Text style={styles.placeholderEmoji}>🎯</Text>
              </View>
            )}
            <View style={styles.gridCardContent}>
              <Text style={[styles.gridTitle, { color: colors.text }]} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={styles.gridMeta}>
                {item.rating && (
                  <Text style={styles.gridRating}>⭐ {item.rating.toFixed(1)}</Text>
                )}
                <Text style={[styles.gridPrice, { color: PRIMARY_COLORS[500] }]}>
                  {formatPrice(item.price || 0)}
                </Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ServiceDetail' as never, { serviceId: item.id } as never)}
      >
        <Card style={styles.listCard} borderVariant="subtle" elevation="sm">
          <View style={styles.listCardContent}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.listImage} />
            ) : (
              <View style={[styles.listImage, styles.imagePlaceholder, { backgroundColor: isDark ? PRIMARY_COLORS[900] : PRIMARY_COLORS[50] }]}>
                <Text style={styles.placeholderEmojiSmall}>🎯</Text>
              </View>
            )}
            <View style={styles.listInfo}>
              <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={2}>
                {item.name}
              </Text>
              {item.category && (
                <Badge label={item.category} variant="secondary" size="sm" style={{ alignSelf: 'flex-start' }} />
              )}
              <View style={styles.listMeta}>
                {item.rating && (
                  <Text style={styles.listRating}>⭐ {item.rating.toFixed(1)}</Text>
                )}
                {item.duration && (
                  <Text style={[styles.listDuration, { color: colors.textSecondary }]}>
                    ⏱️ {item.duration}m
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.listPriceContainer}>
              <Text style={[styles.listPrice, { color: PRIMARY_COLORS[500] }]}>
                {formatPrice(item.price || 0)}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Input */}
      <Input
        placeholder={t('search.placeholder')}
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftIcon={<Text style={styles.searchIcon}>🔍</Text>}
        rightIcon={
          searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Category Filters */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            style={[
              styles.categoryChip,
              selectedCategory === null && { backgroundColor: PRIMARY_COLORS[500], borderColor: PRIMARY_COLORS[500] },
              selectedCategory !== null && { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                { color: selectedCategory === null ? '#FFFFFF' : colors.text },
              ]}
            >
              {t('search.allCategories')}
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id || cat}
              onPress={() => setSelectedCategory(cat.name || cat)}
              style={[
                styles.categoryChip,
                selectedCategory === (cat.name || cat) && { backgroundColor: PRIMARY_COLORS[500], borderColor: PRIMARY_COLORS[500] },
                selectedCategory !== (cat.name || cat) && { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: selectedCategory === (cat.name || cat) ? '#FFFFFF' : colors.text },
                ]}
              >
                {cat.name || cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
          {services.length} {t('search.results')}
        </Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            onPress={() => setViewMode('grid')}
            style={[
              styles.viewButton,
              viewMode === 'grid' && { backgroundColor: isDark ? PRIMARY_COLORS[900] + '33' : PRIMARY_COLORS[50] },
            ]}
          >
            <Text style={[styles.viewIcon, { color: viewMode === 'grid' ? PRIMARY_COLORS[500] : colors.textSecondary }]}>
              ▦
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            style={[
              styles.viewButton,
              viewMode === 'list' && { backgroundColor: isDark ? PRIMARY_COLORS[900] + '33' : PRIMARY_COLORS[50] },
            ]}
          >
            <Text style={[styles.viewIcon, { color: viewMode === 'list' ? PRIMARY_COLORS[500] : colors.textSecondary }]}>
              ☰
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {renderHeader()}
        <View style={styles.content}>
          <View style={styles.gridContainer}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={{ width: CARD_WIDTH }}>
                <Skeleton variant="rectangular" width={CARD_WIDTH} height={220} />
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}
      <FlatList
        data={services}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when view mode changes
        contentContainerStyle={[
          styles.content,
          viewMode === 'grid' && styles.gridContainer,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY_COLORS[500]}
            colors={[PRIMARY_COLORS[500]]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            emoji="🔍"
            title={t('search.noResults')}
            description={t('search.noResultsDesc')}
            actionLabel={t('search.clearFilters')}
            onAction={() => {
              setSearchQuery('');
              setSelectedCategory(null);
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  searchIcon: {
    fontSize: 20,
  },
  clearIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  categoriesContainer: {
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
  },
  resultsCount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  viewButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewIcon: {
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.bold,
  },
  content: {
    padding: SPACING.lg,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  gridCard: {
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: BORDER_RADIUS.md,
    borderTopRightRadius: BORDER_RADIUS.md,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  placeholderEmojiSmall: {
    fontSize: 30,
  },
  gridCardContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  gridTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    minHeight: 36,
  },
  gridMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridRating: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  gridPrice: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
  },
  listCard: {
    marginBottom: SPACING.md,
  },
  listCardContent: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
  },
  listInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  listTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  listMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
  },
  listRating: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  listDuration: {
    fontSize: FONT_SIZES.sm,
  },
  listPriceContainer: {
    justifyContent: 'center',
  },
  listPrice: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
