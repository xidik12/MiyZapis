/**
 * DrawerNavigator - Enhanced with Panhaha design system
 * Complete navigation with customer and specialist screens
 */
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { CustomDrawerContent } from '../components/CustomDrawerContent';
import { useTheme } from '../contexts/ThemeContext';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/slices/authSlice';
import { UserType } from '../types';
import { PRIMARY_COLORS, SECONDARY_COLORS } from '../utils/design';

// Import screens
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// Customer screens
import { CustomerDashboardScreen } from '../screens/customer/DashboardScreen';
import { CustomerReferralsScreen } from '../screens/customer/ReferralsScreen';
import { CustomerWalletScreen } from '../screens/customer/WalletScreen';
import { CustomerMessagesScreen } from '../screens/customer/MessagesScreen';

// Specialist screens
import { SpecialistDashboardScreen } from '../screens/specialist/SpecialistDashboardScreen';
import { CalendarScreen } from '../screens/specialist/CalendarScreen';
import { MyServicesScreen } from '../screens/specialist/MyServicesScreen';
import { MyClientsScreen } from '../screens/specialist/MyClientsScreen';
import { EarningsScreen } from '../screens/specialist/EarningsScreen';
import { EmployeesScreen } from '../screens/specialist/EmployeesScreen';
import { LoyaltyScreen } from '../screens/specialist/LoyaltyScreen';
import { ScheduleScreen } from '../screens/specialist/ScheduleScreen';
import { AnalyticsScreen } from '../screens/specialist/AnalyticsScreen';
import { ReviewsScreen } from '../screens/specialist/ReviewsScreen';
import { SpecialistReferralsScreen } from '../screens/specialist/ReferralsScreen';
import { SpecialistWalletScreen } from '../screens/specialist/WalletScreen';
import { SpecialistMessagesScreen } from '../screens/specialist/MessagesScreen';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

export const DrawerNavigator: React.FC = () => {
  const { colors } = useTheme();
  const user = useAppSelector(selectUser);
  // Normalize userType - backend uses lowercase, but we compare with uppercase for consistency
  const userType = user?.userType?.toUpperCase() || 'CUSTOMER';
  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User';
  const userEmail = user?.email || '';
  
  // Business users use the same screens as specialists
  const isSpecialistOrBusiness = userType === 'SPECIALIST' || userType === 'BUSINESS';
  const isBusiness = userType === 'BUSINESS';

  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawerContent
          {...props}
          userType={userType.toLowerCase() as UserType}
          userName={userName}
          userEmail={userEmail}
        />
      )}
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: PRIMARY_COLORS[600],
        drawerInactiveTintColor: colors.textSecondary,
        drawerStyle: {
          backgroundColor: colors.background,
          width: 300,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        drawerType: 'slide',
        overlayColor: 'rgba(0, 0, 0, 0.5)',
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
          <Drawer.Screen
            name="Referrals"
            component={CustomerReferralsScreen}
            options={{ title: 'Referrals' }}
          />
          <Drawer.Screen
            name="Wallet"
            component={CustomerWalletScreen}
            options={{ title: 'Wallet' }}
          />
          <Drawer.Screen
            name="Messages"
            component={CustomerMessagesScreen}
            options={{ title: 'Messages' }}
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
            name="Schedule"
            component={ScheduleScreen}
            options={{ title: 'Schedule' }}
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
          <Drawer.Screen
            name="Loyalty"
            component={LoyaltyScreen}
            options={{ title: 'Loyalty Rewards' }}
          />
          <Drawer.Screen
            name="Analytics"
            component={AnalyticsScreen}
            options={{ title: 'Analytics' }}
          />
          <Drawer.Screen
            name="Reviews"
            component={ReviewsScreen}
            options={{ title: 'Reviews' }}
          />
          <Drawer.Screen
            name="Referrals"
            component={SpecialistReferralsScreen}
            options={{ title: 'Referrals' }}
          />
          <Drawer.Screen
            name="Wallet"
            component={SpecialistWalletScreen}
            options={{ title: 'Wallet' }}
          />
          <Drawer.Screen
            name="Messages"
            component={SpecialistMessagesScreen}
            options={{ title: 'Messages' }}
          />
          {/* Business-only: Employees management */}
          {isBusiness && (
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

