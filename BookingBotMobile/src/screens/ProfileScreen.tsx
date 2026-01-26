/**
 * ProfileScreen - Redesigned with Panhaha design system
 * User profile management with avatar upload, edit mode, and account actions
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectUser, updateProfile, uploadAvatar, logout } from '../store/slices/authSlice';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import * as ImagePicker from 'expo-image-picker';
import { User } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Divider } from '../components/ui/Divider';
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

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const user = useAppSelector(selectUser);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await dispatch(updateProfile(formData)).unwrap();
      setIsEditing(false);
      Alert.alert(t('profile.success'), t('profile.updateSuccess'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error || t('profile.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(t('profile.permissionRequired'), t('profile.permissionMessage'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        await dispatch(uploadAvatar(result.assets[0].uri)).unwrap();
        Alert.alert(t('profile.success'), t('profile.avatarSuccess'));
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error || t('profile.avatarError'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
          },
        },
      ]
    );
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
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={handleAvatarUpload} disabled={loading}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <View style={styles.avatarEditButton}>
                <Text style={styles.cameraIcon}>📷</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Name and Email */}
          <Text style={styles.heroName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.heroEmail}>{user?.email}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Information */}
        <Card style={styles.section} borderVariant="subtle" elevation="sm">
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('profile.personalInfo')}
            </Text>
            <TouchableOpacity
              onPress={() => (isEditing ? setIsEditing(false) : setIsEditing(true))}
            >
              <Text style={[styles.editButton, { color: PRIMARY_COLORS[500] }]}>
                {isEditing ? t('common.cancel') : t('common.edit')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('profile.firstName')}
              </Text>
              <Input
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                editable={isEditing}
                placeholder={t('profile.firstNamePlaceholder')}
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('profile.lastName')}
              </Text>
              <Input
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                editable={isEditing}
                placeholder={t('profile.lastNamePlaceholder')}
              />
            </View>

            {/* Email (Read-only) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('profile.email')}
              </Text>
              <Input
                value={formData.email}
                editable={false}
                placeholder={t('profile.emailPlaceholder')}
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('profile.phoneNumber')}
              </Text>
              <Input
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                editable={isEditing}
                keyboardType="phone-pad"
                placeholder={t('profile.phoneNumberPlaceholder')}
              />
            </View>

            {isEditing && (
              <Button
                variant="primary"
                size="lg"
                onPress={handleSave}
                loading={loading}
                disabled={loading}
              >
                {t('common.save')}
              </Button>
            )}
          </View>
        </Card>

        <Divider spacing={SPACING.lg} />

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: SPACING.md }]}>
            {t('profile.quickActions')}
          </Text>

          <TouchableOpacity onPress={() => navigation.navigate('Settings' as never)}>
            <Card style={styles.menuItem} borderVariant="subtle">
              <View style={styles.menuItemContent}>
                <Text style={styles.menuIcon}>⚙️</Text>
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {t('profile.settings')}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Bookings' as never)}>
            <Card style={styles.menuItem} borderVariant="subtle">
              <View style={styles.menuItemContent}>
                <Text style={styles.menuIcon}>📅</Text>
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {t('profile.myBookings')}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Favorites' as never)}>
            <Card style={styles.menuItem} borderVariant="subtle">
              <View style={styles.menuItemContent}>
                <Text style={styles.menuIcon}>❤️</Text>
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {t('profile.favorites')}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Wallet' as never)}>
            <Card style={styles.menuItem} borderVariant="subtle">
              <View style={styles.menuItemContent}>
                <Text style={styles.menuIcon}>💰</Text>
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {t('profile.wallet')}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </TouchableOpacity>
        </View>

        <Divider spacing={SPACING.lg} />

        {/* Logout Button */}
        <Button
          variant="destructive"
          size="lg"
          onPress={handleLogout}
        >
          🚪 {t('profile.logout')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    height: 240,
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
    width: 150,
    height: 150,
    top: -30,
    right: -30,
    opacity: 0.3,
  },
  orb2: {
    width: 120,
    height: 120,
    bottom: -20,
    left: -20,
    opacity: 0.2,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    backgroundColor: SECONDARY_COLORS[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: FONT_WEIGHTS.bold,
    color: SECONDARY_COLORS[600],
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: ACCENT_COLORS[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cameraIcon: {
    fontSize: 16,
  },
  heroName: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight as any,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  heroEmail: {
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  editButton: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  form: {
    gap: SPACING.md,
  },
  inputGroup: {
    gap: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  menuItem: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.medium,
  },
  chevron: {
    fontSize: 24,
    color: PRIMARY_COLORS[500],
    fontWeight: FONT_WEIGHTS.bold,
  },
});
