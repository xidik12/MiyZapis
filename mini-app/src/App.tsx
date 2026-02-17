import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TelegramProvider } from '@/components/telegram/TelegramProvider';
import { TelegramThemeProvider } from '@/components/telegram/TelegramThemeProvider';
import { WebSocketProvider } from '@/components/common/WebSocketProvider';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { PageErrorBoundary } from '@/components/common/PageErrorBoundary';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <LoadingSpinner size="lg" />
  </div>
);

// Helper for lazy loading named exports
const lazy = <T extends React.ComponentType<any>>(
  factory: () => Promise<{ [key: string]: T }>,
  name: string
) => React.lazy(() => factory().then(m => ({ default: (m as any)[name] })));

// Pages — lazy loaded
const HomePage = lazy(() => import('@/pages/shared/HomePage'), 'HomePage');
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'), 'LoginPage');
const BookingFlow = lazy(() => import('@/pages/booking/BookingFlow'), 'BookingFlow');
const BookingsPage = lazy(() => import('@/pages/customer/BookingsPage'), 'BookingsPage');
const ProfilePage = lazy(() => import('@/pages/customer/ProfilePage'), 'ProfilePage');
const SearchPage = lazy(() => import('@/pages/shared/SearchPage'), 'SearchPage');
const ServiceDetailPage = lazy(() => import('@/pages/shared/ServiceDetailPage'), 'ServiceDetailPage');
const SpecialistProfilePage = lazy(() => import('@/pages/shared/SpecialistProfilePage'), 'SpecialistProfilePage');
const MessagingPage = lazy(() => import('@/pages/shared/MessagingPage'), 'MessagingPage');
const CommunityPage = lazy(() => import('@/pages/shared/CommunityPage'), 'CommunityPage');
const AnalyticsPage = lazy(() => import('@/pages/customer/AnalyticsPage'), 'AnalyticsPage');
const WalletPage = lazy(() => import('@/pages/customer/WalletPage'), 'WalletPage');
const FavoritesPage = lazy(() => import('@/pages/customer/FavoritesPage'), 'FavoritesPage');
const LoyaltyPage = lazy(() => import('@/pages/customer/LoyaltyPage'), 'LoyaltyPage');
const SettingsPage = lazy(() => import('@/pages/customer/SettingsPage'), 'SettingsPage');
const ReviewsPage = lazy(() => import('@/pages/customer/ReviewsPage'), 'ReviewsPage');
const SpecialistDashboardPage = lazy(() => import('@/pages/specialist/SpecialistDashboardPage'), 'SpecialistDashboardPage');
const SpecialistServicesPage = lazy(() => import('@/pages/specialist/SpecialistServicesPage'), 'SpecialistServicesPage');

// Phase 1: Notifications, Chat, Customer Dashboard
const NotificationsPage = lazy(() => import('@/pages/customer/NotificationsPage'), 'NotificationsPage');
const ChatPage = lazy(() => import('@/pages/shared/ChatPage'), 'ChatPage');
const DashboardPage = lazy(() => import('@/pages/customer/DashboardPage'), 'DashboardPage');

// Phase 2: Specialist Business Management
const SpecialistBookingsPage = lazy(() => import('@/pages/specialist/SpecialistBookingsPage'), 'SpecialistBookingsPage');
const SchedulePage = lazy(() => import('@/pages/specialist/SchedulePage'), 'SchedulePage');
const EarningsPage = lazy(() => import('@/pages/specialist/EarningsPage'), 'EarningsPage');

// Phase 3: Community Enhancement + Payments
const PostDetailPage = lazy(() => import('@/pages/shared/PostDetailPage'), 'PostDetailPage');
const CreatePostPage = lazy(() => import('@/pages/shared/CreatePostPage'), 'CreatePostPage');
const PaymentProcessingPage = lazy(() => import('@/pages/booking/PaymentProcessingPage'), 'PaymentProcessingPage');

// Phase 4: Specialist Profile & Analytics
const SpecialistProfileEditPage = lazy(() => import('@/pages/specialist/SpecialistProfileEditPage'), 'SpecialistProfileEditPage');
const SpecialistAnalyticsPage = lazy(() => import('@/pages/specialist/SpecialistAnalyticsPage'), 'SpecialistAnalyticsPage');
const SpecialistReviewsPage = lazy(() => import('@/pages/specialist/SpecialistReviewsPage'), 'SpecialistReviewsPage');
const ClientsPage = lazy(() => import('@/pages/specialist/ClientsPage'), 'ClientsPage');

// Phase 5: Settings, Help, Referrals
const PaymentMethodsPage = lazy(() => import('@/pages/customer/PaymentMethodsPage'), 'PaymentMethodsPage');
const HelpSupportPage = lazy(() => import('@/pages/shared/HelpSupportPage'), 'HelpSupportPage');
const ReferralsPage = lazy(() => import('@/pages/customer/ReferralsPage'), 'ReferralsPage');
const SpecialistSettingsPage = lazy(() => import('@/pages/specialist/SpecialistSettingsPage'), 'SpecialistSettingsPage');
const SpecialistWalletPage = lazy(() => import('@/pages/specialist/SpecialistWalletPage'), 'SpecialistWalletPage');

// Phase 6: Specialist Onboarding
const OnboardingPage = lazy(() => import('@/pages/specialist/OnboardingPage'), 'OnboardingPage');

// Wraps lazy page with Suspense + per-page error boundary
const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  </PageErrorBoundary>
);

