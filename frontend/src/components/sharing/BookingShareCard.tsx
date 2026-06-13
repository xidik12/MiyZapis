import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useLanguage } from '@/contexts/LanguageContext';

type ShareTarget = 'specialist' | 'business';

interface BookingShareCardProps {
  /** URL-safe slug for the public profile, when available (preferred). */
  slug?: string | null;
  /** Fallback id used when no slug exists. */
  id?: string | null;
  /** Whether this is a specialist (`/s/<slug>`) or a business (`/biz/<slug>`) link. */
  target?: ShareTarget;
  /** Display name, used in social share text. */
  name?: string;
  className?: string;
}

const copyToClipboard = async (value: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
};

/**
 * Embed + share panel for a public booking page.
 * Renders the public booking link, a copyable iframe embed snippet,
 * a QR code, and social share shortcuts — all toast-driven and theme-aware.
 */
export const BookingShareCard: React.FC<BookingShareCardProps> = ({
  slug,
  id,
  target = 'specialist',
  name,
  className = '',
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://miyzapis.com';
  const handle = slug || id || '';

  const bookingUrl = useMemo(() => {
    if (!handle) return '';
    const prefix = target === 'business' ? 'biz' : 's';
    return `${origin}/${prefix}/${handle}`;
  }, [origin, handle, target]);

  const embedUrl = useMemo(() => (handle ? `${origin}/embed/${handle}` : ''), [origin, handle]);

  const embedSnippet = useMemo(
    () =>
      `<iframe src="${embedUrl}" width="100%" height="700" style="border:0" loading="lazy"></iframe>`,
    [embedUrl],
  );

  const qrSrc = useMemo(
    () =>
      bookingUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(bookingUrl)}`
        : '',
    [bookingUrl],
  );

  const shareText = useMemo(() => {
    const lead = t('share.tellFriend') || 'Book with me';
    return name ? `${lead}: ${name}` : lead;
  }, [t, name]);

  const doCopy = async (value: string, key: string) => {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(key);
      toast.success(t('share.copied') || 'Copied!');
      window.setTimeout(() => setCopied((cur) => (cur === key ? null : cur)), 2000);
    } else {
      toast.error(t('share.copyFailed') || 'Failed to copy');
    }
  };

  const openShare = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  if (!handle) {
    return (
      <div
        className={`rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-sm text-gray-500 dark:text-gray-400 ${className}`}
      >
        {t('share.unavailable') || 'Your public booking link will appear here once your profile is published.'}
      </div>
    );
  }

  const socialButtons: { key: string; label: string; onClick: () => void; classes: string }[] = [
    {
      key: 'telegram',
      label: t('share.telegram') || 'Telegram',
      onClick: () =>
        openShare(
          `https://t.me/share/url?url=${encodeURIComponent(bookingUrl)}&text=${encodeURIComponent(shareText)}`,
        ),
      classes: 'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50',
    },
    {
      key: 'whatsapp',
      label: t('share.whatsapp') || 'WhatsApp',
      onClick: () => openShare(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${bookingUrl}`)}`),
      classes:
        'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50',
    },
    {
      key: 'facebook',
      label: t('share.facebook') || 'Facebook',
      onClick: () =>
        openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(bookingUrl)}`),
      classes:
        'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50',
    },
    {
      key: 'instagram',
      // Instagram has no web share intent — copy the link and hint the user to paste it.
      label: t('share.instagram') || 'Instagram',
      onClick: async () => {
        await doCopy(bookingUrl, 'instagram');
        toast.info(t('share.instagramHint') || 'Link copied — paste it into your Instagram bio or story.');
      },
      classes:
        'bg-pink-50 text-pink-700 hover:bg-pink-100 dark:bg-pink-900/30 dark:text-pink-300 dark:hover:bg-pink-900/50',
    },
  ];

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden ${className}`}
    >
      <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('share.shareAndEmbed') || 'Share & Embed'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('share.shareAndEmbedHint') ||
            'Put a “Book now” widget on your site or Instagram bio and grow your bookings.'}
        </p>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Booking link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('share.bookingLink') || 'Public booking link'}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value={bookingUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={() => doCopy(bookingUrl, 'link')}
              className="shrink-0 rounded-xl bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 text-sm font-medium transition-colors"
            >
              {copied === 'link' ? t('share.copied') || 'Copied!' : t('share.copyLink') || 'Copy link'}
            </button>
          </div>
        </div>

        {/* QR + Social grid */}
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 sm:gap-6 items-start">
          {/* QR code */}
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('share.qrCode') || 'QR code'}
            </span>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white p-2">
              {qrSrc && (
                <img
                  src={qrSrc}
                  alt={t('share.qrCode') || 'QR code'}
                  width={180}
                  height={180}
                  loading="lazy"
                  className="w-[180px] h-[180px] block"
                />
              )}
            </div>
          </div>

          {/* Social share */}
          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('share.shareOn') || 'Share on'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {socialButtons.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={b.onClick}
                  className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${b.classes}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Embed snippet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('share.embedCode') || 'Embed on your website'}
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {t('share.embedHint') || 'Paste this snippet into your website to show a live booking widget.'}
          </p>
          <div className="relative">
            <textarea
              readOnly
              rows={3}
              value={embedSnippet}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 pr-24 text-xs font-mono text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={() => doCopy(embedSnippet, 'embed')}
              className="absolute top-2 right-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 text-xs font-medium transition-colors"
            >
              {copied === 'embed' ? t('share.copied') || 'Copied!' : t('share.copyCode') || 'Copy code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingShareCard;
