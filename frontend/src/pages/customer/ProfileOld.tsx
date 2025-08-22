import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { FloatingElements, UkrainianOrnament } from '../../components/ui/UkrainianElements';

interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  avatar?: string;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  preferences: CustomerPreferences;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  loyalty: LoyaltyInfo;
  emergencyContact: EmergencyContact;
  accessibility: AccessibilitySettings;
  languages: string[];
  timezone: string;
}

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

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'digital_wallet';
  label: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isVerified: boolean;
}

interface CustomerPreferences {
  preferredSpecialistGender: 'no_preference' | 'male' | 'female';
  preferredCommunicationTime: string[];
  serviceCategories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  locationRadius: number;
  reminders: {
    before24h: boolean;
    before2h: boolean;
    before30min: boolean;
  };
}

interface NotificationSettings {
  emailBookings: boolean;
  emailReminders: boolean;
  emailOffers: boolean;
  emailNewsletter: boolean;
  pushBookings: boolean;
  pushReminders: boolean;
  pushOffers: boolean;
  smsReminders: boolean;
  smsBookingUpdates: boolean;
}

interface PrivacySettings {
  showProfile: boolean;
  shareReviews: boolean;
  allowRecommendations: boolean;
  dataProcessing: boolean;
  marketing: boolean;
  analytics: boolean;
}

