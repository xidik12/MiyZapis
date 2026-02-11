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
      dispatch(addToast({ type: 'warning', title: 'Missing fields', message: 'Please fill all required fields' }));
      return;
    }

    try {
      setSaving(true);
      if (editingService) {
        await apiService.updateService(editingService.id, formData);
        dispatch(addToast({ type: 'success', title: 'Updated', message: 'Service updated successfully' }));
      } else {
        await apiService.createService(formData);
        dispatch(addToast({ type: 'success', title: 'Created', message: 'Service created successfully' }));
      }
      hapticFeedback.notificationSuccess();
      setShowForm(false);
      fetchData();
    } catch {
      dispatch(addToast({ type: 'error', title: 'Error', message: 'Failed to save service' }));
      hapticFeedback.notificationError();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service: SpecialistService) => {
    const confirmed = await showConfirm(`Delete "${service.name}"?`);
    if (!confirmed) return;

    try {
      await apiService.deleteService(service.id);
      setServices(prev => prev.filter(s => s.id !== service.id));
      dispatch(addToast({ type: 'success', title: 'Deleted', message: 'Service deleted' }));
      hapticFeedback.notificationSuccess();
    } catch {
      dispatch(addToast({ type: 'error', title: 'Error', message: 'Failed to delete service' }));
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
      dispatch(addToast({ type: 'error', title: 'Error', message: 'Failed to update service' }));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-primary">
      <Header
        title="My Services"
        rightContent={
          <button
            onClick={() => handleOpenForm()}
            className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center"
          >
            <Plus size={18} className="text-white" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 pt-4 space-y-3">
          {services.length === 0 ? (
            <Card className="text-center py-12">
              <Briefcase size={40} className="text-secondary mx-auto mb-3" />
              <p className="text-primary font-medium">No services yet</p>
              <p className="text-secondary text-sm mt-1">Add your first service to start receiving bookings</p>
              <Button size="sm" onClick={() => handleOpenForm()} className="mt-4">
                <Plus size={16} className="mr-1" /> Add Service
              </Button>
            </Card>
          ) : (
            services.map(service => (
              <Card key={service.id}>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    service.isActive ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Briefcase size={22} className={service.isActive ? 'text-blue-600' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-primary truncate">{service.name}</h3>
                      {!service.isActive && (
                        <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 text-xs rounded">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-secondary truncate mt-0.5">{service.description}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-secondary" />
                        <span className="text-xs text-secondary">{service.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign size={12} className="text-secondary" />
                        <span className="text-xs font-medium text-accent">
                          ₴{service.price}
                        </span>
                      </div>
                      <span className="text-xs text-secondary">{service.category.name}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => handleToggleActive(service)}
                    className="p-2 rounded-lg hover:bg-secondary"
                  >
                    {service.isActive
                      ? <ToggleRight size={20} className="text-green-500" />
                      : <ToggleLeft size={20} className="text-gray-400" />
                    }
                  </button>
                  <button
                    onClick={() => handleOpenForm(service)}
                    className="p-2 rounded-lg hover:bg-secondary"
                  >
                    <Edit size={16} className="text-blue-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(service)}
                    className="p-2 rounded-lg hover:bg-secondary"
                  >
                    <Trash2 size={16} className="text-red-400" />
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
        title={editingService ? 'Edit Service' : 'Add Service'}
      >
        <div className="space-y-4">
          <Input
            label="Service Name *"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Haircut, Massage, Consultation"
          />

          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              rows={3}
              className="input-telegram w-full rounded-xl text-sm resize-none"
              placeholder="Describe your service..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Category *</label>
            <select
              value={formData.categoryId}
              onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))}
              className="input-telegram w-full rounded-xl text-sm"
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duration (min)"
              type="number"
              value={formData.duration.toString()}
              onChange={e => setFormData(p => ({ ...p, duration: parseInt(e.target.value) || 0 }))}
              icon={<Clock size={16} />}
            />
            <Input
              label="Price (₴) *"
              type="number"
              value={formData.price.toString()}
              onChange={e => setFormData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
              icon={<DollarSign size={16} />}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} className="flex-1" disabled={saving}>
              {saving ? 'Saving...' : editingService ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
