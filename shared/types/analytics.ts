// ============================================================
// Analytics Types — From frontend/src/types/index.ts
// ============================================================

export interface SpecialistAnalytics {
  overview: {
    totalRevenue: number;
    thisMonthRevenue: number;
    totalBookings: number;
    thisMonthBookings: number;
    averageRating: number;
    responseRate: number;
    growthRate: number;
  };
  revenueChart: Array<{
    period: string;
    revenue: number;
    bookings: number;
  }>;
  topServices: Array<{
    serviceId: string;
    serviceName: string;
    bookings: number;
    revenue: number;
  }>;
  customerSatisfaction: {
    averageRating: number;
    responseRate: number;
    repeatCustomers: number;
    reviewCount: number;
  };
  bookingTrends: Array<{
    date: string;
    bookings: number;
    revenue: number;
  }>;
}

export interface PlatformAnalytics {
  users: {
    total: number;
    customers: number;
    specialists: number;
    growth: {
      thisMonth: number;
      lastMonth: number;
      percentage: number;
    };
  };
  bookings: {
    total: number;
    thisMonth: number;
    completionRate: number;
    averageValue: number;
    growth: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    commissionEarned: number;
    growth: number;
  };
}
