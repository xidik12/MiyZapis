import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  DollarSign,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StepIndicator } from '@/components/specialist/StepIndicator';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { onboardingStrings, commonStrings } from '@/utils/translations';

const STORAGE_KEY = 'miyzapis_onboarding_progress';
const TOTAL_STEPS = 5;

interface OnboardingData {
  // Step 1: Basic Info
  businessName: string;
  specialization: string;
  experience: string;
  // Step 2: First Service
  serviceName: string;
  servicePrice: string;
  serviceDuration: string;
  serviceCategory: string;
  // Step 3: Schedule
  schedule: Record<string, { enabled: boolean; start: string; end: string }>;
  // Step 4: Profile Photo
  photoUrl: string;
}

const DEFAULT_SCHEDULE: Record<string, { enabled: boolean; start: string; end: string }> = {
  monday: { enabled: true, start: '09:00', end: '18:00' },
  tuesday: { enabled: true, start: '09:00', end: '18:00' },
  wednesday: { enabled: true, start: '09:00', end: '18:00' },
  thursday: { enabled: true, start: '09:00', end: '18:00' },
  friday: { enabled: true, start: '09:00', end: '18:00' },
  saturday: { enabled: false, start: '10:00', end: '15:00' },
  sunday: { enabled: false, start: '10:00', end: '15:00' },
};

