import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
// Removed SpecialistPageWrapper - layout is handled by SpecialistLayout
import { FloatingElements, UkrainianOrnament } from '../../components/ui/UkrainianElements';

interface SpecialistProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profession: string;
  bio: string;
  bioUk: string;
  bioRu: string;
  experience: number;
  education: string;
  educationUk: string;
  educationRu: string;
  certifications: Certification[];
  portfolio: PortfolioItem[];
  location: {
    address: string;
    city: string;
    region: string;
    country: string;
  };
  serviceArea: {
    radius: number;
    cities: string[];
  };
  businessHours: BusinessHours;
  paymentMethods: string[];
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  verification: {
    isVerified: boolean;
    verifiedDate: string;
    documentsSubmitted: string[];
  };
  socialMedia: {
    website?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
  };
  languages: string[];
  specialties: string[];
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  dateIssued: string;
  expiryDate?: string;
  documentUrl?: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  titleUk?: string;
  titleRu?: string;
  description: string;
  descriptionUk?: string;
  descriptionRu?: string;
  imageUrl: string;
  category: string;
  categoryUk?: string;
  categoryRu?: string;
  dateAdded: string;
}

interface BusinessHours {
  monday: { isOpen: boolean; startTime: string; endTime: string; };
  tuesday: { isOpen: boolean; startTime: string; endTime: string; };
  wednesday: { isOpen: boolean; startTime: string; endTime: string; };
  thursday: { isOpen: boolean; startTime: string; endTime: string; };
  friday: { isOpen: boolean; startTime: string; endTime: string; };
  saturday: { isOpen: boolean; startTime: string; endTime: string; };
  sunday: { isOpen: boolean; startTime: string; endTime: string; };
}

interface NotificationSettings {
  emailBookings: boolean;
  emailReviews: boolean;
  emailMessages: boolean;
  pushBookings: boolean;
  pushReviews: boolean;
  pushMessages: boolean;
  smsBookings: boolean;
}

interface PrivacySettings {
  showPhone: boolean;
  showEmail: boolean;
  showAddress: boolean;
  allowDirectBooking: boolean;
  requireApproval: boolean;
}

const defaultProfile: SpecialistProfile = {
  id: '1',
  firstName: 'Катерина',
  lastName: 'Мельник',
  email: 'k.melnyk@example.com',
  phone: '+380501234567',
  profession: 'Психолог',
  bio: 'Experienced psychologist specializing in family therapy, anxiety, and depression treatment. 8 years of practice with evidence-based therapeutic approaches.',
  bioUk: 'Досвідчений психолог, який спеціалізується на сімейній терапії, лікуванні тривожності та депресії. 8 років практики з доказовими терапевтичними підходами.',
  bioRu: 'Опытный психолог, специализирующийся на семейной терапии, лечении тревожности и депрессии. 8 лет практики с доказательными терапевтическими подходами.',
  experience: 8,
  education: 'Master of Psychology, Taras Shevchenko National University of Kyiv',
  educationUk: 'Магістр психології, Київський національний університет імені Тараса Шевченка',
  educationRu: 'Магистр психологии, Киевский национальный университет имени Тараса Шевченко',
  certifications: [
    {
      id: '1',
      name: 'Certified Family Therapist',
      issuer: 'Ukrainian Psychological Association',
      dateIssued: '2020-05-15',
      expiryDate: '2025-05-15',
    },
    {
      id: '2',
      name: 'CBT Practitioner Certificate',
      issuer: 'International CBT Institute',
      dateIssued: '2019-09-20',
    },
  ],
  portfolio: [
    {
      id: '1',
      title: 'Family Therapy Session Setup',
      titleUk: 'Налаштування сімейної терапії',
      titleRu: 'Настройка семейной терапии',
      description: 'Professional consultation environment',
      descriptionUk: 'Професійне консультаційне середовище',
      descriptionRu: 'Профессиональная консультационная среда',
      imageUrl: '/portfolio/therapy-room.jpg',
      category: 'Workspace',
      categoryUk: 'Робоче місце',
      categoryRu: 'Рабочее место',
      dateAdded: '2024-01-15',
    },
    {
      id: '2',
      title: 'Workshop on Stress Management',
      titleUk: 'Майстер-клас з управління стресом',
      titleRu: 'Мастер-класс по управлению стрессом',
      description: 'Group workshop conducted in 2023',
      descriptionUk: 'Груповий майстер-клас, проведений у 2023 році',
      descriptionRu: 'Групповой мастер-класс, проведенный в 2023 году',
      imageUrl: '/portfolio/workshop.jpg',
      category: 'Workshop',
      categoryUk: 'Майстер-клас',
      categoryRu: 'Мастер-класс',
      dateAdded: '2023-11-20',
    },
  ],
  location: {
    address: 'вул. Хрещатик, 25',
    city: 'Київ',
    region: 'Київська область',
    country: 'Україна',
  },
  serviceArea: {
    radius: 15,
    cities: ['Київ', 'Бровари', 'Ірпінь', 'Буча'],
  },
  businessHours: {
    monday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    tuesday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    wednesday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    thursday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    friday: { isOpen: true, startTime: '09:00', endTime: '17:00' },
    saturday: { isOpen: true, startTime: '10:00', endTime: '15:00' },
    sunday: { isOpen: false, startTime: '', endTime: '' },
  },
  paymentMethods: ['card', 'cash', 'bank_transfer', 'apple_pay'],
  notifications: {
    emailBookings: true,
    emailReviews: true,
    emailMessages: true,
    pushBookings: true,
    pushReviews: false,
    pushMessages: true,
    smsBookings: false,
  },
  privacy: {
    showPhone: true,
    showEmail: false,
    showAddress: true,
    allowDirectBooking: true,
    requireApproval: false,
  },
  verification: {
    isVerified: true,
    verifiedDate: '2024-01-10',
    documentsSubmitted: ['diploma', 'certificate', 'id_card'],
  },
  socialMedia: {
    website: 'https://k-melnyk-psychology.com.ua',
    instagram: '@k.melnyk.psychology',
    linkedin: 'kateryna-melnyk-psychologist',
  },
  languages: ['uk', 'en', 'ru'],
  specialties: ['Family Therapy', 'Anxiety Treatment', 'Depression', 'Stress Management'],
};

