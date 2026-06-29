import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectUser, updateUserProfile } from '../../store/slices/authSlice';
import { fileUploadService } from '../../services/fileUpload.service';
import { userService } from '../../services/user.service';
import { specialistService } from '../../services/specialist.service';
import { Avatar } from '../../components/ui/Avatar';
import { InlineLoader, ContentLoader } from '@/components/ui';
import { toast } from 'react-toastify';
import SetPasswordModal from '../../components/auth/SetPasswordModal';
import ChangePasswordModal from '../../components/auth/ChangePasswordModal';
import TelegramLinkWidget from '../../components/auth/TelegramLinkWidget';
import { UserIcon, BellIcon, ShieldCheckIcon, CreditCardIcon, GlobeIcon as GlobeAltIcon, Cog6ToothIcon, EnvelopeIcon, CameraIcon, TrashIcon, KeyIcon, LockClosedIcon, LinkIcon, ClockIcon, BriefcaseIcon, ImageIcon as PhotoIcon } from '@/components/icons';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useSpecialistProfile } from '../../hooks/useSpecialistProfile';
import PersonalInfoTab from '../../components/settings/PersonalInfoTab';
import ProfessionalTab from '../../components/settings/ProfessionalTab';
import WorkingHoursTab from '../../components/settings/WorkingHoursTab';
import PaymentDetailsTab from '../../components/settings/PaymentDetailsTab';
import PortfolioTab from '../../components/settings/PortfolioTab';
import ConfirmModal from '@/components/ui/ConfirmModal';
import DeleteAccountModal from '@/components/modals/DeleteAccountModal';
import { BookingShareCard } from '../../components/sharing/BookingShareCard';
import { HelpTip } from '@/components/common/HelpTip';

