import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
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
} from '@heroicons/react/24/outline';

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
  const { language } = useLanguage();
  const currentUser = useAppSelector(selectUser);
  
  // Default data - will be replaced with API calls
  // Success/Error message states
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [addresses] = useState<Address[]>([
    {
      id: '1',
      type: 'home',
      label: language === 'uk' ? 'Домашня адреса' : language === 'ru' ? 'Домашний адрес' : 'Home Address',
      street: 'вул. Індепенденс, 15, кв. 42',
      city: 'Київ',
      region: 'Київська область',
      postalCode: '01001',
      country: 'Україна',
      isDefault: true,
    },
  ]);
  
  const [loyalty] = useState<LoyaltyInfo>({
    points: 1240,
    tier: 'silver',
    nextTierPoints: 760,
    memberSince: '2024-03-15',
    totalSpent: 15600,
    discountsUsed: 8,
  });
  
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
      return dateObj.toLocaleDateString(language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US', {
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
        return language === 'uk' ? 'Бронзовий' : language === 'ru' ? 'Бронзовый' : 'Bronze';
      case 'silver': 
        return language === 'uk' ? 'Срібний' : language === 'ru' ? 'Серебряный' : 'Silver';
      case 'gold': 
        return language === 'uk' ? 'Золотий' : language === 'ru' ? 'Золотой' : 'Gold';
      case 'platinum': 
        return language === 'uk' ? 'Платиновий' : language === 'ru' ? 'Платиновый' : 'Platinum';
      default: 
        return language === 'uk' ? 'Початковий' : language === 'ru' ? 'Начальный' : 'Starter';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 relative">
      {/* Success/Error Notifications */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-success-200 dark:border-success-800 p-4 flex items-center gap-3 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-success-800 dark:text-success-200 font-semibold text-sm mb-1">
                {language === 'uk' ? 'Успішно!' : language === 'ru' ? 'Успешно!' : 'Success!'}
              </p>
              <p className="text-success-700 dark:text-success-300 text-xs">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {showErrorMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-error-200 dark:border-error-800 p-4 flex items-center gap-3 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-error-100 dark:bg-error-900/30 flex items-center justify-center flex-shrink-0">
              <XCircleIcon className="h-6 w-6 text-error-600 dark:text-error-400" />
            </div>
            <div>
              <p className="text-error-800 dark:text-error-200 font-semibold text-sm mb-1">
                {language === 'uk' ? 'Помилка!' : language === 'ru' ? 'Ошибка!' : 'Error!'}
              </p>
              <p className="text-error-700 dark:text-error-300 text-xs">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Modern Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            {/* Profile Info Section */}
            <div className="flex items-start gap-6">
              {/* Modern Avatar */}
              <div className="relative group">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="Profile"
                    className="w-28 h-28 rounded-2xl object-cover border-4 border-white dark:border-gray-800 shadow-lg ring-4 ring-white dark:ring-gray-800"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white dark:ring-gray-800">
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
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {currentUser?.firstName} {currentUser?.lastName}
                    </h1>
                    <p className="text-xl text-primary-600 dark:text-primary-400 font-medium mb-3">
                      {language === 'uk' ? 'Клієнт' : language === 'ru' ? 'Клиент' : 'Customer'}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {/* Loyalty Tier */}
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${getTierColor(loyalty.tier)}`}>
                    <StarIcon className="h-5 w-5" />
                    <span className="font-medium text-sm">
                      {getTierName(loyalty.tier)} Мембер
                    </span>
                  </div>
                  
                  {/* Member Since */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {language === 'uk' ? 'Учасник з' : language === 'ru' ? 'Участник с' : 'Member since'} {formatMemberDate(currentUser?.createdAt || '')}
                    </span>
                  </div>
                  
                  {/* Online Status */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-300 rounded-xl">
                    <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">
                      {language === 'uk' ? 'Онлайн' : language === 'ru' ? 'Онлайн' : 'Online'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {!isEditing && (
                <button className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center gap-2">
                  <EyeIcon className="h-4 w-4" />
                  {language === 'uk' ? 'Перегляд' : language === 'ru' ? 'Просмотр' : 'Preview'}
                </button>
              )}
              <Link
                to="/settings"
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Cog6ToothIcon className="h-4 w-4" />
                {language === 'uk' ? 'Налаштування' : language === 'ru' ? 'Настройки' : 'Settings'}
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information Card */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {language === 'uk' ? 'Особиста інформація' : language === 'ru' ? 'Личная информация' : 'Personal Information'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {language === 'uk' ? 'Основні дані вашого профілю' : language === 'ru' ? 'Основные данные вашего профиля' : 'Your basic profile information'}
                  </p>
                </div>
                <Link 
                  to="/settings"
                  className="px-4 py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 border border-primary-200 dark:border-primary-800 rounded-xl font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 flex items-center gap-2"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  {language === 'uk' ? 'Редагувати' : language === 'ru' ? 'Редактировать' : 'Edit'}
                </Link>
              </div>

              {/* Contact Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {language === 'uk' ? 'Електронна пошта' : language === 'ru' ? 'Электронная почта' : 'Email'}
                  </label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{currentUser?.email}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {language === 'uk' ? 'Телефон' : language === 'ru' ? 'Телефон' : 'Phone'}
                  </label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {currentUser?.phoneNumber || (
                        <span className="text-gray-500 dark:text-gray-400 italic">
                          {language === 'uk' ? 'Не вказано' : language === 'ru' ? 'Не указан' : 'Not provided'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {language === 'uk' ? 'Дата реєстрації' : language === 'ru' ? 'Дата регистрации' : 'Registration Date'}
                  </label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {formatMemberDate(currentUser?.createdAt || '')}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {language === 'uk' ? 'Тип акаунту' : language === 'ru' ? 'Тип аккаунта' : 'Account Type'}
                  </label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <UserCircleIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {language === 'uk' ? 'Клієнт' : language === 'ru' ? 'Клиент' : 'Customer'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Addresses Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {language === 'uk' ? 'Мої адреси' : language === 'ru' ? 'Мои адреса' : 'My Addresses'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {language === 'uk' ? 'Керуйте вашими адресами доставки' : language === 'ru' ? 'Управляйте вашими адресами доставки' : 'Manage your delivery addresses'}
                  </p>
                </div>
                <Link 
                  to="/settings"
                  className="px-4 py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 border border-primary-200 dark:border-primary-800 rounded-xl font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 flex items-center gap-2"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  {language === 'uk' ? 'Керувати' : language === 'ru' ? 'Управлять' : 'Manage'}
                </Link>
              </div>

              <div className="space-y-4">
                {addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <MapPinIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {language === 'uk' ? 'Немає адрес' : language === 'ru' ? 'Нет адресов' : 'No addresses yet'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {language === 'uk' ? 'Додайте адресу для швидкого оформлення замовлень' : language === 'ru' ? 'Добавьте адрес для быстрого оформления заказов' : 'Add an address for quick order checkout'}
                    </p>
                    <Link
                      to="/settings"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                    >
                      <MapPinIcon className="h-5 w-5" />
                      {language === 'uk' ? 'Додати адресу' : language === 'ru' ? 'Добавить адрес' : 'Add Address'}
                    </Link>
                  </div>
                ) : (
                  addresses.filter(address => address && address.id).map((address) => (
                    <div key={address.id} className="border border-gray-200 dark:border-gray-600 rounded-2xl p-6 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all duration-200">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <MapPinIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{address?.label || 'Address'}</h3>
                            {address?.isDefault && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300 border border-success-200 dark:border-success-800">
                                <DocumentCheckIcon className="h-3 w-3 mr-1" />
                                {language === 'uk' ? 'Основна' : language === 'ru' ? 'Основной' : 'Default'}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{address?.street || ''}</p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {address?.city || ''}{address?.city && address?.postalCode ? ', ' : ''}{address?.postalCode || ''}{(address?.city || address?.postalCode) && address?.country ? ', ' : ''}{address?.country || ''}
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
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl shadow-sm border border-primary-200 dark:border-gray-700 p-8">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <StarIcon className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{getTierName(loyalty.tier)}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {language === 'uk' ? `Учасник з ${formatMemberDate(currentUser?.createdAt || '')}` : language === 'ru' ? `Участник с ${formatMemberDate(currentUser?.createdAt || '')}` : `Member since ${formatMemberDate(currentUser?.createdAt || '')}`}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 mb-6">
                <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-xl">
                  <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">{loyalty.points}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'uk' ? 'Бонусні бали' : language === 'ru' ? 'Бонусные баллы' : 'Bonus Points'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-xl">
                    <div className="text-lg font-bold text-secondary-600 dark:text-secondary-400">₴{loyalty.totalSpent}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {language === 'uk' ? 'Потрачено' : language === 'ru' ? 'Потрачено' : 'Spent'}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-xl">
                    <div className="text-lg font-bold text-success-600 dark:text-success-400">{loyalty.discountsUsed}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {language === 'uk' ? 'Знижки' : language === 'ru' ? 'Скидки' : 'Discounts'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {language === 'uk' ? 'Прогрес' : language === 'ru' ? 'Прогресс' : 'Progress'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {loyalty.nextTierPoints} {language === 'uk' ? 'до наступного' : language === 'ru' ? 'до следующего' : 'to next'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${(loyalty.points / (loyalty.points + loyalty.nextTierPoints)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BuildingOfficeIcon className="h-5 w-5" />
                {language === 'uk' ? 'Швидкі дії' : language === 'ru' ? 'Быстрые действия' : 'Quick Actions'}
              </h3>
              
              <div className="space-y-2">
                <Link 
                  to="/settings"
                  className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Cog6ToothIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {language === 'uk' ? 'Налаштування' : language === 'ru' ? 'Настройки' : 'Settings'}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {language === 'uk' ? 'Керування акаунтом' : language === 'ru' ? 'Управление аккаунтом' : 'Account management'}
                    </p>
                  </div>
                </Link>
                
                <Link 
                  to="/payments"
                  className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CreditCardIcon className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {language === 'uk' ? 'Платежі' : language === 'ru' ? 'Платежи' : 'Payments'}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {language === 'uk' ? 'Методи оплати' : language === 'ru' ? 'Методы оплаты' : 'Payment methods'}
                    </p>
                  </div>
                </Link>
                
                <Link 
                  to="/loyalty"
                  className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-success-100 dark:bg-success-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <StarIcon className="h-5 w-5 text-success-600 dark:text-success-400" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {language === 'uk' ? 'Лояльність' : language === 'ru' ? 'Лояльность' : 'Loyalty'}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {language === 'uk' ? 'Бонусна програма' : language === 'ru' ? 'Бонусная программа' : 'Rewards program'}
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