function App() {
  return (
    <TelegramThemeProvider>
      <TelegramProvider>
        <WebSocketProvider>
          <Router>
            <ErrorBoundary>
            <Routes>
              {/* Auth routes */}
              <Route path="/auth" element={<AuthLayout />}>
                <Route index element={<Page><LoginPage /></Page>} />
              </Route>

              {/* Main app routes */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Page><HomePage /></Page>} />

                {/* Public routes */}
                <Route path="/search" element={<Page><SearchPage /></Page>} />
                <Route path="/service/:id" element={<Page><ServiceDetailPage /></Page>} />
                <Route path="/specialist/:id" element={<Page><SpecialistProfilePage /></Page>} />
                <Route path="/community" element={<Page><CommunityPage /></Page>} />

                {/* Protected customer routes */}
                <Route
                  path="/bookings"
                  element={
                    <ProtectedRoute>
                      <Page><BookingsPage /></Page>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/booking"
                  element={
                    <ProtectedRoute>
                      <Page><BookingFlow /></Page>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/favorites"
                  element={
                    <ProtectedRoute>
                      <Page><FavoritesPage /></Page>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/wallet"
                  element={
                    <ProtectedRoute>
                      <Page><WalletPage /></Page>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/loyalty"
                  element={
                    <ProtectedRoute>
                      <Page><LoyaltyPage /></Page>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/reviews"
                  element={
                    <ProtectedRoute>
                      <Page><ReviewsPage /></Page>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Page><ProfilePage /></Page>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Page><SettingsPage /></Page>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <Page><MessagingPage /></Page>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <Page><AnalyticsPage /></Page>
                    </ProtectedRoute>
                  }
                />

                {/* Specialist routes — require specialist role */}
                <Route
                  path="/specialist-dashboard"
                  element={
                    <ProtectedRoute requiredRole="specialist">
                      <Page><SpecialistDashboardPage /></Page>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/specialist-services"
                  element={
                    <ProtectedRoute requiredRole="specialist">
                      <Page><SpecialistServicesPage /></Page>
                    </ProtectedRoute>
                  }
                />

                {/* Phase 1: Notifications, Chat, Dashboard */}
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Page><NotificationsPage /></Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages/:conversationId"
                  element={
                    <ProtectedRoute>
                      <Page><ChatPage /></Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Page><DashboardPage /></Page>
                    </ProtectedRoute>
                  }
                />

                {/* Phase 2: Specialist Business Management */}
                <Route
                  path="/specialist-bookings"
                  element={
                    <ProtectedRoute requiredRole="specialist">
                      <Page><SpecialistBookingsPage /></Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/schedule"
                  element={
                    <ProtectedRoute requiredRole="specialist">
                      <Page><SchedulePage /></Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/earnings"
                  element={
                    <ProtectedRoute requiredRole="specialist">
                      <Page><EarningsPage /></Page>
                    </ProtectedRoute>
                  }
                />

                {/* Phase 3: Community + Payments */}
                <Route path="/community/post/:id" element={<Page><PostDetailPage /></Page>} />
                <Route
                  path="/community/create"
                  element={
                    <ProtectedRoute>
                      <Page><CreatePostPage /></Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/community/edit/:postId"
                  element={
                    <ProtectedRoute>
                      <Page><CreatePostPage /></Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment/:bookingId"
                  element={
                    <ProtectedRoute>
                      <Page><PaymentProcessingPage /></Page>
                    </ProtectedRoute>
                  }
                />

                {/* Phase 4: Specialist Profile & Analytics */}
                <Route
                  path="/specialist/profile/edit"
                  element={
                    <ProtectedRoute requiredRole="specialist">
                      <Page><SpecialistProfileEditPage /></Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/analytics"
                  element={
                    <ProtectedRoute requiredRole="specialist">
                      <Page><SpecialistAnalyticsPage /></Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/reviews"
                  element={
                    <ProtectedRoute requiredRole="specialist">
                      <Page><SpecialistReviewsPage /></Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/clients"
                  element={
                    <ProtectedRoute requiredRole="specialist">
                      <Page><ClientsPage /></Page>
                    </ProtectedRoute>
                  }
                />

                {/* Phase 5: Settings, Help, Referrals */}
                <Route
                  path="/payment-methods"
                  element={
                    <ProtectedRoute>
                      <Page><PaymentMethodsPage /></Page>
                    </ProtectedRoute>
                  }
                />
                <Route path="/help" element={<Page><HelpSupportPage /></Page>} />
                <Route
                  path="/referrals"
                  element={
                    <ProtectedRoute>
                      <Page><ReferralsPage /></Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/settings"
                  element={
                    <ProtectedRoute requiredRole="specialist">
                      <Page><SpecialistSettingsPage /></Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/notifications"
                  element={
                    <ProtectedRoute requiredRole="specialist">
                      <Page><NotificationsPage /></Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/wallet"
                  element={
                    <ProtectedRoute requiredRole="specialist">
                      <Page><SpecialistWalletPage /></Page>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/referrals"
                  element={
                    <ProtectedRoute requiredRole="specialist">
                      <Page><ReferralsPage /></Page>
                    </ProtectedRoute>
                  }
                />

                {/* Phase 6: Specialist Onboarding */}
                <Route
                  path="/specialist/onboarding"
                  element={
                    <ProtectedRoute requiredRole="specialist">
                      <Page><OnboardingPage /></Page>
                    </ProtectedRoute>
                  }
                />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
            </ErrorBoundary>
          </Router>
        </WebSocketProvider>
        <ToastContainer />
      </TelegramProvider>
    </TelegramThemeProvider>
  );
}

export default App;
