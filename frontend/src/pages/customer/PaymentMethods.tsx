import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { PaymentMethod } from '../../types';
import { PaymentMethodsService } from '../../services/paymentMethods';
import { toast } from 'react-toastify';
import { CreditCardIcon, PlusIcon, PencilIcon, TrashIcon } from '@/components/icons';

const PaymentMethods: React.FC = () => {
  const { t, language } = useLanguage();
  const currentUser = useAppSelector(selectUser);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);

  // Load payment methods from backend when component mounts
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        setLoading(true);
        const methods = await PaymentMethodsService.getPaymentMethods();
        setPaymentMethods(methods);
      } catch (error) {
        console.error('Failed to load payment methods:', error);
        toast.error(t('payments.loadError') || 'Failed to load payment methods');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadPaymentMethods();
    }
  }, [currentUser, language]);

  const handleAddPaymentMethod = () => {
    setEditingMethod(null);
    setShowModal(true);
  };

  const handleEditPaymentMethod = (method: PaymentMethod) => {
    setEditingMethod(method);
    setShowModal(true);
  };

  const handleSavePaymentMethod = async (paymentData: any) => {
    try {
      setLoading(true);

      if (editingMethod) {
        // Update existing method
        const updated = await PaymentMethodsService.updatePaymentMethod(editingMethod.id, {
          nickname: paymentData.name,
          cardExpMonth: paymentData.expiryMonth,
          cardExpYear: paymentData.expiryYear,
        });
        setPaymentMethods(prev =>
          prev.map(pm => pm.id === editingMethod.id ? { ...pm, ...updated } : pm)
        );
        toast.success(language === 'uk' ? 'Спосіб оплати оновлено' : language === 'ru' ? 'Способ оплаты обновлен' : 'Payment method updated successfully');
      } else {
        // Add new method
        const newMethod = await PaymentMethodsService.addPaymentMethod({
          type: 'CARD',
          cardLast4: paymentData.last4 || '',
          cardBrand: paymentData.name?.toLowerCase().includes('visa') ? 'visa' : 'mastercard',
          cardExpMonth: paymentData.expiryMonth,
          cardExpYear: paymentData.expiryYear,
          nickname: paymentData.name,
        });
        setPaymentMethods(prev => [...prev, newMethod]);
        toast.success(t('payments.addSuccess') || 'Payment method added successfully');
      }

      setShowModal(false);
      setEditingMethod(null);
    } catch (error) {
      console.error('Failed to save payment method:', error);
      toast.error(editingMethod
        ? (language === 'uk' ? 'Не вдалося оновити спосіб оплати' : 'Failed to update payment method')
        : (t('payments.addError') || 'Failed to add payment method')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePaymentMethod = async (id: string) => {
    try {
      setLoading(true);
      await PaymentMethodsService.deletePaymentMethod(id);
      setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
      toast.success(t('payments.removeSuccess') || 'Payment method removed successfully');
    } catch (error) {
      console.error('Failed to remove payment method:', error);
      toast.error(t('payments.removeError') || 'Failed to remove payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      setLoading(true);
      await PaymentMethodsService.setDefaultPaymentMethod(id);
      setPaymentMethods(prev =>
        prev.map(pm => ({ ...pm, isDefault: pm.id === id }))
      );
      toast.success(t('payments.defaultSetSuccess') || 'Default payment method updated');
    } catch (error) {
      console.error('Failed to set default payment method:', error);
      toast.error(t('payments.defaultSetError') || 'Failed to set default payment method');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!editingMethod;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {language === 'uk' ? 'Способи оплати' : language === 'ru' ? 'Способы оплаты' : 'Payment Methods'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'uk'
              ? 'Керуйте вашими способами оплати та історією транзакцій'
              : language === 'ru'
              ? 'Управляйте вашими способами оплаты и историей транзакций'
              : 'Manage your payment methods and transaction history'
            }
          </p>
        </div>

        {/* Payment Methods Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-white/20 dark:border-gray-700/50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {language === 'uk' ? 'Ваші способи оплати' : language === 'ru' ? 'Ваши способы оплаты' : 'Your Payment Methods'}
              </h2>
              <button
                onClick={handleAddPaymentMethod}
                className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {language === 'uk' ? 'Додати спосіб оплати' : language === 'ru' ? 'Добавить способ оплаты' : 'Add Payment Method'}
              </button>
            </div>

            <div className="space-y-4">
              {paymentMethods.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCardIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {language === 'uk' ? 'Способи оплати не додано' : language === 'ru' ? 'Способы оплаты не добавлены' : 'No payment methods added yet'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    {language === 'uk'
                      ? 'Додайте спосіб оплати для швидкого та зручного бронювання послуг. Ваші дані будуть надійно захищені.'
                      : language === 'ru'
                      ? 'Добавьте способ оплаты для быстрого и удобного бронирования услуг. Ваши данные будут надежно защищены.'
                      : 'Add a payment method for quick and convenient service bookings. Your data will be securely protected.'
                    }
                  </p>
                  <button
                    onClick={handleAddPaymentMethod}
                    className="bg-primary-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors flex items-center mx-auto"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    {language === 'uk' ? 'Додати перший спосіб оплати' : language === 'ru' ? 'Добавить первый способ оплаты' : 'Add Your First Payment Method'}
                  </button>
                </div>
              ) : (
                paymentMethods.map((method) => (
                  <div key={method.id} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-xl mr-4 ${
                        method.type === 'card' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' :
                        method.type === 'bank_account' ? 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400' :
                        'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        <CreditCardIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{method.nickname || `${method.cardBrand} •••• ${method.cardLast4}`}</p>
                          {method.isDefault && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              {language === 'uk' ? 'Основний' : language === 'ru' ? 'Основной' : 'Default'}
                            </span>
                          )}
                          {method.isActive && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              {language === 'uk' ? 'Активний' : language === 'ru' ? 'Активный' : 'Active'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          **** **** **** {method.cardLast4}
                          {method.cardExpMonth && method.cardExpYear && (
                            <span className="ml-2">
                              {method.cardExpMonth.toString().padStart(2, '0')}/{method.cardExpYear}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!method.isDefault && (
                        <button
                          onClick={() => handleSetDefault(method.id)}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                        >
                          {language === 'uk' ? 'Зробити основним' : language === 'ru' ? 'Сделать основным' : 'Make Default'}
                        </button>
                      )}
                      <button
                        onClick={() => handleEditPaymentMethod(method)}
                        className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemovePaymentMethod(method.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {language === 'uk' ? 'Безпека ваших даних' : language === 'ru' ? 'Безопасность ваших данных' : 'Your Data Security'}
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                {language === 'uk'
                  ? 'Ми використовуємо найсучасні методи шифрування для захисту ваших платіжних даних. Номери карток зберігаються в зашифрованому вигляді та відповідають стандартам PCI DSS.'
                  : language === 'ru'
                  ? 'Мы используем современные методы шифрования для защиты ваших платежных данных. Номера карт хранятся в зашифрованном виде и соответствуют стандартам PCI DSS.'
                  : 'We use state-of-the-art encryption methods to protect your payment data. Card numbers are stored encrypted and comply with PCI DSS standards.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Payment Method Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              {isEditing
                ? (language === 'uk' ? 'Редагувати спосіб оплати' : language === 'ru' ? 'Редактировать способ оплаты' : 'Edit Payment Method')
                : (language === 'uk' ? 'Додати спосіб оплати' : language === 'ru' ? 'Добавить способ оплаты' : 'Add Payment Method')
              }
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleSavePaymentMethod({
                type: 'card',
                name: formData.get('cardName'),
                last4: isEditing ? editingMethod?.cardLast4 : (formData.get('cardNumber')?.toString().slice(-4) || ''),
                expiryMonth: parseInt(formData.get('expiryMonth')?.toString() || '0'),
                expiryYear: parseInt(formData.get('expiryYear')?.toString() || '0'),
              });
            }}>
              <div className="space-y-4">
                {!isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'uk' ? 'Тип оплати' : language === 'ru' ? 'Тип оплаты' : 'Payment Type'}
                    </label>
                    <select
                      name="paymentType"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="card">{language === 'uk' ? 'Банківська картка' : language === 'ru' ? 'Банковская карта' : 'Bank Card'}</option>
                      <option value="privat">PrivatBank</option>
                      <option value="mono">Monobank</option>
                      <option value="ukrsib">UkrSibbank</option>
                      <option value="oschadbank">Oschadbank</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'uk' ? 'Назва картки' : language === 'ru' ? 'Название карты' : 'Card Name'}
                  </label>
                  <input
                    type="text"
                    name="cardName"
                    defaultValue={editingMethod?.nickname || ''}
                    placeholder={t('payments.cardNamePlaceholder') || 'Visa •••• 4242'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                {!isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'uk' ? 'Номер картки' : language === 'ru' ? 'Номер карты' : 'Card Number'}
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder={t('payments.cardNumberPlaceholder') || '1234 5678 9012 3456'}
                      maxLength={19}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-primary-500 focus:border-primary-500"
                      onChange={(e) => {
                        let value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                        e.target.value = value;
                      }}
                      required
                    />
                  </div>
                )}
                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'uk' ? 'Номер картки' : language === 'ru' ? 'Номер карты' : 'Card Number'}
                    </label>
                    <p className="px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 rounded-xl">
                      **** **** **** {editingMethod?.cardLast4}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'uk' ? 'Місяць' : language === 'ru' ? 'Месяц' : 'Month'}
                    </label>
                    <select
                      name="expiryMonth"
                      defaultValue={editingMethod?.cardExpMonth || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {(i + 1).toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'uk' ? 'Рік' : language === 'ru' ? 'Год' : 'Year'}
                    </label>
                    <select
                      name="expiryYear"
                      defaultValue={editingMethod?.cardExpYear || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">YYYY</option>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingMethod(null); }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {language === 'uk' ? 'Скасувати' : language === 'ru' ? 'Отменить' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
                >
                  {isEditing
                    ? (language === 'uk' ? 'Зберегти зміни' : language === 'ru' ? 'Сохранить изменения' : 'Save Changes')
                    : (language === 'uk' ? 'Додати спосіб оплати' : language === 'ru' ? 'Добавить способ оплаты' : 'Add Payment Method')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;
