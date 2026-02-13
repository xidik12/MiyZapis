import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  MapPin,
  Star,
  Clock,
  TrendingUp,
  Calendar,
  Heart,
  Filter,
  Wallet,
  Award,
  Users,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState, AppDispatch } from '@/store';
import { fetchServicesAsync, fetchCategoriesAsync } from '@/store/slices/servicesSlice';
import { fetchSpecialistsAsync } from '@/store/slices/specialistsSlice';

// Mock data - replace with actual API calls
const categories = [
  { id: '1', name: 'Beauty', icon: '💄', color: '#F59E0B', count: 45 },
  { id: '2', name: 'Wellness', icon: '🧘', color: '#10B981', count: 32 },
  { id: '3', name: 'Fitness', icon: '💪', color: '#EF4444', count: 28 },
  { id: '4', name: 'Health', icon: '🏥', color: '#3B82F6', count: 51 },
  { id: '5', name: 'Education', icon: '📚', color: '#8B5CF6', count: 23 },
  { id: '6', name: 'Repair', icon: '🔧', color: '#F97316', count: 19 }
];

const popularServices = [
  {
    id: '1',
    name: 'Hair Styling & Color',
    specialist: 'Sarah Johnson',
    rating: 4.9,
    reviews: 127,
    price: 85,
    duration: 120,
    image: '/api/placeholder/300/200',
    category: 'Beauty'
  },
  {
    id: '2',
    name: 'Deep Tissue Massage',
    specialist: 'Michael Chen',
    rating: 4.8,
    reviews: 89,
    price: 120,
    duration: 60,
    image: '/api/placeholder/300/200',
    category: 'Wellness'
  },
  {
    id: '3',
    name: 'Personal Training',
    specialist: 'Emma Rodriguez',
    rating: 4.9,
    reviews: 203,
    price: 75,
    duration: 45,
    image: '/api/placeholder/300/200',
    category: 'Fitness'
  }
];

