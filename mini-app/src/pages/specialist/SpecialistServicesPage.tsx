import React, { useState, useEffect, useCallback } from 'react';
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
  category: { id: string; name: string };
  duration: number;
  price: number;
  currency: string;
  isActive: boolean;
}

interface ServiceFormData {
  name: string;
  description: string;
  categoryId: string;
  duration: number;
  price: number;
  currency: string;
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
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    categoryId: '',
    duration: 60,
    price: 0,
    currency: 'UAH',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [servicesData, categoriesData] = await Promise.allSettled([
        apiService.getMyServices(),
        apiService.getServiceCategories(),
      ]);

      if (servicesData.status === 'fulfilled') setServices(servicesData.value as any || []);
      if (categoriesData.status === 'fulfilled') setCategories(categoriesData.value as any || []);
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
        categoryId: service.category.id,
        duration: service.duration,
        price: service.price,
        currency: service.currency,
      });
    } else {
      setEditingService(null);
      setFormData({ name: '', description: '', categoryId: '', duration: 60, price: 0, currency: 'UAH' });
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
      if (editingService) {
        await apiService.updateService(editingService.id, formData);
        dispatch(addToast({ type: 'success', title: t(commonStrings, 'success', locale), message: t(specialistServicesStrings, 'serviceUpdated', locale) }));
      } else {
        await apiService.createService(formData);
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

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header
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
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    service.isActive ? 'bg-accent-primary/10' : 'bg-bg-secondary'
                  }`}>
                    <Briefcase size={22} className={service.isActive ? 'text-accent-primary' : 'text-text-muted'} />
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
                        <span className="text-xs text-text-secondary">{service.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign size={12} className="text-text-secondary" />
                        <span className="text-xs font-medium text-accent-primary">
                          &#8372;{service.price}
                        </span>
                      </div>
                      <span className="text-xs text-text-secondary">{service.category.name}</span>
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
