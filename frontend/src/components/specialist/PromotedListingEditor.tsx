import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  promoteService,
  type PromotionStatus,
  type ShowcaseItem,
} from '../../services/promote.service';
import { specialistService } from '../../services/specialist.service';
import { fileUploadService } from '../../services/fileUpload.service';
import PromotedListingCard from '@/components/common/PromotedListingCard';
import { HelpTip } from '@/components/common/HelpTip';
import { toast } from 'react-toastify';
import { RocketLaunchIcon, ImageIcon, XIcon } from '@/components/icons';

interface OwnService {
  id: string;
  name: string;
  basePrice?: number | string;
  price?: number | string;
  currency?: string;
  duration?: number;
}

interface FormState {
  headline: string;
  offerText: string;
  imageUrl: string;
  logoUrl: string;
  accentColor: string;
  highlightServiceId: string;
  ctaLabel: string;
}

const ACCENT_PRESETS = ['#5b6b3a', '#2f4a2a', '#2563eb', '#b45309', '#9d174d', '#334155'];
const EMPTY: FormState = {
  headline: '',
  offerText: '',
  imageUrl: '',
  logoUrl: '',
  accentColor: '#5b6b3a',
  highlightServiceId: '',
  ctaLabel: '',
};

const STATUS_KEY: Record<PromotionStatus, string> = {
  DRAFT: 'promote.statusDraft',
  PENDING_REVIEW: 'promote.statusPendingReview',
  ACTIVE: 'promote.statusActive',
  PAUSED: 'promote.statusPaused',
};
const STATUS_STYLE: Record<PromotionStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  ACTIVE: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
  PAUSED: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

