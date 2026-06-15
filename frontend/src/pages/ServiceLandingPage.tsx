/**
 * ServiceLandingPage — programmatic SEO landing for service × city combinations.
 * Routes:  /services/:serviceSlug
 *          /services/:serviceSlug/:citySlug
 *
 * Data sources:
 *   - SERVICES / CITIES arrays (typed as SeoService[] / SeoCity[]) from seoData files
 *   - specialistService.searchSpecialists() for live results
 *
 * Design: mobile-first, matches app card / button conventions from HomePage.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import PublicSeo from '@/components/common/PublicSeo';
import {
  prune,
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
} from '@/utils/structuredData';
import { specialistService } from '@/services/specialist.service';
import { pick, type SeoService, type SeoCity, type Lang } from '@/data/seo.types';
import {
  StarIcon,
  MapPinIcon,
  ArrowRightIcon,
  SparklesIcon,
  UserPlusIcon,
  ChevronRightIcon,
} from '@/components/icons';

// ---------------------------------------------------------------------------
// Lazy data imports — these files may not exist at tsc-check time, so we
// import them with the type assertions the compiler already knows from seo.types.ts.
// The arrays are accessed only at runtime.
// ---------------------------------------------------------------------------
import { SERVICES } from '../data/seoServices';
import { CITIES } from '../data/seoCities';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SITE_URL = 'https://miyzapis.com';

/** Trim text to ~maxLen chars at a word boundary, append '…' if truncated. */
function trimToLength(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const cut = text.lastIndexOf(' ', maxLen);
  return (cut > 0 ? text.slice(0, cut) : text.slice(0, maxLen)) + '…';
}

/** Derive a display name from a specialist object (matches pattern in HomePage). */
function specilaistDisplayName(s: Record<string, unknown>): string {
  const biz = s.businessName as string | undefined;
  if (biz) return biz;
  const first = (s.firstName as string) || (s.user as any)?.firstName || '';
  const last = (s.lastName as string) || (s.user as any)?.lastName || '';
  return [first, last].filter(Boolean).join(' ') || 'Майстер';
}

/** Return up to `max` cities, excluding the currently-active one. */
function otherCities(allCities: SeoCity[], activeSlug?: string, max = 8): SeoCity[] {
  return allCities.filter((c: SeoCity) => c.slug !== activeSlug).slice(0, max);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Skeleton card shown while specialists load. */
const SpecialistSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <div className="h-14 w-14 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
  </div>
);

