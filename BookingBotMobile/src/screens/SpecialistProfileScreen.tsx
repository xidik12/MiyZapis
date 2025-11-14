// Specialist Profile Screen - Full implementation matching web version
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
import { specialistService } from '../services/specialist.service';
import { addSpecialistToFavorites, removeSpecialistFromFavorites, selectIsSpecialistFavorited } from '../store/slices/favoritesSlice';
import { useTheme } from '../contexts/ThemeContext';
import { Specialist, Service } from '../types';

export const SpecialistProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  
  const specialistId = (route.params as any)?.specialistId;
  const isFavorited = useAppSelector((state) => 
    specialistId ? selectIsSpecialistFavorited(specialistId)(state) : false
  );
  
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (specialistId) {
      loadSpecialist();
    }
  }, [specialistId]);

  const loadSpecialist = async () => {
    try {
      setLoading(true);
      const [profile, specialistServices] = await Promise.all([
        specialistService.getPublicProfile(specialistId),
        specialistService.getSpecialists({ limit: 20 }).then(res => {
          const spec = res.specialists.find(s => s.id === specialistId);
          return spec ? [] : [];
        }).catch(() => []),
      ]);
      setSpecialist(profile);
      // Load services for this specialist
      const { serviceService } = await import('../services/service.service');
      const specServices = await serviceService.getSpecialistServices(specialistId).catch(() => []);
      setServices(specServices);
    } catch (error) {
      console.error('Failed to load specialist:', error);
      Alert.alert('Error', 'Failed to load specialist profile');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!specialistId) return;
    
    try {
      if (isFavorited) {
        await dispatch(removeSpecialistFromFavorites(specialistId)).unwrap();
      } else {
        await dispatch(addSpecialistToFavorites(specialistId)).unwrap();
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
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
      paddingBottom: 20,
    },
    header: {
      backgroundColor: colors.surface,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.border,
      marginRight: 16,
    },
    headerInfo: {
      flex: 1,
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    businessName: {
      fontSize: 18,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    rating: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    favoriteButton: {
      padding: 8,
    },
    favoriteIcon: {
      fontSize: 28,
    },
    bio: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      marginTop: 16,
    },
    section: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
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
      marginBottom: 12,
    },
    bookButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    bookButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    infoRow: {
      flexDirection: 'row',
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

  if (!specialist) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: colors.text, marginBottom: 8 }}>
            Specialist not found
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
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {specialist.avatar ? (
              <Image source={{ uri: specialist.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 40, color: colors.textSecondary }}>
                  {specialist.firstName?.[0]?.toUpperCase() || 'S'}
                </Text>
              </View>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.name}>
                {specialist.firstName} {specialist.lastName}
              </Text>
              {specialist.businessName && (
                <Text style={styles.businessName}>{specialist.businessName}</Text>
              )}
              {specialist.rating && (
                <Text style={styles.rating}>
                  ⭐ {specialist.rating.toFixed(1)} ({specialist.reviewCount || 0} reviews)
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleToggleFavorite}
            >
              <Text style={styles.favoriteIcon}>
                {isFavorited ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>
          {specialist.bio && (
            <Text style={styles.bio}>{specialist.bio}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>
              {specialist.city || 'Not specified'}, {specialist.country || ''}
            </Text>
          </View>
          {specialist.responseTime && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Response Time:</Text>
              <Text style={styles.infoValue}>{specialist.responseTime} minutes</Text>
            </View>
          )}
          {specialist.experienceYears && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Experience:</Text>
              <Text style={styles.infoValue}>{specialist.experienceYears} years</Text>
            </View>
          )}
        </View>

        {services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => navigation.navigate('ServiceDetail' as never, { serviceId: service.id } as never)}
              >
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceTitle}>{service.name}</Text>
                  <Text style={styles.servicePrice}>
                    ${service.price?.toFixed(2) || '0.00'}
                  </Text>
                </View>
                {service.description && (
                  <Text style={styles.serviceDescription} numberOfLines={2}>
                    {service.description}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => navigation.navigate('BookingFlow' as never, { serviceId: service.id } as never)}
                >
                  <Text style={styles.bookButtonText}>Book Service</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

