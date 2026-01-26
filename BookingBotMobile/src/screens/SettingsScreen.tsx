/**
 * SettingsScreen - Redesigned with Panhaha design system
 * App settings with appearance, notifications, account, and support options
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout, selectUser } from '../store/slices/authSlice';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/ui/Card';
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

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors, isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const user = useAppSelector(selectUser);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logout()).unwrap();
            } catch (error) {
              console.error('Logout failed:', error);
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={[SECONDARY_COLORS[500], SECONDARY_COLORS[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        {/* Decorative orbs */}
        <View style={styles.decorativeOrbs}>
          <View style={[styles.orb, styles.orb1, { backgroundColor: PRIMARY_COLORS[400] + '20' }]} />
          <View style={[styles.orb, styles.orb2, { backgroundColor: ACCENT_COLORS[500] + '15' }]} />
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroIcon}>⚙️</Text>
          <Text style={styles.heroTitle}>{t('settings.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('settings.subtitle')}</Text>
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
        {/* Appearance Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings.appearance')}
          </Text>
          <Card style={styles.settingCard} borderVariant="subtle" elevation="sm">
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isDark ? '🌙' : '☀️'} {t('settings.darkMode')}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {t('settings.darkModeDesc')}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: PRIMARY_COLORS[500] }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor={colors.border}
              />
            </View>
          </Card>
        </View>

        <Divider spacing={SPACING.lg} />

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings.notifications')}
          </Text>
          <Card style={styles.settingCard} borderVariant="subtle" elevation="sm">
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  🔔 {t('settings.enableNotifications')}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {t('settings.enableNotificationsDesc')}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: PRIMARY_COLORS[500] }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor={colors.border}
              />
            </View>

            <Divider spacing={SPACING.sm} />

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  📧 {t('settings.emailNotifications')}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {t('settings.emailNotificationsDesc')}
                </Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: colors.border, true: PRIMARY_COLORS[500] }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor={colors.border}
                disabled={!notificationsEnabled}
              />
            </View>

            <Divider spacing={SPACING.sm} />

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  📱 {t('settings.pushNotifications')}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {t('settings.pushNotificationsDesc')}
                </Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: colors.border, true: PRIMARY_COLORS[500] }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor={colors.border}
                disabled={!notificationsEnabled}
              />
            </View>
          </Card>
        </View>

        <Divider spacing={SPACING.lg} />

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings.account')}
          </Text>

          <TouchableOpacity onPress={() => navigation.navigate('Profile' as never)}>
            <Card style={styles.menuItem} borderVariant="subtle">
              <View style={styles.menuItemContent}>
                <Text style={styles.menuIcon}>👤</Text>
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {t('settings.editProfile')}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ChangePassword' as never)}>
            <Card style={styles.menuItem} borderVariant="subtle">
              <View style={styles.menuItemContent}>
                <Text style={styles.menuIcon}>🔒</Text>
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {t('settings.changePassword')}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('PaymentMethods' as never)}>
            <Card style={styles.menuItem} borderVariant="subtle">
              <View style={styles.menuItemContent}>
                <Text style={styles.menuIcon}>💳</Text>
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {t('settings.paymentMethods')}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </TouchableOpacity>
        </View>

        <Divider spacing={SPACING.lg} />

        {/* Support & Legal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings.support')}
          </Text>

          <TouchableOpacity onPress={() => navigation.navigate('HelpSupport' as never)}>
            <Card style={styles.menuItem} borderVariant="subtle">
              <View style={styles.menuItemContent}>
                <Text style={styles.menuIcon}>❓</Text>
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {t('settings.helpSupport')}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Privacy' as never)}>
            <Card style={styles.menuItem} borderVariant="subtle">
              <View style={styles.menuItemContent}>
                <Text style={styles.menuIcon}>🔐</Text>
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {t('settings.privacyPolicy')}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Terms' as never)}>
            <Card style={styles.menuItem} borderVariant="subtle">
              <View style={styles.menuItemContent}>
                <Text style={styles.menuIcon}>📄</Text>
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {t('settings.termsOfService')}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('About' as never)}>
            <Card style={styles.menuItem} borderVariant="subtle">
              <View style={styles.menuItemContent}>
                <Text style={styles.menuIcon}>ℹ️</Text>
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {t('settings.about')}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            {t('settings.version')} 1.0.0
          </Text>
        </View>
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
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.md,
  },
  settingCard: {
    padding: SPACING.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  settingInfo: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  settingLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.4,
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
  versionContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  versionText: {
    fontSize: FONT_SIZES.sm,
  },
});