// ---------------------------------------------------------------------------
// Accordion FAQ item
// ---------------------------------------------------------------------------
const FaqItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        aria-expanded={open}
      >
        <span>{question}</span>
        <ChevronRightIcon
          className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open && (
        <div className="pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ServiceLandingPage: React.FC = () => {
  const { serviceSlug, citySlug } = useParams<{
    serviceSlug: string;
    citySlug?: string;
  }>();
  const { t, language } = useLanguage();
  const lang = (language as Lang) || 'uk';

  // ------------------------------------------------------------------
  // Resolve service + city from static data
  // ------------------------------------------------------------------
  const service: SeoService | undefined = SERVICES.find((s: SeoService) => s.slug === serviceSlug);

  // Unknown service → hard redirect to /search
  if (!service) {
    return <Navigate to="/search" replace />;
  }

  // Unknown city → treat as no-city (render service-only page)
  const city: SeoCity | undefined = citySlug
    ? CITIES.find((c: SeoCity) => c.slug === citySlug) ?? undefined
    : undefined;

  // ------------------------------------------------------------------
  // Specialist data
  // ------------------------------------------------------------------
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    specialistService
      .searchSpecialists(service.query, {
        location: city ? pick(city.name, 'en') : undefined,
        limit: 24,
      })
      .then((res) => {
        if (!cancelled) setSpecialists(res.specialists || []);
      })
      .catch(() => {
        if (!cancelled) setSpecialists([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [service.slug, city?.slug]);

  // ------------------------------------------------------------------
  // SEO strings
  // ------------------------------------------------------------------
  const serviceName = pick(service.name, lang);
  const cityLocative = city ? pick(city.locative, lang) : '';

  const pageTitle = city
    ? `${serviceName} ${cityLocative} — МійЗапис`
    : `${serviceName} — знайти майстра онлайн | МійЗапис`;

  const rawDescription = `${pick(service.tagline, lang)} ${pick(service.intro, lang)}`;
  const pageDescription = trimToLength(rawDescription, 150);

  const pageUrl = city
    ? `${SITE_URL}/services/${service.slug}/${city.slug}`
    : `${SITE_URL}/services/${service.slug}`;

  // ------------------------------------------------------------------
  // JSON-LD
  // ------------------------------------------------------------------
  const breadcrumbItems = [
    { name: t('nav.home') || 'Головна', url: `${SITE_URL}/` },
    { name: t('nav.search') || 'Пошук', url: `${SITE_URL}/search` },
    { name: serviceName, url: `${SITE_URL}/services/${service.slug}` },
    ...(city
      ? [{ name: pick(city.name, lang), url: pageUrl }]
      : []),
  ];

  const faqJsonLd = service.faqs.length > 0
    ? prune({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: service.faqs.map((faq) => ({
          '@type': 'Question',
          name: pick(faq.q, lang),
          acceptedAnswer: {
            '@type': 'Answer',
            text: pick(faq.a, lang),
          },
        })),
      })
    : null;

  const itemListJsonLd =
    specialists.length > 0
      ? buildItemListJsonLd(
          specialists.map((s) => ({
            name: specilaistDisplayName(s),
            url: `${SITE_URL}/s/${(s.slug as string) || (s.id as string)}`,
            image: (s.avatar as string) || (s.user as any)?.avatar,
          })),
        )
      : null;

  const serviceJsonLd = prune({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceName,
    description: pick(service.intro, lang),
    areaServed: city ? pick(city.name, lang) : 'Ukraine',
    provider: {
      '@type': 'Organization',
      name: 'МійЗапис',
      url: SITE_URL,
    },
  });

  const combinedJsonLd = prune({
    '@context': 'https://schema.org',
    '@graph': [
      serviceJsonLd,
      buildBreadcrumbJsonLd(breadcrumbItems),
      ...(faqJsonLd ? [faqJsonLd] : []),
      ...(itemListJsonLd ? [itemListJsonLd] : []),
    ],
  });

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  const h1Text = city ? `${serviceName} ${cityLocative}` : `${serviceName} — знайти майстра`;

  const relatedCities = otherCities(CITIES, city?.slug);
  const relatedServices = service.related
    .map((slug: string) => SERVICES.find((s: SeoService) => s.slug === slug))
    .filter((s): s is SeoService => !!s)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 w-full">
      <PublicSeo
        title={pageTitle}
        description={pageDescription}
        url={pageUrl}
        type="website"
        jsonLd={combinedJsonLd}
      />

      {/* ================================================================ */}
      {/* HERO / HEADER                                                     */}
      {/* ================================================================ */}
      <section className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-6 flex-wrap" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary-600 transition-colors">
              {t('nav.home') || 'Головна'}
            </Link>
            <ChevronRightIcon className="w-3 h-3 flex-shrink-0" />
            <Link to="/search" className="hover:text-primary-600 transition-colors">
              {t('nav.search') || 'Пошук'}
            </Link>
            <ChevronRightIcon className="w-3 h-3 flex-shrink-0" />
            <Link to={`/services/${service.slug}`} className="hover:text-primary-600 transition-colors">
              {serviceName}
            </Link>
            {city && (
              <>
                <ChevronRightIcon className="w-3 h-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {pick(city.name, lang)}
                </span>
              </>
            )}
          </nav>

          <div className="flex items-start gap-4">
            <span className="text-4xl sm:text-5xl leading-none select-none flex-shrink-0" aria-hidden="true">
              {service.emoji}
            </span>
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight mb-3">
                {h1Text}
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                {pick(service.tagline, lang)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* INTRO + WHAT TO EXPECT + PRICE HINT                               */}
      {/* ================================================================ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 grid sm:grid-cols-3 gap-8">
        {/* Intro + What to expect */}
        <div className="sm:col-span-2 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {t('seo.aboutService') || 'Про послугу'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
              {pick(service.intro, lang)}
            </p>
          </div>
          {pick(service.whatToExpect, lang) && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {t('seo.whatToExpect') || 'Що варто знати'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                {pick(service.whatToExpect, lang)}
              </p>
            </div>
          )}
        </div>

        {/* Price hint card */}
        {pick(service.priceHint, lang) && (
          <aside>
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/40 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wide">
                  {t('seo.priceHint') || 'Орієнтовна ціна'}
                </span>
              </div>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                {pick(service.priceHint, lang)}
              </p>
              <Link
                to={`/search?q=${encodeURIComponent(service.query)}`}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"
              >
                {t('seo.compareSpecialists') || 'Порівняти майстрів'}
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </aside>
        )}
      </section>

      {/* ================================================================ */}
      {/* SPECIALISTS GRID                                                  */}
      {/* ================================================================ */}
      <section className="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {city
                ? `${t('seo.specialistsIn') || 'Майстри'} ${cityLocative}`
                : t('seo.specialists') || 'Майстри'}
            </h2>
            <Link
              to={`/search?q=${encodeURIComponent(service.query)}${city ? `&location=${encodeURIComponent(pick(city.name, 'en'))}` : ''}`}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors flex-shrink-0"
            >
              {t('seo.viewAll') || 'Усі результати'}
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SpecialistSkeleton key={i} />
              ))}
            </div>
          ) : specialists.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {specialists.slice(0, 24).map((s: any) => {
                  const name = specilaistDisplayName(s);
                  const avatar = (s.avatar as string) || (s.user as any)?.avatar;
                  const rating = Number(s.averageRating ?? s.rating ?? 0);
                  const reviewCount = Number(s.reviewCount ?? s.totalReviews ?? 0);
                  const specialistCity = (s.city as string) || (s.location as any)?.city;
                  const profileUrl = `/s/${(s.slug as string) || (s.id as string)}`;

                  return (
                    <Link
                      key={(s.id as string) || (s.slug as string)}
                      to={profileUrl}
                      className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:border-primary-300 dark:hover:border-primary-700 hover-lift transition-all duration-200 flex flex-col"
                    >
                      {/* Avatar + name */}
                      <div className="flex items-center gap-4 mb-4">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={name}
                            className="h-14 w-14 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <span className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center text-lg font-semibold flex-shrink-0">
                            {name.charAt(0).toUpperCase() || '★'}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {name}
                          </p>
                          {specialistCity && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                              <MapPinIcon className="w-3 h-3 flex-shrink-0" />
                              {specialistCity}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Rating + view link */}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/60">
                        {rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <StarIcon className="w-4 h-4 text-amber-400" active />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {rating.toFixed(1)}
                            </span>
                            {reviewCount > 0 && (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                ({reviewCount})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {t('seo.newSpecialist') || 'Новий майстер'}
                          </span>
                        )}
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400 inline-flex items-center gap-1">
                          {t('actions.viewProfile') || 'Профіль'}
                          <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="text-center mt-8 sm:hidden">
                <Link
                  to={`/search?q=${encodeURIComponent(service.query)}${city ? `&location=${encodeURIComponent(pick(city.name, 'en'))}` : ''}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  {t('seo.viewAll') || 'Усі результати'}
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </>
          ) : (
            /* ---- EMPTY STATE ---- */
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Card 1 — for specialists */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 flex flex-col items-start">
                <span className="text-3xl mb-4" aria-hidden="true">🎯</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {t('seo.beFirstSpecialist') || 'Станьте першим майстром цієї послуги на МійЗапис'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                  {t('seo.beFirstSpecialistDesc') ||
                    'Зареєструйтесь як спеціаліст, додайте послугу та починайте отримувати клієнтів вже сьогодні — безкоштовно.'}
                </p>
                <Link
                  to="/auth/register"
                  className="mt-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  {t('seo.registerAsSpecialist') || 'Зареєструватись як майстер'}
                </Link>
              </div>

              {/* Card 2 — for customers */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 flex flex-col items-start">
                <span className="text-3xl mb-4" aria-hidden="true">🔍</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {t('seo.lookingForSpecialist') || 'Шукаєте майстра?'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                  {t('seo.lookingForSpecialistDesc') ||
                    'Скористайтесь повним пошуком та фільтрами — знайдіть перевіреного спеціаліста у вашому місті.'}
                </p>
                <Link
                  to="/search"
                  className="mt-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-primary-600 dark:text-primary-400 bg-white dark:bg-gray-800 border border-primary-300 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  {t('seo.browseAll') || 'Переглянути всіх'}
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================ */}
      {/* FAQ SECTION                                                       */}
      {/* ================================================================ */}
      {service.faqs.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {t('seo.faq') || 'Часті запитання'}
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 px-4 sm:px-6">
            {service.faqs.map((faq, idx) => (
              <FaqItem
                key={idx}
                question={pick(faq.q, lang)}
                answer={pick(faq.a, lang)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* INTERNAL LINKING — Other Cities + Related Services                */}
      {/* ================================================================ */}
      <section className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 grid sm:grid-cols-2 gap-10">
          {/* Other cities */}
          {relatedCities.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
                {`${serviceName} ${t('seo.inOtherCities') || 'в інших містах'}`}
              </h2>
              <ul className="space-y-2">
                {relatedCities.map((c) => (
                  <li key={c.slug}>
                    <Link
                      to={`/services/${service.slug}/${c.slug}`}
                      className="group inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <MapPinIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-500 flex-shrink-0" />
                      {`${serviceName} ${pick(c.locative, lang)}`}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related services */}
          {relatedServices.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
                {t('seo.relatedServices') || 'Схожі послуги'}
              </h2>
              <ul className="space-y-2">
                {relatedServices.map((rs) => (
                  <li key={rs.slug}>
                    <Link
                      to={city ? `/services/${rs.slug}/${city.slug}` : `/services/${rs.slug}`}
                      className="group inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <span className="text-base leading-none" aria-hidden="true">
                        {rs.emoji}
                      </span>
                      {pick(rs.name, lang)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ServiceLandingPage;
