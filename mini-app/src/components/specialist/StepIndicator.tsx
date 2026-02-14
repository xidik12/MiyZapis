import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const isActive = i === currentStep;
        const isCompleted = i < currentStep;

        return (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              isActive
                ? 'w-3 h-3 bg-accent-primary'
                : isCompleted
                ? 'w-2 h-2 bg-accent-primary/50'
                : 'w-2 h-2 bg-text-muted/30'
            }`}
          />
        );
      })}
    </div>
  );
};
