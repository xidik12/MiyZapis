// Chrome-less, iframe-friendly booking widget.
// Rendered at /embed/:slug (accepts a specialist slug OR id), NOT wrapped in any
// app layout — no header/footer/nav. Public, no auth required. Reuses the same
// specialistService data the public profile (/s/:slug) uses. Clicking a service
// escapes the iframe (target="_top") into the normal /booking/:serviceId flow.

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { specialistService } from '../services';
import { Avatar, InlineLoader } from '../components/ui';
import { StarIcon, ClockIcon, CalendarIcon } from '@/components/icons';
import { translateProfession } from '@/utils/profession';
import PublicSeo from '../components/common/PublicSeo';
import { getAbsoluteImageUrl } from '../utils/imageUrl';

const EmbedBookingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const [specialist, setSpecialist] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://miyzapis.com';

  useEffect(() => {
    // Embeds default to LIGHT and a transparent backdrop so they blend into any host page.
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    root.classList.add('light');
    const prevBg = document.body.style.background;
    document.body.style.background = 'transparent';
    return () => {
      document.body.style.background = prevBg;
      if (hadDark) {
        root.classList.remove('light');
        root.classList.add('dark');
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!slug) {
        setError(true);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Resolve slug → id (falls back to treating the param as an id).
        let specialistId = slug;
        try {
          const bySlug = await specialistService.getBySlugNullable(slug);
          if (bySlug?.id) specialistId = bySlug.id as string;
        } catch {
          /* param may already be an id */
        }

        const profile = await specialistService.getPublicProfile(specialistId);
        if (cancelled) return;
        setSpecialist(profile);

        const svc = await specialistService.getSpecialistServices(specialistId);
        if (cancelled) return;
        setServices(svc || []);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const getLocalizedDescription = (s: any) => {
    if (!s) return null;
    if (language === 'uk' && s.bioUk) return s.bioUk;
    if (language === 'ru' && s.bioRu) return s.bioRu;
    return s.bio || s.bioUk || s.bioRu || null;
  };

  const profileUrl = specialist
    ? `${origin}/s/${specialist.slug || specialist.id || slug}`
    : `${origin}/s/${slug}`;

  if (loading) {
    return (
      <div className="min-h-[320px] flex items-center justify-center bg-transparent">
        <InlineLoader size="md" />
      </div>
    );
  }

  if (error || !specialist) {
    return (
      <div className="min-h-[320px] flex items-center justify-center px-4 bg-transparent">
        <div className="text-center">
          <p className="text-gray-700 dark:text-gray-200 font-medium mb-3">
            {t('errors.specialistNotFound') || 'Specialist not found'}
          </p>
          <a
            href={origin}
            target="_top"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            MiyZapys
          </a>
        </div>
      </div>
    );
  }

  const embedName = `${specialist.user?.firstName || ''} ${specialist.user?.lastName || ''}`.trim() || 'Specialist';

  return (
    <div className="min-h-[200px] w-full bg-transparent text-gray-900 dark:text-gray-100 antialiased">
      <PublicSeo
        title={`${embedName} — ${t('actions.bookNow') || 'Book now'} | МійЗапис`}
        description={getLocalizedDescription(specialist) || `Book ${embedName} on МійЗапис.`}
        image={getAbsoluteImageUrl(specialist.user?.avatar || specialist.avatar) || undefined}
        url={profileUrl}
        type="profile"
      />
      <div className="mx-auto max-w-md w-full p-3 sm:p-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700">
            <Avatar
              src={specialist.user?.avatar || specialist.avatar}
              alt={specialist.user?.firstName || 'Specialist'}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 dark:text-white truncate">
                {specialist.user?.firstName} {specialist.user?.lastName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {translateProfession(specialist.businessName, t)}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-0.5">
                  <StarIcon className="w-3.5 h-3.5 text-yellow-400" active />
                  {(specialist.rating || 0).toFixed(1)}
                </span>
                {specialist.reviewCount ? (
                  <span>
                    ({specialist.reviewCount} {t('reviews.reviews') || 'reviews'})
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Bio (compact) */}
          {getLocalizedDescription(specialist) && (
            <p className="px-4 pt-3 text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
              {getLocalizedDescription(specialist)}
            </p>
          )}

          {/* Services */}
          <div className="p-4 space-y-2">
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {t('specialist.services') || 'Services'}
            </div>
            {services.length > 0 ? (
              services.map((service: any) => (
                <a
                  key={service.id}
                  /* Marketplace acquisition: booked from the embed widget = EMBED source */
                  href={`${origin}/booking/${service.id}?source=EMBED`}
                  target="_top"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:border-primary-400 hover:bg-primary-50/40 dark:hover:bg-primary-900/10 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {service.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {service.duration} {t('time.minutes') || 'min'}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatPrice(
                          service.price || service.basePrice || 0,
                          (service.currency as 'USD' | 'EUR' | 'UAH') || 'USD',
                        )}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 inline-flex items-center rounded-lg bg-primary-600 group-hover:bg-primary-700 text-white text-xs font-medium px-3 py-1.5 transition-colors">
                    {t('actions.book') || 'Book'}
                  </span>
                </a>
              ))
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 py-3 text-center">
                {t('specialist.noServices') || 'No services available'}
              </p>
            )}
          </div>

          {/* Footer CTA */}
          <div className="px-4 pb-4">
            <a
              href={profileUrl}
              target="_top"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2.5 transition-colors"
            >
              <CalendarIcon className="w-4 h-4" />
              {t('actions.bookNow') || 'Book now'}
            </a>
            <a
              href={origin}
              target="_top"
              rel="noopener noreferrer"
              className="mt-2 block text-center text-[11px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {t('share.poweredBy') || 'Powered by'} MiyZapys
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbedBookingPage;
