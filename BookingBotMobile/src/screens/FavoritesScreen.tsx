// Favorites Screen - Full implementation matching web version
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFavorites, removeServiceFromFavorites, removeSpecialistFromFavorites } from '../store/slices/favoritesSlice';
import { useTheme } from '../contexts/ThemeContext';
import { Service, Specialist } from '../types';

export const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  
  const favorites = useAppSelector((state) => state.favorites);
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
    tabs: {
      flexDirection: 'row',
      marginBottom: 24,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    tabTextActive: {
      color: '#FFFFFF',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
    },
    cardImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: colors.border,
      marginRight: 12,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    cardPrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
      marginTop: 4,
    },
    removeButton: {
      padding: 8,
    },
    removeButtonText: {
      fontSize: 20,
      color: colors.error,
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
    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
  });

  const services = favorites.services || [];
  const specialists = favorites.specialists || [];

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
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>Your saved services and specialists</Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'services' && styles.tabActive]}
            onPress={() => setActiveTab('services')}
          >
            <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>
              Services ({services.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'specialists' && styles.tabActive]}
            onPress={() => setActiveTab('specialists')}
          >
            <Text style={[styles.tabText, activeTab === 'specialists' && styles.tabTextActive]}>
              Specialists ({specialists.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'services' ? (
          services.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⭐</Text>
              <Text style={styles.emptyText}>No favorite services yet</Text>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  padding: 16,
                  borderRadius: 12,
                  marginTop: 16,
                }}
                onPress={() => navigation.navigate('Search' as never)}
              >
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>
                  Browse Services
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            services.map((service: Service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.card}
                onPress={() => navigation.navigate('ServiceDetail' as never, { serviceId: service.id } as never)}
              >
                {service.imageUrl ? (
                  <Image source={{ uri: service.imageUrl }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 32 }}>📦</Text>
                  </View>
                )}
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{service.name}</Text>
                  {service.description && (
                    <Text style={styles.cardSubtitle} numberOfLines={2}>
                      {service.description}
                    </Text>
                  )}
                  <Text style={styles.cardPrice}>
                    ${service.price?.toFixed(2) || '0.00'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveService(service.id)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )
        ) : (
          specialists.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👤</Text>
              <Text style={styles.emptyText}>No favorite specialists yet</Text>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  padding: 16,
                  borderRadius: 12,
                  marginTop: 16,
                }}
                onPress={() => navigation.navigate('Search' as never)}
              >
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>
                  Browse Specialists
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            specialists.map((specialist: Specialist) => (
              <TouchableOpacity
                key={specialist.id}
                style={styles.card}
                onPress={() => navigation.navigate('SpecialistProfile' as never, { specialistId: specialist.id } as never)}
              >
                {specialist.avatar ? (
                  <Image source={{ uri: specialist.avatar }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 32 }}>
                      {specialist.firstName?.[0]?.toUpperCase() || 'S'}
                    </Text>
                  </View>
                )}
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>
                    {specialist.firstName} {specialist.lastName}
                  </Text>
                  {specialist.businessName && (
                    <Text style={styles.cardSubtitle}>{specialist.businessName}</Text>
                  )}
                  {specialist.rating && (
                    <Text style={styles.cardSubtitle}>
                      ⭐ {specialist.rating.toFixed(1)} ({specialist.reviewCount || 0} reviews)
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveSpecialist(specialist.id)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
