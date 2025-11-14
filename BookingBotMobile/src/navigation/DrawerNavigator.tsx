import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { CustomDrawerContent } from '../components/CustomDrawerContent';
import { RootDrawerParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';

// Import screens
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SpecialistDashboardScreen } from '../screens/specialist/SpecialistDashboardScreen';
import { CalendarScreen } from '../screens/specialist/CalendarScreen';
import { MyServicesScreen } from '../screens/specialist/MyServicesScreen';
import { MyClientsScreen } from '../screens/specialist/MyClientsScreen';
import { EarningsScreen } from '../screens/specialist/EarningsScreen';

const Drawer = createDrawerNavigator<RootDrawerParamList>();

export const DrawerNavigator: React.FC = () => {
  const { colors } = useTheme();
  // TODO: Get user type from auth context/store
  const userType = 'CUSTOMER'; // This should come from your auth state
  const userName = 'User Name';
  const userEmail = 'user@example.com';

  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawerContent
          {...props}
          userType={userType as any}
          userName={userName}
          userEmail={userEmail}
        />
      )}
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        drawerStyle: {
          backgroundColor: colors.surface,
          width: 280,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Drawer.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Search Services' }}
      />
      <Drawer.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{ title: 'My Bookings' }}
      />
      <Drawer.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: 'Favorites' }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Drawer.Screen
        name="SpecialistDashboard"
        component={SpecialistDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Drawer.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: 'Calendar' }}
      />
      <Drawer.Screen
        name="MyServices"
        component={MyServicesScreen}
        options={{ title: 'My Services' }}
      />
      <Drawer.Screen
        name="MyClients"
        component={MyClientsScreen}
        options={{ title: 'My Clients' }}
      />
      <Drawer.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ title: 'Earnings' }}
      />
    </Drawer.Navigator>
  );
};

