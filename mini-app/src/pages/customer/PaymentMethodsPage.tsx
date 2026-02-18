import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Star,
  Smartphone,
  Banknote,
  Wallet,
  Check,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { paymentMethodsStrings, commonStrings } from '@/utils/translations';

interface PaymentMethod {
  id: string;
  type: 'card' | 'telegram' | 'cash' | 'wallet';
  lastFour?: string;
  brand?: string;
  isDefault: boolean;
  label?: string;
}

const METHOD_TYPES = [
  { type: 'card', icon: CreditCard, color: 'text-accent-primary', bgColor: 'bg-accent-primary/10' },
  { type: 'telegram', icon: Smartphone, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  { type: 'cash', icon: Banknote, color: 'text-accent-green', bgColor: 'bg-accent-green/10' },
  { type: 'wallet', icon: Wallet, color: 'text-accent-purple', bgColor: 'bg-accent-purple/10' },
] as const;

export const PaymentMethodsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback, showConfirm } = useTelegram();
  const locale = useLocale();

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchMethods = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getPaymentMethods() as any;
      setMethods(Array.isArray(data) ? data : []);
    } catch {
      setMethods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const getMethodConfig = (type: string) => {
    return METHOD_TYPES.find(m => m.type === type) || METHOD_TYPES[0];
  };

  const getMethodLabel = (method: PaymentMethod) => {
    if (method.label) return method.label;
    switch (method.type) {
      case 'card':
        return `${method.brand || 'Card'} ****${method.lastFour || '****'}`;
      case 'telegram':
        return 'Telegram Payments';
      case 'cash':
        return t(paymentMethodsStrings, 'cash', locale);
      case 'wallet':
        return t(paymentMethodsStrings, 'walletBalance', locale);
      default:
        return method.type;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'card':
        return t(paymentMethodsStrings, 'bankCard', locale);
      case 'telegram':
        return 'Telegram Payments';
      case 'cash':
        return t(paymentMethodsStrings, 'cashOnVisit', locale);
      case 'wallet':
        return t(paymentMethodsStrings, 'walletBalance', locale);
      default:
        return type;
    }
  };

  const handleAddMethod = async (type: string) => {
    try {
      setAdding(true);
      await apiService.addPaymentMethod({ type });
      dispatch(addToast({
        type: 'success',
        title: t(commonStrings, 'success', locale),
        message: t(paymentMethodsStrings, 'addMethod', locale),
      }));
      hapticFeedback.notificationSuccess();
      setShowAddSheet(false);
      fetchMethods();
    } catch {
      dispatch(addToast({
        type: 'error',
        title: t(commonStrings, 'error', locale),
        message: t(commonStrings, 'error', locale),
      }));
      hapticFeedback.notificationError();
    } finally {
      setAdding(false);
    }
  };

  const handleSetDefault = async (method: PaymentMethod) => {
    if (method.isDefault) return;
    hapticFeedback.impactLight();

    try {
      await apiService.setDefaultPaymentMethod(method.id);
      setMethods(prev =>
        prev.map(m => ({ ...m, isDefault: m.id === method.id }))
      );
      dispatch(addToast({
        type: 'success',
        title: t(commonStrings, 'success', locale),
        message: t(paymentMethodsStrings, 'setDefault', locale),
      }));
      hapticFeedback.notificationSuccess();
    } catch {
      dispatch(addToast({
        type: 'error',
        title: t(commonStrings, 'error', locale),
        message: t(commonStrings, 'error', locale),
      }));
      hapticFeedback.notificationError();
    }
  };

  const handleRemove = async (method: PaymentMethod) => {
    const confirmed = await showConfirm(t(paymentMethodsStrings, 'confirmRemove', locale));
    if (!confirmed) return;

    try {
      await apiService.deletePaymentMethod(method.id);
      setMethods(prev => prev.filter(m => m.id !== method.id));
      dispatch(addToast({
        type: 'success',
        title: t(commonStrings, 'success', locale),
        message: t(paymentMethodsStrings, 'removeMethod', locale),
      }));
      hapticFeedback.notificationSuccess();
    } catch {
      dispatch(addToast({
        type: 'error',
        title: t(commonStrings, 'error', locale),
        message: t(commonStrings, 'error', locale),
      }));
      hapticFeedback.notificationError();
    }
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
      <Header
        title={t(paymentMethodsStrings, 'title', locale)}
        rightContent={
          <button
            onClick={() => { setShowAddSheet(true); hapticFeedback.impactLight(); }}
            className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center"
          >
            <Plus size={18} className="text-white" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        <div className="px-4 pt-4 space-y-3">
          {methods.length === 0 ? (
            <Card className="text-center py-12">
              <CreditCard size={40} className="text-text-secondary mx-auto mb-3" />
              <p className="text-text-primary font-medium">{t(paymentMethodsStrings, 'noMethods', locale)}</p>
              <p className="text-text-secondary text-sm mt-1">{t(paymentMethodsStrings, 'addFirst', locale)}</p>
              <Button
                size="sm"
                onClick={() => { setShowAddSheet(true); hapticFeedback.impactLight(); }}
                className="mt-4"
              >
                <Plus size={16} className="mr-1" /> {t(paymentMethodsStrings, 'addMethod', locale)}
              </Button>
            </Card>
          ) : (
            methods.map(method => {
              const config = getMethodConfig(method.type);
              const Icon = config.icon;

              return (
                <Card key={method.id}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bgColor}`}>
                      <Icon size={22} className={config.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-text-primary truncate">
                          {getMethodLabel(method)}
                        </h3>
                        {method.isDefault && (
                          <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-xs rounded-full font-medium">
                            {t(paymentMethodsStrings, 'defaultMethod', locale)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary capitalize mt-0.5">{method.type}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-white/5">
                    {!method.isDefault && (
                      <button
                        onClick={() => handleSetDefault(method)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-bg-hover text-xs text-accent-primary"
                      >
                        <Star size={14} />
                        {t(paymentMethodsStrings, 'setDefault', locale)}
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(method)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-bg-hover text-xs text-accent-red"
                    >
                      <Trash2 size={14} />
                      {t(paymentMethodsStrings, 'removeMethod', locale)}
                    </button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Add Method Sheet */}
      <Sheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        title={t(paymentMethodsStrings, 'addMethod', locale)}
      >
        <div className="space-y-2">
          {METHOD_TYPES.map(({ type, icon: Icon, color, bgColor }) => (
            <button
              key={type}
              onClick={() => handleAddMethod(type)}
              disabled={adding}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-bg-secondary hover:bg-bg-hover transition-colors disabled:opacity-50"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor}`}>
                <Icon size={20} className={color} />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-text-primary">{getTypeLabel(type)}</span>
              </div>
              {methods.some(m => m.type === type) && (
                <Check size={16} className="text-accent-green" />
              )}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
};
