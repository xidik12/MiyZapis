import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { selectUser } from '@/store/slices/authSlice';
import { SearchBar } from '@/components/common/SearchBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { MagnifyingGlassIcon, StarIcon, ClockIcon, ShieldCheckIcon, UserGroupIcon, CalendarIcon, CreditCardIcon, ChatBubbleLeftRightIcon, SealCheckIcon as CheckBadgeIcon, ArrowRightIcon } from '@/components/icons';

// Service categories and featured specialists - data from API
const getServiceCategories = (t: (key: string) => string) => [
  {
    id: '1',
    name: t('category.beautyWellness'),
    description: t('category.beautyWellness.desc'),
    icon: '💄',
    serviceCount: 156,
    href: '/search?category=beauty-wellness',
  },
  {
    id: '2',
    name: t('category.healthFitness'),
    description: t('category.healthFitness.desc'),
    icon: '💪',
    serviceCount: 89,
    href: '/search?category=health-fitness',
  },
  {
    id: '3',
    name: t('category.homeServices'),
    description: t('category.homeServices.desc'),
    icon: '🏠',
    serviceCount: 124,
    href: '/search?category=home-services',
  },
  {
    id: '4',
    name: t('category.professional'),
    description: t('category.professional.desc'),
    icon: '💼',
    serviceCount: 78,
    href: '/search?category=professional-services',
  },
  {
    id: '5',
    name: t('category.education'),
    description: t('category.education.desc'),
    icon: '📚',
    serviceCount: 92,
    href: '/search?category=education',
  },
  {
    id: '6',
    name: t('category.technology'),
    description: t('category.technology.desc'),
    icon: '💻',
    serviceCount: 67,
    href: '/search?category=technology',
  },
];

const getFeaturedSpecialists = (t: (key: string) => string) => [
  {
    id: '1',
    name: 'Sarah Johnson',
    specialty: t('profession.hairStylistColorist'),
    rating: 4.9,
    reviews: 127,
    image: '/images/specialists/sarah.jpg',
    location: t('location.newYork'),
    startingPrice: 3150, // Price in UAH (base currency)
  },
  {
    id: '2',
    name: 'Michael Chen',
    specialty: t('profession.personalTrainer'),
    rating: 4.8,
    reviews: 94,
    image: '/images/specialists/michael.jpg',
    location: t('location.sanFrancisco'),
    startingPrice: 2220, // Price in UAH (base currency)
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    specialty: t('profession.businessConsultant'),
    rating: 5.0,
    reviews: 76,
    image: '/images/specialists/emily.jpg',
    location: t('location.austin'),
    startingPrice: 5550, // Price in UAH (base currency)
  },
];

const getHowItWorksSteps = (t: (key: string) => string) => [
  {
    step: 1,
    title: t('howItWorks.step1.title'),
    description: t('howItWorks.step1.desc'),
    icon: MagnifyingGlassIcon,
  },
  {
    step: 2,
    title: t('howItWorks.step2.title'),
    description: t('howItWorks.step2.desc'),
    icon: CalendarIcon,
  },
  {
    step: 3,
    title: t('howItWorks.step3.title'),
    description: t('howItWorks.step3.desc'),
    icon: ChatBubbleLeftRightIcon,
  },
  {
    step: 4,
    title: t('howItWorks.step4.title'),
    description: t('howItWorks.step4.desc'),
    icon: StarIcon,
  },
];

