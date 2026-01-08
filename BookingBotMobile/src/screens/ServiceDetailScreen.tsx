// Service Detail Screen - Full implementation matching web version
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchService, selectCurrentService } from '../store/slices/serviceSlice';
import { addServiceToFavorites, removeServiceFromFavorites, selectIsServiceFavorited } from '../store/slices/favoritesSlice';
import { useTheme } from '../contexts/ThemeContext';
import { Service } from '../types';
import { format } from 'date-fns';

export const ServiceDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  
  const serviceId = (route.params as any)?.serviceId;
  const service = useAppSelector(selectCurrentService);
  const isFavorited = useAppSelector((state) => 
    serviceId ? selectIsServiceFavorited(serviceId)(state) : false
  );
  
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

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
      Alert.alert('Error', 'Failed to load service details');
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingBottom: 20,
    },
    image: {
      width: '100%',
      height: 300,
      backgroundColor: colors.border,
    },
    details: {
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
      marginRight: 12,
    },
    favoriteButton: {
      padding: 8,
    },
    favoriteIcon: {
      fontSize: 28,
    },
    price: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    description: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      width: 120,
    },
    infoValue: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    specialistCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 24,
    },
    specialistHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    specialistAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.border,
      marginRight: 12,
    },
    specialistInfo: {
      flex: 1,
    },
    specialistName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    specialistRating: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    bookButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 18,
      alignItems: 'center',
      marginTop: 24,
    },
    bookButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
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

  if (!service) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: colors.text, marginBottom: 8 }}>
            Service not found
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              padding: 16,
              borderRadius: 12,
            }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {service.imageUrl && (
          <Image source={{ uri: service.imageUrl }} style={styles.image} resizeMode="cover" />
        )}
        
        <View style={styles.details}>
          <View style={styles.header}>
            <Text style={styles.title}>{service.name}</Text>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleToggleFavorite}
            >
              <Text style={styles.favoriteIcon}>
                {isFavorited ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.price}>${service.price?.toFixed(2) || '0.00'}</Text>

          {service.rating && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rating:</Text>
              <Text style={styles.infoValue}>
                ⭐ {service.rating.toFixed(1)} ({service.reviewCount || 0} reviews)
              </Text>
            </View>
          )}

          {service.duration && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Duration:</Text>
              <Text style={styles.infoValue}>{service.duration} minutes</Text>
            </View>
          )}

          {service.category && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category:</Text>
              <Text style={styles.infoValue}>{service.category}</Text>
            </View>
          )}

          {service.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{service.description}</Text>
            </View>
          )}

          {service.specialist && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specialist</Text>
              <TouchableOpacity
                style={styles.specialistCard}
                onPress={() => navigation.navigate('SpecialistProfile' as never, { specialistId: service.specialist?.id } as never)}
              >
                <View style={styles.specialistHeader}>
                  {service.specialist.user?.avatar ? (
                    <Image
                      source={{ uri: service.specialist.user.avatar }}
                      style={styles.specialistAvatar}
                    />
                  ) : (
                    <View style={[styles.specialistAvatar, { justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 24, color: colors.textSecondary }}>
                        {service.specialist.user?.firstName?.[0]?.toUpperCase() || service.specialist.businessName?.[0]?.toUpperCase() || 'S'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.specialistInfo}>
                    <Text style={styles.specialistName}>
                      {service.specialist.user?.firstName || ''} {service.specialist.user?.lastName || ''}
                    </Text>
                    {service.specialist.rating && (
                      <Text style={styles.specialistRating}>
                        ⭐ {service.specialist.rating.toFixed(1)} ({service.specialist.totalReviews || 0} reviews)
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBookNow}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

