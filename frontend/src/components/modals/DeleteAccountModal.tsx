import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppDispatch } from '@/hooks/redux';
import { logout } from '@/store/slices/authSlice';
import { authService } from '@/services/auth.service';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Whether the account has a password (email/password auth). Telegram/OAuth users have none. */
  hasPassword: boolean;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose, hasPassword }) => {
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const canSubmit = hasPassword
    ? password.trim().length > 0
    : confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    try {
      await authService.deleteAccount(hasPassword ? password : undefined, reason.trim() || undefined);
      try { await dispatch(logout()).unwrap(); } catch { /* server logout best-effort */ }
      window.location.href = '/';
    } catch (e: any) {
      const msg = String(e?.message || '').toLowerCase();
      if (msg.includes('incorrect') || msg.includes('password')) {
        setError(t('settings.deleteAccount.errWrongPassword') || 'Password is incorrect');
      } else if (msg.includes('booking')) {
        setError(t('settings.deleteAccount.errActiveBookings') || 'You have active bookings. Cancel or complete them first.');
      } else {
        setError(e?.message || t('settings.deleteAccount.errGeneric') || 'Failed to delete account');
      }
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={loading ? undefined : onClose} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
          {t('settings.deleteAccount.title') || 'Delete account?'}
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {t('settings.deleteAccount.warning') || 'This permanently deactivates your account and anonymizes your personal data. This cannot be undone.'}
        </p>

        {hasPassword ? (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.deleteAccount.passwordLabel') || 'Enter your password to confirm'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        ) : (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.deleteAccount.confirmLabel') || 'Type DELETE to confirm'}
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        )}

        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('settings.deleteAccount.reasonLabel') || 'Reason (optional)'}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium disabled:opacity-50"
          >
            {t('common.cancel') || 'Cancel'}
          </button>
          <button
            onClick={handleDelete}
            disabled={!canSubmit || loading}
            className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
          >
            {loading ? (t('common.loading') || '...') : (t('settings.deleteAccount.confirm') || 'Delete account')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteAccountModal;
