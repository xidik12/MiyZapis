import React, { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { fileUploadService } from '@/services/fileUpload.service';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';
import { CreditCardIcon, DocumentCheckIcon } from '@/components/icons';
import { toast } from 'react-toastify';
import type { SpecialistProfile } from '@/hooks/useSpecialistProfile';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaymentDetailsTabProps {
  profile: SpecialistProfile;
  onProfileChange: (field: string, value: unknown) => void;
  saving: boolean;
  onSave: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAYMENT_METHODS = [
  { id: 'cash' },
  { id: 'card' },
  { id: 'bank_transfer' },
  { id: 'online' },
  { id: 'crypto' },
] as const;

const getMethodLabel = (id: string, language: string): string => {
  const labels: Record<string, Record<string, string>> = {
    cash: { uk: 'Готівка', ru: 'Наличные', en: 'Cash' },
    card: { uk: 'Картка', ru: 'Карта', en: 'Card' },
    bank_transfer: { uk: 'Банківський переказ', ru: 'Банковский перевод', en: 'Bank transfer' },
    online: { uk: 'Онлайн', ru: 'Онлайн', en: 'Online' },
    crypto: { uk: 'Криптовалюта', ru: 'Криптовалюта', en: 'Crypto' },
  };
  return labels[id]?.[language] ?? labels[id]?.en ?? id;
};

// ---------------------------------------------------------------------------
// Shared input class
// ---------------------------------------------------------------------------

const inputClass =
  'w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 ' +
  'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ' +
  'focus:border-primary-500 focus:ring-primary-500 transition-colors';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PaymentDetailsTab: React.FC<PaymentDetailsTabProps> = ({
  profile,
  onProfileChange,
  saving,
  onSave,
}) => {
  const { language, t } = useLanguage();
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Local state for QR upload
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [qrError, setQrError] = useState('');

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handlePaymentMethodToggle = (methodId: string, checked: boolean) => {
    const current = profile.paymentMethods || [];
    const next = checked
      ? [...current, methodId]
      : current.filter((m: string) => m !== methodId);
    onProfileChange('paymentMethods', next);
  };

  const handleBankDetailsChange = (field: string, value: string) => {
    onProfileChange('bankDetails', {
      ...(profile.bankDetails || {}),
      [field]: value,
    });
  };

  const handleQrUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith('image/')) {
      const msg =
        language === 'uk'
          ? 'Будь ласка, оберіть файл зображення'
          : language === 'ru'
          ? 'Пожалуйста, выберите файл изображения'
          : 'Please select an image file';
      setQrError(msg);
      return;
    }

    // Validate file size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      const msg =
        language === 'uk'
          ? 'Розмір файлу повинен бути менше 5МБ'
          : language === 'ru'
          ? 'Размер файла должен быть меньше 5МБ'
          : 'File size must be less than 5MB';
      setQrError(msg);
      return;
    }

    try {
      setIsUploadingQr(true);
      setQrError('');
      const result = await fileUploadService.uploadPaymentQr(file);
      onProfileChange('paymentQrCodeUrl', result.url);
      toast.success(
        language === 'uk'
          ? 'QR-код успішно завантажено'
          : language === 'ru'
          ? 'QR-код успешно загружен'
          : 'QR code uploaded successfully',
      );
      // Reset the input so the same file can be re-uploaded if needed
      event.target.value = '';
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[PaymentDetailsTab] QR upload failed:', error);
      setQrError(
        err.message ||
          (language === 'uk'
            ? 'Помилка завантаження QR-коду'
            : language === 'ru'
            ? 'Ошибка загрузки QR-кода'
            : 'Failed to upload QR code'),
      );
    } finally {
      setIsUploadingQr(false);
    }
  };

  const handleQrRemove = () => {
    onProfileChange('paymentQrCodeUrl', '');
    if (qrInputRef.current) {
      qrInputRef.current.value = '';
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="p-6 sm:p-8 space-y-10">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
          <CreditCardIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'uk'
              ? 'Оплата та реквізити'
              : language === 'ru'
              ? 'Оплата и реквизиты'
              : 'Payment & Bank Details'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {language === 'uk'
              ? 'Налаштуйте способи оплати та реквізити'
              : language === 'ru'
              ? 'Настройте способы оплаты и реквизиты'
              : 'Set payment methods and details'}
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Section 1 — Payment Methods                                       */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CreditCardIcon className="h-5 w-5" />
          {t('profile.paymentMethods') || 'Payment Methods'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PAYMENT_METHODS.map((method) => {
            const isChecked = (profile.paymentMethods || []).includes(method.id);
            return (
              <label
                key={method.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                  isChecked
                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handlePaymentMethodToggle(method.id, e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {getMethodLabel(method.id, language)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Section 2 — Bank Details                                          */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <DocumentCheckIcon className="h-5 w-5" />
          {t('specialist.paymentDetails') || 'Bank Details'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Bank name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('specialist.bankName') || 'Bank name'}
            </label>
            <input
              type="text"
              value={profile.bankDetails?.bankName || ''}
              onChange={(e) => handleBankDetailsChange('bankName', e.target.value)}
              className={inputClass}
              placeholder={t('specialist.bankNamePlaceholder') || 'e.g., PrivatBank'}
            />
          </div>

          {/* Account name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('specialist.accountName') || 'Account name'}
            </label>
            <input
              type="text"
              value={profile.bankDetails?.accountName || ''}
              onChange={(e) => handleBankDetailsChange('accountName', e.target.value)}
              className={inputClass}
              placeholder={t('specialist.accountNamePlaceholder') || 'e.g., Your name'}
            />
          </div>

          {/* Account number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('specialist.accountNumber') || 'Account number'}
            </label>
            <input
              type="text"
              value={profile.bankDetails?.accountNumber || ''}
              onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)}
              className={inputClass}
              placeholder={t('specialist.accountNumberPlaceholder') || '0000 0000 0000 0000'}
            />
          </div>

          {/* IBAN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('specialist.iban') || 'IBAN'}
            </label>
            <input
              type="text"
              value={profile.bankDetails?.iban || ''}
              onChange={(e) => handleBankDetailsChange('iban', e.target.value)}
              className={inputClass}
              placeholder={t('specialist.ibanPlaceholder') || 'UA00 0000 0000 0000 0000 0000 000'}
            />
          </div>

          {/* SWIFT / BIC */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('specialist.swift') || 'SWIFT/BIC'}
            </label>
            <input
              type="text"
              value={profile.bankDetails?.swift || ''}
              onChange={(e) => handleBankDetailsChange('swift', e.target.value)}
              className={inputClass}
              placeholder={t('specialist.swiftPlaceholder') || 'PBANUA2X'}
            />
          </div>
        </div>

        {/* Payment notes — full width */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('specialist.bankNotes') || 'Payment notes'}
          </label>
          <textarea
            value={profile.bankDetails?.notes || ''}
            onChange={(e) => handleBankDetailsChange('notes', e.target.value)}
            className={inputClass}
            rows={3}
            placeholder={t('specialist.bankNotesPlaceholder') || 'Add any payment instructions...'}
          />
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Section 3 — Payment QR Code                                       */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CreditCardIcon className="h-5 w-5" />
          {t('specialist.paymentQr') || 'Payment QR Code'}
        </h3>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* QR Image or placeholder */}
          {profile.paymentQrCodeUrl ? (
            <img
              src={getAbsoluteImageUrl(profile.paymentQrCodeUrl)}
              alt={t('specialist.paymentQr') || 'Payment QR code'}
              className="w-28 h-28 rounded-xl border border-gray-200 dark:border-gray-700 object-cover"
            />
          ) : (
            <div className="w-28 h-28 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 text-xs">
              {language === 'uk' ? 'Немає QR' : language === 'ru' ? 'Нет QR' : 'No QR'}
            </div>
          )}

          {/* Upload / Remove controls */}
          <div className="space-y-2">
            <input
              ref={qrInputRef}
              id="payment-qr-upload"
              type="file"
              accept="image/*"
              onChange={handleQrUpload}
              className="hidden"
              disabled={isUploadingQr}
            />

            <div className="flex gap-2">
              <label
                htmlFor="payment-qr-upload"
                className={`px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors cursor-pointer ${
                  isUploadingQr ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                }`}
              >
                {isUploadingQr
                  ? language === 'uk'
                    ? 'Завантаження...'
                    : language === 'ru'
                    ? 'Загрузка...'
                    : 'Uploading...'
                  : t('specialist.uploadQr') || 'Upload QR'}
              </label>

              {profile.paymentQrCodeUrl && (
                <button
                  type="button"
                  onClick={handleQrRemove}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('specialist.removeQr') || 'Remove'}
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('specialist.qrHelp') || 'PNG/JPG/WebP up to 5MB.'}
            </p>

            {qrError && <p className="text-xs text-red-500">{qrError}</p>}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Save Button                                                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={`px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors ${
            saving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {saving
            ? language === 'uk'
              ? 'Збереження...'
              : language === 'ru'
              ? 'Сохранение...'
              : 'Saving...'
            : language === 'uk'
            ? 'Зберегти'
            : language === 'ru'
            ? 'Сохранить'
            : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default PaymentDetailsTab;
