import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { selectUser } from '@/store/slices/authSlice';
import { SearchBar } from '@/components/common/SearchBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { communityService, specialistService, serviceService, PostPreview } from '@/services';
import { MagnifyingGlassIcon, StarIcon, ClockIcon, ShieldCheckIcon, UserGroupIcon, CalendarIcon, CreditCardIcon, ChatBubbleLeftRightIcon, SealCheckIcon as CheckBadgeIcon, ArrowRightIcon, SparklesIcon, HeartIcon, HouseIcon as HomeIcon, BriefcaseIcon, BookOpenIcon, RobotIcon } from '@/components/icons';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'beauty-wellness': SparklesIcon,
  'health-fitness': HeartIcon,
  'home-services': HomeIcon,
  'professional-services': BriefcaseIcon,
  'education': BookOpenIcon,
  'technology': RobotIcon,
};

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
  const [communityPosts, setCommunityPosts] = useState<PostPreview[]>([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [topSpecialists, setTopSpecialists] = useState<any[]>([]);
  const [specialistsLoading, setSpecialistsLoading] = useState(true);
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const howItWorksSteps = getHowItWorksSteps(t);
  const stats = getStats(t);

  useEffect(() => {
    let isMounted = true;

    const loadCommunityPreview = async () => {
      try {
        setCommunityLoading(true);
        const posts = await communityService.getPostsPreview(3);
        if (isMounted) setCommunityPosts(posts);
      } catch {
        if (isMounted) setCommunityPosts([]);
      } finally {
        if (isMounted) setCommunityLoading(false);
      }
    };

    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const data = await serviceService.getCategories();
        if (isMounted) setCategories(data);
      } catch {
        if (isMounted) setCategories([]);
      } finally {
        if (isMounted) setCategoriesLoading(false);
      }
    };

    const loadTopSpecialists = async () => {
      try {
        setSpecialistsLoading(true);
        const result = await specialistService.searchSpecialists('', {
          rating: 4,
          limit: 3,
        });
        if (isMounted) setTopSpecialists(result.specialists || []);
      } catch {
        if (isMounted) setTopSpecialists([]);
      } finally {
        if (isMounted) setSpecialistsLoading(false);
      }
    };

    loadCommunityPreview();
    loadCategories();
    loadTopSpecialists();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen w-full prevent-overflow">
      {/* Hero Section */}
      <section className="relative bg-primary-500 text-white overflow-hidden min-h-[100vh] xs:min-h-[90vh] sm:min-h-[85vh] lg:min-h-[80vh] flex items-center w-full prevent-overflow">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        
        {/* Animated background elements - hide on mobile, contained within section */}
        <div className="hidden lg:block absolute top-20 right-20 w-32 h-32 rounded-full morph-shape opacity-20 float-animation pointer-events-none"></div>
        <div className="hidden lg:block absolute bottom-20 left-20 w-48 h-48 rounded-full bg-white/10 animate-pulse pointer-events-none"></div>
        <div className="hidden lg:block absolute top-1/2 right-1/4 w-16 h-16 bg-primary-500 rounded-full animate-bounce pointer-events-none"></div>
        
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
                className="glass-effect text-white px-3 xs:px-4 sm:px-6 py-2 xs:py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 hover:glow-primary text-xs xs:text-sm sm:text-base whitespace-nowrap"
              >
                {t('category.beautyWellness')}
              </Link>
              <Link
                to="/search?category=health-fitness"
                className="glass-effect text-white px-3 xs:px-4 sm:px-6 py-2 xs:py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 hover:glow-primary text-xs xs:text-sm sm:text-base whitespace-nowrap"
              >
                {t('category.healthFitness')}
              </Link>
              <Link
                to="/search?category=home-services"
                className="glass-effect text-white px-3 xs:px-4 sm:px-6 py-2 xs:py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 hover:glow-primary text-xs xs:text-sm sm:text-base whitespace-nowrap"
              >
                {t('category.homeServices')}
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 max-w-4xl mx-auto px-2 xs:px-0">
              {stats.map((stat, index) => (
                <div
                  key={index} 
                  className="glass-effect text-center p-3 xs:p-4 sm:p-6 transition-all duration-300 rounded-xl border border-white/20"
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

        {/* Decorative elements - clipped by parent overflow-hidden */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary-500 opacity-20 transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-secondary-500 opacity-10 transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
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

          {categoriesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6 md:gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`cat-skel-${i}`} className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-700 mb-6 animate-pulse" />
                  <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" />
                  <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6 md:gap-8">
              {categories.slice(0, 6).map((category: Record<string, unknown>) => {
                const slug = category.slug || category.id;
                const CategoryIcon = categoryIcons[slug] || SparklesIcon;
                return (
                  <Link
                    key={category.id}
                    to={`/search?category=${slug}`}
                    className="group relative overflow-hidden rounded-2xl transition-all duration-300 block h-full"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                    }}
                  >
                    <div className="absolute inset-0 bg-white/5 dark:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative p-4 xs:p-6 sm:p-8">
                      <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 transition-transform duration-300">
                        <CategoryIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-primary-600 transition-all duration-300">
                        {category.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                        {category.description || ''}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        {category.serviceCount != null && (
                          <span className="text-primary-600 font-semibold px-3 py-1 bg-primary-50 dark:bg-primary-900/30 rounded-full">
                            {category.serviceCount} {t('services.count')}
                          </span>
                        )}
                        <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-all duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : null}
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

          {specialistsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6 md:gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={`spec-skel-${i}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="p-6 space-y-3">
                    <div className="h-6 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : topSpecialists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6 md:gap-8">
              {topSpecialists.map((specialist: Record<string, unknown>) => (
                <Link
                  key={specialist.id}
                  to={`/specialist/${specialist.id}`}
                  className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-600 transition-all duration-300"
                >
                  <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {specialist.avatar ? (
                      <img src={specialist.avatar} alt={specialist.businessName || `${specialist.firstName} ${specialist.lastName}`} className="w-full h-full object-cover" />
                    ) : (
                      <UserGroupIcon className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600">
                      {specialist.businessName || `${specialist.firstName} ${specialist.lastName}`}
                    </h3>
                    {specialist.specialties && specialist.specialties.length > 0 && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">{specialist.specialties[0]}</p>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-1">
                        <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="font-semibold">{specialist.averageRating?.toFixed(1) || '—'}</span>
                        {specialist.reviewCount != null && (
                          <span className="text-gray-500 text-sm">({specialist.reviewCount})</span>
                        )}
                      </div>
                      {specialist.city && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">{specialist.city}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-end">
                      <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t('featuredSpecialists.noSpecialists') || 'No specialists found yet. Be the first to join!'}
            </p>
          )}

          <div className="text-center mt-12">
            <Link
              to="/search"
              className="inline-flex items-center bg-primary-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              {t('featuredSpecialists.viewAll')}
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Community Preview Section */}
      <section className="py-8 xs:py-12 sm:py-16 lg:py-20 bg-gray-50 dark:bg-gray-800/50 w-full prevent-overflow">
        <div className="max-w-7xl mx-auto mobile-container prevent-overflow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 xs:mb-10">
            <div className="px-2 xs:px-0">
              <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {t('community.title')}
              </h2>
              <p className="text-base xs:text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
                {t('community.subtitle')}
              </p>
            </div>
            <Link
              to="/community"
              className="mt-4 sm:mt-0 inline-flex items-center bg-primary-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              {t('community.viewAll')}
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
          </div>

          {communityLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xs:gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`community-skeleton-${index}`}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
                  <div className="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : communityPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xs:gap-6">
              {communityPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/community/post/${post.id}`}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-600 transition-all duration-300"
                >
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      post.type === 'DISCUSSION'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {post.type === 'DISCUSSION' ? t('community.type.discussion') : t('community.type.sale')}
                  </span>
                  <h3 className="font-semibold text-gray-900 dark:text-white mt-3 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                    {post.excerpt}
                  </p>
                  {post.type === 'SALE' && post.price != null && (
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-3">
                      {post.price.toLocaleString()} {post.currency || 'UAH'}
                    </p>
                  )}
                  <div className="flex justify-between mt-4 text-xs text-gray-400 dark:text-gray-500">
                    <span>{post.author.firstName}</span>
                    <span>
                      {post.likeCount} {t('community.likes')} • {post.commentCount} {t('community.comments')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('community.noPostsYet')}
              </p>
              <Link
                to="/community"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold"
              >
                {t('community.viewAll')}
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Link>
            </div>
          )}
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
                className="inline-flex items-center bg-white text-primary-700 px-8 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
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
                  <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-xl">
                    <span>{t('forSpecialists.monthlyBookings')}</span>
                    <span className="font-bold">45+</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-xl">
                    <span>{t('forSpecialists.responseTime')}</span>
                    <span className="font-bold">&lt; 2 hours</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-xl">
                    <span>{t('forSpecialists.satisfaction')}</span>
                    <span className="font-bold">4.8/5 ⭐</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-xl">
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
                className="bg-primary-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 hover:shadow-xl text-center"
              >
                {t('cta.browseServices')}
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/register"
                  className="bg-primary-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 hover:shadow-xl text-center"
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
