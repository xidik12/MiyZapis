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

  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const { theme } = useSelector((state: RootState) => state.ui);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [language, setLanguage] = useState('en');
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
      dispatch(addToast({ type: 'success', title: 'Updated', message: 'Profile updated successfully' }));
      setShowEditProfile(false);
      hapticFeedback.notificationSuccess();
    } catch {
      dispatch(addToast({ type: 'error', title: 'Error', message: 'Failed to update profile' }));
      hapticFeedback.notificationError();
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSavingNotifs(true);
      await apiService.updateNotificationPreferences(notifPrefs);
      dispatch(addToast({ type: 'success', title: 'Saved', message: 'Notification preferences updated' }));
      setShowNotifications(false);
      hapticFeedback.notificationSuccess();
    } catch {
      dispatch(addToast({ type: 'error', title: 'Error', message: 'Failed to save preferences' }));
      hapticFeedback.notificationError();
    } finally {
      setSavingNotifs(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm('Are you sure you want to log out?');
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
      <Header title="Settings" />

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
          <h3 className="text-sm font-semibold text-text-secondary mb-2 px-1">Preferences</h3>
          <div className="space-y-1">
            <Card hover onClick={() => { setShowNotifications(true); hapticFeedback.impactLight(); }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent-red/15 rounded-lg flex items-center justify-center">
                    <Bell size={18} className="text-accent-red" />
                  </div>
                  <span className="text-sm text-text-primary">Notifications</span>
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
                  <span className="text-sm text-text-primary">Language</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-secondary">{language === 'uk' ? 'Українська' : language === 'ru' ? 'Русский' : 'English'}</span>
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
                  <span className="text-sm text-text-primary">Dark Mode</span>
                </div>
                <Toggle value={theme === 'dark'} onChange={toggleTheme} />
              </div>
            </Card>
          </div>
        </div>

        {/* Support */}
        <div className="px-4 py-2">
          <h3 className="text-sm font-semibold text-text-secondary mb-2 px-1">Support</h3>
          <div className="space-y-1">
            <Card hover>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent-green/15 rounded-lg flex items-center justify-center">
                    <Shield size={18} className="text-accent-green" />
                  </div>
                  <span className="text-sm text-text-primary">Privacy & Security</span>
                </div>
                <ChevronRight size={18} className="text-text-secondary" />
              </div>
            </Card>

            <Card hover>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent-yellow/15 rounded-lg flex items-center justify-center">
                    <HelpCircle size={18} className="text-accent-yellow" />
                  </div>
                  <span className="text-sm text-text-primary">Help & Support</span>
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
              <span className="text-accent-red font-medium">Sign Out</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Profile Sheet */}
      <Sheet isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Edit Profile">
        <div className="space-y-4">
          <Input
            label="First Name"
            value={profileData.firstName}
            onChange={e => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
            icon={<User size={18} />}
            placeholder="First name"
          />
          <Input
            label="Last Name"
            value={profileData.lastName}
            onChange={e => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
            icon={<User size={18} />}
            placeholder="Last name"
          />
          <Input
            label="Phone"
            type="tel"
            value={profileData.phone}
            onChange={e => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
            icon={<Phone size={18} />}
            placeholder="Phone number"
          />
          <Input
            label="Email"
            type="email"
            value={profileData.email}
            onChange={e => setProfileData(prev => ({ ...prev, email: e.target.value }))}
            icon={<Mail size={18} />}
            placeholder="Email address"
          />
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowEditProfile(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSaveProfile} className="flex-1" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Notifications Sheet */}
      <Sheet isOpen={showNotifications} onClose={() => setShowNotifications(false)} title="Notifications">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Channels</h4>
            <div className="space-y-3">
              {[
                { key: 'email' as const, label: 'Email', icon: <Mail size={16} /> },
                { key: 'sms' as const, label: 'SMS', icon: <MessageSquare size={16} /> },
                { key: 'push' as const, label: 'Push Notifications', icon: <Smartphone size={16} /> },
                { key: 'telegram' as const, label: 'Telegram', icon: <Send size={16} /> },
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
            <h4 className="text-sm font-semibold text-text-primary mb-3">Types</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary">Booking Reminders</span>
                <Toggle
                  value={notifPrefs.bookingReminders}
                  onChange={v => setNotifPrefs(p => ({ ...p, bookingReminders: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary">Promotions</span>
                <Toggle
                  value={notifPrefs.promotions}
                  onChange={v => setNotifPrefs(p => ({ ...p, promotions: v }))}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveNotifications} className="w-full" disabled={savingNotifs}>
            {savingNotifs ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </Sheet>

      {/* Language Sheet */}
      <Sheet isOpen={showLanguage} onClose={() => setShowLanguage(false)} title="Language">
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
                hapticFeedback.selectionChanged();
                setShowLanguage(false);
                dispatch(addToast({ type: 'success', title: 'Language changed', message: lang.label }));
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
                <span className="ml-auto text-accent-primary text-xs font-medium">Selected</span>
              )}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
};
