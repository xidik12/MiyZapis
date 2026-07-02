import React, { useState } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { getCurrentUser } from '@/store/slices/authSlice';
import { apiClient } from '@/services/api';
import { isTelegram, requestTelegramContact, haptic, tgWebApp } from '@/lib/telegram';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircleIcon } from '@/components/icons';
import { toast } from 'react-toastify';

// Phone verification. No SMS provider is configured, so verification is done via
// Telegram's native "share contact" prompt — the backend trusts it because the
// session is already Telegram-authenticated and the shared contact's user_id
// must match the linked telegramId. Shows a verified badge when done; outside
// Telegram it shows a hint (nothing to do there yet).
const PhoneVerifyButton: React.FC<{ isVerified?: boolean }> = ({ isVerified }) => {
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);

  if (isVerified) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
        <CheckCircleIcon className="w-4 h-4" />
        {t('phone.verified') || 'Verified'}
      </span>
    );
  }

  if (!isTelegram()) {
    return (
      <span className="text-xs text-gray-400 dark:text-gray-500">
        {t('phone.verifyInTelegram') || 'Open in Telegram to verify'}
      </span>
    );
  }

  const verify = async () => {
    setBusy(true);
    try {
      const contact = await requestTelegramContact();
      if (!contact?.phone_number) { setBusy(false); return; }
      // Send the signed initData so the backend verifies the Telegram identity
      // (it no longer trusts a client-supplied telegramUserId).
      const res = await apiClient.post('/users/phone/verify-telegram', {
        phoneNumber: contact.phone_number,
        initData: tgWebApp()?.initData,
      });
      if (res.success) {
        haptic.notify('success');
        toast.success(t('phone.verifiedToast') || 'Phone verified');
        try { await dispatch(getCurrentUser()).unwrap(); } catch { /* ignore */ }
      } else {
        toast.error(res.error?.message || t('phone.verifyFailed') || 'Could not verify phone');
      }
    } catch (e: any) {
      toast.error(e?.message || t('phone.verifyFailed') || 'Could not verify phone');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={verify}
      disabled={busy}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50 cursor-pointer"
    >
      {busy ? (t('phone.verifying') || 'Verifying…') : (t('phone.verify') || 'Verify via Telegram')}
    </button>
  );
};

export default PhoneVerifyButton;
