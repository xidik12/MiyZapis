import React from 'react';
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
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0 ${
                index <= currentStep
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {index + 1}
            </div>
            <div className="ml-2 sm:ml-3 hidden sm:block">
              <p
                className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                  index <= currentStep
                    ? 'text-primary-600'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-4 sm:w-8 md:w-12 h-0.5 mx-1 sm:mx-2 md:mx-4 flex-shrink-0 ${
                  index < currentStep
                    ? 'bg-primary-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      {/* Mobile step indicator */}
      <div className="sm:hidden mt-2 text-center">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
        </p>
      </div>
    </div>
  );
};

export default BookingProgress;
