import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { promoteService, type ShowcaseItem } from '@/services/promote.service';
import { StarIcon, MapPinIcon, ClockIcon } from '@/components/icons';

type Currency = 'USD' | 'EUR' | 'UAH';

// ---------------------------------------------------------------------------
// PromotedListingCard — the marketplace "ad" creative. A platform-curated
// promoted card shown at the top of search results and in the homepage
// featured slot. Clearly labelled (Реклама) so it never masquerades as an
// organic result. Reuses the booking/profile link patterns of normal cards.
// ---------------------------------------------------------------------------

interface Props {
  item: ShowcaseItem;
  className?: string;
}

// A safe text colour for the accent-filled CTA. Olive/most brand tones are
// dark, so white reads well; we only flip to dark text for very light accents.
function readableOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7 ? '#1f2937' : '#ffffff';
}

export function PromotedListingCard({ item, className = '' }: Props) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const tracked = useRef(false);

  // Count one impression per mounted card (best-effort).
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    promoteService.track(item.promotionId, 'impression');
  }, [item.promotionId]);

  const accent = item.accentColor || '#5b6b3a';
  const ctaText = readableOn(accent);
  const adLabel = t('promote.adLabel') || 'Реклама';

  const onClick = () => promoteService.track(item.promotionId, 'click');

  // CTA → book the highlighted service, else open the profile.
  const target = item.service
    ? `/booking/${item.service.id}?source=MARKETPLACE`
    : `/specialist/${item.specialistId}`;
  const profileTarget = `/specialist/${item.specialistId}`;

  const initials =
    item.displayName
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '•';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow ${className}`}
      style={{ boxShadow: `inset 3px 0 0 0 ${accent}` }}
    >
      {/* Ad disclosure — required so promoted ≠ organic */}
      <span
        className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-white/85 dark:bg-gray-900/80 backdrop-blur px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 ring-1 ring-gray-200/70 dark:ring-gray-700"
        aria-label={adLabel}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
        {adLabel}
      </span>

      <div className="p-3 sm:p-4">
        {/* Header: logo + name + rating/city */}
        <Link to={profileTarget} onClick={onClick} className="flex items-center gap-3 group">
          {item.avatarUrl ? (
            <img
              src={item.avatarUrl}
              alt={item.displayName}
              className="w-11 h-11 rounded-xl object-cover flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-700"
              loading="lazy"
            />
          ) : (
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:underline">
              {item.displayName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex-wrap">
              {item.reviewCount > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <StarIcon className="w-3.5 h-3.5 text-yellow-400" active />
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {item.rating.toFixed(1)}
                  </span>
                  <span>({item.reviewCount})</span>
                </span>
              )}
              {item.city && (
                <span className="inline-flex items-center gap-0.5">
                  <MapPinIcon className="w-3.5 h-3.5" />
                  {item.city}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Body: hero photo + offer/service/CTA */}
        <div className="mt-3 flex gap-3">
          {item.imageUrl && (
            <Link
              to={target}
              onClick={onClick}
              className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700"
            >
              <img
                src={item.imageUrl}
                alt={item.headline || item.displayName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </Link>
          )}

          <div className="min-w-0 flex-1 flex flex-col">
            {item.headline && (
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug line-clamp-2">
                {item.headline}
              </p>
            )}

            {item.service && (
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                <span className="truncate">{item.service.name}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {t('common.from') || 'from'}{' '}
                    {formatPrice(item.service.price, item.service.currency as Currency)}
                  </span>
                  {item.service.duration > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-gray-400">
                      <ClockIcon className="w-3 h-3" />
                      {item.service.duration} {t('common.minutesShort') || 'min'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {item.offerText && (
              <span
                className="mt-2 inline-flex self-start items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: `${accent}1a`, color: accent }}
              >
                {item.offerText}
              </span>
            )}

            <Link
              to={target}
              onClick={onClick}
              className="mt-auto pt-2.5 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 w-full sm:w-auto"
              style={{ backgroundColor: accent, color: ctaText }}
            >
              {item.ctaLabel || t('promote.bookCta') || t('common.book') || 'Записатись'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PromotedListingCard;
