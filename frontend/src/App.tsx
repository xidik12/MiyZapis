import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { getCurrentUser, selectIsAuthenticated, selectUser } from './store/slices/authSlice';
import { getAuthToken } from './services/api';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { FullScreenHandshakeLoader } from './components/ui/FullScreenHandshakeLoader';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AdminRoute } from './components/admin/AdminRoute';
import { MainLayout } from './components/layout/MainLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ConditionalLayout } from './components/layout/ConditionalLayout';
import { UserTypeRedirect } from './components/routing/UserTypeRedirect';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const ServiceDetailPage = React.lazy(() => import('./pages/ServiceDetailPage'));
const SpecialistProfilePage = React.lazy(() => import('./pages/SpecialistProfilePage'));
const BookingFlow = React.lazy(() => import('./pages/booking/BookingFlow'));

// Authentication pages
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = React.lazy(() => import('./pages/auth/VerifyEmailPage'));
const AuthCallbackPage = React.lazy(() => import('./pages/auth/AuthCallbackPage'));

// Customer pages
const CustomerDashboard = React.lazy(() => import('./pages/customer/Dashboard'));
const CustomerBookings = React.lazy(() => import('./pages/customer/Bookings'));
const CustomerProfile = React.lazy(() => import('./pages/customer/Profile'));
const CustomerLoyalty = React.lazy(() => import('./pages/customer/Loyalty'));
const CustomerFavorites = React.lazy(() => import('./pages/customer/Favorites'));
const CustomerSettings = React.lazy(() => import('./pages/customer/Settings'));
  const CustomerHelpSupport = React.lazy(() => import('./pages/customer/HelpSupport'));
  const PaymentMethods = React.lazy(() => import('./pages/customer/PaymentMethods'));
  const CustomerMessages = React.lazy(() => import('./pages/customer/Messages'));
  const CustomerReferrals = React.lazy(() => import('./pages/customer/Referrals'));
const CustomerWallet = React.lazy(() => import('./pages/customer/Wallet'));

// Specialist pages
const SpecialistDashboard = React.lazy(() => import('./pages/specialist/Dashboard'));
const SpecialistBookings = React.lazy(() => import('./pages/specialist/Bookings'));
const SpecialistServices = React.lazy(() => import('./pages/specialist/Services'));
const SpecialistProfile = React.lazy(() => import('./pages/specialist/Profile'));
const SpecialistAnalytics = React.lazy(() => import('./pages/specialist/Analytics'));
const SpecialistSchedule = React.lazy(() => import('./pages/specialist/Schedule'));
const SpecialistEarnings = React.lazy(() => import('./pages/specialist/Earnings'));
const SpecialistFinances = React.lazy(() => import('./pages/specialist/Finances'));
const SpecialistReviews = React.lazy(() => import('./pages/specialist/Reviews'));
const SpecialistLoyalty = React.lazy(() => import('./pages/specialist/Loyalty'));
const SpecialistMessages = React.lazy(() => import('./pages/specialist/Messages'));
const SpecialistReferrals = React.lazy(() => import('./pages/specialist/Referrals'));
const SpecialistWallet = React.lazy(() => import('./pages/specialist/Wallet'));
const EmployeeManagement = React.lazy(() => import('./pages/specialist/EmployeeManagement'));

// Customer pages
const CustomerReviews = React.lazy(() => import('./pages/customer/Reviews'));
const SpecialistSettings = React.lazy(() => import('./pages/specialist/Settings'));
const SpecialistNotifications = React.lazy(() => import('./pages/specialist/Notifications'));

// Admin pages
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));

// Layout
const SpecialistLayout = React.lazy(() => import('./components/layout/SpecialistLayout'));
const CustomerLayout = React.lazy(() => import('./components/layout/CustomerLayout'));

// Routing
const SearchPageRouter = React.lazy(() => import('./components/routing/SearchPageRouter'));
const BookingRouter = React.lazy(() => import('./components/routing/BookingRouter'));

// Other pages
const PaymentPage = React.lazy(() => import('./pages/PaymentPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));

// Loading component for Suspense - simple and clean
const CustomerNotificationsPlaceholder: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t('notifications.pageTitle')}</h1>
      <p className="text-gray-600 mt-2">{t('notifications.pageSubtitle')}</p>
    </div>
  );
};

const CustomerHistoryPlaceholder: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t('bookings.history.title')}</h1>
      <p className="text-gray-600 mt-2">{t('bookings.history.subtitle')}</p>
    </div>
  );
};

const SuspenseLoader = () => {
  const { t } = useLanguage();

  return <FullScreenHandshakeLoader title={t('common.loading')} />;
};

// Component to redirect from /book/:serviceId to /booking/:serviceId
const BookingRouteRedirect: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  return <Navigate to={`/booking/${serviceId}`} replace />;
};

