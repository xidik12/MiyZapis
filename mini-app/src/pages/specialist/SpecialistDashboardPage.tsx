import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/redux';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { Button } from '@/components/ui/Button';

interface SpecialistStats {
  totalBookings: number;
  monthlyBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  rating: number;
  reviewCount: number;
  completionRate: number;
  responseTime: number;
}

interface RecentBooking {
  id: string;
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'completed';
  amount: number;
}

export const SpecialistDashboardPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState<SpecialistStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const { webApp } = useTelegramWebApp();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API calls
      const mockStats: SpecialistStats = {
        totalBookings: 342,
        monthlyBookings: 28,
        totalRevenue: 125600,
        monthlyRevenue: 18400,
        rating: 4.9,
        reviewCount: 127,
        completionRate: 98,
        responseTime: 12
      };

      const mockBookings: RecentBooking[] = [
        {
          id: '1',
          customerName: 'Elena P.',
          serviceName: 'Psychology Consultation',
          date: '2025-08-18',
          time: '14:00',
          status: 'confirmed',
          amount: 800
        },
        {
          id: '2',
          customerName: 'Maxim K.',
          serviceName: 'Individual Therapy',
          date: '2025-08-18',
          time: '16:30',
          status: 'pending',
          amount: 1200
        },
        {
          id: '3',
          customerName: 'Anna S.',
          serviceName: 'Family Consultation',
          date: '2025-08-19',
          time: '10:00',
          status: 'confirmed',
          amount: 1500
        }
      ];

      setStats(mockStats);
      setRecentBookings(mockBookings);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      webApp?.showAlert('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-secondary p-8">
        <p>Unable to load dashboard data</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary">
          Welcome back, {user?.firstName || 'Specialist'}!
        </h1>
        <p className="text-secondary">Here's your business overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.totalBookings}</div>
          <div className="text-sm text-secondary">Total Bookings</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">${stats.totalRevenue}</div>
          <div className="text-sm text-secondary">Total Revenue</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.rating}</div>
          <div className="text-sm text-secondary">Rating ({stats.reviewCount} reviews)</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.completionRate}%</div>
          <div className="text-sm text-secondary">Completion Rate</div>
        </Card>
      </div>

      {/* Monthly Performance */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">This Month</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-primary">{stats.monthlyBookings}</div>
            <div className="text-sm text-secondary">Bookings</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-primary">${stats.monthlyRevenue}</div>
            <div className="text-sm text-secondary">Revenue</div>
          </div>
        </div>
      </Card>

      {/* Recent Bookings */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Bookings</h3>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        
        <div className="space-y-3">
          {recentBookings.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{booking.customerName}</div>
                <div className="text-sm text-secondary">{booking.serviceName}</div>
                <div className="text-xs text-secondary">
                  {new Date(booking.date).toLocaleDateString()} at {booking.time}
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold">${booking.amount}</div>
                <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-12">
            📅 Schedule
          </Button>
          <Button variant="outline" className="h-12">
            💰 Earnings
          </Button>
          <Button variant="outline" className="h-12">
            📊 Analytics
          </Button>
          <Button variant="outline" className="h-12">
            ⭐ Reviews
          </Button>
        </div>
      </Card>

      {/* Performance Insights */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Performance</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-secondary">Response Time</span>
            <span className="font-medium">{stats.responseTime} min</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondary">Completion Rate</span>
            <span className="font-medium text-green-600">{stats.completionRate}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondary">Average Rating</span>
            <div className="flex items-center">
              <span className="font-medium mr-1">{stats.rating}</span>
              <span className="text-yellow-500">⭐</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};