const getStats = (t: (key: string) => string) => [
  { label: t('stats.activeSpecialists'), value: '10,000+', icon: UserGroupIcon },
  { label: t('stats.servicesCompleted'), value: '50,000+', icon: CheckBadgeIcon },
  { label: t('stats.averageRating'), value: '4.9/5', icon: StarIcon },
  { label: t('stats.responseTime'), value: '< 2 hours', icon: ClockIcon },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const serviceCategories = getServiceCategories(t);
  const howItWorksSteps = getHowItWorksSteps(t);
  const stats = getStats(t);
  const featuredSpecialists = getFeaturedSpecialists(t);

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen w-full prevent-overflow">
      {/* Hero Section */}
      <section className="relative bg-primary-500 text-white overflow-hidden min-h-[100vh] xs:min-h-[90vh] sm:min-h-[85vh] lg:min-h-[80vh] flex items-center w-full prevent-overflow">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        
        {/* Animated background elements - hide some on mobile */}
        <div className="hidden lg:block absolute top-20 right-20 w-32 h-32 rounded-full morph-shape opacity-20 float-animation"></div>
        <div className="hidden lg:block absolute bottom-20 left-20 w-48 h-48 rounded-full bg-white/10 animate-pulse"></div>
        <div className="hidden lg:block absolute top-1/2 right-1/4 w-16 h-16 bg-primary-500 rounded-full animate-bounce"></div>
        
        <div className="relative w-full max-w-7xl mx-auto mobile-container py-12 xs:py-16 sm:py-20 lg:py-24 prevent-overflow">
          <div className="text-center w-full prevent-overflow">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-6xl font-bold mb-4 xs:mb-6 leading-tight animate-fade-in px-2 xs:px-0">
              {t('hero.title1')}
              <br />
              <span className="text-secondary-200 shimmer">{t('hero.title2')}</span>
            </h1>
            <p className="text-base xs:text-lg sm:text-xl md:text-2xl text-primary-100 mb-6 xs:mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-2 xs:px-0">
              {t('hero.subtitle')}
            </p>

            {/* Search Bar */}
            <div className="w-full max-w-2xl mx-auto mb-8 px-4 sm:px-0">
              <SearchBar
                placeholder={t('hero.searchPlaceholder')}
                onSearch={handleSearch}
                className="text-base sm:text-lg"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-2 xs:gap-3 sm:gap-4 mb-6 xs:mb-8 sm:mb-12 px-2 xs:px-0">
              <Link
                to="/search?category=beauty-wellness"
                className="glass-effect text-white px-3 xs:px-4 sm:px-6 py-2 xs:py-2 sm:py-3 rounded-full font-semibold hover:scale-105 transition-all duration-300 hover:glow-primary text-xs xs:text-sm sm:text-base whitespace-nowrap"
              >
                {t('category.beautyWellness')}
              </Link>
              <Link
                to="/search?category=health-fitness"
                className="glass-effect text-white px-3 xs:px-4 sm:px-6 py-2 xs:py-2 sm:py-3 rounded-full font-semibold hover:scale-105 transition-all duration-300 hover:glow-primary text-xs xs:text-sm sm:text-base whitespace-nowrap"
              >
                {t('category.healthFitness')}
              </Link>
              <Link
                to="/search?category=home-services"
                className="glass-effect text-white px-3 xs:px-4 sm:px-6 py-2 xs:py-2 sm:py-3 rounded-full font-semibold hover:scale-105 transition-all duration-300 hover:glow-primary text-xs xs:text-sm sm:text-base whitespace-nowrap"
              >
                {t('category.homeServices')}
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 max-w-4xl mx-auto px-2 xs:px-0">
              {stats.map((stat, index) => (
                <div
                  key={index} 
                  className="glass-effect text-center p-3 xs:p-4 sm:p-6 hover:scale-105 transition-all duration-300 rounded-lg border border-white/20"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  <stat.icon className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 mx-auto mb-2 xs:mb-2 sm:mb-3 text-secondary-200" />
                  <div className="text-lg xs:text-xl sm:text-2xl font-bold mb-1 text-white drop-shadow-lg">{stat.value}</div>
                  <div className="text-white/90 text-xs xs:text-xs sm:text-sm font-medium drop-shadow-md leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary-500 opacity-20 transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-secondary-500 opacity-10 transform -translate-x-48 translate-y-48"></div>
      </section>

      {/* Service Categories */}
      <section className="py-8 xs:py-12 sm:py-20 w-full prevent-overflow" style={{ backgroundColor: 'rgb(var(--bg-secondary))' }}>
        <div className="w-full max-w-7xl mx-auto mobile-container prevent-overflow">
          <div className="text-center mb-8 xs:mb-12 sm:mb-16">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-4 px-2 xs:px-0">
              {t('categories.title')}
            </h2>
            <p className="text-base xs:text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-2 xs:px-0">
              {t('categories.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6 md:gap-8">
            {serviceCategories.map((category, index) => (
              <Link
                key={category.id}
                to={category.href}
                className="group glass-effect p-4 xs:p-6 sm:p-8 rounded-xl hover:scale-105 transition-all duration-300 block h-full"
              >
                <div className="text-5xl mb-6 animate-bounce">{category.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-primary-600 transition-all duration-300">
                  {category.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {category.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary-600 font-semibold px-3 py-1 bg-primary-50 dark:bg-primary-900/30 rounded-full">
                    {category.serviceCount} {t('services.count')}
                  </span>
                  <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-all duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-8 xs:py-12 sm:py-16 lg:py-20 bg-gray-50 dark:bg-gray-800/50 w-full prevent-overflow">
        <div className="max-w-7xl mx-auto mobile-container prevent-overflow">
          <div className="text-center mb-8 xs:mb-12 sm:mb-16">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 px-2 xs:px-0">
              {t('howItWorks.title')}
            </h2>
            <p className="text-base xs:text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-2 xs:px-0">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xs:gap-8">
            {howItWorksSteps.map((step, index) => (
              <div key={step.step} className="text-center">
                <div className="relative mb-6 xs:mb-8">
                  <div className="w-12 h-12 xs:w-16 xs:h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                    <step.icon className="w-6 h-6 xs:w-8 xs:h-8 text-white" />
                    <div className="absolute -top-1 -right-1 xs:-top-2 xs:-right-2 bg-secondary-500 text-white w-6 h-6 xs:w-8 xs:h-8 rounded-full flex items-center justify-center text-xs xs:text-sm font-bold shadow-lg">
                      {step.step}
                    </div>
                  </div>
                </div>
                <h3 className="text-lg xs:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {step.title}
                </h3>
                <p className="text-sm xs:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Specialists */}
      <section className="py-8 xs:py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-900 w-full prevent-overflow">
        <div className="max-w-7xl mx-auto mobile-container prevent-overflow">
          <div className="text-center mb-8 xs:mb-12 sm:mb-16">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 px-2 xs:px-0">
              {t('featuredSpecialists.title')}
            </h2>
            <p className="text-base xs:text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-2 xs:px-0">
              {t('featuredSpecialists.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6 md:gap-8">
            {featuredSpecialists.map((specialist) => (
              <Link
                key={specialist.id}
                to={`/specialist/${specialist.id}`}
                className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-600 transition-all duration-300"
              >
                <div className="aspect-w-16 aspect-h-12">
                  <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <UserGroupIcon className="w-16 h-16 text-gray-400" />
                    {/* Online indicator if available in data */}
                    { (specialist as any).isOnline && (
                      <span className="absolute top-3 right-3 inline-flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-white"></span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-primary-600">
                    {specialist.name}
                  </h3>
                  <p className="text-gray-600 mb-3">{specialist.specialty}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1">
                      <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-semibold">{specialist.rating}</span>
                      <span className="text-gray-500 text-sm">({specialist.reviews})</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {specialist.location}
                      { (specialist as any).responseTime && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">
                          ~{(specialist as any).responseTime} {t('common.minutes') || 'min'}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">
                      {t('currency.from')} {formatPrice(specialist.startingPrice)}
                    </span>
                    <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/search"
              className="inline-flex items-center bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              {t('featuredSpecialists.viewAll')}
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* For Specialists Section */}
      <section id="for-specialists" className="py-8 xs:py-12 sm:py-16 lg:py-20 bg-primary-600 text-white w-full prevent-overflow">
        <div className="max-w-7xl mx-auto mobile-container prevent-overflow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xs:gap-12 items-center">
            <div className="px-2 xs:px-0">
              <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold mb-4 xs:mb-6">
                {t('forSpecialists.title')}
              </h2>
              <p className="text-base xs:text-lg sm:text-xl text-primary-100 mb-6 xs:mb-8 leading-relaxed">
                {t('forSpecialists.subtitle')}
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <CheckBadgeIcon className="w-6 h-6 text-secondary-300" />
                  <span className="text-lg">{t('forSpecialists.verifiedClients')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <ClockIcon className="w-6 h-6 text-secondary-300" />
                  <span className="text-lg">{t('forSpecialists.flexibleScheduling')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CreditCardIcon className="w-6 h-6 text-secondary-300" />
                  <span className="text-lg">{t('forSpecialists.securePayments')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <ShieldCheckIcon className="w-6 h-6 text-secondary-300" />
                  <span className="text-lg">{t('forSpecialists.professionalSupport')}</span>
                </div>
              </div>

              <Link
                to="/auth/register?type=specialist"
                className="inline-flex items-center bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                {t('forSpecialists.joinButton')}
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
            </div>

            <div className="relative">
              <div className="bg-white bg-opacity-10 rounded-xl p-8 backdrop-blur-sm">
                <h3 className="text-2xl font-semibold mb-6 text-center">
                  {t('forSpecialists.benefitsTitle')}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg">
                    <span>{t('forSpecialists.monthlyBookings')}</span>
                    <span className="font-bold">45+</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg">
                    <span>{t('forSpecialists.responseTime')}</span>
                    <span className="font-bold">&lt; 2 hours</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg">
                    <span>{t('forSpecialists.satisfaction')}</span>
                    <span className="font-bold">4.8/5 ⭐</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg">
                    <span>{t('forSpecialists.commission')}</span>
                    <span className="font-bold">{t('forSpecialists.commissionValue')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 xs:py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-900 w-full prevent-overflow">
        <div className="max-w-4xl mx-auto mobile-container prevent-overflow text-center">
          <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 px-2 xs:px-0">
            {t('cta.title')}
          </h2>
          <p className="text-base xs:text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6 xs:mb-8 px-2 xs:px-0">
            {user 
              ? t('cta.subtitle.loggedIn')
              : t('cta.subtitle.loggedOut')
            }
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                to="/search"
                className="bg-primary-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl text-center"
              >
                {t('cta.browseServices')}
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/register"
                  className="bg-primary-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl text-center"
                >
                  {t('cta.signUpCustomer')}
                </Link>
                <Link
                  to="/auth/register?type=specialist"
                  className="border-2 border-primary-500 text-primary-600 dark:text-primary-400 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300 text-center"
                >
                  {t('cta.joinSpecialist')}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
