import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Settings,
  Heart,
  Star,
  Calendar,
  Award,
  Edit,
  Camera,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Wallet,
  MessageCircle,
  Users,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState, AppDispatch } from '@/store';
import { updateProfileAsync, logout } from '@/store/slices/authSlice';
import { fetchBookingsAsync } from '@/store/slices/bookingsSlice';
import { addToast } from '@/store/slices/uiSlice';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback, showAlert, showConfirm } = useTelegram();

  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const { bookings } = useSelector((state: RootState) => state.bookings);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  useEffect(() => {
    if (user) {
      dispatch(fetchBookingsAsync({ limit: 5 }));
    }
  }, [user, dispatch]);

  const handleEditProfile = () => {
    setShowEditProfile(true);
    hapticFeedback.impactLight();
  };

  const handleSaveProfile = async () => {
    try {
      await dispatch(updateProfileAsync(profileData)).unwrap();
      dispatch(addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully.',
      }));
      setShowEditProfile(false);
      hapticFeedback.notificationSuccess();
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update profile. Please try again.',
      }));
      hapticFeedback.notificationError();
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm('Are you sure you want to log out?');
    if (confirmed) {
      dispatch(logout());
      hapticFeedback.impactMedium();
      navigate('/auth');
    }
  };

  const handleAvatarUpload = () => {
    // TODO: Implement avatar upload functionality
    hapticFeedback.impactLight();
    dispatch(addToast({
      type: 'info',
      title: 'Coming Soon',
      message: 'Avatar upload feature will be available soon.',
    }));
  };

  const getCompletedBookingsCount = () => {
    return bookings.filter(booking => booking.status === 'completed').length;
  };

  const getAverageRating = () => {
    const completedWithReviews = bookings.filter(
      booking => booking.status === 'completed' && booking.review
    );
    if (completedWithReviews.length === 0) return 0;
    
    const totalRating = completedWithReviews.reduce(
      (sum, booking) => sum + (booking.review?.rating || 0), 0
    );
    return (totalRating / completedWithReviews.length).toFixed(1);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-primary">
      <Header title="Profile" />

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Profile Header */}
        <div className="px-4 py-6 bg-gradient-to-b from-accent to-accent-dark text-white">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-white bg-opacity-20">
                <img
                  src={user.avatar || '/api/placeholder/80/80'}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={handleAvatarUpload}
                className="absolute bottom-0 right-0 w-6 h-6 bg-white bg-opacity-90 rounded-full flex items-center justify-center"
              >
                <Camera size={12} className="text-accent" />
              </button>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">
                {user.firstName} {user.lastName}
              </h1>
              <p className="opacity-80">{user.email}</p>
              {user.phone && (
                <p className="opacity-80 text-sm">{user.phone}</p>
              )}
            </div>
            <button
              onClick={handleEditProfile}
              className="p-2 bg-white bg-opacity-20 rounded-lg"
            >
              <Edit size={18} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white border-opacity-20">
            <div className="text-center">
              <div className="text-lg font-bold">{bookings.length}</div>
              <div className="text-xs opacity-80">Total Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{getCompletedBookingsCount()}</div>
              <div className="text-xs opacity-80">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{getAverageRating()}</div>
              <div className="text-xs opacity-80">Avg Rating</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-4">
          <h2 className="text-lg font-semibold text-primary mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card hover onClick={() => navigate('/bookings')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-primary">My Bookings</h3>
                  <p className="text-xs text-secondary">{bookings.length} total</p>
                </div>
              </div>
            </Card>

            <Card hover onClick={() => navigate('/wallet')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Wallet size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-primary">Wallet</h3>
                  <p className="text-xs text-secondary">Balance & payments</p>
                </div>
              </div>
            </Card>

            <Card hover onClick={() => navigate('/favorites')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Heart size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-primary">Favorites</h3>
                  <p className="text-xs text-secondary">Saved services</p>
                </div>
              </div>
            </Card>

            <Card hover onClick={() => navigate('/loyalty')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-primary">Rewards</h3>
                  <p className="text-xs text-secondary">Loyalty points</p>
                </div>
              </div>
            </Card>

            <Card hover onClick={() => navigate('/reviews')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star size={20} className="text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium text-primary">Reviews</h3>
                  <p className="text-xs text-secondary">My reviews</p>
                </div>
              </div>
            </Card>

            <Card hover onClick={() => navigate('/community')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-primary">Community</h3>
                  <p className="text-xs text-secondary">Posts & tips</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-primary">Recent Bookings</h2>
            <button
              onClick={() => navigate('/bookings')}
              className="text-accent text-sm"
            >
              View All
            </button>
          </div>

          {bookings.length === 0 ? (
            <Card>
              <div className="text-center py-6">
                <Calendar size={32} className="text-secondary mx-auto mb-2" />
                <p className="text-secondary">No bookings yet</p>
                <Button
                  size="sm"
                  onClick={() => navigate('/search')}
                  className="mt-3"
                >
                  Book Your First Service
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 3).map((booking) => (
                <Card key={booking.id} hover>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                      <img
                        src={booking.specialist.avatar || '/api/placeholder/48/48'}
                        alt={booking.specialist.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-primary">{booking.service.name}</h3>
                      <p className="text-sm text-secondary">{booking.specialist.name}</p>
                      <p className="text-xs text-secondary">
                        {new Date(booking.startTime).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          booking.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="px-4 py-4">
          <h2 className="text-lg font-semibold text-primary mb-3">Settings</h2>
          <div className="space-y-1">
            <Card hover onClick={() => { hapticFeedback.impactLight(); navigate('/settings'); }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings size={20} className="text-secondary" />
                  <span className="text-primary">Settings & Preferences</span>
                </div>
                <ChevronRight size={18} className="text-secondary" />
              </div>
            </Card>

            <Card hover onClick={() => { hapticFeedback.impactLight(); navigate('/analytics'); }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin size={20} className="text-secondary" />
                  <span className="text-primary">Analytics</span>
                </div>
                <ChevronRight size={18} className="text-secondary" />
              </div>
            </Card>

            <Card hover onClick={handleLogout}>
              <div className="flex items-center gap-3">
                <LogOut size={20} className="text-red-500" />
                <span className="text-red-500">Sign Out</span>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Profile Sheet */}
      <Sheet
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title="Edit Profile"
      >
        <div className="space-y-4">
          <Input
            label="First Name"
            value={profileData.firstName}
            onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
            icon={<User size={18} />}
            placeholder="Enter first name"
          />

          <Input
            label="Last Name"
            value={profileData.lastName}
            onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
            icon={<User size={18} />}
            placeholder="Enter last name"
          />

          <Input
            label="Phone"
            type="tel"
            value={profileData.phone}
            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
            icon={<Phone size={18} />}
            placeholder="Enter phone number"
          />

          <Input
            label="Email"
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
            icon={<Mail size={18} />}
            placeholder="Enter email address"
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowEditProfile(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Sheet>

    </div>
  );
};