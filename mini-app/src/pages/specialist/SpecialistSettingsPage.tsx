import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Calendar,
  Briefcase,
  Bell,
  Wallet,
  BarChart3,
  Star,
  Users,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { specialistSettingsStrings, commonStrings } from '@/utils/translations';

interface MenuItem {
  key: string;
  labelKey: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { key: 'profile', labelKey: 'profile', icon: User, iconColor: 'text-accent-primary', iconBg: 'bg-accent-primary/10', route: '/specialist/profile/edit' },
  { key: 'schedule', labelKey: 'schedule', icon: Calendar, iconColor: 'text-accent-green', iconBg: 'bg-accent-green/10', route: '/specialist/schedule' },
  { key: 'services', labelKey: 'services', icon: Briefcase, iconColor: 'text-accent-purple', iconBg: 'bg-accent-purple/10', route: '/specialist/services' },
  { key: 'notifications', labelKey: 'notifications', icon: Bell, iconColor: 'text-accent-red', iconBg: 'bg-accent-red/10', route: '/settings' },
  { key: 'wallet', labelKey: 'wallet', icon: Wallet, iconColor: 'text-blue-400', iconBg: 'bg-blue-400/10', route: '/specialist/wallet' },
  { key: 'analytics', labelKey: 'analytics', icon: BarChart3, iconColor: 'text-accent-yellow', iconBg: 'bg-accent-yellow/10', route: '/specialist/analytics' },
  { key: 'reviews', labelKey: 'reviews', icon: Star, iconColor: 'text-yellow-400', iconBg: 'bg-yellow-400/10', route: '/specialist/reviews' },
  { key: 'clients', labelKey: 'clients', icon: Users, iconColor: 'text-teal-400', iconBg: 'bg-teal-400/10', route: '/specialist/clients' },
];

export const SpecialistSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback } = useTelegram();
  const locale = useLocale();

  const [autoConfirm, setAutoConfirm] = useState(false);
  const [bufferTime, setBufferTime] = useState(15);

  const handleNavigate = (route: string) => {
    hapticFeedback.impactLight();
    navigate(route);
  };

  const handleToggleAutoConfirm = async () => {
    const newValue = !autoConfirm;
    setAutoConfirm(newValue);
    hapticFeedback.selectionChanged();

    try {
      await apiService.updateSpecialistProfile({ autoConfirm: newValue });
    } catch {
      setAutoConfirm(!newValue);
      dispatch(addToast({
        type: 'error',
        title: t(commonStrings, 'error', locale),
        message: t(commonStrings, 'error', locale),
      }));
    }
  };

  const handleBufferTimeChange = async (minutes: number) => {
    setBufferTime(minutes);
    hapticFeedback.selectionChanged();

    try {
      await apiService.updateSpecialistProfile({ bufferTime: minutes });
    } catch {
      dispatch(addToast({
        type: 'error',
        title: t(commonStrings, 'error', locale),
        message: t(commonStrings, 'error', locale),
      }));
    }
  };

  const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-7 rounded-full relative transition-colors ${value ? 'bg-accent-primary' : 'bg-text-muted'}`}
    >
      <div className={`w-5 h-5 bg-bg-card rounded-full absolute top-1 transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  const BUFFER_OPTIONS = [0, 5, 10, 15, 30, 60];

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={t(specialistSettingsStrings, 'title', locale)} />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Menu Items */}
        <div className="px-4 pt-4">
          <div className="space-y-1">
            {MENU_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <Card key={item.key} hover onClick={() => handleNavigate(item.route)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 ${item.iconBg} rounded-lg flex items-center justify-center`}>
                        <Icon size={18} className={item.iconColor} />
                      </div>
                      <span className="text-sm text-text-primary">
                        {t(specialistSettingsStrings, item.labelKey, locale)}
                      </span>
                    </div>
                    <ChevronRight size={18} className="text-text-secondary" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Booking Settings */}
        <div className="px-4 py-4">
          <h3 className="text-sm font-semibold text-text-secondary mb-2 px-1">
            {t(specialistSettingsStrings, 'bookingSettings', locale)}
          </h3>
          <div className="space-y-1">
            {/* Auto-confirm toggle */}
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent-green/10 rounded-lg flex items-center justify-center">
                    <Settings size={18} className="text-accent-green" />
                  </div>
                  <div>
                    <span className="text-sm text-text-primary block">
                      {t(specialistSettingsStrings, 'autoConfirm', locale)}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {locale === 'uk'
                        ? 'Автоматично підтверджувати нові записи'
                        : locale === 'ru'
                        ? 'Автоматически подтверждать новые записи'
                        : 'Automatically confirm new bookings'}
                    </span>
                  </div>
                </div>
                <Toggle value={autoConfirm} onChange={handleToggleAutoConfirm} />
              </div>
            </Card>

            {/* Buffer time */}
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-accent-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar size={18} className="text-accent-primary" />
                </div>
                <div>
                  <span className="text-sm text-text-primary block">
                    {t(specialistSettingsStrings, 'bufferTime', locale)}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {locale === 'uk'
                      ? 'Час між записами для підготовки'
                      : locale === 'ru'
                      ? 'Время между записями для подготовки'
                      : 'Time between bookings to prepare'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {BUFFER_OPTIONS.map(min => (
                  <button
                    key={min}
                    onClick={() => handleBufferTimeChange(min)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      bufferTime === min
                        ? 'bg-accent-primary text-white'
                        : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                    }`}
                  >
                    {min === 0
                      ? (locale === 'uk' ? 'Без буфера' : locale === 'ru' ? 'Без буфера' : 'None')
                      : `${min} ${t(commonStrings, 'min', locale)}`}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
