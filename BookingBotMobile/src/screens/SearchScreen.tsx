// Search Screen - Full implementation matching web version
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { searchServices, selectSearchResults, selectServiceLoading } from '../store/slices/serviceSlice';
import { serviceService } from '../services/service.service';
import { useTheme } from '../contexts/ThemeContext';
import { Service } from '../types';

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  
  const searchResults = useAppSelector(selectSearchResults);
  const isLoading = useAppSelector(selectServiceLoading);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
      paddingBottom: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchInput: {
      height: 50,
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoriesContainer: {
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
    },
    categoryChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryChipInactive: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    categoryText: {
      fontSize: 14,
      fontWeight: '500',
    },
    categoryTextActive: {
      color: '#FFFFFF',
    },
    categoryTextInactive: {
      color: colors.text,
    },
    content: {
      padding: 20,
    },
    resultsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    resultsCount: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    serviceCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    serviceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    serviceTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    servicePrice: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
    },
    serviceDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    serviceFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    serviceRating: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    serviceDuration: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search services..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory ? styles.categoryChipActive : styles.categoryChipInactive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryText,
                !selectedCategory ? styles.categoryTextActive : styles.categoryTextInactive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id ? styles.categoryChipActive : styles.categoryChipInactive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id ? styles.categoryTextActive : styles.categoryTextInactive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {isLoading && services.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {services.length} {services.length === 1 ? 'service' : 'services'} found
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No services found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your search or filters
              </Text>
            </View>
          }
          renderItem={({ item: service }) => (
            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => navigation.navigate('ServiceDetail' as never, { serviceId: service.id } as never)}
            >
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceTitle} numberOfLines={2}>
                  {service.name}
                </Text>
                <Text style={styles.servicePrice}>
                  ${service.price?.toFixed(2) || '0.00'}
                </Text>
              </View>
              {service.description && (
                <Text style={styles.serviceDescription} numberOfLines={2}>
                  {service.description}
                </Text>
              )}
              <View style={styles.serviceFooter}>
                {service.rating && (
                  <Text style={styles.serviceRating}>
                    ⭐ {service.rating.toFixed(1)} ({service.reviewCount || 0})
                  </Text>
                )}
                {service.duration && (
                  <Text style={styles.serviceDuration}>
                    ⏱ {service.duration} min
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};