const nearbySpecialists = [
  {
    id: '1',
    name: 'Beauty Studio Downtown',
    specialist: 'Lisa Park',
    rating: 4.7,
    distance: '0.3 km',
    specialties: ['Hair', 'Nails', 'Makeup'],
    image: '/api/placeholder/100/100',
    isOnline: true
  },
  {
    id: '2',
    name: 'Zen Wellness Center',
    specialist: 'David Kumar',
    rating: 4.8,
    distance: '0.8 km',
    specialties: ['Massage', 'Yoga', 'Meditation'],
    image: '/api/placeholder/100/100',
    isOnline: false
  }
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, hapticFeedback } = useTelegram();
  const [searchQuery, setSearchQuery] = useState('');

  const { services, categories: apiCategories, isLoading } = useSelector(
    (state: RootState) => state.services
  );
  const { specialists } = useSelector((state: RootState) => state.specialists);
  const { isAuthenticated: authState } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Fetch initial data
    dispatch(fetchCategoriesAsync());
    dispatch(fetchServicesAsync({ limit: 6, sort: 'popular' }));
    dispatch(fetchSpecialistsAsync({ limit: 4 }));
  }, [dispatch]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/search');
    }
    hapticFeedback.impactLight();
  };

  const handleCategoryPress = (category: any) => {
    navigate(`/search?category=${encodeURIComponent(category.name)}`);
    hapticFeedback.selectionChanged();
  };

  const handleServicePress = (service: any) => {
    navigate(`/service/${service.id}`);
    hapticFeedback.impactLight();
  };

  const handleSpecialistPress = (specialist: any) => {
    navigate(`/specialist/${specialist.id}`);
    hapticFeedback.impactLight();
  };

  const handleBookNowPress = () => {
    if (!isAuthenticated && !authState) {
      navigate('/auth');
    } else {
      navigate('/booking');
    }
    hapticFeedback.impactMedium();
  };

  // Use API data if available, fallback to mock data
  const displayCategories = apiCategories.length > 0 ? apiCategories : categories;
  const displayServices = services.length > 0 ? services : popularServices;
  const displaySpecialists = specialists.length > 0 ? specialists : nearbySpecialists;

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header
        title={user ? `Hi, ${user.firstName}!` : 'Welcome'}
        subtitle="Find your perfect service"
        rightContent={
          <button
            onClick={() => navigate('/search')}
            className="p-2 touch-manipulation"
          >
            <Filter size={20} className="text-text-secondary" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Search Bar */}
        <div className="px-4 py-3 bg-bg-card">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search services, specialists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={18} />}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} size="md">
              <Search size={18} />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        {(isAuthenticated || authState) && (
          <div className="px-4 py-4">
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: <Calendar size={20} className="text-accent-primary" />, label: 'Bookings', path: '/bookings' },
                { icon: <Wallet size={20} className="text-accent-green" />, label: 'Wallet', path: '/wallet' },
                { icon: <Heart size={20} className="text-accent-red" />, label: 'Favorites', path: '/favorites' },
                { icon: <Award size={20} className="text-purple-500" />, label: 'Rewards', path: '/loyalty' },
              ].map(item => (
                <button
                  key={item.path}
                  onClick={() => { hapticFeedback.selectionChanged(); navigate(item.path); }}
                  className="flex flex-col items-center gap-1 py-3 rounded-xl bg-bg-secondary hover:bg-bg-hover transition-colors"
                >
                  {item.icon}
                  <span className="text-xs text-text-primary font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Community Banner */}
        <div className="px-4 pb-2">
          <Card hover onClick={() => { hapticFeedback.impactLight(); navigate('/community'); }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-text-primary">Community</h3>
                <p className="text-xs text-text-secondary">Share tips, ask questions & connect</p>
              </div>
              <span className="text-xs text-accent-primary font-medium">Explore →</span>
            </div>
          </Card>
        </div>

        {/* Categories */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Categories</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/categories')}
            >
              View All
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {displayCategories.map((category) => (
              <Card
                key={category.id}
                hover
                onClick={() => handleCategoryPress(category)}
                className="text-center"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-xl"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  {category.icon}
                </div>
                <h3 className="font-medium text-sm text-text-primary mb-1">
                  {category.name}
                </h3>
                <p className="text-xs text-text-secondary">
                  {category.serviceCount || category.count} services
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Popular Services */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-accent-primary" />
              <h2 className="text-lg font-semibold text-text-primary">Popular Services</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/search?sort=popular')}
            >
              View All
            </Button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {displayServices.map((service) => (
              <Card
                key={service.id}
                hover
                onClick={() => handleServicePress(service)}
                className="min-w-[280px] flex-shrink-0"
              >
                <div className="aspect-video bg-bg-hover rounded-2xl mb-3 overflow-hidden">
                  <img
                    src={service.images?.[0] || service.image || '/api/placeholder/300/200'}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold text-text-primary">{service.name}</h3>
                    <p className="text-sm text-text-secondary">{service.specialist?.name || service.specialist}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-accent-yellow fill-current" />
                      <span className="text-sm font-medium">{service.specialist?.rating || service.rating}</span>
                      <span className="text-sm text-text-secondary">({service.specialist?.reviewCount || service.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-text-secondary" />
                      <span className="text-sm text-text-secondary">{service.duration}min</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-accent-primary">
                      ${service.price}
                    </span>
                    <Button size="sm" onClick={handleBookNowPress}>
                      Book Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Nearby Specialists */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-accent-primary" />
              <h2 className="text-lg font-semibold text-text-primary">Nearby Specialists</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/search?nearby=true')}
            >
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {displaySpecialists.map((specialist) => (
              <Card
                key={specialist.id}
                hover
                onClick={() => handleSpecialistPress(specialist)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-bg-hover">
                      <img
                        src={specialist.avatar || specialist.image || '/api/placeholder/100/100'}
                        alt={specialist.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {specialist.isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-accent-green rounded-full border-2 border-white/5" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">{specialist.name}</h3>
                    <p className="text-sm text-text-secondary mb-1">{specialist.specialist}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-accent-yellow fill-current" />
                          <span className="text-sm font-medium">{specialist.rating}</span>
                        </div>
                        <span className="text-sm text-text-secondary">• {specialist.distance || specialist.location?.city}</span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {(specialist.specialties || []).slice(0, 2).map((specialty) => (
                          <span
                            key={specialty}
                            className="px-2 py-1 bg-bg-secondary text-xs rounded-lg text-text-secondary font-medium"
                          >
                            {specialty}
                          </span>
                        ))}
                        {(specialist.specialties || []).length > 2 && (
                          <span className="text-xs text-text-secondary">+{specialist.specialties.length - 2}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        {!isAuthenticated && !authState && (
          <div className="px-4 py-6 mx-4 my-4 bg-gradient-to-r from-accent-primary to-purple-600 rounded-2xl text-white">
            <h3 className="text-xl font-bold mb-2">Ready to get started?</h3>
            <p className="text-blue-100 mb-4">
              Sign up now and get 10% off your first booking!
            </p>
            <Button
              variant="secondary"
              onClick={() => navigate('/auth')}
              className="bg-bg-card text-accent-primary hover:bg-bg-hover"
            >
              Get Started
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
