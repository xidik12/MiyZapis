/**
 * MyServicesScreen - Redesigned with Panhaha design system
 * Service management with add, edit, and delete functionality
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { serviceService } from '../../services/service.service';
import { Service } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  ERROR_COLOR,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../utils/design';

export const MyServicesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const user = useAppSelector(selectUser);

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadServices();
  }, [user]);

  const loadServices = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await serviceService.getSpecialistServices(user.id);
      setServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  const handleDeleteService = async (serviceId: string) => {
    Alert.alert(
      t('services.deleteTitle'),
      t('services.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await serviceService.deleteService(serviceId);
              loadServices();
              Alert.alert(t('common.success'), t('services.deleteSuccess'));
            } catch (error: any) {
              Alert.alert(t('common.error'), error || t('services.deleteError'));
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={[ACCENT_COLORS[500], ACCENT_COLORS[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        {/* Decorative orbs */}
        <View style={styles.decorativeOrbs}>
          <View style={[styles.orb, styles.orb1, { backgroundColor: PRIMARY_COLORS[400] + '20' }]} />
          <View style={[styles.orb, styles.orb2, { backgroundColor: SECONDARY_COLORS[300] + '15' }]} />
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroIcon}>🎯</Text>
          <Text style={styles.heroTitle}>{t('services.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('services.subtitle')}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderAddButton = () => (
    <TouchableOpacity
      style={[styles.addButton, { backgroundColor: ACCENT_COLORS[500] }]}
      onPress={() => navigation.navigate('AddService' as never)}
    >
      <Text style={styles.addButtonText}>+ {t('services.add')}</Text>
    </TouchableOpacity>
  );

  const renderServiceCard = ({ item }: { item: Service }) => (
    <Card style={styles.serviceCard} borderVariant="subtle" elevation="sm">
      <View style={styles.serviceContent}>
        {/* Image */}
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.serviceImage} />
        ) : (
          <View
            style={[
              styles.serviceImage,
              styles.imagePlaceholder,
              { backgroundColor: isDark ? ACCENT_COLORS[900] : ACCENT_COLORS[50] },
            ]}
          >
            <Text style={styles.placeholderEmoji}>🎯</Text>
          </View>
        )}

        {/* Service Info */}
        <View style={styles.serviceInfo}>
          <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          {item.description && (
            <Text style={[styles.serviceDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.serviceMeta}>
            {item.category && (
              <Badge label={item.category} variant="accent" size="sm" />
            )}
            {item.duration && (
              <View style={styles.durationContainer}>
                <Text style={[styles.durationText, { color: colors.textSecondary }]}>
                  ⏱ {item.duration} {t('common.minutes')}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.serviceFooter}>
            <Text style={[styles.servicePrice, { color: ACCENT_COLORS[600] }]}>
              {formatPrice(item.price || 0)}
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: SECONDARY_COLORS[500] }]}
                onPress={() =>
                  navigation.navigate('EditService' as never, { serviceId: item.id } as never)
                }
              >
                <Text style={styles.actionIcon}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: ERROR_COLOR }]}
                onPress={() => handleDeleteService(item.id)}
              >
                <Text style={styles.actionIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton variant="rectangular" width="100%" height={50} style={{ marginBottom: SPACING.lg }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={150} style={{ marginBottom: SPACING.md }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT_COLORS[500]}
            colors={[ACCENT_COLORS[500]]}
          />
        }
      >
        {renderAddButton()}

        {services.length === 0 ? (
          <EmptyState
            emoji="🎯"
            title={t('services.noServices')}
            description={t('services.noServicesDesc')}
            actionLabel={t('services.createFirst')}
            onAction={() => navigation.navigate('AddService' as never)}
          />
        ) : (
          <FlatList
            data={services}
            renderItem={renderServiceCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
          />
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
  addButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  serviceCard: {
    padding: SPACING.md,
  },
  serviceContent: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  serviceImage: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  serviceInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  serviceName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  serviceDescription: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.4,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: FONT_SIZES.xs,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  servicePrice: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 18,
  },
});