// Page title updater hook
const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Panhaha – Cambodian Service Booking Platform',
      '/search': 'Search Services – Panhaha',
      '/login': 'Sign In – Panhaha',
      '/register': 'Sign Up – Panhaha',
      '/dashboard': 'Dashboard – Panhaha',
      '/bookings': 'My Bookings – Panhaha',
      '/profile': 'My Profile – Panhaha',
      '/specialist/dashboard': 'Specialist Dashboard – Panhaha',
      '/specialist/bookings': 'Manage Bookings – Panhaha',
      '/specialist/services': 'Manage Services – Panhaha',
      '/specialist/analytics': 'Analytics – Panhaha',
      '/specialist/schedule': 'Schedule – Panhaha',
      '/specialist/earnings': 'Earnings – Panhaha',
      '/specialist/finances': 'Finances – Panhaha',
      '/specialist/reviews': 'Reviews – Panhaha',
      '/specialist/loyalty': 'Loyalty Program – Panhaha',
      '/specialist/messages': 'Messages – Panhaha',
      '/specialist/settings': 'Settings – Panhaha',
      '/specialist/notifications': 'Notifications – Panhaha',
      '/admin/dashboard': 'Admin Dashboard – Panhaha',
    };

    const title = titles[location.pathname] || 'Panhaha';
    document.title = title;

    // Update meta description based on page
    const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
      const descriptions: Record<string, string> = {
        '/': 'Book Cambodian specialists with confidence on Panhaha. Explore trusted experts, fair pricing, and instant scheduling in one modern platform.',
        '/search': 'Discover spa, wellness, beauty, and professional services around Cambodia. Filter, compare, and secure appointments instantly with Panhaha.',
        '/specialist/dashboard': 'Grow your specialist brand on Panhaha. Track bookings, earnings, and client happiness with intuitive analytics and tools.',
      };
      metaDescription.setAttribute(
        'content',
        descriptions[location.pathname] || 'Panhaha – Cambodian Professional Service Booking Platform'
      );
    }
  }, [location.pathname]);
};

