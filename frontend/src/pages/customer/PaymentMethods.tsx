import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { PaymentMethod } from '../../types';
import { PaymentMethodsService } from '../../services/paymentMethods';
import { fileUploadService } from '../../services/fileUpload.service';
import { toast } from 'react-toastify';
import { 
  CreditCardIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
} from '@/components/icons';

const PaymentMethods: React.FC = () => {
  const { t } = useLanguage();
  const currentUser = useAppSelector(selectUser);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<'card' | 'aba' | 'khqr'>('card');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

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

  useEffect(() => {
    if (!showAddModal) {
      setPaymentType('card');
      setQrFile(null);
      setQrPreview(null);
    }
  }, [showAddModal]);

  useEffect(() => {
    return () => {
      if (qrPreview) {
        URL.revokeObjectURL(qrPreview);
      }
    };
  }, [qrPreview]);

  const handleAddPaymentMethod = () => {
    setShowAddModal(true);
  };

  const handleSavePaymentMethod = async (paymentData: {
    type: 'card' | 'aba' | 'khqr';
    name?: string;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    accountName?: string;
    accountNumber?: string;
    qrFile?: File | null;
  }) => {
    try {
      setLoading(true);

      let payload: Parameters<typeof PaymentMethodsService.addPaymentMethod>[0];
      if (paymentData.type === 'card') {
        const brand = paymentData.name?.toLowerCase() || '';
        payload = {
          type: 'CARD',
          cardLast4: paymentData.last4 || '',
          cardBrand: brand.includes('visa') ? 'visa' : brand.includes('master') ? 'mastercard' : 'card',
          cardExpMonth: paymentData.expiryMonth,
          cardExpYear: paymentData.expiryYear,
          nickname: paymentData.name,
        };
      } else {
        let qrImageUrl: string | undefined;
        if (paymentData.qrFile) {
          const uploaded = await fileUploadService.uploadFile(paymentData.qrFile, {
            type: 'document',
            maxSize: 5 * 1024 * 1024,
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
          });
          qrImageUrl = uploaded.url;
        }

        const bankName = paymentData.type === 'aba' ? 'ABA' : 'KHQR';
        payload = {
          type: 'BANK_TRANSFER',
          bankName,
          accountName: paymentData.accountName,
          accountNumber: paymentData.accountNumber,
          qrImageUrl,
          nickname: paymentData.accountName || `${bankName} Account`,
        };
      }

      const newMethod = await PaymentMethodsService.addPaymentMethod(payload);
      setPaymentMethods(prev => [...prev, newMethod]);
      setShowAddModal(false);
      toast.success(t('payments.addSuccess') || 'Payment method added successfully');
    } catch (error) {
      console.error('Failed to add payment method:', error);
      toast.error(t('payments.addError') || 'Failed to add payment method');
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
      const updatedMethod = await PaymentMethodsService.setDefaultPaymentMethod(id);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('payments.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('payments.subtitle')}
          </p>
        </div>

        {/* Payment Methods Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-white/20 dark:border-gray-700/50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {t('payments.yourMethods')}
              </h2>
              <button 
                onClick={handleAddPaymentMethod}
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {t('payment.addPaymentMethod')}
              </button>
            </div>

            <div className="space-y-4">
              {paymentMethods.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCardIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {t('payments.emptyTitle')}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    {t('payments.emptyDescription')}
                  </p>
                  <button 
                    onClick={handleAddPaymentMethod}
                    className="bg-primary-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors flex items-center mx-auto"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    {t('payments.emptyCta')}
                  </button>
                </div>
              ) : (
                paymentMethods.map((method) => {
                  const methodType = (method.type || '').toLowerCase();
                  const isCard = methodType.includes('card');
                  const bankLabel = method.bankName || (methodType.includes('khqr') ? 'KHQR' : methodType.includes('aba') ? 'ABA' : 'Bank');
                  const displayName = method.nickname || (isCard ? `${method.cardBrand || 'Card'} •••• ${method.cardLast4 || ''}` : `${bankLabel} Account`);
                  const accountSuffix = t('payments.accountSuffix');
                  const detailLine = isCard
                    ? `**** **** **** ${method.cardLast4 || ''}${method.cardExpMonth && method.cardExpYear ? ` • ${method.cardExpMonth.toString().padStart(2, '0')}/${method.cardExpYear}` : ''}`
                    : `${accountSuffix} ${method.accountNumber?.slice(-4) || ''}`;

                  return (
                    <div key={method.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`p-3 rounded-lg mr-4 ${
                          isCard ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' :
                          'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400'
                        }`}>
                          <CreditCardIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{displayName}</p>
                            {method.isDefault && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                {t('payments.default')}
                              </span>
                            )}
                            {method.isActive && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                {t('payments.active')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{detailLine}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {method.qrImageUrl && (
                          <img
                            src={method.qrImageUrl}
                            alt={`${bankLabel} QR`}
                            className="h-10 w-10 rounded-md object-cover border border-gray-200 dark:border-gray-600"
                          />
                        )}
                        {!method.isDefault && (
                          <button 
                            onClick={() => handleSetDefault(method.id)}
                            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                          >
                            {t('payments.makeDefault')}
                          </button>
                        )}
                        <button className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium">
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
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {t('payments.securityTitle')}
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                {t('payments.securityDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              {t('payment.addPaymentMethod')}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              if (paymentType === 'card') {
                handleSavePaymentMethod({
                  type: 'card',
                  name: String(formData.get('cardName') || ''),
                  last4: formData.get('cardNumber')?.toString().slice(-4) || '',
                  expiryMonth: parseInt(formData.get('expiryMonth')?.toString() || '0'),
                  expiryYear: parseInt(formData.get('expiryYear')?.toString() || '0'),
                });
              } else {
                handleSavePaymentMethod({
                  type: paymentType,
                  accountName: String(formData.get('accountName') || ''),
                  accountNumber: String(formData.get('accountNumber') || ''),
                  qrFile,
                });
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('payments.paymentType')}
                  </label>
                  <select 
                    name="paymentType"
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as 'card' | 'aba' | 'khqr')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="card">{t('payments.bankCard')}</option>
                    <option value="aba">{t('payments.abaBank')}</option>
                    <option value="khqr">{t('payments.khqr')}</option>
                  </select>
                </div>

                {paymentType === 'card' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('payments.cardName')}
                      </label>
                      <input
                        type="text"
                        name="cardName"
                        placeholder={t('payments.cardNamePlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('payments.cardNumber')}
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        placeholder={t('payments.cardNumberPlaceholder')}
                        maxLength={19}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        onChange={(e) => {
                          let value = e.target.value.replace(/\\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                          e.target.value = value;
                        }}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('payments.expiryMonth')}
                        </label>
                        <select
                          name="expiryMonth"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-primary-500 focus:border-primary-500"
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
                          {t('payments.expiryYear')}
                        </label>
                        <select
                          name="expiryYear"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-primary-500 focus:border-primary-500"
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
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('payments.accountName')}
                      </label>
                      <input
                        type="text"
                        name="accountName"
                        placeholder={t('payments.accountNamePlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('payments.accountNumber')}
                      </label>
                      <input
                        type="text"
                        name="accountNumber"
                        placeholder={t('payments.accountNumberPlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('payments.qrImage')}
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative inline-flex rounded-md border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-gray-900">
                          <button
                            type="button"
                            className="flex items-center gap-2 px-3 py-2"
                            tabIndex={-1}
                            aria-hidden="true"
                          >
                            <PhotoIcon className="h-4 w-4" />
                            {t('payments.uploadQr')}
                          </button>
                          <input
                            type="file"
                            name="qrImage"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setQrFile(file);
                              if (qrPreview) {
                                URL.revokeObjectURL(qrPreview);
                              }
                              setQrPreview(file ? URL.createObjectURL(file) : null);
                            }}
                            aria-label={t('payments.uploadQr')}
                            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                            required
                          />
                        </div>
                          {qrPreview && (
                            <img
                              src={qrPreview}
                              alt={t('payments.qrPreviewAlt')}
                              className="h-12 w-12 rounded-md object-cover border border-gray-200 dark:border-gray-600"
                            />
                          )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {t('payments.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {t('payment.addPaymentMethod')}
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
