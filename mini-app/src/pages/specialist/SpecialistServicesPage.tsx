import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Briefcase,
  Search,
  Camera,
  X,
  ImageIcon,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { specialistServicesStrings, commonStrings } from '@/utils/translations';

interface SpecialistService {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryId?: string;
  duration: number;
  price: number;
  basePrice?: string;
  currency: string;
  isActive: boolean;
  images?: string[];
}

interface ServiceFormData {
  name: string;
  description: string;
  categoryId: string;
  duration: number;
  price: number;
  currency: string;
  images: string[];
}

export const SpecialistServicesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback, showConfirm } = useTelegram();
  const locale = useLocale();

  const [services, setServices] = useState<SpecialistService[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<SpecialistService | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    categoryId: '',
    duration: 60,
    price: 0,
    currency: 'UAH',
    images: [],
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [servicesData, categoriesData] = await Promise.allSettled([
        apiService.getMyServices(),
        apiService.getServiceCategories(),
      ]);

      if (servicesData.status === 'fulfilled') {
        const raw: any = servicesData.value;
        const arr = Array.isArray(raw) ? raw : raw?.services || [];
        setServices(arr.map((s: any) => {
          let parsedImages: string[] = [];
          if (Array.isArray(s.images)) parsedImages = s.images;
          else if (typeof s.images === 'string') {
            try { parsedImages = JSON.parse(s.images); } catch { parsedImages = []; }
          }
          return {
            ...s,
            price: Number(s.price) || Number(s.basePrice) || 0,
            category: typeof s.category === 'string' ? s.category : s.category?.name || '',
            categoryId: typeof s.category === 'object' ? s.category?.id : s.categoryId || '',
            images: parsedImages,
          };
        }));
      }
      if (categoriesData.status === 'fulfilled') {
        const raw: any = categoriesData.value;
        setCategories(Array.isArray(raw) ? raw : raw?.categories || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenForm = (service?: SpecialistService) => {
    hapticFeedback.impactLight();
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description,
        categoryId: service.categoryId || '',
        duration: service.duration,
        price: service.price,
        currency: service.currency || 'UAH',
        images: service.images || [],
      });
    } else {
      setEditingService(null);
      setFormData({ name: '', description: '', categoryId: '', duration: 60, price: 0, currency: 'UAH', images: [] });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.categoryId || formData.price <= 0) {
      dispatch(addToast({ type: 'warning', title: t(specialistServicesStrings, 'missingFields', locale), message: t(specialistServicesStrings, 'fillRequired', locale) }));
      return;
    }

    try {
      setSaving(true);
      const submitData = {
        ...formData,
        images: formData.images.length > 0 ? formData.images : undefined,
      };
      if (editingService) {
        await apiService.updateService(editingService.id, submitData);
        dispatch(addToast({ type: 'success', title: t(commonStrings, 'success', locale), message: t(specialistServicesStrings, 'serviceUpdated', locale) }));
      } else {
        await apiService.createService(submitData);
        dispatch(addToast({ type: 'success', title: t(commonStrings, 'success', locale), message: t(specialistServicesStrings, 'serviceCreated', locale) }));
      }
      hapticFeedback.notificationSuccess();
      setShowForm(false);
      fetchData();
    } catch {
      dispatch(addToast({ type: 'error', title: t(commonStrings, 'error', locale), message: t(specialistServicesStrings, 'saveFailed', locale) }));
      hapticFeedback.notificationError();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service: SpecialistService) => {
    const confirmMsg = locale === 'uk' ? `Видалити "${service.name}"?` : locale === 'ru' ? `Удалить "${service.name}"?` : `Delete "${service.name}"?`;
    const confirmed = await showConfirm(confirmMsg);
    if (!confirmed) return;

    try {
      await apiService.deleteService(service.id);
      setServices(prev => prev.filter(s => s.id !== service.id));
      const successMsg = locale === 'uk' ? 'Видалено' : locale === 'ru' ? 'Удалено' : 'Deleted';
      dispatch(addToast({ type: 'success', title: successMsg, message: t(specialistServicesStrings, 'serviceDeleted', locale) }));
      hapticFeedback.notificationSuccess();
    } catch {
      dispatch(addToast({ type: 'error', title: t(commonStrings, 'error', locale), message: t(specialistServicesStrings, 'deleteFailed', locale) }));
      hapticFeedback.notificationError();
    }
  };

  const handleToggleActive = async (service: SpecialistService) => {
    hapticFeedback.impactLight();
    const updated = { ...service, isActive: !service.isActive };
    setServices(prev => prev.map(s => s.id === service.id ? updated : s));

    try {
      await apiService.updateService(service.id, { isActive: !service.isActive });
    } catch {
      setServices(prev => prev.map(s => s.id === service.id ? service : s));
      const errorMsg = locale === 'uk' ? 'Не вдалося оновити послугу' : locale === 'ru' ? 'Не удалось обновить услугу' : 'Failed to update service';
      dispatch(addToast({ type: 'error', title: t(commonStrings, 'error', locale), message: errorMsg }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          dispatch(addToast({ type: 'error', title: t(commonStrings, 'error', locale), message: 'Max 10MB' }));
          continue;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) continue;
        const result = await apiService.uploadFile(file, 'service');
        setFormData(p => ({ ...p, images: [...p.images, result.url] }));
      }
      hapticFeedback.notificationSuccess();
    } catch {
      dispatch(addToast({ type: 'error', title: t(commonStrings, 'error', locale), message: 'Upload failed' }));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(p => ({ ...p, images: p.images.filter((_, i) => i !== index) }));
    hapticFeedback.selectionChanged();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header
        showBackButton
        title={t(specialistServicesStrings, 'title', locale)}
        rightContent={
          <button
            onClick={() => handleOpenForm()}
            className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center"
          >
            <Plus size={18} className="text-white" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        <div className="px-4 pt-4 space-y-3">
          {services.length === 0 ? (
            <Card className="text-center py-12">
              <Briefcase size={40} className="text-text-secondary mx-auto mb-3" />
              <p className="text-text-primary font-medium">{t(specialistServicesStrings, 'noServices', locale)}</p>
              <p className="text-text-secondary text-sm mt-1">{t(specialistServicesStrings, 'addFirst', locale)}</p>
              <Button size="sm" onClick={() => handleOpenForm()} className="mt-4">
                <Plus size={16} className="mr-1" /> {t(specialistServicesStrings, 'addService', locale)}
              </Button>
            </Card>
          ) : (
            services.map(service => (
              <Card key={service.id}>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${
                    service.isActive ? 'bg-accent-primary/10' : 'bg-bg-secondary'
                  }`}>
                    {service.images && service.images.length > 0 ? (
                      <img src={service.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Briefcase size={22} className={service.isActive ? 'text-accent-primary' : 'text-text-muted'} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-text-primary truncate">{service.name}</h3>
                      {!service.isActive && (
                        <span className="px-1.5 py-0.5 bg-bg-hover text-text-secondary text-xs rounded">
                          {t(commonStrings, 'inactive', locale)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary truncate mt-0.5">{service.description}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-text-secondary" />
                        <span className="text-xs text-text-secondary">{service.duration} {t(commonStrings, 'min', locale)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign size={12} className="text-text-secondary" />
                        <span className="text-xs font-medium text-accent-primary">
                          &#8372;{service.price}
                        </span>
                      </div>
                      <span className="text-xs text-text-secondary">{service.category}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleToggleActive(service)}
                    className="p-2 rounded-lg hover:bg-bg-hover"
                  >
                    {service.isActive
                      ? <ToggleRight size={20} className="text-accent-green" />
                      : <ToggleLeft size={20} className="text-text-muted" />
                    }
                  </button>
                  <button
                    onClick={() => handleOpenForm(service)}
                    className="p-2 rounded-lg hover:bg-bg-hover"
                  >
                    <Edit size={16} className="text-accent-primary" />
                  </button>
                  <button
                    onClick={() => handleDelete(service)}
                    className="p-2 rounded-lg hover:bg-bg-hover"
                  >
                    <Trash2 size={16} className="text-accent-red" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Service Form Sheet */}
      <Sheet
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingService ? t(specialistServicesStrings, 'editService', locale) : t(specialistServicesStrings, 'addService', locale)}
      >
        <div className="space-y-4">
          <Input
            label={t(specialistServicesStrings, 'serviceName', locale) + ' *'}
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            placeholder={locale === 'uk' ? 'напр. Стрижка, Масаж, Консультація' : locale === 'ru' ? 'напр. Стрижка, Массаж, Консультация' : 'e.g. Haircut, Massage, Consultation'}
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">{t(specialistServicesStrings, 'description', locale)}</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              rows={3}
              className="input-telegram w-full rounded-xl text-sm resize-none"
              placeholder={locale === 'uk' ? 'Опишіть вашу послугу...' : locale === 'ru' ? 'Опишите вашу услугу...' : 'Describe your service...'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">{t(specialistServicesStrings, 'category', locale)} *</label>
            <select
              value={formData.categoryId}
              onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))}
              className="input-telegram w-full rounded-xl text-sm"
            >
              <option value="">{t(specialistServicesStrings, 'selectCategory', locale)}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t(specialistServicesStrings, 'durationMin', locale)}
              type="number"
              value={formData.duration.toString()}
              onChange={e => setFormData(p => ({ ...p, duration: parseInt(e.target.value) || 0 }))}
              icon={<Clock size={16} />}
            />
            <Input
              label={t(specialistServicesStrings, 'price', locale) + ' (₴) *'}
              type="number"
              value={formData.price.toString()}
              onChange={e => setFormData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
              icon={<DollarSign size={16} />}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              {locale === 'uk' ? 'Фото послуги' : locale === 'ru' ? 'Фото услуги' : 'Service Photos'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed transition-colors ${
                uploading
                  ? 'border-accent-primary/30 bg-accent-primary/5 text-accent-primary'
                  : 'border-white/10 bg-bg-secondary text-text-secondary hover:border-accent-primary/50'
              }`}
            >
              {uploading ? (
                <><LoadingSpinner size="sm" /><span className="text-sm">{locale === 'uk' ? 'Завантаження...' : locale === 'ru' ? 'Загрузка...' : 'Uploading...'}</span></>
              ) : (
                <><Camera size={18} /><span className="text-sm font-medium">{locale === 'uk' ? 'Додати фото' : locale === 'ru' ? 'Добавить фото' : 'Add Photos'}</span></>
              )}
            </button>
            {formData.images.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {formData.images.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-bg-secondary">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">{t(commonStrings, 'cancel', locale)}</Button>
            <Button onClick={handleSave} className="flex-1" disabled={saving}>
              {saving ? t(specialistServicesStrings, 'saving', locale) : editingService ? t(specialistServicesStrings, 'update', locale) : t(specialistServicesStrings, 'create', locale)}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