interface LoyaltyInfo {
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  nextTierPoints: number;
  memberSince: string;
  totalSpent: number;
  discountsUsed: number;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

interface AccessibilitySettings {
  mobilityAssistance: boolean;
  hearingImpairment: boolean;
  visualImpairment: boolean;
  cognitiveSupport: boolean;
  languageSupport: string;
  specialRequests: string;
}

const defaultProfile: CustomerProfile = {
  id: '1',
  firstName: 'Олена',
  lastName: 'Петренко',
  email: 'olena.petrenko@example.com',
  phone: '+380671234567',
  dateOfBirth: '1990-05-15',
  gender: 'female',
  addresses: [
    {
      id: '1',
      type: 'home',
      label: 'Домашня адреса',
      street: 'вул. Індепенденс, 15, кв. 42',
      city: 'Київ',
      region: 'Київська область',
      postalCode: '01001',
      country: 'Україна',
      isDefault: true,
    },
    {
      id: '2',
      type: 'work',
      label: 'Офіс',
      street: 'вул. Хрещатик, 32',
      city: 'Київ',
      region: 'Київська область',
      postalCode: '01001',
      country: 'Україна',
      isDefault: false,
    },
  ],
  paymentMethods: [],
  preferences: {
    preferredSpecialistGender: 'no_preference',
    preferredCommunicationTime: ['10:00-12:00', '14:00-18:00'],
    serviceCategories: ['Psychology', 'Beauty', 'Fitness'],
    priceRange: {
      min: 300,
      max: 2000,
    },
    locationRadius: 10,
    reminders: {
      before24h: true,
      before2h: true,
      before30min: false,
    },
  },
  notifications: {
    emailBookings: true,
    emailReminders: true,
    emailOffers: false,
    emailNewsletter: false,
    pushBookings: true,
    pushReminders: true,
    pushOffers: false,
    smsReminders: true,
    smsBookingUpdates: true,
  },
  privacy: {
    showProfile: true,
    shareReviews: true,
    allowRecommendations: true,
    dataProcessing: true,
    marketing: false,
    analytics: true,
  },
  loyalty: {
    points: 1240,
    tier: 'silver',
    nextTierPoints: 760,
    memberSince: '2024-03-15',
    totalSpent: 15600,
    discountsUsed: 8,
  },
  emergencyContact: {
    name: 'Марія Петренко',
    relationship: 'Мама',
    phone: '+380501234567',
    email: 'maria.petrenko@example.com',
  },
  accessibility: {
    mobilityAssistance: false,
    hearingImpairment: false,
    visualImpairment: false,
    cognitiveSupport: false,
    languageSupport: 'uk',
    specialRequests: '',
  },
  languages: ['uk', 'en', 'ru'],
  timezone: 'Europe/Kiev',
};

const CustomerProfile: React.FC = () => {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const currentUser = useAppSelector(selectUser);
  const [profile, setProfile] = useState<CustomerProfile>(defaultProfile);
  const [activeTab, setActiveTab] = useState<'personal' | 'addresses' | 'loyalty'>('personal');

  // Update profile with actual user data when user is loaded
  useEffect(() => {
    if (currentUser) {
      setProfile(prev => ({
        ...prev,
        id: currentUser.id,
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phoneNumber || '',
        // Keep other default values but use real user data for basic info
      }));
    }
  }, [currentUser]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'silver': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'gold': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'platinum': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTierName = (tier: string) => {
    const names = {
      bronze: language === 'uk' ? 'Бронзовий' : language === 'ru' ? 'Бронзовый' : 'Bronze',
      silver: language === 'uk' ? 'Срібний' : language === 'ru' ? 'Серебряный' : 'Silver',
      gold: language === 'uk' ? 'Золотий' : language === 'ru' ? 'Золотой' : 'Gold',
      platinum: language === 'uk' ? 'Платиновий' : language === 'ru' ? 'Платиновый' : 'Platinum',
    };
    return names[tier as keyof typeof names] || tier;
  };

  const tabs = [
    {
      id: 'personal',
      name: language === 'uk' ? 'Особисте' : language === 'ru' ? 'Личное' : 'Personal',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 'addresses',
      name: language === 'uk' ? 'Адреси' : language === 'ru' ? 'Адреса' : 'Addresses',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: 'payments',
      name: language === 'uk' ? 'Платежі' : language === 'ru' ? 'Платежи' : 'Payments',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      id: 'preferences',
      name: language === 'uk' ? 'Налаштування' : language === 'ru' ? 'Настройки' : 'Preferences',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      )
    },
    {
      id: 'notifications',
      name: language === 'uk' ? 'Сповіщення' : language === 'ru' ? 'Уведомления' : 'Notifications',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.97 4.97a.75.75 0 0 0-1.08 1.05l-3.99 4.99a2 2 0 0 0 0 2.83L9.88 17.8a.75.75 0 0 0 1.06-1.06L6.97 12.88l3.97-3.97a.75.75 0 0 0 0-1.06z" />
        </svg>
      )
    },
    {
      id: 'privacy',
      name: language === 'uk' ? 'Приватність' : language === 'ru' ? 'Конфиденциальность' : 'Privacy',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      id: 'loyalty',
      name: language === 'uk' ? 'Лояльність' : language === 'ru' ? 'Лояльность' : 'Loyalty',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <FloatingElements />
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {language === 'uk' ? 'Мій профіль' : language === 'ru' ? 'Мой профиль' : 'My Profile'}
                </h1>
                <p className="text-gray-600">
                  {language === 'uk' 
                    ? 'Керуйте своїм профілем та налаштуваннями'
                    : language === 'ru'
                    ? 'Управляйте своим профилем и настройками'
                    : 'Manage your profile and preferences'
                  }
                </p>
              </div>
              <div className="flex items-center gap-3 mt-4 lg:mt-0">
                <span className={`px-4 py-2 rounded-xl font-medium ${getTierColor(profile.loyalty.tier)}`}>
                  {getTierName(profile.loyalty.tier)}
                </span>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    isEditing
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isEditing 
                    ? (language === 'uk' ? 'Скасувати' : language === 'ru' ? 'Отменить' : 'Cancel')
                    : (language === 'uk' ? 'Редагувати' : language === 'ru' ? 'Редактировать' : 'Edit Profile')
                  }
                </button>
              </div>
            </div>
            
            <UkrainianOrnament className="mb-6" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.icon}
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
                {/* Personal Information Tab */}
                {activeTab === 'personal' && (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {language === 'uk' ? 'Особиста інформація' : language === 'ru' ? 'Личная информация' : 'Personal Information'}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'uk' ? 'Ім\'я' : language === 'ru' ? 'Имя' : 'First Name'}
                        </label>
                        <input
                          type="text"
                          value={profile.firstName}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'uk' ? 'Прізвище' : language === 'ru' ? 'Фамилия' : 'Last Name'}
                        </label>
                        <input
                          type="text"
                          value={profile.lastName}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'uk' ? 'Електронна пошта' : language === 'ru' ? 'Электронная почта' : 'Email'}
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'uk' ? 'Телефон' : language === 'ru' ? 'Телефон' : 'Phone'}
                        </label>
                        <input
                          type="tel"
                          value={profile.phone}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'uk' ? 'Дата народження' : language === 'ru' ? 'Дата рождения' : 'Date of Birth'}
                        </label>
                        <input
                          type="date"
                          value={profile.dateOfBirth}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'uk' ? 'Стать' : language === 'ru' ? 'Пол' : 'Gender'}
                        </label>
                        <select
                          value={profile.gender}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                        >
                          <option value="male">{language === 'uk' ? 'Чоловіча' : language === 'ru' ? 'Мужской' : 'Male'}</option>
                          <option value="female">{language === 'uk' ? 'Жіноча' : language === 'ru' ? 'Женской' : 'Female'}</option>
                          <option value="other">{language === 'uk' ? 'Інше' : language === 'ru' ? 'Другое' : 'Other'}</option>
                          <option value="prefer_not_to_say">{language === 'uk' ? 'Не вказувати' : language === 'ru' ? 'Не указывать' : 'Prefer not to say'}</option>
                        </select>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {language === 'uk' ? 'Контакт для екстрених випадків' : language === 'ru' ? 'Контакт для экстренных случаев' : 'Emergency Contact'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {language === 'uk' ? 'Ім\'я' : language === 'ru' ? 'Имя' : 'Name'}
                          </label>
                          <input
                            type="text"
                            value={profile.emergencyContact.name}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {language === 'uk' ? 'Стосунок' : language === 'ru' ? 'Отношение' : 'Relationship'}
                          </label>
                          <input
                            type="text"
                            value={profile.emergencyContact.relationship}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {language === 'uk' ? 'Телефон' : language === 'ru' ? 'Телефон' : 'Phone'}
                          </label>
                          <input
                            type="tel"
                            value={profile.emergencyContact.phone}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {language === 'uk' ? 'Email (необов\'язково)' : language === 'ru' ? 'Email (необязательно)' : 'Email (optional)'}
                          </label>
                          <input
                            type="email"
                            value={profile.emergencyContact.email || ''}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Addresses Tab */}
                {activeTab === 'addresses' && (
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {language === 'uk' ? 'Мої адреси' : language === 'ru' ? 'Мои адреса' : 'My Addresses'}
                      </h2>
                      {isEditing && (
                        <button className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors duration-200">
                          {language === 'uk' ? 'Додати адресу' : language === 'ru' ? 'Добавить адрес' : 'Add Address'}
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {profile.addresses.map((address) => (
                        <div key={address.id} className="border border-gray-200 rounded-xl p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                address.type === 'home' ? 'bg-primary-100 text-primary-600' :
                                address.type === 'work' ? 'bg-secondary-100 text-secondary-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {address.type === 'home' ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                  </svg>
                                ) : address.type === 'work' ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{address.label}</h3>
                                {address.isDefault && (
                                  <span className="text-sm text-primary-600 font-medium">
                                    {language === 'uk' ? 'Основна' : language === 'ru' ? 'Основной' : 'Default'}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isEditing && (
                              <div className="flex gap-2">
                                <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors duration-200">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="text-gray-600">
                            <p>{address.street}</p>
                            <p>{address.city}, {address.region}</p>
                            <p>{address.postalCode}, {address.country}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Methods Tab */}
                {activeTab === 'payments' && (
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {language === 'uk' ? 'Способи оплати' : language === 'ru' ? 'Способы оплаты' : 'Payment Methods'}
                      </h2>
                      <button className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {language === 'uk' ? 'Додати спосіб оплати' : language === 'ru' ? 'Добавить способ оплаты' : 'Add Payment Method'}
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {profile.paymentMethods.length === 0 ? (
                        <div className="text-center py-12">
                          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {language === 'uk' ? 'Способи оплати не додано' : language === 'ru' ? 'Способы оплаты не добавлены' : 'No payment methods added yet'}
                          </h3>
                          <p className="text-gray-500 mb-6">
                            {language === 'uk' 
                              ? 'Додайте спосіб оплати для швидкого та зручного бронювання послуг'
                              : language === 'ru'
                              ? 'Добавьте способ оплаты для быстрого и удобного бронирования услуг'
                              : 'Add a payment method for quick and convenient service bookings'
                            }
                          </p>
                          <button className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center gap-2 mx-auto">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {language === 'uk' ? 'Додати перший спосіб оплати' : language === 'ru' ? 'Добавить первый способ оплаты' : 'Add Your First Payment Method'}
                          </button>
                        </div>
                      ) : (
                        profile.paymentMethods.map((method) => (
                          <div key={method.id} className="border border-gray-200 rounded-xl p-6">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${
                                  method.type === 'card' ? 'bg-primary-100 text-primary-600' :
                                  method.type === 'bank_account' ? 'bg-secondary-100 text-secondary-600' :
                                  'bg-success-100 text-success-600'
                                }`}>
                                  {method.type === 'card' ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                  ) : method.type === 'bank_account' ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                    </svg>
                                  ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-semibold text-gray-900">{method.label}</h3>
                                    {method.isDefault && (
                                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-medium">
                                        {language === 'uk' ? 'Основна' : language === 'ru' ? 'Основной' : 'Default'}
                                      </span>
                                    )}
                                    {method.isVerified && (
                                      <span className="px-2 py-1 bg-success-100 text-success-700 rounded-lg text-xs font-medium">
                                        {language === 'uk' ? 'Підтверджено' : language === 'ru' ? 'Подтверждено' : 'Verified'}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-600">
                                    **** **** **** {method.last4}
                                    {method.expiryMonth && method.expiryYear && (
                                      <span className="ml-2">
                                        {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {language === 'uk' ? 'Мої налаштування' : language === 'ru' ? 'Мои настройки' : 'My Preferences'}
                    </h2>
                    
                    <div className="space-y-8">
                      {/* Service Preferences */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          {language === 'uk' ? 'Налаштування послуг' : language === 'ru' ? 'Настройки услуг' : 'Service Preferences'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {language === 'uk' ? 'Переважна стать спеціаліста' : language === 'ru' ? 'Предпочитаемый пол специалиста' : 'Preferred Specialist Gender'}
                            </label>
                            <select
                              value={profile.preferences.preferredSpecialistGender}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            >
                              <option value="no_preference">{language === 'uk' ? 'Немає значення' : language === 'ru' ? 'Нет предпочтений' : 'No Preference'}</option>
                              <option value="male">{language === 'uk' ? 'Чоловік' : language === 'ru' ? 'Мужчина' : 'Male'}</option>
                              <option value="female">{language === 'uk' ? 'Жінка' : language === 'ru' ? 'Женщина' : 'Female'}</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {language === 'uk' ? 'Радіус пошуку (км)' : language === 'ru' ? 'Радиус поиска (км)' : 'Search Radius (km)'}
                            </label>
                            <input
                              type="number"
                              value={profile.preferences.locationRadius}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Price Range */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          {language === 'uk' ? 'Ціновий діапазон' : language === 'ru' ? 'Ценовой диапазон' : 'Price Range'}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {language === 'uk' ? 'Мінімум' : language === 'ru' ? 'Минимум' : 'Minimum'}
                            </label>
                            <input
                              type="number"
                              value={profile.preferences.priceRange.min}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {language === 'uk' ? 'Максимум' : language === 'ru' ? 'Максимум' : 'Maximum'}
                            </label>
                            <input
                              type="number"
                              value={profile.preferences.priceRange.max}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Reminder Settings */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          {language === 'uk' ? 'Налаштування нагадувань' : language === 'ru' ? 'Настройки напоминаний' : 'Reminder Settings'}
                        </h3>
                        <div className="space-y-4">
                          {[
                            { key: 'before24h', label: language === 'uk' ? 'За 24 години' : language === 'ru' ? 'За 24 часа' : '24 hours before' },
                            { key: 'before2h', label: language === 'uk' ? 'За 2 години' : language === 'ru' ? 'За 2 часа' : '2 hours before' },
                            { key: 'before30min', label: language === 'uk' ? 'За 30 хвилин' : language === 'ru' ? 'За 30 минут' : '30 minutes before' },
                          ].map((reminder) => (
                            <div key={reminder.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                              <span className="font-medium text-gray-900">{reminder.label}</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={(profile.preferences.reminders as any)[reminder.key]}
                                  disabled={!isEditing}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {language === 'uk' ? 'Налаштування сповіщень' : language === 'ru' ? 'Настройки уведомлений' : 'Notification Settings'}
                    </h2>
                    
                    <div className="space-y-6">
                      {[
                        { key: 'emailBookings', label: language === 'uk' ? 'Email про бронювання' : language === 'ru' ? 'Email о бронированиях' : 'Email Bookings' },
                        { key: 'emailReminders', label: language === 'uk' ? 'Email нагадування' : language === 'ru' ? 'Email напоминания' : 'Email Reminders' },
                        { key: 'emailOffers', label: language === 'uk' ? 'Email пропозиції' : language === 'ru' ? 'Email предложения' : 'Email Offers' },
                        { key: 'emailNewsletter', label: language === 'uk' ? 'Email новини' : language === 'ru' ? 'Email новости' : 'Email Newsletter' },
                        { key: 'pushBookings', label: language === 'uk' ? 'Push про бронювання' : language === 'ru' ? 'Push о бронированиях' : 'Push Bookings' },
                        { key: 'pushReminders', label: language === 'uk' ? 'Push нагадування' : language === 'ru' ? 'Push напоминания' : 'Push Reminders' },
                        { key: 'pushOffers', label: language === 'uk' ? 'Push пропозиції' : language === 'ru' ? 'Push предложения' : 'Push Offers' },
                        { key: 'smsReminders', label: language === 'uk' ? 'SMS нагадування' : language === 'ru' ? 'SMS напоминания' : 'SMS Reminders' },
                        { key: 'smsBookingUpdates', label: language === 'uk' ? 'SMS оновлення бронювань' : language === 'ru' ? 'SMS обновления бронирований' : 'SMS Booking Updates' },
                      ].map((notification) => (
                        <div key={notification.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                          <span className="font-medium text-gray-900">{notification.label}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(profile.notifications as any)[notification.key]}
                              disabled={!isEditing}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {language === 'uk' ? 'Приватність та безпека' : language === 'ru' ? 'Конфиденциальность и безопасность' : 'Privacy & Security'}
                    </h2>
                    
                    <div className="space-y-6">
                      {[
                        { key: 'showProfile', label: language === 'uk' ? 'Показувати профіль іншим' : language === 'ru' ? 'Показывать профиль другим' : 'Show Profile to Others' },
                        { key: 'shareReviews', label: language === 'uk' ? 'Показувати мої відгуки' : language === 'ru' ? 'Показывать мои отзывы' : 'Share My Reviews' },
                        { key: 'allowRecommendations', label: language === 'uk' ? 'Дозволити рекомендації' : language === 'ru' ? 'Разрешить рекомендации' : 'Allow Recommendations' },
                        { key: 'dataProcessing', label: language === 'uk' ? 'Обробка даних' : language === 'ru' ? 'Обработка данных' : 'Data Processing' },
                        { key: 'marketing', label: language === 'uk' ? 'Маркетингові комунікації' : language === 'ru' ? 'Маркетинговые коммуникации' : 'Marketing Communications' },
                        { key: 'analytics', label: language === 'uk' ? 'Аналітика' : language === 'ru' ? 'Аналитика' : 'Analytics' },
                      ].map((privacy) => (
                        <div key={privacy.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                          <span className="font-medium text-gray-900">{privacy.label}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(profile.privacy as any)[privacy.key]}
                              disabled={!isEditing}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loyalty Tab */}
                {activeTab === 'loyalty' && (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {language === 'uk' ? 'Програма лояльності' : language === 'ru' ? 'Программа лояльности' : 'Loyalty Program'}
                    </h2>
                    
                    <div className="space-y-6">
                      {/* Current Status */}
                      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {language === 'uk' ? 'Поточний статус' : language === 'ru' ? 'Текущий статус' : 'Current Status'}
                            </h3>
                            <p className="text-gray-600">
                              {language === 'uk' ? 'Учасник з' : language === 'ru' ? 'Участник с' : 'Member since'} {new Date(profile.loyalty.memberSince).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-6 py-3 rounded-xl font-bold text-lg ${getTierColor(profile.loyalty.tier)}`}>
                            {getTierName(profile.loyalty.tier)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary-600 mb-1">{profile.loyalty.points}</div>
                            <div className="text-sm text-gray-600">
                              {language === 'uk' ? 'Бонусні бали' : language === 'ru' ? 'Бонусные баллы' : 'Points'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-secondary-600 mb-1">{formatPrice(profile.loyalty.totalSpent)}</div>
                            <div className="text-sm text-gray-600">
                              {language === 'uk' ? 'Загалом витрачено' : language === 'ru' ? 'Всего потрачено' : 'Total Spent'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-success-600 mb-1">{profile.loyalty.discountsUsed}</div>
                            <div className="text-sm text-gray-600">
                              {language === 'uk' ? 'Використано знижок' : language === 'ru' ? 'Использовано скидок' : 'Discounts Used'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress to Next Tier */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          {language === 'uk' ? 'Прогрес до наступного рівня' : language === 'ru' ? 'Прогресс до следующего уровня' : 'Progress to Next Tier'}
                        </h3>
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>
                              {language === 'uk' ? 'На наступний рівень потрібно' : language === 'ru' ? 'На следующий уровень нужно' : 'Need'} {profile.loyalty.nextTierPoints} {language === 'uk' ? 'балів' : language === 'ru' ? 'баллов' : 'more points'}
                            </span>
                            <span>{getTierName('gold')}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(10, (profile.loyalty.points / (profile.loyalty.points + profile.loyalty.nextTierPoints)) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {language === 'uk' 
                            ? 'Продовжуйте користуватися нашими послугами, щоб отримати більше переваг та знижок!'
                            : language === 'ru'
                            ? 'Продолжайте пользоваться нашими услугами, чтобы получить больше преимуществ и скидок!'
                            : 'Keep using our services to unlock more benefits and discounts!'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                {isEditing && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
                      >
                        {language === 'uk' ? 'Скасувати' : language === 'ru' ? 'Отменить' : 'Cancel'}
                      </button>
                      <button className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors duration-200">
                        {language === 'uk' ? 'Зберегти зміни' : language === 'ru' ? 'Сохранить изменения' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;