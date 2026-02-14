import React, { useState, useEffect, useCallback } from 'react';
import {
  Save,
  Plus,
  X,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Image,
  Award,
  User,
  Clock,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { specialistProfileEditStrings, commonStrings } from '@/utils/translations';

interface SpecialistProfile {
  businessName: string;
  bio: string;
  specialties: string[];
  experience: number;
  city: string;
  address: string;
  phone: string;
  email: string;
  portfolioImages: string[];
  qualifications: string[];
}

const emptyProfile: SpecialistProfile = {
  businessName: '',
  bio: '',
  specialties: [],
  experience: 0,
  city: '',
  address: '',
  phone: '',
  email: '',
  portfolioImages: [],
  qualifications: [],
};

export const SpecialistProfileEditPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback } = useTelegram();
  const locale = useLocale();

  const [profile, setProfile] = useState<SpecialistProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [qualificationInput, setQualificationInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');

  const s = (key: string) => t(specialistProfileEditStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = (await apiService.getSpecialistProfile()) as any;
      if (data) {
        setProfile({
          businessName: data.businessName || '',
          bio: data.bio || '',
          specialties: data.specialties || [],
          experience: data.experience || 0,
          city: data.city || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          portfolioImages: data.portfolioImages || [],
          qualifications: data.qualifications || [],
        });
      }
    } catch {
      // Use empty profile if fetch fails
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiService.updateSpecialistProfile(profile);
      hapticFeedback.notificationSuccess();
      dispatch(
        addToast({
          type: 'success',
          title: c('success'),
          message: s('profileUpdated'),
        })
      );
    } catch {
      hapticFeedback.notificationError();
      dispatch(
        addToast({
          type: 'error',
          title: c('error'),
          message: s('updateFailed'),
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const addSpecialty = () => {
    const trimmed = specialtyInput.trim();
    if (trimmed && !profile.specialties.includes(trimmed)) {
      hapticFeedback.impactLight();
      setProfile((prev) => ({
        ...prev,
        specialties: [...prev.specialties, trimmed],
      }));
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (index: number) => {
    hapticFeedback.impactLight();
    setProfile((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }));
  };

  const addQualification = () => {
    const trimmed = qualificationInput.trim();
    if (trimmed && !profile.qualifications.includes(trimmed)) {
      hapticFeedback.impactLight();
      setProfile((prev) => ({
        ...prev,
        qualifications: [...prev.qualifications, trimmed],
      }));
      setQualificationInput('');
    }
  };

  const removeQualification = (index: number) => {
    hapticFeedback.impactLight();
    setProfile((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index),
    }));
  };

  const addImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (trimmed) {
      hapticFeedback.impactLight();
      setProfile((prev) => ({
        ...prev,
        portfolioImages: [...prev.portfolioImages, trimmed],
      }));
      setImageUrlInput('');
    }
  };

  const removeImage = (index: number) => {
    hapticFeedback.impactLight();
    setProfile((prev) => ({
      ...prev,
      portfolioImages: prev.portfolioImages.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={s('title')} showBackButton />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        <div className="px-4 pt-4 space-y-4">
          {/* Business Name */}
          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card">
            <Input
              label={s('businessName')}
              value={profile.businessName}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, businessName: e.target.value }))
              }
              icon={<Briefcase size={16} />}
              placeholder={
                locale === 'uk'
                  ? 'Назва вашого бізнесу'
                  : locale === 'ru'
                  ? 'Название вашего бизнеса'
                  : 'Your business name'
              }
            />
          </Card>

          {/* Bio */}
          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card">
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              {s('bio')}
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, bio: e.target.value }))
              }
              rows={4}
              className="input-telegram w-full rounded-xl text-sm resize-none"
              placeholder={s('bioPlaceholder')}
            />
          </Card>

          {/* Specialties */}
          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card">
            <label className="block text-sm font-medium text-text-primary mb-2">
              {s('specialties')}
            </label>

            {/* Tag chips */}
            {profile.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent-primary/10 text-accent-primary text-sm rounded-full border border-accent-primary/20"
                  >
                    {specialty}
                    <button
                      onClick={() => removeSpecialty(index)}
                      className="ml-0.5 p-0.5 rounded-full hover:bg-accent-primary/20 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSpecialty();
                    }
                  }}
                  placeholder={s('addSpecialty')}
                />
              </div>
              <button
                onClick={addSpecialty}
                className="w-10 h-10 mt-auto bg-accent-primary/10 rounded-xl flex items-center justify-center hover:bg-accent-primary/20 transition-colors"
              >
                <Plus size={18} className="text-accent-primary" />
              </button>
            </div>
          </Card>

          {/* Experience */}
          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card">
            <Input
              label={s('experience')}
              type="number"
              value={profile.experience.toString()}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  experience: parseInt(e.target.value) || 0,
                }))
              }
              icon={<Clock size={16} />}
              min="0"
              max="50"
            />
          </Card>

          {/* Location */}
          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-accent-primary" />
              {s('location')}
            </h3>
            <div className="space-y-3">
              <Input
                label={s('city')}
                value={profile.city}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder={
                  locale === 'uk' ? 'Київ' : locale === 'ru' ? 'Киев' : 'Kyiv'
                }
              />
              <Input
                label={s('address')}
                value={profile.address}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder={
                  locale === 'uk'
                    ? 'Вулиця, будинок, офіс'
                    : locale === 'ru'
                    ? 'Улица, дом, офис'
                    : 'Street, building, office'
                }
              />
            </div>
          </Card>

          {/* Contact */}
          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card">
            <div className="space-y-3">
              <Input
                label={s('phone')}
                value={profile.phone}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, phone: e.target.value }))
                }
                icon={<Phone size={16} />}
                type="tel"
                placeholder="+380..."
              />
              <Input
                label={s('email')}
                value={profile.email}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, email: e.target.value }))
                }
                icon={<Mail size={16} />}
                type="email"
                placeholder="email@example.com"
              />
            </div>
          </Card>

          {/* Portfolio Images */}
          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Image size={16} className="text-accent-primary" />
              {s('portfolio')}
            </h3>

            {profile.portfolioImages.length > 0 && (
              <div className="space-y-2 mb-3">
                {profile.portfolioImages.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-bg-secondary/50 rounded-xl border border-white/5"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-bg-secondary flex-shrink-0">
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="flex-1 text-xs text-text-secondary truncate">
                      {url}
                    </span>
                    <button
                      onClick={() => removeImage(index)}
                      className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors flex-shrink-0"
                    >
                      <X size={14} className="text-accent-red" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addImageUrl();
                    }
                  }}
                  placeholder={s('addImage')}
                />
              </div>
              <button
                onClick={addImageUrl}
                className="w-10 h-10 mt-auto bg-accent-primary/10 rounded-xl flex items-center justify-center hover:bg-accent-primary/20 transition-colors"
              >
                <Plus size={18} className="text-accent-primary" />
              </button>
            </div>
          </Card>

          {/* Qualifications */}
          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Award size={16} className="text-accent-primary" />
              {s('qualifications')}
            </h3>

            {profile.qualifications.length > 0 && (
              <div className="space-y-2 mb-3">
                {profile.qualifications.map((qual, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 bg-bg-secondary/50 rounded-xl border border-white/5"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Award size={14} className="text-accent-yellow flex-shrink-0" />
                      <span className="text-sm text-text-primary truncate">
                        {qual}
                      </span>
                    </div>
                    <button
                      onClick={() => removeQualification(index)}
                      className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors flex-shrink-0 ml-2"
                    >
                      <X size={14} className="text-accent-red" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={qualificationInput}
                  onChange={(e) => setQualificationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addQualification();
                    }
                  }}
                  placeholder={s('addQualification')}
                />
              </div>
              <button
                onClick={addQualification}
                className="w-10 h-10 mt-auto bg-accent-primary/10 rounded-xl flex items-center justify-center hover:bg-accent-primary/20 transition-colors"
              >
                <Plus size={18} className="text-accent-primary" />
              </button>
            </div>
          </Card>

          {/* Save Button */}
          <div className="pt-2 pb-4">
            <Button
              onClick={handleSave}
              fullWidth
              disabled={saving}
              loading={saving}
              className="h-12"
            >
              <Save size={18} className="mr-2" />
              {saving ? c('loading') : c('saveChanges')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
