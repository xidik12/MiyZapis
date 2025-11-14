import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { useTheme } from '../contexts/ThemeContext';
import { UserType } from '../types';

interface CustomDrawerContentProps extends DrawerContentComponentProps {
  userType?: UserType;
  userName?: string;
  userEmail?: string;
}

export const CustomDrawerContent: React.FC<CustomDrawerContentProps> = ({
  navigation,
  userType = 'customer',
  userName = 'User',
  userEmail = 'user@example.com',
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  // Normalize userType for comparison
  const normalizedUserType = userType.toUpperCase();
  const isSpecialist = normalizedUserType === 'SPECIALIST' || normalizedUserType === 'BUSINESS';
  const isBusiness = normalizedUserType === 'BUSINESS';

  const navigateTo = (screen: string) => {
    navigation.navigate(screen as any);
  };

  const getRoleBadgeColor = () => {
    switch (normalizedUserType) {
      case 'SPECIALIST':
        return colors.secondary;
      case 'BUSINESS':
        return colors.accent;
      case 'ADMIN':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <DrawerContentScrollView
      style={[styles.drawer, { backgroundColor: colors.surface }]}
      contentContainerStyle={styles.drawerContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.appName, { color: colors.text }]}>Panhaha</Text>
        <TouchableOpacity
          onPress={() => navigation.closeDrawer()}
          style={styles.closeButton}
        >
          <Text style={[styles.closeButtonText, { color: colors.text }]}>×</Text>
        </TouchableOpacity>
      </View>

      {/* User Profile */}
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
        <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor() }]}>
          <Text style={styles.roleBadgeText}>{normalizedUserType}</Text>
        </View>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{userEmail}</Text>
      </View>

      {/* Main Navigation */}
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigateTo('Home')}
        >
          <Text style={[styles.menuIcon]}>🏠</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigateTo('Search')}
        >
          <Text style={[styles.menuIcon]}>🔍</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Search Services</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigateTo('Bookings')}
        >
          <Text style={[styles.menuIcon]}>📅</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>My Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigateTo('Favorites')}
        >
          <Text style={[styles.menuIcon]}>⭐</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Favorites</Text>
        </TouchableOpacity>
      </View>

      {/* Specialist/Business Section */}
      {isSpecialist && (
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {isBusiness ? 'FOR BUSINESS' : 'FOR SPECIALISTS'}
          </Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateTo('Dashboard')}
          >
            <Text style={[styles.menuIcon]}>📊</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateTo('Calendar')}
          >
            <Text style={[styles.menuIcon]}>🗓️</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Calendar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateTo('MyServices')}
          >
            <Text style={[styles.menuIcon]}>💼</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>My Services</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateTo('MyClients')}
          >
            <Text style={[styles.menuIcon]}>👥</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>My Clients</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateTo('Earnings')}
          >
            <Text style={[styles.menuIcon]}>💰</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Earnings</Text>
          </TouchableOpacity>

          {/* Business-only: Employees */}
          {isBusiness && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo('Employees')}
            >
              <Text style={[styles.menuIcon]}>👨‍💼</Text>
              <Text style={[styles.menuText, { color: colors.text }]}>Employees</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Settings Section */}
      <View style={styles.menuSection}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SETTINGS</Text>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigateTo('Profile')}
        >
          <Text style={[styles.menuIcon]}>👤</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigateTo('Settings')}
        >
          <View style={styles.menuItemContent}>
            <View style={styles.menuItemLeft}>
              <Text style={[styles.menuIcon]}>⚙️</Text>
              <Text style={[styles.menuText, { color: colors.text }]}>Settings</Text>
            </View>
            <Text style={[styles.themeToggle, { color: colors.textSecondary }]}>
              {isDark ? '🌙' : '☀️'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={[styles.menuIcon]}>🌍</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Language</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={[styles.menuIcon]}>ℹ️</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>About</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={[styles.menuIcon]}>🚪</Text>
          <Text style={[styles.menuText, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
  },
  drawerContent: {
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 28,
    lineHeight: 28,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 14,
  },
  menuSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingVertical: 8,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
  },
  menuText: {
    fontSize: 16,
  },
  themeToggle: {
    fontSize: 20,
  },
});

