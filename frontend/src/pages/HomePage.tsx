import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { selectUser } from '@/store/slices/authSlice';
import { SearchBar } from '@/components/common/SearchBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  MagnifyingGlassIcon,
  StarIcon,
  ClockIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CalendarIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
} from '@/components/icons';

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
    <div className="min-h-screen w-full prevent-overflow bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[95vh] xs:min-h-[88vh] sm:min-h-[82vh] flex items-center w-full prevent-overflow bg-gray-50 dark:bg-gray-900">

        <div className="relative w-full max-w-7xl mx-auto mobile-container py-14 xs:py-18 sm:py-22 lg:py-24 prevent-overflow">
          <div className="text-center w-full prevent-overflow">
            {/* Badge with icon */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-panhaha-gradient text-white text-xs font-bold tracking-wider uppercase mb-6 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 transition-all duration-200">
              <StarIcon className="w-4 h-4 animate-pulse" />
              {t('hero.badge')}
            </div>

            {/* Main heading with better contrast */}
            <h1 className="font-display text-3xl xs:text-4xl sm:text-5xl md:text-6xl leading-tight font-bold mb-6 xs:mb-8 animate-fade-in px-3 xs:px-6 text-secondary-900 dark:text-white">
              {t('hero.title1')}
              <span className="block mt-2 text-2xl xs:text-3xl sm:text-4xl md:text-5xl bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                {t('hero.title2')}
              </span>
            </h1>

            {/* Subtitle with better visibility */}
            <p className="text-base xs:text-lg sm:text-xl md:text-2xl text-secondary-600 dark:text-secondary-300 mb-8 xs:mb-10 sm:mb-14 max-w-3xl mx-auto leading-relaxed px-3 xs:px-6 font-medium">
              {t('hero.subtitle')}
            </p>

            {/* Search Bar */}
            <div className="w-full max-w-2xl mx-auto mb-10 px-4 sm:px-0">
              <div className="glass-card rounded-2xl border border-[rgba(223,214,207,0.45)] dark:border-[rgba(90,70,110,0.55)] shadow-lg">
                <SearchBar
                  placeholder={t('hero.searchPlaceholder')}
                  onSearch={handleSearch}
                  className="text-base sm:text-lg"
                />
              </div>
            </div>

            {/* Quick Actions with Icons */}
            <div className="flex flex-wrap justify-center gap-2 xs:gap-3 sm:gap-4 mb-8 xs:mb-10 sm:mb-14 px-3 xs:px-6">
              <Link
                to="/search?category=beauty-wellness"
                className="group relative inline-flex items-center gap-2 rounded-xl px-5 xs:px-6 sm:px-7 py-3 font-semibold text-white text-xs xs:text-sm sm:text-base whitespace-nowrap shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-1 hover:scale-105 transition-all duration-200 bg-primary-gradient overflow-hidden"
              >
                <span className="text-lg">💄</span>
                <span>{t('category.beautyWellness')}</span>
                <ArrowRightIcon className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </Link>
              <Link
                to="/search?category=health-fitness"
                className="group relative inline-flex items-center gap-2 rounded-xl px-5 xs:px-6 sm:px-7 py-3 font-semibold text-white text-xs xs:text-sm sm:text-base whitespace-nowrap shadow-lg shadow-accent-500/30 hover:shadow-xl hover:shadow-accent-500/40 hover:-translate-y-1 hover:scale-105 transition-all duration-200 bg-accent-gradient overflow-hidden"
              >
                <span className="text-lg">💪</span>
                <span>{t('category.healthFitness')}</span>
                <ArrowRightIcon className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </Link>
              <Link
                to="/search?category=home-services"
                className="group relative inline-flex items-center gap-2 rounded-xl px-5 xs:px-6 sm:px-7 py-3 font-semibold text-secondary-900 dark:text-white text-xs xs:text-sm sm:text-base whitespace-nowrap shadow-lg backdrop-blur-xl bg-white/60 dark:bg-white/10 border border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/20 hover:-translate-y-1 hover:scale-105 transition-all duration-200 overflow-hidden"
              >
                <span className="text-lg">🏠</span>
                <span>{t('category.homeServices')}</span>
                <ArrowRightIcon className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 max-w-4xl mx-auto px-2 xs:px-0">
              {stats.map((stat, index) => {
                const isPrimary = index % 2 === 0;
                return (
                  <div
                    key={index}
                    className="backdrop-blur-xl bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/10 text-center p-5 xs:p-6 sm:p-7 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 rounded-2xl group"
                  >
                    <div className={`w-12 h-12 xs:w-14 xs:h-14 mx-auto mb-4 rounded-xl flex items-center justify-center ${isPrimary ? 'bg-primary-500/10' : 'bg-accent-500/10'} group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className={`w-6 h-6 xs:w-7 xs:h-7 ${isPrimary ? 'text-primary-500' : 'text-accent-500'}`} />
                    </div>
                    <div className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-2 text-secondary-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm xs:text-base font-medium text-secondary-600 dark:text-secondary-300">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-12 xs:py-16 sm:py-24 w-full prevent-overflow bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-7xl mx-auto mobile-container prevent-overflow">
          <div className="text-center mb-10 xs:mb-14 sm:mb-18">
            <h2 className="font-display text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 px-2 xs:px-0">
              {t('categories.title')}
            </h2>
            <p className="text-base xs:text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-2 xs:px-0">
              {t('categories.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6 md:gap-8">
            {serviceCategories.map((category, index) => (
              <Link
                key={category.id}
                to={category.href}
                className="group backdrop-blur-xl bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-lg p-6 xs:p-7 sm:p-8 rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300 block h-full"
              >
                <div className="text-5xl mb-6 transition-transform duration-300 group-hover:scale-110">
                  {category.icon}
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3 group-hover:bg-gradient-to-r group-hover:from-primary-500 group-hover:to-secondary-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  {category.name}
                </h3>
                <p className="text-secondary-600 dark:text-secondary-300 mb-6 leading-relaxed">
                  {category.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-semibold px-4 py-2 rounded-full shadow-sm ${
                    index % 2 === 0
                      ? 'text-white bg-primary-500 shadow-primary-500/30'
                      : 'text-white bg-accent-500 shadow-accent-500/30'
                  }`}>
                    {category.serviceCount} {t('services.count')}
                  </span>
                  <ArrowRightIcon className="w-5 h-5 text-secondary-400 group-hover:text-accent-500 transition-all duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 xs:py-16 sm:py-20 lg:py-24 bg-white dark:bg-gray-800 w-full prevent-overflow">
        <div className="max-w-7xl mx-auto mobile-container prevent-overflow">
          <div className="text-center mb-10 xs:mb-14 sm:mb-18">
            <h2 className="font-display text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 px-2 xs:px-0">
              {t('howItWorks.title')}
            </h2>
            <p className="text-base xs:text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-2 xs:px-0">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xs:gap-8">
            {howItWorksSteps.map((step, index) => (
              <div key={step.step} className="text-center">
                <div className="relative mb-6 xs:mb-8">
                  <div className={`w-14 h-14 xs:w-18 xs:h-18 rounded-2xl flex items-center justify-center mx-auto mb-4 relative ${
                    index % 2 === 0
                      ? 'bg-primary-500'
                      : 'bg-accent-500'
                  }`}>
                    <step.icon className="w-7 h-7 xs:w-9 xs:h-9 text-white" />
                    <div className={`absolute -top-2 -right-2 w-8 h-8 xs:w-9 xs:h-9 rounded-full flex items-center justify-center text-sm xs:text-base font-bold shadow-lg border-3 ${
                      index % 2 === 0
                        ? 'bg-white text-accent-500 border-accent-500'
                        : 'bg-white text-primary-500 border-primary-500'
                    }`}>
                      {step.step}
                    </div>
                  </div>
                </div>
                <h3 className="text-lg xs:text-xl font-bold text-secondary-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-sm xs:text-base text-secondary-600 dark:text-secondary-300 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Specialists */}
      <section className="py-10 xs:py-14 sm:py-18 lg:py-20 bg-gray-50 dark:bg-gray-900 w-full prevent-overflow">
        <div className="max-w-7xl mx-auto mobile-container prevent-overflow">
          <div className="text-center mb-8 xs:mb-12 sm:mb-16">
            <h2 className="font-display text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold text-secondary-900 dark:text-white mb-4 px-2 xs:px-0">
              {t('featuredSpecialists.title')}
            </h2>
            <p className="text-base xs:text-lg sm:text-xl text-secondary-600 dark:text-secondary-300 max-w-3xl mx-auto px-2 xs:px-0">
              {t('featuredSpecialists.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6 md:gap-8">
            {featuredSpecialists.map((specialist) => (
              <Link
                key={specialist.id}
                to={`/specialist/${specialist.id}`}
                className="group backdrop-blur-xl bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-lg rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-w-16 aspect-h-12">
                  <div className="relative w-full h-48 bg-primary-500/5 dark:bg-accent-500/10 flex items-center justify-center">
                    <UserGroupIcon className="w-16 h-16 text-primary-500/50" />
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
                  <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-1 group-hover:text-primary-500 transition-colors duration-300">
                    {specialist.name}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-300 mb-3">{specialist.specialty}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1">
                      <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-semibold text-secondary-900 dark:text-white">{specialist.rating}</span>
                      <span className="text-secondary-500 dark:text-secondary-400 text-sm">({specialist.reviews})</span>
                    </div>
                    <span className="text-sm text-secondary-500 dark:text-secondary-400">
                      {specialist.location}
                      { (specialist as any).responseTime && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-accent-500/10 text-accent-500">
                          ~{(specialist as any).responseTime} {t('common.minutes') || 'min'}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-secondary-900 dark:text-white">
                      {t('currency.from')} {formatPrice(specialist.startingPrice)}
                    </span>
                    <ArrowRightIcon className="w-5 h-5 text-secondary-400 group-hover:text-primary-500 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/search"
              className="inline-flex items-center bg-accent-gradient text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg shadow-accent-500/30 hover:shadow-xl hover:shadow-accent-500/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              {t('featuredSpecialists.viewAll')}
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* For Specialists Section */}
      <section id="for-specialists" className="relative py-12 xs:py-16 sm:py-20 lg:py-24 bg-primary-gradient text-white w-full prevent-overflow overflow-hidden">
        <div className="relative max-w-7xl mx-auto mobile-container prevent-overflow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xs:gap-12 items-center">
            <div className="px-2 xs:px-0">
              <h2 className="font-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-semibold mb-4 xs:mb-6">
                {t('forSpecialists.title')}
              </h2>
              <p className="text-base xs:text-lg sm:text-xl text-white/90 mb-6 xs:mb-8 leading-relaxed">
                {t('forSpecialists.subtitle')}
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckBadgeIcon className="w-6 h-6 text-white/90" />
                  <span className="text-lg font-medium">{t('forSpecialists.verifiedClients')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-6 h-6 text-white/90" />
                  <span className="text-lg font-medium">{t('forSpecialists.flexibleScheduling')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCardIcon className="w-6 h-6 text-white/90" />
                  <span className="text-lg font-medium">{t('forSpecialists.securePayments')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="w-6 h-6 text-white/90" />
                  <span className="text-lg font-medium">{t('forSpecialists.professionalSupport')}</span>
                </div>
              </div>

              <Link
                to="/auth/register?type=specialist"
                className="inline-flex items-center bg-white text-primary-500 px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                {t('forSpecialists.joinButton')}
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
            </div>

            <div className="relative">
              <div className="bg-white/15 rounded-2xl p-8 backdrop-blur-md border border-white/10 shadow-xl">
                <h3 className="text-2xl font-semibold mb-6 text-center">
                  {t('forSpecialists.benefitsTitle')}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/15 rounded-xl">
                    <span>{t('forSpecialists.monthlyBookings')}</span>
                    <span className="font-bold">45+</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/15 rounded-xl">
                    <span>{t('forSpecialists.responseTime')}</span>
                    <span className="font-bold">&lt; 2 hours</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/15 rounded-xl">
                    <span>{t('forSpecialists.satisfaction')}</span>
                    <span className="font-bold">4.8/5 ⭐</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/15 rounded-xl">
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
      <section className="py-12 xs:py-16 sm:py-20 lg:py-24 bg-gray-50 dark:bg-gray-900 w-full prevent-overflow">
        <div className="max-w-4xl mx-auto mobile-container prevent-overflow text-center">
          <h2 className="font-display text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold text-secondary-900 dark:text-white mb-4 px-2 xs:px-0">
            {t('cta.title')}
          </h2>
          <p className="text-base xs:text-lg sm:text-xl text-secondary-600 dark:text-secondary-300 mb-6 xs:mb-8 px-2 xs:px-0">
            {user
              ? t('cta.subtitle.loggedIn')
              : t('cta.subtitle.loggedOut')
            }
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                to="/search"
                className="bg-accent-gradient text-white px-12 py-5 rounded-full text-xl font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl shadow-lg shadow-accent-500/30 hover:shadow-accent-500/40 text-center"
              >
                {t('cta.browseServices')}
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/register"
                  className="bg-accent-gradient text-white px-12 py-5 rounded-full text-xl font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl shadow-lg shadow-accent-500/30 hover:shadow-accent-500/40 text-center"
                >
                  {t('cta.signUpCustomer')}
                </Link>
                <Link
                  to="/auth/register?type=specialist"
                  className="bg-white border-3 border-primary-500 text-primary-500 px-12 py-5 rounded-full text-xl font-bold hover:bg-primary-500 hover:text-white transition-all duration-300 text-center shadow-lg"
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
