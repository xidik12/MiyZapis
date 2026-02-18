import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bell,
  Globe,
  Moon,
  Sun,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Mail,
  MessageSquare,
  Smartphone,
  Send,
  User,
  Phone,
  Camera,
  DollarSign,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState, AppDispatch } from '@/store';
import { updateProfileAsync, logout } from '@/store/slices/authSlice';
import { addToast, setTheme } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t, useCurrency } from '@/hooks/useLocale';
import { settingsStrings, commonStrings, bookingFlowStrings, profileStrings } from '@/utils/translations';

interface NotificationPrefs {
  email: boolean;
  sms: boolean;
  push: boolean;
  telegram: boolean;
  bookingReminders: boolean;
  promotions: boolean;
}

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback, showConfirm, colorScheme } = useTelegram();
  const locale = useLocale();

  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const { theme } = useSelector((state: RootState) => state.ui);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [language, setLanguage] = useState(locale);
  const [currency, setCurrency] = useCurrency();
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    email: true,
    sms: false,
    push: true,
    telegram: true,
    bookingReminders: true,
    promotions: false,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        email: user.email || '',
      });
    }
  }, [user]);

  useEffect(() => {
    apiService.getNotificationPreferences()
      .then((data: any) => { if (data) setNotifPrefs(data); })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    try {
      await dispatch(updateProfileAsync(profileData)).unwrap();
      dispatch(addToast({
        type: 'success',
        title: t(commonStrings, 'success', locale),
        message: t(profileStrings, 'editProfile', locale) + ' ' + t(commonStrings, 'success', locale).toLowerCase()
      }));
      setShowEditProfile(false);
      hapticFeedback.notificationSuccess();
    } catch {
      dispatch(addToast({
        type: 'error',
        title: t(commonStrings, 'error', locale),
        message: t(commonStrings, 'error', locale)
      }));
      hapticFeedback.notificationError();
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSavingNotifs(true);
      await apiService.updateNotificationPreferences(notifPrefs);
      dispatch(addToast({
        type: 'success',
        title: t(commonStrings, 'success', locale),
        message: t(settingsStrings, 'savePreferences', locale)
      }));
      setShowNotifications(false);
      hapticFeedback.notificationSuccess();
    } catch {
      dispatch(addToast({
        type: 'error',
        title: t(commonStrings, 'error', locale),
        message: t(commonStrings, 'error', locale)
      }));
      hapticFeedback.notificationError();
    } finally {
      setSavingNotifs(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm(t(profileStrings, 'signOut', locale) + '?');
    if (confirmed) {
      dispatch(logout());
      hapticFeedback.impactMedium();
      navigate('/auth');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    dispatch(setTheme(newTheme));
    hapticFeedback.impactLight();
  };

  const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
    <button
      onClick={() => { onChange(!value); hapticFeedback.selectionChanged(); }}
      className={`w-12 h-7 rounded-full relative transition-colors ${value ? 'bg-accent-primary' : 'bg-text-muted'}`}
    >
      <div className={`w-5 h-5 bg-bg-card rounded-full absolute top-1 transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={t(settingsStrings, 'title', locale)} />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Profile Section */}
        <div className="px-4 pt-4 pb-2">
          <Card hover onClick={() => setShowEditProfile(true)}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-bg-secondary">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={24} className="text-text-secondary" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary">{user?.firstName} {user?.lastName}</h3>
                <p className="text-sm text-text-secondary">{user?.email}</p>
              </div>
              <ChevronRight size={18} className="text-text-secondary" />
            </div>
          </Card>
        </div>

        {/* Preferences */}
        <div className="px-4 py-2">
          <h3 className="text-sm font-semibold text-text-secondary mb-2 px-1">{t(settingsStrings, 'preferences', locale)}</h3>
          <div className="space-y-1">
            <Card hover onClick={() => { setShowNotifications(true); hapticFeedback.impactLight(); }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent-red/15 rounded-lg flex items-center justify-center">
                    <Bell size={18} className="text-accent-red" />
                  </div>
                  <span className="text-sm text-text-primary">{t(settingsStrings, 'notifications', locale)}</span>
                </div>
                <ChevronRight size={18} className="text-text-secondary" />
              </div>
            </Card>

            <Card hover onClick={() => { setShowLanguage(true); hapticFeedback.impactLight(); }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent-primary/10 rounded-lg flex items-center justify-center">
                    <Globe size={18} className="text-accent-primary" />
                  </div>
                  <span className="text-sm text-text-primary">{t(settingsStrings, 'language', locale)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-secondary">{language === 'uk' ? 'Українська' : language === 'ru' ? 'Русский' : 'English'}</span>
                  <ChevronRight size={18} className="text-text-secondary" />
                </div>
              </div>
            </Card>

            <Card hover onClick={() => { setShowCurrency(true); hapticFeedback.impactLight(); }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent-green/15 rounded-lg flex items-center justify-center">
                    <DollarSign size={18} className="text-accent-green" />
                  </div>
                  <span className="text-sm text-text-primary">
                    {t(settingsStrings, 'currency', locale)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-secondary">{currency}</span>
                  <ChevronRight size={18} className="text-text-secondary" />
                </div>
              </div>
            </Card>

            <Card hover onClick={toggleTheme}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent-purple/15 rounded-lg flex items-center justify-center">
                    {theme === 'dark' ? <Moon size={18} className="text-accent-purple" /> : <Sun size={18} className="text-accent-yellow" />}
                  </div>
                  <span className="text-sm text-text-primary">{t(settingsStrings, 'darkMode', locale)}</span>
                </div>
                <Toggle value={theme === 'dark'} onChange={toggleTheme} />
              </div>
            </Card>
          </div>
        </div>

        {/* Support */}
        <div className="px-4 py-2">
          <h3 className="text-sm font-semibold text-text-secondary mb-2 px-1">{t(settingsStrings, 'support', locale)}</h3>
          <div className="space-y-1">
            <Card hover>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent-green/15 rounded-lg flex items-center justify-center">
                    <Shield size={18} className="text-accent-green" />
                  </div>
                  <span className="text-sm text-text-primary">{t(settingsStrings, 'privacySecurity', locale)}</span>
                </div>
                <ChevronRight size={18} className="text-text-secondary" />
              </div>
            </Card>

            <Card hover onClick={() => { hapticFeedback.impactLight(); navigate('/help'); }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent-yellow/15 rounded-lg flex items-center justify-center">
                    <HelpCircle size={18} className="text-accent-yellow" />
                  </div>
                  <span className="text-sm text-text-primary">{t(settingsStrings, 'helpSupport', locale)}</span>
                </div>
                <ChevronRight size={18} className="text-text-secondary" />
              </div>
            </Card>
          </div>
        </div>

        {/* Sign Out */}
        <div className="px-4 py-4">
          <Card hover onClick={handleLogout}>
            <div className="flex items-center gap-3 justify-center">
              <LogOut size={18} className="text-accent-red" />
              <span className="text-accent-red font-medium">{t(profileStrings, 'signOut', locale)}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Profile Sheet */}
      <Sheet isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title={t(profileStrings, 'editProfile', locale)}>
        <div className="space-y-4">
          <Input
            label={t(bookingFlowStrings, 'firstName', locale)}
            value={profileData.firstName}
            onChange={e => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
            icon={<User size={18} />}
            placeholder={t(bookingFlowStrings, 'firstName', locale)}
          />
          <Input
            label={t(bookingFlowStrings, 'lastName', locale)}
            value={profileData.lastName}
            onChange={e => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
            icon={<User size={18} />}
            placeholder={t(bookingFlowStrings, 'lastName', locale)}
          />
          <Input
            label={t(bookingFlowStrings, 'phoneNumber', locale)}
            type="tel"
            value={profileData.phone}
            onChange={e => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
            icon={<Phone size={18} />}
            placeholder={t(bookingFlowStrings, 'phoneNumber', locale)}
          />
          <Input
            label={t(bookingFlowStrings, 'email', locale)}
            type="email"
            value={profileData.email}
            onChange={e => setProfileData(prev => ({ ...prev, email: e.target.value }))}
            icon={<Mail size={18} />}
            placeholder={t(bookingFlowStrings, 'email', locale)}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowEditProfile(false)} className="flex-1">
              {t(commonStrings, 'cancel', locale)}
            </Button>
            <Button onClick={handleSaveProfile} className="flex-1" disabled={isLoading}>
              {isLoading ? t(commonStrings, 'loading', locale) : t(commonStrings, 'save', locale)}
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Notifications Sheet */}
      <Sheet isOpen={showNotifications} onClose={() => setShowNotifications(false)} title={t(settingsStrings, 'notifications', locale)}>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">{t(settingsStrings, 'channels', locale)}</h4>
            <div className="space-y-3">
              {[
                { key: 'email' as const, label: t(bookingFlowStrings, 'email', locale), icon: <Mail size={16} /> },
                { key: 'sms' as const, label: t(settingsStrings, 'sms', locale), icon: <MessageSquare size={16} /> },
                { key: 'push' as const, label: t(settingsStrings, 'pushNotifications', locale), icon: <Smartphone size={16} /> },
                { key: 'telegram' as const, label: t(settingsStrings, 'telegram', locale), icon: <Send size={16} /> },
              ].map(ch => (
                <div key={ch.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary">{ch.icon}</span>
                    <span className="text-sm text-text-primary">{ch.label}</span>
                  </div>
                  <Toggle
                    value={notifPrefs[ch.key]}
                    onChange={v => setNotifPrefs(p => ({ ...p, [ch.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">{t(settingsStrings, 'types', locale)}</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary">{t(settingsStrings, 'bookingReminders', locale)}</span>
                <Toggle
                  value={notifPrefs.bookingReminders}
                  onChange={v => setNotifPrefs(p => ({ ...p, bookingReminders: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary">{t(settingsStrings, 'promotions', locale)}</span>
                <Toggle
                  value={notifPrefs.promotions}
                  onChange={v => setNotifPrefs(p => ({ ...p, promotions: v }))}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveNotifications} className="w-full" disabled={savingNotifs}>
            {savingNotifs ? t(commonStrings, 'loading', locale) : t(settingsStrings, 'savePreferences', locale)}
          </Button>
        </div>
      </Sheet>

      {/* Language Sheet */}
      <Sheet isOpen={showLanguage} onClose={() => setShowLanguage(false)} title={t(settingsStrings, 'language', locale)}>
        <div className="space-y-2">
          {[
            { code: 'en', label: 'English', flag: '🇬🇧' },
            { code: 'uk', label: 'Українська', flag: '🇺🇦' },
            { code: 'ru', label: 'Русский', flag: '🇷🇺' },
          ].map(lang => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                localStorage.setItem('miyzapis_locale', lang.code);
                hapticFeedback.selectionChanged();
                setShowLanguage(false);
                dispatch(addToast({
                  type: 'success',
                  title: t(settingsStrings, 'languageChanged', locale),
                  message: lang.label
                }));
                window.location.reload();
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                language === lang.code
                  ? 'bg-accent-primary/10 border border-accent-primary'
                  : 'bg-bg-secondary hover:bg-bg-hover'
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-sm font-medium text-text-primary">{lang.label}</span>
              {language === lang.code && (
                <span className="ml-auto text-accent-primary text-xs font-medium">{t(commonStrings, 'active', locale)}</span>
              )}
            </button>
          ))}
        </div>
      </Sheet>

      {/* Currency Sheet */}
      <Sheet
        isOpen={showCurrency}
        onClose={() => setShowCurrency(false)}
        title={t(settingsStrings, 'currency', locale)}
      >
        <div className="space-y-2">
          {[
            { code: 'UAH', symbol: '₴', label: locale === 'uk' ? 'Гривня (₴)' : locale === 'ru' ? 'Гривна (₴)' : 'Ukrainian Hryvnia (₴)' },
            { code: 'USD', symbol: '$', label: locale === 'uk' ? 'Долар ($)' : locale === 'ru' ? 'Доллар ($)' : 'US Dollar ($)' },
            { code: 'EUR', symbol: '€', label: locale === 'uk' ? 'Євро (€)' : locale === 'ru' ? 'Евро (€)' : 'Euro (€)' },
          ].map(cur => (
            <button
              key={cur.code}
              onClick={() => {
                setCurrency(cur.code);
                hapticFeedback.selectionChanged();
                setShowCurrency(false);
                dispatch(addToast({
                  type: 'success',
                  title: t(settingsStrings, 'currencyChanged', locale),
                  message: cur.label,
                }));
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                currency === cur.code
                  ? 'bg-accent-primary/10 border border-accent-primary'
                  : 'bg-bg-secondary hover:bg-bg-hover'
              }`}
            >
              <span className="text-xl font-bold">{cur.symbol}</span>
              <span className="text-sm font-medium text-text-primary">{cur.label}</span>
              {currency === cur.code && (
                <span className="ml-auto text-accent-primary text-xs font-medium">{t(commonStrings, 'active', locale)}</span>
              )}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
};
