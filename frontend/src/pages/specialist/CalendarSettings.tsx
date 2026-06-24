// Calendar settings — connect/disconnect Google & Apple, manual resync.
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { confirm } from '@/components/ui/Confirm';
import { toast } from 'react-toastify';
import { calendarService, type CalendarStatusResponse } from '../../services/calendar.service';
import { PageLoader } from '@/components/ui';
import { useLanguage } from '@/contexts/LanguageContext';

const CalendarSettings: React.FC = () => {
  const { t } = useLanguage();
  const [google, setGoogle] = useState<CalendarStatusResponse | null>(null);
  const [apple, setApple] = useState<CalendarStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [appleModal, setAppleModal] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const [g, a] = await Promise.all([calendarService.googleStatus(), calendarService.appleStatus()]);
      setGoogle(g);
      setApple(a);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load calendar status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // OAuth callback redirects to /dashboard?calendar=connected; surface the toast there or here.
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar') === 'connected') toast.success('Google Calendar connected!');
    if (params.get('calendar') === 'error') toast.error('Google Calendar connection failed.');
  }, []);

  const connectGoogle = async () => {
    try {
      const url = await calendarService.googleConnectUrl();
      window.location.href = url;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start Google OAuth');
    }
  };

  const disconnectGoogle = async () => {
    if (!await confirm('Disconnect Google Calendar? Future bookings will stop syncing.')) return;
    try {
      await calendarService.googleDisconnect();
      toast.success('Google Calendar disconnected');
      await reload();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to disconnect');
    }
  };

  const disconnectApple = async () => {
    if (!await confirm('Disconnect iCloud Calendar? Future bookings will stop syncing.')) return;
    try {
      await calendarService.appleDisconnect();
      toast.success('iCloud Calendar disconnected');
      await reload();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to disconnect');
    }
  };

  const resync = async () => {
    try {
      const res = await calendarService.resync();
      toast.success(`Queued ${res.queued} booking(s) for sync`);
    } catch (err: any) {
      toast.error(err?.message || 'Resync failed');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><PageLoader /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-3xl mx-auto px-4">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('calendarSync.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('calendarSync.subtitle')}</p>
        </header>

        <ProviderCard
          name={t('calendarSync.google')}
          subtitle={t('calendarSync.google.subtitle')}
          connected={google?.connected ?? false}
          calendarName={google?.calendarName}
          lastSyncAt={google?.lastSyncAt}
          lastSyncError={google?.lastSyncError}
          onConnect={connectGoogle}
          onDisconnect={disconnectGoogle}
          icon={<GoogleLogo />}
        />

        <ProviderCard
          name={t('calendarSync.apple')}
          subtitle={t('calendarSync.apple.subtitle')}
          connected={apple?.connected ?? false}
          calendarName={apple?.calendarName}
          lastSyncAt={apple?.lastSyncAt}
          lastSyncError={apple?.lastSyncError}
          onConnect={() => setAppleModal(true)}
          onDisconnect={disconnectApple}
          icon={<AppleLogo />}
        />

        {(google?.connected || apple?.connected) && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">{t('calendarSync.forceResync')}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('calendarSync.forceResyncDesc')}</div>
            </div>
            <button onClick={resync} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 transition active:scale-[0.96]">{t('calendarSync.resync')}</button>
          </div>
        )}

        {appleModal && <AppleConnectModal onClose={() => setAppleModal(false)} onConnected={async () => { setAppleModal(false); await reload(); }} />}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
const ProviderCard: React.FC<{
  name: string;
  subtitle: string;
  connected: boolean;
  calendarName?: string | null;
  lastSyncAt?: string | null;
  lastSyncError?: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  icon: React.ReactNode;
}> = (p) => {
  const { t } = useLanguage();
  return (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-4">
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center">{p.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">{p.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{p.subtitle}</p>
          </div>
          {p.connected ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">{t('calendarSync.connected')}</span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">{t('calendarSync.notConnected')}</span>
          )}
        </div>

        {p.connected && (
          <div className="mt-3 space-y-1 text-sm">
            {p.calendarName && <div className="text-gray-600 dark:text-gray-300">{t('calendarSync.calendar')}: <span className="font-medium">{p.calendarName}</span></div>}
            {p.lastSyncAt && <div className="text-gray-500 text-xs">{t('calendarSync.lastSync')}: {new Date(p.lastSyncAt).toLocaleString()}</div>}
            {p.lastSyncError && <div className="text-red-600 text-xs">{t('calendarSync.lastError')}: {p.lastSyncError}</div>}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {p.connected ? (
            <button onClick={p.onDisconnect} className="px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition active:scale-[0.96]">{t('calendarSync.disconnect')}</button>
          ) : (
            <button onClick={p.onConnect} className="px-3 py-1.5 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition active:scale-[0.96]">{t('calendarSync.connect')}</button>
          )}
        </div>
      </div>
    </div>
  </div>
  );
};

const AppleConnectModal: React.FC<{ onClose: () => void; onConnected: () => void }> = ({ onClose, onConnected }) => {
  const { t } = useLanguage();
  const [appleId, setAppleId] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!appleId || !appPassword) {
      toast.error('Apple ID and app-specific password are both required');
      return;
    }
    setSaving(true);
    try {
      await calendarService.appleConnect(appleId, appPassword);
      toast.success('iCloud Calendar connected!');
      onConnected();
    } catch (err: any) {
      toast.error(err?.message || 'Connection failed — check the password and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }} className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('calendarSync.apple.modal.title')}</h3>
          <button onClick={onClose} aria-label={t('common.close')} className="text-gray-500 dark:text-gray-400 hover:text-gray-600 text-2xl leading-none w-10 h-10 flex items-center justify-center">×</button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 text-sm text-blue-900 dark:text-blue-200">
          <p className="font-semibold mb-1">You need an app-specific password.</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Visit <a className="underline" href="https://appleid.apple.com" target="_blank" rel="noreferrer">appleid.apple.com</a></li>
            <li>Sign In and Security → App-Specific Passwords</li>
            <li>Generate a password labelled "MiyZapis"</li>
            <li>Paste it below alongside your Apple ID</li>
          </ol>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('calendarSync.apple.modal.appleId')}</span>
            <input type="email" value={appleId} onChange={(e) => setAppleId(e.target.value)} placeholder="you@icloud.com" className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('calendarSync.apple.modal.password')}</span>
            <input type="password" value={appPassword} onChange={(e) => setAppPassword(e.target.value)} placeholder="xxxx-xxxx-xxxx-xxxx" autoComplete="off" className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm font-mono" />
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-lg transition active:scale-[0.96]">{t('common.cancel')}</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg disabled:opacity-50 transition active:scale-[0.96] disabled:active:scale-100">
            {saving ? t('calendarSync.apple.modal.connecting') : t('calendarSync.apple.modal.connect')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const GoogleLogo: React.FC = () => (
  <svg viewBox="0 0 48 48" className="w-7 h-7" aria-hidden="true">
    <path fill="#4285f4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
    <path fill="#34a853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
    <path fill="#fbbc05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
    <path fill="#ea4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7C13.42 14.62 18.27 10.75 24 10.75z" />
  </svg>
);

const AppleLogo: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden="true">
    <path fill="currentColor" d="M17.05 12.04c-.03-3.16 2.58-4.68 2.7-4.75-1.47-2.15-3.76-2.45-4.57-2.48-1.94-.2-3.79 1.14-4.78 1.14-.99 0-2.5-1.11-4.13-1.08-2.12.03-4.08 1.23-5.17 3.13-2.21 3.83-.56 9.48 1.59 12.58 1.05 1.51 2.3 3.21 3.93 3.15 1.58-.06 2.18-1.02 4.08-1.02 1.9 0 2.45 1.02 4.12.99 1.7-.03 2.78-1.54 3.82-3.06 1.2-1.76 1.7-3.46 1.73-3.55-.04-.02-3.32-1.27-3.35-5.05zM13.94 2.99c.87-1.05 1.45-2.51 1.29-3.96-1.25.05-2.76.83-3.65 1.87-.8.93-1.5 2.42-1.31 3.84 1.39.11 2.81-.71 3.67-1.75z" />
  </svg>
);

export default CalendarSettings;
