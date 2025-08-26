import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { getCurrentUser, selectIsAuthenticated, selectUser } from './store/slices/authSlice';
import { getAuthToken } from './services/api';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
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

// Specialist pages
const SpecialistDashboard = React.lazy(() => import('./pages/specialist/Dashboard'));
const SpecialistBookings = React.lazy(() => import('./pages/specialist/Bookings'));
const SpecialistServices = React.lazy(() => import('./pages/specialist/Services'));
const SpecialistProfile = React.lazy(() => import('./pages/specialist/Profile'));
const SpecialistAnalytics = React.lazy(() => import('./pages/specialist/Analytics'));
const SpecialistSchedule = React.lazy(() => import('./pages/specialist/Schedule'));
const SpecialistEarnings = React.lazy(() => import('./pages/specialist/Earnings'));
const SpecialistReviews = React.lazy(() => import('./pages/specialist/Reviews'));
const SpecialistMessages = React.lazy(() => import('./pages/specialist/Messages'));
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

// Loading component for Suspense
const SuspenseLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

// Page title updater hook
const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'МійЗапис - Professional Service Booking Platform',
      '/search': 'Search Services - МійЗапис',
      '/login': 'Sign In - МійЗапис',
      '/register': 'Sign Up - МійЗапис',
      '/dashboard': 'Dashboard - МійЗапис',
      '/bookings': 'My Bookings - МійЗапис',
      '/profile': 'My Profile - МійЗапис',
      '/specialist/dashboard': 'Specialist Dashboard - МійЗапис',
      '/specialist/bookings': 'Manage Bookings - МійЗапис',
      '/specialist/services': 'Manage Services - МійЗапис',
      '/specialist/analytics': 'Analytics - МійЗапис',
      '/specialist/schedule': 'Schedule - МійЗапис',
      '/specialist/earnings': 'Earnings - МійЗапис',
      '/specialist/reviews': 'Reviews - МійЗапис',
      '/specialist/messages': 'Messages - МійЗапис',
      '/specialist/settings': 'Settings - МійЗапис',
      '/specialist/notifications': 'Notifications - МійЗапис',
      '/admin/dashboard': 'Admin Dashboard - МійЗапис',
    };

    const title = titles[location.pathname] || 'МійЗапис';
    document.title = title;

    // Update meta description based on page
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      const descriptions: Record<string, string> = {
        '/': 'Book professional services easily with МійЗапис. Find trusted specialists, schedule appointments, and manage your bookings all in one place.',
        '/search': 'Search and discover professional services near you. Compare specialists, read reviews, and book appointments instantly.',
        '/specialist/dashboard': 'Manage your specialist business with МійЗапис. Track bookings, analyze performance, and grow your client base.',
      };
      metaDescription.setAttribute('content', descriptions[location.pathname] || 'МійЗапис - Professional Service Booking Platform');
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

          {/* Customer protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <CustomerDashboard />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <CustomerBookings />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <CustomerProfile />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/loyalty"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <CustomerLoyalty />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <CustomerFavorites />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <CustomerSettings />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <CustomerHelpSupport />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Booking History</h1>
                    <p className="text-gray-600 mt-2">View your past bookings and service history</p>
                  </div>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews"
            element={
              <ProtectedRoute requiredUserType="customer">
                <CustomerLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">My Reviews</h1>
                    <p className="text-gray-600 mt-2">Manage your reviews and ratings</p>
                  </div>
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
          <Route path="/book/:serviceId" element={
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