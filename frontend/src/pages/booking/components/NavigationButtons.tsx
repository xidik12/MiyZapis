import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { BookingStep } from '../types';

interface NavigationButtonsProps {
  steps: BookingStep[];
  currentStep: number;
  paymentLoading: boolean;
  selectedDate: Date | null;
  selectedTime: string;
  service: Record<string, unknown>;
  paymentResult: Record<string, unknown>;
  onNext: () => void;
  onPrev: () => void;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  steps,
  currentStep,
  paymentLoading,
  selectedDate,
  selectedTime,
  service,
  paymentResult,
  onNext,
  onPrev,
}) => {
  const { t } = useLanguage();

  if (currentStep >= steps.length - 1) return null;

  const currentStepId = steps[currentStep]?.id;

  // Helper text for disabled Next button
  let helperText = '';
  if (currentStepId === 'datetime' && (!selectedDate || !selectedTime)) {
    if (!selectedDate) helperText = t('booking.selectDateFirst') || 'Please select a date first';
    else if (!selectedTime) helperText = t('booking.selectTimeFirst') || 'Please select a time slot';
  } else if (currentStepId === 'payment' && (!paymentResult || (paymentResult.requiresPayment && paymentResult.status !== 'COMPLETED'))) {
    helperText = t('booking.completePaymentFirst') || 'Please complete payment to continue';
  }

  const isNextDisabled =
    paymentLoading ||
    (currentStepId === 'datetime' && (!selectedDate || !selectedTime)) ||
    (currentStepId === 'details' && !service) ||
    (currentStepId === 'payment' && (!paymentResult || (paymentResult.requiresPayment && paymentResult.status !== 'COMPLETED')));

  return (
    <div className="pb-safe-bottom">
      {helperText && (
        <div className="mb-3 text-center">
          <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl inline-block">
            {helperText}
          </p>
        </div>
      )}

      <div className="flex justify-between gap-3 sm:gap-4">
        <button
          onClick={onPrev}
          disabled={currentStep === 0 || paymentLoading}
          className={`flex items-center px-3 sm:px-4 md:px-6 py-3 sm:py-2 rounded-xl transition-colors flex-shrink-0 mobile-touch-target ${
            currentStep === 0 || paymentLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95'
          }`}
        >
          <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
          <span className="text-sm sm:text-base">{t('navigation.prev') || 'Prev'}</span>
        </button>

        <button
          onClick={onNext}
          disabled={isNextDisabled}
          className="flex items-center px-3 sm:px-4 md:px-6 py-3 sm:py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0 mobile-touch-target active:scale-95"
        >
          {paymentLoading && (
            <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span className="text-sm sm:text-base">
            {paymentLoading ? (t('booking.processing') || 'Processing...') : (t('navigation.next') || 'Next')}
          </span>
          {!paymentLoading && <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />}
        </button>
      </div>
    </div>
  );
};

export default NavigationButtons;