const SETTINGS_HELP = {
  en: {
    overview:
      'Settings — account, profile & preferences\n\nThis page has two groups:\n\nProfile & Business (left sidebar):\n• Profile — your avatar/photo and public booking link (slug).\n• Personal Info — name, email, phone (with phone verification), bio, precise address, business phone, WhatsApp, parking info, access instructions.\n• Professional — profession/specialty, years of experience, education, languages, specialties.\n• Working Hours — default weekly availability template used to auto-generate schedule slots.\n• Payment Details — accepted payment methods, bank details (bank name, account name, account number, IBAN, SWIFT, notes), payment QR code.\n• Portfolio — upload work photos shown on your public profile.\n\nApp Settings:\n• Account — auto-accept bookings, instant bookings, profile visibility in search.\n• Security — set or change password.\n• Connected Accounts — link/unlink your Telegram account.\n• Notifications — email, push and SMS preferences.\n• Privacy — control what clients can see (phone, email, address).\n• Business — global cancellation window; how many hours before appointment a client can cancel free.\n• Language — interface language (Ukrainian / English / Russian).',
    workingHours:
      'Working Hours (Settings → Working Hours)\n\nThis is your default weekly schedule template — NOT individual bookings.\n\nHow it works:\n• Mark each day as working or not, and set start/end times.\n• This template is used by the "Generate from working hours" button on the Schedule page to auto-create availability blocks for future weeks.\n• Changing these hours does NOT retroactively change existing availability blocks — you must regenerate or edit manually.\n\nExample: Mon–Fri 09:00–18:00, Sat 10:00–15:00, Sun closed.',
    slug:
      'Public booking link (slug)\n\nYour slug is the unique URL path clients use to find and book you:\nhttps://miyzapis.com/s/YOUR-SLUG\n\nRules:\n• Lowercase letters, numbers and hyphens only.\n• Must be unique across the platform.\n• Changing it breaks existing links — notify your clients if you do.',
    payment:
      'Payment details\n\nThis information is shown to clients on booking confirmation so they know how to pay you.\n\n• Accepted methods — tick which payment methods you accept (cash, card, bank transfer, online, crypto).\n• Bank details — fill in for bank transfer clients: bank name, account holder name, account number, IBAN, SWIFT/BIC, optional notes.\n• Payment QR code — upload a QR image (e.g. Monobank, PrivatBank link) clients can scan to pay instantly.\n\nThese details appear on booking confirmations.',
    privacy:
      'Privacy settings\n\nControl what clients can see on your public profile:\n• Show phone number — if off, clients cannot see your personal phone.\n• Show email — if off, email is hidden.\n• Allow direct messages — whether clients can message you outside bookings.\n• Show last seen — activity indicator.\n\nYour precise address, parking info and access instructions (from Personal Info) are shown to clients only after booking confirmation.',
  },
  uk: {
    overview:
      'Налаштування — акаунт, профіль та вподобання\n\nЦя сторінка має дві групи:\n\nПрофіль та бізнес (ліва бічна панель):\n• Профіль — ваша аватарка та публічне посилання для бронювання (slug).\n• Особиста інформація — ім\'я, email, телефон (з верифікацією), біо, точна адреса, робочий телефон, WhatsApp, інфо про паркування, інструкції доступу.\n• Професійне — спеціалізація, досвід, освіта, мови, спеціальності.\n• Графік роботи — шаблон тижневої доступності для автоматичної генерації слотів розкладу.\n• Реквізити оплати — прийнятні методи оплати, банківські реквізити (банк, власник рахунку, номер рахунку, IBAN, SWIFT, примітки), QR-код оплати.\n• Портфоліо — завантажте фото робіт для публічного профілю.\n\nНалаштування застосунку:\n• Акаунт — автоприйняття бронювань, миттєве бронювання, видимість у пошуку.\n• Безпека — встановити або змінити пароль.\n• Підключені акаунти — прив\'язати/від\'язати Telegram.\n• Сповіщення — налаштування email, push та SMS.\n• Конфіденційність — що бачать клієнти (телефон, email, адреса).\n• Бізнес — глобальне вікно скасування; за скільки годин до прийому клієнт може скасувати безкоштовно.\n• Мова — мова інтерфейсу.',
    workingHours:
      'Графік роботи (Налаштування → Графік роботи)\n\nЦе шаблон вашого тижневого розкладу — НЕ окремі бронювання.\n\nЯк це працює:\n• Позначте кожен день як робочий або вихідний і вкажіть час початку/завершення.\n• Цей шаблон використовується кнопкою "Згенерувати з робочих годин" на сторінці Розкладу для автоматичного створення блоків доступності на майбутні тижні.\n• Зміна цих годин НЕ впливає ретроактивно на існуючі блоки — потрібно перегенерувати або редагувати вручну.\n\nПриклад: Пн–Пт 09:00–18:00, Сб 10:00–15:00, Нд вихідний.',
    slug:
      'Публічне посилання для бронювання (slug)\n\nВаш slug — це унікальний URL-шлях, за яким клієнти знаходять і бронюють вас:\nhttps://miyzapis.com/s/ВАШ-SLUG\n\nПравила:\n• Лише малі латинські літери, цифри та дефіси.\n• Має бути унікальним на платформі.\n• Зміна slug ламає існуючі посилання — повідомте клієнтів, якщо зміните.',
    payment:
      'Реквізити оплати\n\nЦя інформація відображається клієнтам після підтвердження бронювання, щоб вони знали, як оплатити.\n\n• Методи оплати — позначте, які методи ви приймаєте (готівка, картка, банківський переказ, онлайн, крипто).\n• Банківські реквізити — для клієнтів, які платять переказом: назва банку, власник рахунку, номер рахунку, IBAN, SWIFT/BIC, примітки.\n• QR-код оплати — завантажте QR-зображення (наприклад, посилання Monobank або PrivatBank) для миттєвої оплати скануванням.\n\nЦі дані з\'являються в підтвердженнях бронювання.',
    privacy:
      'Налаштування конфіденційності\n\nКеруйте тим, що бачать клієнти у вашому публічному профілі:\n• Показувати номер телефону — якщо вимкнено, клієнти не бачать ваш особистий телефон.\n• Показувати email — якщо вимкнено, email приховано.\n• Дозволити прямі повідомлення — чи можуть клієнти писати вам поза бронюваннями.\n• Показувати останній вхід — індикатор активності.\n\nТочна адреса, інфо про паркування та інструкції доступу відображаються клієнтам лише після підтвердження бронювання.',
  },
  ru: {
    overview:
      'Настройки — аккаунт, профиль и предпочтения\n\nЭта страница имеет две группы:\n\nПрофиль и бизнес (левая боковая панель):\n• Профиль — ваш аватар и публичная ссылка для бронирования (slug).\n• Личная информация — имя, email, телефон (с верификацией), био, точный адрес, рабочий телефон, WhatsApp, информация о парковке, инструкции доступа.\n• Профессиональное — специализация, опыт, образование, языки, специальности.\n• График работы — шаблон еженедельной доступности для автоматической генерации слотов расписания.\n• Реквизиты оплаты — принимаемые методы оплаты, банковские реквизиты (банк, держатель счёта, номер счёта, IBAN, SWIFT, заметки), QR-код оплаты.\n• Портфолио — загрузите фото работ для публичного профиля.\n\nНастройки приложения:\n• Аккаунт — автоприём бронирований, мгновенное бронирование, видимость в поиске.\n• Безопасность — установить или изменить пароль.\n• Подключённые аккаунты — привязать/отвязать Telegram.\n• Уведомления — настройки email, push и SMS.\n• Конфиденциальность — что видят клиенты (телефон, email, адрес).\n• Бизнес — глобальное окно отмены; за сколько часов до приёма клиент может отменить бесплатно.\n• Язык — язык интерфейса.',
    workingHours:
      'График работы (Настройки → График работы)\n\nЭто шаблон вашего еженедельного расписания — НЕ отдельные бронирования.\n\nКак это работает:\n• Отметьте каждый день как рабочий или выходной и укажите время начала/окончания.\n• Этот шаблон используется кнопкой "Сгенерировать из рабочих часов" на странице Расписания для автоматического создания блоков доступности на будущие недели.\n• Изменение этих часов НЕ влияет ретроактивно на существующие блоки — нужно перегенерировать или редактировать вручную.\n\nПример: Пн–Пт 09:00–18:00, Сб 10:00–15:00, Вс выходной.',
    slug:
      'Публичная ссылка для бронирования (slug)\n\nВаш slug — уникальный URL-путь, по которому клиенты находят и бронируют вас:\nhttps://miyzapis.com/s/ВАШ-SLUG\n\nПравила:\n• Только строчные латинские буквы, цифры и дефисы.\n• Должен быть уникальным на платформе.\n• Изменение slug ломает существующие ссылки — предупредите клиентов, если измените.',
    payment:
      'Реквизиты оплаты\n\nЭта информация отображается клиентам после подтверждения бронирования.\n\n• Методы оплаты — отметьте, какие методы вы принимаете (наличные, карта, банковский перевод, онлайн, крипто).\n• Банковские реквизиты — для клиентов, платящих переводом: название банка, держатель счёта, номер счёта, IBAN, SWIFT/BIC, заметки.\n• QR-код оплаты — загрузите QR-изображение (например, ссылку Monobank или PrivatBank) для мгновенной оплаты сканированием.\n\nЭти данные появляются в подтверждениях бронирования.',
    privacy:
      'Настройки конфиденциальности\n\nУправляйте тем, что видят клиенты в вашем публичном профиле:\n• Показывать номер телефона — если выключено, клиенты не видят ваш личный телефон.\n• Показывать email — если выключено, email скрыт.\n• Разрешить прямые сообщения — могут ли клиенты писать вам вне бронирований.\n• Показывать последний вход — индикатор активности.\n\nТочный адрес, информация о парковке и инструкции доступа отображаются клиентам только после подтверждения бронирования.',
  },
};

