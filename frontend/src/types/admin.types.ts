// Admin Analytics Type Definitions
// Maps backend response structures to TypeScript interfaces

// ============================================================================
// PERIOD & FILTER TYPES
// ============================================================================

export type Period = '7d' | '30d' | '90d' | '1y';

export type UserType = 'CUSTOMER' | 'SPECIALIST' | 'ADMIN';

export type BookingStatus =
  | 'PENDING'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethodType =
  | 'card'
  | 'telegram_payment'
  | 'crypto'
  | 'wallet';

export type PaymentType =
  | 'DEPOSIT'
  | 'FULL_PAYMENT'
  | 'REFUND'
  | 'LOYALTY_REDEMPTION'
  | 'SUBSCRIPTION';

// ============================================================================
// DASHBOARD STATS TYPES (GET /admin/dashboard/stats)
// ============================================================================

export interface DashboardOverview {
  totalUsers: number;
  totalSpecialists: number;
  totalServices: number;
  totalBookings: number;
  totalRevenue: number;
  activeUsers: number;
  completedBookings: number;
  conversionRate: number;
}

export interface GrowthMetric {
  current: number;
  previous: number;
  growthRate: number;
}

export interface DashboardGrowth {
  newUsers: GrowthMetric;
  newBookings: GrowthMetric;
  revenue: GrowthMetric;
}

export interface RecentBooking {
  id: string;
  status: BookingStatus;
  totalAmount: number;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  specialist: {
    firstName: string;
    lastName: string;
    specialist: {
      businessName: string;
    } | null;
  };
  service: {
    name: string;
  };
}

export interface RecentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: UserType;
  createdAt: string;
  isActive: boolean;
}

export interface DashboardRecentActivity {
  bookings: RecentBooking[];
  users: RecentUser[];
}

export interface CategoryStat {
  category: string;
  _count: { id: number };
  _avg: { basePrice: number | null };
}

export interface TopSpecialist {
  id: string;
  name: string;
  email: string;
  businessName: string;
  rating: number;
  reviewCount: number;
  servicesCount: number;
  isVerified: boolean;
}

export interface DashboardAnalytics {
  categoryStats: CategoryStat[];
  topSpecialists: TopSpecialist[];
}

export interface DashboardStats {
  overview: DashboardOverview;
  growth: DashboardGrowth;
  recentActivity: DashboardRecentActivity;
  analytics: DashboardAnalytics;
}

// ============================================================================
// USER ANALYTICS TYPES (GET /admin/analytics/users)
// ============================================================================

export interface UserTrend {
  date: string;
  user_type: UserType;
  count: number;
}

export interface EngagementStat {
  userType: UserType;
  _count: { id: number };
}

export interface GeographicStat {
  timezone: string | null;
  _count: { id: number };
}

export interface PlatformStat {
  platform: string;
  count: number;
}

export interface UserAnalytics {
  userTrends: UserTrend[];
  engagementStats: EngagementStat[];
  geographicStats: GeographicStat[];
  platformStats: PlatformStat[];
}

// ============================================================================
// BOOKING ANALYTICS TYPES (GET /admin/analytics/bookings)
// ============================================================================

export interface BookingStatusStat {
  status: BookingStatus;
  _count: { id: number };
  _sum: { totalAmount: number | null };
}

export interface BookingTrend {
  date: string;
  status: BookingStatus;
  count: number;
  avg_amount: number | null;
}

export interface PopularService {
  serviceId: string;
  _count: { id: number };
  service: {
    id: string;
    name: string;
    category: string;
    basePrice: number;
    currency: string;
  } | null;
}

export interface HourlyStat {
  hour: number;
  count: number;
}

export interface CategoryRevenue {
  category: string;
  booking_count: number;
  avg_amount: number;
  total_revenue: number;
}

export interface BookingAnalytics {
  statusStats: BookingStatusStat[];
  bookingTrends: BookingTrend[];
  popularServices: PopularService[];
  hourlyStats: HourlyStat[];
  categoryRevenue: CategoryRevenue[];
}

// ============================================================================
// FINANCIAL ANALYTICS TYPES (GET /admin/analytics/financial)
// ============================================================================

export interface RevenueTrend {
  date: string;
  type: PaymentType;
  total_amount: number;
  transaction_count: number;
}

export interface PaymentMethodStat {
  paymentMethodType: PaymentMethodType | null;
  _count: { id: number };
  _sum: { amount: number | null };
}

export interface CurrencyStat {
  currency: string;
  _count: { id: number };
  _sum: { amount: number | null };
}

export interface TopEarningSpecialist {
  id: string;
  business_name: string;
  first_name: string;
  last_name: string;
  email: string;
  total_earnings: number;
  transaction_count: number;
  avg_transaction: number;
}