const SpecialistProfile: React.FC = () => {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  
  // Helper function to get localized portfolio item content
  const getPortfolioItemText = (item: PortfolioItem, field: 'title' | 'description' | 'category'): string => {
    if (language === 'uk') {
      return (field === 'title' ? item.titleUk : field === 'description' ? item.descriptionUk : item.categoryUk) || item[field];
    }
    if (language === 'ru') {
      return (field === 'title' ? item.titleRu : field === 'description' ? item.descriptionRu : item.categoryRu) || item[field];
    }
    return item[field];
  };
  const [profile, setProfile] = useState<SpecialistProfile>(defaultProfile);
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'business' | 'portfolio' | 'security'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const getLocalizedText = (field: string) => {
    if (language === 'uk' && (profile as any)[`${field}Uk`]) {
      return (profile as any)[`${field}Uk`];
    }
    if (language === 'ru' && (profile as any)[`${field}Ru`]) {
      return (profile as any)[`${field}Ru`];
    }
    return (profile as any)[field];
  };

  const getDayName = (day: string) => {
    const dayNames = {
      en: {
        monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
        friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
      },
      uk: {
        monday: 'Понеділок', tuesday: 'Вівторок', wednesday: 'Середа', thursday: 'Четвер',
        friday: 'П\'ятниця', saturday: 'Субота', sunday: 'Неділя'
      },
      ru: {
        monday: 'Понедельник', tuesday: 'Вторник', wednesday: 'Среда', thursday: 'Четверг',
        friday: 'Пятница', saturday: 'Суббота', sunday: 'Воскресенье'
      }
    };
    return dayNames[language as keyof typeof dayNames][day as keyof typeof dayNames.en];
  };

  const getPaymentMethodName = (method: string) => {
    const methods = {
      card: language === 'uk' ? 'Картка' : language === 'ru' ? 'Карта' : 'Card',
      cash: language === 'uk' ? 'Готівка' : language === 'ru' ? 'Наличные' : 'Cash',
      bank_transfer: language === 'uk' ? 'Банківський переказ' : language === 'ru' ? 'Банковский перевод' : 'Bank Transfer',
      apple_pay: 'Apple Pay',
    };
    return methods[method as keyof typeof methods] || method;
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
      id: 'professional',
      name: language === 'uk' ? 'Професійне' : language === 'ru' ? 'Профессиональное' : 'Professional',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    },
    {
      id: 'business',
      name: language === 'uk' ? 'Бізнес' : language === 'ru' ? 'Бизнес' : 'Business',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      id: 'portfolio',
      name: t('portfolio.title'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'security',
      name: language === 'uk' ? 'Безпека' : language === 'ru' ? 'Безопасность' : 'Security',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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
                  {language === 'uk' ? 'Бізнес-профіль' : language === 'ru' ? 'Бизнес-профиль' : 'Business Profile'}
                </h1>
                <p className="text-gray-600">
                  {language === 'uk' 
                    ? 'Керуйте своїм професійним профілем та налаштуваннями'
                    : language === 'ru'
                    ? 'Управляйте своим профессиональным профилем и настройками'
                    : 'Manage your professional profile and settings'
                  }
                </p>
              </div>
              <div className="flex items-center gap-3 mt-4 lg:mt-0">
                {profile.verification.isVerified && (
                  <span className="flex items-center gap-2 px-4 py-2 bg-success-100 text-success-700 rounded-xl font-medium">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {language === 'uk' ? 'Підтверджено' : language === 'ru' ? 'Подтверждено' : 'Verified'}
                  </span>
                )}
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
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'uk' ? 'Про себе' : language === 'ru' ? 'О себе' : 'Bio'}
                      </label>
                      <textarea
                        value={getLocalizedText('bio')}
                        disabled={!isEditing}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'uk' ? 'Місцезнаходження' : language === 'ru' ? 'Местоположение' : 'Location'}
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder={language === 'uk' ? 'Адреса' : language === 'ru' ? 'Адрес' : 'Address'}
                          value={profile.location.address}
                          disabled={!isEditing}
                          className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                        <input
                          type="text"
                          placeholder={language === 'uk' ? 'Місто' : language === 'ru' ? 'Город' : 'City'}
                          value={profile.location.city}
                          disabled={!isEditing}
                          className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'uk' ? 'Мови' : language === 'ru' ? 'Языки' : 'Languages'}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {profile.languages.map((lang, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium dark:bg-primary-900/30 dark:text-primary-300"
                          >
                            {lang === 'uk' ? 'Українська' : lang === 'en' ? 'English' : lang === 'ru' ? 'Русский' : lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Professional Information Tab */}
                {activeTab === 'professional' && (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {language === 'uk' ? 'Професійна інформація' : language === 'ru' ? 'Профессиональная информация' : 'Professional Information'}
                    </h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'uk' ? 'Професія' : language === 'ru' ? 'Профессия' : 'Profession'}
                        </label>
                        <input
                          type="text"
                          value={profile.profession}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'uk' ? 'Досвід (років)' : language === 'ru' ? 'Опыт (лет)' : 'Experience (years)'}
                        </label>
                        <input
                          type="number"
                          value={profile.experience}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'uk' ? 'Освіта' : language === 'ru' ? 'Образование' : 'Education'}
                        </label>
                        <textarea
                          value={getLocalizedText('education')}
                          disabled={!isEditing}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'uk' ? 'Спеціалізації' : language === 'ru' ? 'Специализации' : 'Specialties'}
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {profile.specialties.map((specialty, index) => (
                            <span
                              key={index}
                              className="px-3 py-2 bg-secondary-100 text-secondary-700 rounded-lg text-sm font-medium dark:bg-secondary-900/30 dark:text-secondary-300"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {language === 'uk' ? 'Сертифікати' : language === 'ru' ? 'Сертификаты' : 'Certifications'}
                          </h3>
                          {isEditing && (
                            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200">
                              {language === 'uk' ? 'Додати' : language === 'ru' ? 'Добавить' : 'Add'}
                            </button>
                          )}
                        </div>
                        <div className="space-y-4">
                          {profile.certifications.map((cert) => (
                            <div key={cert.id} className="border border-gray-200 rounded-xl p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                                  <p className="text-gray-600 text-sm">{cert.issuer}</p>
                                  <p className="text-gray-500 text-sm mt-1">
                                    {new Date(cert.dateIssued).toLocaleDateString()} 
                                    {cert.expiryDate && ` - ${new Date(cert.expiryDate).toLocaleDateString()}`}
                                  </p>
                                </div>
                                {isEditing && (
                                  <button className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors duration-200">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Business Settings Tab */}
                {activeTab === 'business' && (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {language === 'uk' ? 'Бізнес-налаштування' : language === 'ru' ? 'Бизнес-настройки' : 'Business Settings'}
                    </h2>
                    
                    <div className="space-y-8">
                      {/* Business Hours */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          {language === 'uk' ? 'Робочі години' : language === 'ru' ? 'Рабочие часы' : 'Business Hours'}
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(profile.businessHours).map(([day, hours]) => (
                            <div key={day} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
                              <div className="w-24">
                                <span className="font-medium text-gray-900">{getDayName(day)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={hours.isOpen}
                                  disabled={!isEditing}
                                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-600">
                                  {language === 'uk' ? 'Відкрито' : language === 'ru' ? 'Открыто' : 'Open'}
                                </span>
                              </div>
                              {hours.isOpen && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="time"
                                    value={hours.startTime}
                                    disabled={!isEditing}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                                  />
                                  <span className="text-gray-500">-</span>
                                  <input
                                    type="time"
                                    value={hours.endTime}
                                    disabled={!isEditing}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          {language === 'uk' ? 'Способи оплати' : language === 'ru' ? 'Способы оплаты' : 'Payment Methods'}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {['card', 'cash', 'bank_transfer', 'apple_pay'].map((method) => (
                            <div key={method} className={`p-4 border-2 rounded-xl text-center cursor-pointer transition-all duration-200 ${
                              profile.paymentMethods.includes(method)
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}>
                              <div className="text-sm font-medium">{getPaymentMethodName(method)}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Service Area */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          {language === 'uk' ? 'Зона обслуговування' : language === 'ru' ? 'Зона обслуживания' : 'Service Area'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {language === 'uk' ? 'Радіус (км)' : language === 'ru' ? 'Радиус (км)' : 'Radius (km)'}
                            </label>
                            <input
                              type="number"
                              value={profile.serviceArea.radius}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {language === 'uk' ? 'Міста обслуговування' : language === 'ru' ? 'Города обслуживания' : 'Service Cities'}
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            {profile.serviceArea.cities.map((city, index) => (
                              <span
                                key={index}
                                className="px-3 py-2 bg-success-100 text-success-700 rounded-lg text-sm font-medium dark:bg-success-900/30 dark:text-success-300"
                              >
                                {city}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Portfolio Tab */}
                {activeTab === 'portfolio' && (
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {t('portfolio.title')}
                      </h2>
                      {isEditing && (
                        <button className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors duration-200">
                          {t('portfolio.addPhoto')}
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {profile.portfolio.map((item) => (
                        <div key={item.id} className="bg-gray-100 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
                          <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-1">{getPortfolioItemText(item, 'title')}</h3>
                            <p className="text-gray-600 text-sm mb-2">{getPortfolioItemText(item, 'description')}</p>
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-medium">
                                {getPortfolioItemText(item, 'category')}
                              </span>
                              {isEditing && (
                                <button className="p-1 text-error-600 hover:bg-error-50 rounded transition-colors duration-200">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add Photo Placeholder */}
                      {isEditing && (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors duration-200 cursor-pointer">
                          <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <p className="text-sm font-medium">
                            {t('portfolio.addPhoto')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {language === 'uk' ? 'Безпека та приватність' : language === 'ru' ? 'Безопасность и конфиденциальность' : 'Security & Privacy'}
                    </h2>
                    
                    <div className="space-y-8">
                      {/* Verification Status */}
                      <div className="bg-success-50 border border-success-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <svg className="w-6 h-6 text-success-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h3 className="text-lg font-semibold text-success-900">
                            {language === 'uk' ? 'Статус верифікації' : language === 'ru' ? 'Статус верификации' : 'Verification Status'}
                          </h3>
                        </div>
                        <p className="text-success-800 mb-3">
                          {language === 'uk' 
                            ? 'Ваш профіль підтверджено. Верифіковано'
                            : language === 'ru'
                            ? 'Ваш профиль подтвержден. Верифицирован'
                            : 'Your profile is verified. Verified on'
                          } {new Date(profile.verification.verifiedDate).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {profile.verification.documentsSubmitted.map((doc, index) => (
                            <span key={index} className="px-3 py-1 bg-success-200 text-success-800 rounded-lg text-sm font-medium">
                              {doc === 'diploma' 
                                ? (language === 'uk' ? 'Диплом' : language === 'ru' ? 'Диплом' : 'Diploma')
                                : doc === 'certificate'
                                ? (language === 'uk' ? 'Сертифікат' : language === 'ru' ? 'Сертификат' : 'Certificate')
                                : doc === 'id_card'
                                ? (language === 'uk' ? 'Паспорт' : language === 'ru' ? 'Паспорт' : 'ID Card')
                                : doc
                              }
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Privacy Settings */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          {language === 'uk' ? 'Налаштування приватності' : language === 'ru' ? 'Настройки конфиденциальности' : 'Privacy Settings'}
                        </h3>
                        <div className="space-y-4">
                          {[
                            { key: 'showPhone', label: language === 'uk' ? 'Показувати телефон' : language === 'ru' ? 'Показывать телефон' : 'Show Phone Number' },
                            { key: 'showEmail', label: language === 'uk' ? 'Показувати email' : language === 'ru' ? 'Показывать email' : 'Show Email Address' },
                            { key: 'showAddress', label: language === 'uk' ? 'Показувати адресу' : language === 'ru' ? 'Показывать адрес' : 'Show Address' },
                            { key: 'allowDirectBooking', label: language === 'uk' ? 'Дозволити пряме бронювання' : language === 'ru' ? 'Разрешить прямое бронирование' : 'Allow Direct Booking' },
                            { key: 'requireApproval', label: language === 'uk' ? 'Вимагати підтвердження' : language === 'ru' ? 'Требовать подтверждение' : 'Require Approval' },
                          ].map((setting) => (
                            <div key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                              <span className="font-medium text-gray-900">{setting.label}</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={(profile.privacy as any)[setting.key]}
                                  disabled={!isEditing}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notification Settings */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          {language === 'uk' ? 'Налаштування сповіщень' : language === 'ru' ? 'Настройки уведомлений' : 'Notification Settings'}
                        </h3>
                        <div className="space-y-4">
                          {[
                            { key: 'emailBookings', label: language === 'uk' ? 'Email про бронювання' : language === 'ru' ? 'Email о бронированиях' : 'Email Bookings' },
                            { key: 'emailReviews', label: language === 'uk' ? 'Email про відгуки' : language === 'ru' ? 'Email об отзывах' : 'Email Reviews' },
                            { key: 'emailMessages', label: language === 'uk' ? 'Email повідомлення' : language === 'ru' ? 'Email сообщения' : 'Email Messages' },
                            { key: 'pushBookings', label: language === 'uk' ? 'Push про бронювання' : language === 'ru' ? 'Push о бронированиях' : 'Push Bookings' },
                            { key: 'pushReviews', label: language === 'uk' ? 'Push про відгуки' : language === 'ru' ? 'Push об отзывах' : 'Push Reviews' },
                            { key: 'pushMessages', label: language === 'uk' ? 'Push повідомлення' : language === 'ru' ? 'Push сообщения' : 'Push Messages' },
                            { key: 'smsBookings', label: language === 'uk' ? 'SMS про бронювання' : language === 'ru' ? 'SMS о бронированиях' : 'SMS Bookings' },
                          ].map((setting) => (
                            <div key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                              <span className="font-medium text-gray-900">{setting.label}</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={(profile.notifications as any)[setting.key]}
                                  disabled={!isEditing}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Social Media Links */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          {language === 'uk' ? 'Соціальні мережі' : language === 'ru' ? 'Социальные сети' : 'Social Media'}
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {language === 'uk' ? 'Веб-сайт' : language === 'ru' ? 'Веб-сайт' : 'Website'}
                            </label>
                            <input
                              type="url"
                              value={profile.socialMedia.website || ''}
                              disabled={!isEditing}
                              placeholder="https://..."
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                            <input
                              type="text"
                              value={profile.socialMedia.instagram || ''}
                              disabled={!isEditing}
                              placeholder="@username"
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                            <input
                              type="text"
                              value={profile.socialMedia.linkedin || ''}
                              disabled={!isEditing}
                              placeholder="username"
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            />
                          </div>
                        </div>
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

export default SpecialistProfile;