const SpecialistSettings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const h = (SETTINGS_HELP as any)[language] || SETTINGS_HELP.en;
  const { currency, setCurrency } = useCurrency();
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  
  // Web Push subscription management
  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    isDenied: isPushDenied,
    isLoading: isPushLoading,
    toggle: togglePushSubscription,
  } = usePushNotifications();

  // Profile image state
  const [profileImage, setProfileImage] = useState(user?.avatar || '');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Modal states
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [isUnlinkingTelegram, setIsUnlinkingTelegram] = useState(false);
  const [showUnlinkTelegramModal, setShowUnlinkTelegramModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Specialist profile state (for booking link, payment options, etc.)
  const [specialist, setSpecialist] = useState<any>(null);

  // Specialist profile hook for new tabs
  const specialistProfile = useSpecialistProfile();

  // Active tab state
  type SettingsTab = 'profile' | 'personal' | 'professional' | 'working-hours' | 'payment-details' | 'portfolio' | 'account' | 'security' | 'accounts' | 'notifications' | 'privacy' | 'business' | 'language';
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Update profileImage when user avatar changes
  useEffect(() => {
    if (user?.avatar !== profileImage) {
      setProfileImage(user?.avatar || '');
    }
  }, [user?.avatar]);

  // Load specialist profile settings on mount
  useEffect(() => {
    const loadSpecialistSettings = async () => {
      try {
        // Run both fetches in parallel; preferences failure must not block the page
        const [profile, prefsResult] = await Promise.allSettled([
          specialistService.getProfile(),
          userService.getPreferences(),
        ]);

        const profileData = profile.status === 'fulfilled' ? profile.value : null;
        const prefsData =
          prefsResult.status === 'fulfilled'
            ? (prefsResult.value as any)?.preferences?.notifications
            : null;

        if (profileData) {
          setSpecialist(profileData);
        } else {
          console.error('Error loading specialist profile:', (profile as PromiseRejectedResult).reason);
        }

        if (prefsResult.status === 'rejected') {
          console.error('Error loading notification preferences:', prefsResult.reason);
        }

        // Build loaded settings outside the updater to avoid side-effects in strict-mode double-calls
        setSettings(prev => {
          const next = {
            ...prev,
            accountSettings: profileData
              ? {
                  ...prev.accountSettings,
                  autoAcceptBookings: (profileData as any).autoBooking ?? false,
                  requireVerification: (profileData as any).requireVerifiedCustomer ?? false,
                  showProfileInSearch: (profileData as any).listedInSearch ?? true,
                }
              : prev.accountSettings,
            notifications: {
              ...prev.notifications,
              ...(prefsData != null
                ? {
                    emailNotifications: prefsData.email ?? prev.notifications.emailNotifications,
                    pushNotifications: prefsData.push ?? prev.notifications.pushNotifications,
                  }
                : {}),
            },
            business: profileData
              ? {
                  ...prev.business,
                  cancellationWindow: (profileData as any).cancellationWindowHours ?? 24,
                  allowPayAtVenue: (profileData as any).allowPayAtVenue ?? false,
                }
              : prev.business,
          };
          return next;
        });
        // Sync savedSettings separately so Cancel reverts to real DB values, not hardcoded defaults.
        // We re-derive the same merged object using the default state as the base — this is safe
        // because we call this once after mount and savedSettings starts from the same defaults.
        setSavedSettings(prev => ({
          ...prev,
          accountSettings: profileData
            ? {
                ...prev.accountSettings,
                autoAcceptBookings: (profileData as any).autoBooking ?? false,
                requireVerification: (profileData as any).requireVerifiedCustomer ?? false,
                showProfileInSearch: (profileData as any).listedInSearch ?? true,
              }
            : prev.accountSettings,
          notifications: {
            ...prev.notifications,
            ...(prefsData != null
              ? {
                  emailNotifications: prefsData.email ?? prev.notifications.emailNotifications,
                  pushNotifications: prefsData.push ?? prev.notifications.pushNotifications,
                }
              : {}),
          },
          business: profileData
            ? {
                ...prev.business,
                cancellationWindow: (profileData as any).cancellationWindowHours ?? 24,
                allowPayAtVenue: (profileData as any).allowPayAtVenue ?? false,
              }
            : prev.business,
        }));
      } catch (error) {
        console.error('Error loading specialist settings:', error);
      }
    };
    loadSpecialistSettings();
  }, []);

  // Settings state
  const [settings, setSettings] = useState({
    // Account Settings
    accountSettings: {
      autoAcceptBookings: false,
      requireVerification: false,
      showProfileInSearch: true,
    },
    
    // Notification Settings
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      newBookingAlert: true,
      bookingReminders: true,
      paymentNotifications: true,
      reviewNotifications: true,
      marketingEmails: false,
    },
    
    // Privacy Settings
    privacy: {
      showPhoneNumber: false,
      showEmail: false,
      allowDirectMessages: true,
      showLastSeen: true,
      dataProcessingConsent: true,
      marketingConsent: false,
    },
    
    // Business Settings
    business: {
      acceptOnlinePayments: true,
      cancellationWindow: 24,
      rescheduleLimit: 2,
      autoReviewReminder: true,
      allowPayAtVenue: false,
    },
  });

  const handleSettingChange = (category: string, setting: string, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value,
      },
    }));
  };

  // Handle profile image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setUploadError(
        language === 'uk' ? 'Будь ласка, оберіть файл зображення' :
        language === 'ru' ? 'Пожалуйста, выберите файл изображения' :
        'Please select an image file'
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadError(
        language === 'uk' ? 'Розмір файлу повинен бути менше 5МБ' :
        language === 'ru' ? 'Размер файла должен быть меньше 5МБ' :
        'File size must be less than 5MB'
      );
      return;
    }

    try {
      setIsUploadingImage(true);
      setUploadError('');
      setUploadSuccess(false);

      // Upload the image
      const result = await fileUploadService.uploadAvatar(file);

      // Update user profile with new avatar URL
      await userService.updateProfile({ avatar: result.url });

      // Update Redux store with only the avatar field
      dispatch(updateUserProfile({ avatar: result.url }));

      // Update local state
      setProfileImage(result.url);
      setUploadSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);

    } catch (error: unknown) {
      console.error('[Settings Avatar Upload] Upload failed:', error);
      setUploadError(
        (error as any).message ||
        (language === 'uk' ? 'Помилка завантаження зображення' :
         language === 'ru' ? 'Ошибка загрузки изображения' :
         'Failed to upload image')
      );
    } finally {
      setIsUploadingImage(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  // Handle profile image removal
  const handleImageRemove = async () => {
    try {
      setIsUploadingImage(true);
      setUploadError('');
      
      // Update user profile to remove avatar (null clears the field on the backend)
      await userService.updateProfile({ avatar: null });

      // Update Redux store with only the avatar field
      dispatch(updateUserProfile({ avatar: undefined }));
      
      // Update local state
      setProfileImage('');
      setUploadSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
      
    } catch (error: unknown) {
      console.error('Error removing avatar:', error);
      setUploadError(
        (error as any).message ||
        (language === 'uk' ? 'Помилка видалення зображення' :
         language === 'ru' ? 'Ошибка удаления изображения' :
         'Failed to remove image')
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUnlinkTelegram = () => {
    setShowUnlinkTelegramModal(true);
  };

  const confirmUnlinkTelegram = async () => {
    try {
      setIsUnlinkingTelegram(true);
      await userService.unlinkTelegram();
      dispatch(updateUserProfile({ telegramId: undefined } as any));
      toast.success(
        language === 'uk' ? 'Telegram відключено' :
        language === 'ru' ? 'Telegram отключен' :
        'Telegram unlinked'
      );
    } catch (error: unknown) {
      toast.error((error as any).message || t('settings.telegramUnlinkFailed'));
    } finally {
      setIsUnlinkingTelegram(false);
      setShowUnlinkTelegramModal(false);
    }
  };

  const ToggleSwitch = ({ 
    enabled, 
    onChange, 
    label, 
    description 
  }: { 
    enabled: boolean; 
    onChange: (value: boolean) => void; 
    label: string; 
    description?: string; 
  }) => (
    <div className="flex items-start justify-between py-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</h4>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  // State to track saving in progress
  const [isSaving, setIsSaving] = useState(false);

  // Snapshot of settings at last save — used by Cancel to reset unsaved changes
  const [savedSettings, setSavedSettings] = useState(settings);

  // Handle saving all settings
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);

      const savePromises: Promise<unknown>[] = [];

      // Account + Business tabs: persist specialist profile fields
      if (['account', 'business'].includes(activeTab)) {
        savePromises.push(
          specialistService.updateProfile({
            cancellationWindowHours: settings.business.cancellationWindow,
            allowPayAtVenue: settings.business.allowPayAtVenue,
            autoBooking: settings.accountSettings.autoAcceptBookings,
            listedInSearch: settings.accountSettings.showProfileInSearch,
            requireVerifiedCustomer: settings.accountSettings.requireVerification,
          } as any)
        );
      }

      // Notifications tab: persist email + push prefs via userService.updatePreferences
      if (activeTab === 'notifications') {
        savePromises.push(
          userService.updatePreferences({
            notifications: {
              email: settings.notifications.emailNotifications,
              push: settings.notifications.pushNotifications,
              telegram: false, // no telegram toggle in this UI
            },
          })
        );
      }

      await Promise.all(savePromises);

      setSavedSettings(settings);
      toast.success(
        language === 'uk' ? 'Налаштування збережено' :
        language === 'ru' ? 'Настройки сохранены' :
        'Settings saved'
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(
        language === 'uk' ? 'Помилка збереження налаштувань' :
        language === 'ru' ? 'Ошибка сохранения настроек' :
        'Failed to save settings'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSettings = () => {
    setSettings(savedSettings);
  };

  return (
    
      <div className="bg-gray-50 dark:bg-gray-900 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {t('settings.title')}
                </h1>
                <HelpTip title={t('help.settings.title') || 'Settings'} content={h.overview} />
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('settings.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Settings Navigation */}
              <div className="lg:col-span-1">
                <nav className="space-y-1 bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                  {/* Profile & Business Group */}
                  <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {language === 'uk' ? 'Профіль' : language === 'ru' ? 'Профиль' : 'Profile & Business'}
                  </p>
                  {([
                    { id: 'profile' as SettingsTab, icon: UserIcon, label: t('settings.profile') || 'Profile' },
                    { id: 'personal' as SettingsTab, icon: EnvelopeIcon, label: language === 'uk' ? 'Особиста інформація' : language === 'ru' ? 'Личная информация' : 'Personal Info' },
                    { id: 'professional' as SettingsTab, icon: BriefcaseIcon, label: language === 'uk' ? 'Професійне' : language === 'ru' ? 'Профессиональное' : 'Professional' },
                    { id: 'working-hours' as SettingsTab, icon: ClockIcon, label: language === 'uk' ? 'Графік роботи' : language === 'ru' ? 'График работы' : 'Working Hours' },
                    { id: 'payment-details' as SettingsTab, icon: CreditCardIcon, label: language === 'uk' ? 'Реквізити оплати' : language === 'ru' ? 'Реквизиты оплаты' : 'Payment Details' },
                    { id: 'portfolio' as SettingsTab, icon: PhotoIcon, label: language === 'uk' ? 'Портфоліо' : language === 'ru' ? 'Портфолио' : 'Portfolio' },
                  ]).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                        activeTab === item.id
                          ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </button>
                  ))}

                  {/* App Settings Group */}
                  <p className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {language === 'uk' ? 'Налаштування' : language === 'ru' ? 'Настройки' : 'App Settings'}
                  </p>
                  {([
                    { id: 'account' as SettingsTab, icon: Cog6ToothIcon, label: t('settings.account') },
                    { id: 'security' as SettingsTab, icon: ShieldCheckIcon, label: t('customer.settings.passwordSecurity') },
                    { id: 'accounts' as SettingsTab, icon: LinkIcon, label: t('customer.settings.connectedAccounts') },
                    { id: 'notifications' as SettingsTab, icon: BellIcon, label: t('settings.notifications') },
                    { id: 'privacy' as SettingsTab, icon: ShieldCheckIcon, label: t('settings.privacy') },
                    { id: 'business' as SettingsTab, icon: CreditCardIcon, label: t('settings.business') },
                    { id: 'language' as SettingsTab, icon: GlobeAltIcon, label: t('settings.language') },
                  ]).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                        activeTab === item.id
                          ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Settings Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Profile Settings */}
                {activeTab === 'profile' && (
                <div id="profile" className="bg-white dark:bg-gray-800 rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <UserIcon className="w-5 h-5 mr-2" />
                      {t('settings.profile') || 'Profile'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.profileDescription') || 'Manage your profile photo and personal information'}
                    </p>
                  </div>
                  <div className="p-6">
                    {/* Profile Image Upload */}
                    <div className="mb-8">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                        {language === 'uk' ? 'Фото профілю' : language === 'ru' ? 'Фото профиля' : 'Profile Photo'}
                      </label>
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <Avatar
                            src={profileImage}
                            alt={user?.firstName || 'Profile'}
                            size="xl"
                            className="border-4 border-gray-200 dark:border-gray-600"
                          />
                          {isUploadingImage && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                              <InlineLoader size="md" color="white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-3">
                          <div className="flex space-x-3">
                            <input
                              id="settings-avatar-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={isUploadingImage}
                            />
                            <label
                              htmlFor="settings-avatar-upload"
                              className={`cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-700 transition active:scale-[0.96] ${isUploadingImage ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                            >
                              <CameraIcon className="w-4 h-4 inline mr-2" />
                              {isUploadingImage ?
                                (t('settings.upload.uploading') || 'Uploading...') :
                                (t('settings.upload.changePhoto') || 'Change Photo')
                              }
                            </label>
                            
                            {profileImage && (
                              <button
                                onClick={handleImageRemove}
                                disabled={isUploadingImage}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-4 py-2 rounded-xl font-medium transition active:scale-[0.96] disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed border border-red-200 hover:border-red-300 dark:border-red-700 dark:hover:border-red-600"
                              >
                                <TrashIcon className="w-4 h-4 inline mr-2" />
                                {language === 'uk' ? 'Видалити' : language === 'ru' ? 'Удалить' : 'Remove'}
                              </button>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {language === 'uk' ? 'Максимальний розмір: 5МБ. Підтримуються формати: JPG, PNG, WebP' :
                             language === 'ru' ? 'Максимальный размер: 5МБ. Поддерживаемые форматы: JPG, PNG, WebP' :
                             'Maximum size: 5MB. Supported formats: JPG, PNG, WebP'}
                          </p>
                          
                          {/* Upload Status Messages */}
                          {uploadError && (
                            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl border border-red-200 dark:border-red-800">
                              {uploadError}
                            </div>
                          )}
                          
                          {uploadSuccess && (
                            <div className="text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl border border-green-200 dark:border-green-800">
                              {language === 'uk' ? 'Фото успішно оновлено!' : language === 'ru' ? 'Фото успешно обновлено!' : 'Photo updated successfully!'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Share & Embed booking widget */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {language === 'uk' ? 'Публічне посилання' : language === 'ru' ? 'Публичная ссылка' : 'Public booking link'}
                      </p>
                      <HelpTip title={language === 'uk' ? 'Публічне посилання (slug)' : language === 'ru' ? 'Публичная ссылка (slug)' : 'Public booking link (slug)'} content={h.slug} size={14} />
                    </div>
                    <BookingShareCard
                      slug={specialist?.slug}
                      id={specialist?.id || user?.id}
                      target="specialist"
                      name={[user?.firstName, user?.lastName].filter(Boolean).join(' ') || (specialist as any)?.businessName}
                    />
                  </div>
                </div>
                )}

                {/* Personal Info Tab */}
                {activeTab === 'personal' && !specialistProfile.loading && (
                  <PersonalInfoTab
                    profile={specialistProfile.profile}
                    onProfileChange={specialistProfile.handleProfileChange}
                    validationErrors={specialistProfile.validationErrors}
                    saving={specialistProfile.saving}
                    onSave={specialistProfile.handleSave}
                  />
                )}

                {/* Professional Tab */}
                {activeTab === 'professional' && !specialistProfile.loading && (
                  <ProfessionalTab
                    profile={specialistProfile.profile}
                    onProfileChange={specialistProfile.handleProfileChange}
                    validationErrors={specialistProfile.validationErrors}
                    saving={specialistProfile.saving}
                    onSave={specialistProfile.handleSave}
                  />
                )}

                {/* Working Hours Tab */}
                {activeTab === 'working-hours' && !specialistProfile.loading && (
                  <>
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4 flex items-start gap-2">
                      <HelpTip title={language === 'uk' ? 'Графік роботи' : language === 'ru' ? 'График работы' : 'Working Hours'} content={h.workingHours} />
                      <p className="text-sm text-blue-700 dark:text-blue-300 flex-1">
                        {language === 'uk'
                          ? 'Шаблон тижневої доступності. Використовується для автоматичної генерації слотів розкладу.'
                          : language === 'ru'
                          ? 'Шаблон еженедельной доступности. Используется для автоматической генерации слотов расписания.'
                          : 'Weekly availability template. Used to auto-generate schedule slots.'}
                      </p>
                    </div>
                    <WorkingHoursTab
                      profile={specialistProfile.profile}
                      onProfileChange={specialistProfile.handleProfileChange}
                      saving={specialistProfile.saving}
                      onSave={specialistProfile.handleSave}
                    />
                  </>
                )}

                {/* Payment Details Tab */}
                {activeTab === 'payment-details' && !specialistProfile.loading && (
                  <>
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4 flex items-start gap-2">
                      <HelpTip title={language === 'uk' ? 'Реквізити оплати' : language === 'ru' ? 'Реквизиты оплаты' : 'Payment Details'} content={h.payment} />
                      <p className="text-sm text-blue-700 dark:text-blue-300 flex-1">
                        {language === 'uk'
                          ? 'Банківські реквізити та QR-код, які клієнти бачать після підтвердження бронювання.'
                          : language === 'ru'
                          ? 'Банковские реквизиты и QR-код, которые клиенты видят после подтверждения бронирования.'
                          : 'Bank details and QR code shown to clients after booking confirmation.'}
                      </p>
                    </div>
                    <PaymentDetailsTab
                      profile={specialistProfile.profile}
                      onProfileChange={specialistProfile.handleProfileChange}
                      saving={specialistProfile.saving}
                      onSave={specialistProfile.handleSave}
                    />
                  </>
                )}

                {/* Portfolio Tab */}
                {activeTab === 'portfolio' && !specialistProfile.loading && (
                  <PortfolioTab
                    profile={specialistProfile.profile}
                    onProfileChange={specialistProfile.handleProfileChange}
                    saving={specialistProfile.saving}
                    onSave={specialistProfile.handleSave}
                  />
                )}

                {/* Loading state for profile tabs */}
                {['personal', 'professional', 'working-hours', 'payment-details', 'portfolio'].includes(activeTab) && specialistProfile.loading && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 flex items-center justify-center">
                    <ContentLoader />
                  </div>
                )}

                {/* Account Settings */}
                {activeTab === 'account' && (
                <div id="account" className="bg-white dark:bg-gray-800 rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <Cog6ToothIcon className="w-5 h-5 mr-2" />
                      {t('settings.account')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.accountDescription')}
                    </p>
                  </div>
                  <div className="p-6">
                    {/* autoAcceptBookings — wired to autoBooking on the specialist profile */}
                    <ToggleSwitch
                      enabled={settings.accountSettings.autoAcceptBookings}
                      onChange={(value) => handleSettingChange('accountSettings', 'autoAcceptBookings', value)}
                      label={t('settings.autoAcceptBookings')}
                      description={t('settings.autoAcceptBookingsDesc')}
                    />
                    {/* requireVerification — wired to requireVerifiedCustomer on the specialist profile */}
                    <ToggleSwitch
                      enabled={settings.accountSettings.requireVerification}
                      onChange={(value) => handleSettingChange('accountSettings', 'requireVerification', value)}
                      label={t('settings.requireVerification')}
                      description={t('settings.requireVerificationDesc')}
                    />
                    {/* showProfileInSearch — wired to listedInSearch on the specialist profile */}
                    <ToggleSwitch
                      enabled={settings.accountSettings.showProfileInSearch}
                      onChange={(value) => handleSettingChange('accountSettings', 'showProfileInSearch', value)}
                      label={t('settings.showProfileInSearch')}
                      description={t('settings.showProfileInSearchDesc')}
                    />

                    {/* Danger Zone — lives inside the Account panel */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-base font-semibold text-red-700 dark:text-red-400">
                        {t('settings.danger.title') || 'Danger Zone'}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {t('settings.deleteAccount.warningSpecialist') || 'This permanently deactivates your account, hides your profile and services, and anonymizes your personal data. This cannot be undone.'}
                      </p>
                      <button
                        onClick={() => setShowDeleteAccountModal(true)}
                        className="mt-3 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                      >
                        {t('settings.deleteAccount.button') || 'Delete my account'}
                      </button>
                    </div>
                  </div>
                </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                <div id="security" className="bg-white dark:bg-gray-800 rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <ShieldCheckIcon className="w-5 h-5 mr-2" />
                      {t('customer.settings.passwordSecurity')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('customer.settings.securityDescription')}
                    </p>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Password Management */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <KeyIcon className="w-4 h-4 mr-2" />
                        {t('customer.settings.passwordManagement')}
                      </h4>

                      {/* OAuth Users - Set Password */}
                      {(!user?.hasPassword) && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                          <div className="flex items-start space-x-3">
                            <LockClosedIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div className="flex-1">
                              <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                {t('customer.settings.setPasswordTitle')}
                              </h5>
                              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                {t('customer.settings.setPasswordDescription')}
                              </p>
                              <button
                                onClick={() => setShowSetPasswordModal(true)}
                                className="inline-flex items-center mt-3 px-3 py-2 border border-transparent text-sm font-medium rounded-xl text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700 transition-colors"
                              >
                                <KeyIcon className="w-4 h-4 mr-2" />
                                {t('customer.settings.setPassword')}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Users with password - Change Password */}
                      {user?.hasPassword && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {t('customer.settings.password')}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('customer.settings.lastChanged')}: {user?.passwordLastChanged ? new Date(user.passwordLastChanged).toLocaleDateString() : t('customer.settings.never')}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <button
                                onClick={() => setShowChangePasswordModal(true)}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                              >
                                <KeyIcon className="w-4 h-4 mr-2" />
                                {t('customer.settings.changePassword')}
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const { authService } = await import('@/services/auth.service');
                                    await authService.forgotPassword(user.email);
                                    toast.success(t('auth.resetEmailSent') || 'Password reset link sent to your email');
                                  } catch {
                                    toast.error(t('auth.resetEmailFailed') || 'Failed to send reset email. Try again.');
                                  }
                                }}
                                className="text-xs text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                              >
                                {t('auth.forgotPassword') || 'Forgot password?'}
                              </button>
                            </div>
                          </div>

                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <p className="font-medium mb-2">{t('customer.settings.passwordRequirements')}:</p>
                            <ul className="space-y-1 text-xs">
                              <li>• {t('customer.settings.passwordReq1')}</li>
                              <li>• {t('customer.settings.passwordReq2')}</li>
                              <li>• {t('customer.settings.passwordReq3')}</li>
                              <li>• {t('customer.settings.passwordReq4')}</li>
                              <li>• {t('customer.settings.passwordReq5')}</li>
                              <li>• {t('customer.settings.passwordReq6')}</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Account Recovery */}
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
                        {t('customer.settings.accountRecovery')}
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {t('customer.settings.recoveryEmail')}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {user?.email || t('customer.settings.notSet')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {/* Connected Accounts */}
                {activeTab === 'accounts' && (
                <div id="accounts" className="bg-white dark:bg-gray-800 rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <LinkIcon className="w-5 h-5 mr-2" />
                      {t('customer.settings.connectedAccounts')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('customer.settings.connectedAccountsDescription')}
                    </p>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Login Method */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {(user as any)?.authProvider === 'google' ? (
                            <div className="w-8 h-8 flex items-center justify-center">
                              <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                            </div>
                          ) : (
                            <div className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                              <ShieldCheckIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {(user as any)?.authProvider === 'google'
                                ? t('customer.settings.googleConnected')
                                : t('customer.settings.emailConnected')
                              }
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          {language === 'uk' ? 'Активний' : language === 'ru' ? 'Активен' : 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Telegram */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#54a9eb">
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Telegram
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {t('customer.settings.telegramLinkDescription')}
                            </p>
                          </div>
                        </div>
                        {user?.telegramId ? (
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              {t('customer.settings.telegramConnected')}
                            </span>
                            <button
                              onClick={handleUnlinkTelegram}
                              disabled={isUnlinkingTelegram}
                              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium disabled:opacity-50"
                            >
                              {isUnlinkingTelegram
                                ? (language === 'uk' ? 'Відключення...' : language === 'ru' ? 'Отключение...' : 'Unlinking...')
                                : t('customer.settings.unlinkTelegram')
                              }
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                              {t('customer.settings.telegramNotConnected')}
                            </span>
                          </div>
                        )}
                      </div>
                      {!user?.telegramId && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <TelegramLinkWidget
                            onSuccess={async () => {
                              toast.success(
                                language === 'uk' ? 'Telegram підключено!' :
                                language === 'ru' ? 'Telegram подключен!' :
                                'Telegram linked!'
                              );
                              try {
                                const profile = await userService.getProfile();
                                dispatch(updateUserProfile(profile));
                              } catch {}
                            }}
                            onError={(error) => {
                              toast.error(error);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                )}

                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                <div id="notifications" className="bg-white dark:bg-gray-800 rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <BellIcon className="w-5 h-5 mr-2" />
                      {t('settings.notifications')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.notificationsDescription')}
                    </p>
                  </div>
                  <div className="p-6">
                    {/* emailNotifications — persisted via user profile */}
                    <ToggleSwitch
                      enabled={settings.notifications.emailNotifications}
                      onChange={(value) => handleSettingChange('notifications', 'emailNotifications', value)}
                      label={t('settings.emailNotifications')}
                      description={t('settings.emailNotificationsDesc')}
                    />
                    {/* pushNotifications — persisted via user profile */}
                    <ToggleSwitch
                      enabled={settings.notifications.pushNotifications}
                      onChange={(value) => handleSettingChange('notifications', 'pushNotifications', value)}
                      label={t('settings.pushNotifications')}
                      description={t('settings.pushNotificationsDesc')}
                    />
                    {/* Web Push Subscription Toggle */}
                    {isPushSupported && (
                      <div className="py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {language === 'uk' ? 'Браузерні push-сповіщення' : language === 'ru' ? 'Браузерные push-уведомления' : 'Browser Push Notifications'}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {language === 'uk' ? 'Отримуйте сповіщення навіть коли браузер згорнуто' : language === 'ru' ? 'Получайте уведомления даже когда браузер свёрнут' : 'Receive notifications even when the browser is minimized'}
                            </p>
                            {isPushDenied && (
                              <p className="text-xs text-red-500 mt-1">
                                {language === 'uk' ? 'Сповіщення заблоковані в налаштуваннях браузера' : language === 'ru' ? 'Уведомления заблокированы в настройках браузера' : 'Notifications blocked in browser settings'}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={togglePushSubscription}
                            disabled={isPushLoading || isPushDenied}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              isPushSubscribed ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                            } ${(isPushLoading || isPushDenied) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isPushSubscribed ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Privacy Settings */}
                {activeTab === 'privacy' && (
                <div id="privacy" className="bg-white dark:bg-gray-800 rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                        <ShieldCheckIcon className="w-5 h-5 mr-2" />
                        {t('settings.privacy')}
                      </h3>
                      <HelpTip title={t('settings.privacy')} content={h.privacy} size={15} />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.privacyDescription')}
                    </p>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('settings.privacyManagedInProfile')}
                    </p>
                  </div>
                </div>
                )}

                {/* Business Settings */}
                {activeTab === 'business' && (
                <>
                <div id="business" className="bg-white dark:bg-gray-800 rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <CreditCardIcon className="w-5 h-5 mr-2" />
                      {t('settings.business')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.businessDescription')}
                    </p>
                  </div>
                  <div className="p-6">
                    {/* Online-payment & deposit toggles hidden: MiyZapis takes no
                        platform payments — clients pay the master directly, so
                        deposits/online-pay can't be enforced. Pay-at-venue (below)
                        is the active model. */}

                    {/* Cancellation Window Setting */}
                    <div className="py-4 border-b border-gray-200 dark:border-gray-700">
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {t('settings.cancellationWindow')}
                      </label>
                      <select
                        value={settings.business.cancellationWindow}
                        onChange={(e) => handleSettingChange('business', 'cancellationWindow', parseInt(e.target.value))}
                        className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value={2}>{t('settings.hours2')}</option>
                        <option value={6}>{t('settings.hours6')}</option>
                        <option value={12}>{t('settings.hours12')}</option>
                        <option value={24}>{t('settings.hours24')}</option>
                        <option value={48}>{t('settings.hours48')}</option>
                      </select>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t('settings.cancellationWindowDesc')}
                      </p>
                    </div>

                    {/* Pay at Venue Option — governed by Save/Cancel like the rest of this tab */}
                    <ToggleSwitch
                      enabled={settings.business.allowPayAtVenue}
                      onChange={(value) => handleSettingChange('business', 'allowPayAtVenue', value)}
                      label={t('settings.allowPayAtVenue') || 'Allow Pay at Venue'}
                      description={t('settings.allowPayAtVenueDescription') || 'Let clients choose to pay in person when they arrive'}
                    />
                  </div>
                </div>

                {/* Booking Link Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <LinkIcon className="w-5 h-5 mr-2 text-primary-600" />
                    {t('settings.bookingLink') || 'Your Booking Link'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {t('settings.bookingLinkDescription') || 'Share this link on Instagram, Telegram, or WhatsApp so clients can book directly.'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={specialist?.slug ? `${window.location.origin}/s/${specialist.slug}` : `${window.location.origin}/specialist/${specialist?.id || ''}`}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                    />
                    <button
                      onClick={() => {
                        const url = specialist?.slug ? `${window.location.origin}/s/${specialist.slug}` : `${window.location.origin}/specialist/${specialist?.id || ''}`;
                        navigator.clipboard.writeText(url);
                        toast.success(t('settings.linkCopied') || 'Link copied to clipboard!');
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition active:scale-[0.96] text-sm font-medium whitespace-nowrap"
                    >
                      {t('actions.copy') || 'Copy'}
                    </button>
                  </div>
                </div>
                </>
                )}

                {/* Language & Currency Settings */}
                {activeTab === 'language' && (
                <div id="language" className="bg-white dark:bg-gray-800 rounded-xl shadow">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <GlobeAltIcon className="w-5 h-5 mr-2" />
                      {t('settings.language')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.languageDescription')}
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="py-4 border-b border-gray-200 dark:border-gray-700">
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {t('settings.interfaceLanguage')}
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as 'uk' | 'ru' | 'en')}
                        className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="uk">🇺🇦 Українська</option>
                        <option value="en">🇺🇸 English</option>
                        <option value="ru">🇷🇺 Русский</option>
                      </select>
                    </div>
                    
                    <div className="py-4">
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {t('settings.currency')}
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as 'UAH' | 'USD' | 'EUR')}
                        className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="UAH">₴ {t('currency.uah')}</option>
                        <option value="USD">$ {t('currency.usd')}</option>
                        <option value="EUR">€ {t('currency.eur')}</option>
                      </select>
                    </div>
                  </div>
                </div>
                )}

                {/* Global Save/Cancel — only shown on tabs that have no own save mechanism */}
                {['account', 'notifications', 'business'].includes(activeTab) && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleCancelSettings}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className={`px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSaving ? (t('common.saving') || 'Saving...') : t('common.save')}
                    </button>
                  </div>
                </div>
                )}
              </div>
            </div>
        </div>


        <DeleteAccountModal
          isOpen={showDeleteAccountModal}
          onClose={() => setShowDeleteAccountModal(false)}
          hasPassword={!!user?.hasPassword}
        />

        {/* Set Password Modal */}
        <SetPasswordModal
          isOpen={showSetPasswordModal}
          onClose={() => setShowSetPasswordModal(false)}
          onSuccess={() => {
            // Refresh user data after successful password set
            window.location.reload();
          }}
        />

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={() => {
            // Refresh user data after successful password change
            window.location.reload();
          }}
        />

      <ConfirmModal
        open={showUnlinkTelegramModal}
        title={t('customer.settings.telegramUnlinkConfirm') || 'Unlink Telegram?'}
        message={
          language === 'uk' ? 'Ви впевнені, що хочете відключити Telegram?' :
          language === 'ru' ? 'Вы уверены, что хотите отключить Telegram?' :
          'Are you sure you want to unlink your Telegram account?'
        }
        confirmText={
          language === 'uk' ? 'Відключити' :
          language === 'ru' ? 'Отключить' :
          'Unlink'
        }
        loading={isUnlinkingTelegram}
        variant="danger"
        onConfirm={confirmUnlinkTelegram}
        onCancel={() => setShowUnlinkTelegramModal(false)}
      />
      </div>

  );
};

export default SpecialistSettings;
