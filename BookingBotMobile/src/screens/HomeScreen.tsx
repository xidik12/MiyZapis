// Home Screen - Full implementation matching web version
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import { selectIsAuthenticated, selectUser } from '../store/slices/authSlice';
import { fetchFeaturedServices } from '../store/slices/serviceSlice';
import { useAppDispatch } from '../store/hooks';
import { useTheme } from '../contexts/ThemeContext';
import { serviceService } from '../services/service.service';
import { Service } from '../types';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
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
    hero: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
    },
    heroTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 18,
      color: '#FFFFFF',
      opacity: 0.9,
      marginBottom: 24,
    },
    heroButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    heroButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    section: {
      marginBottom: 32,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    sectionLink: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    quickActionCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    quickActionIcon: {
      fontSize: 32,
      marginBottom: 8,
    },
    quickActionText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    serviceCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginRight: 12,
      width: 280,
      borderWidth: 1,
      borderColor: colors.border,
    },
    serviceImage: {
      width: '100%',
      height: 160,
      borderRadius: 8,
      backgroundColor: colors.border,
      marginBottom: 12,
    },
    serviceTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    servicePrice: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 4,
    },
    serviceRating: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    categoryText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            {isAuthenticated && user?.firstName 
              ? `Welcome back, ${user.firstName}!` 
              : 'Welcome to Panhaha'}
          </Text>
          <Text style={styles.heroSubtitle}>
            Book services from top specialists
          </Text>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => navigation.navigate('Search' as never)}
          >
            <Text style={styles.heroButtonText}>Explore Services</Text>
          </TouchableOpacity>
        </View>

        {isAuthenticated && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('Search' as never)}
              >
                <Text style={styles.quickActionIcon}>🔍</Text>
                <Text style={styles.quickActionText}>Search Services</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('Bookings' as never)}
              >
                <Text style={styles.quickActionIcon}>📅</Text>
                <Text style={styles.quickActionText}>My Bookings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('Favorites' as never)}
              >
                <Text style={styles.quickActionIcon}>⭐</Text>
                <Text style={styles.quickActionText}>Favorites</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('Profile' as never)}
              >
                <Text style={styles.quickActionIcon}>👤</Text>
                <Text style={styles.quickActionText}>Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryChip}
                  onPress={() => navigation.navigate('Search' as never, { category: category.id } as never)}
                >
                  <Text style={styles.categoryText}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {featuredServices.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Services</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Search' as never)}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {featuredServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => navigation.navigate('ServiceDetail' as never, { serviceId: service.id } as never)}
                >
                  {service.imageUrl && (
                    <Image
                      source={{ uri: service.imageUrl }}
                      style={styles.serviceImage}
                      resizeMode="cover"
                    />
                  )}
                  <Text style={styles.serviceTitle} numberOfLines={2}>
                    {service.name}
                  </Text>
                  <Text style={styles.servicePrice}>
                    ${service.price?.toFixed(2) || '0.00'}
                  </Text>
                  {service.rating && (
                    <Text style={styles.serviceRating}>
                      ⭐ {service.rating.toFixed(1)} ({service.reviewCount || 0} reviews)
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
