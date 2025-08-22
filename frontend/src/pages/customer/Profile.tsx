import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { FloatingElements, UkrainianOrnament } from '../../components/ui/UkrainianElements';
import { 
  PencilIcon,
  MapPinIcon,
  StarIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <FloatingElements />
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {language === 'uk' ? 'Мій профіль' : language === 'ru' ? 'Мой профиль' : 'My Profile'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {language === 'uk' 
                    ? 'Перегляньте та керуйте вашою особистою інформацією'
                    : language === 'ru'
                    ? 'Просматривайте и управляйте вашей личной информацией'
                    : 'View and manage your personal information'
                  }
                </p>
              </div>
              <div className="flex items-center gap-3 mt-4 lg:mt-0">
                <span className={`px-4 py-2 rounded-xl font-medium ${getTierColor(loyalty.tier)}`}>
                  {getTierName(loyalty.tier)}
                </span>
                <Link
                  to="/settings"
                  className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                  {language === 'uk' ? 'Налаштування' : language === 'ru' ? 'Настройки' : 'Settings'}
                </Link>
              </div>
            </div>
            
            <UkrainianOrnament className="mb-6" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Personal Information Card */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {language === 'uk' ? 'Особиста інформація' : language === 'ru' ? 'Личная информация' : 'Personal Information'}
                  </h2>
                  <Link 
                    to="/settings"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 text-sm font-medium"
                  >
                    <PencilIcon className="h-4 w-4" />
                    {language === 'uk' ? 'Редагувати' : language === 'ru' ? 'Редактировать' : 'Edit'}
                  </Link>
                </div>

                {/* Profile Photo and Basic Info */}
                <div className="flex items-center gap-6 mb-8">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-white font-bold text-3xl">
                        {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {currentUser?.firstName} {currentUser?.lastName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {language === 'uk' ? 'Клієнт' : language === 'ru' ? 'Клиент' : 'Customer'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {language === 'uk' ? 'Онлайн' : language === 'ru' ? 'Онлайн' : 'Online'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'uk' ? 'Електронна пошта' : language === 'ru' ? 'Электронная почта' : 'Email'}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{currentUser?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'uk' ? 'Телефон' : language === 'ru' ? 'Телефон' : 'Phone'}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {currentUser?.phoneNumber || (language === 'uk' ? 'Не вказано' : language === 'ru' ? 'Не указан' : 'Not provided')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'uk' ? 'Учасник з' : language === 'ru' ? 'Участник с' : 'Member since'}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : loyalty.memberSince}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'uk' ? 'Тип акаунту' : language === 'ru' ? 'Тип аккаунта' : 'Account type'}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {language === 'uk' ? 'Клієнт' : language === 'ru' ? 'Клиент' : 'Customer'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {language === 'uk' ? 'Мої адреси' : language === 'ru' ? 'Мои адреса' : 'My Addresses'}
                  </h2>
                  <Link 
                    to="/settings"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 text-sm font-medium"
                  >
                    <PencilIcon className="h-4 w-4" />
                    {language === 'uk' ? 'Керувати' : language === 'ru' ? 'Управлять' : 'Manage'}
                  </Link>
                </div>

                <div className="space-y-4">
                  {addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPinIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {language === 'uk' ? 'Адреси не додано' : language === 'ru' ? 'Адреса не добавлены' : 'No addresses added yet'}
                      </p>
                    </div>
                  ) : (
                    addresses.map((address) => (
                      <div key={address.id} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 flex items-start gap-4">
                        <MapPinIcon className="h-6 w-6 text-gray-400 dark:text-gray-500 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{address.label}</p>
                            {address.isDefault && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                {language === 'uk' ? 'Основна' : language === 'ru' ? 'Основной' : 'Default'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{address.street}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {address.city}, {address.postalCode}, {address.country}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Loyalty Program */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
                  {language === 'uk' ? 'Програма лояльності' : language === 'ru' ? 'Программа лояльности' : 'Loyalty Program'}
                </h3>
                
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <StarIcon className="h-10 w-10 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{getTierName(loyalty.tier)}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {language === 'uk' ? `Учасник з ${loyalty.memberSince}` : language === 'ru' ? `Участник с ${loyalty.memberSince}` : `Member since ${loyalty.memberSince}`}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{loyalty.points}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'uk' ? 'Бонусні бали' : language === 'ru' ? 'Бонусные баллы' : 'Bonus Points'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">₴{loyalty.totalSpent}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'uk' ? 'Всього потрачено' : language === 'ru' ? 'Всего потрачено' : 'Total Spent'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">{loyalty.discountsUsed}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'uk' ? 'Використано знижок' : language === 'ru' ? 'Использовано скидок' : 'Discounts Used'}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {language === 'uk' ? 'Прогрес до наступного рівня' : language === 'ru' ? 'Прогресс до следующего уровня' : 'Progress to next level'}
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full" 
                        style={{ width: `${(loyalty.points / (loyalty.points + loyalty.nextTierPoints)) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {language === 'uk' ? `Потрібно ще ${loyalty.nextTierPoints} балів` : language === 'ru' ? `Нужно еще ${loyalty.nextTierPoints} баллов` : `${loyalty.nextTierPoints} more points needed`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {language === 'uk' ? 'Швидкі дії' : language === 'ru' ? 'Быстрые действия' : 'Quick Actions'}
                </h3>
                
                <div className="space-y-2">
                  <Link 
                    to="/settings"
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <Cog6ToothIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {language === 'uk' ? 'Налаштування акаунту' : language === 'ru' ? 'Настройки аккаунта' : 'Account Settings'}
                    </span>
                  </Link>
                  
                  <Link 
                    to="/payments"
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <CreditCardIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {language === 'uk' ? 'Способи оплати' : language === 'ru' ? 'Способы оплаты' : 'Payment Methods'}
                    </span>
                  </Link>
                  
                  <Link 
                    to="/loyalty"
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <StarIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {language === 'uk' ? 'Бали лояльності' : language === 'ru' ? 'Баллы лояльности' : 'Loyalty Points'}
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;