import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TelegramProvider } from '@/components/telegram/TelegramProvider';
import { TelegramThemeProvider } from '@/components/telegram/TelegramThemeProvider';
import { WebSocketProvider } from '@/components/common/WebSocketProvider';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';

// Pages
import { HomePage } from '@/pages/shared/HomePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { BookingFlow } from '@/pages/booking/BookingFlow';
import { BookingsPage } from '@/pages/customer/BookingsPage';
import { ProfilePage } from '@/pages/customer/ProfilePage';
import { ToastContainer } from '@/components/ui/Toast';
import { SearchPage } from '@/pages/shared/SearchPage';
import { ServiceDetailPage } from '@/pages/shared/ServiceDetailPage';
import { SpecialistProfilePage } from '@/pages/shared/SpecialistProfilePage';
import { MessagingPage } from '@/pages/shared/MessagingPage';
import { CommunityPage } from '@/pages/shared/CommunityPage';
import { AnalyticsPage } from '@/pages/customer/AnalyticsPage';
import { WalletPage } from '@/pages/customer/WalletPage';
import { FavoritesPage } from '@/pages/customer/FavoritesPage';
import { LoyaltyPage } from '@/pages/customer/LoyaltyPage';
import { SettingsPage } from '@/pages/customer/SettingsPage';
import { ReviewsPage } from '@/pages/customer/ReviewsPage';
import { SpecialistDashboardPage } from '@/pages/specialist/SpecialistDashboardPage';
import { SpecialistServicesPage } from '@/pages/specialist/SpecialistServicesPage';

// Phase 1: Notifications, Chat, Customer Dashboard
import { NotificationsPage } from '@/pages/customer/NotificationsPage';
import { ChatPage } from '@/pages/shared/ChatPage';
import { DashboardPage } from '@/pages/customer/DashboardPage';

// Phase 2: Specialist Business Management
import { SpecialistBookingsPage } from '@/pages/specialist/SpecialistBookingsPage';
import { SchedulePage } from '@/pages/specialist/SchedulePage';
import { EarningsPage } from '@/pages/specialist/EarningsPage';

// Phase 3: Community Enhancement + Payments
import { PostDetailPage } from '@/pages/shared/PostDetailPage';
import { CreatePostPage } from '@/pages/shared/CreatePostPage';
import { PaymentProcessingPage } from '@/pages/booking/PaymentProcessingPage';

// Phase 4: Specialist Profile & Analytics
import { SpecialistProfileEditPage } from '@/pages/specialist/SpecialistProfileEditPage';
import { SpecialistAnalyticsPage } from '@/pages/specialist/SpecialistAnalyticsPage';
import { SpecialistReviewsPage } from '@/pages/specialist/SpecialistReviewsPage';
import { ClientsPage } from '@/pages/specialist/ClientsPage';

// Phase 5: Settings, Help, Referrals
import { PaymentMethodsPage } from '@/pages/customer/PaymentMethodsPage';
import { HelpSupportPage } from '@/pages/shared/HelpSupportPage';
import { ReferralsPage } from '@/pages/customer/ReferralsPage';
import { SpecialistSettingsPage } from '@/pages/specialist/SpecialistSettingsPage';
import { SpecialistWalletPage } from '@/pages/specialist/SpecialistWalletPage';

// Phase 6: Specialist Onboarding
import { OnboardingPage } from '@/pages/specialist/OnboardingPage';

function App() {
  return (
    <TelegramThemeProvider>
      <TelegramProvider>
        <WebSocketProvider>
          <Router>
            <Routes>
              {/* Auth routes */}
              <Route path="/auth" element={<AuthLayout />}>
                <Route index element={<LoginPage />} />
              </Route>

              {/* Main app routes */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />

                {/* Public routes */}
                <Route path="/search" element={<SearchPage />} />
                <Route path="/service/:id" element={<ServiceDetailPage />} />
                <Route path="/specialist/:id" element={<SpecialistProfilePage />} />
                <Route path="/community" element={<CommunityPage />} />

                {/* Protected customer routes */}
                <Route
                  path="/bookings"
                  element={
                    <ProtectedRoute>
                      <BookingsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/booking"
                  element={
                    <ProtectedRoute>
                      <BookingFlow />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/favorites"
                  element={
                    <ProtectedRoute>
                      <FavoritesPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/wallet"
                  element={
                    <ProtectedRoute>
                      <WalletPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/loyalty"
                  element={
                    <ProtectedRoute>
                      <LoyaltyPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/reviews"
                  element={
                    <ProtectedRoute>
                      <ReviewsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <MessagingPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Specialist routes */}
                <Route
                  path="/specialist-dashboard"
                  element={
                    <ProtectedRoute>
                      <SpecialistDashboardPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/specialist-services"
                  element={
                    <ProtectedRoute>
                      <SpecialistServicesPage />
                    </ProtectedRoute>
                  }
                />

                {/* Phase 1: Notifications, Chat, Dashboard */}
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages/:conversationId"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Phase 2: Specialist Business Management */}
                <Route
                  path="/specialist-bookings"
                  element={
                    <ProtectedRoute>
                      <SpecialistBookingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/schedule"
                  element={
                    <ProtectedRoute>
                      <SchedulePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/earnings"
                  element={
                    <ProtectedRoute>
                      <EarningsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Phase 3: Community + Payments */}
                <Route path="/community/post/:id" element={<PostDetailPage />} />
                <Route
                  path="/community/create"
                  element={
                    <ProtectedRoute>
                      <CreatePostPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment/:bookingId"
                  element={
                    <ProtectedRoute>
                      <PaymentProcessingPage />
                    </ProtectedRoute>
                  }
                />

                {/* Phase 4: Specialist Profile & Analytics */}
                <Route
                  path="/specialist/profile/edit"
                  element={
                    <ProtectedRoute>
                      <SpecialistProfileEditPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/analytics"
                  element={
                    <ProtectedRoute>
                      <SpecialistAnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/reviews"
                  element={
                    <ProtectedRoute>
                      <SpecialistReviewsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/clients"
                  element={
                    <ProtectedRoute>
                      <ClientsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Phase 5: Settings, Help, Referrals */}
                <Route
                  path="/payment-methods"
                  element={
                    <ProtectedRoute>
                      <PaymentMethodsPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/help" element={<HelpSupportPage />} />
                <Route
                  path="/referrals"
                  element={
                    <ProtectedRoute>
                      <ReferralsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/settings"
                  element={
                    <ProtectedRoute>
                      <SpecialistSettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/wallet"
                  element={
                    <ProtectedRoute>
                      <SpecialistWalletPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/specialist/referrals"
                  element={
                    <ProtectedRoute>
                      <ReferralsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Phase 6: Specialist Onboarding */}
                <Route
                  path="/specialist/onboarding"
                  element={
                    <ProtectedRoute>
                      <OnboardingPage />
                    </ProtectedRoute>
                  }
                />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Router>
        </WebSocketProvider>
        <ToastContainer />
      </TelegramProvider>
    </TelegramThemeProvider>
  );
}

export default App;