const DEFAULT_DATA: OnboardingData = {
  businessName: '',
  specialization: '',
  experience: '',
  serviceName: '',
  servicePrice: '',
  serviceDuration: '60',
  serviceCategory: '',
  schedule: DEFAULT_SCHEDULE,
  photoUrl: '',
};

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback } = useTelegram();
  const locale = useLocale();

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  // Load saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.step !== undefined) setCurrentStep(parsed.step);
        if (parsed.data) setData({ ...DEFAULT_DATA, ...parsed.data });
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Fetch categories
  useEffect(() => {
    apiService.getServiceCategories()
      .then((cats: any) => { if (Array.isArray(cats)) setCategories(cats); })
      .catch(() => {});
  }, []);

  // Save progress
  const saveProgress = useCallback((step: number, newData: OnboardingData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data: newData }));
    } catch {
      // Storage full or unavailable
    }
  }, []);

  const updateData = (updates: Partial<OnboardingData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
    saveProgress(currentStep, newData);
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      saveProgress(nextStep, data);
      hapticFeedback.impactLight();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      saveProgress(prevStep, data);
      hapticFeedback.impactLight();
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleFinish = async () => {
    try {
      setSubmitting(true);
      await apiService.completeOnboarding({
        businessName: data.businessName,
        specialization: data.specialization,
        experience: parseInt(data.experience) || 0,
        service: data.serviceName
          ? {
              name: data.serviceName,
              price: parseFloat(data.servicePrice) || 0,
              duration: parseInt(data.serviceDuration) || 60,
              categoryId: data.serviceCategory,
            }
          : undefined,
        schedule: data.schedule,
        photoUrl: data.photoUrl || undefined,
      });

      localStorage.removeItem(STORAGE_KEY);
      dispatch(addToast({
        type: 'success',
        title: t(onboardingStrings, 'profileComplete', locale),
        message: t(onboardingStrings, 'goToDashboard', locale),
      }));
      hapticFeedback.notificationSuccess();
      navigate('/specialist-dashboard');
    } catch {
      dispatch(addToast({
        type: 'error',
        title: t(commonStrings, 'error', locale),
        message: t(onboardingStrings, 'setupFailed', locale),
      }));
      hapticFeedback.notificationError();
    } finally {
      setSubmitting(false);
    }
  };

  const getDayLabel = (day: string) => {
    const dayMap: Record<string, Record<string, string>> = {
      monday: { en: 'Mon', uk: 'Пн', ru: 'Пн' },
      tuesday: { en: 'Tue', uk: 'Вт', ru: 'Вт' },
      wednesday: { en: 'Wed', uk: 'Ср', ru: 'Ср' },
      thursday: { en: 'Thu', uk: 'Чт', ru: 'Чт' },
      friday: { en: 'Fri', uk: 'Пт', ru: 'Пт' },
      saturday: { en: 'Sat', uk: 'Сб', ru: 'Сб' },
      sunday: { en: 'Sun', uk: 'Нд', ru: 'Вс' },
    };
    return dayMap[day]?.[locale] || day;
  };

  const stepIcons = [User, Briefcase, Calendar, Camera, CheckCircle];
  const StepIcon = stepIcons[currentStep];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-accent-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <User size={32} className="text-accent-primary" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">{t(onboardingStrings, 'step1Title', locale)}</h2>
              <p className="text-sm text-text-secondary">{t(onboardingStrings, 'step1Desc', locale)}</p>
            </div>

            <Input
              label={t(onboardingStrings, 'businessName', locale)}
              value={data.businessName}
              onChange={e => updateData({ businessName: e.target.value })}
              placeholder={t(onboardingStrings, 'businessNamePlaceholder', locale)}
              icon={<User size={18} />}
            />

            <Input
              label={t(onboardingStrings, 'specialization', locale)}
              value={data.specialization}
              onChange={e => updateData({ specialization: e.target.value })}
              placeholder={t(onboardingStrings, 'specializationPlaceholder', locale)}
              icon={<Briefcase size={18} />}
            />

            <Input
              label={t(onboardingStrings, 'yearsExperience', locale)}
              type="number"
              value={data.experience}
              onChange={e => updateData({ experience: e.target.value })}
              placeholder="0"
              icon={<Clock size={18} />}
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-accent-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Briefcase size={32} className="text-accent-purple" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">{t(onboardingStrings, 'step2Title', locale)}</h2>
              <p className="text-sm text-text-secondary">{t(onboardingStrings, 'step2Desc', locale)}</p>
            </div>

            <Input
              label={t(onboardingStrings, 'serviceName', locale)}
              value={data.serviceName}
              onChange={e => updateData({ serviceName: e.target.value })}
              placeholder={t(onboardingStrings, 'serviceNamePlaceholder', locale)}
              icon={<Briefcase size={18} />}
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                {t(onboardingStrings, 'category', locale)}
              </label>
              <select
                value={data.serviceCategory}
                onChange={e => updateData({ serviceCategory: e.target.value })}
                className="input-telegram w-full rounded-xl text-sm"
              >
                <option value="">
                  {t(onboardingStrings, 'selectCategory', locale)}
                </option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t(onboardingStrings, 'servicePrice', locale)}
                type="number"
                value={data.servicePrice}
                onChange={e => updateData({ servicePrice: e.target.value })}
                placeholder="0"
                icon={<DollarSign size={16} />}
              />
              <Input
                label={t(onboardingStrings, 'serviceDuration', locale)}
                type="number"
                value={data.serviceDuration}
                onChange={e => updateData({ serviceDuration: e.target.value })}
                placeholder="60"
                icon={<Clock size={16} />}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-accent-green/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Calendar size={32} className="text-accent-green" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">{t(onboardingStrings, 'step3Title', locale)}</h2>
              <p className="text-sm text-text-secondary">{t(onboardingStrings, 'step3Desc', locale)}</p>
            </div>

            <div className="space-y-2">
              {Object.entries(data.schedule).map(([day, dayData]) => (
                <Card key={day}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        hapticFeedback.selectionChanged();
                        const newSchedule = { ...data.schedule };
                        newSchedule[day] = { ...dayData, enabled: !dayData.enabled };
                        updateData({ schedule: newSchedule });
                      }}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                        dayData.enabled
                          ? 'bg-accent-primary text-white'
                          : 'bg-bg-secondary text-text-secondary'
                      }`}
                    >
                      {getDayLabel(day)}
                    </button>

                    {dayData.enabled ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="time"
                          value={dayData.start}
                          onChange={e => {
                            const newSchedule = { ...data.schedule };
                            newSchedule[day] = { ...dayData, start: e.target.value };
                            updateData({ schedule: newSchedule });
                          }}
                          className="input-telegram rounded-lg text-sm flex-1 py-1.5 px-2"
                        />
                        <span className="text-text-secondary text-sm">-</span>
                        <input
                          type="time"
                          value={dayData.end}
                          onChange={e => {
                            const newSchedule = { ...data.schedule };
                            newSchedule[day] = { ...dayData, end: e.target.value };
                            updateData({ schedule: newSchedule });
                          }}
                          className="input-telegram rounded-lg text-sm flex-1 py-1.5 px-2"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-text-secondary">
                        {t(commonStrings, 'dayOff', locale)}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-accent-yellow/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Camera size={32} className="text-accent-yellow" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">{t(onboardingStrings, 'step4Title', locale)}</h2>
              <p className="text-sm text-text-secondary">{t(onboardingStrings, 'step4Desc', locale)}</p>
            </div>

            <Input
              label={t(onboardingStrings, 'photoUrl', locale)}
              value={data.photoUrl}
              onChange={e => updateData({ photoUrl: e.target.value })}
              placeholder="https://..."
              icon={<Camera size={18} />}
            />

            {/* Preview */}
            {data.photoUrl && (
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-bg-secondary border-2 border-accent-primary/20">
                  <img
                    src={data.photoUrl}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            {!data.photoUrl && (
              <Card className="text-center py-8">
                <Camera size={40} className="text-text-secondary mx-auto mb-2" />
                <p className="text-text-secondary text-sm">
                  {t(onboardingStrings, 'pastePhotoUrl', locale)}
                </p>
              </Card>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-accent-green/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={32} className="text-accent-green" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">{t(onboardingStrings, 'step5Title', locale)}</h2>
              <p className="text-sm text-text-secondary">{t(onboardingStrings, 'step5Desc', locale)}</p>
            </div>

            {/* Summary */}
            <Card>
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <User size={16} className="text-accent-primary" />
                {t(onboardingStrings, 'step1Title', locale)}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">{t(onboardingStrings, 'businessName', locale)}</span>
                  <span className="text-text-primary font-medium">{data.businessName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">{t(onboardingStrings, 'specialization', locale)}</span>
                  <span className="text-text-primary font-medium">{data.specialization || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">{t(onboardingStrings, 'yearsExperience', locale)}</span>
                  <span className="text-text-primary font-medium">{data.experience || '0'}</span>
                </div>
              </div>
            </Card>

            {data.serviceName && (
              <Card>
                <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Briefcase size={16} className="text-accent-purple" />
                  {t(onboardingStrings, 'step2Title', locale)}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">{t(onboardingStrings, 'serviceName', locale)}</span>
                    <span className="text-text-primary font-medium">{data.serviceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">{t(onboardingStrings, 'servicePrice', locale)}</span>
                    <span className="text-text-primary font-medium">{'\u20B4'}{data.servicePrice || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">{t(onboardingStrings, 'serviceDuration', locale)}</span>
                    <span className="text-text-primary font-medium">{data.serviceDuration || '60'} {t(commonStrings, 'min', locale)}</span>
                  </div>
                </div>
              </Card>
            )}

            <Card>
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-accent-green" />
                {t(onboardingStrings, 'step3Title', locale)}
              </h3>
              <div className="space-y-1.5 text-sm">
                {Object.entries(data.schedule).map(([day, dayData]) => (
                  <div key={day} className="flex justify-between">
                    <span className="text-text-secondary">{getDayLabel(day)}</span>
                    <span className={`font-medium ${dayData.enabled ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {dayData.enabled ? `${dayData.start} - ${dayData.end}` : t(onboardingStrings, 'off', locale)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {data.photoUrl && (
              <Card>
                <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Camera size={16} className="text-accent-yellow" />
                  {t(onboardingStrings, 'step4Title', locale)}
                </h3>
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-bg-secondary">
                    <img
                      src={data.photoUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header
        title={`${t(onboardingStrings, 'stepOf', locale)} ${currentStep + 1} ${t(onboardingStrings, 'of', locale)} ${TOTAL_STEPS}`}
        subtitle={t(onboardingStrings, 'subtitle', locale)}
      />

      <div className="flex-1 overflow-y-auto pb-32 page-stagger">
        {/* Step Indicator */}
        <div className="px-4 pt-4 pb-2">
          <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </div>

        {/* Step Content */}
        <div className="px-4 pt-2">
          {renderStepContent()}
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg-secondary/95 backdrop-blur-lg border-t border-white/5 px-4 py-3 safe-bottom">
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="secondary"
              onClick={handlePrevious}
              className="flex-1"
            >
              {t(onboardingStrings, 'previous', locale)}
            </Button>
          )}

          {currentStep < TOTAL_STEPS - 1 ? (
            <>
              {(currentStep === 1 || currentStep === 3) && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="px-6"
                >
                  {t(onboardingStrings, 'skip', locale)}
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="flex-1"
              >
                {t(onboardingStrings, 'next', locale)}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleFinish}
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? t(commonStrings, 'loading', locale) : t(onboardingStrings, 'finish', locale)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
