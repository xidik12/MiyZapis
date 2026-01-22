import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { LoyaltyService, UserLoyalty, LoyaltyStats } from '../../services/loyalty.service';
import { calculateTier, formatPoints } from '../../utils/formatPoints';
import { 
  PencilSquareIcon,
  MapPinIcon,
  StarIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  EyeIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  DocumentCheckIcon
} from '@/components/icons';

interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  label: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface LoyaltyInfo {
  points: number;
  tier: string;
  nextTierPoints: number;
  memberSince: string;
  totalSpent: number;
  discountsUsed: number;
}

const CustomerProfile: React.FC = () => {
  const { language, t } = useLanguage();
  const currentUser = useAppSelector(selectUser);
  const { currency } = useCurrency();
  
  // Default data - will be replaced with API calls
  // Success/Error message states
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [userLoyalty, setUserLoyalty] = useState<UserLoyalty | null>(null);
  const [loyaltyStats, setLoyaltyStats] = useState<LoyaltyStats | null>(null);
  const [loadingLoyalty, setLoadingLoyalty] = useState(true);
  
  const loyaltyService = new LoyaltyService();

  // Load saved addresses from localStorage (persisted in Settings)
  useEffect(() => {
    const key = currentUser?.id ? `mz.addresses.${currentUser.id}` : null;
    if (!key) return;
    
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter out invalid addresses more safely
          const validAddresses = parsed.filter(addr => 
            addr && 
            typeof addr === 'object' && 
            addr.id && 
            addr.label
          );
          setAddresses(validAddresses);
        }
      }
    } catch (e) {
      console.warn('Failed to load addresses for profile:', e);
    }
  }, [currentUser?.id]);

  // Load loyalty data
  useEffect(() => {
    const loadLoyaltyData = async () => {
      if (!currentUser?.id) return;
      
      try {
        setLoadingLoyalty(true);
        const [loyaltyProfile, stats] = await Promise.all([
          loyaltyService.getUserLoyalty(),
          loyaltyService.getLoyaltyStats()
        ]);
        
        setUserLoyalty(loyaltyProfile);
        setLoyaltyStats(stats);
      } catch (error) {
        console.error('Failed to load loyalty data:', error);
        // Keep the component working with fallback data if API fails
        setUserLoyalty({
          id: 'fallback',
          userId: currentUser.id,
          currentPoints: 0,
          lifetimePoints: 0,
          createdAt: currentUser.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        setLoyaltyStats({
          totalPoints: 0,
          totalTransactions: 0,
          totalBadges: 0,
          totalReferrals: 0,
          currentTier: null,
          nextTier: null,
          pointsToNextTier: 0,
          monthlyPoints: 0,
          yearlyPoints: 0
        });
      } finally {
        setLoadingLoyalty(false);
      }
    };

    loadLoyaltyData();
  }, [currentUser?.id]);
  
  // Convert loyalty data to the format expected by the UI
  const loyalty: LoyaltyInfo = {
    points: loyaltyStats?.totalPoints || userLoyalty?.currentPoints || 0,
    tier: loyaltyStats?.currentTier?.slug || userLoyalty?.tier?.slug || calculateTier(loyaltyStats?.totalPoints || userLoyalty?.currentPoints || 0),
    nextTierPoints: loyaltyStats?.pointsToNextTier || 0,
    memberSince: userLoyalty?.createdAt || loyaltyStats?.memberSince || currentUser?.createdAt || '',
    totalSpent: 0, // This would need to be calculated from bookings
    discountsUsed: 0, // This would need to be tracked separately
  };
  
  // Success/Error message handlers
  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      setTimeout(() => setSuccessMessage(''), 300);
    }, 4000);
  };

  const showErrorNotification = (message: string) => {
    setErrorMessage(message);
    setShowErrorMessage(true);
    setTimeout(() => {
      setShowErrorMessage(false);
      setTimeout(() => setErrorMessage(''), 300);
    }, 4000);
  };

  // Fix verification date formatting
  const formatMemberDate = (date: string) => {
    if (!date) return loyalty.memberSince;
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return loyalty.memberSince;
      return dateObj.toLocaleDateString(language === 'kh' ? 'km-KH' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return loyalty.memberSince;
    }
  };

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'bronze': 
        return t('loyalty.tier.bronze');
      case 'silver': 
        return t('loyalty.tier.silver');
      case 'gold': 
        return t('loyalty.tier.gold');
      case 'platinum': 
        return t('loyalty.tier.platinum');
      default: 
        return t('loyalty.tier.starter');
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'silver': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'gold': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'platinum': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 relative">
      {/* Success/Error Notifications */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in max-w-[92vw]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-success-200 dark:border-success-800 p-4 flex items-center gap-3 w-full sm:max-w-sm">
            <div className="w-10 h-10 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-success-800 dark:text-success-200 font-semibold text-sm mb-1">
                {t('common.success')}
              </p>
              <p className="text-success-700 dark:text-success-300 text-xs">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {showErrorMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in max-w-[92vw]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-error-200 dark:border-error-800 p-4 flex items-center gap-3 w-full sm:max-w-sm">
            <div className="w-10 h-10 rounded-full bg-error-100 dark:bg-error-900/30 flex items-center justify-center flex-shrink-0">
              <XCircleIcon className="h-6 w-6 text-error-600 dark:text-error-400" />
            </div>
            <div>
              <p className="text-error-800 dark:text-error-200 font-semibold text-sm mb-1">
                {t('common.error')}
              </p>
              <p className="text-error-700 dark:text-error-300 text-xs">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Modern Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            {/* Profile Info Section */}
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 min-w-0">
              {/* Modern Avatar */}
              <div className="relative group">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={t('profile.avatarAlt')}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white dark:border-gray-800 shadow-lg ring-4 ring-white dark:ring-gray-800"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-md ring-4 ring-white dark:ring-gray-800">
                    {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                  </div>
                )}
                {isEditing && (
                  <label className="absolute -bottom-2 -right-2 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-xl cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl opacity-0 group-hover:opacity-100">
                    <input type="file" accept="image/*" className="hidden" />
                    <CameraIcon className="h-4 w-4" />
                  </label>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 break-words">
                      {currentUser?.firstName} {currentUser?.lastName}
                    </h1>
                    <p className="text-lg sm:text-xl text-primary-600 dark:text-primary-400 font-medium mb-3 break-words">
                      {t('profile.customer') || 'Customer'}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
                  {/* Loyalty Tier */}
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${getTierColor(loyalty.tier)}`}>
                    <StarIcon className="h-5 w-5" />
                    <span className="font-medium text-xs sm:text-sm">
                      {t('profile.tierMember').replace('{tier}', getTierName(loyalty.tier))}
                    </span>
                  </div>
                  
                  {/* Member Since */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 break-words">
                      {t('profile.memberSince') || 'Member since'} {formatMemberDate(currentUser?.createdAt || '')}
                    </span>
                  </div>
                  
                  {/* Online Status */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-300 rounded-xl">
                    <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm font-medium">
                      {t('common.online') || 'Online'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {!isEditing && (
                <button className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto">
                  <EyeIcon className="h-4 w-4" />
                  {t('actions.preview') || 'Preview'}
                </button>
              )}
              <Link
                to="/settings"
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors duration-300 shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Cog6ToothIcon className="h-4 w-4" />
                {t('settings.title')}
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information Card */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('profile.personalInfo.title')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {t('profile.personalInfo.subtitle')}
                  </p>
                </div>
                <Link 
                  to="/settings"
                  className="px-4 py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 border border-primary-200 dark:border-primary-800 rounded-xl font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  {t('actions.edit')}
                </Link>
              </div>

              {/* Contact Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('profile.email')}
                  </label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl min-w-0">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100 break-words min-w-0">{currentUser?.email}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('profile.phone')}
                  </label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl min-w-0">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100 break-words min-w-0">
                      {currentUser?.phoneNumber || (
                        <span className="text-gray-500 dark:text-gray-400 italic">
                          {t('common.notProvided')}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('profile.registrationDate')}
                  </label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl min-w-0">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100 break-words min-w-0">
                      {formatMemberDate(currentUser?.createdAt || '')}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('profile.accountType')}
                  </label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl min-w-0">
                    <UserCircleIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100 break-words min-w-0">
                      {t('profile.customer')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Addresses Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8 mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('profile.myAddresses')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {t('profile.addresses.subtitle')}
                  </p>
                </div>
                <Link 
                  to="/settings"
                  className="px-4 py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 border border-primary-200 dark:border-primary-800 rounded-xl font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  {t('actions.manage')}
                </Link>
              </div>

              <div className="space-y-4">
                {addresses.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <MapPinIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t('profile.noAddressesYet')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {t('profile.addresses.emptySubtitle')}
                    </p>
                    <Link
                      to="/settings"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors w-full sm:w-auto justify-center"
                    >
                      <MapPinIcon className="h-5 w-5" />
                      {t('profile.addAddress')}
                    </Link>
                  </div>
                ) : (
                  addresses.map((address) => (
                    <div key={address.id} className="border border-gray-200 dark:border-gray-600 rounded-2xl p-6 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 min-w-0">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <MapPinIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white break-words">{address.label || t('addresses.labelFallback')}</h3>
                            {address.isDefault && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300 border border-success-200 dark:border-success-800">
                                  <DocumentCheckIcon className="h-3 w-3 mr-1" />
                                {t('common.default')}
                                </span>
                              )}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 font-medium mb-1 break-words">{address.street || ''}</p>
                          <p className="text-gray-600 dark:text-gray-400 break-words">
                            {address.city || ''}{address.city && address.postalCode ? ', ' : ''}{address.postalCode || ''}{(address.city || address.postalCode) && address.country ? ', ' : ''}{address.country || ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Loyalty Program Card */}
            <div className="bg-primary-50 dark:bg-gray-800 rounded-2xl shadow-sm border border-primary-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8">
              {loadingLoyalty ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">{t('loyalty.loading')}</p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                      <StarIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{getTierName(loyalty.tier)}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {t('profile.memberSinceWithDate').replace('{date}', formatMemberDate(loyalty.memberSince))}
                    </p>
                  </div>

                <div className="grid grid-cols-1 gap-6 mb-6">
                  <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-xl">
                  <div className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">{loyalty.points}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('loyalty.bonusPoints')}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-xl">
                    <div className="text-base sm:text-lg font-bold text-secondary-600 dark:text-secondary-400">{currency === 'KHR' ? '៛' : '$'}{loyalty.totalSpent}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {t('loyalty.spent')}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-xl">
                    <div className="text-base sm:text-lg font-bold text-success-600 dark:text-success-400">{loyalty.discountsUsed}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {t('loyalty.discounts')}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('loyalty.progress')}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {loyalty.nextTierPoints} {t('loyalty.toNextTier')}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${(loyalty.points / (loyalty.points + loyalty.nextTierPoints)) * 100}%` }}
                  ></div>
                </div>
              </div>
                </>
              )}
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BuildingOfficeIcon className="h-5 w-5" />
                {t('profile.quickActions.title')}
              </h3>
              
              <div className="space-y-2">
                <Link 
                  to="/settings"
                  className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Cog6ToothIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('profile.quickActions.settingsTitle')}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 break-words">
                      {t('profile.quickActions.settingsSubtitle')}
                    </p>
                  </div>
                </Link>
                
                <Link 
                  to="/payments"
                  className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CreditCardIcon className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('profile.quickActions.paymentsTitle')}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 break-words">
                      {t('profile.quickActions.paymentsSubtitle')}
                    </p>
                  </div>
                </Link>
                
                <Link 
                  to="/loyalty"
                  className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-success-100 dark:bg-success-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <StarIcon className="h-5 w-5 text-success-600 dark:text-success-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('profile.quickActions.loyaltyTitle')}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 break-words">
                      {t('profile.quickActions.loyaltySubtitle')}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
