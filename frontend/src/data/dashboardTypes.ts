// Dashboard data interfaces and types
// All data now comes from backend API via services

export interface BookingStatus {
  confirmed: string;
  pending: string;
  cancelled: string;
  completed: string;
  inProgress: string;
  noShow: string;
}

export interface Booking {
  id: string;
  customerName?: string;
  specialistName?: string;
  serviceName: string;
  date: string;
  time: string;
  status: keyof BookingStatus;
  amount: number;
  currency: string;
  duration: string;
  type: 'online' | 'offline';
  avatar?: string;
  customerAvatar?: string;
  specialistAvatar?: string;
  location?: string;
  notes?: string;
}

export interface SpecialistStats {
  totalBookings: number;
  monthlyBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  rating: number;
  reviewCount: number;
  responseTime: number; // in minutes
  completionRate: number;
  profileViews: number;
  favoriteCount: number;
  conversionRate: number;
  repeatClients: number;
  punctuality: number;
}

export interface CustomerStats {
  totalBookings: number;
  completedBookings: number;
  upcomingBookings: number;
  totalSpent: number;
  monthlySpent: number;
  favoriteSpecialists: number;
  loyaltyPoints: number;
  reviewsWritten: number;
  averageRating: number;
  membershipLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  savingsFromOffers: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  bookings: number;
}

export interface ServicePopularity {
  name: string;
  bookings: number;
  revenue: number;
}

export interface CustomerSegment {
  name: string;
  bookings: number;
  spent: number;
}

// Note: All mock data has been removed. 
// Data is now fetched from backend API using the respective services:
// - analyticsService for dashboard metrics
// - bookingService for booking data
// - userService for user stats
// - specialistService for specialist data
// - notificationService for notifications
// - messagingService for messages