export interface RefundStats {
  _count: { id: number };
  _sum: { amount: number | null };
  refundRate: number;
}

export interface FinancialAnalytics {
  revenueTrends: RevenueTrend[];
  paymentMethodStats: PaymentMethodStat[];
  currencyStats: CurrencyStat[];
  topEarningSpecialists: TopEarningSpecialist[];
  refundStats: RefundStats;
}

// ============================================================================
// REFERRAL ANALYTICS TYPES (GET /admin/analytics/referrals)
// ============================================================================

export interface ReferralAnalytics {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  expiredReferrals: number;
  totalPointsAwarded: number;
  conversionRate: number;
  topReferrers: Array<{
    userId: string;
    userName: string;
    referralCount: number;
    completedCount: number;
    pointsEarned: number;
  }>;
  referralsByType: Array<{
    type: string;
    count: number;
  }>;
}

// ============================================================================
// SYSTEM HEALTH TYPES (GET /admin/system/health)
// ============================================================================

export type HealthStatus = 'healthy' | 'degraded' | 'down';

export interface DatabaseHealth {
  status: HealthStatus;
  latency?: number;
  connections?: {
    active: number;
    idle: number;
    total: number;
  };
}

export interface RedisHealth {
  status: HealthStatus;
  latency?: number;
  memoryUsed?: number;
  memoryTotal?: number;
}

export interface SystemMetrics {
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu?: {
    usage: number;
  };
}

export interface AppMetrics {
  activeConnections: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface SystemHealth {
  overall: HealthStatus;
  database: DatabaseHealth;
  redis?: RedisHealth;
  system: SystemMetrics;
  app: AppMetrics;
  timestamp: string;
}

// ============================================================================
// CONTENT ANALYTICS TYPES (Aggregated from posts/comments)
// ============================================================================

export interface PostMetrics {
  totalPosts: number;
  totalDiscussions: number;
  totalMarketplace: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  avgEngagementRate: number;
}

export interface PostTrend {
  date: string;
  discussions: number;
  marketplace: number;
  totalViews: number;
  totalEngagement: number;
}

export interface TopPost {
  id: string;
  title: string;
  type: 'DISCUSSION' | 'SALE';
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ContentAnalytics {
  metrics: PostMetrics;
  trends: PostTrend[];
  topPosts: TopPost[];
  engagementByType: Array<{
    type: 'DISCUSSION' | 'SALE';
    avgViews: number;
    avgLikes: number;
    avgComments: number;
  }>;
}

// ============================================================================
// TRAFFIC ANALYTICS TYPES (Profile views + referrals)
// ============================================================================

export interface ProfileViewTrend {
  date: string;
  totalViews: number;
  uniqueViews: number;
  authenticatedViews: number;
  anonymousViews: number;
}

export interface TrafficSource {
  referrer: string | null;
  count: number;
  percentage: number;
}

export interface TrafficAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  viewTrends: ProfileViewTrend[];
  trafficSources: TrafficSource[];
  topViewedProfiles: Array<{
    specialistId: string;
    businessName: string;
    viewCount: number;
    uniqueViewers: number;
  }>;
  referralMetrics: {
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
  };
}

// ============================================================================
// COMBINED DASHBOARD DATA TYPE
// ============================================================================

export interface AdminDashboardData {
  stats: DashboardStats | null;
  userAnalytics: UserAnalytics | null;
  bookingAnalytics: BookingAnalytics | null;
  financialAnalytics: FinancialAnalytics | null;
  contentAnalytics: ContentAnalytics | null;
  trafficAnalytics: TrafficAnalytics | null;
  systemHealth: SystemHealth | null;
  referralAnalytics: ReferralAnalytics | null;
}

// ============================================================================
// USER MANAGEMENT TYPES
// ============================================================================

export type UserManagementAction = 'activate' | 'deactivate' | 'delete';

export interface UserManagementRequest {
  action: UserManagementAction;
  userIds: string[];
}

export interface UserManagementResponse {
  success: boolean;
  affectedCount: number;
  message: string;
}

// ============================================================================
// API RESPONSE WRAPPER TYPES
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// CHART DATA TYPES (Transformed for Recharts)
// ============================================================================

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface MultiSeriesChartData {
  name: string;
  [key: string]: string | number;
}

export interface PieChartData {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

// ============================================================================
// FILTER STATE TYPES
// ============================================================================

export interface AdminFilters {
  period: Period;
  userType?: UserType;
  dateRange?: {
    from: Date;
    to: Date;
  };
  searchQuery?: string;
  status?: BookingStatus;
}
