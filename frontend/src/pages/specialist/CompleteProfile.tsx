import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppDispatch } from '../../hooks/redux';
import { getCurrentUser } from '../../store/slices/authSlice';
import { specialistService } from '../../services/specialist.service';
import { LocationPicker } from '../../components/LocationPicker';
import { InlineLoader, ContentLoader } from '@/components/ui';
import { logger } from '@/utils/logger';

// Lightweight, one-screen step that forces an already-onboarded specialist who is
// still missing the search-gate fields (business name + contact + location) to
// fill them so their profile becomes discoverable. Reached via the ProtectedRoute
// guard when /auth/me reports requiresProfileCompletion. Unlike the full onboarding
// wizard, this never (re)creates services/schedule — it only patches the profile.

interface LocationData {
  address: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

const CompleteProfile: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState<LocationData>({ address: '', city: '', region: '', country: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const tr = (uk: string, ru: string, en: string) => (language === 'uk' ? uk : language === 'ru' ? ru : en);

  // Prefill from the existing profile so we never overwrite partial data.
  useEffect(() => {
    (async () => {
      try {
        const p: any = await specialistService.getProfile();
        setBusinessName(p?.businessName || '');
        setPhone(p?.businessPhone || p?.whatsappNumber || p?.user?.phoneNumber || '');
        setLocation({
          address: p?.preciseAddress || p?.address || '',
          city: p?.city || '',
          region: p?.region || '',
          country: p?.country || '',
          latitude: p?.latitude ?? undefined,
          longitude: p?.longitude ?? undefined,
        });
      } catch (err) {
        logger.warn('CompleteProfile: failed to load existing profile', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!businessName.trim() || businessName.trim().length < 2) {
      e.businessName = tr('Введіть назву бізнесу або профілю', 'Введите название бизнеса или профиля', 'Please enter your business or display name');
    }
    if (!phone.trim()) {
      e.phone = tr('Вкажіть контактний телефон', 'Укажите контактный телефон', 'Please enter a contact phone');
    }
    if (!location.address.trim() && !location.city.trim()) {
      e.location = tr('Вкажіть місцезнаходження', 'Укажите местоположение', 'Please set your location');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    setError(null);
    if (!validate()) return;
    setSaving(true);
    try {
      await specialistService.updateProfile({
        businessName: businessName.trim(),
        businessPhone: phone.trim(),
        address: location.address || undefined,
        city: location.city || undefined,
        region: location.region || undefined,
        country: location.country || undefined,
        preciseAddress: location.address || undefined,
        latitude: location.latitude,
        longitude: location.longitude,
      } as any);

      // Refresh the user so requiresProfileCompletion clears and the guard releases.
      try { await (dispatch(getCurrentUser() as any) as any); } catch { /* best effort */ }
      toast.success(tr('Профіль завершено!', 'Профиль завершён!', 'Profile completed!'));
      navigate('/specialist/dashboard', { replace: true });
    } catch (err: any) {
      logger.error('CompleteProfile: failed to save', err);
      setError(err?.message || tr('Не вдалося зберегти. Спробуйте ще раз.', 'Не удалось сохранить. Попробуйте ещё раз.', 'Failed to save. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 rounded-xl border ${
      hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
    } focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-start sm:items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {tr('Завершіть свій профіль', 'Завершите свой профиль', 'Complete your profile')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {tr(
                'Додайте ці дані, щоб клієнти могли знайти вас у пошуку.',
                'Добавьте эти данные, чтобы клиенты могли найти вас в поиске.',
                'Add these details so clients can find you in search.',
              )}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12"><ContentLoader text={tr('Завантаження…', 'Загрузка…', 'Loading…')} /></div>
          ) : (
            <div className="space-y-6">
              {/* Business name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tr('Назва бізнесу / профілю', 'Название бизнеса / профиля', 'Business / Display Name')} *
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    if (e.target.value.trim().length >= 2) setErrors((p) => { const n = { ...p }; delete n.businessName; return n; });
                  }}
                  placeholder={tr('напр., Olivochka Beauty Studio', 'напр., Olivochka Beauty Studio', 'e.g., Olivochka Beauty Studio')}
                  className={inputClass(!!errors.businessName)}
                />
                {errors.businessName && <p className="mt-1 text-sm text-red-500">{errors.businessName}</p>}
              </div>

              {/* Contact phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tr('Контактний телефон', 'Контактный телефон', 'Contact Phone')} *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (e.target.value.trim()) setErrors((p) => { const n = { ...p }; delete n.phone; return n; });
                  }}
                  placeholder="+380 XX XXX XXXX"
                  className={inputClass(!!errors.phone)}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tr('Місцезнаходження', 'Местоположение', 'Location')} *
                </label>
                <LocationPicker
                  location={location}
                  onLocationChange={(loc) => {
                    setLocation(loc as LocationData);
                    if (loc.address?.trim() || loc.city?.trim()) setErrors((p) => { const n = { ...p }; delete n.location; return n; });
                  }}
                />
                {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location}</p>}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-[0.96]"
                >
                  {saving && <InlineLoader size="sm" color="white" />}
                  {saving
                    ? tr('Збереження…', 'Сохранение…', 'Saving…')
                    : tr('Зберегти й продовжити', 'Сохранить и продолжить', 'Save & Continue')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
