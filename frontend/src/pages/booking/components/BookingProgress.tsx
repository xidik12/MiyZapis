import React from 'react';
import { CheckIcon } from '@/components/icons';
import type { BookingStep } from '../types';

interface BookingProgressProps {
  steps: BookingStep[];
  currentStep: number;
}

const BookingProgress: React.FC<BookingProgressProps> = ({ steps, currentStep }) => {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center justify-between overflow-x-auto pb-2 px-1">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center min-w-0">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0 transition-colors duration-200 ${
                  index < currentStep
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/30'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {index < currentStep ? (
                  <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  index + 1
                )}
              </div>
              <p
                className={`text-xs sm:text-sm mt-1 whitespace-nowrap ${
                  index < currentStep
                    ? 'text-green-600 dark:text-green-400 font-medium'
                    : index === currentStep
                    ? 'text-primary-600 dark:text-primary-400 font-bold'
                    : 'text-gray-400 dark:text-gray-500 font-medium'
                }`}
              >
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-6 sm:w-10 md:w-16 h-0.5 mx-1 sm:mx-2 md:mx-3 flex-shrink-0 mt-[-12px] sm:mt-[-14px] transition-colors duration-200 ${
                  index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingProgress;