function App() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const [isInitializing, setIsInitializing] = React.useState(true);

  // Update page titles based on routes
  usePageTitle();

  // Initialize authentication on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAuthToken();
      if (token && !isAuthenticated) {
        try {
          await dispatch(getCurrentUser()).unwrap();
        } catch (error) {
          console.error('Failed to restore authentication:', error);
          // Token might be expired, let the interceptor handle it
        }
      }
      setIsInitializing(false);
    };

    initializeAuth();
  }, [dispatch, isAuthenticated]);

  // Show loading screen while initializing
  if (isInitializing) {
    return <SuspenseLoader />;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <CurrencyProvider>
          {/* <SocketProvider> */}
            <div className="App min-h-screen transition-colors duration-300 relative prevent-overflow">
              {/* <FloatingElements /> */}
              <Routes>
          {/* Auth routes first */}
          <Route
            path="/auth/*"
            element={
              <AuthLayout>
                <Suspense fallback={<SuspenseLoader />}>
                  <Routes>
                    <Route path="login" element={<LoginPage />} />
                    <Route path="register" element={<RegisterPage />} />
                    <Route path="forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="reset-password" element={<ResetPasswordPage />} />
                    <Route path="verify-email" element={<VerifyEmailPage />} />
                    <Route path="callback" element={<AuthCallbackPage />} />
                    <Route path="*" element={<Navigate to="/auth/login" replace />} />
                  </Routes>
                </Suspense>
              </AuthLayout>
            }
          />

          {/* Specialist protected routes - MUST come before customer routes to avoid conflicts */}
          <Route
            path="/specialist/dashboard"
            element={
              <ProtectedRoute requiredUserType="specialist">
                <SpecialistLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <SpecialistDashboard />
                  </Suspense>
                </SpecialistLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialist/bookings"
            element={
              <ProtectedRoute requiredUserType="specialist">
                <SpecialistLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <SpecialistBookings />
                  </Suspense>
                </SpecialistLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialist/services"
            element={
              <ProtectedRoute requiredUserType="specialist">
                <SpecialistLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <SpecialistServices />
                  </Suspense>
                </SpecialistLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialist/profile"
            element={
              <ProtectedRoute requiredUserType="specialist">
                <SpecialistLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <SpecialistProfile />
                  </Suspense>
                </SpecialistLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialist/analytics"
            element={
              <ProtectedRoute requiredUserType="specialist">
                <SpecialistLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <SpecialistAnalytics />
                  </Suspense>
                </SpecialistLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialist/schedule"
            element={
              <ProtectedRoute requiredUserType="specialist">
                <SpecialistLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <SpecialistSchedule />
                  </Suspense>
                </SpecialistLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialist/earnings"
            element={
              <ProtectedRoute requiredUserType="specialist">
                <SpecialistLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <SpecialistEarnings />
                  </Suspense>
                </SpecialistLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialist/finances"
            element={
              <ProtectedRoute requiredUserType="specialist">
                <SpecialistLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <SpecialistFinances />
                  </Suspense>
                </SpecialistLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialist/reviews"
            element={
              <ProtectedRoute requiredUserType="specialist">
                <SpecialistLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <SpecialistReviews />
                  </Suspense>
                </SpecialistLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialist/loyalty"
            element={
              <ProtectedRoute requiredUserType="specialist">
                <SpecialistLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <SpecialistLoyalty />
                  </Suspense>
                </SpecialistLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialist/messages"
            element={
              <ProtectedRoute requiredUserType="specialist">
                <SpecialistLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <SpecialistMessages />
                  </Suspense>
                </SpecialistLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialist/settings"
            element={
              <ProtectedRoute requiredUserType="specialist">
                <SpecialistLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <SpecialistSettings />
                  </Suspense>
                </SpecialistLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialist/notifications"
            element={
              <ProtectedRoute requiredUserType="specialist">
                <SpecialistLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <SpecialistNotifications />
                  </Suspense>
                </SpecialistLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialist/referrals"
            element={
              <ProtectedRoute requiredUserType="specialist">
                <SpecialistLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <SpecialistReferrals />
                  </Suspense>
                </SpecialistLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialist/wallet"
            element={
              <ProtectedRoute requiredUserType="specialist">
                <SpecialistLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <SpecialistWallet />
                  </Suspense>
                </SpecialistLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialist/employees"
            element={
              <ProtectedRoute requiredUserType="specialist">
                <SpecialistLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <EmployeeManagement />
                  </Suspense>
                </SpecialistLayout>
              </ProtectedRoute>
            }
          />

          {/* Customer protected routes with /customer prefix */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerDashboard />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/messages"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerMessages />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/bookings"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerBookings />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerProfile />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/loyalty"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerLoyalty />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/favorites"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerFavorites />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/settings"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerSettings />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/support"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerHelpSupport />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          {/* Removed redundant customer history route (use /customer/bookings) */}
          <Route
            path="/customer/reviews"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <CustomerReviews />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/payments"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <PaymentMethods />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/notifications"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <CustomerNotificationsPlaceholder />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/referrals"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerReferrals />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/wallet"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerWallet />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />

          {/* Legacy customer routes without /customer prefix for backward compatibility */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerDashboard />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerBookings />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerProfile />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/loyalty"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerLoyalty />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerFavorites />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerSettings />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerHelpSupport />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <CustomerHistoryPlaceholder />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <CustomerReviews />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <PaymentMethods />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <Suspense fallback={<SuspenseLoader />}>
                    <CustomerWallet />
                  </Suspense>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          {/* Remove duplicate /search route - handled by public routes */}
          {/* Remove duplicate /book/:serviceId route - handled by public routes */}

          {/* Specialist routes already defined above - removing duplicates */}

          {/* Main application routes - ONLY for non-specialist/non-customer authenticated routes and public routes */}
          <Route path="/" element={
            <MainLayout>
              <Suspense fallback={<SuspenseLoader />}>
                <UserTypeRedirect />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/search" element={
            <ConditionalLayout>
              <Suspense fallback={<SuspenseLoader />}>
                <SearchPageRouter />
              </Suspense>
            </ConditionalLayout>
          } />
          <Route path="/service/:serviceId" element={
            <ConditionalLayout>
              <Suspense fallback={<SuspenseLoader />}>
                <ServiceDetailPage />
              </Suspense>
            </ConditionalLayout>
          } />
          <Route 
            path="/specialist/:specialistId" 
            element={
              <ConditionalLayout>
                <Suspense fallback={<SuspenseLoader />}>
                  <SpecialistProfilePage />
                </Suspense>
              </ConditionalLayout>
            } 
          />
          <Route path="/privacy" element={
            <MainLayout>
              <Suspense fallback={<SuspenseLoader />}>
                <PrivacyPage />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/terms" element={
            <MainLayout>
              <Suspense fallback={<SuspenseLoader />}>
                <TermsPage />
              </Suspense>
            </MainLayout>
          } />
          {/* Redirect old booking route to new one */}
          <Route path="/book/:serviceId" element={
            <BookingRouteRedirect />
          } />
          <Route path="/booking/:serviceId" element={
            <ConditionalLayout>
              <Suspense fallback={<SuspenseLoader />}>
                <BookingRouter />
              </Suspense>
            </ConditionalLayout>
          } />
          <Route path="/payment/:bookingId" element={
            <MainLayout>
              <Suspense fallback={<SuspenseLoader />}>
                <PaymentPage />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <MainLayout>
                <Suspense fallback={<SuspenseLoader />}>
                  <AdminDashboard />
                </Suspense>
              </MainLayout>
            </AdminRoute>
          } />

          {/* Auth redirects */}
          <Route
            path="/auth"
            element={
              isAuthenticated ? (
                <Navigate to={user?.userType === 'specialist' ? '/specialist/dashboard' : '/dashboard'} replace />
              ) : (
                <Navigate to="/auth/login" replace />
              )
            }
          />
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/register" element={<Navigate to="/auth/register" replace />} />

          {/* 404 page */}
          <Route path="*" element={
            <MainLayout>
              <Suspense fallback={<SuspenseLoader />}>
                <NotFoundPage />
              </Suspense>
            </MainLayout>
          } />
            </Routes>
          </div>
          {/* </SocketProvider> */}
        </CurrencyProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
