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
