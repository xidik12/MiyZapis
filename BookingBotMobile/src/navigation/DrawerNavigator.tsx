// Drawer Navigator - Complete navigation with customer and specialist screens
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { CustomDrawerContent } from '../components/CustomDrawerContent';
import { useTheme } from '../contexts/ThemeContext';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/slices/authSlice';

// Import screens
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// Customer screens
import { CustomerDashboardScreen } from '../screens/customer/DashboardScreen';

// Specialist screens
import { SpecialistDashboardScreen } from '../screens/specialist/SpecialistDashboardScreen';
import { CalendarScreen } from '../screens/specialist/CalendarScreen';
import { MyServicesScreen } from '../screens/specialist/MyServicesScreen';
import { MyClientsScreen } from '../screens/specialist/MyClientsScreen';
import { EarningsScreen } from '../screens/specialist/EarningsScreen';
import { EmployeesScreen } from '../screens/specialist/EmployeesScreen';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

export const DrawerNavigator: React.FC = () => {
  const { colors } = useTheme();
  const user = useAppSelector(selectUser);
  const userType = user?.userType?.toUpperCase() || 'CUSTOMER';
  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User';
  const userEmail = user?.email || '';
  
  // Business users use the same screens as specialists
  const isSpecialistOrBusiness = userType === 'SPECIALIST' || userType === 'BUSINESS';

  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawerContent
          {...props}
          userType={userType as 'CUSTOMER' | 'SPECIALIST'}
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
      {/* Common screens */}
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
      
      {/* Customer-specific screens */}
      {userType === 'CUSTOMER' && (
        <>
          <Drawer.Screen
            name="Dashboard"
            component={CustomerDashboardScreen}
            options={{ title: 'Dashboard' }}
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
        </>
      )}
      
      {/* Specialist and Business-specific screens */}
      {isSpecialistOrBusiness && (
        <>
          <Drawer.Screen
            name="Dashboard"
            component={SpecialistDashboardScreen}
            options={{ title: 'Dashboard' }}
          />
          <Drawer.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{ title: 'Calendar' }}
          />
          <Drawer.Screen
            name="Bookings"
            component={BookingsScreen}
            options={{ title: 'My Bookings' }}
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
          {/* Business-only: Employees management */}
          {userType === 'BUSINESS' && (
            <Drawer.Screen
              name="Employees"
              component={EmployeesScreen}
              options={{ title: 'Employees' }}
            />
          )}
        </>
      )}
      
      {/* Common screens */}
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
    </Drawer.Navigator>
  );
};

