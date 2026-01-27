/**
 * CustomDrawerContent - Redesigned with Panhaha design system
 * Enhanced with notification badges and gradient header
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppSelector } from '../store/hooks';
import { selectUnreadNotificationsCount } from '../store/slices/notificationSlice';
import { UserType } from '../types';
import { Badge } from './ui/Badge';
import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  ACCENT_COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../utils/design';

interface CustomDrawerContentProps extends DrawerContentComponentProps {
  userType?: UserType;
  userName?: string;
  userEmail?: string;
}

interface MenuItem {
  name: string;
  label: string;
  icon: string;
  badge?: number;
  color?: string;
}

export const CustomDrawerContent: React.FC<CustomDrawerContentProps> = ({
  navigation,
  state,
  userType = 'customer',
  userName = 'User',
  userEmail = 'user@example.com',
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const unreadNotifications = useAppSelector(selectUnreadNotificationsCount);

  // Normalize userType for comparison
  const normalizedUserType = userType.toUpperCase();
  const isSpecialist = normalizedUserType === 'SPECIALIST' || normalizedUserType === 'BUSINESS';
  const isBusiness = normalizedUserType === 'BUSINESS';

  // Get current route name
  const currentRoute = state.routes[state.index].name;

  const navigateTo = (screen: string) => {
    navigation.navigate(screen as any);
  };

  const getRoleBadgeColor = () => {
    switch (normalizedUserType) {
      case 'SPECIALIST':
        return SECONDARY_COLORS[600];
      case 'BUSINESS':
        return ACCENT_COLORS[600];
      case 'ADMIN':
        return PRIMARY_COLORS[600];
      default:
        return colors.textSecondary;
    }
  };

  const getRoleLabel = () => {
    switch (normalizedUserType) {
      case 'SPECIALIST':
        return t('drawer.specialist');
      case 'BUSINESS':
        return t('drawer.business');
      case 'ADMIN':
        return t('drawer.admin');
      default:
        return t('drawer.customer');
    }
  };

  // Common menu items for all users
  const commonMenuItems: MenuItem[] = [
    { name: 'Home', label: t('drawer.home'), icon: '🏠' },
    { name: 'Search', label: t('drawer.search'), icon: '🔍' },
  ];

  // Customer-specific menu items
  const customerMenuItems: MenuItem[] = [
    { name: 'Dashboard', label: t('drawer.dashboard'), icon: '📊' },
    { name: 'Bookings', label: t('drawer.bookings'), icon: '📅', badge: 3 }, // Placeholder badge
    { name: 'Favorites', label: t('drawer.favorites'), icon: '❤️' },
    { name: 'Referrals', label: t('drawer.referrals'), icon: '🎁' },
    { name: 'Wallet', label: t('drawer.wallet'), icon: '💰' },
    { name: 'Messages', label: t('drawer.messages'), icon: '💬', badge: unreadNotifications },
  ];

  // Specialist menu items
  const specialistMenuItems: MenuItem[] = [
    { name: 'Dashboard', label: t('drawer.dashboard'), icon: '📊' },
    { name: 'Calendar', label: t('drawer.calendar'), icon: '🗓️' },
    { name: 'MyServices', label: t('drawer.myServices'), icon: '💼' },
    { name: 'MyClients', label: t('drawer.myClients'), icon: '👥' },
    { name: 'Earnings', label: t('drawer.earnings'), icon: '💰', color: ACCENT_COLORS[600] },
    { name: 'Schedule', label: t('drawer.schedule'), icon: '📋' },
    { name: 'Loyalty', label: t('drawer.loyalty'), icon: '🎁', color: ACCENT_COLORS[600] },
    { name: 'Analytics', label: t('drawer.analytics'), icon: '📈' },
    { name: 'Reviews', label: t('drawer.reviews'), icon: '⭐' },
    { name: 'Referrals', label: t('drawer.referrals'), icon: '🎁' },
    { name: 'Wallet', label: t('drawer.wallet'), icon: '💳' },
    { name: 'Messages', label: t('drawer.messages'), icon: '💬', badge: unreadNotifications },
  ];

  // Business-only: Employees
  const businessMenuItems: MenuItem[] = [
    { name: 'Employees', label: t('drawer.employees'), icon: '👨‍💼' },
  ];

  // Settings menu items
  const settingsMenuItems: MenuItem[] = [
    { name: 'Profile', label: t('drawer.profile'), icon: '👤' },
    { name: 'Settings', label: t('drawer.settings'), icon: '⚙️' },
  ];

  const renderMenuItem = (item: MenuItem, isActive: boolean) => {
    return (
      <TouchableOpacity
        key={item.name}
        style={[
          styles.menuItem,
          isActive && [
            styles.menuItemActive,
            { backgroundColor: isDark ? PRIMARY_COLORS[900] + '20' : PRIMARY_COLORS[50] },
          ],
        ]}
        onPress={() => navigateTo(item.name)}
        activeOpacity={0.7}
      >
        <View style={styles.menuItemLeft}>
          <Text style={styles.menuIcon}>{item.icon}</Text>
          <Text
            style={[
              styles.menuText,
              { color: isActive ? PRIMARY_COLORS[600] : colors.text },
              isActive && styles.menuTextActive,
            ]}
          >
            {item.label}
          </Text>
        </View>
        {item.badge && item.badge > 0 && (
          <Badge label={item.badge.toString()} variant="primary" size="sm" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <DrawerContentScrollView
      style={[styles.drawer, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.drawerContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Gradient */}
      <LinearGradient
        colors={[PRIMARY_COLORS[600], PRIMARY_COLORS[800]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Decorative orb */}
        <View style={styles.decorativeOrbs}>
          <View style={[styles.orb, { backgroundColor: ACCENT_COLORS[500] + '20' }]} />
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.appName}>Panhaha</Text>
          <TouchableOpacity
            onPress={() => navigation.closeDrawer()}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* User Profile Section */}
      <View style={[styles.profileSection, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: getRoleBadgeColor() }]}>
          <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
        <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor() }]}>
          <Text style={styles.roleBadgeText}>{getRoleLabel()}</Text>
        </View>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
          {userEmail}
        </Text>
      </View>

      {/* Main Navigation */}
      <View style={styles.menuSection}>
        {commonMenuItems.map((item) => renderMenuItem(item, currentRoute === item.name))}
        {normalizedUserType === 'CUSTOMER' &&
          customerMenuItems.map((item) => renderMenuItem(item, currentRoute === item.name))}
      </View>

      {/* Specialist/Business Section */}
      {isSpecialist && (
        <View style={styles.menuSection}>
          <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {isBusiness ? t('drawer.forBusiness') : t('drawer.forSpecialists')}
          </Text>
          {specialistMenuItems.map((item) => renderMenuItem(item, currentRoute === item.name))}
          {isBusiness &&
            businessMenuItems.map((item) => renderMenuItem(item, currentRoute === item.name))}
        </View>
      )}

      {/* Settings Section */}
      <View style={styles.menuSection}>
        <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('drawer.settings')}
        </Text>
        {settingsMenuItems.map((item) => renderMenuItem(item, currentRoute === item.name))}

        {/* Theme Toggle Indicator */}
        <View style={styles.themeIndicator}>
          <Text style={[styles.themeText, { color: colors.textSecondary }]}>
            {isDark ? '🌙 ' + t('drawer.darkMode') : '☀️ ' + t('drawer.lightMode')}
          </Text>
        </View>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Version 1.0.0
        </Text>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          © 2026 Panhaha
        </Text>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
  },
  drawerContent: {
    paddingBottom: SPACING.xl,
  },
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeOrbs: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    top: -30,
    right: -30,
    opacity: 0.3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  appName: {
    fontSize: 28,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: FONT_WEIGHTS.bold,
  },
  profileSection: {
    alignItems: 'center',
    padding: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#FFFFFF',
  },
  userName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs,
  },
  roleBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.xs,
  },
  roleBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: FONT_SIZES.sm,
    maxWidth: '90%',
  },
  menuSection: {
    paddingVertical: SPACING.sm,
  },
  sectionDivider: {
    height: 1,
    marginVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  menuItemActive: {
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_COLORS[600],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 22,
    marginRight: SPACING.md,
    width: 28,
  },
  menuText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.medium,
  },
  menuTextActive: {
    fontWeight: FONT_WEIGHTS.semibold,
  },
  themeIndicator: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  themeText: {
    fontSize: FONT_SIZES.sm,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    marginBottom: 4,
  },
});
