import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { selectUser } from '@/store/slices/authSlice';
import { SearchBar } from '@/components/common/SearchBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { communityService, specialistService, serviceService, PostPreview } from '@/services';
import { locationService, CityData } from '@/services/location.service';
import { MagnifyingGlassIcon, StarIcon, ClockIcon, ShieldCheckIcon, UserGroupIcon, CalendarIcon, CreditCardIcon, ChatBubbleLeftRightIcon, SealCheckIcon as CheckBadgeIcon, ArrowRightIcon, SparklesIcon, HeartIcon, HouseIcon as HomeIcon, BriefcaseIcon, BookOpenIcon, RobotIcon, MapPinIcon } from '@/components/icons';

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

/* ------------------------------------------------------------------ */
/*  Scroll-triggered fade-in hook                                      */
/* ------------------------------------------------------------------ */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const [isLoading, setIsLoading] = useState(false);
  const [communityPosts, setCommunityPosts] = useState<PostPreview[]>([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [popularServicesLoading, setPopularServicesLoading] = useState(true);
  const [topSpecialists, setTopSpecialists] = useState<any[]>([]);
  const [specialistsLoading, setSpecialistsLoading] = useState(true);
  const [cities, setCities] = useState<CityData[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const howItWorksSteps = getHowItWorksSteps(t);

  // scroll reveal refs
  const catReveal = useScrollReveal();
  const howReveal = useScrollReveal();
  const specReveal = useScrollReveal();
  const citiesReveal = useScrollReveal();
  const commReveal = useScrollReveal();
  const forSpecReveal = useScrollReveal();
  const ctaReveal = useScrollReveal();
  const servicesReveal = useScrollReveal();

  /* ---- Load Google Fonts (Outfit + Work Sans) ---- */
  useEffect(() => {
    if (!document.querySelector('link[data-mz-fonts]')) {
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = 'https://fonts.googleapis.com';
      document.head.appendChild(preconnect);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Work+Sans:wght@300;400;500;600;700&display=swap';
      link.setAttribute('data-mz-fonts', '1');
      document.head.appendChild(link);
    }
  }, []);

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

    const loadPopularServices = async () => {
      try {
        setPopularServicesLoading(true);
        const services = await serviceService.getFeaturedServices(6);
        if (isMounted) setPopularServices(services);
      } catch {
        if (isMounted) setPopularServices([]);
      } finally {
        if (isMounted) setPopularServicesLoading(false);
      }
    };

    const loadCities = async () => {
      try {
        setCitiesLoading(true);
        const data = await locationService.getCities(undefined, 50);
        // Sort: cities with specialists first, then alphabetically
        const sorted = [...data].sort((a, b) => {
          if (a.specialistsCount !== b.specialistsCount) {
            return b.specialistsCount - a.specialistsCount;
          }
          return a.city.localeCompare(b.city, 'uk');
        });
        if (isMounted) setCities(sorted);
      } catch {
        if (isMounted) setCities([]);
      } finally {
        if (isMounted) setCitiesLoading(false);
      }
    };

    loadCommunityPreview();
    loadCategories();
    loadPopularServices();
    loadTopSpecialists();
    loadCities();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  /* helper for specialist display name */
  const getSpecialistName = (s: Record<string, unknown>) =>
    (s.businessName as string) ||
    [s.firstName, s.lastName].filter(Boolean).join(' ') ||
    'New Specialist';

  return (
    <div
      className="min-h-screen w-full prevent-overflow"
      style={{ fontFamily: "'Work Sans', 'Inter', system-ui, sans-serif" }}
    >
      {/* ====== Inline keyframes + homepage-scoped styles ====== */}
      <style>{`
        @keyframes aurora-drift {
          0%   { transform: translate(0,0)     scale(1);   opacity:.55; }
          33%  { transform: translate(60px,-40px) scale(1.15); opacity:.45; }
          66%  { transform: translate(-30px,30px) scale(.95); opacity:.6; }
          100% { transform: translate(0,0)     scale(1);   opacity:.55; }
        }
        @keyframes aurora-drift-2 {
          0%   { transform: translate(0,0)     scale(1);   opacity:.4; }
          50%  { transform: translate(-50px,50px) scale(1.2); opacity:.3; }
          100% { transform: translate(0,0)     scale(1);   opacity:.4; }
        }
        @keyframes aurora-drift-3 {
          0%   { transform: translate(0,0)     scale(1);   opacity:.35; }
          40%  { transform: translate(40px,30px)  scale(1.1); opacity:.5; }
          80%  { transform: translate(-20px,-20px) scale(.9); opacity:.3; }
          100% { transform: translate(0,0)     scale(1);   opacity:.35; }
        }
        @keyframes float-gentle {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-12px); }
        }
        .mz-heading {
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
        }
        .reveal-up {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s cubic-bezier(.22,.61,.36,1), transform 0.7s cubic-bezier(.22,.61,.36,1);
        }
        .reveal-up.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .hero-gradient-text {
          background: linear-gradient(135deg, #ffffff 0%, #bae6fd 40%, #7dd3fc 70%, #ffffff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .dark .hero-gradient-text {
          background: linear-gradient(135deg, #ffffff 0%, #7dd3fc 50%, #38bdf8 80%, #ffffff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .timeline-line {
          position: absolute;
          top: 28px;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #0284C7, #0EA5E9, #059669, #0EA5E9);
          border-radius: 2px;
        }
        @media (max-width: 1023px) {
          .timeline-line {
            top: 0;
            bottom: 0;
            left: 28px;
            right: auto;
            width: 3px;
            height: auto;
          }
        }
        .phone-mockup {
          width: 200px;
          height: 400px;
          border-radius: 28px;
          border: 3px solid rgba(255,255,255,0.3);
          background: linear-gradient(160deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%);
          backdrop-filter: blur(10px);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2);
          position: relative;
          overflow: hidden;
        }
        .phone-mockup::before {
          content: '';
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 6px;
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
        }
        .phone-mockup-card {
          margin: 6px 10px;
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.1);
        }
      `}</style>

      {/* ============================================================ */}
      {/*  HERO SECTION — Aurora mesh gradient background               */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden min-h-[92vh] sm:min-h-[85vh] lg:min-h-[80vh] flex items-center w-full prevent-overflow">
        {/* Aurora mesh background */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 30%, #0284C7 50%, #0ea5e9 75%, #0c4a6e 100%)',
        }}>
          {/* Animated gradient orbs */}
          <div className="absolute w-[250px] sm:w-[350px] md:w-[500px] h-[250px] sm:h-[350px] md:h-[500px] rounded-full pointer-events-none"
            style={{
              top: '-10%', right: '-5%',
              background: 'radial-gradient(circle, rgba(14,165,233,0.6) 0%, transparent 70%)',
              animation: 'aurora-drift 12s ease-in-out infinite',
              filter: 'blur(60px)',
            }}
          />
          <div className="absolute w-[200px] sm:w-[300px] md:w-[400px] h-[200px] sm:h-[300px] md:h-[400px] rounded-full pointer-events-none"
            style={{
              bottom: '-10%', left: '-5%',
              background: 'radial-gradient(circle, rgba(5,150,105,0.4) 0%, transparent 70%)',
              animation: 'aurora-drift-2 15s ease-in-out infinite',
              filter: 'blur(60px)',
            }}
          />
          <div className="absolute w-[350px] h-[350px] rounded-full pointer-events-none hidden lg:block"
            style={{
              top: '30%', left: '40%',
              background: 'radial-gradient(circle, rgba(56,189,248,0.35) 0%, transparent 70%)',
              animation: 'aurora-drift-3 18s ease-in-out infinite',
              filter: 'blur(50px)',
            }}
          />
          {/* Subtle noise overlay for texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }} />
        </div>

        <div className="relative w-full max-w-7xl mx-auto mobile-container py-16 sm:py-20 lg:py-24 prevent-overflow">
          <div className="text-center w-full prevent-overflow">
            {/* Main heading */}
            <h1 className="mz-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 sm:mb-6 leading-tight animate-fade-in px-2 sm:px-0 text-white">
              {t('hero.title1')}
              <br />
              <span className="hero-gradient-text">{t('hero.title2')}</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-sky-100/90 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
              {t('hero.subtitle')}
            </p>

            {/* Search Bar */}
            <div className="w-full max-w-2xl mx-auto mb-8 px-4 sm:px-0">
              <div className="relative">
                <SearchBar
                  placeholder={t('hero.searchPlaceholder')}
                  onSearch={handleSearch}
                  className="text-base sm:text-lg"
                />
              </div>
            </div>

            {/* Quick category pills */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-4 sm:px-0">
              <Link
                to="/search?category=beauty-wellness"
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium transition-all duration-250 text-sm sm:text-base whitespace-nowrap text-white/90 hover:text-white border border-white/20 hover:border-white/40 hover:bg-white/10"
                style={{ backdropFilter: 'blur(12px)' }}
              >
                {t('category.beautyWellness')}
              </Link>
              <Link
                to="/search?category=health-fitness"
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium transition-all duration-250 text-sm sm:text-base whitespace-nowrap text-white/90 hover:text-white border border-white/20 hover:border-white/40 hover:bg-white/10"
                style={{ backdropFilter: 'blur(12px)' }}
              >
                {t('category.healthFitness')}
              </Link>
              <Link
                to="/search?category=home-services"
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium transition-all duration-250 text-sm sm:text-base whitespace-nowrap text-white/90 hover:text-white border border-white/20 hover:border-white/40 hover:bg-white/10"
                style={{ backdropFilter: 'blur(12px)' }}
              >
                {t('category.homeServices')}
              </Link>
            </div>
          </div>
        </div>

        {/* Wave divider at bottom */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 40C240 70 480 80 720 60C960 40 1200 10 1440 30V80H0V40Z" className="fill-[#F0F9FF] dark:fill-gray-900" />
          </svg>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  CATEGORIES SECTION                                           */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-16 lg:py-20 w-full prevent-overflow bg-[#F0F9FF] dark:bg-gray-900">
        <div>
          <div
            ref={catReveal.ref}
            className={`w-full max-w-7xl mx-auto mobile-container prevent-overflow reveal-up ${catReveal.isVisible ? 'visible' : ''}`}
          >
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="mz-heading text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 px-2 sm:px-0">
                {t('categories.title')}
              </h2>
              <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto px-2 sm:px-0">
                {t('categories.subtitle')}
              </p>
            </div>

            {categoriesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={`cat-skel-${i}`} className="rounded-xl p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 mb-5 animate-pulse" />
                    <div className="h-5 w-3/4 bg-gray-100 dark:bg-gray-700 rounded mb-3 animate-pulse" />
                    <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded mb-5 animate-pulse" />
                    <div className="h-4 w-1/3 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : categories.length > 0 ? (
              <>
                {/* Mobile: horizontal scroll; Desktop: grid */}
                <div className="sm:hidden flex overflow-x-auto gap-3 pb-4 px-1 scrollbar-hide snap-x snap-mandatory -mx-3">
                  {categories.slice(0, 6).map((category: Record<string, unknown>) => {
                    const slug = (category.slug || category.id) as string;
                    const CategoryIcon = categoryIcons[slug] || SparklesIcon;
                    return (
                      <Link
                        key={category.id as string}
                        to={`/search?category=${slug}`}
                        className="group flex-none w-[220px] min-[400px]:w-[260px] snap-start bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 border-l-4 border-l-sky-500/50 p-4 min-[400px]:p-5 transition-all duration-250 hover:shadow-lg hover:shadow-sky-500/8 hover:-translate-y-0.5"
                      >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-sky-100 dark:bg-sky-900/30">
                          <CategoryIcon className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-sky-600 transition-colors duration-200">
                          {category.name as string}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                          {(category.description || '') as string}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          {category.serviceCount != null && (
                            <span className="text-sky-600 font-semibold px-2.5 py-0.5 bg-sky-50 dark:bg-sky-900/20 rounded-full text-xs">
                              {category.serviceCount as number} {t('services.count')}
                            </span>
                          )}
                          <ArrowRightIcon className="w-4 h-4 text-gray-300 group-hover:text-sky-500 transition-all duration-200 group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Desktop grid */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {categories.slice(0, 6).map((category: Record<string, unknown>, idx: number) => {
                    const slug = (category.slug || category.id) as string;
                    const CategoryIcon = categoryIcons[slug] || SparklesIcon;
                    return (
                      <Link
                        key={category.id as string}
                        to={`/search?category=${slug}`}
                        className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/60 border-l-4 border-l-sky-500/50 p-6 transition-all duration-250 hover:shadow-lg hover:shadow-sky-500/8 hover:-translate-y-1"
                        style={{ transitionDelay: `${idx * 50}ms` }}
                      >
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-sky-100 dark:bg-sky-900/30">
                          <CategoryIcon className="w-7 h-7 text-sky-600 dark:text-sky-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-sky-600 transition-colors duration-200">
                          {category.name as string}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed line-clamp-2">
                          {(category.description || '') as string}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          {category.serviceCount != null && (
                            <span className="text-sky-600 font-semibold px-3 py-1 bg-sky-50 dark:bg-sky-900/20 rounded-full text-xs">
                              {category.serviceCount as number} {t('services.count')}
                            </span>
                          )}
                          <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-sky-500 transition-all duration-200 group-hover:translate-x-1" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  HOW IT WORKS — Connected timeline                            */}
      {/* ============================================================ */}
      <section id="how-it-works" className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-900/80 w-full prevent-overflow">
        <div
          ref={howReveal.ref}
          className={`max-w-7xl mx-auto mobile-container prevent-overflow reveal-up ${howReveal.isVisible ? 'visible' : ''}`}
        >
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="mz-heading text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 px-2 sm:px-0">
              {t('howItWorks.title')}
            </h2>
            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto px-2 sm:px-0">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          {/* Desktop: horizontal timeline */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Connecting line */}
              <div className="timeline-line" />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 relative">
                {howItWorksSteps.map((step, index) => (
                  <div
                    key={step.step}
                    className="text-center pt-16"
                    style={{ transitionDelay: `${index * 120}ms` }}
                  >
                    {/* Circle on the line */}
                    <div className="absolute top-0 left-0 right-0 flex justify-center" style={{ left: `${index * 25}%`, width: '25%' }}>
                      <div className="w-14 h-14 rounded-full flex items-center justify-center relative z-10"
                        style={{
                          background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)',
                          boxShadow: '0 4px 14px rgba(2,132,199,0.3)',
                        }}
                      >
                        <step.icon className="w-6 h-6 text-white" />
                        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
                          {step.step}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 mz-heading">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs sm:max-w-[220px] mx-auto">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile/Tablet: vertical timeline */}
          <div className="lg:hidden">
            <div className="relative pl-14 sm:pl-16">
              {/* Vertical line */}
              <div className="absolute left-[26px] sm:left-[30px] top-0 bottom-0 w-[3px] rounded-full" style={{
                background: 'linear-gradient(180deg, #0284C7, #0EA5E9, #059669, #0EA5E9)',
              }} />

              <div className="space-y-8 sm:space-y-10">
                {howItWorksSteps.map((step) => (
                  <div key={step.step} className="relative">
                    {/* Circle */}
                    <div className="absolute -left-14 sm:-left-16 top-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center z-10"
                      style={{
                        background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)',
                        boxShadow: '0 4px 14px rgba(2,132,199,0.25)',
                      }}
                    >
                      <step.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                        {step.step}
                      </span>
                    </div>

                    <div className="pt-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 mz-heading">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  POPULAR SERVICES                                             */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-16 lg:py-20 w-full prevent-overflow bg-[#F0F9FF] dark:bg-gray-800">
        <div>
          <div
            ref={servicesReveal.ref}
            className={`max-w-7xl mx-auto mobile-container prevent-overflow reveal-up ${servicesReveal.isVisible ? 'visible' : ''}`}
          >
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="mz-heading text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 px-2 sm:px-0">
                {t('popularServices.title')}
              </h2>
              <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto px-2 sm:px-0">
                {t('popularServices.subtitle')}
              </p>
            </div>

            {popularServicesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 animate-pulse">
                    <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2 mb-4" />
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-16" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : popularServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {popularServices.map((service: any) => (
                  <Link
                    key={service.id}
                    to={`/booking/${service.id}`}
                    className="group bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700/60 transition-all duration-250 hover:shadow-lg hover:shadow-sky-500/6 hover:-translate-y-0.5"
                  >
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-3 truncate">
                      {service.specialist?.user?.firstName} {service.specialist?.user?.lastName}
                      {service.specialist?.isVerified && (
                        <CheckBadgeIcon className="w-3.5 h-3.5 inline ml-1 text-sky-500" />
                      )}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <StarIcon className="w-4 h-4 text-amber-400" active />
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {(service.specialist?.rating ?? service.rating ?? 0).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
                        <span className="flex items-center text-xs">
                          <ClockIcon className="w-3.5 h-3.5 mr-1" />
                          {service.duration} {t('time.minutes')}
                        </span>
                        <span className="font-semibold text-sky-600 dark:text-sky-400 text-sm">
                          {formatPrice(service.basePrice || service.price || 0, service.currency || 'USD')}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 sm:p-10 border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mx-auto mb-4">
                  <SparklesIcon className="w-8 h-8 text-sky-400 dark:text-sky-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 mz-heading">
                  {t('popularServices.comingSoon') || 'Coming Soon'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                  {t('popularServices.comingSoonDesc') || 'Specialists are adding their services. Check back soon or browse by category above!'}
                </p>
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 mt-5 text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold transition-colors text-sm"
                >
                  {t('categories.title') || 'Browse Categories'}
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURED SPECIALISTS                                         */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-900 w-full prevent-overflow">
        <div
          ref={specReveal.ref}
          className={`max-w-7xl mx-auto mobile-container prevent-overflow reveal-up ${specReveal.isVisible ? 'visible' : ''}`}
        >
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="mz-heading text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 px-2 sm:px-0">
              {t('featuredSpecialists.title')}
            </h2>
            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto px-2 sm:px-0">
              {t('featuredSpecialists.subtitle')}
            </p>
          </div>

          {specialistsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={`spec-skel-${i}`} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="w-full h-44 bg-gray-100 dark:bg-gray-700 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 w-2/3 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : topSpecialists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {topSpecialists.map((specialist: Record<string, unknown>) => {
                const displayName = getSpecialistName(specialist);
                return (
                  <Link
                    key={specialist.id as string}
                    to={`/specialist/${specialist.id}`}
                    className="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-xl overflow-hidden transition-all duration-250 hover:shadow-xl hover:shadow-sky-500/8 hover:-translate-y-1"
                  >
                    {/* Image + overlay gradient */}
                    <div className="relative w-full h-44 bg-gradient-to-br from-sky-100 to-sky-50 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden">
                      {specialist.avatar ? (
                        <img
                          src={specialist.avatar as string}
                          alt={displayName}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-sky-100 dark:bg-gray-600 flex items-center justify-center">
                          <UserGroupIcon className="w-10 h-10 text-sky-400 dark:text-gray-400" />
                        </div>
                      )}
                      {/* Bottom gradient overlay */}
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                      {/* Rating badge overlay */}
                      {specialist.averageRating && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{
                          background: 'rgba(0,0,0,0.45)',
                          backdropFilter: 'blur(8px)',
                        }}>
                          <StarIcon className="w-3.5 h-3.5 text-amber-400" active />
                          {(specialist.averageRating as number)?.toFixed(1)}
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors mz-heading">
                        {displayName}
                      </h3>
                      {specialist.specialties && (specialist.specialties as string[]).length > 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 truncate">{(specialist.specialties as string[])[0]}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {specialist.reviewCount != null && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              ({specialist.reviewCount as number} {t('community.comments') || 'reviews'})
                            </span>
                          )}
                        </div>
                        {specialist.city && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">{specialist.city as string}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-400 dark:text-gray-500 py-8">
              {t('featuredSpecialists.noSpecialists') || 'No specialists found yet. Be the first to join!'}
            </p>
          )}

          <div className="text-center mt-10">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-white transition-all duration-250 hover:shadow-lg hover:shadow-sky-500/25 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)' }}
            >
              {t('featuredSpecialists.viewAll')}
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  BROWSE BY CITY                                               */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-16 lg:py-20 w-full prevent-overflow bg-[#F0F9FF] dark:bg-gray-800">
        <div>
          <div
            ref={citiesReveal.ref}
            className={`max-w-7xl mx-auto mobile-container prevent-overflow reveal-up ${citiesReveal.isVisible ? 'visible' : ''}`}
          >
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="mz-heading text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 px-2 sm:px-0">
                {t('browseByCities.title')}
              </h2>
              <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto px-2 sm:px-0">
                {t('browseByCities.subtitle')}
              </p>
            </div>

            {citiesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 mb-3" />
                    <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : cities.length > 0 ? (
              <>
                {/* Mobile: horizontal scroll */}
                <div className="sm:hidden flex overflow-x-auto gap-3 pb-4 px-1 scrollbar-hide snap-x snap-mandatory -mx-3">
                  {cities.slice(0, 12).map((city) => {
                    const hasSpecialists = city.specialistsCount > 0;
                    return (
                    <Link
                      key={`${city.city}-${city.state}`}
                      to={`/search?location=${encodeURIComponent(city.city)}`}
                      className={`group flex-none w-[160px] snap-start rounded-xl border p-4 transition-all duration-250 hover:shadow-lg hover:-translate-y-0.5 ${
                        hasSpecialists
                          ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/60 hover:shadow-sky-500/8'
                          : 'bg-gray-50 dark:bg-gray-800/60 border-gray-100 dark:border-gray-700/40 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                        hasSpecialists
                          ? 'bg-sky-100 dark:bg-sky-900/30'
                          : 'bg-gray-100 dark:bg-gray-700/30'
                      }`}>
                        <MapPinIcon className={`w-5 h-5 ${
                          hasSpecialists
                            ? 'text-sky-600 dark:text-sky-400'
                            : 'text-gray-400 dark:text-gray-500'
                        }`} />
                      </div>
                      <h3 className={`text-sm font-semibold mb-1 group-hover:text-sky-600 transition-colors truncate ${
                        hasSpecialists
                          ? 'text-gray-900 dark:text-gray-100'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {city.city}
                      </h3>
                      {city.state && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 truncate">{city.state}{city.country ? `, ${city.country}` : ''}</p>
                      )}
                      <span className={`text-xs font-medium ${
                        hasSpecialists
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {city.specialistsCount} {t('browseByCities.specialists')}
                      </span>
                    </Link>
                    );
                  })}
                </div>

                {/* Desktop: grid */}
                <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {cities.slice(0, 8).map((city, idx) => {
                    const hasSpecialists = city.specialistsCount > 0;
                    return (
                    <Link
                      key={`${city.city}-${city.state}`}
                      to={`/search?location=${encodeURIComponent(city.city)}`}
                      className={`group rounded-xl border p-5 transition-all duration-250 hover:shadow-lg hover:-translate-y-1 ${
                        hasSpecialists
                          ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/60 hover:shadow-sky-500/8'
                          : 'bg-gray-50 dark:bg-gray-800/60 border-gray-100 dark:border-gray-700/40 opacity-75 hover:opacity-100'
                      }`}
                      style={{ transitionDelay: `${idx * 40}ms` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                          hasSpecialists
                            ? 'bg-sky-100 dark:bg-sky-900/30'
                            : 'bg-gray-100 dark:bg-gray-700/30'
                        }`}>
                          <MapPinIcon className={`w-5 h-5 ${
                            hasSpecialists
                              ? 'text-sky-600 dark:text-sky-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`} />
                        </div>
                        <ArrowRightIcon className="w-4 h-4 text-gray-300 group-hover:text-sky-500 transition-all duration-200 group-hover:translate-x-0.5 mt-1" />
                      </div>
                      <h3 className={`text-base font-semibold mb-1 group-hover:text-sky-600 transition-colors ${
                        hasSpecialists
                          ? 'text-gray-900 dark:text-gray-100'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {city.city}
                      </h3>
                      {city.state && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">{city.state}{city.country ? `, ${city.country}` : ''}</p>
                      )}
                      <span className={`font-semibold text-xs px-2.5 py-0.5 rounded-full ${
                        hasSpecialists
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20'
                          : 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/20'
                      }`}>
                        {city.specialistsCount} {t('browseByCities.specialists')}
                      </span>
                    </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 sm:p-10 border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mx-auto mb-4">
                  <MapPinIcon className="w-8 h-8 text-sky-400 dark:text-sky-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 mz-heading">
                  {t('browseByCities.noCities')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                  {t('browseByCities.noCitiesDesc')}
                </p>
              </div>
            )}

            {cities.length > 8 && (
              <div className="text-center mt-8">
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold transition-colors text-sm"
                >
                  {t('browseByCities.viewAll')}
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  COMMUNITY PREVIEW                                            */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-16 lg:py-20 w-full prevent-overflow bg-[#F0F9FF] dark:bg-gray-800">
        <div>
          <div
            ref={commReveal.ref}
            className={`max-w-7xl mx-auto mobile-container prevent-overflow reveal-up ${commReveal.isVisible ? 'visible' : ''}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-10">
              <div className="px-2 sm:px-0">
                <h2 className="mz-heading text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {t('community.title')}
                </h2>
                <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
                  {t('community.subtitle')}
                </p>
              </div>
              <Link
                to="/community"
                className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-250 hover:shadow-lg hover:shadow-sky-500/20 self-start sm:self-auto"
                style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)' }}
              >
                {t('community.viewAll')}
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>

            {communityLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`community-skeleton-${index}`}
                    className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="h-5 w-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4 animate-pulse" />
                    <div className="h-5 w-full bg-gray-100 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                    <div className="h-4 w-4/5 bg-gray-100 dark:bg-gray-700 rounded mb-4 animate-pulse" />
                    <div className="h-3 w-2/3 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : communityPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                {communityPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/community/post/${post.id}`}
                    className="group bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700/60 transition-all duration-250 hover:shadow-lg hover:shadow-sky-500/6 hover:-translate-y-0.5"
                  >
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        post.type === 'DISCUSSION'
                          ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400'
                          : post.type === 'RENT'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                      }`}
                    >
                      {post.type === 'DISCUSSION'
                        ? t('community.type.discussion')
                        : post.type === 'RENT'
                        ? (t('community.type.rent') || 'Rent')
                        : t('community.type.sale')}
                    </span>
                    <h3 className="font-semibold text-gray-900 dark:text-white mt-3 line-clamp-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                    {post.type === 'SALE' && post.price != null && (
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-3">
                        {post.price.toLocaleString()} {post.currency || 'UAH'}
                      </p>
                    )}
                    <div className="flex justify-between mt-4 text-xs text-gray-400 dark:text-gray-500">
                      <span>{post.author.firstName}</span>
                      <span>
                        {post.likeCount} {t('community.likes')} &middot; {post.commentCount} {t('community.comments')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 md:p-8 border border-gray-100 dark:border-gray-700 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {t('community.noPostsYet')}
                </p>
                <Link
                  to="/community"
                  className="inline-flex items-center text-sky-600 hover:text-sky-700 font-semibold transition-colors"
                >
                  {t('community.viewAll')}
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOR SPECIALISTS — Split layout + phone mockup                */}
      {/* ============================================================ */}
      <section id="for-specialists" className="relative py-14 sm:py-16 lg:py-24 w-full prevent-overflow overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, #0c4a6e 0%, #0284C7 40%, #0369a1 70%, #0c4a6e 100%)',
        }}>
          <div className="absolute w-[200px] sm:w-[300px] md:w-[400px] h-[200px] sm:h-[300px] md:h-[400px] rounded-full pointer-events-none"
            style={{
              top: '-15%', right: '10%',
              background: 'radial-gradient(circle, rgba(14,165,233,0.3) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
          <div className="absolute w-[150px] sm:w-[220px] md:w-[300px] h-[150px] sm:h-[220px] md:h-[300px] rounded-full pointer-events-none"
            style={{
              bottom: '-10%', left: '5%',
              background: 'radial-gradient(circle, rgba(5,150,105,0.25) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
        </div>

        <div
          ref={forSpecReveal.ref}
          className={`relative max-w-7xl mx-auto mobile-container prevent-overflow reveal-up ${forSpecReveal.isVisible ? 'visible' : ''}`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left content */}
            <div className="text-white px-2 sm:px-0">
              <h2 className="mz-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-5">
                {t('forSpecialists.title')}
              </h2>
              <p className="text-base sm:text-lg text-sky-100/80 mb-7 sm:mb-8 leading-relaxed max-w-lg">
                {t('forSpecialists.subtitle')}
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: CheckBadgeIcon, text: t('forSpecialists.verifiedClients') },
                  { icon: ClockIcon, text: t('forSpecialists.flexibleScheduling') },
                  { icon: CreditCardIcon, text: t('forSpecialists.securePayments') },
                  { icon: ShieldCheckIcon, text: t('forSpecialists.professionalSupport') },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }}>
                      <item.icon className="w-5 h-5 text-emerald-300" />
                    </div>
                    <span className="text-base sm:text-lg text-white/90">{item.text}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/auth/register?type=specialist"
                className="inline-flex items-center gap-2 bg-white text-sky-700 px-7 py-3 rounded-xl font-semibold transition-all duration-250 hover:bg-sky-50 hover:shadow-lg hover:shadow-white/15 hover:-translate-y-0.5"
              >
                {t('forSpecialists.joinButton')}
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>

            {/* Right side — Phone mockup + stats card */}
            <div className="relative flex justify-center items-center">
              {/* Phone mockup */}
              <div className="phone-mockup" style={{ animation: 'float-gentle 6s ease-in-out infinite' }}>
                {/* Notch area */}
                <div className="pt-7" />
                {/* Header */}
                <div className="mx-4 mb-3">
                  <p className="text-white/90 text-[10px] font-semibold tracking-wide">Manage Bookings</p>
                  <p className="text-white/50 text-[7px] mt-0.5">Today's Schedule</p>
                </div>
                {/* Booking card 1 */}
                <div className="phone-mockup-card" style={{ background: 'rgba(14,165,233,0.2)', borderColor: 'rgba(14,165,233,0.3)' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-sky-400/40 flex items-center justify-center">
                      <span className="text-white text-[7px] font-bold">AK</span>
                    </div>
                    <div>
                      <p className="text-white/90 text-[8px] font-medium leading-tight">Anna K.</p>
                      <p className="text-sky-300/70 text-[6px]">Haircut & Style</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-[7px]">10:00 AM</span>
                    <span className="text-[6px] font-semibold text-emerald-300 bg-emerald-400/20 px-1.5 py-0.5 rounded-full">Confirmed</span>
                  </div>
                </div>
                {/* Booking card 2 */}
                <div className="phone-mockup-card" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-amber-400/30 flex items-center justify-center">
                      <span className="text-white text-[7px] font-bold">DM</span>
                    </div>
                    <div>
                      <p className="text-white/90 text-[8px] font-medium leading-tight">David M.</p>
                      <p className="text-white/50 text-[6px]">Beard Trim</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-[7px]">11:30 AM</span>
                    <span className="text-[6px] font-semibold text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded-full">Pending</span>
                  </div>
                </div>
                {/* Action button */}
                <div className="mx-3 my-2">
                  <div className="h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.5), rgba(2,132,199,0.5))' }}>
                    <span className="text-white text-[8px] font-semibold">+ New Booking</span>
                  </div>
                </div>
                {/* Stats row */}
                <div className="phone-mockup-card" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-white font-bold text-[10px]">45+</p>
                      <p className="text-white/50 text-[5px]">Monthly</p>
                    </div>
                    <div className="text-center">
                      <p className="text-emerald-300 font-bold text-[10px]">4.8</p>
                      <p className="text-white/50 text-[5px]">Rating</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sky-300 font-bold text-[10px]">98%</p>
                      <p className="text-white/50 text-[5px]">On-time</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating stats card */}
              <div className="absolute -bottom-2 -left-2 sm:left-4 lg:-left-4 rounded-xl p-4 sm:p-5 max-w-xs sm:max-w-[220px] z-10"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}
              >
                <h4 className="text-white/90 text-sm font-semibold mb-3 mz-heading">
                  {t('forSpecialists.benefitsTitle')}
                </h4>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between text-white/80">
                    <span className="text-xs">{t('forSpecialists.monthlyBookings')}</span>
                    <span className="font-bold text-white text-xs">45+</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span className="text-xs">{t('forSpecialists.responseTime')}</span>
                    <span className="font-bold text-white text-xs">&lt; 2h</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span className="text-xs">{t('forSpecialists.satisfaction')}</span>
                    <span className="font-bold text-white text-xs">4.8/5</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span className="text-xs">{t('forSpecialists.commission')}</span>
                    <span className="font-bold text-emerald-300 text-xs">{t('forSpecialists.commissionValue')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FINAL CTA                                                    */}
      {/* ============================================================ */}
      <section className="py-14 sm:py-16 lg:py-20 bg-white dark:bg-gray-900 w-full prevent-overflow">
        <div
          ref={ctaReveal.ref}
          className={`max-w-3xl mx-auto mobile-container prevent-overflow text-center reveal-up ${ctaReveal.isVisible ? 'visible' : ''}`}
        >
          {/* Decorative gradient blob behind text */}
          <div className="relative">
            <div className="absolute inset-0 -top-8 -bottom-8 rounded-3xl opacity-[0.06] pointer-events-none" style={{
              background: 'radial-gradient(ellipse at center, #0284C7 0%, transparent 70%)',
            }} />

            <h2 className="mz-heading relative text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 px-2 sm:px-0">
              {t('cta.title')}
            </h2>
            <p className="relative text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-8 px-2 sm:px-0 max-w-xl mx-auto">
              {user
                ? t('cta.subtitle.loggedIn')
                : t('cta.subtitle.loggedOut')
              }
            </p>

            <div className="relative flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              {user ? (
                <Link
                  to="/search"
                  className="inline-flex items-center justify-center gap-2 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-250 hover:shadow-xl hover:shadow-sky-500/25 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)' }}
                >
                  {t('cta.browseServices')}
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth/register"
                    className="inline-flex items-center justify-center gap-2 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-250 hover:shadow-xl hover:shadow-sky-500/25 hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)' }}
                  >
                    {t('cta.signUpCustomer')}
                  </Link>
                  <Link
                    to="/auth/register?type=specialist"
                    className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-semibold border-2 border-sky-200 dark:border-sky-700 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all duration-250 hover:-translate-y-0.5"
                  >
                    {t('cta.joinSpecialist')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