const PromotedListingEditor: React.FC = () => {
  const { t } = useLanguage();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<PromotionStatus>('DRAFT');
  const [services, setServices] = useState<OwnService[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'hero' | 'logo' | null>(null);
  const heroInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const [listing, svc, prof] = await Promise.all([
        promoteService.getListing(),
        specialistService.getServices().catch(() => []),
        specialistService.getProfile().catch(() => null),
      ]);
      if (listing) {
        setForm({
          headline: listing.headline ?? '',
          offerText: listing.offerText ?? '',
          imageUrl: listing.imageUrl ?? '',
          logoUrl: listing.logoUrl ?? '',
          accentColor: listing.accentColor ?? '#5b6b3a',
          highlightServiceId: listing.highlightServiceId ?? '',
          ctaLabel: listing.ctaLabel ?? '',
        });
        setStatus(listing.status);
      }
      setServices((svc as unknown as OwnService[]) || []);
      setProfile((prof as unknown as Record<string, unknown>) || null);
    } catch (err) {
      toast.error((err as Error).message || t('promote.loadError') || 'Failed to load');
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleUpload = async (kind: 'hero' | 'logo', file: File | undefined) => {
    if (!file) return;
    setUploading(kind);
    try {
      const res = await fileUploadService.uploadServiceImage(file);
      set(kind === 'hero' ? 'imageUrl' : 'logoUrl', res.url);
    } catch (err) {
      toast.error((err as Error).message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const save = async (submit: boolean) => {
    setSaving(true);
    try {
      const next = await promoteService.saveListing({
        headline: form.headline,
        offerText: form.offerText,
        imageUrl: form.imageUrl,
        logoUrl: form.logoUrl,
        accentColor: form.accentColor,
        highlightServiceId: form.highlightServiceId || null,
        ctaLabel: form.ctaLabel,
        submit,
      });
      setStatus(next.status);
      toast.success(t('promote.listingSaved') || 'Saved');
    } catch (err) {
      toast.error((err as Error).message || t('promote.saveError') || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Build a live-preview ShowcaseItem from the form + the owner's own profile.
  const svc = services.find((s) => s.id === form.highlightServiceId);
  const p = profile || {};
  const displayName =
    (p.businessName as string)?.trim() ||
    `${(p.user as { firstName?: string })?.firstName ?? ''} ${(p.user as { lastName?: string })?.lastName ?? ''}`.trim() ||
    'Your studio';
  const previewItem: ShowcaseItem = {
    promotionId: 'preview',
    specialistId: (p.id as string) || 'preview',
    slug: (p.slug as string) || null,
    displayName,
    avatarUrl: form.logoUrl || ((p.user as { avatar?: string })?.avatar ?? null),
    city: (p.city as string) || null,
    rating: typeof p.rating === 'number' ? (p.rating as number) : 4.9,
    reviewCount: typeof p.reviewCount === 'number' ? (p.reviewCount as number) : 0,
    headline: form.headline || null,
    offerText: form.offerText || null,
    imageUrl: form.imageUrl || null,
    accentColor: form.accentColor,
    ctaLabel: form.ctaLabel || null,
    service: svc
      ? {
          id: svc.id,
          name: svc.name,
          price: Number(svc.basePrice ?? svc.price ?? 0),
          currency: svc.currency || 'UAH',
          duration: svc.duration || 0,
        }
      : null,
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <RocketLaunchIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('promote.listing') || 'Promoted listing'}
        </h2>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[status]}`}>
          {t(STATUS_KEY[status]) || status}
        </span>
        <HelpTip
          title={t('promote.listing') || 'Promoted listing'}
          content={t('promote.listingHelp') || ''}
        />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('promote.listingHelpPaid') || 'Design your ad card here. Save it as a draft — it goes live in search and the discovery showcase automatically when you buy a boost.'}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('promote.headline') || 'Headline'}
            </label>
            <input
              type="text"
              value={form.headline}
              maxLength={80}
              onChange={(e) => set('headline', e.target.value)}
              placeholder={t('promote.headlinePlaceholder') || ''}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('promote.offerText') || 'Offer'}
            </label>
            <input
              type="text"
              value={form.offerText}
              maxLength={60}
              onChange={(e) => set('offerText', e.target.value)}
              placeholder={t('promote.offerPlaceholder') || ''}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Cover photo + logo uploads */}
          <div className="grid grid-cols-2 gap-3">
            <ImageField
              label={t('promote.heroImage') || 'Cover photo'}
              url={form.imageUrl}
              uploading={uploading === 'hero'}
              onPick={() => heroInput.current?.click()}
              onClear={() => set('imageUrl', '')}
              uploadingLabel={t('promote.uploading') || 'Uploading…'}
              pickLabel={t('promote.uploadImage') || 'Upload image'}
            />
            <ImageField
              label={t('promote.logoImage') || 'Logo (optional)'}
              url={form.logoUrl}
              uploading={uploading === 'logo'}
              onPick={() => logoInput.current?.click()}
              onClear={() => set('logoUrl', '')}
              uploadingLabel={t('promote.uploading') || 'Uploading…'}
              pickLabel={t('promote.uploadImage') || 'Upload image'}
            />
          </div>
          <input
            ref={heroInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleUpload('hero', e.target.files?.[0])}
          />
          <input
            ref={logoInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleUpload('logo', e.target.files?.[0])}
          />

          {/* Featured service */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('promote.highlightService') || 'Featured service'}
            </label>
            <select
              value={form.highlightServiceId}
              onChange={(e) => set('highlightServiceId', e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">{t('promote.noService') || 'No service'}</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* CTA label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('promote.ctaLabelField') || 'Button text'}
            </label>
            <input
              type="text"
              value={form.ctaLabel}
              maxLength={24}
              onChange={(e) => set('ctaLabel', e.target.value)}
              placeholder={t('promote.ctaPlaceholder') || 'Book now'}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Accent color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('promote.accentColor') || 'Accent color'}
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {ACCENT_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => set('accentColor', c)}
                  className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-105 ${
                    form.accentColor.toLowerCase() === c.toLowerCase()
                      ? 'border-gray-900 dark:border-white'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => set('accentColor', e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-gray-300 dark:border-gray-600"
                aria-label={t('promote.accentColor') || 'Accent color'}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              disabled={saving || uploading !== null}
              onClick={() => save(false)}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <RocketLaunchIcon className="w-5 h-5" />
              {t('promote.saveListing') || 'Save listing'}
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {t('promote.listingDraftNote') || 'Save your card here. It goes live in the discovery showcase automatically when you buy a boost above.'}
          </p>
        </div>

        {/* Live preview */}
        <div>
          <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
            {t('promote.preview') || 'Preview'}
          </div>
          <div className="lg:sticky lg:top-20">
            <PromotedListingCard item={previewItem} />
          </div>
        </div>
      </div>
    </div>
  );
};

interface ImageFieldProps {
  label: string;
  url: string;
  uploading: boolean;
  onPick: () => void;
  onClear: () => void;
  uploadingLabel: string;
  pickLabel: string;
}

const ImageField: React.FC<ImageFieldProps> = ({
  label,
  url,
  uploading,
  onPick,
  onClear,
  uploadingLabel,
  pickLabel,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    {url ? (
      <div className="relative group">
        <img src={url} alt={label} className="w-full h-24 object-cover rounded-xl ring-1 ring-gray-200 dark:ring-gray-700" />
        <button
          type="button"
          onClick={onClear}
          className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
          aria-label="remove"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={onPick}
        disabled={uploading}
        className="w-full h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors disabled:opacity-50"
      >
        <ImageIcon className="w-6 h-6" />
        <span className="text-xs">{uploading ? uploadingLabel : pickLabel}</span>
      </button>
    )}
  </div>
);

export default PromotedListingEditor;
